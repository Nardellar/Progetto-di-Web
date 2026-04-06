'use strict';

const fs = require('fs');
const path = require('path');
const { dbRun, dbGetUno, dbGetAll } = require('../db/helpers');
const { body, validationResult, matchedData } = require('express-validator');
const dettagliCamminoPerSlug = require('../config/trailDetails');

const validaRisposta = [
  body('testo')
    .trim().notEmpty().withMessage('La risposta non può essere vuota')
    .isLength({ max: 2000 }).withMessage('Risposta troppo lunga (max 2000 caratteri)')
];

const validaDettagliStruttura = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Inserisci il nome della struttura')
    .isLength({ max: 120 }).withMessage('Nome troppo lungo (max 120 caratteri)'),
  body('prezzo_notte')
    .trim()
    .notEmpty().withMessage('Inserisci il prezzo per notte')
    .isFloat({ min: 0 }).withMessage('Il prezzo deve essere un numero maggiore o uguale a 0')
    .toFloat(),
  body('capacita')
    .trim()
    .notEmpty().withMessage('Inserisci la capacità massima')
    .isInt({ min: 1, max: 1000 }).withMessage('La capacità deve essere un numero intero tra 1 e 1000')
    .toInt(),
  body('id_cammino')
    .notEmpty().withMessage('Seleziona un cammino')
    .isInt({ min: 1 }).withMessage('Cammino non valido')
    .toInt(),
  body('tappa')
    .trim()
    .notEmpty().withMessage('Seleziona una tappa valida')
];

const validaNuovaStruttura = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Inserisci il nome della struttura')
    .isLength({ max: 120 }).withMessage('Nome troppo lungo (max 120 caratteri)'),
  body('prezzo_notte')
    .trim()
    .notEmpty().withMessage('Inserisci il prezzo per notte')
    .isFloat({ min: 0 }).withMessage('Il prezzo deve essere un numero maggiore o uguale a 0')
    .toFloat(),
  body('id_cammino')
    .notEmpty().withMessage('Seleziona un cammino')
    .isInt({ min: 1 }).withMessage('Cammino non valido')
    .toInt(),
  body('tappa')
    .trim()
    .notEmpty().withMessage('Seleziona una tappa valida'),
  body('descrizione')
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('Descrizione troppo lunga (max 2000 caratteri)')
];

function costruisciTappeCammino(cammino) {
  const dettagli = dettagliCamminoPerSlug[cammino.slug] || null;
  const tappeGestione = (dettagli && Array.isArray(dettagli.elencoTappe))
    ? dettagli.elencoTappe
    : [];
  const options = [];

  if (cammino.citta_partenza) {
    options.push({
      value: 'start',
      label: 'Inizio - ' + cammino.citta_partenza
    });
  }

  tappeGestione.forEach(function (placeRaw, index) {
    const place = String(placeRaw || '').trim();
    options.push({
      value: 'stage|' + (index + 1) + '|' + place,
      label: 'Tappa ' + (index + 1) + ' - ' + place
    });
  });

  return options;
}

function estraiPosizioneDaTappa(cammino, tappaValue) {
  const tappe = costruisciTappeCammino(cammino);
  const scelta = tappe.find(function (opt) { return opt.value === tappaValue; });
  if (!scelta) {
    return null;
  }

  const valueParts = String(tappaValue || '').split('|');
  const tappaTipo = valueParts[0];
  const tappaNumero = Number.parseInt(valueParts[1], 10);
  const tappaCitta = valueParts.slice(2).join('|').trim();

  return {
    citta: tappaTipo === 'start' ? cammino.citta_partenza : tappaCitta,
    numeroTappa: tappaTipo === 'stage' && !Number.isNaN(tappaNumero) ? tappaNumero : null
  };
}

function getRedirectTarget(req) {
  const redirectTo = (req.body.redirect_to || '').trim();
  if (redirectTo.startsWith('/struttura/')) {
    return redirectTo;
  }
  return '/gestione';
}

async function getGestione(req, res) {
  try {
    const catalogoServizi = await dbGetAll(
      `SELECT id, slug, nome, icona, valore_icona, ordine
       FROM servizi
       ORDER BY ordine ASC, nome ASC`
    );

    const cammini = await dbGetAll(
      'SELECT id, nome, slug, citta_partenza FROM cammini ORDER BY nome'
    );

    const camminiPerForm = cammini.map(function (cammino) {
      return {
        id: cammino.id,
        nome: cammino.nome,
        slug: cammino.slug,
        tappe: costruisciTappeCammino(cammino)
      };
    });

    const strutture = await dbGetAll(
      'SELECT * FROM strutture WHERE email_ristoratore = ?',
      [req.user.email]
    );

    for (const s of strutture) {
      const camminoStruttura = cammini.find(function (cammino) { return cammino.id === s.id_cammino; }) || null;
      if (camminoStruttura) {
        if (s.numero_tappa != null) {
          s.current_tappa_value = 'stage|' + s.numero_tappa + '|' + (s.citta || '');
        } else if (s.citta && camminoStruttura.citta_partenza && s.citta === camminoStruttura.citta_partenza) {
          s.current_tappa_value = 'start';
        } else {
          s.current_tappa_value = '';
        }
      } else {
        s.current_tappa_value = '';
      }

      s.prenotazioni = await dbGetAll(
        `SELECT br.*, u.nome AS nome_camminatore, u.cognome AS cognome_camminatore
         FROM prenotazioni br
         JOIN utenti u ON br.email_camminatore = u.email
         WHERE br.id_struttura = ?
         ORDER BY
           CASE br.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END,
           br.creato_il DESC`,
        [s.id]
      );

      s.domande = await dbGetAll(
        `SELECT q.*,
                (SELECT COUNT(*) FROM risposte a WHERE a.id_domanda = q.id) AS num_risposte
         FROM domande q
         WHERE q.id_struttura = ?
           AND NOT EXISTS (SELECT 1 FROM risposte a WHERE a.id_domanda = q.id)
         ORDER BY q.creato_il DESC`,
        [s.id]
      );

      s.immagini = await dbGetAll(
        `SELECT id, percorso_immagine, creato_il
         FROM immagini_struttura
         WHERE id_struttura = ?
         ORDER BY creato_il DESC, id DESC`,
        [s.id]
      );

      const servizi = await dbGetAll(
        `SELECT id_servizio
         FROM servizi_struttura
         WHERE id_struttura = ?`,
        [s.id]
      );
      s.service_ids = servizi.map(function (row) { return row.id_servizio; });
    }

    res.render('gestione', {
      title: 'Gestione strutture',
      strutture: strutture,
      catalogoServizi: catalogoServizi,
      cammini: camminiPerForm,
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
       FROM prenotazioni br
       JOIN strutture f ON br.id_struttura = f.id
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
      'UPDATE prenotazioni SET status = ? WHERE id = ?',
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
  const redirectTarget = getRedirectTarget(req);

  if (!errors.isEmpty()) {
    return res.redirect(`${redirectTarget}?errore=${encodeURIComponent(errors.array()[0].msg)}#qa-section`);
  }

  try {
    const domanda = await dbGetUno(
      `SELECT q.*, f.email_ristoratore
       FROM domande q
       JOIN strutture f ON q.id_struttura = f.id
       WHERE q.id = ?`,
      [id]
    );

    if (!domanda) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Domanda non trovata')}#qa-section`);
    }
    if (domanda.email_ristoratore !== req.user.email) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Non autorizzato')}#qa-section`);
    }

    const { testo } = matchedData(req);

    await dbRun(
      'INSERT INTO risposte (id_domanda, email_risponditore, testo) VALUES (?, ?, ?)',
      [id, req.user.email, testo]
    );

    res.redirect(`${redirectTarget}?successo=${encodeURIComponent('Risposta inviata')}#qa-section`);
  } catch (err) {
    console.error('Errore risposta:', err.message);
    res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Errore durante l\'invio della risposta')}#qa-section`);
  }
}

async function postModificaRisposta(req, res) {
  const errors = validationResult(req);
  const { id } = req.params;
  const redirectTarget = getRedirectTarget(req);

  if (!errors.isEmpty()) {
    return res.redirect(`${redirectTarget}?errore=${encodeURIComponent(errors.array()[0].msg)}#qa-section`);
  }

  try {
    const risposta = await dbGetUno(
      `SELECT a.id, a.email_risponditore, f.email_ristoratore
       FROM risposte a
       JOIN domande q ON a.id_domanda = q.id
       JOIN strutture f ON q.id_struttura = f.id
       WHERE a.id = ?`,
      [id]
    );

    if (!risposta) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Risposta non trovata')}#qa-section`);
    }

    if (
      risposta.email_ristoratore !== req.user.email ||
      risposta.email_risponditore !== req.user.email
    ) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Non autorizzato')}#qa-section`);
    }

    const { testo } = matchedData(req);
    await dbRun('UPDATE risposte SET testo = ?, creato_il = CURRENT_TIMESTAMP WHERE id = ?', [testo, id]);

    return res.redirect(`${redirectTarget}?successo=${encodeURIComponent('Risposta aggiornata')}#qa-section`);
  } catch (err) {
    console.error('Errore modifica risposta:', err.message);
    return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Errore durante la modifica della risposta')}#qa-section`);
  }
}

async function postCancellaRisposta(req, res) {
  const { id } = req.params;
  const redirectTarget = getRedirectTarget(req);

  try {
    const risposta = await dbGetUno(
      `SELECT a.id, a.email_risponditore, f.email_ristoratore
       FROM risposte a
       JOIN domande q ON a.id_domanda = q.id
       JOIN strutture f ON q.id_struttura = f.id
       WHERE a.id = ?`,
      [id]
    );

    if (!risposta) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Risposta non trovata')}#qa-section`);
    }

    if (
      risposta.email_ristoratore !== req.user.email ||
      risposta.email_risponditore !== req.user.email
    ) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Non autorizzato')}#qa-section`);
    }

    await dbRun('DELETE FROM risposte WHERE id = ?', [id]);
    return res.redirect(`${redirectTarget}?successo=${encodeURIComponent('Risposta cancellata')}#qa-section`);
  } catch (err) {
    console.error('Errore cancellazione risposta:', err.message);
    return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Errore durante la cancellazione della risposta')}#qa-section`);
  }
}

function deleteFacilityImageIfManaged(imagePath) {
  if (!imagePath || !imagePath.startsWith('facilities/')) {
    return;
  }
  if (imagePath.startsWith('facilities/seed/')) {
    // Immagini seed condivise: non vanno eliminate dal filesystem.
    return;
  }
  const absoluteImagePath = path.join(__dirname, '..', 'public', 'images', imagePath);
  fs.unlink(absoluteImagePath, function () { });
}

async function getOwnedStruttura(id, emailRistoratore) {
  return dbGetUno(
    'SELECT id, email_ristoratore, immagine FROM strutture WHERE id = ?',
    [id]
  ).then(function (struttura) {
    if (!struttura || struttura.email_ristoratore !== emailRistoratore) {
      return null;
    }
    return struttura;
  });
}

async function postAggiornaImmagineStruttura(req, res) {
  const { id } = req.params;
  if (!req.file) {
    return res.redirect('/gestione?errore=' + encodeURIComponent('Seleziona un\'immagine da caricare'));
  }

  try {
    const struttura = await getOwnedStruttura(id, req.user.email);
    if (!struttura) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata') + '#struttura-' + id);
    }

    const newImagePath = 'facilities/' + req.file.filename;
    await dbRun(
      'INSERT OR IGNORE INTO immagini_struttura (id_struttura, percorso_immagine) VALUES (?, ?)',
      [id, newImagePath]
    );

    // Manteniamo sincronizzata anche l'immagine principale per compatibilita.
    // NON cancelliamo la vecchia cover qui: puo essere ancora presente nella galleria.
    if (!struttura.immagine || struttura.immagine.startsWith('facilities/')) {
      await dbRun('UPDATE strutture SET immagine = ? WHERE id = ?', [newImagePath, id]);
    }

    return res.redirect('/gestione?successo=' + encodeURIComponent('Immagine aggiunta alla galleria') + '#struttura-' + id);
  } catch (err) {
    console.error('Errore aggiornamento immagine struttura:', err.message);
    return res.redirect('/gestione?errore=' + encodeURIComponent('Errore durante il caricamento dell\'immagine'));
  }
}

async function postEliminaImmagineStruttura(req, res) {
  const { id } = req.params;
  const imageId = Number(req.body.image_id);
  try {
    const struttura = await getOwnedStruttura(id, req.user.email);
    if (!struttura) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata'));
    }

    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Immagine non valida') + '#struttura-' + id);
    }

    const imageRow = await dbGetUno(
      `SELECT id, percorso_immagine
       FROM immagini_struttura
       WHERE id = ? AND id_struttura = ?`,
      [imageId, id]
    );
    if (!imageRow) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Immagine non trovata') + '#struttura-' + id);
    }

    await dbRun('DELETE FROM immagini_struttura WHERE id = ? AND id_struttura = ?', [imageId, id]);
    deleteFacilityImageIfManaged(imageRow.percorso_immagine);

    const nextCover = await dbGetUno(
      `SELECT percorso_immagine
       FROM immagini_struttura
       WHERE id_struttura = ?
       ORDER BY creato_il DESC, id DESC
       LIMIT 1`,
      [id]
    );
    const newCover = nextCover ? nextCover.percorso_immagine : null;
    await dbRun('UPDATE strutture SET immagine = ? WHERE id = ?', [newCover, id]);

    return res.redirect('/gestione?successo=' + encodeURIComponent('Immagine rimossa dalla galleria') + '#struttura-' + id);
  } catch (err) {
    console.error('Errore eliminazione immagine struttura:', err.message);
    return res.redirect('/gestione?errore=' + encodeURIComponent('Errore durante l\'eliminazione dell\'immagine') + '#struttura-' + id);
  }
}

async function postAggiornaServiziStruttura(req, res) {
  const { id } = req.params;
  const raw = req.body.service_ids;
  const selectedIds = (Array.isArray(raw) ? raw : (raw ? [raw] : []))
    .map(function (value) { return Number(value); })
    .filter(function (value) { return Number.isInteger(value) && value > 0; });
  const uniqueIds = Array.from(new Set(selectedIds));

  try {
    const struttura = await getOwnedStruttura(id, req.user.email);
    if (!struttura) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata') + '#struttura-' + id);
    }

    if (uniqueIds.length > 0) {
      const placeholders = uniqueIds.map(function () { return '?'; }).join(',');
      const rows = await dbGetAll(
        `SELECT id FROM servizi WHERE id IN (${placeholders})`,
        uniqueIds
      );
      if (rows.length !== uniqueIds.length) {
        return res.redirect('/gestione?errore=' + encodeURIComponent('Servizi selezionati non validi') + '#struttura-' + id);
      }
    }

    await dbRun('BEGIN TRANSACTION');
    try {
      await dbRun('DELETE FROM servizi_struttura WHERE id_struttura = ?', [id]);
      for (const serviceId of uniqueIds) {
        await dbRun(
          'INSERT OR IGNORE INTO servizi_struttura (id_struttura, id_servizio) VALUES (?, ?)',
          [id, serviceId]
        );
      }
      await dbRun('COMMIT');
    } catch (err) {
      await dbRun('ROLLBACK');
      throw err;
    }

    return res.redirect('/gestione?successo=' + encodeURIComponent('Servizi struttura aggiornati') + '#struttura-' + id);
  } catch (err) {
    console.error('Errore aggiornamento servizi struttura:', err.message);
    return res.redirect('/gestione?errore=' + encodeURIComponent('Errore durante l\'aggiornamento dei servizi') + '#struttura-' + id);
  }
}

async function postAggiornaDettagliStruttura(req, res) {
  const errors = validationResult(req);
  const { id } = req.params;

  if (!errors.isEmpty()) {
    return res.redirect('/gestione?errore=' + encodeURIComponent(errors.array()[0].msg) + '#struttura-' + id);
  }

  try {
    const struttura = await getOwnedStruttura(id, req.user.email);
    if (!struttura) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata') + '#struttura-' + id);
    }

    const { nome, prezzo_notte, capacita, id_cammino, tappa } = matchedData(req);
    const cammino = await dbGetUno(
      'SELECT id, slug, citta_partenza FROM cammini WHERE id = ?',
      [id_cammino]
    );
    if (!cammino) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Cammino non trovato') + '#struttura-' + id);
    }

    const posizione = estraiPosizioneDaTappa(cammino, tappa);
    if (!posizione) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Tappa non valida per il cammino scelto') + '#struttura-' + id);
    }

    await dbRun(
      'UPDATE strutture SET nome = ?, prezzo_notte = ?, capacita = ?, id_cammino = ?, citta = ?, numero_tappa = ? WHERE id = ?',
      [nome, prezzo_notte, capacita, cammino.id, posizione.citta, posizione.numeroTappa, id]
    );
    return res.redirect('/gestione?successo=' + encodeURIComponent('Dettagli struttura aggiornati') + '#struttura-' + id);
  } catch (err) {
    if (String(err && err.message || '').includes('SQLITE_CONSTRAINT')) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura già presente per questo cammino') + '#struttura-' + id);
    }
    console.error('Errore aggiornamento dettagli struttura:', err.message);
    return res.redirect('/gestione?errore=' + encodeURIComponent('Errore durante l\'aggiornamento della struttura') + '#struttura-' + id);
  }
}

async function postNuovaStruttura(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect('/gestione?errore=' + encodeURIComponent(errors.array()[0].msg));
  }

  try {
    const data = matchedData(req);
    const cammino = await dbGetUno(
      'SELECT id, slug, citta_partenza FROM cammini WHERE id = ?',
      [data.id_cammino]
    );
    if (!cammino) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Cammino non trovato'));
    }

    const posizione = estraiPosizioneDaTappa(cammino, data.tappa);
    if (!posizione) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Tappa non valida per il cammino scelto'));
    }

    await dbRun(
      `INSERT INTO strutture (email_ristoratore, id_cammino, nome, citta, numero_tappa, prezzo_notte, descrizione)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.email, cammino.id, data.nome, posizione.citta, posizione.numeroTappa, data.prezzo_notte, data.descrizione || null]
    );

    return res.redirect('/gestione?successo=' + encodeURIComponent('Struttura aggiunta'));
  } catch (err) {
    if (String(err && err.message || '').includes('SQLITE_CONSTRAINT')) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura già presente per questo cammino'));
    }
    console.error('Errore creazione struttura:', err.message);
    return res.redirect('/gestione?errore=' + encodeURIComponent('Errore durante la creazione della struttura'));
  }
}

async function postEliminaStruttura(req, res) {
  const { id } = req.params;

  try {
    const struttura = await getOwnedStruttura(id, req.user.email);
    if (!struttura) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata'));
    }

    const immagini = await dbGetAll(
      `SELECT percorso_immagine
       FROM immagini_struttura
       WHERE id_struttura = ?`,
      [id]
    );

    await dbRun('BEGIN TRANSACTION');
    try {
      await dbRun('DELETE FROM servizi_struttura WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM immagini_struttura WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM prenotazioni WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM risposte WHERE id_domanda IN (SELECT id FROM domande WHERE id_struttura = ?)', [id]);
      await dbRun('DELETE FROM domande WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM recensioni WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM strutture WHERE id = ?', [id]);
      await dbRun('COMMIT');
    } catch (err) {
      await dbRun('ROLLBACK');
      throw err;
    }

    immagini.forEach(function (row) {
      deleteFacilityImageIfManaged(row.percorso_immagine);
    });
    deleteFacilityImageIfManaged(struttura.immagine);

    return res.redirect('/gestione?successo=' + encodeURIComponent('Struttura eliminata'));
  } catch (err) {
    console.error('Errore eliminazione struttura:', err.message);
    return res.redirect('/gestione?errore=' + encodeURIComponent('Errore durante l\'eliminazione della struttura'));
  }
}

module.exports = {
  getGestione,
  postAggiornaPrenotazione,
  validaDettagliStruttura,
  validaNuovaStruttura,
  validaRisposta,
  postRispondi,
  postModificaRisposta,
  postCancellaRisposta,
  postAggiornaImmagineStruttura,
  postEliminaImmagineStruttura,
  postAggiornaServiziStruttura,
  postAggiornaDettagliStruttura,
  postNuovaStruttura,
  postEliminaStruttura
};
