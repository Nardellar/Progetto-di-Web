'use strict';

var express = require('express');
var router = express.Router();
var { isLoggedIn, isRistoratore } = require('../middleware/auth');
var ristoratoreCtrl = require('../controllers/ristoratoreController');

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

module.exports = router;
