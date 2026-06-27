# Google Search Console — Setup Checklist CalcolaPro

URL sito: https://calcolapro.it
Email: calcolapro@gmail.com
Sitemap: https://calcolapro.it/sitemap.xml

---

## FASE 1: Verifica Proprietà

### Metodo A: Tag HTML (consigliato — più veloce)
1. Vai su https://search.google.com/search-console/welcome
2. Accedi con l'account Google proprietario del sito
3. Sezione **"Prefisso URL"** → inserisci: `https://calcolapro.it`
4. Clicca "Continua"
5. Scegli **"Tag HTML"** come metodo di verifica
6. Copia il meta tag fornito — es: `<meta name="google-site-verification" content="CODICE_QUI" />`
7. Aprire `index.html` e aggiungere il meta tag nell'`<head>`, dopo gli altri meta tag
8. Pubblica: `git add index.html && git commit -m "GSC: add site verification" && git push origin main`
9. Attendi 5-10 minuti per la pubblicazione su GitHub Pages
10. Torna su GSC e clicca **"Verifica"**

### Metodo B: File HTML (alternativo)
1. In GSC, scegli verifica con **"File HTML"**
2. Scarica il file `google[CODICE].html` fornito da Google
3. Copialo nella root del repository (stessa cartella di `index.html`)
4. Pubblica su GitHub Pages (git add, commit, push)
5. Torna su GSC e clicca **"Verifica"**

### Metodo C: DNS TXT (se hai accesso DNS — più stabile)
1. In GSC, scegli **"Proprietà dominio"** e inserisci: `calcolapro.it`
2. Copia il record TXT fornito — es: `google-site-verification=XXXXXX`
3. Vai nel pannello DNS del provider del dominio (Aruba, Register.it, Namecheap…)
4. Aggiungi un record **TXT** per `@` (root) con il valore copiato
5. Attendi 24-48h per la propagazione DNS
6. Torna su GSC e clicca **"Verifica"**

---

## FASE 2: Caricare la Sitemap

1. In GSC → menu sinistro → **Sitemaps**
2. Nel campo "Aggiungi una nuova sitemap", inserisci: `sitemap.xml`
3. Clicca **"Invia"**
4. Stato atteso: **"Successo"** — GSC mostrerà il numero di URL (deve essere ~39)
5. Se mostra errori: verificare che `https://calcolapro.it/sitemap.xml` sia raggiungibile
6. Ritorna dopo 24-48h per vedere quante URL ha scoperto e indicizzato

---

## FASE 3: Request Indexing — 10 Pagine Prioritarie

Per ogni URL: GSC → **Ispeziona URL** → incolla l'URL → clicca **"Richiedi indicizzazione"**

1. `https://calcolapro.it/`
2. `https://calcolapro.it/mutuo.html`
3. `https://calcolapro.it/lordonetto.html`
4. `https://calcolapro.it/calcolatore-prestito-personale.html`
5. `https://calcolapro.it/calcolatore-interessi-conto-deposito.html`
6. `https://calcolapro.it/guida-conto-deposito-2026.html`
7. `https://calcolapro.it/guida-bonus-casa-2026.html`
8. `https://calcolapro.it/freelance.html`
9. `https://calcolapro.it/pensione.html`
10. `https://calcolapro.it/guida-pensione-anticipata-2026.html`

> **Limite Google:** max 10-15 richieste/giorno. Distribuire su 2 giorni se necessario.

---

## FASE 4: Collegare GSC a Google Analytics 4

1. In **GA4**: Admin (rotella) → Connessioni ai prodotti → **Search Console**
2. Clicca **"Collega"**
3. Seleziona la proprietà GSC `calcolapro.it`
4. Conferma il collegamento
5. Dopo 48h, in GA4 apparirà il report **"Search Console"** con le query organiche

---

## FASE 5: Alert Email per Errori

1. In GSC: **Impostazioni** (ingranaggio) → Preferenze email
2. Attiva notifiche per:
   - ✅ Errori di copertura (pagine non indicizzate per errori)
   - ✅ Problemi di usabilità mobile
   - ✅ Aggiornamenti manuali (penalizzazioni)
3. Email per notifiche: `calcolapro@gmail.com`

---

## MONITORAGGIO SETTIMANALE (ogni lunedì — 15 minuti)

- [ ] GSC → **Rendimento** → Verifica click e impression ultima settimana
- [ ] GSC → **Copertura** → Cerca nuovi errori (pagine escluse o con errore)
- [ ] GSC → **Core Web Vitals** → Verifica LCP, FID, CLS
- [ ] GA4 → **Real-time** → Controlla eventi custom attivi
- [ ] GA4 → **Acquisizione** → Canali → Controlla traffico organico vs. settimana precedente

---

## QUERY TARGET DA MONITORARE IN GSC

Una volta verificato, in GSC → Rendimento filtra queste query per verificare posizionamento:

| Query | Volume stimato | Target posizione |
|-------|---------------|-----------------|
| calcolo mutuo | 2.400/mese | Top 10 |
| calcolo rata mutuo | 1.900/mese | Top 10 |
| stipendio netto calcolo | 1.200/mese | Top 20 |
| lordo netto | 3.500/mese | Top 20 |
| conto deposito 2026 | 800/mese | Top 10 |
| calcolo cedolare secca | 600/mese | Top 5 |
| calcolo tfr | 700/mese | Top 10 |
| calcolo pensione | 1.100/mese | Top 20 |
| bonus casa 2026 | 500/mese | Top 10 |
| 730 precompilato 2026 | 2.800/mese | Top 20 |
| calcolo isee | 1.800/mese | Top 20 |
| tariffa oraria freelance | 400/mese | Top 10 |

---

## NEXT STEPS DOPO VERIFICA

1. **Settimana 1**: Verifica sito, invia sitemap, request indexing 10 pagine prioritarie
2. **Settimana 2**: Verifica indexing (GSC → Copertura), controlla eventuali errori
3. **Settimana 3**: Analizza prime query in Rendimento, identifica pagine con posizione 4-20
4. **Mese 1**: Ottimizza le pagine con posizione 4-20 (aggiorna contenuto, aggiungi schema markup)
