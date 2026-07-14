import { test, expect } from '@playwright/test';

// Tutte le pagine devono caricarsi senza errori
const allPages = [
  '/', '/index.html', '/mutuo.html', '/lordonetto.html', '/pensione.html',
  '/iva.html', '/tfr.html', '/bmi.html', '/tdee.html', '/affitto.html',
  '/calcolo-imu.html', '/calcolo-isee.html', '/calcolo-cedolare-secca.html',
  '/calcolo-ferie-permessi.html', '/calcolo-straordinari.html',
  '/calcolatore-prestito-personale.html', '/calcolatore-risparmio.html',
  '/calcolatore-interessi-conto-deposito.html',
  '/calcolo-spese-acquisto-casa.html', '/chilometrico.html',
  '/partitaiva.html', '/freelance.html',
  // Calcolatori aggiunti nelle sessioni successive
  '/calcolo-naspi.html', '/calcolo-malattia-inps.html', '/calcolo-maternita-inps.html',
  '/calcolo-bollo-auto.html', '/calcolo-costo-lavoro.html', '/calcolo-interessi-mora.html',
  '/calcolo-prestazione-occasionale.html', '/calcolo-preavviso.html',
  '/calcolo-fondo-pensione.html', '/calcolo-plusvalenza-immobiliare.html',
  '/calcolo-locazioni-brevi.html', '/calcolo-detrazioni-730.html',
  '/divisione-conto.html', '/calcolatore-percentuale.html',
  '/calcolo-eta.html', '/calcolo-tfr-liquidazione.html',
  '/calcolo-buoni-fruttiferi-postali.html',
  '/categoria-freelance.html',
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
  // Evita che l'overlay exit-intent (mouseleave/scroll-up) intercetti il click sul bottone
  await page.addInitScript(() => sessionStorage.setItem('exitShown', '1'));
  await page.goto('/mutuo.html');
  await page.fill('#importo', '200000');
  await page.click('button[onclick="calcola()"]');
  const result = page.locator('#result');
  await expect(result).toBeVisible({ timeout: 3000 });
});

// Test funzionale BFP
test('Calcolatore BFP - calcolo rendimento netto', async ({ page }) => {
  await page.goto('/calcolo-buoni-fruttiferi-postali.html');
  await page.fill('#capitale', '10000');
  await page.fill('#tasso', '3');
  await page.fill('#anni', '3');
  await page.click('button[onclick="calcola()"]');
  const result = page.locator('#result');
  await expect(result).toBeVisible({ timeout: 3000 });
  const netti = await page.locator('#interessiNettiOut').textContent();
  expect(netti).toContain('€');
  expect(netti).not.toContain('—');
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
