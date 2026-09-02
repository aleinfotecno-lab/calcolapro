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
  const REGIONI={abruzzo:{n:"Abruzzo",s:[[1.67,0,28000],[2.87,28000,50000],[3.33,50000,null]]},basilicata:{n:"Basilicata",s:[[1.23,0,null]]},bolzano:{n:"Bolzano (prov. aut.)",s:[[1.23,0,28000],[1.23,28000,50000],[1.73,50000,null]],d:"detraz:430.50:90000"},calabria:{n:"Calabria",s:[[1.73,0,null]]},campania:{n:"Campania",s:[[1.73,0,15000],[2.96,15000,28000],[3.2,28000,50000],[3.33,50000,null]]},emiliaromagna:{n:"Emilia-Romagna",s:[[1.33,0,15000],[1.93,15000,28000],[2.78,28000,50000],[3.33,50000,null]]},friuliveneziagiulia:{n:"Friuli-Venezia Giulia",s:[[0.7,0,15000],[1.23,15000,28000],[1.23,28000,50000],[1.23,50000,null]],d:"piatta"},lazio:{n:"Lazio",s:[[1.73,0,15000],[3.33,15000,28000],[3.33,28000,50000],[3.33,50000,null]],d:"soglia:28000:1.73"},liguria:{n:"Liguria",s:[[1.23,0,28000],[3.18,28000,50000],[3.23,50000,null]]},lombardia:{n:"Lombardia",s:[[1.23,0,15000],[1.58,15000,28000],[1.72,28000,50000],[1.73,50000,null]]},marche:{n:"Marche",s:[[1.23,0,15000],[1.53,15000,28000],[1.7,28000,50000],[1.73,50000,null]]},molise:{n:"Molise",s:[[2.03,0,15000],[2.23,15000,28000],[3.63,28000,50000],[3.63,50000,null]]},piemonte:{n:"Piemonte",s:[[1.62,0,15000],[2.68,15000,28000],[3.31,28000,50000],[3.33,50000,null]]},puglia:{n:"Puglia",s:[[1.33,0,15000],[2.13,15000,28000],[3.23,28000,50000],[3.33,50000,null]]},sardegna:{n:"Sardegna",s:[[1.23,0,null]]},sicilia:{n:"Sicilia",s:[[1.23,0,null]]},toscana:{n:"Toscana",s:[[1.42,0,15000],[1.43,15000,28000],[3.32,28000,50000],[3.33,50000,null]]},trento:{n:"Trento (prov. aut.)",s:[[1.23,0,15000],[1.23,15000,28000],[1.23,28000,50000],[1.73,50000,null]],d:"deduz:30000"},umbria:{n:"Umbria",s:[[1.73,0,15000],[3.02,15000,28000],[3.12,28000,50000],[3.33,50000,null]],d:"soglia:28000:1.23"},valledaosta:{n:"Valle d'Aosta",s:[[0,0,15000],[1.23,15000,null]],d:"piatta"},veneto:{n:"Veneto",s:[[1.23,0,null]]}};
  function addizionaleRegionale(imponibile, codReg, aliqManuale) {
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
    let detrFamiglia=0;
    if(coniuge) detrFamiglia+=800;
    detrFamiglia+=figli*(950+(figli>=3?200:0));
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
    const addReg=addizionaleRegionale(imponibile, codReg, aliqReg);
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
