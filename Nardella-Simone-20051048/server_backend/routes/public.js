'use strict';

var express = require('express');
var router = express.Router();
var { dbGetAll, dbGetUno } = require('../db/helpers');

var slugToView = {
  'via-degli-dei': 'Via_degli_Dei'
};

var facilityNameToView = {
  'SHG Hotel': 'SHG_Hotel'
};

router.get('/', async function (req, res, next) {
  try {
    const trails = await dbGetAll('SELECT * FROM trails ORDER BY id LIMIT 6');
    res.render('index', { title: 'Trekking UPO', trails: trails });
  } catch (err) {
    next(err);
  }
});

router.get('/percorsi', async function (req, res, next) {
  try {
    const trails = await dbGetAll('SELECT * FROM trails ORDER BY nome');
    res.render('percorsi', { title: 'Percorsi', trails: trails });
  } catch (err) {
    next(err);
  }
});

router.get('/sentiero/:slug', async function (req, res, next) {
  try {
    const trail = await dbGetUno('SELECT * FROM trails WHERE slug = ?', [req.params.slug]);
    if (!trail) return next();
    const facilities = await dbGetAll('SELECT * FROM facilities WHERE id_cammino = ?', [trail.id]);
    var viewName = slugToView[req.params.slug] || 'sentiero';
    res.render(viewName, { title: trail.nome, trail: trail, facilities: facilities });
  } catch (err) {
    next(err);
  }
});

router.get('/strutture', async function (req, res, next) {
  try {
    const facilities = await dbGetAll(
      `SELECT f.*, t.nome AS nome_cammino, t.slug AS slug_cammino
       FROM facilities f
       LEFT JOIN trails t ON f.id_cammino = t.id
       ORDER BY f.nome`
    );
    res.render('strutture', { title: 'Strutture', facilities: facilities });
  } catch (err) {
    next(err);
  }
});

router.get('/struttura/:id', async function (req, res, next) {
  try {
    const facility = await dbGetUno(
      `SELECT f.*, t.nome AS nome_cammino, t.slug AS slug_cammino
       FROM facilities f
       LEFT JOIN trails t ON f.id_cammino = t.id
       WHERE f.id = ?`,
      [req.params.id]
    );
    if (!facility) return next();
    const questions = await dbGetAll(
      `SELECT q.*, 
              (SELECT COUNT(*) FROM answers a WHERE a.id_domanda = q.id) AS num_risposte
       FROM questions q
       WHERE q.id_struttura = ?
       ORDER BY q.creato_il DESC`,
      [facility.id]
    );
    for (const q of questions) {
      q.answers = await dbGetAll(
        `SELECT a.*, u.nome AS nome_risponditore, u.cognome AS cognome_risponditore
         FROM answers a
         LEFT JOIN utenti u ON a.email_risponditore = u.email
         WHERE a.id_domanda = ?
         ORDER BY a.creato_il ASC`,
        [q.id]
      );
    }
    var viewName = facilityNameToView[facility.nome] || 'struttura';
    res.render(viewName, {
      title: facility.nome,
      facility: facility,
      questions: questions,
      successo: req.query.successo || null,
      errore: req.query.errore || null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/cerca', async function (req, res, next) {
  var q = (req.query.q || '').trim();
  if (!q) {
    return res.render('cerca', { title: 'Ricerca', query: '', trails: [], facilities: [] });
  }

  try {
    var like = '%' + q + '%';
    var trails = await dbGetAll(
      `SELECT * FROM trails
       WHERE nome LIKE ? OR citta_partenza LIKE ? OR citta_arrivo LIKE ?
             OR regione LIKE ? OR descrizione LIKE ?
       ORDER BY nome`,
      [like, like, like, like, like]
    );
    var facilities = await dbGetAll(
      `SELECT f.*, t.nome AS nome_cammino, t.slug AS slug_cammino
       FROM facilities f
       LEFT JOIN trails t ON f.id_cammino = t.id
       WHERE f.nome LIKE ? OR f.citta LIKE ? OR f.descrizione LIKE ?
             OR f.indirizzo LIKE ?
       ORDER BY f.nome`,
      [like, like, like, like]
    );
    res.render('cerca', { title: 'Ricerca: ' + q, query: q, trails: trails, facilities: facilities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
