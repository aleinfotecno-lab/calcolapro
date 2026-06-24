/**
 * Pre-deploy check: verifica link rotti, errori JS e pagine raggiungibili.
 * Uso: npm run check
 */
import { chromium } from '@playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3000';

const pages = readdirSync(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
  .filter(f => f.endsWith('.html'))
  .map(f => `/${f}`);

const results = { ok: [], warnings: [], errors: [] };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  for (const path of pages) {
    const page = await context.newPage();
    const jsErrors = [];
    const failedRequests = [];

    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('requestfailed', req => failedRequests.push(req.url()));

    try {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 10000 });
      const status = res?.status();

      if (status !== 200) {
        results.errors.push({ path, issue: `HTTP ${status}` });
      } else if (jsErrors.length > 0) {
        results.warnings.push({ path, issue: `JS errors: ${jsErrors.join(' | ')}` });
      } else if (failedRequests.length > 0) {
        results.warnings.push({ path, issue: `Failed requests: ${failedRequests.length}` });
      } else {
        results.ok.push(path);
      }
    } catch (e) {
      results.errors.push({ path, issue: e.message });
    }

    await page.close();
  }

  await browser.close();

  console.log('\n=== PRE-DEPLOY CHECK ===\n');
  console.log(`✅ OK (${results.ok.length}):`);
  results.ok.forEach(p => console.log(`   ${p}`));

  if (results.warnings.length) {
    console.log(`\n⚠️  AVVISI (${results.warnings.length}):`);
    results.warnings.forEach(w => console.log(`   ${w.path} → ${w.issue}`));
  }

  if (results.errors.length) {
    console.log(`\n❌ ERRORI (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`   ${e.path} → ${e.issue}`));
    process.exit(1);
  }

  console.log('\n✅ Tutto ok. Pronto per il deploy.\n');
})();
