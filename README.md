# CalcolaPro

[calcolapro.it](https://calcolapro.it) — 37 calcolatori finanziari e fiscali gratuiti per lavoratori, freelance e famiglie italiane (mutuo, stipendio netto, IVA, pensione, IMU, TFR, regime forfettario, ISEE, e altro), più 13 guide di approfondimento.

Sito **statico** (HTML/CSS/JS puro, nessun framework, nessun build step), pensato per essere pubblicato così com'è su **GitHub Pages**. Tutti i calcoli vengono eseguiti interamente nel browser dell'utente: nessun dato viene inviato a un server.

## Struttura del progetto

Il sito è volutamente **flat** (nessuna sottocartella per le pagine): essendo un sito statico senza build step, ogni file `.html` nella root corrisponde 1:1 all'URL pubblicato (es. `mutuo.html` → `calcolapro.it/mutuo.html`). Spostare le pagine in sottocartelle romperebbe tutti gli URL già indicizzati da Google — per questo la struttura resta piatta anche se il numero di file è alto.

```
calcolapro/
├── index.html                      Home page
├── mutuo.html, lordonetto.html...  I 37 calcolatori (root, un file per pagina)
├── guida-*.html, categoria-*.html  Le 13 guide di approfondimento
├── privacy.html, cookie.html,      Pagine legali/informative
│   termini.html, disclaimer.html,
│   about.html, contatti.html,
│   come-funziona.html
│
├── style.css                       Design system del sito (variabili colore, navbar, footer,
│                                    card, bottoni, risultati calcolatori — importato da tutte le pagine)
├── shared-calc.css                 Classi condivise specifiche dei calcolatori (importato dopo style.css)
│
├── js/
│   ├── cookie-consent.js           Banner cookie GDPR + Google Consent Mode v2:
│   │                                gestisce il consenso e carica GA4/AdSense SOLO dopo
│   │                                un'azione esplicita dell'utente (Accetta/Rifiuta/Personalizza)
│   └── analytics-events.js         Eventi custom GA4 (calcolo_completato, cta_affiliato_click, ecc.)
│
├── loghi/                          Logo del sito (PNG)
├── favicon.svg                     Favicon (SVG, usata da tutte le pagine)
├── og-image.png / og-image.svg     Immagine social condivisa (Open Graph / Twitter Card)
│
├── sitemap.xml                     Sitemap XML per i motori di ricerca
├── robots.txt                      Direttive crawler + riferimento alla sitemap
├── llms.txt                        Indice del sito per crawler/agenti AI
├── ads.txt                         Autorizzazione Google AdSense
├── CNAME                           Dominio custom per GitHub Pages (calcolapro.it)
├── .nojekyll                       Disabilita l'elaborazione Jekyll di GitHub Pages
│
├── scripts/                        Script Node di supporto (non pubblicati, uso interno)
│   ├── pre-deploy-check.js          Controllo automatico pre-deploy (Playwright)
│   ├── screenshots.js               Genera screenshot delle pagine principali
│   ├── visual-audit.js              Audit visivo automatizzato
│   └── compare-nav.mjs              Confronta la navbar tra le pagine per individuare incoerenze
│
├── tests/
│   └── calcolatori.spec.js         Test end-to-end (Playwright) sui calcolatori principali
│
├── package.json                    Dipendenze di sviluppo (Playwright, serve) — solo per test/anteprima locale
└── AUDIT_REPORT.md                 Report dell'ultimo audit completo del sito (branch audit/full-site-review)
```

### Perché non ci sono sottocartelle per CSS/pagine

Con un sito statico a 59 pagine senza build step, ogni pagina importa `style.css` e `shared-calc.css` con un percorso relativo semplice (`href="style.css"`). Introdurre sottocartelle (`/css/`, `/pages/`) avrebbe richiesto aggiornare i percorsi in tutte le pagine per un beneficio puramente estetico, con il rischio concreto di rompere qualche riferimento su un sito già online e indicizzato. La cartella `js/` esiste perché i due script sono importati identici da tutte le pagine ed è comunque a basso rischio (nessun URL pubblico punta direttamente a `js/*.js`).

## Sviluppo in locale

Richiede [Node.js](https://nodejs.org/) (per i tool di test/anteprima — il sito stesso non ha bisogno di build).

```bash
npm install       # installa Playwright e il pacchetto "serve"
npm run serve     # avvia un server statico locale su http://localhost:3000
```

Apri `http://localhost:3000` nel browser: essendo un sito statico puoi anche aprire i file `.html` direttamente, ma alcune funzionalità (fetch relativi, service worker) si comportano meglio serviti via HTTP.

### Test

```bash
npm test          # esegue i test end-to-end Playwright (tests/calcolatori.spec.js)
npm run test:ui   # stessa cosa, con interfaccia interattiva Playwright
npm run check     # controllo automatico pre-deploy (scripts/pre-deploy-check.js)
```

## Deployment

Il sito è pubblicato con **GitHub Pages**, servito direttamente dal branch `main` (nessuna pipeline di build: i file HTML/CSS/JS della root sono già pronti per la pubblicazione).

1. Le modifiche vanno sviluppate su un branch separato (es. `audit/full-site-review`) e verificate in locale.
2. Una volta pronte, si fa merge su `main`.
3. Il push su `main` aggiorna automaticamente calcolapro.it (GitHub Pages ripubblica ad ogni push, in genere entro 1-2 minuti).
4. Il dominio custom `calcolapro.it` è configurato tramite il file `CNAME` nella root + i record DNS del dominio (gestiti fuori da questo repo, presso il registrar).

**Prima di ogni merge su `main`** è consigliato eseguire `npm run check` e/o `npm test`, e verificare a occhio le pagine modificate in locale.

## Analytics e privacy

- **Google Analytics 4** (ID `G-Z9V41GR2BQ`) e **Google AdSense** vengono caricati **solo dopo consenso esplicito** dell'utente tramite il banner cookie (`js/cookie-consent.js`, Google Consent Mode v2). Questo è un requisito di conformità GDPR, non un'opzione: non renderlo mai incondizionato.
- Tutti i calcoli avvengono lato client — nessun input dell'utente (importi, dati anagrafici, ecc.) lascia mai il browser.
- Le pagine legali di riferimento sono `privacy.html`, `cookie.html`, `termini.html`, `disclaimer.html`.

## Convenzioni per nuove pagine/calcolatori

Ogni pagina calcolatore segue lo stesso schema, riusabile come base per nuovi strumenti:

- `<head>`: meta tag SEO (title/description/OG/Twitter), canonical self-referenziante, JSON-LD (`WebApplication` + `FAQPage` + `BreadcrumbList`), script di Consent Mode + AdSense, import di `style.css` poi `shared-calc.css`.
- `<body>`: navbar standard → page-header → form input → risultato (`.result-card` con `.result-disclaimer` obbligatorio) → contenuto SEO/FAQ → footer standard.
- Disclaimer "risultato indicativo" **sempre presente** dentro il box risultato di ogni calcolatore: è la principale tutela legale del sito.
- Dopo aver aggiunto una pagina: aggiornarla in `sitemap.xml`, `llms.txt`, e collegarla da almeno 2 punti del sito (home + un calcolatore correlato).

<!-- deploy-retry-marker: 2026-07-03T07:09:10Z -->
