import { test, expect } from '@playwright/test';

// Smoke test: ogni pagina indicizzabile deve caricarsi senza errori JS/console.
// tfr.html e calcolatore-prezzo-orario-freelance.html sono redirect noindex:
// esclusi da questa lista e coperti dal test dedicato "Redirect legacy …" in fondo.
const allPages = [
  '/', '/index.html', '/mutuo.html', '/lordonetto.html', '/pensione.html',
  '/iva.html', '/bmi.html', '/tdee.html', '/affitto.html',
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
  '/calcolo-quattordicesima-netta.html',
  '/calcolo-assegno-unico.html',
  '/calcolo-cassa-integrazione.html',
  // Hub categoria
  '/categoria-casa-mutuo.html', '/categoria-freelance.html',
  '/categoria-lavoro-dipendente.html', '/categoria-risparmio-investimenti.html',
  '/categoria-tasse-fisco.html', '/categoria-utilita-quotidiane.html',
  // Guide
  '/guida-730-precompilato-2026.html', '/guida-bonus-casa-2026.html',
  '/guida-cedolare-secca-affitti.html', '/guida-comprare-affittare-casa.html',
  '/guida-conto-deposito-2026.html', '/guida-deficit-calorico-dimagrire.html',
  '/guida-investire-10000-euro.html', '/guida-mutuo-fisso-variabile.html',
  '/guida-pensione-anticipata-2026.html', '/guida-regime-forfettario.html',
  '/guida-stipendio-netto-lordo.html',
  // Pagine informative / utility
  '/about.html', '/come-funziona.html', '/contatti.html',
  '/disclaimer.html', '/glossario-finanziario.html',
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

// Test funzionale Assegno Unico
test('Calcolatore Assegno Unico - calcolo importo', async ({ page }) => {
  await page.goto('/calcolo-assegno-unico.html');
  await page.fill('#isee', '25000');
  await page.selectOption('#figliMinorenni', '2');
  await page.click('button[onclick="calcola()"]');
  const result = page.locator('#result');
  await expect(result).toBeVisible({ timeout: 3000 });
  const totale = await page.locator('#totaleOut').textContent();
  expect(totale).toContain('€');
  expect(totale).not.toContain('—');
});

// Test funzionale Cassa Integrazione
test('Calcolatore Cassa Integrazione - calcolo importo netto', async ({ page }) => {
  await page.goto('/calcolo-cassa-integrazione.html');
  await page.fill('#retribuzione', '1800');
  await page.fill('#percentuale', '100');
  await page.click('button[onclick="calcola()"]');
  const result = page.locator('#result');
  await expect(result).toBeVisible({ timeout: 3000 });
  const netto = await page.locator('#nettoOut').textContent();
  expect(netto).toContain('€');
  expect(netto).not.toContain('—');
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

// Redirect noindex (meta refresh) → gli slug legacy portano alla pagina canonica.
// Esclusi dallo smoke test generico perché il refresh cambia URL dopo il load.
// `.html` è opzionale: `npx serve` (locale) usa clean URL e serve /freelance,
// mentre GitHub Pages mantiene /freelance.html.
const legacyRedirects = [
  { from: '/tfr.html', to: /\/calcolo-tfr-liquidazione(\.html)?$/ },
  { from: '/calcolatore-prezzo-orario-freelance.html', to: /\/freelance(\.html)?$/ },
];

for (const { from, to } of legacyRedirects) {
  test(`Redirect legacy ${from}`, async ({ page }) => {
    await page.goto(from);
    await page.waitForURL(to, { timeout: 5000 });
    await expect(page).toHaveTitle(/.+/);
  });
}
