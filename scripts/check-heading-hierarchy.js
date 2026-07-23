#!/usr/bin/env node
// Verifica la gerarchia H1-H6 di ogni pagina: nessun salto di livello (es. H1->H3
// senza H2 in mezzo). Stessa logica della regola "heading-order" di axe-core:
// confronta ogni heading col precedente in ordine di documento (non un modello
// a stack) — si può sempre risalire a un livello più alto, mai saltare in giù.
//
// Uso:
//   node scripts/check-heading-hierarchy.js                 -> tutte le pagine .html in root
//   node scripts/check-heading-hierarchy.js bmi.html mutuo.html
//
// Esclude <script>/<style> (evita falsi positivi da stringhe JS/selettori CSS).
// Exit 1 se trova salti.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_FILES = new Set(['404.html']);

function targetFiles() {
  if (process.argv.length > 2) return process.argv.slice(2);
  return fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !SKIP_FILES.has(f))
    .sort();
}

function headingsOf(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const out = [];
  const re = /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(stripped))) {
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const line = stripped.slice(0, m.index).split('\n').length;
    out.push({ level: Number(m[1]), text, line });
  }
  return out;
}

let totalIssues = 0;
const report = [];

for (const file of targetFiles()) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) { console.error(`${file}: non trovato`); process.exitCode = 1; continue; }
  const html = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
  const headings = headingsOf(html);
  const issues = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1], cur = headings[i];
    if (cur.level > prev.level + 1) {
      issues.push(`  riga ${cur.line}: h${prev.level} "${prev.text}" -> h${cur.level} "${cur.text}" (salta h${prev.level + 1})`);
    }
  }
  if (issues.length) {
    totalIssues += issues.length;
    report.push(`${file} (${headings.length} heading, ${issues.length} salto/i):\n${issues.join('\n')}`);
  }
}

if (report.length) {
  console.log(report.join('\n\n'));
  console.log(`\n${totalIssues} salto/i di livello in ${report.length} pagina/e.`);
  process.exitCode = 1;
} else {
  console.log(`OK — nessun salto di livello heading in ${targetFiles().length} pagine.`);
}
