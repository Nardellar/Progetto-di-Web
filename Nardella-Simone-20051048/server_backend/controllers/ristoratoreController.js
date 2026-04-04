'use strict';

const fs = require('fs');
const path = require('path');
const { dbRun, dbGetUno, dbGetAll } = require('../db/helpers');
const { body, validationResult, matchedData } = require('express-validator');
const trailDetailsBySlug = require('../config/trailDetails');

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
    .toInt()
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

function buildTrailTappe(trail) {
  const details = trailDetailsBySlug[trail.slug] || null;
  const managementTappe = (details && Array.isArray(details.managementTappe))
    ? details.managementTappe
    : [];
  const options = [];

  if (trail.citta_partenza) {
    options.push({
      value: 'start',
      label: 'Inizio - ' + trail.citta_partenza
    });
  }

  managementTappe.forEach(function (placeRaw, index) {
    const place = String(placeRaw || '').trim();
    options.push({
      value: 'stage|' + (index + 1) + '|' + place,
      label: 'Tappa ' + (index + 1) + ' - ' + place
    });
  });

  return options;
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
    const serviceCatalog = await dbGetAll(
      `SELECT id, slug, nome, icon_type, icon_value, sort_order
       FROM service_catalog
       ORDER BY sort_order ASC, nome ASC`
    );

    const trails = await dbGetAll(
      'SELECT id, nome, slug, citta_partenza FROM trails ORDER BY nome'
    );

    const trailsForForm = trails.map(function (trail) {
      return {
        id: trail.id,
        nome: trail.nome,
        slug: trail.slug,
        tappe: buildTrailTappe(trail)
      };
    });

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
           AND NOT EXISTS (SELECT 1 FROM answers a WHERE a.id_domanda = q.id)
         ORDER BY q.creato_il DESC`,
        [s.id]
      );

      s.immagini = await dbGetAll(
        `SELECT id, percorso_immagine, creato_il
         FROM facility_images
         WHERE id_struttura = ?
         ORDER BY creato_il DESC, id DESC`,
        [s.id]
      );

      const servizi = await dbGetAll(
        `SELECT id_servizio
         FROM facility_services
         WHERE id_struttura = ?`,
        [s.id]
      );
      s.service_ids = servizi.map(function (row) { return row.id_servizio; });
    }

    res.render('gestione', {
      title: 'Gestione strutture',
      strutture: strutture,
      serviceCatalog: serviceCatalog,
      trails: trailsForForm,
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
  const redirectTarget = getRedirectTarget(req);

  if (!errors.isEmpty()) {
    return res.redirect(`${redirectTarget}?errore=${encodeURIComponent(errors.array()[0].msg)}#qa-section`);
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
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Domanda non trovata')}#qa-section`);
    }
    if (domanda.email_ristoratore !== req.user.email) {
      return res.redirect(`${redirectTarget}?errore=${encodeURIComponent('Non autorizzato')}#qa-section`);
    }

    const { testo } = matchedData(req);

    await dbRun(
      'INSERT INTO answers (id_domanda, email_risponditore, testo) VALUES (?, ?, ?)',
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
       FROM answers a
       JOIN questions q ON a.id_domanda = q.id
       JOIN facilities f ON q.id_struttura = f.id
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
    await dbRun('UPDATE answers SET testo = ?, creato_il = CURRENT_TIMESTAMP WHERE id = ?', [testo, id]);

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
       FROM answers a
       JOIN questions q ON a.id_domanda = q.id
       JOIN facilities f ON q.id_struttura = f.id
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

    await dbRun('DELETE FROM answers WHERE id = ?', [id]);
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
  const absoluteImagePath = path.join(__dirname, '..', 'public', 'images', imagePath);
  fs.unlink(absoluteImagePath, function () { });
}

async function getOwnedFacility(id, emailRistoratore) {
  return dbGetUno(
    'SELECT id, email_ristoratore, immagine FROM facilities WHERE id = ?',
    [id]
  ).then(function (facility) {
    if (!facility || facility.email_ristoratore !== emailRistoratore) {
      return null;
    }
    return facility;
  });
}

async function postAggiornaImmagineStruttura(req, res) {
  const { id } = req.params;
  if (!req.file) {
    return res.redirect('/gestione?errore=' + encodeURIComponent('Seleziona un\'immagine da caricare'));
  }

  try {
    const facility = await getOwnedFacility(id, req.user.email);
    if (!facility) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata') + '#struttura-' + id);
    }

    const newImagePath = 'facilities/' + req.file.filename;
    await dbRun(
      'INSERT OR IGNORE INTO facility_images (id_struttura, percorso_immagine) VALUES (?, ?)',
      [id, newImagePath]
    );

    // Manteniamo sincronizzata anche l'immagine principale per compatibilita.
    // NON cancelliamo la vecchia cover qui: puo essere ancora presente nella galleria.
    if (!facility.immagine || facility.immagine.startsWith('facilities/')) {
      await dbRun('UPDATE facilities SET immagine = ? WHERE id = ?', [newImagePath, id]);
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
    const facility = await getOwnedFacility(id, req.user.email);
    if (!facility) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata'));
    }

    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Immagine non valida') + '#struttura-' + id);
    }

    const imageRow = await dbGetUno(
      `SELECT id, percorso_immagine
       FROM facility_images
       WHERE id = ? AND id_struttura = ?`,
      [imageId, id]
    );
    if (!imageRow) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Immagine non trovata') + '#struttura-' + id);
    }

    await dbRun('DELETE FROM facility_images WHERE id = ? AND id_struttura = ?', [imageId, id]);
    deleteFacilityImageIfManaged(imageRow.percorso_immagine);

    const nextCover = await dbGetUno(
      `SELECT percorso_immagine
       FROM facility_images
       WHERE id_struttura = ?
       ORDER BY creato_il DESC, id DESC
       LIMIT 1`,
      [id]
    );
    const newCover = nextCover ? nextCover.percorso_immagine : null;
    await dbRun('UPDATE facilities SET immagine = ? WHERE id = ?', [newCover, id]);

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
    const facility = await getOwnedFacility(id, req.user.email);
    if (!facility) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata') + '#struttura-' + id);
    }

    if (uniqueIds.length > 0) {
      const placeholders = uniqueIds.map(function () { return '?'; }).join(',');
      const rows = await dbGetAll(
        `SELECT id FROM service_catalog WHERE id IN (${placeholders})`,
        uniqueIds
      );
      if (rows.length !== uniqueIds.length) {
        return res.redirect('/gestione?errore=' + encodeURIComponent('Servizi selezionati non validi') + '#struttura-' + id);
      }
    }

    await dbRun('BEGIN TRANSACTION');
    try {
      await dbRun('DELETE FROM facility_services WHERE id_struttura = ?', [id]);
      for (const serviceId of uniqueIds) {
        await dbRun(
          'INSERT OR IGNORE INTO facility_services (id_struttura, id_servizio) VALUES (?, ?)',
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
    const facility = await getOwnedFacility(id, req.user.email);
    if (!facility) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata') + '#struttura-' + id);
    }

    const { nome, prezzo_notte, capacita } = matchedData(req);
    await dbRun(
      'UPDATE facilities SET nome = ?, prezzo_notte = ?, capacita = ? WHERE id = ?',
      [nome, prezzo_notte, capacita, id]
    );
    return res.redirect('/gestione?successo=' + encodeURIComponent('Nome, prezzo e capacità aggiornati') + '#struttura-' + id);
  } catch (err) {
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
    const trail = await dbGetUno(
      'SELECT id, slug, citta_partenza FROM trails WHERE id = ?',
      [data.id_cammino]
    );
    if (!trail) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Cammino non trovato'));
    }

    const tappe = buildTrailTappe(trail);
    const chosen = tappe.find(function (opt) { return opt.value === data.tappa; });
    if (!chosen) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Tappa non valida per il cammino scelto'));
    }

    const valueParts = data.tappa.split('|');
    const tappaTipo = valueParts[0];
    const tappaNumero = Number.parseInt(valueParts[1], 10);
    const tappaCitta = valueParts.slice(2).join('|').trim();
    const cittaStruttura = tappaTipo === 'start' ? trail.citta_partenza : tappaCitta;
    const numeroTappa = tappaTipo === 'stage' && !Number.isNaN(tappaNumero) ? tappaNumero : null;

    await dbRun(
      `INSERT INTO facilities (email_ristoratore, id_cammino, nome, citta, numero_tappa, prezzo_notte, descrizione)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.email, trail.id, data.nome, cittaStruttura, numeroTappa, data.prezzo_notte, data.descrizione || null]
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
    const facility = await getOwnedFacility(id, req.user.email);
    if (!facility) {
      return res.redirect('/gestione?errore=' + encodeURIComponent('Struttura non trovata o non autorizzata'));
    }

    const immagini = await dbGetAll(
      `SELECT percorso_immagine
       FROM facility_images
       WHERE id_struttura = ?`,
      [id]
    );

    await dbRun('BEGIN TRANSACTION');
    try {
      await dbRun('DELETE FROM facility_services WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM facility_images WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM facility_unavailability WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM booking_requests WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM answers WHERE id_domanda IN (SELECT id FROM questions WHERE id_struttura = ?)', [id]);
      await dbRun('DELETE FROM questions WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM reviews WHERE id_struttura = ?', [id]);
      await dbRun('DELETE FROM facilities WHERE id = ?', [id]);
      await dbRun('COMMIT');
    } catch (err) {
      await dbRun('ROLLBACK');
      throw err;
    }

    immagini.forEach(function (row) {
      deleteFacilityImageIfManaged(row.percorso_immagine);
    });
    deleteFacilityImageIfManaged(facility.immagine);

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
