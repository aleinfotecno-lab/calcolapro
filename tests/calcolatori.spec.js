import { test, expect } from '@playwright/test';

// Tutte le pagine devono caricarsi senza errori
const allPages = [
  '/', '/index.html', '/mutuo.html', '/lordonetto.html', '/pensione.html',
  '/iva.html', '/tfr.html', '/bmi.html', '/tdee.html', '/affitto.html',
  '/calcolo-imu.html', '/calcolo-isee.html', '/calcolo-cedolare-secca.html',
  '/calcolo-ferie-permessi.html', '/calcolo-straordinari.html',
  '/calcolatore-prestito-personale.html', '/calcolatore-risparmio.html',
  '/calcolatore-interessi-conto-deposito.html',
  '/calcolatore-prezzo-orario-freelance.html',
  '/calcolo-spese-acquisto-casa.html', '/chilometrico.html',
  '/partitaiva.html', '/freelance.html',
];

for (const path of allPages) {
  test(`Pagina carica correttamente: ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(path);
    await expect(page).toHaveTitle(/.+/);
    expect(errors, `Errori JS su ${path}: ${errors.join(', ')}`).toHaveLength(0);
  });
}

// Test funzionali calcolatore mutuo
test('Calcolatore mutuo - calcolo rata', async ({ page }) => {
  await page.goto('/mutuo.html');
  await page.fill('#importo, [name="importo"], input[type="number"]:first-of-type', '200000');
  const btn = page.locator('button[type="submit"], button:has-text("Calcola"), input[type="submit"]').first();
  await btn.click();
  const result = page.locator('#risultato, .risultato, [id*="result"], [class*="result"]').first();
  await expect(result).toBeVisible({ timeout: 3000 });
});

// Test cookie banner
test('Cookie banner visibile alla prima visita', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: undefined });
  const page = await ctx.newPage();
  await page.goto('/');
  const banner = page.locator('#cookie-banner, .cookie-banner, [id*="cookie"], [class*="cookie"]').first();
  await expect(banner).toBeVisible({ timeout: 5000 });
  await ctx.close();
});

// Test pagine legali raggiungibili
test('Pagine legali raggiungibili', async ({ page }) => {
  for (const path of ['/privacy.html', '/cookie.html', '/termini.html']) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
  }
});
