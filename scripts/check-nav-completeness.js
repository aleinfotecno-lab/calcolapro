#!/usr/bin/env node
// Verifica completezza del mega-menu di navigazione: ogni pagina calcolatore
// presente in sitemap.xml deve comparire nel mega-menu del file di riferimento
// (il menu è byte-identico su tutte le pagine tranne index.html, quindi ne
// basta uno). Controlla anche che i link del menu puntino a file esistenti.
//
// Uso:
//   node scripts/check-nav-completeness.js               -> riferimento: mutuo.html
//   node scripts/check-nav-completeness.js bmi.html      -> riferimento indicato
//
// Una pagina è "calcolatore" se include shared-calc.css (vale per tutti e soli
// i calcolatori). Exit 1 se manca qualcosa.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Redirect noindex: intenzionalmente fuori dal menu
const SKIP = new Set(['tfr.html', 'calcolatore-prezzo-orario-freelance.html', '404.html']);

const REF = process.argv[2] || 'mutuo.html';

function menuBlock(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
  const start = html.indexOf('<div class="nav-menu-panel"');
  const end = html.indexOf('nav-menu-empty', start);
  if (start === -1 || end === -1) {
    console.error(`${file}: blocco mega-menu (nav-menu-panel...nav-menu-empty) non trovato.`);
    process.exit(1);
  }
  return html.slice(start, end);
}

function sitemapPages() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>\s*https:\/\/calcolapro\.it\/?([^<\s]*)\s*<\/loc>/g)]
    .map(m => m[1] || 'index.html');
}

function isCalculator(file) {
  const full = path.join(ROOT, file);
  if (!file.endsWith('.html') || SKIP.has(file) || !fs.existsSync(full)) return false;
  return fs.readFileSync(full, 'utf8').includes('shared-calc.css');
}

const menu = menuBlock(REF);
const problems = [];

// 1) Ogni calcolatore in sitemap deve essere linkato nel mega-menu
const calculators = sitemapPages().filter(isCalculator);
for (const page of calculators) {
  if (!menu.includes(`href="${page}"`)) {
    problems.push(`${page}: calcolatore in sitemap.xml ma ASSENTE dal mega-menu di ${REF}`);
  }
}

// 2) Ogni link del mega-menu deve puntare a un file esistente
const hrefs = [...menu.matchAll(/href="([^"#]+)"/g)].map(m => m[1]);
for (const href of hrefs) {
  if (/^https?:\/\//.test(href)) continue;
  if (!fs.existsSync(path.join(ROOT, href))) {
    problems.push(`${REF}: il mega-menu linka "${href}" che non esiste`);
  }
}

// 3) Il placeholder "Cerca tra i N calcolatori" deve dire il numero giusto
// (N = link del menu che sono pagine calcolatore; storicamente soggetto a off-by-one)
const menuCalcCount = [...new Set(hrefs)].filter(isCalculator).length;
const ph = menu.match(/Cerca tra i (\d+) calcolatori/);
if (!ph) {
  problems.push(`${REF}: placeholder "Cerca tra i N calcolatori" non trovato nel menu`);
} else if (Number(ph[1]) !== menuCalcCount) {
  problems.push(`${REF}: placeholder dice "${ph[1]} calcolatori" ma il menu ne linka ${menuCalcCount}`);
}

if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} problema/i (${calculators.length} calcolatori in sitemap, ${hrefs.length} link nel menu).`);
  process.exit(1);
} else {
  console.log(`OK — ${calculators.length} calcolatori in sitemap tutti presenti nel mega-menu di ${REF}; ${hrefs.length} link del menu validi.`);
}
