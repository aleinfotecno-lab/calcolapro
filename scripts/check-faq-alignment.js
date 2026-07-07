#!/usr/bin/env node
// Verifica allineamento FAQPage JSON-LD <-> FAQ visibili (.faq-question) e validità
// di TUTTI i blocchi JSON-LD delle pagine HTML.
//
// Uso:
//   node scripts/check-faq-alignment.js                  -> tutte le *.html del repo
//   node scripts/check-faq-alignment.js bmi.html ...     -> solo i file indicati
//   node scripts/check-faq-alignment.js --hook           -> modalità hook PostToolUse:
//       legge il JSON dell'evento da stdin, controlla solo il file .html toccato,
//       exit 0 se ok/non pertinente, exit 2 con messaggio su stderr se disallineato
//       (l'exit 2 rimanda il messaggio a Claude senza bloccare l'edit).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Redirect noindex: intenzionalmente senza schema
const SKIP = new Set(['tfr.html', 'calcolatore-prezzo-orario-freelance.html', '404.html']);

function checkFile(file) {
  const problems = [];
  let html;
  try {
    html = fs.readFileSync(file, 'utf8');
  } catch {
    return problems; // file sparito/non leggibile: non è compito nostro
  }
  const name = path.basename(file);
  if (SKIP.has(name)) return problems;

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let faqSchemaCount = null;
  for (const b of blocks) {
    try {
      const j = JSON.parse(b[1]);
      const nodes = Array.isArray(j) ? j : [j];
      for (const node of nodes) {
        if (node['@type'] === 'FAQPage') {
          faqSchemaCount = (node.mainEntity || []).length;
        }
      }
    } catch (e) {
      problems.push(`${name}: JSON-LD INVALIDO (${e.message.slice(0, 80)})`);
    }
  }

  const visible = (html.match(/class="faq-question"/g) || []).length;

  if (faqSchemaCount !== null || visible > 0) {
    if (faqSchemaCount === null && visible > 0) {
      problems.push(`${name}: ${visible} FAQ visibili ma NESSUNO schema FAQPage`);
    } else if (faqSchemaCount !== visible) {
      problems.push(`${name}: FAQPage schema=${faqSchemaCount} vs FAQ visibili=${visible} — DISALLINEATE`);
    }
  }
  return problems;
}

function listAllHtml() {
  return fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !f.startsWith('google'))
    .map(f => path.join(ROOT, f));
}

if (process.argv[2] === '--hook') {
  let input = '';
  process.stdin.on('data', d => (input += d));
  process.stdin.on('end', () => {
    let file;
    try {
      const evt = JSON.parse(input);
      file = evt.tool_input && evt.tool_input.file_path;
    } catch { process.exit(0); }
    if (!file || !file.toLowerCase().endsWith('.html')) process.exit(0);
    if (path.resolve(path.dirname(file)) !== ROOT) process.exit(0); // solo pagine in root del sito
    const problems = checkFile(file);
    if (problems.length) {
      console.error('[check-faq-alignment] ' + problems.join(' | ') +
        ' — riallinea FAQPage JSON-LD e FAQ visibili prima di committare.');
      process.exit(2);
    }
    process.exit(0);
  });
} else {
  const files = process.argv.slice(2).length
    ? process.argv.slice(2).map(f => path.resolve(ROOT, f))
    : listAllHtml();
  let all = [];
  for (const f of files) all = all.concat(checkFile(f));
  if (all.length) {
    console.log(all.join('\n'));
    console.log(`\n${all.length} problema/i su ${files.length} file controllati.`);
    process.exit(1);
  } else {
    console.log(`OK — ${files.length} file controllati, FAQ/schema allineati e JSON-LD validi.`);
  }
}
