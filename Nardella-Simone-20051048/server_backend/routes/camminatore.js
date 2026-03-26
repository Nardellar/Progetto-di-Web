'use strict';

var express = require('express');
var router = express.Router();
var { isLoggedIn, isCamminatore } = require('../middleware/auth');
var camminatoreCtrl = require('../controllers/camminatoreController');

router.post('/struttura/:id/prenota',
  isLoggedIn, isCamminatore,
  camminatoreCtrl.validaPrenotazione,
  camminatoreCtrl.postPrenotazione
);

router.post('/struttura/:id/domanda',
  camminatoreCtrl.validaDomanda,
  camminatoreCtrl.postDomanda
);

router.get('/profilo', isLoggedIn, camminatoreCtrl.getProfilo);

module.exports = router;
