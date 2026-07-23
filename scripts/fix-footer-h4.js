#!/usr/bin/env node
// Task 1 (parte editoriale): il footer condiviso (colonne "Calcolatori"/"Guide"/
// "Informazioni") usa <h4>, ma su 7 pagine editoriali l'ultimo heading di pagina
// prima del footer e' un H2 -> salta H3. Il footer e' lo stesso componente ovunque,
// quindi si corregge nel componente (h4->h3) su tutte le pagine che lo usano:
// non crea nuovi salti sulle pagine calcolatore (li' l'heading precedente e' gia'
// h3 "Strumenti correlati", h3->h3 non e' un salto).
//
// Uso: node scripts/fix-footer-h4.js   (auto-scansiona tutte le .html in root)

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['404.html']);

const LABELS = ['Calcolatori', 'Guide', 'Informazioni'];
let filesChanged = 0, totalTags = 0;

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !SKIP.has(f));

for (const file of files) {
  const full = path.join(ROOT, file);
  const original = fs.readFileSync(full, 'utf8');
  const html = original.replace(/\r\n/g, '\n');
  let newHtml = html;
  let count = 0;
  for (const label of LABELS) {
    const re = new RegExp(`<h4([^>]*)>(${label})<\\/h4>`, 'g');
    newHtml = newHtml.replace(re, (m, attrs) => { count++; return `<h3${attrs}>${label}</h3>`; });
  }
  if (count === 0) continue;
  if (count !== LABELS.length) {
    console.log(`${file}: ATTENZIONE trovate solo ${count}/3 etichette, verificare a mano.`);
  }
  fs.writeFileSync(full, newHtml.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`${file}: ${count} h4->h3`);
  filesChanged++;
  totalTags += count;
}

console.log(`\n${filesChanged} file modificati, ${totalTags} tag h4->h3 in totale.`);
