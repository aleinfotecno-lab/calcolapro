/* La banda — le due parti del risultato che il calcolatore non sa costruire
   da solo: la composizione e la norma.

   Si attiva sui box con class="result-card tape". La composizione cerca fra le
   voci del dettaglio quelle che ricompongono il totale e ne fa una barra: sulla
   rata di un mutuo sono capitale e interessi, sull'IMU acconto e saldo. Se
   nessun sottoinsieme torna, la barra non compare: meglio niente che una
   proporzione inventata.

   La norma arriva dall'attributo data-norma del box e finisce in calce alla
   banda, dove uno scontrino stampa i dati fiscali. E' il tratto per cui questo
   sito esiste — ogni numero riconducibile a una fonte — e finora stava sepolto
   in un riquadro a fondo pagina.

   Non tocca nessun calcolo: legge quello che il calcolatore ha gia' scritto. */
(function () {
  'use strict';

  var COLORI = ['#C4351F', '#0E5A54', '#96650A', '#3A4A7A'];

  function numero(testo) {
    var s = String(testo == null ? '' : testo).replace(/[^0-9,.-]/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/\.(?=\d{3}(?:\D|$))/g, '');
    var n = parseFloat(s);
    return isFinite(n) ? Math.abs(n) : NaN;
  }

  function eur(n) {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  // sottoinsiemi di dimensione crescente: si preferisce la spiegazione piu' semplice
  function combinazioni(arr, k, da, acc, out) {
    if (acc.length === k) { out.push(acc.slice()); return out; }
    for (var i = da; i < arr.length; i++) { acc.push(arr[i]); combinazioni(arr, k, i + 1, acc, out); acc.pop(); }
    return out;
  }

  // Composizione dichiarata: data-split="idOutput:etichetta, idOutput:etichetta".
  // Serve dove le voci da comporre non sommano al totale mostrato. Sul lordo/netto
  // il numero grande e' il netto, ma la composizione che interessa e' quella del
  // LORDO: contributi, IRPEF e netto. Nessuna euristica puo' indovinarlo.
  function componiDichiarata(card) {
    var spec = card.getAttribute('data-split');
    if (!spec) return null;
    var parti = [];
    var pezzi = spec.split(',');
    for (var i = 0; i < pezzi.length; i++) {
      var q = pezzi[i].split(':');
      var el = document.getElementById(q[0].trim());
      if (!el) return null;
      var v = numero(el.textContent);
      if (!isFinite(v) || v < 0) return null;
      parti.push({ v: v, k: (q[1] || '').trim() });
    }
    var somma = parti.reduce(function (a, b) { return a + b.v; }, 0);
    return somma > 0 ? parti : null;
  }

  function componi(card) {
    var dichiarata = componiDichiarata(card);
    if (dichiarata) return dichiarata;

    var val = card.querySelector('.result-value');
    if (!val) return null;
    var totale = numero(val.textContent);
    if (!isFinite(totale) || totale <= 0) return null;

    var voci = [];
    var items = card.querySelectorAll('.breakdown-item');
    for (var i = 0; i < items.length; i++) {
      var v = numero((items[i].querySelector('.breakdown-value') || {}).textContent);
      var k = ((items[i].querySelector('.breakdown-label') || {}).textContent || '').trim();
      if (isFinite(v) && v > 0 && k) voci.push({ v: v, k: k });
    }
    if (voci.length < 2) return null;

    var max = Math.min(4, voci.length);
    for (var n = 2; n <= max; n++) {
      var combi = combinazioni(voci, n, 0, [], []);
      for (var c = 0; c < combi.length; c++) {
        var somma = combi[c].reduce(function (a, b) { return a + b.v; }, 0);
        if (Math.abs(somma - totale) / totale < 0.01) return combi[c];
      }
    }
    return null;
  }

  function disegna(card) {
    var vecchio = card.querySelector('.tape-split');
    if (vecchio) vecchio.parentNode.removeChild(vecchio);

    var parti = componi(card);
    if (parti) {
      var somma = parti.reduce(function (a, b) { return a + b.v; }, 0);
      var box = document.createElement('div');
      box.className = 'tape-split';
      var bar = '', key = '';
      for (var i = 0; i < parti.length; i++) {
        var col = COLORI[i % COLORI.length];
        bar += '<i style="width:' + (parti[i].v / somma * 100).toFixed(2) + '%;background:' + col + '"></i>';
        key += '<span><i style="background:' + col + '"></i>' + parti[i].k + ' · ' + eur(parti[i].v) + '</span>';
      }
      box.innerHTML = '<div class="bar" role="img" aria-label="Composizione del totale">' + bar + '</div><div class="key">' + key + '</div>';
      var bd = card.querySelector('.result-breakdown');
      if (bd) bd.parentNode.insertBefore(box, bd);
      else card.appendChild(box);
    }

    if (!card.querySelector('.tape-norma')) {
      var testo = card.getAttribute('data-norma');
      if (testo) {
        var d = document.createElement('div');
        d.className = 'tape-norma';
        var b = document.createElement('b');
        b.textContent = card.getAttribute('data-norma-titolo') || 'Base di calcolo';
        d.appendChild(b);
        d.appendChild(document.createTextNode(testo));
        var disc = card.querySelector('.result-disclaimer');
        if (disc) disc.parentNode.insertBefore(d, disc);
        else card.appendChild(d);
      }
    }
  }

  function avvia() {
    var carte = document.querySelectorAll('.result-card.tape');
    for (var i = 0; i < carte.length; i++) {
      (function (card) {
        disegna(card);
        // si ridisegna quando il calcolatore riscrive i numeri. Osservo solo le
        // celle dei valori: cosi' inserire la barra non richiama l'osservatore.
        var bersagli = [card.querySelector('.result-value')];
        var bv = card.querySelectorAll('.breakdown-value');
        for (var j = 0; j < bv.length; j++) bersagli.push(bv[j]);
        var attesa = null;
        var obs = new MutationObserver(function () {
          clearTimeout(attesa);
          attesa = setTimeout(function () { disegna(card); }, 30);
        });
        for (var k = 0; k < bersagli.length; k++) {
          if (bersagli[k]) obs.observe(bersagli[k], { childList: true, characterData: true, subtree: true });
        }
      })(carte[i]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
