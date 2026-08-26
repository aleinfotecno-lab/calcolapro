#!/usr/bin/env node
/**
 * Riallinea il FAQPage JSON-LD al testo delle FAQ VISIBILI.
 *
 * La direzione e' questa e non l'inversa: Google chiede che il markup riporti
 * contenuto effettivamente presente nella pagina, quindi la pagina e' la fonte e
 * lo schema la copia. Un rich result costruito su un testo che nella pagina non
 * c'e' e' esattamente cio' che fa revocare l'idoneita'.
 *
 * Non prova ad accoppiare le domande una a una. Su alcune pagine schema e pagina
 * non contengono le stesse domande riformulate, ma domande proprio diverse, in
 * ordine diverso: qualunque accoppiamento per posizione o per somiglianza
 * finirebbe per abbinare cose sbagliate. L'unica operazione sempre corretta e'
 * RIGENERARE mainEntity dalle FAQ visibili, nell'ordine in cui stanno in pagina.
 *
 * Uso:
 *   node scripts/sync-faq-schema.js                    # anteprima su tutto il sito
 *   node scripts/sync-faq-schema.js --scrivi           # applica
 *   node scripts/sync-faq-schema.js pagina.html --scrivi
 */
const fs = require('fs');
const path = require('path');
// Il riconoscimento delle FAQ visibili e la normalizzazione del testo arrivano dal
// checker: se i due strumenti non concordassero su cosa sia una FAQ visibile,
// l'allineamento non convergerebbe mai.
const { checkTesti, listAllHtml, leggiFaqVisibili } = require('./check-faq-alignment.js');

function faqVisibili(html) {
  return leggiFaqVisibili(html).map(v => ({ d: v.d, r: v.r }));
}

function sincronizza(file, scrivi) {
  const nome = path.basename(file);
  let originale = fs.readFileSync(file, 'utf8');
  const hadCRLF = /\r\n/.test(originale);
  let t = originale.replace(/\r\n/g, '\n');

  const vis = faqVisibili(t);
  if (!vis.length) return { nome, esito: 'nessuna FAQ visibile riconosciuta' };
  if (vis.some(v => !v.d || !v.r)) return { nome, esito: 'FAQ visibile con domanda o risposta vuota: non tocco nulla' };

  const blocchi = [...t.matchAll(/([ \t]*)<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let scelto = null;
  for (const b of blocchi) {
    let j;
    try { j = JSON.parse(b[2]); } catch { continue; }
    const nodi = Array.isArray(j) ? j : [j];
    const tutti = nodi.flatMap(n => [n, ...(Array.isArray(n['@graph']) ? n['@graph'] : [])]);
    if (tutti.some(n => n && n['@type'] === 'FAQPage')) { scelto = { b, j, nodi, tutti }; break; }
  }
  if (!scelto) return { nome, esito: 'nessun FAQPage nello schema' };

  const faqNode = scelto.tutti.find(n => n && n['@type'] === 'FAQPage');
  const prima = (faqNode.mainEntity || []).length;

  faqNode.mainEntity = vis.map(v => ({
    '@type': 'Question',
    name: v.d,
    acceptedAnswer: { '@type': 'Answer', text: v.r },
  }));

  const indent = scelto.b[1];
  const json = JSON.stringify(scelto.j, null, 2).split('\n').map(r => indent + r).join('\n');
  const nuovoBlocco = indent + '<script type="application/ld+json">\n' + json + '\n' + indent + '</script>';
  t = t.replace(scelto.b[0], nuovoBlocco);

  // Non scrivo niente se il risultato non e' valido o non risolve davvero.
  for (const b of [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]) {
    try { JSON.parse(b[1]); } catch (e) { return { nome, esito: 'JSON-LD non valido dopo la riscrittura: ' + e.message }; }
  }

  const tmp = file + '.sync-tmp';
  fs.writeFileSync(tmp, hadCRLF ? t.replace(/\n/g, '\r\n') : t, 'utf8');
  const residui = checkTesti(tmp);
  fs.unlinkSync(tmp);
  if (residui.length) return { nome, esito: 'restano ' + residui.length + ' avvisi dopo la sincronizzazione: non scrivo', dettagli: residui };

  if (scrivi) fs.writeFileSync(file, hadCRLF ? t.replace(/\n/g, '\r\n') : t, 'utf8');
  return { nome, esito: 'ok', prima, dopo: vis.length, scritto: !!scrivi };
}

const args = process.argv.slice(2);
const scrivi = args.includes('--scrivi');
const espliciti = args.filter(a => !a.startsWith('--'));
const files = espliciti.length ? espliciti.map(f => path.resolve(f)) : listAllHtml();

let toccati = 0, saltati = 0;
for (const f of files) {
  if (!checkTesti(f).length) continue;
  const r = sincronizza(f, scrivi);
  if (r.esito === 'ok') {
    toccati++;
    console.log('  ' + (scrivi ? 'allineata' : 'allineabile') + '  ' + r.nome.padEnd(38) + r.prima + ' -> ' + r.dopo + ' FAQ nello schema');
  } else {
    saltati++;
    console.log('  SALTATA    ' + r.nome.padEnd(38) + r.esito);
    (r.dettagli || []).slice(0, 3).forEach(d => console.log('             ' + d));
  }
}
console.log('\n' + toccati + ' pagine ' + (scrivi ? 'allineate' : 'allineabili') + ', ' + saltati + ' saltate' + (scrivi ? '' : '   (anteprima: aggiungi --scrivi per applicare)'));
