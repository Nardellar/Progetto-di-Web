'use strict';

const fs = require('fs');
const path = require('path');
const { dbRun, dbGetUno, dbGetAll } = require('../db/helpers');
const { body, validationResult, matchedData } = require('express-validator');

//Check prenotazioni
const validaPrenotazione = [
  body('check_in')
    .notEmpty().withMessage('Data check-in obbligatoria')
    .isDate().withMessage('Data check-in non valida'),
  body('check_out')
    .notEmpty().withMessage('Data check-out obbligatoria')
    .isDate().withMessage('Data check-out non valida'),
  body('numero_ospiti')
    .notEmpty().withMessage('Numero ospiti obbligatorio')
    .isInt({ min: 1, max: 10 }).withMessage('Numero ospiti tra 1 e 10')
];

// Check domanda: nome obbligatorio solo per ospiti non autenticati (nessun campo email nel form)
const validaDomanda = [
  body('nome_autore')
    .if((_value, { req }) => !req.user)
    .trim()
    .notEmpty().withMessage('Il nome è obbligatorio'),
  body('testo')
    .trim().notEmpty().withMessage('La domanda non può essere vuota')
    .isLength({ max: 2000 }).withMessage('Domanda troppo lunga (max 2000 caratteri)')
];

const validaRecensione = [
  body('voto')
    .notEmpty().withMessage('Seleziona un voto da 1 a 5 stelle')
    .isInt({ min: 1, max: 5 }).withMessage('Il voto deve essere compreso tra 1 e 5'),
  body('testo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1500 }).withMessage('Recensione troppo lunga (max 1500 caratteri)')
];

const validaProfilo = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Il nome utente è obbligatorio')
    .isLength({ min: 2, max: 80 }).withMessage('Il nome utente deve avere tra 2 e 80 caratteri'),
  body('cognome')
    .trim()
    .notEmpty().withMessage('Il cognome è obbligatorio')
    .isLength({ min: 2, max: 80 }).withMessage('Il cognome deve avere tra 2 e 80 caratteri')
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

function getRedirectTarget(rawValue, fallbackPath) {
  const value = (rawValue || '').trim();
  if (value.startsWith('/struttura/') || value === '/profilo') {
    return value;
  }
  return fallbackPath;
}


async function postPrenotazione(req, res) {
  const errors = validationResult(req);
  const idStruttura = req.params.id;
  const bookingAnchor = '#booking-section';

  if (!errors.isEmpty()) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(errors.array()[0].msg)}${bookingAnchor}`);
  }

  const { check_in, check_out, numero_ospiti } = matchedData(req);

  if (new Date(check_in) < new Date().setHours(0, 0, 0, 0)) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Il check-in non può essere nel passato')}${bookingAnchor}`);
  }
  if (new Date(check_out) < new Date(check_in)) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Il check-out deve essere dopo il check-in')}${bookingAnchor}`);
  }

  try {
    const facility = await dbGetUno('SELECT * FROM facilities WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    if (parseInt(numero_ospiti) > facility.capacita && facility.capacita > 0) {
      return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(`Capacità massima: ${facility.capacita} ospiti`)}${bookingAnchor}`);
    }

    await dbRun(
      `INSERT INTO booking_requests (id_struttura, email_camminatore, check_in, check_out, numero_ospiti)
       VALUES (?, ?, ?, ?, ?)`,
      [idStruttura, req.user.email, check_in, check_out, numero_ospiti]
    );

    res.redirect(`/struttura/${idStruttura}?successo=${encodeURIComponent('Richiesta di prenotazione inviata!')}${bookingAnchor}`);
  } catch (err) {
    console.error('Errore prenotazione:', err.message);
    res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Errore durante la prenotazione')}${bookingAnchor}`);
  }
}

async function postDomanda(req, res) {
  const errors = validationResult(req);
  const idStruttura = req.params.id;
  const qaAnchor = '#qa-section';

  if (!errors.isEmpty()) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(errors.array()[0].msg)}${qaAnchor}`);
  }

  const { nome_autore, testo } = matchedData(req);

  try {
    const facility = await dbGetUno('SELECT * FROM facilities WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    if (
      req.user &&
      req.user.role === 'ristoratore' &&
      facility.email_ristoratore === req.user.email
    ) {
      return res.redirect(
        `/struttura/${idStruttura}?errore=${encodeURIComponent('Non puoi inviare domande alla tua struttura.')}${qaAnchor}`
      );
    }

    await dbRun(
      `INSERT INTO questions (id_struttura, nome_autore, email_autore, testo)
       VALUES (?, ?, ?, ?)`,
      [
        idStruttura,
        req.user ? (normalizePersonName(req.user.nome) + ' ' + normalizePersonName(req.user.cognome)) : normalizePersonName(nome_autore),
        req.user ? req.user.email : null,
        testo
      ]
    );

    res.redirect(`/struttura/${idStruttura}?successo=${encodeURIComponent('Domanda inviata!')}${qaAnchor}`);
  } catch (err) {
    console.error('Errore domanda:', err.message);
    res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Errore durante l\'invio della domanda')}${qaAnchor}`);
  }
}

async function postCancellaDomanda(req, res) {
  const idDomanda = req.params.id;
  const redirectTarget = getRedirectTarget(req.body.redirect_to, '/profilo');
  const anchor = redirectTarget === '/profilo' ? '#profilo-domande' : '#qa-section';

  try {
    const domanda = await dbGetUno(
      'SELECT id, email_autore FROM questions WHERE id = ?',
      [idDomanda]
    );

    if (!domanda) {
      return res.redirect(
        `${redirectTarget}?errore=${encodeURIComponent('Domanda non trovata')}${anchor}`
      );
    }

    if (!domanda.email_autore || domanda.email_autore !== req.user.email) {
      return res.redirect(
        `${redirectTarget}?errore=${encodeURIComponent('Non puoi cancellare questa domanda')}${anchor}`
      );
    }

    await dbRun('DELETE FROM answers WHERE id_domanda = ?', [idDomanda]);
    await dbRun('DELETE FROM questions WHERE id = ?', [idDomanda]);

    return res.redirect(
      `${redirectTarget}?successo=${encodeURIComponent('Domanda cancellata con successo')}${anchor}`
    );
  } catch (err) {
    console.error('Errore cancellazione domanda:', err.message);
    return res.redirect(
      `${redirectTarget}?errore=${encodeURIComponent('Errore durante la cancellazione della domanda')}${anchor}`
    );
  }
}

async function postRecensione(req, res) {
  const errors = validationResult(req);
  const idStruttura = req.params.id;
  const reviewsAnchor = '#reviews-section';

  if (!errors.isEmpty()) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(errors.array()[0].msg)}${reviewsAnchor}`);
  }

  const { voto, testo } = matchedData(req);

  try {
    const facility = await dbGetUno('SELECT id FROM facilities WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    const prenotazionePassata = await dbGetUno(
      `SELECT id
       FROM booking_requests
       WHERE id_struttura = ?
         AND email_camminatore = ?
         AND status = 'accepted'
         AND date(check_out) < date('now')
       LIMIT 1`,
      [idStruttura, req.user.email]
    );

    if (!prenotazionePassata) {
      return res.redirect(
        `/struttura/${idStruttura}?errore=${encodeURIComponent('Puoi recensire questa struttura solo dopo un soggiorno completato')}${reviewsAnchor}`
      );
    }

    const esistente = await dbGetUno(
      'SELECT id FROM reviews WHERE id_struttura = ? AND email_camminatore = ?',
      [idStruttura, req.user.email]
    );

    if (esistente) {
      await dbRun(
        `UPDATE reviews
         SET voto = ?, testo = ?, creato_il = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [voto, testo || null, esistente.id]
      );
      return res.redirect(
        `/struttura/${idStruttura}?successo=${encodeURIComponent('Recensione aggiornata con successo')}${reviewsAnchor}`
      );
    }

    await dbRun(
      `INSERT INTO reviews (id_struttura, email_camminatore, voto, testo)
       VALUES (?, ?, ?, ?)`,
      [idStruttura, req.user.email, voto, testo || null]
    );

    return res.redirect(
      `/struttura/${idStruttura}?successo=${encodeURIComponent('Recensione pubblicata con successo')}${reviewsAnchor}`
    );
  } catch (err) {
    console.error('Errore recensione:', err.message);
    return res.redirect(
      `/struttura/${idStruttura}?errore=${encodeURIComponent('Errore durante la pubblicazione della recensione')}${reviewsAnchor}`
    );
  }
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
    let ristoratoreStats = { pendingRequests: 0, questions: 0 };

    if (req.user && req.user.role === 'ristoratore') {
      const pendingRow = await dbGetUno(
        `SELECT COUNT(*) AS total
         FROM booking_requests br
         JOIN facilities f ON br.id_struttura = f.id
         WHERE f.email_ristoratore = ? AND br.status = 'pending'`,
        [req.user.email]
      );
      const questionsRow = await dbGetUno(
        `SELECT COUNT(DISTINCT q.id) AS total
         FROM questions q
         JOIN facilities f ON q.id_struttura = f.id
         LEFT JOIN answers a ON a.id_domanda = q.id
         WHERE f.email_ristoratore = ? AND a.id IS NULL`,
        [req.user.email]
      );

      ristoratoreStats = {
        pendingRequests: pendingRow ? Number(pendingRow.total) : 0,
        questions: questionsRow ? Number(questionsRow.total) : 0
      };
    }

    const prenotazioni = await dbGetAll(
      `SELECT br.*, f.nome AS nome_struttura, f.citta AS citta_struttura
       FROM booking_requests br
       JOIN facilities f ON br.id_struttura = f.id
       WHERE br.email_camminatore = ?
       ORDER BY br.creato_il DESC`,
      [req.user.email]
    );

    const domande = await dbGetAll(
      `SELECT q.*, f.nome AS nome_struttura, f.id AS id_struttura_link
       FROM questions q
       JOIN facilities f ON q.id_struttura = f.id
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
  validaPrenotazione,
  validaDomanda,
  validaRecensione,
  validaProfilo,
  postPrenotazione,
  postDomanda,
  postCancellaDomanda,
  postRecensione,
  postAggiornaProfilo,
  getProfilo
};
