# SEO Report — CalcolaPro.it
**Data:** 25 giugno 2026
**Dominio:** calcolapro.it (GitHub Pages)
**Modello:** Claude Sonnet 4.6

---

## Score SEO Stimato

| Area | Prima | Dopo |
|---|---|---|
| Meta tag (title/description) | 35/100 | 82/100 |
| Schema markup (JSON-LD) | 40/100 | 40/100 |
| Infrastruttura (sitemap/robots/llms.txt) | 50/100 | 78/100 |
| Keyword targeting | 30/100 | 42/100 |
| Contenuti (word count, FAQ, guide) | 45/100 | 45/100 |
| Technical SEO (canonical, lang, OG) | 70/100 | 90/100 |
| **TOTALE STIMATO** | **45/100** | **63/100** |

> Nota: lo score riflette solo quanto e' stato lavorato in questa sessione. Il ceiling realistico senza nuovi contenuti e backlink e' circa 65–70/100.

---

## Interventi Completati

### Meta Tag Fix (8 pagine)

1. **index.html** — Title accorciato da 64 a 53 char ("CalcolaPro - Calcolatori Finanziari Italiani Gratuiti"), meta desc da 176 a 152 char con CTA "Calcola ora", OG/Twitter sincronizzati.
2. **come-funziona.html** — Title da 75 a 52 char ("Come Funziona CalcolaPro | Calcolatori Gratuiti 2026"), meta desc da 173 a 149 char con keyword in apertura.
3. **calcolatore-interessi-conto-deposito.html** — Title da 62 a 57 char ("Conto Deposito 2026: Calcola Interessi Netti | CalcolaPro"), meta desc da 157 a 153 char.
4. **calcolatore-prezzo-orario-freelance.html** (redirect noindex) — Title da 81 a 56 char, meta desc da 166 a 152 char. Noindex e meta refresh mantenuti perche' e' redirect intenzionale verso freelance.html.
5. **calcolatore-risparmio.html** — Meta desc gia' ok (145 char), OG/Twitter title sincronizzati.
6. **calcolo-cedolare-secca.html** — Title da 62 a 52 char ("Cedolare Secca 2026: Conviene vs IRPEF? | CalcolaPro"), meta desc da 188 a 151 char.
7. **pensione.html** — Title da 65 a 60 char ("Calcola Pensione 2026 | Quando Vado in Pensione | CalcolaPro"), meta desc da 168 a 150 char.
8. **affitto.html** — Title da 71 a 45 char ("Calcola Affitto Sostenibile 2026 | CalcolaPro"), meta desc da 185 a 151 char.

### Infrastruttura

9. **sitemap.xml** — Aggiornato lastmod a 2026-06-25 su tutti gli URL, aggiunto calcolatore-prezzo-orario-freelance.html (mancante), priority e changefreq allineati alle specifiche (guide a 0.7, pagine statiche a 0.4). Totale: 39 URL.
10. **robots.txt** — Corretta whitelist GSC: rimosso il disallow sui file di verifica Google (google6e353ac4d003edf5.html, google2b74dfe4e26590a9.html che devono essere crawlabili), mantenuto solo Disallow: /404.html, aggiunto Sitemap: directive.
11. **llms.txt** — Aggiunto al file: descrizioni a tutte le 10 guide (prima bare URL), aggiunto calcolatore-prezzo-orario-freelance.html mancante, espansa sezione "Chi siamo" con mission, email e URL diretti.

---

## File Creati/Modificati

| File | Operazione |
|---|---|
| `index.html` | Modificato (meta tag) |
| `come-funziona.html` | Modificato (meta tag) |
| `calcolatore-interessi-conto-deposito.html` | Modificato (meta tag) |
| `calcolatore-prezzo-orario-freelance.html` | Modificato (meta tag) |
| `calcolatore-risparmio.html` | Modificato (meta tag OG/Twitter) |
| `calcolo-cedolare-secca.html` | Modificato (meta tag) |
| `pensione.html` | Modificato (meta tag) |
| `affitto.html` | Modificato (meta tag) |
| `sitemap.xml` | Riscritto |
| `robots.txt` | Riscritto |
| `llms.txt` | Aggiornato |

---

## Top 5 Opportunita' Residue

### 1. Schema markup incompleto (impatto: ALTO)
Le pagine calcolatori non hanno tutti i dati strutturati potenziali. Da aggiungere:
- `SoftwareApplication` o `WebApplication` sulle pagine calcolatore (supporta rich result "App" su Google).
- `HowTo` schema sulle guide (es. "Come calcolare la rata del mutuo in 5 passi") — genera rich snippet con passi visibili in SERP.
- Revisione `FAQPage` esistente: verificare che tutte le FAQ nei calcolatori abbiano markup corrispondente nel JSON-LD.

### 2. Word count troppo basso sulle pagine calcolatore (impatto: ALTO)
Da audit: le pagine calcolatore hanno stimati 400–700 parole di testo visibile. Per competere su keyword come "calcola rata mutuo" o "calcolo pensione 2026" servono almeno 1.000–1.500 parole di contenuto informativo sotto il tool (guide d'uso, esempi pratici, tabelle comparative, FAQ ampliate). Questo e' il delta piu' grande tra CalcolaPro e i competitor che rankano in top 3.

### 3. Backlink: zero autorita' esterna (impatto: CRITICO a lungo termine)
Un sito su GitHub Pages senza backlink tende a stagnare in posizioni 15–30 anche con SEO on-page perfetto. Azioni prioritarie:
- Rispondere su Reddit (r/ItaliaPersonalFinance, r/lavoroIT) con link quando pertinente.
- Pubblicare su forum come BogleheadsItalia, Finanzaonline, o blog di finanza personale italiani.
- Guest post su 1–2 blog finanziari con DA > 30 (es. Affaridigitali, Mr. RIP Italy-adjacent).

### 4. Nessuna pagina blog / articolo SEO (impatto: ALTO nel medio termine)
Il sito e' interamente composto da pagine tool. Manca del tutto il traffico informazionale ("come funziona il regime forfettario 2026", "differenza cedolare secca e irpef affitti"). Creare 1 articolo/mese su queste query intercetta utenti nella fase di ricerca prima che arrivino al tool, aumenta il crawl budget e costruisce autorita' tematica.

### 5. Core Web Vitals e performance mobile non verificati (impatto: MEDIO)
GitHub Pages serve file statici (ottimo per TTFB) ma i calcolatori con molto JavaScript potrebbero avere LCP > 2.5s su mobile. Da fare:
- Audit PageSpeed Insights su almeno mutuo.html, freelance.html, pensione.html.
- Se LCP > 2.5s: lazy load script non critici, preload font, comprimere immagini SVG/PNG.
- Verificare CLS (cumulative layout shift) sui calcolatori con output dinamici.

---

## Keyword Target Prioritarie

| # | Keyword | Volume mensile stimato (IT) | Difficolta' | Posizione attuale stimata |
|---|---|---|---|---|
| 1 | calcola rata mutuo | 18.000 | Alta | 20–40 |
| 2 | calcolatore mutuo | 14.500 | Alta | 20–40 |
| 3 | calcolo pensione 2026 | 9.200 | Media | 15–30 |
| 4 | stipendio netto lordo calcolatore | 8.100 | Media | 10–25 |
| 5 | calcolo prezzo orario freelance | 4.400 | Bassa | 8–20 |
| 6 | cedolare secca 2026 calcolo | 3.800 | Media | 15–30 |
| 7 | calcolo interessi conto deposito | 3.200 | Bassa | 5–15 |
| 8 | calcolatore regime forfettario 2026 | 2.900 | Bassa | 5–12 |
| 9 | calcolo affitto sostenibile | 1.600 | Molto bassa | 3–10 |
| 10 | calcolo TFR liquidazione | 1.400 | Molto bassa | 3–8 |

> Volumi stimati basati su stagionalita' italiana e dati analoghi da tool pubblici (Ubersuggest/Semrush range pubblici). Vanno validati con Google Search Console dopo indicizzazione.
>
> Le keyword in posizione 3–10 (calcola interessi, regime forfettario, affitto, TFR) sono le piu' aggredibili a breve termine con ottimizzazione on-page.

---

## Stima Traffico Organico

| Scenario | Visite organiche/mese stimate |
|---|---|
| **Ora — prima degli interventi** | 80–150 |
| **Tra 3 mesi — con solo questi fix** | 200–400 |
| **Tra 6 mesi — fix + 1 articolo/mese** | 600–1.200 |
| **Tra 12 mesi — strategia completa** | 2.000–5.000 |

### Note sulla stima (sii onesto)

**Ora (80–150 visite/mese):** Un sito su GitHub Pages senza backlink significativi, lanciato di recente, parte da quasi zero. Il traffico attuale e' principalmente branded ("calcolapro") o diretto da chi conosce gia' il sito.

**3 mesi (200–400):** I meta fix aiutano il CTR una volta che le pagine sono gia' indicizzate, ma non spostano le posizioni da soli. L'incremento viene dall'indicizzazione piu' pulita e dal click-through migliore su chi gia' vede il sito in SERP.

**6 mesi (600–1.200):** Questo scenario richiede che vengano effettivamente pubblicati articoli (almeno 4–6 da 1.000+ parole) e che il sito ottenga qualche backlink naturale. E' il punto di svolta realistico dove il traffico inizia a scalare.

**12 mesi (2.000–5.000):** Scenario ottimistico ma raggiungibile se si esegue la strategia contenuti + link building. Il ceiling a 5.000 assume 2–3 articoli/mese, schema markup completo, e almeno 10–15 backlink da siti rilevanti con DA > 20.

**Tetto strutturale GitHub Pages:** Non ci sono limitazioni tecniche di GitHub Pages che impediscano questo traffico. Il vero tetto e' la concorrenza: le keyword piu' voluminose (calcola rata mutuo, calcolatore pensione) sono dominate da banche, INPS, e siti come MutuiOnline con DA 60–80. CalcolaPro puo' competere sulle long-tail e le keyword a bassa difficolta' nel breve termine.

---

*Report generato il 25/06/2026 — basato su audit tecnico, keyword map e interventi effettuati nella sessione corrente.*
