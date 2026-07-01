(function () {
  'use strict';

  var ADSENSE_ID = 'ca-pub-9013466056664238';
  var GA_ID = 'G-Z9V41GR2BQ';
  var CONSENT_KEY = 'cp_cookie_consent';
  var PREFS_KEY = 'cp_cookie_prefs';

  // ── Google Consent Mode v2: default DENY prima del consenso ──
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  // ── Stili banner e pannello preferenze ──
  var css = `
#cp-cookie-banner {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #0f172a;
  color: rgba(255,255,255,.88);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 99998;
  box-shadow: 0 -4px 24px rgba(0,0,0,.35);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  box-sizing: border-box;
}
#cp-cookie-banner p { margin: 0; flex: 1; min-width: 0; }
#cp-cookie-banner a { color: #60a5fa; }
#cp-cookie-banner .cp-cb-btns {
  display: flex; gap: 12px; align-items: center; flex-shrink: 0;
}
#cp-btn-all {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  border: none;
  background: #2563eb; color: #fff;
  white-space: nowrap;
  transition: opacity .2s;
}
#cp-btn-all:hover { opacity: .85; }
#cp-btn-none {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  border: none;
  background: #fff; color: #0f172a;
  white-space: nowrap;
  transition: opacity .2s;
}
#cp-btn-none:hover { opacity: .85; }
#cp-btn-custom {
  background: none; border: none;
  color: rgba(255,255,255,.5);
  font-size: 12px; cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
  white-space: nowrap; padding: 0;
}
#cp-btn-custom:hover { color: rgba(255,255,255,.8); }
@media (max-width: 600px) {
  #cp-cookie-banner { flex-direction: column; align-items: flex-start; gap: 8px; padding: 10px 16px; }
  #cp-cookie-banner .cp-cb-btns { width: 100%; justify-content: flex-end; }
}

/* Pannello preferenze */
#cp-prefs-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.65);
  z-index: 99999;
  display: flex; align-items: flex-end; justify-content: center;
}
#cp-prefs-panel {
  background: #0f172a;
  color: rgba(255,255,255,.9);
  width: 100%; max-width: 580px;
  border-radius: 16px 16px 0 0;
  padding: 28px 24px 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px; line-height: 1.6;
  box-sizing: border-box;
  max-height: 90vh; overflow-y: auto;
}
#cp-prefs-panel h2 {
  font-size: 1.1rem; font-weight: 700; margin: 0 0 16px;
}
.cp-prefs-item {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 14px 0; border-top: 1px solid rgba(255,255,255,.08); gap: 16px;
}
.cp-prefs-item-info { flex: 1; }
.cp-prefs-item-info strong { display: block; font-size: 14px; margin-bottom: 4px; color: #f1f5f9; }
.cp-prefs-item-info span { font-size: 13px; color: rgba(255,255,255,.5); }
.cp-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; margin-top: 2px; }
.cp-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.cp-toggle .cp-slider {
  position: absolute; inset: 0;
  background: rgba(255,255,255,.2); border-radius: 24px;
  cursor: pointer; transition: background .2s;
}
.cp-toggle .cp-slider::before {
  content: ''; position: absolute;
  width: 18px; height: 18px; border-radius: 50%;
  left: 3px; top: 3px; background: #fff;
  transition: transform .2s;
}
.cp-toggle input:checked + .cp-slider { background: #2563eb; }
.cp-toggle input:checked + .cp-slider::before { transform: translateX(20px); }
.cp-toggle input:disabled + .cp-slider { background: #2563eb; opacity: .5; cursor: not-allowed; }
.cp-prefs-footer {
  font-size: 12px; color: rgba(255,255,255,.3);
  margin-top: 14px; margin-bottom: 0;
}
.cp-prefs-footer a { color: #60a5fa; }
.cp-prefs-btns {
  display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;
}
.cp-prefs-btns button {
  flex: 1; padding: 10px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; border: none;
  transition: opacity .2s; min-width: 120px;
}
.cp-prefs-btns button:hover { opacity: .85; }
#cp-prefs-save-all { background: #2563eb; color: #fff; }
#cp-prefs-save-sel { background: rgba(255,255,255,.1); color: rgba(255,255,255,.8); }
`;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Carica Google Fonts (solo dopo qualsiasi scelta di consenso) ──
  function loadFonts() {
    if (document.querySelector('link[data-cp-fonts]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-cp-fonts', '1');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }

  // ── Carica Google Analytics 4 ──
  function loadAnalytics() {
    if (document.querySelector('script[data-cp-ga]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-cp-ga', '1');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('config', GA_ID);
  }

  // ── Carica Google AdSense ──
  // Il tag adsbygoogle.js è già incluso nell'<head> di ogni pagina con Consent Mode v2.
  // Questa funzione evita il doppio caricamento verificando qualsiasi script adsbygoogle esistente.
  function loadAdsense() {
    if (document.querySelector('script[src*="adsbygoogle"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-cp-adsense', '1');
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_ID;
    document.head.appendChild(s);
  }

  // ── Applica le preferenze: aggiorna Consent Mode e carica script ──
  function applyPrefs(prefs) {
    gtag('consent', 'update', {
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
      ad_user_data: prefs.marketing ? 'granted' : 'denied',
      ad_personalization: prefs.marketing ? 'granted' : 'denied'
    });
    loadFonts();
    if (prefs.analytics) loadAnalytics();
    if (prefs.marketing) loadAdsense();
  }

  // ── Pannello preferenze granulari ──
  function showPrefsPanel(onSave) {
    var savedPrefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{"analytics":false,"marketing":false}');

    var overlay = document.createElement('div');
    overlay.id = 'cp-prefs-overlay';
    overlay.innerHTML =
      '<div id="cp-prefs-panel">' +
        '<h2>🔒 Gestisci preferenze cookie</h2>' +
        '<div class="cp-prefs-item">' +
          '<div class="cp-prefs-item-info">' +
            '<strong>Cookie tecnici (sempre attivi)</strong>' +
            '<span>Indispensabili per il funzionamento del sito. Non raccolgono dati personali e non richiedono consenso.</span>' +
          '</div>' +
          '<label class="cp-toggle"><input type="checkbox" checked disabled><span class="cp-slider"></span></label>' +
        '</div>' +
        '<div class="cp-prefs-item">' +
          '<div class="cp-prefs-item-info">' +
            '<strong>Cookie analitici — Google Analytics 4</strong>' +
            '<span>Raccolgono dati anonimi sulle visite (pagine, durata, dispositivo) per migliorare il sito. Nessun dato personale identificabile.</span>' +
          '</div>' +
          '<label class="cp-toggle"><input type="checkbox" id="cp-chk-analytics"' + (savedPrefs.analytics ? ' checked' : '') + '><span class="cp-slider"></span></label>' +
        '</div>' +
        '<div class="cp-prefs-item">' +
          '<div class="cp-prefs-item-info">' +
            '<strong>Cookie pubblicitari — Google AdSense</strong>' +
            '<span>Usati per mostrare annunci pertinenti. Google utilizza questi cookie per personalizzare gli annunci in base ai tuoi interessi.</span>' +
          '</div>' +
          '<label class="cp-toggle"><input type="checkbox" id="cp-chk-marketing"' + (savedPrefs.marketing ? ' checked' : '') + '><span class="cp-slider"></span></label>' +
        '</div>' +
        '<p class="cp-prefs-footer">' +
          'Puoi modificare le preferenze in qualsiasi momento tramite il link &ldquo;Gestisci cookie&rdquo; nel footer. ' +
          '<a href="/cookie.html">Cookie Policy</a> &middot; <a href="/privacy.html">Privacy Policy</a>' +
        '</p>' +
        '<div class="cp-prefs-btns">' +
          '<button id="cp-prefs-save-all">Accetta tutti</button>' +
          '<button id="cp-prefs-save-sel">Salva selezione</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('cp-prefs-save-all').addEventListener('click', function () {
      var prefs = { analytics: true, marketing: true };
      localStorage.setItem(CONSENT_KEY, 'all');
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      overlay.remove();
      if (onSave) onSave(prefs);
    });

    document.getElementById('cp-prefs-save-sel').addEventListener('click', function () {
      var analytics = document.getElementById('cp-chk-analytics').checked;
      var marketing = document.getElementById('cp-chk-marketing').checked;
      var prefs = { analytics: analytics, marketing: marketing };
      var level = analytics && marketing ? 'all' : (analytics || marketing ? 'custom' : 'essential');
      localStorage.setItem(CONSENT_KEY, level);
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      overlay.remove();
      if (onSave) onSave(prefs);
    });
  }

  // ── Riserva spazio in fondo alla pagina pari all'altezza di qualsiasi barra fissa
  // ── visibile in basso (banner cookie e/o sticky Amazon), così nessun contenuto
  // ── interattivo (es. pulsanti "Calcola") resta nascosto/intercettato da essa.
  // ── scroll-padding-bottom è la parte che conta di più: dice al browser di tenerne conto
  // ── anche quando porta automaticamente in vista un elemento (scrollIntoView, focus su un
  // ── campo, ecc.), altrimenti un elemento può finire col bordo esatto sul bordo della barra
  // ── ed essere coperto pur restando visibile all'occhio. ──
  function isVisible(el) {
    return !!el && getComputedStyle(el).display !== 'none';
  }
  // Margine di sicurezza extra: lo scroll automatico del browser (scrollIntoView, focus su
  // un campo, screen reader) non allinea sempre in modo preciso al valore di scroll-padding,
  // quindi si riserva qualche pixel in più oltre alla sola altezza misurata della barra.
  var BOTTOM_BAR_SAFETY_MARGIN = 48;
  function syncBottomBarSpace() {
    var h = 0;
    var banner = document.getElementById('cp-cookie-banner');
    if (isVisible(banner)) h = Math.max(h, banner.offsetHeight);
    var sticky = document.getElementById('amzSticky');
    if (isVisible(sticky)) h = Math.max(h, sticky.offsetHeight);
    var px = h > 0 ? (h + BOTTOM_BAR_SAFETY_MARGIN) + 'px' : '';
    document.body.style.paddingBottom = px;
    document.documentElement.style.scrollPaddingBottom = px;
  }
  // Osserva #amzSticky (mostrata/nascosta con tempistiche diverse a seconda della pagina) e
  // ricalcola lo spazio riservato ogni volta che cambia visibilità.
  function watchAmzSticky() {
    var sticky = document.getElementById('amzSticky');
    if (!sticky || !window.MutationObserver) return;
    new MutationObserver(syncBottomBarSpace).observe(sticky, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  // ── Banner principale ──
  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'cp-cookie-banner';
    banner.innerHTML =
      '<p>🍪 Usiamo cookie tecnici e, con il tuo consenso, di analisi e pubblicità. ' +
      '<a href="/cookie.html">Dettagli</a></p>' +
      '<div class="cp-cb-btns">' +
        '<button id="cp-btn-none" type="button">Rifiuta</button>' +
        '<button id="cp-btn-custom" type="button">Personalizza</button>' +
        '<button id="cp-btn-all" type="button">Accetta</button>' +
      '</div>';
    document.body.appendChild(banner);
    syncBottomBarSpace();

    document.getElementById('cp-btn-all').addEventListener('click', function () {
      var prefs = { analytics: true, marketing: true };
      localStorage.setItem(CONSENT_KEY, 'all');
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      applyPrefs(prefs);
      banner.remove();
      syncBottomBarSpace();
    });

    document.getElementById('cp-btn-none').addEventListener('click', function () {
      var prefs = { analytics: false, marketing: false };
      localStorage.setItem(CONSENT_KEY, 'essential');
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      loadFonts();
      banner.remove();
      syncBottomBarSpace();
    });

    document.getElementById('cp-btn-custom').addEventListener('click', function () {
      banner.remove();
      syncBottomBarSpace();
      showPrefsPanel(function (prefs) {
        applyPrefs(prefs);
      });
    });
  }

  // ── Funzione globale per riaprire le preferenze (usata dal footer) ──
  window.cpOpenCookieSettings = function () {
    var existingOverlay = document.getElementById('cp-prefs-overlay');
    if (existingOverlay) { existingOverlay.remove(); return; }
    var existingBanner = document.getElementById('cp-cookie-banner');
    if (existingBanner) { existingBanner.remove(); syncBottomBarSpace(); }
    showPrefsPanel(function (prefs) {
      applyPrefs(prefs);
    });
  };

  // ── Init ──
  function init() {
    var consent = localStorage.getItem(CONSENT_KEY);
    if (consent === 'all') {
      applyPrefs({ analytics: true, marketing: true });
    } else if (consent === 'essential') {
      loadFonts();
    } else if (consent === 'custom') {
      var prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{"analytics":false,"marketing":false}');
      applyPrefs(prefs);
    } else {
      showBanner();
    }
    watchAmzSticky();
    syncBottomBarSpace();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
