'use strict';

var express = require('express');
var router = express.Router();
var { isLoggedIn, isRistoratore } = require('../middleware/auth');
var ristoratoreCtrl = require('../controllers/ristoratoreController');
var { uploadFacilityImage } = require('../middleware/facilityUpload');

router.get('/gestione', isLoggedIn, isRistoratore, ristoratoreCtrl.getGestione);

router.post('/prenotazione/:id/aggiorna',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.postAggiornaPrenotazione
);

router.post('/domanda/:id/rispondi',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.validaRisposta,
  ristoratoreCtrl.postRispondi
);

router.post('/risposta/:id/modifica',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.validaRisposta,
  ristoratoreCtrl.postModificaRisposta
);

router.post('/risposta/:id/cancella',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.postCancellaRisposta
);

router.post('/struttura/:id/immagine',
  isLoggedIn, isRistoratore,
  uploadFacilityImage,
  ristoratoreCtrl.postAggiornaImmagineStruttura
);

router.post('/struttura/:id/immagine/elimina',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.postEliminaImmagineStruttura
);

router.post('/struttura/:id/servizi',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.postAggiornaServiziStruttura
);

router.post('/struttura/:id/dettagli',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.validaDettagliStruttura,
  ristoratoreCtrl.postAggiornaDettagliStruttura
);

router.post('/struttura/nuova',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.validaNuovaStruttura,
  ristoratoreCtrl.postNuovaStruttura
);

router.post('/struttura/:id/elimina',
  isLoggedIn, isRistoratore,
  ristoratoreCtrl.postEliminaStruttura
);

module.exports = router;
