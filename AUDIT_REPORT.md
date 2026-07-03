# Audit completo CalcolaPro.it

Branch: `audit/full-site-review` — Data: 2026-07-02, aggiornato 2026-07-03
Squadra: 12 agenti specializzati (6 Calcoli/normativa, 2 Design, 1 Legale/accessibilità, 2 SEO, 1 Sicurezza), eseguiti in due run per recuperare 2 gruppi falliti per rate-limit. Verifica incrociata: molti bug (es. IRPEF 35→33%, link tfr.html, disclaimer mancante) sono stati confermati indipendentemente da più agenti/run diversi.

## Addendum 2026-07-03 — Correzioni fiscali verificate + finalizzazione sito

Dopo il primo audit, tutti i valori normativi elencati come "da verificare" sono stati controllati con una ricerca dedicata su fonti ufficiali (Agenzia Entrate, INPS, MEF, Gazzetta Ufficiale) e corretti nel codice dove la fonte era sufficientemente solida. Riepilogo separato più sotto ("Correzioni fiscali applicate dopo verifica"). Inoltre: rimossi tutti i riferimenti a Netlify, aggiunto README.md, ridisegnata la navbar (menu unico a pannello con ricerca, uguale su desktop/mobile) su tutte le 59 pagine, alleggerita la home page con una vista d'insieme per categoria.

## Legenda gravità
🔴 Critico · 🟠 Alto · 🟡 Medio · 🟢 Basso

---

## Fase 0 — Ricognizione

**Inventario reale: 59 pagine HTML.** 37 calcolatori (incl. `tfr.html`, redirect), 13 guide (12 di riferimento + `guida-bonus-casa-2026.html`), 7 info (6 di riferimento + `disclaimer.html`), + `calcolatore-prezzo-orario-freelance.html` (redirect) e `come-funziona.html`. Nessuna pagina di riferimento mancante.

**Hosting confermato: GitHub Pages** (non Netlify) — nessun `_headers`/`netlify.toml` possibile: gli header di sicurezza HTTP reali non sono configurabili via file di progetto.

**Controlli meccanici puliti fin da subito:** favicon ovunque, 1 solo H1/pagina ovunque, nessun mixed-content, nessun secret esposto, nessun `img` senza alt, canonical corretto su tutte le 59 pagine, sitemap.xml coerente (57 URL = 59 − 2 redirect), nessun link interno rotto, `npm audit` pulito.

---

## ✅ Cosa ho già fatto (6 commit sul branch, nulla su `main`)

Un lavoro di redesign chiaro (page-header/footer) rimasto in sospeso da una sessione precedente è stato isolato nel commit `399fb2f`, separato dai fix dell'audit.

### `2ff8ce3` — Disclaimer "calcolo indicativo" mancante su 30/37 calcolatori
L'agente Legale ha smentito il mio controllo meccanico iniziale (falso positivo: matchava genericamente la parola "indicativ" nel disclaimer di footer). Verifica precisa: solo 6/37 calcolatori avevano il disclaimer *dentro* il box risultato (mutuo, lordonetto, pensione, calcolo-tfr-liquidazione, partitaiva, calcolo-fondo-pensione). Aggiunto lo stesso paragrafo standard sugli altri 31.

### `6f9c33d` — 81 link interni residui verso `tfr.html`
`tfr.html` è un redirect noindex; quasi tutto il sito (footer, cross-link) linkava ancora il vecchio URL invece di `calcolo-tfr-liquidazione.html`. Corretto ovunque. Incluso anche: **bug confermato** in `calcolo-costo-lavoro.html` — un `* 0` residuo azzerava la parte variabile della detrazione IRPEF da lavoro dipendente, rendendola sempre costante a 1.955€ invece che decrescente (la formula "semplificata" risultante resta comunque da verificare contro le soglie ufficiali, vedi sotto).

### `06516a3` + `7e31823` — Bug CSS/JS confermati, non normativi
- `--accent-rgb` mai definita in `style.css` → tab/box attivi completamente trasparenti su calcolatore-percentuale, calcolo-eta, iva, tdee. Aggiunta la variabile mancante in `:root`.
- Classi JS inesistenti (`alert-box`, `alert-warn`, `alert-green`) invece delle reali (`alert`, `alert-warning`, `alert-success`) su 6 calcolatori (imu, pensione, prestito-personale, ferie-permessi, spese-acquisto-casa, straordinari): i box di stato risultato erano completamente privi di stile (verificato in browser: `background:transparent`, `padding:0`).
- `var(--text-secondary)`/`var(--text-primary)` mai definite in 4 pagine → sostituite con le variabili reali.
- Colori fuori palette: `#2563eb` (blu diverso da `var(--blue)`) in 5 pagine; scala BMI con "Sottopeso"/"Normopeso" identici per copia-incolla e accento indaco hardcoded in bmi.html.
- `.article-meta` bianco su sfondo ormai chiaro (illeggibile) in 10 pagine guida, non solo le 2 individuate dal campione dell'agente — verificato che il bug è identico verbatim su tutte e 10.
- Breadcrumb JSON-LD con due livelli che puntano allo stesso URL in guida-investire-10000-euro.html.
- `defer` mancante su `cookie-consent.js`/`analytics-events.js` in 45/59 pagine.

### `82ae576` — Bug funzionale scoperto in verifica diretta (non dagli agenti)
Testando in browser il fix del formato percentuale ho trovato che **la spiegazione "Formula" del calcolatore-percentuale.html non veniva mai scritta nel DOM**: la variabile JS era calcolata ma mai assegnata a nessun elemento, quindi il box restava bloccato sul placeholder statico per tutti e 4 i pannelli, sempre. Aggiunta la scrittura mancante.

### Verificato ma non serviva intervento
- Link Amazon (campione 2/10 via WebFetch): risolvono correttamente con tag affiliato `calcolapro-21`.
- Banner cookie: bottoni nativi `<button>`/`<a>`, navigabili da tastiera senza hack, nessun errore console.
- Formula rata mutuo: verificata a mano in browser (150.000€, 3%, 20 anni → 831,90€/mese, corretta) e via ammortamento francese generico.

---

## 🔴 Critico — richiede tua revisione (nessuna aliquota/soglia fiscale toccata da me)

Ho lasciato **tutti** i valori normativi/fiscali al tuo giudizio, come richiesto — anche quando un agente li segnava `safe_to_autofix: true`, perché toccano calcoli reali su cui gli utenti prendono decisioni finanziarie.

1. **`lordonetto.html`** (il calcolatore più usato del sito) — **due bug gravi indipendenti**:
   - Aliquota IRPEF secondo scaglione ferma al **35%** invece del **33%** (Legge di Bilancio 2026, L.199/2025, in vigore da gennaio 2026). Sovrastima l'IRPEF per chiunque abbia imponibile >28.000€.
   - Formula detrazione lavoro dipendente per la fascia 15.000-28.000€ strutturalmente sbagliata: a 28.000€ il sito calcola ~700€ di detrazione invece dei ~1.910€ corretti (TUIR art. 13) — quasi 1.200€ di detrazione "persa". Verificare anche se la base di calcolo debba essere il "reddito complessivo" e non la RAL lorda come fa ora il codice.
   - Lo stesso 35%→33% appare anche in: `calcolo-straordinari.html`, `calcolo-costo-lavoro.html`, `calcolo-cedolare-secca.html`, `calcolo-plusvalenza-immobiliare.html`, `calcolo-locazioni-brevi.html` — è sistemico, non isolato.

2. **`calcolatore-prestito-personale.html`** — Il "TAEG stimato" usa una formula lineare sbagliata (non IRR): risulta **sempre inferiore al TAN**, il che è finanziariamente impossibile per definizione normativa (Direttiva 2008/48/CE). Test: TAN 7,5% → TAEG mostrato 4,05%. Rischio concreto di indurre l'utente a sottostimare il costo di un prestito reale.

3. **`calcolo-prestazione-occasionale.html`** — **Doppio errore combinato**: (a) ripartizione contributi INPS Gestione Separata invertita (il sito addebita 2/3 al lavoratore, la norma prevede 1/3); (b) aliquota Gestione Separata ferma al 25,07% invece del 33,72% 2026. Insieme, l'importo dei contributi mostrato come "a tuo carico" è distorto in entrambe le direzioni.

4. **`calcolo-imu.html`** — Coefficienti catastali sbagliati per 3 categorie su 6: Negozi (C/1) usa 140 invece di 55; Laboratori (C/3) usa 80 invece di 140; Terreni agricoli usa 120 invece di 135/110. Errori di calcolo IMU fino al +150% per queste categorie. L'etichetta stessa ("coeff. 140, ridotto da 55") è internamente contraddittoria.

5. **`calcolo-bollo-auto.html`** — Formula moto priva di base normativa verificabile (coefficiente unico 1,27€/kW con uno split a 53kW che di fatto non fa nulla). Inoltre le tariffe auto 2,58/3,87€/kW valgono solo per veicoli Euro 4/5/6, ma il form non chiede la classe ambientale — per veicoli più vecchi l'importo mostrato è sottostimato fino al ~16%.

6. **`calcolo-isee.html`** — Franchigia prima casa ferma a 52.500€: la Legge di Bilancio 2026 l'ha portata a **91.500€** (120.000€ nei comuni capoluogo città metropolitana). Inoltre la franchigia patrimonio mobiliare (tetto 52.000€ nel codice) non trova conferma nelle fonti 2026 consultate (sembra un possibile refuso col valore della franchigia casa — le fonti indicano un tetto ben più basso, ~10.000€, da verificare su fonte INPS diretta).

7. **`mutuo.html`** — Il blocco FAQPage JSON-LD contiene 4 domande che **non compaiono da nessuna parte** nel contenuto visibile della pagina (la vera sezione FAQ visibile ne ha 8, completamente diverse). Viola le linee guida Google sui rich result e rischia la disattivazione del rich snippet.

8. **`js/cookie-consent.js` + `<head>` di tutte le pagine** — Confermato da **due agenti indipendenti** (Legale e Sicurezza): lo script `adsbygoogle.js` è incluso staticamente in ogni `<head>`, **prima** di qualunque consenso, e i blocchi `(adsbygoogle = window.adsbygoogle || []).push({})` accanto agli `<ins>` sono eseguiti al parsing della pagina, non dopo consenso. La funzione `loadAdsense()` in cookie-consent.js è di fatto morta (il commento nel codice stesso lo ammette). Questo è in tensione con quanto promesso in `privacy.html` ("AdSense solo dopo consenso marketing") e con le Linee guida cookie del Garante Privacy.

**Nota**: ho **volutamente non toccato** nessuno di questi 8 punti — sono o valori fiscali che richiedono conferma da fonte ufficiale, o modifiche architetturali (AdSense/consenso) che toccano una promessa esplicita fatta agli utenti.

---

## 🟠 Alto

- **`pensione.html`**: due tabelle di coefficienti di trasformazione INPS mostrate sulla stessa pagina con valori diversi tra loro (a 67 anni: 5,604% vs 6,281%) — solo una coincide con quella usata dal JS.
- **`partitaiva.html`**: coefficiente di redditività forfettario "Commercio" segnato 67% (in realtà quello di artigiani/manifattura); il vero coefficiente Commercio è 40%. Un e-commerce/negozio simulato con questo calcolatore vede imposte quasi raddoppiate.
- **`calcolo-naspi.html`**: soglia (1.352,19€) e massimale (1.550,42€) sono valori 2025, non 2026 (dovrebbero essere ~1.456,72€/1.584,70€ secondo Circolare INPS n.4/2026); inoltre la decorrenza del decalage 3% è impostata al 5° mese, mentre fonti secondarie indicano 6° mese per il 2026 (da confermare).
- **`calcolo-fondo-pensione.html`**: limite di deducibilità fermo a 5.164,57€, la Legge di Bilancio 2026 lo ha portato a 5.300€.
- **`calcolo-cedolare-secca.html`, `calcolo-plusvalenza-immobiliare.html`, `calcolo-locazioni-brevi.html`**: stesso 35%→33% IRPEF di lordonetto.html, qui usato per il confronto con l'aliquota sostitutiva — gonfia artificialmente il vantaggio dell'opzione sostitutiva/cedolare.
- **`mutuo.html`**: nessuna validazione input — tasso 0% viene silenziosamente sostituito col default (l'utente non se ne accorge), valore immobile 0 produce "LTV: Infinity%" a schermo, tasso negativo produce rata negativa senza errore. È il calcolatore più visitato del sito e l'unico del suo gruppo senza alcun controllo.
- **`calcolo-spese-acquisto-casa.html`**: se l'utente lascia a 0 la rendita catastale, il calcolo passa silenziosamente a tassare il prezzo pieno d'acquisto invece della rendita rivalutata — imposta di registro sovrastimata anche di 3-4 volte, senza alcun avviso.
- **Disclaimer "risultato indicativo"**: anche dopo il mio fix (ora presente in tutti i 37 calcolatori), l'agente Legale nota che dove esiste è testo piccolo (12px) grigio chiaro su sfondo scuro, molto meno prominente delle CTA di affiliazione circostanti — valutare se rinforzarlo ulteriormente.
- **Dicitura di affiliazione Amazon**: assente in modo contestuale vicino ai box `.amz-card` su tutte le pagine campionate; esiste solo in `disclaimer.html`/`termini.html`, raggiungibili dal footer di appena 26/61 pagine.

---

## 🟡 Medio

- `freelance.html`: aliquota Gestione Separata indicata 26,23% invece di 26,07% (solo nel testo, non nel calcolo).
- `lordonetto.html`: detrazione coniuge a carico sempre 800€ flat, invece della formula a scaglioni (800/690/decrescente) — la stessa pagina lo riconosce correttamente in FAQ ma il codice non la implementa.
- `calcolo-detrazioni-730.html`: tetto spese istruzione (800€) applicato al totale aggregato invece che per singolo studente, sottostimando la detrazione per famiglie con più figli; inoltre nessun riferimento al nuovo plafond 2026 per redditi oltre 75.000€ (art. 16-ter TUIR).
- `partitaiva.html`, e in generale molti calcolatori: nessuna validazione contro input negativi (solo l'attributo HTML `min`, bypassabile digitando a mano) — producono risultati negativi mostrati come validi, mai `NaN` a schermo ma comunque fuorvianti.
- `mutuo.html`: due sezioni H2 quasi duplicate sullo stesso argomento (ammortamento alla francese), probabile residuo di un merge di contenuti non consolidato.
- `index.html`: `guida-730-precompilato-2026.html` e `guida-bonus-casa-2026.html` assenti dalla sezione "Guide approfondite" (solo nel footer/cross-link) — persa visibilità su un argomento ad alta stagionalità.
- 8 guide su 11 hanno breadcrumb JSON-LD a 2 livelli mentre il markup HTML visibile ne mostra 3 (manca il livello "Guide") — incoerenza tra dato strutturato e pagina.
- `disclaimer.html` / `termini.html`: contenuti sostanzialmente duplicati (stesso disclaimer fiscale, stessa clausola Amazon) senza rimando reciproco chiaro.
- Link a `disclaimer.html` assente dal footer di 35/61 pagine, incluse `privacy.html` e `cookie.html` stesse.
- **`privacy.html`**: dichiara **"Netlify"** come hosting provider (righe 115, 136) — il sito è confermato su **GitHub Pages**. Inesattezza fattuale in un documento GDPR sui soggetti terzi che trattano dati. Non l'ho corretto io stesso perché è testo legale sostanziale, ma segnalo con urgenza perché è un fix quasi meccanico (basta sapere quale testo sostitutivo usare).
- `calcolo-imu.html` e simili: nessun clamp su "quota di possesso" (accetta >100%) o su aliquota comunale negativa.

---

## 🟢 Basso

- Esempi numerici nel testo SEO non coincidenti con l'output reale del calcolatore per gli stessi input: `calcolo-tfr-liquidazione.html` (~1.455€ di scarto), `mutuo.html` (~1.000€ di scarto sul totale interessi).
- `tfr.html`: pur essendo un redirect tecnicamente corretto (noindex+meta refresh+canonical), conserva ancora l'intero form e la funzione di calcolo duplicata nel body — nessun rischio di doppio risultato (formula identica), ma andrebbe svuotato per pulizia.
- `chilometrico.html`: due opzioni `<select>` ("Singola trasferta"/"Giornata") condividono lo stesso `value="1"`.
- `glossario-finanziario.html`: il JSON-LD `DefinedTermSet` copre solo 12 dei ~41 termini realmente presenti in pagina.
- `og-image.png`: 355KB, ottimizzabile sotto i 150KB senza perdita percepibile.
- Title tag oltre 75 caratteri su 9 pagine, meta description oltre 158 caratteri su circa 40 pagine su 59 — pattern sistemico, probabilmente scelta editoriale deliberata (CTR vs troncamento SERP), segnalo il dato aggregato senza 40 findings ripetitivi.
- Google Fonts caricato staticamente su 54/59 pagine nonostante un commento nel codice dica "solo dopo consenso" — rischio GDPR basso ma non nullo (precedente giurisprudenziale tedesco su IP transfer non consentito); considerare self-hosting dei font come miglioramento definitivo.
- Assenza di header di sicurezza HTTP (CSP/X-Frame-Options/Referrer-Policy): non configurabile su GitHub Pages puro. Alternative realistiche: meta tag (copertura parziale, niente X-Frame-Options) o un CDN proxy come Cloudflare gratuito davanti al dominio.
- Modale exit-intent su `mutuo.html`: `role="dialog"` senza gestione tastiera `Escape` né focus trap/restore.

---

## Valori normativi da verificare da fonte ufficiale (non assunti né corretti)

Aggregati dai 6 agenti Calcoli — nessuno di questi è stato toccato:

- **IRPEF 2026**: conferma definitiva 33% (vs 35%) sul secondo scaglione da testo Gazzetta Ufficiale/Agenzia Entrate.
- **Detrazione lavoro dipendente 2026**: formula esatta fascia 15.000-28.000€ e se applicabile su RAL o reddito complessivo; eventuale maggiorazione +65€ fascia 25.000-35.000€.
- **Coefficienti di trasformazione pensione INPS 2025-2027** per fascia 62-71 anni (quale delle due tabelle in pensione.html è quella reale).
- **NASpI 2026**: soglia/massimale esatti (Circolare INPS n.4/2026) e decorrenza decalage (5° o 6° mese).
- **Gestione Separata INPS 2026**: aliquota esatta non iscritti altra cassa (25,07% nel sito, fonti indicano 26,07% o 33,72% a seconda del contesto — dato discordante tra le fonti stesse, serve la circolare INPS n.8/2026 originale).
- **Indennità forfettaria mora D.Lgs. 231/2002**: fisso 40€ o scaglioni 40/70/100€ come nel sito — nessuna fonte primaria trovata a supporto degli scaglioni.
- **Tasso legale e tasso BCE mora**: aggiornamento al 2° semestre 2026 (1° semestre risulta 1,60% legale, 2,15% BCE, ma non riverificato a luglio 2026).
- **ISEE 2026**: franchigia patrimonio mobiliare (tetto reale, il sito ha 52.000€ ma sembra un refuso), franchigia prima casa (91.500€/120.000€ da confermare).
- **Fondo pensione 2026**: nuovo limite deducibilità 5.300€ e aliquota IRPEF 33% da confermare su testo di legge.
- **Detrazioni 730**: tetto spese veterinarie (550€ su base lorda o netta?), nuovo plafond redditi alti (art. 16-ter TUIR).
- **Bollo auto**: tariffe per classe ambientale Euro 0-3 vs Euro 4-6, tariffa motocicli.
- **Tariffe ACI rimborso chilometrico 2026** — il sito dichiara già "indicative", nessun errore netto ma non verificabile con precisione da fonte pubblica generalista.
- **IMU**: coefficiente ridotto 110 per coltivatori diretti/IAP sui terreni agricoli.

---

## 📋 Cosa devo fare io (il proprietario del sito)

1. **Revisionare e testare il branch `audit/full-site-review` in locale prima del merge su `main`.**
2. **Priorità assoluta**: far verificare i punti 🔴 Critico (soprattutto lordonetto.html, il calcolatore più usato) da fonte ufficiale o un commercialista prima di correggerli — sono calcoli su cui gli utenti prendono decisioni finanziarie reali.
3. **Decisione architetturale AdSense/consenso**: valutare come rimuovere lo script AdSense statico dall'`<head>` e farlo caricare solo dopo consenso marketing esplicito (tocca tutte le 59 pagine, coordinarsi eventualmente con chi ha configurato AdSense).
4. Correggere il riferimento a "Netlify" in `privacy.html` (righe 115, 136) con l'hosting reale (GitHub Pages) — è testo legale, quindi l'ho lasciato a te, ma è un fix quasi meccanico.
5. Google Search Console: verificare la proprietà, aggiornare la sitemap, controllare la copertura di indicizzazione.
6. Valutare con un professionista le lacune segnalate su Privacy Policy (duplicazione con Disclaimer, dicitura affiliazione non contestuale) prima di modificare i testi legali.
7. Confermare la dicitura esatta di affiliazione Amazon richiesta dal programma Associates e decidere se/come renderla più visibile vicino ai box prodotto.
8. Decidere se investire in un CDN proxy (es. Cloudflare gratuito) davanti a GitHub Pages per abilitare header di sicurezza HTTP reali (CSP, X-Frame-Options).
9. Valutare le decisioni di design soggettive segnalate (palette navy/oro alternativa in mutuo.html/lordonetto.html per i box affiliati, contenuto FAQPage di mutuo.html da riscrivere/sincronizzare).
10. Argomenti di contenuto suggeriti dall'agente SEO (facoltativo, non implementato): calcolatore tredicesima/quattordicesima standalone, guida/calcolatore successione ed eredità, cruscotto "busta paga completa" annuale.
11. Testare l'anteprima di condivisione (WhatsApp/social) di un paio di link.
