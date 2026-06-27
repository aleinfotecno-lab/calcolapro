/**
 * CalcolaPro — GA4 Custom Events
 * Measurement ID: G-Z9V41GR2BQ
 * Aggiornato: Giugno 2026
 *
 * CONVERSIONI DA CONFIGURARE IN GA4:
 * - calcolo_completato → Pannello GA4 → Admin → Conversioni → Nuovo evento di conversione
 * - cta_affiliato_click → stessa procedura
 * - lead_affiliato → stessa procedura (fire su pagine di thank-you partner)
 */

(function(){
  'use strict';

  function sendEvent(name, params) {
    if (typeof gtag === 'function') {
      gtag('event', name, params || {});
    }
  }

  // 1. EVENTO: calcolo_completato
  var calcButtons = document.querySelectorAll(
    'button[type="submit"], .calc-btn, #calcBtn, button[onclick*="calc"], button[onclick*="Calc"]'
  );
  calcButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var pageName = window.location.pathname.replace('/','').replace('.html','') || 'homepage';
      sendEvent('calcolo_completato', {
        event_category: 'calcolatore',
        event_label: pageName,
        page_path: window.location.pathname
      });
    });
  });

  // 2. EVENTO: cta_affiliato_click
  document.querySelectorAll('a[rel*="sponsored"]').forEach(function(link){
    link.addEventListener('click', function(){
      sendEvent('cta_affiliato_click', {
        event_category: 'affiliate',
        event_label: link.href,
        link_text: link.textContent.trim().substring(0,50),
        page_path: window.location.pathname
      });
    });
  });

  // 3. EVENTO: guida_letta (scroll 75%)
  var scrollFired = false;
  if (window.location.pathname.indexOf('guida-') !== -1) {
    window.addEventListener('scroll', function(){
      if (scrollFired) return;
      var scrolled = window.scrollY + window.innerHeight;
      var total = document.body.scrollHeight;
      if (scrolled / total >= 0.75) {
        scrollFired = true;
        sendEvent('guida_letta', {
          event_category: 'contenuto',
          event_label: document.title,
          page_path: window.location.pathname
        });
      }
    }, {passive: true});
  }

  // 4. EVENTO: outbound_link_click
  document.querySelectorAll('a[href^="http"]').forEach(function(link){
    if (link.hostname !== window.location.hostname && !link.rel.includes('sponsored')) {
      link.addEventListener('click', function(){
        sendEvent('outbound_link_click', {
          event_category: 'outbound',
          event_label: link.href,
          page_path: window.location.pathname
        });
      });
    }
  });

  // 5. EVENTO: page_view_enriched
  var path = window.location.pathname;
  var pageType = 'altro';
  if (path === '/' || path.indexOf('index') !== -1) pageType = 'homepage';
  else if (path.indexOf('guida-') !== -1) pageType = 'guida';
  else if (path.indexOf('calcol') !== -1 || ['mutuo','lordonetto','freelance','pensione','partitaiva','iva','affitto','chilometrico','tfr'].some(function(k){ return path.indexOf(k) !== -1; })) pageType = 'calcolatore';

  sendEvent('page_view_enriched', {
    event_category: 'navigazione',
    page_type: pageType,
    page_path: path
  });

})();
