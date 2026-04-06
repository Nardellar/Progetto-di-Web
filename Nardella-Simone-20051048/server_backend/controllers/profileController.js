'use strict';

const fs = require('fs');
const path = require('path');
const { dbRun, dbGetUno, dbGetAll } = require('../db/helpers');
const { body, validationResult, matchedData } = require('express-validator');

const validaProfilo = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Il nome utente e obbligatorio')
    .isLength({ min: 3, max: 20 }).withMessage('Il nome utente deve avere tra 3 e 20 caratteri'),
  body('cognome')
    .trim()
    .notEmpty().withMessage('Il cognome e obbligatorio')
    .isLength({ min: 5, max: 30 }).withMessage('Il cognome deve avere tra 5 e 30 caratteri')
];

function normalizePersonName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((token) => token
      .split(/(['-])/)
      .map((part) => {
        if (part === '\'' || part === '-') return part;
        if (!part) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(''))
    .join(' ');
}

async function postAggiornaProfilo(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.redirect(`/profilo?errore=${encodeURIComponent(errors.array()[0].msg)}#profilo-info`);
  }

  const { nome, cognome } = matchedData(req);
  const normalizedNome = normalizePersonName(nome);
  const normalizedCognome = normalizePersonName(cognome);
  const vecchiaImmagine = req.user.immagine_profilo || null;
  const nuovaImmagine = req.file ? ('profiles/' + req.file.filename) : vecchiaImmagine;

  try {
    await dbRun(
      `UPDATE utenti
       SET nome = ?, cognome = ?, immagine_profilo = ?
       WHERE email = ?`,
      [normalizedNome, normalizedCognome, nuovaImmagine, req.user.email]
    );

    if (req.file && vecchiaImmagine && vecchiaImmagine.startsWith('profiles/')) {
      const oldFilePath = path.join(__dirname, '..', 'public', 'images', vecchiaImmagine);
      fs.unlink(oldFilePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Errore eliminazione vecchia immagine profilo:', err.message);
        }
      });
    }

    return res.redirect('/profilo?successo=Profilo aggiornato con successo#profilo-info');
  } catch (err) {
    console.error('Errore aggiornamento profilo:', err.message);
    return res.redirect('/profilo?errore=Errore durante l\'aggiornamento del profilo#profilo-info');
  }
}

async function getProfilo(req, res) {
  try {
    let ristoratoreStats = { pendingRequests: 0, domandeSenzaRisposta: 0 };

    if (req.user && req.user.role === 'ristoratore') {
      const pendingRow = await dbGetUno(
        `SELECT COUNT(*) AS total
         FROM prenotazioni br
         JOIN strutture f ON br.id_struttura = f.id
         WHERE f.email_ristoratore = ? AND br.status = 'pending'`,
        [req.user.email]
      );
      const questionsRow = await dbGetUno(
        `SELECT COUNT(DISTINCT q.id) AS total
         FROM domande q
         JOIN strutture f ON q.id_struttura = f.id
         LEFT JOIN risposte a ON a.id_domanda = q.id
         WHERE f.email_ristoratore = ? AND a.id IS NULL`,
        [req.user.email]
      );

      ristoratoreStats = {
        pendingRequests: pendingRow ? Number(pendingRow.total) : 0,
        domandeSenzaRisposta: questionsRow ? Number(questionsRow.total) : 0
      };
    }

    const prenotazioni = await dbGetAll(
      `SELECT br.*, f.nome AS nome_struttura, f.citta AS citta_struttura
       FROM prenotazioni br
       JOIN strutture f ON br.id_struttura = f.id
       WHERE br.email_camminatore = ?
       ORDER BY br.creato_il DESC`,
      [req.user.email]
    );

    const domande = await dbGetAll(
      `SELECT q.*, f.nome AS nome_struttura, f.id AS id_struttura_link
       FROM domande q
       JOIN strutture f ON q.id_struttura = f.id
       WHERE q.email_autore = ?
       ORDER BY q.creato_il DESC`,
      [req.user.email]
    );

    res.render('profilo', {
      title: 'Il mio profilo',
      prenotazioni: prenotazioni,
      domande: domande,
      ristoratoreStats: ristoratoreStats
    });
  } catch (err) {
    console.error('Errore profilo:', err.message);
    res.status(500).render('error', { message: 'Errore caricamento profilo', error: { status: 500 } });
  }
}

module.exports = {
  validaProfilo,
  postAggiornaProfilo,
  getProfilo,
  normalizePersonName
};


