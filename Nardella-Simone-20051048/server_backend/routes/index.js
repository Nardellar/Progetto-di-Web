var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title: 'Trekking UPO' });
});

router.get('/percorsi', function(req, res) {
  res.render('percorsi', { title: 'Percorsi' });
});

router.get('/registrazione', function(req, res) {
  res.render('registrazione', { title: 'Accedi o Registrati' });
});

router.get('/sentiero/via-degli-dei', function(req, res) {
  res.render('Via_degli_Dei', { title: 'Via degli Dei' });
});

router.get('/strutture', function(req, res) {
  res.render('strutture', { title: 'Strutture' });
});

router.get('/struttura/shg-hotel', function(req, res) {
  res.render('SHG_Hotel', { title: 'SHG Hotel' });
});

module.exports = router;
