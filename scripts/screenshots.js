/**
 * Screenshot automatici di tutte le pagine HTML.
 * Uso: npm run screenshots
 * Output: screenshots/ (desktop + mobile)
 */
import { chromium } from '@playwright/test';
import { readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT = join(ROOT, 'screenshots');

mkdirSync(join(OUT, 'desktop'), { recursive: true });
mkdirSync(join(OUT, 'mobile'), { recursive: true });

const pages = readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .map(f => ({ name: f.replace('.html', ''), path: `/${f}` }));

(async () => {
  const browser = await chromium.launch();

  for (const { name, path } of pages) {
    // Desktop
    const desktop = await browser.newPage();
    await desktop.setViewportSize({ width: 1280, height: 800 });
    await desktop.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await desktop.screenshot({ path: join(OUT, 'desktop', `${name}.png`), fullPage: true });
    await desktop.close();

    // Mobile
    const mobile = await browser.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await mobile.screenshot({ path: join(OUT, 'mobile', `${name}.png`), fullPage: true });
    await mobile.close();

    console.log(`📸 ${name}`);
  }

  await browser.close();
  console.log(`\nScreenshot salvati in: screenshots/desktop/ e screenshots/mobile/`);
})();
