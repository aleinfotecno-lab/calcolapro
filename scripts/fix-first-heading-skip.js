#!/usr/bin/env node
// Task 1 (parte calcolatori): promuove SOLO il primo <h3> dopo l'<h1> a <h2>,
// quando e' quello che causa il salto H1->H3 (rilevato da check-heading-hierarchy.js).
// Tocca esclusivamente quel tag (apertura+chiusura), preservando attributi/contenuto
// byte per byte. Non tocca file dove il primo heading dopo H1 non e' un h3 (nessun bug).
//
// Uso: node scripts/fix-first-heading-skip.js file1.html file2.html ...

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const files = process.argv.slice(2);
if (!files.length) { console.error('Specifica almeno un file .html'); process.exit(1); }

let changed = 0, skipped = 0;

for (const file of files) {
  const full = path.join(ROOT, file);
  const original = fs.readFileSync(full, 'utf8');
  const html = original.replace(/\r\n/g, '\n');

  const h1Match = /<h1[\s>]/i.exec(html);
  if (!h1Match) { console.log(`${file}: nessun <h1> trovato, salto.`); skipped++; continue; }

  // primo heading h1-h6 dopo l'h1
  const nextHeadingRe = /<h([1-6])(\s[^>]*)?>/gi;
  nextHeadingRe.lastIndex = h1Match.index + 1;
  const next = nextHeadingRe.exec(html);
  if (!next || next[1] !== '3') {
    console.log(`${file}: primo heading dopo H1 non e' un h3 (e' h${next ? next[1] : '?'}), nessun salto da correggere qui. Salto.`);
    skipped++;
    continue;
  }

  const openStart = next.index;
  const openTagFull = next[0]; // <h3 ...>
  const closeRe = /<\/h3>/i;
  closeRe.lastIndex = openStart + openTagFull.length;
  const closeMatch = closeRe.exec(html.slice(openStart + openTagFull.length));
  if (!closeMatch) { console.log(`${file}: chiusura </h3> non trovata dopo il tag di apertura, salto per sicurezza.`); skipped++; continue; }

  const newOpenTag = openTagFull.replace(/^<h3/i, '<h2');
  const before = html.slice(0, openStart);
  const afterOpen = html.slice(openStart + openTagFull.length, openStart + openTagFull.length + closeMatch.index);
  const afterClose = html.slice(openStart + openTagFull.length + closeMatch.index + closeMatch[0].length);

  const newHtml = before + newOpenTag + afterOpen + '</h2>' + afterClose;
  if (newHtml === html) { console.log(`${file}: nessuna modifica effettiva, salto.`); skipped++; continue; }

  const out = newHtml.replace(/\n/g, '\r\n');
  fs.writeFileSync(full, out, 'utf8');
  const preview = afterOpen.replace(/<[^>]+>/g, '').trim().slice(0, 50);
  console.log(`${file}: promosso h3->h2 "${preview}"`);
  changed++;
}

console.log(`\n${changed} file modificati, ${skipped} saltati.`);
