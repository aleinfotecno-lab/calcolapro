#!/usr/bin/env node
// Verifica allineamento FAQPage JSON-LD <-> FAQ visibili (.faq-question) e validità
// di TUTTI i blocchi JSON-LD delle pagine HTML.
//
// Due livelli di controllo:
//   1. CONTEGGIO + JSON-LD valido  -> errore bloccante (exit 1)
//   2. TESTO delle risposte        -> avviso non bloccante, perché al momento
//      dell'introduzione 27 pagine risultavano già divergenti. Con --strict
//      diventa anch'esso bloccante.
//   Il confronto del testo abbina le domande per contenuto, non per posizione:
//   l'ordine fra schema e pagina differisce legittimamente in diverse pagine.
//
// Uso:
//   node scripts/check-faq-alignment.js                  -> tutte le *.html del repo
//   node scripts/check-faq-alignment.js bmi.html ...     -> solo i file indicati
//   node scripts/check-faq-alignment.js --strict         -> anche il testo è bloccante
//   node scripts/check-faq-alignment.js --hook           -> modalità hook PostToolUse:
//       legge il JSON dell'evento da stdin, controlla solo il file .html toccato,
//       exit 0 se ok/non pertinente, exit 2 con messaggio su stderr se disallineato
//       (l'exit 2 rimanda il messaggio a Claude senza bloccare l'edit).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Redirect noindex: intenzionalmente senza schema
const SKIP = new Set(['tfr.html', 'calcolatore-prezzo-orario-freelance.html', '404.html']);

const ENTITA = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&egrave;': 'è', '&eacute;': 'é', '&agrave;': 'à', '&ograve;': 'ò',
  '&ugrave;': 'ù', '&igrave;': 'ì', '&euro;': '€', '&rarr;': '→', '&times;': '×',
};

// Normalizza per il confronto: via i tag (la copia visibile ne ha, il JSON-LD no),
// entità decodificate, apici tipografici e trattini unificati, spazi collassati.
function norm(s) {
  return String(s)
    // I tag di BLOCCO separano parole e diventano uno spazio; quelli INLINE no.
    // Sostituire ogni tag con uno spazio inseriva un blank prima della
    // punteggiatura ("<strong>3%</strong>," diventava "3% ,") e faceva risultare
    // diverse due frasi che il browser rende identiche: falsi positivi.
    .replace(/<\/?(?:br|p|div|li|ul|ol|table|thead|tbody|tr|td|th|h[1-6]|section|article|blockquote|dl|dt|dd|hr)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, m => (ENTITA[m.toLowerCase()] !== undefined ? ENTITA[m.toLowerCase()] : ' '))
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[▾▸►]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function leggiSchemaFaq(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let faq = null;
  const errori = [];
  for (const b of blocks) {
    try {
      const j = JSON.parse(b[1]);
      const top = Array.isArray(j) ? j : [j];
      const nodes = [];
      for (const t of top) {
        nodes.push(t);
        if (Array.isArray(t['@graph'])) nodes.push(...t['@graph']);
      }
      for (const node of nodes) {
        if (node['@type'] === 'FAQPage') {
          faq = (node.mainEntity || []).map(q => ({
            d: norm(q.name || ''),
            r: norm((q.acceptedAnswer && q.acceptedAnswer.text) || ''),
          }));
        }
      }
    } catch (e) {
      errori.push(e.message.slice(0, 80));
    }
  }
  return { faq, errori };
}

// Coppie domanda/risposta visibili. Copre la variante .faq-item + .faq-question +
// .faq-answer, che è quella dei calcolatori. Gli hub e alcune guide usano markup
// diversi: lì il confronto del testo non viene tentato (e viene dichiarato).
function leggiFaqVisibili(html) {
  const items = [...html.matchAll(/<div class="faq-item"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g)];
  const out = [];
  for (const it of items) {
    const d = /class="faq-question"[^>]*>([\s\S]*?)<\/button>/.exec(it[1]);
    const r = /class="faq-answer"[^>]*>([\s\S]*?)$/.exec(it[1]);
    if (d) out.push({ d: norm(d[1]), r: r ? norm(r[1]) : null });
  }
  return out;
}

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

  const { faq, errori } = leggiSchemaFaq(html);
  errori.forEach(e => problems.push(`${name}: JSON-LD INVALIDO (${e})`));
  const faqSchemaCount = faq === null ? null : faq.length;

  // Il sito usa 4 varianti di markup FAQ, mai combinate nella stessa pagina:
  // .faq-question (bottoni toggle), .faq-q (statico, pagine hub),
  // .faq-item-d (details/summary, homepage), .faq-item semplice con
  // <details><summary> senza classe dedicata (es. come-funziona.html).
  // Si prende il MAX (non la somma) perché .faq-item-d e il 4° pattern
  // wrappano entrambi <summary>: sommarli conterebbe le stesse FAQ due volte.
  const visible = Math.max(
    (html.match(/class="faq-question"/g) || []).length,
    (html.match(/class="faq-q"/g) || []).length,
    (html.match(/class="faq-item-d"/g) || []).length,
    (html.match(/<summary>/g) || []).length
  );

  if (faqSchemaCount !== null || visible > 0) {
    if (faqSchemaCount === null && visible > 0) {
      problems.push(`${name}: ${visible} FAQ visibili ma NESSUNO schema FAQPage`);
    } else if (faqSchemaCount !== visible) {
      problems.push(`${name}: FAQPage schema=${faqSchemaCount} vs FAQ visibili=${visible} — DISALLINEATE`);
    }
  }
  return problems;
}

// Confronto del TESTO. Ritorna [] se allineato o non confrontabile.
function checkTesti(file) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const name = path.basename(file);
  if (SKIP.has(name)) return [];

  const { faq } = leggiSchemaFaq(html);
  if (!faq || !faq.length) return [];
  const vis = leggiFaqVisibili(html);
  if (!vis.length) return []; // markup non coperto: niente falsi allarmi

  const perDomanda = new Map(faq.map(x => [x.d, x.r]));
  const avvisi = [];
  for (const d of faq) {
    if (!vis.some(v => v.d === d.d)) avvisi.push(`${name}: domanda presente solo nello SCHEMA — "${d.d.slice(0, 80)}"`);
  }
  for (const v of vis) {
    if (!perDomanda.has(v.d)) { avvisi.push(`${name}: domanda presente solo nella PAGINA — "${v.d.slice(0, 80)}"`); continue; }
    if (v.r !== null && perDomanda.get(v.d) !== v.r) {
      avvisi.push(`${name}: risposta diversa fra schema e pagina — "${v.d.slice(0, 70)}"`);
    }
  }
  return avvisi;
}

function listAllHtml() {
  return fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !f.startsWith('google'))
    .map(f => path.join(ROOT, f));
}

module.exports = { checkFile, checkTesti, listAllHtml, SKIP };

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv[0] === '--hook') {
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
      const avvisi = checkTesti(file);
      if (problems.length) {
        console.error('[check-faq-alignment] ' + problems.join(' | ') +
          ' — riallinea FAQPage JSON-LD e FAQ visibili prima di committare.' +
          (avvisi.length ? ' Inoltre: ' + avvisi.length + ' testo/i divergente/i.' : ''));
        process.exit(2);
      }
      if (avvisi.length) {
        console.error('[check-faq-alignment] ' + avvisi.join(' | ') +
          ' — il conteggio torna, ma il testo dello schema e quello visibile non coincidono.');
        process.exit(2);
      }
      process.exit(0);
    });
  } else {
    const strict = argv.includes('--strict');
    const paths = argv.filter(a => !a.startsWith('--'));
    const files = paths.length ? paths.map(f => path.resolve(ROOT, f)) : listAllHtml();
    let all = [];
    let avvisi = [];
    for (const f of files) { all = all.concat(checkFile(f)); avvisi = avvisi.concat(checkTesti(f)); }

    if (avvisi.length) {
      const pagine = new Set(avvisi.map(a => a.split(':')[0])).size;
      console.log(`AVVISI — testo schema/pagina divergente: ${avvisi.length} su ${pagine} pagine`);
      avvisi.forEach(a => console.log('  ' + a));
      console.log('');
    }
    if (all.length) {
      console.log(all.join('\n'));
      console.log(`\n${all.length} problema/i su ${files.length} file controllati.`);
      process.exit(1);
    }
    if (strict && avvisi.length) {
      console.log(`--strict: ${avvisi.length} avvisi trattati come errori.`);
      process.exit(1);
    }
    console.log(`OK — ${files.length} file controllati, FAQ/schema allineati e JSON-LD validi.` +
      (avvisi.length ? ` (${avvisi.length} avvisi sul testo, non bloccanti — vedi sopra)` : ''));
  }
}
