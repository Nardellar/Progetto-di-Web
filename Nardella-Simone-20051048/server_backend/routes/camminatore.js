'use strict';

var express = require('express');
var router = express.Router();
var { isLoggedIn, isCamminatore } = require('../middleware/auth');
var { uploadProfileImage } = require('../middleware/profileUpload');
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

router.post('/domanda/:id/cancella',
  isLoggedIn,
  camminatoreCtrl.postCancellaDomanda
);

router.post('/profilo/aggiorna',
  isLoggedIn,
  uploadProfileImage,
  camminatoreCtrl.validaProfilo,
  camminatoreCtrl.postAggiornaProfilo
);

router.post('/struttura/:id/recensione',
  isLoggedIn, isCamminatore,
  camminatoreCtrl.validaRecensione,
  camminatoreCtrl.postRecensione
);

router.get('/profilo', isLoggedIn, camminatoreCtrl.getProfilo);

module.exports = router;
