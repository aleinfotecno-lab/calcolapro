import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

// Regressione NUMERICA dei calcolatori.
//
// Gli smoke test di calcolatori.spec.js verificano che una pagina si apra e che nel
// box risultato compaia qualcosa: non guardano il numero. Un errore di formula passa
// verde il giorno che lo si scrive e resta verde per sempre. Questi test invece
// fissano il numero: ogni caso di casi-numerici.json porta il valore che il
// calcolatore deve produrre e la norma da cui quel valore discende.
//
// Se un caso qui fallisce ci sono due sole spiegazioni, e vanno distinte prima di
// toccare qualcosa: o e' cambiata la norma, e allora si aggiorna il caso citando la
// fonte nuova, oppure una modifica ha rotto il calcolo, e allora si aggiusta il
// codice. Non si allinea mai il valore atteso a quello che il sito produce adesso:
// sarebbe come cancellare il test.

// Il progetto non e' un modulo ES, quindi niente import.meta: Playwright transpila
// questi file in CommonJS e __dirname resta disponibile.
const cartellaTest = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), 'tests');
const { casi } = JSON.parse(readFileSync(path.join(cartellaTest, 'casi-numerici.json'), 'utf8'));

// I risultati sono quasi tutti formattati all'italiana ("1.234,56 €"), ma non tutti:
// il BMI usa toFixed(1) e quindi il punto come separatore decimale. Senza virgola,
// un punto seguito da esattamente tre cifre e' un separatore delle migliaia
// ("23.106"), altrimenti e' decimale ("24.7"). Il segno meno davanti alle voci di
// costo si ignora: qui interessa la grandezza, non come viene mostrata.
function numeroDa(testo) {
  let s = String(testo).replace(/[^0-9,.-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

// 'annifa:3' -> data di 3 anni fa (piu' un mese di margine, per non finire
// esattamente sul confine di un anniversario mentre il test gira).
function risolviValore(v) {
  if (typeof v === 'string' && v.startsWith('annifa:')) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - parseInt(v.slice(7), 10));
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }
  return v;
}

for (const c of casi) {
  test(`${c.file.replace(/^\/|\.html$/g, '')} — ${c.caso}`, async ({ page }) => {
    const errori = [];
    page.on('pageerror', (e) => errori.push(e.message));

    await page.goto(c.file, { waitUntil: 'domcontentloaded' });

    const campi = {};
    for (const [id, v] of Object.entries(c.campi || {})) campi[id] = risolviValore(v);

    const mancanti = await page.evaluate(([campi, pre]) => {
      const assenti = [];
      for (const [id, v] of Object.entries(campi)) {
        const el = document.getElementById(id);
        if (!el) { assenti.push(id); continue; }
        if (el.type === 'checkbox') el.checked = v === true;
        else el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      for (const js of pre || []) eval(js);
      // eslint-disable-next-line no-undef
      calcola();
      return assenti;
    }, [campi, c.pre]);

    // Un campo sparito e' una regressione a sua volta: il caso starebbe misurando
    // un calcolatore diverso da quello che credeva di misurare.
    expect(mancanti, `campi non trovati nella pagina: ${mancanti.join(', ')}`).toEqual([]);

    // Casi di validazione: il calcolatore non deve inventare un risultato quando un
    // campo obbligatorio manca. Sostituire un campo vuoto con un valore di default
    // e' il bug che ha prodotto piu' rilievi in assoluto in questo audit.
    if (c.erroreSu) {
      const stato = await page.evaluate((campo) => {
        const input = document.getElementById(campo);
        const res = document.getElementById('result');
        return {
          segnalato: !!input && input.getAttribute('aria-invalid') === 'true',
          messaggio: (document.querySelector('.field.error .error-msg') || {}).textContent || '',
          risultatoVisibile: res ? res.style.display !== 'none' : false,
          nan: /NaN/.test(document.body.innerText),
        };
      }, c.erroreSu);
      expect(stato.segnalato, `il campo #${c.erroreSu} doveva essere segnalato come non valido`).toBe(true);
      expect(stato.messaggio.length, 'doveva comparire un messaggio di errore').toBeGreaterThan(0);
      expect(stato.risultatoVisibile, 'il box risultato non doveva comparire').toBe(false);
      expect(stato.nan, 'nessun NaN deve finire a schermo').toBe(false);
      expect(errori, `errori JS: ${errori.join('; ')}`).toEqual([]);
      return;
    }

    for (const [id, atteso] of Object.entries(c.attesi)) {
      const testo = await page.evaluate((i) => {
        const el = document.getElementById(i);
        return el ? el.textContent.trim() : null;
      }, id);
      expect(testo, `output #${id} assente`).not.toBeNull();

      if (typeof atteso === 'number') {
        expect(numeroDa(testo), `#${id} — ${c.norma}`).toBeCloseTo(Math.abs(atteso), 2);
      } else {
        expect(testo, `#${id} — ${c.norma}`).toBe(atteso);
      }
    }

    expect(errori, `errori JS: ${errori.join('; ')}`).toEqual([]);
  });
}
