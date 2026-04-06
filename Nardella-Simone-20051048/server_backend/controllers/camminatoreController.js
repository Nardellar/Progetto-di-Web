'use strict';

const { dbRun, dbGetUno } = require('../db/helpers');
const { body, validationResult, matchedData } = require('express-validator');
const {
  validaProfilo,
  postAggiornaProfilo,
  getProfilo,
  normalizePersonName
} = require('./profileController');

// Check prenotazioni
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
    .notEmpty().withMessage('Il nome e obbligatorio'),
  body('testo')
    .trim().notEmpty().withMessage('La domanda non puo essere vuota')
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

async function postPrenotazione(req, res) {
  const errors = validationResult(req);
  const idStruttura = req.params.id;
  const bookingAnchor = '#booking-section';

  if (!req.user || req.user.role !== 'camminatore') {
    return res.redirect(
      `/struttura/${idStruttura}?errore=${encodeURIComponent('Solo i camminatori possono inviare richieste di prenotazione')}${bookingAnchor}`
    );
  }

  if (!errors.isEmpty()) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(errors.array()[0].msg)}${bookingAnchor}`);
  }

  const { check_in, check_out, numero_ospiti } = matchedData(req);

  if (new Date(check_in) < new Date().setHours(0, 0, 0, 0)) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Il check-in non puo essere nel passato')}${bookingAnchor}`);
  }
  if (new Date(check_out) < new Date(check_in)) {
    return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent('Il check-out deve essere dopo il check-in')}${bookingAnchor}`);
  }

  try {
    const facility = await dbGetUno('SELECT * FROM strutture WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    if (facility.email_ristoratore === req.user.email) {
      return res.redirect(
        `/struttura/${idStruttura}?errore=${encodeURIComponent('Non puoi prenotare la tua stessa struttura')}${bookingAnchor}`
      );
    }

    if (parseInt(numero_ospiti, 10) > facility.capacita && facility.capacita > 0) {
      return res.redirect(`/struttura/${idStruttura}?errore=${encodeURIComponent(`Capacita massima: ${facility.capacita} ospiti`)}${bookingAnchor}`);
    }

    await dbRun(
      `INSERT INTO prenotazioni (id_struttura, email_camminatore, check_in, check_out, numero_ospiti)
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
    const facility = await dbGetUno('SELECT * FROM strutture WHERE id = ?', [idStruttura]);
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
      `INSERT INTO domande (id_struttura, nome_autore, email_autore, testo)
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
  const rawRedirect = String(req.body.redirect_to || '').trim();
  const redirectTarget = (rawRedirect.startsWith('/struttura/') || rawRedirect === '/profilo')
    ? rawRedirect
    : '/profilo';
  const anchor = redirectTarget === '/profilo' ? '#profilo-domande' : '#qa-section';

  try {
    const domanda = await dbGetUno(
      'SELECT id, email_autore FROM domande WHERE id = ?',
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

    await dbRun('DELETE FROM risposte WHERE id_domanda = ?', [idDomanda]);
    await dbRun('DELETE FROM domande WHERE id = ?', [idDomanda]);

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
    const facility = await dbGetUno('SELECT id FROM strutture WHERE id = ?', [idStruttura]);
    if (!facility) {
      return res.redirect('/strutture?errore=Struttura non trovata');
    }

    const prenotazionePassata = await dbGetUno(
      `SELECT id
       FROM prenotazioni
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
      'SELECT id FROM recensioni WHERE id_struttura = ? AND email_camminatore = ?',
      [idStruttura, req.user.email]
    );

    if (esistente) {
      await dbRun(
        `UPDATE recensioni
         SET voto = ?, testo = ?, creato_il = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [voto, testo || null, esistente.id]
      );
      return res.redirect(
        `/struttura/${idStruttura}?successo=${encodeURIComponent('Recensione aggiornata con successo')}${reviewsAnchor}`
      );
    }

    await dbRun(
      `INSERT INTO recensioni (id_struttura, email_camminatore, voto, testo)
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
