# Audit completo CalcolaPro.it

Branch: `audit/full-site-review` — Data: 2026-07-02

## Fase 0 — Ricognizione

**Inventario reale: 59 pagine HTML** (esclusi 2 file di verifica Google e `node_modules`).

- 37 calcolatori (come da elenco di riferimento, incluso `tfr.html` che è però un redirect noindex verso `calcolo-tfr-liquidazione.html`)
- 13 guide (12 di riferimento + `guida-bonus-casa-2026.html`, non elencata)
- 7 pagine info (6 di riferimento + `disclaimer.html`, separata da `termini.html`)
- extra: `calcolatore-prezzo-orario-freelance.html` (redirect noindex → `freelance.html`, non conteggiato tra i 37), `come-funziona.html` (non elencata)

Nessuna pagina dell'elenco di riferimento risulta mancante dal repo.

**Hosting confermato: GitHub Pages** (CNAME `calcolapro.it`, nessun `_headers`/`netlify.toml`) — gli header di sicurezza via Netlify richiesti nel mandato Agente 6 non sono applicabili così come descritti; verrà valutata un'alternativa (meta tag / cambio hosting).

**Sitemap**: 57 URL, coerente (59 pagine reali − 2 redirect intenzionalmente esclusi = 57). Nessun gap rilevato in questo controllo meccanico.

**Canonical tag**: presenti su tutte le 59 pagine, tutti self-referencing tranne i 2 redirect (corretti). Nessun errore rilevato in questo controllo meccanico.

**Nota**: prima di avviare l'audit è stato isolato in un commit separato (`399fb2f`) un lavoro di redesign chiaro (page-header/footer) rimasto in sospeso da una sessione precedente, non correlato all'audit.

---

## Legenda gravità
🔴 Critico · 🟠 Alto · 🟡 Medio · 🟢 Basso

## Problemi trovati

_(popolato progressivamente dagli agenti)_
