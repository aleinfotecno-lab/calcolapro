#!/usr/bin/env node
// Task 2a: rende #crossLinks sempre visibile (rimuove style="display:none;")
// sulle pagine che non hanno gia' una related-tools-section statica propria.
// Markup verificato byte-identico su tutte le pagine target:
//   <div class="cross-links" id="crossLinks" style="display:none;">
//
// Uso: node scripts/show-cross-links.js file1.html file2.html ...

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const OLD = '<div class="cross-links" id="crossLinks" style="display:none;">';
const NEW = '<div class="cross-links" id="crossLinks">';

const files = process.argv.slice(2);
if (!files.length) { console.error('Specifica almeno un file .html'); process.exit(1); }

let changed = 0;
for (const file of files) {
  const full = path.join(ROOT, file);
  const original = fs.readFileSync(full, 'utf8');
  const html = original.replace(/\r\n/g, '\n');
  const count = html.split(OLD).length - 1;
  if (count === 0) { console.log(`${file}: pattern non trovato, salto.`); continue; }
  if (count > 1) { console.log(`${file}: ATTENZIONE ${count} occorrenze, salto per sicurezza.`); continue; }
  const newHtml = html.replace(OLD, NEW);
  fs.writeFileSync(full, newHtml.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`${file}: crossLinks reso visibile.`);
  changed++;
}
console.log(`\n${changed}/${files.length} file modificati.`);
