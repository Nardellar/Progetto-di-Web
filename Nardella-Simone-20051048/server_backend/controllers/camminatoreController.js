'use strict';

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

//Check domanda
const validaDomanda = [
  body('nome_autore')
    .trim().notEmpty().withMessage('Il nome è obbligatorio'),
  body('email_autore')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Email non valida'),
  body('testo')
    .trim().notEmpty().withMessage('La domanda non può essere vuota')
    .isLength({ max: 2000 }).withMessage('Domanda troppo lunga (max 2000 caratteri)')
];


async function postPrenotazione(req, res) {
  const errors = validationResult(req);
  const idStruttura = req.params.id;

  if (!errors.isEmpty()) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(errors.array()[0].msg)}`);
  }

  const { check_in, check_out, numero_ospiti } = matchedData(req);

  if (new Date(check_in) < new Date().setHours(0, 0, 0, 0)) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Il check-in non può essere nel passato')}`);
  }
  if (new Date(check_out) < new Date(check_in)) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Il check-out deve essere dopo il check-in')}`);
  }

  try {
    const facility = await dbGetUno('SELECT * FROM facilities WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    if (parseInt(numero_ospiti) > facility.capacita && facility.capacita > 0) {
      return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(`Capacità massima: ${facility.capacita} ospiti`)}`);
    }

    await dbRun(
      `INSERT INTO booking_requests (id_struttura, email_camminatore, check_in, check_out, numero_ospiti)
       VALUES (?, ?, ?, ?, ?)`,
      [idStruttura, req.user.email, check_in, check_out, numero_ospiti]
    );

    res.redirect(`/struttura/${idStruttura}?successo=${encodeURIComponent('Richiesta di prenotazione inviata!')}`);
  } catch (err) {
    console.error('Errore prenotazione:', err.message);
    res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Errore durante la prenotazione')}`);
  }
}

async function postDomanda(req, res) {
  const errors = validationResult(req);
  const idStruttura = req.params.id;

  if (!errors.isEmpty()) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(errors.array()[0].msg)}`);
  }

  const { nome_autore, email_autore, testo } = matchedData(req);

  try {
    const facility = await dbGetUno('SELECT * FROM facilities WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    await dbRun(
      `INSERT INTO questions (id_struttura, nome_autore, email_autore, testo)
       VALUES (?, ?, ?, ?)`,
      [idStruttura, nome_autore, email_autore || null, testo]
    );

    res.redirect(`/struttura/${idStruttura}?successo=${encodeURIComponent('Domanda inviata!')}`);
  } catch (err) {
    console.error('Errore domanda:', err.message);
    res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Errore durante l\'invio della domanda')}`);
  }
}

async function getProfilo(req, res) {
  try {
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
      domande: domande
    });
  } catch (err) {
    console.error('Errore profilo:', err.message);
    res.status(500).render('error', { message: 'Errore caricamento profilo', error: { status: 500 } });
  }
}

module.exports = {
  validaPrenotazione,
  validaDomanda,
  postPrenotazione,
  postDomanda,
  getProfilo
};
