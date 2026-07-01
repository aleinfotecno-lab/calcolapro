/**
 * Audit visivo completo — 3 viewport, rilevamento overflow, report problemi.
 * Uso: avvia prima il server (npm run serve) poi: node scripts/visual-audit.js
 * Output: screenshots/audit/{mobile|tablet|desktop}/ + report testuale
 */
import { chromium } from '@playwright/test';
import { readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://localhost:3000';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'screenshots', 'audit');

const VIEWPORTS = [
  { name: 'mobile',   width: 375,  height: 812 },
  { name: 'tablet',   width: 768,  height: 1024 },
  { name: 'desktop',  width: 1440, height: 900 },
];

// Escludi file non-pagina
const EXCLUDE = new Set([
  'google2b74dfe4e26590a9.html',
  'google6e353ac4d003edf5.html',
  'google-site-verification-placeholder.html',
  'calcolatore-prezzo-orario-freelance.html', // redirect noindex
]);

const pages = readdirSync(ROOT)
  .filter(f => f.endsWith('.html') && !EXCLUDE.has(f))
  .sort()
  .map(f => ({ name: f.replace('.html', ''), path: `/${f}` }));

// Aggiunge homepage
pages.unshift({ name: 'index', path: '/' });

async function checkPage(page, url, viewport) {
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500); // attende animazioni CSS

    const result = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const viewW = document.documentElement.clientWidth;
      const hasHorizOverflow = docW > viewW + 2; // tolleranza 2px

      // Trova elementi che escono dal viewport
      const offenders = [];
      if (hasHorizOverflow) {
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > viewW + 5 || r.left < -5)) {
            const style = window.getComputedStyle(el);
            offenders.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              cls: (el.className || '').toString().split(' ').filter(Boolean).slice(0, 3).join('.'),
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
          }
        });
      }

      // Controlla font-size minimo su body
      const bodyFontSize = parseFloat(window.getComputedStyle(document.body).fontSize);

      return {
        hasHorizOverflow,
        scrollWidth: docW,
        clientWidth: viewW,
        overflow: docW - viewW,
        offenders: offenders.slice(0, 5),
        bodyFontSize,
        title: document.title,
      };
    });

    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

(async () => {
  console.log(`\n🔍 CalcolaPro Visual Audit — ${pages.length} pagine × ${VIEWPORTS.length} viewport\n`);
  console.log('='.repeat(65));

  for (const vp of VIEWPORTS) {
    mkdirSync(join(OUT, vp.name), { recursive: true });
  }

  const browser = await chromium.launch();
  const allIssues = []; // { page, viewport, issue, offenders }

  for (const vp of VIEWPORTS) {
    console.log(`\n📱 ${vp.name.toUpperCase()} (${vp.width}px)\n`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.name === 'mobile' ? 2 : 1,
    });
    const page = await context.newPage();

    for (const pg of pages) {
      const result = await checkPage(page, pg.path, vp);
      const issues = [];

      if (!result.ok) {
        issues.push(`ERRORE: ${result.error}`);
      } else {
        if (result.hasHorizOverflow) {
          issues.push(`overflow orizzontale +${result.overflow}px`);
        }
        if (vp.name === 'mobile' && result.bodyFontSize < 14) {
          issues.push(`font piccolo: ${result.bodyFontSize}px`);
        }
      }

      const hasIssues = issues.length > 0;
      const prefix = hasIssues ? '❌' : '✅';
      const label = `${prefix} ${pg.name}`;

      if (hasIssues) {
        console.log(`  ${label}`);
        issues.forEach(i => console.log(`     ↳ ${i}`));
        if (result.offenders?.length > 0) {
          result.offenders.slice(0, 3).forEach(o => {
            const sel = [o.tag, o.id && `#${o.id}`, o.cls && `.${o.cls}`].filter(Boolean).join('');
            console.log(`     ↳ elemento: ${sel} (right: ${o.right}px, width: ${o.width}px)`);
          });
        }
        allIssues.push({ page: pg.name, viewport: vp.name, issues, offenders: result.offenders || [] });
      } else {
        process.stdout.write(`  ${label}\n`);
      }

      // Screenshot sempre (utile per review manuale)
      try {
        await page.screenshot({
          path: join(OUT, vp.name, `${pg.name}.png`),
          fullPage: false,
          clip: { x: 0, y: 0, width: vp.width, height: vp.height },
        });
      } catch (_) {}
    }

    await context.close();
  }

  await browser.close();

  // Riepilogo finale
  console.log('\n' + '='.repeat(65));
  console.log(`\n📊 RIEPILOGO\n`);
  console.log(`   Pagine testate: ${pages.length}`);
  console.log(`   Viewport: ${VIEWPORTS.map(v => v.name).join(', ')}`);

  if (allIssues.length === 0) {
    console.log(`\n   ✅ Nessun problema trovato!`);
  } else {
    console.log(`   ❌ Problemi trovati: ${allIssues.length}\n`);

    // Raggruppa per pagina
    const byPage = {};
    for (const i of allIssues) {
      if (!byPage[i.page]) byPage[i.page] = [];
      byPage[i.page].push(`${i.viewport}: ${i.issues.join(', ')}`);
    }

    console.log('   Pagine con problemi:');
    Object.entries(byPage).forEach(([pg, vps]) => {
      console.log(`   • ${pg}`);
      vps.forEach(v => console.log(`       - ${v}`));
    });
  }

  console.log(`\n   📸 Screenshot salvati in: screenshots/audit/\n`);

  // Salva report JSON
  const reportPath = join(ROOT, 'screenshots', 'audit', 'report.json');
  writeFileSync(reportPath, JSON.stringify({ date: new Date().toISOString(), pages: pages.length, issues: allIssues }, null, 2));
  console.log(`   📄 Report JSON: screenshots/audit/report.json\n`);
})();
