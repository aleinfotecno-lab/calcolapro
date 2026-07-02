import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const ROOT = fileURLToPath(new URL('../../../../../../Desktop/siti pubblicati/calcolapro', import.meta.url));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// index.html con menu aperto
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
await page.click('#navToggle');
await page.waitForTimeout(400);
await page.screenshot({ path: join(ROOT, 'screenshots/nav-index.png'), fullPage: false });

// calcolatore con menu aperto
await page.goto('http://localhost:3000/calcolo-isee.html', { waitUntil: 'domcontentloaded' });
await page.click('#navToggle');
await page.waitForTimeout(400);
await page.screenshot({ path: join(ROOT, 'screenshots/nav-calcolatore.png'), fullPage: false });

await browser.close();
console.log('Screenshot salvati');
