(function () {
  'use strict';

  function init() {
    var btn = document.getElementById('navMenuBtn');
    var panel = document.getElementById('navMenuPanel');
    var search = document.getElementById('navSearchInput');
    if (!btn || !panel) return;

    var main = document.querySelector('main');
    var footer = document.querySelector('footer');

    function getFocusable() {
      return Array.prototype.filter.call(
        panel.querySelectorAll('a, input, button, select, textarea'),
        function (el) { return el.offsetParent !== null; }
      );
    }

    function openPanel() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (main) main.setAttribute('inert', '');
      if (footer) footer.setAttribute('inert', '');
      if (search) { search.value = ''; filterLinks(''); setTimeout(function () { search.focus(); }, 50); }
    }
    function closePanel() {
      var focusWasInPanel = panel.contains(document.activeElement);
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (main) main.removeAttribute('inert');
      if (footer) footer.removeAttribute('inert');
      if (focusWasInPanel) btn.focus();
    }
    function togglePanel() {
      if (panel.classList.contains('open')) closePanel(); else openPanel();
    }

    btn.addEventListener('click', togglePanel);

    panel.addEventListener('click', function (e) {
      if (e.target === panel) closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !panel.classList.contains('open')) return;
      var focusable = getFocusable();
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !panel.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !panel.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    var links = panel.querySelectorAll('.nav-menu-col a');
    links.forEach(function (a) {
      a.addEventListener('click', closePanel);
    });

    function filterLinks(query) {
      var q = query.trim().toLowerCase();
      var anyVisible = false;
      var cols = panel.querySelectorAll('.nav-menu-col');
      cols.forEach(function (col) {
        var colHasMatch = false;
        var colLinks = col.querySelectorAll('a');
        colLinks.forEach(function (a) {
          var match = !q || a.textContent.toLowerCase().indexOf(q) !== -1;
          a.setAttribute('data-hidden', match ? 'false' : 'true');
          if (match) { colHasMatch = true; anyVisible = true; }
        });
        col.style.display = colHasMatch ? '' : 'none';
      });
      var empty = document.getElementById('navMenuEmpty');
      if (empty) empty.classList.toggle('show', !anyVisible);
    }

    if (search) {
      search.addEventListener('input', function () { filterLinks(search.value); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Tabelle larghe raggiungibili da tastiera (WCAG 2.1.1).
//
// Il contenitore che scorre in orizzontale non prende il focus da solo: senza
// tabindex chi naviga da tastiera non puo' scorrerlo, e meta' tabella resta
// irraggiungibile. Sta qui e non in ui-common.js perche' questo file lo caricano
// tutte e settanta le pagine, quello solo trentuno: diciassette pagine con tabelle
// scorrevoli restavano scoperte.
//
// Il tabindex si mette solo dove il contenuto eccede davvero, e si rivaluta quando
// cambia la larghezza: metterlo ovunque creerebbe fermate di tabulazione vuote.
(function() {
  var contenitori = document.querySelectorAll('.table-wrap, .table-scroll');
  if (!contenitori.length) return;
  function sincronizza() {
    contenitori.forEach(function(el) {
      if (el.scrollWidth > el.clientWidth + 1) {
        if (el.getAttribute('tabindex') === null) {
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'region');
          if (!el.hasAttribute('aria-label')) {
            var t = el.querySelector('caption, th');
            el.setAttribute('aria-label', t ? 'Tabella: ' + t.textContent.trim().slice(0, 60) : 'Tabella scorrevole in orizzontale');
          }
        }
      } else if (el.getAttribute('role') === 'region') {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
      }
    });
  }
  sincronizza();
  // I caratteri web arrivano dopo: una tabella che stava dentro puo' uscirne.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sincronizza);
  window.addEventListener('load', sincronizza);
  window.addEventListener('resize', sincronizza);
})();
