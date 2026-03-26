'use strict';

const { dbRun, dbGetUno, dbGetAll } = require('../db/helpers');
const { body, validationResult, matchedData } = require('express-validator');

const validaRisposta = [
  body('testo')
    .trim().notEmpty().withMessage('La risposta non può essere vuota')
    .isLength({ max: 2000 }).withMessage('Risposta troppo lunga (max 2000 caratteri)')
];

async function getGestione(req, res) {
  try {
    const strutture = await dbGetAll(
      'SELECT * FROM facilities WHERE email_ristoratore = ?',
      [req.user.email]
    );

    for (const s of strutture) {
      s.prenotazioni = await dbGetAll(
        `SELECT br.*, u.nome AS nome_camminatore, u.cognome AS cognome_camminatore
         FROM booking_requests br
         JOIN utenti u ON br.email_camminatore = u.email
         WHERE br.id_struttura = ?
         ORDER BY
           CASE br.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END,
           br.creato_il DESC`,
        [s.id]
      );

      s.domande = await dbGetAll(
        `SELECT q.*,
                (SELECT COUNT(*) FROM answers a WHERE a.id_domanda = q.id) AS num_risposte
         FROM questions q
         WHERE q.id_struttura = ?
         ORDER BY num_risposte ASC, q.creato_il DESC`,
        [s.id]
      );
    }

    res.render('gestione', {
      title: 'Gestione strutture',
      strutture: strutture,
      successo: req.query.successo || null,
      errore: req.query.errore || null
    });
  } catch (err) {
    console.error('Errore gestione:', err.message);
    res.status(500).render('error', { message: 'Errore caricamento gestione', error: { status: 500 } });
  }
}

async function postAggiornaPrenotazione(req, res) {
  const { id } = req.params;
  const nuovoStato = req.body.status;

  if (!['accepted', 'rejected'].includes(nuovoStato)) {
    return res.redirect('/gestione?errore=Stato non valido');
  }

  try {
    const prenotazione = await dbGetUno(
      `SELECT br.*, f.email_ristoratore
       FROM booking_requests br
       JOIN facilities f ON br.id_struttura = f.id
       WHERE br.id = ?`,
      [id]
    );

    if (!prenotazione) {
      return res.redirect('/gestione?errore=Prenotazione non trovata');
    }
    if (prenotazione.email_ristoratore !== req.user.email) {
      return res.redirect('/gestione?errore=Non autorizzato');
    }

    await dbRun(
      'UPDATE booking_requests SET status = ? WHERE id = ?',
      [nuovoStato, id]
    );

    const label = nuovoStato === 'accepted' ? 'accettata' : 'rifiutata';
    res.redirect(`/gestione?successo=${encodeURIComponent('Prenotazione ' + label)}`);
  } catch (err) {
    console.error('Errore aggiornamento prenotazione:', err.message);
    res.redirect('/gestione?errore=Errore durante l\'aggiornamento');
  }
}

async function postRispondi(req, res) {
  const errors = validationResult(req);
  const { id } = req.params;

  if (!errors.isEmpty()) {
    return res.redirect(`/gestione?errore=${encodeURIComponent(errors.array()[0].msg)}`);
  }

  try {
    const domanda = await dbGetUno(
      `SELECT q.*, f.email_ristoratore
       FROM questions q
       JOIN facilities f ON q.id_struttura = f.id
       WHERE q.id = ?`,
      [id]
    );

    if (!domanda) {
      return res.redirect('/gestione?errore=Domanda non trovata');
    }
    if (domanda.email_ristoratore !== req.user.email) {
      return res.redirect('/gestione?errore=Non autorizzato');
    }

    const { testo } = matchedData(req);

    await dbRun(
      'INSERT INTO answers (id_domanda, email_risponditore, testo) VALUES (?, ?, ?)',
      [id, req.user.email, testo]
    );

    res.redirect(`/gestione?successo=${encodeURIComponent('Risposta inviata')}`);
  } catch (err) {
    console.error('Errore risposta:', err.message);
    res.redirect('/gestione?errore=Errore durante l\'invio della risposta');
  }
}

module.exports = {
  getGestione,
  postAggiornaPrenotazione,
  validaRisposta,
  postRispondi
};
