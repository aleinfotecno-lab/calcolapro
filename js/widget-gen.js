/* Generatore del codice di incorporamento per widget.html.

   Produce tre pezzi che vanno insieme: l'iframe, un ascoltatore di postMessage
   che ne adatta l'altezza, e la riga di attribuzione. L'attribuzione sta nel
   markup del sito ospite e non dentro l'iframe: un link chiuso in un iframe non
   e' un link verso di noi per nessun motore di ricerca, e' solo una cosa che il
   lettore puo' cliccare. Fuori invece e' un rimando vero, ed e' l'unica cosa che
   ci ripaga di tenere aggiornato il calcolo.

   L'ascoltatore riconosce l'iframe da cui arriva il messaggio confrontando
   contentWindow con event.source, non con un id cucito nell'URL: cosi' una
   pagina che incorpora due widget li ridimensiona correttamente entrambi. */
(function () {
  'use strict';

  var selReg  = document.getElementById('genRegione');
  var selMens = document.getElementById('genMens');
  var out     = document.getElementById('genCodice');
  var btn     = document.getElementById('genCopia');
  var esito   = document.getElementById('genEsito');
  var demo    = document.getElementById('demoFrame');
  if (!selReg || !out) return;

  // Le regioni arrivano dal modulo di calcolo condiviso: l'elenco esiste in un
  // posto solo, quello da cui dipende anche il numero.
  var REG = window.CalcolaPro && window.CalcolaPro.REGIONI;
  if (REG) {
    Object.keys(REG).sort(function (a, b) { return REG[a].n.localeCompare(REG[b].n, 'it'); })
      .forEach(function (k) {
        var o = document.createElement('option');
        o.value = k; o.textContent = REG[k].n;
        if (k === 'lombardia') o.selected = true;
        selReg.appendChild(o);
      });
  }

  function codice(regione, mensilita) {
    return [
      '<!-- Calcolatore stipendio netto - CalcolaPro -->',
      '<iframe src="https://calcolapro.it/embed.html?r=' + regione + '&m=' + mensilita + '"',
      '        title="Calcolo dello stipendio netto 2026"',
      '        loading="lazy"',
      // 930px e' l'altezza misurata a 390px di larghezza, dove i campi si impilano
      // ed e' quindi il caso piu' alto. Con lo script scende subito a ~810 su
      // desktop; senza, e' l'unica misura che non taglia il contenuto da nessuna parte.
      '        style="width:100%;max-width:560px;border:0;height:930px"></iframe>',
      '<script>',
      'window.addEventListener("message", function (e) {',
      '  if (e.origin !== "https://calcolapro.it") return;',
      '  if (!e.data || e.data.type !== "calcolapro:altezza") return;',
      '  var f = document.querySelectorAll(\'iframe[src*="calcolapro.it/embed.html"]\');',
      '  for (var i = 0; i < f.length; i++) {',
      '    if (f[i].contentWindow === e.source) { f[i].style.height = e.data.altezza + "px"; break; }',
      '  }',
      '});',
      '<\/script>',
      '<p style="font-size:13px;margin-top:6px">Calcolatore fornito da <a href="https://calcolapro.it/lordonetto.html">CalcolaPro</a></p>'
    ].join('\n');
  }

  function aggiorna() {
    var r = selReg.value || 'lombardia';
    var m = selMens.value || '13';
    out.value = codice(r, m);
    // L'anteprima segue le stesse scelte, altrimenti si copia un codice che
    // produce qualcosa di diverso da quello che si e' appena guardato.
    if (demo) demo.src = 'embed.html?r=' + r + '&m=' + m;
    if (esito) esito.textContent = '';
  }

  selReg.addEventListener('change', aggiorna);
  selMens.addEventListener('change', aggiorna);

  if (btn) {
    btn.addEventListener('click', function () {
      function riuscito() { esito.textContent = 'Copiato.'; }
      function fallito()  { out.select(); esito.textContent = 'Premi Ctrl+C per copiare.'; }
      // navigator.clipboard non esiste fuori da un contesto sicuro e puo' essere
      // negato dal browser: il ripiego seleziona il testo, che e' comunque utile.
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.value).then(riuscito, fallito);
      } else {
        fallito();
      }
    });
  }

  // Adatta anche l'anteprima di questa pagina, che e' un widget come gli altri.
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'calcolapro:altezza') return;
    if (demo && demo.contentWindow === e.source) demo.style.height = e.data.altezza + 'px';
  });

  aggiorna();
})();
