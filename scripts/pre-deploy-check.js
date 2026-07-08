/**
 * Pre-deploy check: verifica link rotti, errori JS, allineamento FAQ/schema,
 * coerenza sitemap e pagine raggiungibili.
 * Uso: npm run check
 */
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { checkFile, listAllHtml, SKIP } from './check-faq-alignment.js';

const BASE = 'http://localhost:3000';
const ROOT = fileURLToPath(new URL('..', import.meta.url));

const pages = readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .map(f => `/${f}`);

// === Controlli statici (no server/browser richiesti) ===

const staticResults = { errors: [], warnings: [] };

// A + B: FAQ/schema allineati e JSON-LD valido (riusa scripts/check-faq-alignment.js)
for (const file of listAllHtml()) {
  const problems = checkFile(file);
  for (const problem of problems) {
    staticResults.errors.push({ path: `/${path.basename(file)}`, issue: `[FAQ/Schema] ${problem}` });
  }
}

// C: link interni rotti (avviso, non bloccante)
for (const pagePath of pages) {
  const file = path.join(ROOT, pagePath.slice(1));
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  for (const href of hrefs) {
    if (/^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i.test(href)) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.join(ROOT, clean.replace(/^\//, ''));
    if (!existsSync(target)) {
      staticResults.warnings.push({ path: pagePath, issue: `[Link] href="${href}" → file non trovato` });
    }
  }
}

// D: coerenza sitemap.xml <-> file system
const sitemap = readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const sitemapFiles = new Set(
  locs.map(loc => {
    const rel = loc.replace('https://calcolapro.it/', '').replace('https://calcolapro.it', '');
    return rel === '' ? 'index.html' : rel;
  })
);

for (const rel of sitemapFiles) {
  if (!existsSync(path.join(ROOT, rel))) {
    staticResults.errors.push({ path: '/sitemap.xml', issue: `[Sitemap] <loc> punta a file inesistente: ${rel}` });
  }
}

const SITEMAP_EXCLUDE = new Set([...SKIP, 'index.html']);
for (const pagePath of pages) {
  const name = pagePath.slice(1);
  if (SITEMAP_EXCLUDE.has(name) || name.startsWith('google')) continue;
  if (!sitemapFiles.has(name)) {
    staticResults.warnings.push({ path: pagePath, issue: '[Sitemap] file .html non presente in sitemap.xml' });
  }
}

console.log('\n=== CONTROLLI STATICI (FAQ/schema, link, sitemap) ===\n');
if (staticResults.errors.length) {
  console.log(`❌ ERRORI (${staticResults.errors.length}):`);
  staticResults.errors.forEach(e => console.log(`   ${e.path} → ${e.issue}`));
}
if (staticResults.warnings.length) {
  console.log(`\n⚠️  AVVISI (${staticResults.warnings.length}):`);
  staticResults.warnings.forEach(w => console.log(`   ${w.path} → ${w.issue}`));
}
if (!staticResults.errors.length && !staticResults.warnings.length) {
  console.log('✅ Nessun problema statico rilevato.');
}

// === Controlli browser-based (Playwright) — invariati ===

const results = { ok: [], warnings: [], errors: [] };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  for (const pagePath of pages) {
    const page = await context.newPage();
    const jsErrors = [];
    const failedRequests = [];

    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('requestfailed', req => failedRequests.push(req.url()));

    try {
      const res = await page.goto(`${BASE}${pagePath}`, { waitUntil: 'networkidle', timeout: 10000 });
      const status = res?.status();

      if (status !== 200) {
        results.errors.push({ path: pagePath, issue: `HTTP ${status}` });
      } else if (jsErrors.length > 0) {
        results.warnings.push({ path: pagePath, issue: `JS errors: ${jsErrors.join(' | ')}` });
      } else if (failedRequests.length > 0) {
        results.warnings.push({ path: pagePath, issue: `Failed requests: ${failedRequests.length}` });
      } else {
        results.ok.push(pagePath);
      }
    } catch (e) {
      results.errors.push({ path: pagePath, issue: e.message });
    }

    await page.close();
  }

  await browser.close();

  console.log('\n=== PRE-DEPLOY CHECK (browser) ===\n');
  console.log(`✅ OK (${results.ok.length}):`);
  results.ok.forEach(p => console.log(`   ${p}`));

  if (results.warnings.length) {
    console.log(`\n⚠️  AVVISI (${results.warnings.length}):`);
    results.warnings.forEach(w => console.log(`   ${w.path} → ${w.issue}`));
  }

  if (results.errors.length) {
    console.log(`\n❌ ERRORI (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`   ${e.path} → ${e.issue}`));
  }

  const totalErrors = staticResults.errors.length + results.errors.length;
  if (totalErrors > 0) {
    console.log(`\n❌ Totale errori bloccanti: ${totalErrors} (${staticResults.errors.length} statici + ${results.errors.length} browser). Deploy bloccato.\n`);
    process.exit(1);
  }

  console.log('\n✅ Tutto ok. Pronto per il deploy.\n');
})();
