/* Busta paga — il motore condiviso del calcolo lordo/netto.

   Stava dentro lordonetto.html. La stessa logica era ricopiata in
   calcolo-costo-lavoro.html, e la copia si e' scostata: la detrazione dell'art. 13
   TUIR veniva parametrata sulla RAL invece che sull'imponibile, in tutte e due le
   pagine e per mesi. Una funzione sola in un file solo toglie di mezzo la classe
   di errore, e permette all'hero della home di mostrare esattamente il numero che
   produce il calcolatore invece di una cifra decorativa.

   Chi la usa: lordonetto.html (con regione e addizionali) e index.html (hero,
   senza addizionali locali, e la pagina lo dichiara al lettore). */
(function (glob) {
  'use strict';
  // Aliquote 2026: Dipartimento delle Finanze. Modalita' di calcolo e deroghe: Agenzia
  // delle Entrate, istruzioni di liquidazione del mod. 730/2026, Allegato C par. 19.24.3.1.
  // Di regola gli scaglioni sono progressivi come l'IRPEF; sei fra regioni e province
  // autonome fanno eccezione e sono marcate con 'd'.
  const REGIONI={abruzzo:{n:"Abruzzo",s:[[1.67,0,28000],[2.87,28000,50000],[3.33,50000,null]]},basilicata:{n:"Basilicata",s:[[1.23,0,null]]},bolzano:{n:"Bolzano (prov. aut.)",s:[[1.23,0,28000],[1.23,28000,50000],[1.73,50000,null]],d:"detraz:430.50:90000",dcresc:[125,50000,25000],dfam:[340,1,90000]},calabria:{n:"Calabria",s:[[1.73,0,null]]},campania:{n:"Campania",s:[[1.73,0,15000],[2.96,15000,28000],[3.2,28000,50000],[3.33,50000,null]],dfam:[30,2,28000]},emiliaromagna:{n:"Emilia-Romagna",s:[[1.33,0,15000],[1.93,15000,28000],[2.78,28000,50000],[3.33,50000,null]]},friuliveneziagiulia:{n:"Friuli-Venezia Giulia",s:[[0.7,0,15000],[1.23,15000,28000],[1.23,28000,50000],[1.23,50000,null]],d:"piatta"},lazio:{n:"Lazio",s:[[1.73,0,15000],[3.33,15000,28000],[3.33,28000,50000],[3.33,50000,null]],d:"soglia:28000:1.73",df:[60,28000,30000]},liguria:{n:"Liguria",s:[[1.23,0,28000],[3.18,28000,50000],[3.23,50000,null]]},lombardia:{n:"Lombardia",s:[[1.23,0,15000],[1.58,15000,28000],[1.72,28000,50000],[1.73,50000,null]]},marche:{n:"Marche",s:[[1.23,0,15000],[1.53,15000,28000],[1.7,28000,50000],[1.73,50000,null]]},molise:{n:"Molise",s:[[2.03,0,15000],[2.23,15000,28000],[3.63,28000,50000],[3.63,50000,null]]},piemonte:{n:"Piemonte",s:[[1.62,0,15000],[2.68,15000,28000],[3.31,28000,50000],[3.33,50000,null]],dfam:[100,3,null]},puglia:{n:"Puglia",s:[[1.33,0,15000],[2.13,15000,28000],[3.23,28000,50000],[3.33,50000,null]]},sardegna:{n:"Sardegna",s:[[1.23,0,null]]},sicilia:{n:"Sicilia",s:[[1.23,0,null]]},toscana:{n:"Toscana",s:[[1.42,0,15000],[1.43,15000,28000],[3.32,28000,50000],[3.33,50000,null]]},trento:{n:"Trento (prov. aut.)",s:[[1.23,0,15000],[1.23,15000,28000],[1.23,28000,50000],[1.73,50000,null]],d:"deduz:30000",dfam:[246,1,50000]},umbria:{n:"Umbria",s:[[1.73,0,15000],[3.02,15000,28000],[3.12,28000,50000],[3.33,50000,null]],d:"soglia:28000:1.23",df:[150,28000,50000]},valledaosta:{n:"Valle d'Aosta",s:[[0,0,15000],[1.23,15000,null]],d:"piatta"},veneto:{n:"Veneto",s:[[1.23,0,null]]}};
  function addizionaleRegionale(imponibile, codReg, aliqManuale, figli) {
    const r = REGIONI[codReg];
    if (!r) return imponibile * (aliqManuale || 0) / 100;   // nessuna regione scelta: aliquota digitata
    const d = r.d || '';
    if (d.startsWith('deduz:')) {                            // Trento: sotto la soglia la base e' zero
      if (imponibile <= parseFloat(d.slice(6))) return 0;
    }
    if (d.startsWith('soglia:')) {                           // Umbria, Lazio: sotto la soglia aliquota unica
      const [, lim, al] = d.split(':');
      if (imponibile <= parseFloat(lim)) return imponibile * parseFloat(al) / 100;
    }
    let imposta;
    if (d === 'piatta') {                                    // Friuli, Valle d'Aosta: niente progressivita'
      const s = r.s.find(x => imponibile > x[1] && (x[2] === null || imponibile <= x[2])) || r.s[r.s.length - 1];
      imposta = imponibile * s[0] / 100;
    } else {                                                 // regola generale: scaglioni progressivi
      imposta = r.s.reduce((tot, x) => tot + Math.max(0, Math.min(imponibile, x[2] === null ? Infinity : x[2]) - x[1]) * x[0] / 100, 0);
    }
    // Bolzano: la detrazione di 430,50 euro spetta solo a chi ha un imponibile non
    // superiore a 90.000 euro (art. 21/sexiesdecies L.P. 9/1998). Prima veniva
    // sottratta a chiunque, e sopra quella soglia regalava 430,50 euro di netto.
    if (d.startsWith('detraz:')) {
      const [, importo, tetto] = d.split(':');
      if (!tetto || imponibile <= parseFloat(tetto)) imposta -= parseFloat(importo);
    }
    // Bolzano, lettera b): oltre i 50.000 di imponibile spetta una seconda detrazione,
    // che invece di dissolversi col reddito cresce insieme a lui: 125 euro moltiplicati
    // per il rapporto fra l imponibile diminuito di 50.000 e 25.000, fino a un massimo
    // di 125 euro. Attutisce il salto all 1,73% che scatta esattamente a quella soglia.
    // Si cumula con la lettera a) e con quella per figli - il MEF scrive che le
    // detrazioni sono cumulabili ma non generano credito d imposta, e a garantirlo e il
    // Math.max(0, ...) in fondo alla funzione.
    if (r.dcresc) {
      const [massimo, soglia, divisore] = r.dcresc;
      if (imponibile > soglia) imposta -= Math.min(massimo, massimo * (imponibile - soglia) / divisore);
    }
    // Detrazione a fascia di reddito: Lazio 60 euro fra 28.001 e 30.000 (art. 2 c. 3
    // L.R. 20 del 31/12/2025), Umbria 150 fra 28.001 e 50.000 (art. 1 L.R. 2/2025).
    // La norma scrive 28.001 perche' la liquidazione lavora su euro interi: 'oltre
    // 28.000' e 'da 28.001' sono la stessa cosa, e prendere il limite alla lettera
    // lascerebbe scoperto chi ha un imponibile con i centesimi. Sotto la soglia non
    // si arriva qui: quel ramo esce prima con l'aliquota unica.
    if (r.df) {
      const [importo, oltre, finoA] = r.df;
      if (imponibile > oltre && imponibile <= finoA) imposta -= importo;
    }
    // Detrazione per carichi di famiglia, dove la regione la prevede. dfam porta
    // importo per figlio, numero minimo di figli perche spetti e tetto di imponibile
    // (null = nessun tetto). Bolzano da 340 euro per figlio fino a 90.000 di
    // imponibile e Trento 246 fino a 50.000, entrambe dal primo figlio; Campania da
    // 30 euro per figlio ma solo a chi ha almeno due figli e fino a 28.000, Piemonte
    // 100 euro per figlio solo a chi ha piu di due figli e senza alcun tetto di
    // reddito. Quando la condizione scatta la detrazione vale per ciascun figlio a
    // partire dal primo, non solo per quelli oltre il minimo.
    // Fonte: MEF, disposizioni particolari per regione, pubblicate il 22 e il 29
    // gennaio 2026. Le norme dicono tutte in proporzione alla percentuale e ai mesi
    // di carico: qui si assume carico intero per dodici mesi, come fa il resto del
    // calcolatore. Trento sotto i 30.000 non arriva fin qui perche il ramo deduz:
    // esce prima con zero, ed e corretto: la detrazione non genera credito d imposta.
    if (r.dfam && figli > 0) {
      const [importo, minFigli, tetto] = r.dfam;
      if (figli >= minFigli && (tetto === null || imponibile <= tetto)) imposta -= importo * figli;
    }
    return Math.max(0, imposta);
  }
  function bustaPaga(lordo, figli, coniuge, aliqReg, aliqCom, codReg) {
    // Art. 3-ter D.L. 384/1992: sulla quota di retribuzione oltre la prima fascia
    // di retribuzione pensionabile grava un ulteriore 1% a carico del lavoratore.
    // Per il 2026 la soglia e' 56.224 euro (circolare INPS 6 del 30/01/2026).
    const PRIMA_FASCIA=56224;
    const inps=lordo*0.0919+Math.max(0,lordo-PRIMA_FASCIA)*0.01;
    const imponibile=lordo-inps;
    let irpefLorda=0;
    if(imponibile<=28000) irpefLorda=imponibile*0.23;
    else if(imponibile<=50000) irpefLorda=28000*0.23+(imponibile-28000)*0.33;
    else irpefLorda=28000*0.23+22000*0.33+(imponibile-50000)*0.43;
    // Art. 13 c.1 TUIR: la detrazione e' parametrata sul REDDITO COMPLESSIVO, non sulla
    // retribuzione lorda. Per un dipendente senza altri redditi il reddito complessivo
    // coincide con l'imponibile fiscale, perche' l'art. 51 c.2 lett. a) tiene fuori dal
    // reddito i contributi previdenziali obbligatori. Usare il lordo sbagliava anche lo
    // scaglione: con RAL 30.000 applicava la lettera c) al posto della b), e appena sopra
    // i 15.000 di RAL produceva detrazioni oltre il massimo di legge.
    // Art. 13 c.6: il risultato del rapporto si assume nelle prime quattro cifre decimali.
    const tronca4=x=>Math.trunc(x*10000)/10000;
    let detrLavoro=0;
    if(imponibile<=15000) detrLavoro=1955;
    else if(imponibile<=28000) detrLavoro=1910+1190*tronca4((28000-imponibile)/13000);
    else if(imponibile<=50000) detrLavoro=1910*tronca4((50000-imponibile)/22000);
    // Art. 12 TUIR, detrazioni per carichi di famiglia. Testo vigente dal 20/12/2025,
    // letto su Normattiva. Il calcolo dava per buone due cose che la norma non dice:
    // che la detrazione per figli fosse un importo fisso - decresce col reddito fino ad
    // azzerarsi - e che i 200 euro in piu' per chi ha piu' di tre figli spettassero
    // ancora, mentre il periodo che li prevedeva e' SOPPRESSO dal D.Lgs. 230/2021, il
    // decreto dell'assegno unico. Il coniuge valeva 800 euro a chiunque: sono 800 solo
    // sotto i 15.000 di reddito, 690 fino a 40.000, poi si dissolvono e sopra gli 80.000
    // non spetta piu' niente.
    // Il comma 4 detta i casi limite dei rapporti e impone di assumerli nelle prime
    // quattro cifre decimali, come il comma 6 dell'art. 13.
    // Il reddito complessivo di un dipendente senza altri redditi coincide con
    // l'imponibile fiscale, per la ragione gia' spiegata sopra a proposito dell'art. 13.
    let detrFamiglia=0;
    if(coniuge){
      let dc=0;
      if(imponibile<=15000){
        const rap=imponibile/15000;                      // lett. a) n. 1
        dc = rap===1 ? 690 : (rap===0 ? 0 : 800-110*tronca4(rap));
      }
      else if(imponibile<=40000) dc=690;                 // lett. a) n. 2
      else if(imponibile<=80000){
        const rap=(80000-imponibile)/40000;              // lett. a) n. 3
        dc = rap===0 ? 0 : 690*tronca4(rap);
      }
      // lett. b): cinque maggiorazioni a gradino, fra 29.000 e 35.200 di reddito.
      const magg=[[29000,29200,10],[29200,34700,20],[34700,35000,30],[35000,35100,20],[35100,35200,10]]
        .find(f=>imponibile>f[0]&&imponibile<=f[1]);
      if(dc>0&&magg) dc+=magg[2];
      detrFamiglia+=dc;
    }
    if(figli){
      // lett. c): 950 euro per ogni figlio fra i 21 e i 30 anni, ridotti in proporzione
      // al rapporto fra 95.000 diminuito del reddito complessivo e 95.000. Con piu'
      // figli i 95.000 salgono di 15.000 per ogni figlio successivo al primo. Comma 4:
      // se il rapporto e' zero, negativo o uguale a uno la detrazione non compete.
      const tetto=95000+15000*(figli-1);
      const rap=(tetto-imponibile)/tetto;
      if(rap>0&&rap<1) detrFamiglia+=950*figli*tronca4(rap);
    }
    // Taglio del cuneo fiscale — L. 207/2024 art. 1 commi 4-9, misura strutturale.
    // a) somma esente (non imponibile) per reddito fino a 20.000 €
    let sommaEsente=0;
    if(imponibile<=20000){
      const aliqBonus = imponibile<=8500 ? 0.071 : (imponibile<=15000 ? 0.053 : 0.048);
      sommaEsente = imponibile*aliqBonus;
    }
    // b) ulteriore detrazione: 1.000 € fino a 32.000 €, poi decresce fino ad azzerarsi a 40.000 €
    let ulterioreDetr=0;
    if(imponibile>20000 && imponibile<=32000) ulterioreDetr=1000;
    else if(imponibile>32000 && imponibile<=40000) ulterioreDetr=1000*(40000-imponibile)/8000;
    const addReg=addizionaleRegionale(imponibile, codReg, aliqReg, figli);
    const addCom=imponibile*aliqCom/100;
    const irpefNetta=Math.max(0,irpefLorda-detrLavoro-detrFamiglia-ulterioreDetr)+addReg+addCom;
    const netto=lordo-inps-irpefNetta+sommaEsente;
    return {lordo:lordo, inps:inps, imponibile:imponibile, irpefNetta:irpefNetta,
            sommaEsente:sommaEsente, ulterioreDetr:ulterioreDetr, netto:netto};
  }

  glob.CalcolaPro = glob.CalcolaPro || {};
  glob.CalcolaPro.bustaPaga = bustaPaga;
  glob.CalcolaPro.addizionaleRegionale = addizionaleRegionale;
  glob.CalcolaPro.REGIONI = REGIONI;
  // le pagine che avevano queste funzioni inline continuano a chiamarle per nome
  glob.bustaPaga = bustaPaga;
  glob.addizionaleRegionale = addizionaleRegionale;
  glob.REGIONI = REGIONI;
})(window);
