#!/usr/bin/env node
/**
 * Tiene allineato il dateModified dello schema alla data che la pagina mostra al
 * lettore ("Aggiornato il GG/MM/AAAA").
 *
 * La byline e' la fonte, non la data dell'ultimo commit. Non tutti i commit
 * cambiano il contenuto: la ristrutturazione delle affiliazioni ha toccato 55 file
 * senza modificare una parola di quello che si legge, e l'allineamento dello schema
 * FAQ ne ha toccati 23 lasciando invariato il testo visibile. Prendere la data da
 * git direbbe a Google che quelle pagine sono piu' fresche di quanto siano, e
 * contraddirebbe la data stampata sulla pagina stessa.
 *
 * Per le pagine che non mostrano alcuna data (hub di categoria, pagine legali,
 * chi siamo) non c'e' una dichiarazione visibile da rispettare, e si usa la data
 * dell'ultimo commit che ha davvero toccato il contenuto.
 *
 * Restano fuori: index.html, che ha solo un nodo WebSite e dire che e' stato
 * modificato "il sito" non e' cio' che il campo significa; i due redirect noindex;
 * i file di verifica di Search Console.
 *
 * Uso:
 *   node scripts/sync-date-modified.js            # anteprima
 *   node scripts/sync-date-modified.js --scrivi   # applica
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
// Commit che non hanno modificato il contenuto: cambiano quali inserzioni
// compaiono, oppure i soli fine riga.
const COMMIT_NON_CONTENUTO = ['99e0e31', '5432958'];
const ESCLUSI = new Set(['index.html', 'tfr.html', 'calcolatore-prezzo-orario-freelance.html']);
// Nodi che descrivono altro rispetto alla pagina: non e' li' che va la data.
const NON_PRIMARI = new Set(['FAQPage', 'BreadcrumbList', 'Organization', 'WebSite', 'ItemList']);

function ultimoCommitDiContenuto(file) {
  const out = execFileSync('git', ['log', '--format=%h %ad', '--date=format:%Y-%m-%d', '--', file],
    { cwd: ROOT, encoding: 'utf8' }).trim();
  for (const riga of out.split('\n').filter(Boolean)) {
    const [h, d] = riga.trim().split(/\s+/);
    if (!COMMIT_NON_CONTENUTO.includes(h)) return d;
  }
  return null;
}

function dataDaByline(html) {
  const m = html.match(/Aggiornato il (\d{2})\/(\d{2})\/(\d{4})/);
  return m ? m[3] + '-' + m[2] + '-' + m[1] : null;
}

function aggiorna(file, scrivi) {
  const nome = path.basename(file);
  if (ESCLUSI.has(nome) || /^google[0-9a-f]+\.html$/.test(nome)) return { nome, esito: 'escluso di proposito' };

  const originale = fs.readFileSync(file, 'utf8');
  const hadCRLF = /\r\n/.test(originale);
  let t = originale.replace(/\r\n/g, '\n');

  const byline = dataDaByline(t);
  const data = byline || ultimoCommitDiContenuto(nome);
  if (!data) return { nome, esito: 'nessuna data ricavabile' };

  const blocchi = [...t.matchAll(/([ \t]*)<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let scelto = null;
  for (const b of blocchi) {
    let j;
    try { j = JSON.parse(b[2]); } catch { continue; }
    const nodi = (Array.isArray(j) ? j : [j]).flatMap(n => [n, ...(Array.isArray(n['@graph']) ? n['@graph'] : [])]);
    const primario = nodi.find(n => n && n['@type'] && !NON_PRIMARI.has(n['@type']));
    if (primario) { scelto = { b, j, primario }; break; }
  }
  if (!scelto) return { nome, esito: 'nessun nodo adatto a ospitare la data' };

  const prima = scelto.primario.dateModified || null;
  if (prima === data) return { nome, esito: 'gia allineata', data, tipo: scelto.primario['@type'] };
  scelto.primario.dateModified = data;

  const indent = scelto.b[1];
  const json = JSON.stringify(scelto.j, null, 2).split('\n').map(r => indent + r).join('\n');
  t = t.replace(scelto.b[0], indent + '<script type="application/ld+json">\n' + json + '\n' + indent + '</script>');

  for (const b of t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(b[1]); } catch (e) { return { nome, esito: 'JSON-LD non valido dopo la modifica: ' + e.message }; }
  }

  if (scrivi) fs.writeFileSync(file, hadCRLF ? t.replace(/\n/g, '\r\n') : t, 'utf8');
  return { nome, esito: 'ok', prima, data, tipo: scelto.primario['@type'], fonte: byline ? 'byline' : 'git' };
}

const scrivi = process.argv.includes('--scrivi');
const espliciti = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = (espliciti.length ? espliciti : fs.readdirSync(ROOT).filter(f => f.endsWith('.html')))
  .map(f => path.resolve(ROOT, f));

let aggiornate = 0, gia = 0, saltate = 0;
for (const f of files) {
  const r = aggiorna(f, scrivi);
  if (r.esito === 'ok') {
    aggiornate++;
    console.log('  ' + (scrivi ? 'scritta ' : 'da fare ') + r.nome.padEnd(38) + (r.prima ? r.prima + ' -> ' : '(assente) -> ') + r.data + '   ' + r.tipo + ' [' + r.fonte + ']');
  } else if (r.esito === 'gia allineata') { gia++; }
  else { saltate++; console.log('  saltata  ' + r.nome.padEnd(38) + r.esito); }
}
console.log('\n' + aggiornate + ' pagine ' + (scrivi ? 'aggiornate' : 'da aggiornare') + ', ' + gia + ' gia allineate, ' + saltate + ' saltate' +
  (scrivi ? '' : '   (anteprima: aggiungi --scrivi)'));
