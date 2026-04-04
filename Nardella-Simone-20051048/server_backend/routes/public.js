'use strict';

var express = require('express');
var router = express.Router();
var { dbGetAll, dbGetUno } = require('../db/helpers');
var trailDetailsBySlug = require('../config/trailDetails');

var slugToView = {};

var facilityNameToView = {};

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
    var tappeRange = (req.query.tappeRange || '').trim();
    var regione = (req.query.regione || '').trim();
    var stagione = (req.query.stagione || '').trim();

    var whereParts = [];
    var params = [];

    if (tappeRange) {
      var rangeMatch = tappeRange.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        whereParts.push('numero_tappe BETWEEN ? AND ?');
        params.push(Number.parseInt(rangeMatch[1], 10), Number.parseInt(rangeMatch[2], 10));
      } else {
        var minMatch = tappeRange.match(/^(\d+)\+$/);
        if (minMatch) {
          whereParts.push('numero_tappe >= ?');
          params.push(Number.parseInt(minMatch[1], 10));
        }
      }
    }

    if (regione) {
      whereParts.push('regione = ?');
      params.push(regione);
    }

    if (stagione) {
      whereParts.push('stagione_ideale = ?');
      params.push(stagione);
    }

    var whereSql = whereParts.length ? (' WHERE ' + whereParts.join(' AND ')) : '';
    const trails = await dbGetAll('SELECT * FROM trails' + whereSql + ' ORDER BY nome', params);

    var regioni = await dbGetAll("SELECT DISTINCT regione FROM trails WHERE regione IS NOT NULL AND TRIM(regione) <> '' ORDER BY regione");
    var stagioni = await dbGetAll("SELECT DISTINCT stagione_ideale FROM trails WHERE stagione_ideale IS NOT NULL AND TRIM(stagione_ideale) <> '' ORDER BY stagione_ideale");

    res.render('percorsi', {
      title: 'Percorsi',
      trails: trails,
      filterOptions: {
        regioni: regioni.map(function (row) { return row.regione; }),
        stagioni: stagioni.map(function (row) { return row.stagione_ideale; })
      },
      activeFilters: {
        tappeRange: tappeRange,
        regione: regione,
        stagione: stagione
      }
    });
  } catch (err) {
    next(err);
  }
});

// Deve stare prima di /sentiero/:slug, altrimenti "via-degli-dei-modern" viene interpretato come slug inesistente.
router.get('/sentiero/via-degli-dei-modern', function (req, res) {
  res.redirect(301, '/sentiero/via-degli-dei');
});

router.get('/sentiero/:slug', async function (req, res, next) {
  try {
    const trail = await dbGetUno('SELECT * FROM trails WHERE slug = ?', [req.params.slug]);
    if (!trail) return next();
    const facilities = await dbGetAll('SELECT * FROM facilities WHERE id_cammino = ? LIMIT 3', [trail.id]);
    const trailDetails = trailDetailsBySlug[req.params.slug] || null;
    var viewName = slugToView[req.params.slug] || 'sentiero';
    res.render(viewName, { title: trail.nome, trail: trail, facilities: facilities, trailDetails: trailDetails });
  } catch (err) {
    next(err);
  }
});

router.get('/strutture', async function (req, res, next) {
  try {
    var camminoSlug = (req.query.cammino || '').trim();
    var filtroCammino = null;
    var page = Number.parseInt(req.query.page, 10);
    var pageSize = 4;
    if (Number.isNaN(page) || page < 1) {
      page = 1;
    }

    var q = (req.query.q || '').trim();
    var tappa = (req.query.tappa || '').trim();
    var prezzoMin = Number.parseFloat(req.query.prezzoMin);
    var prezzoMax = Number.parseFloat(req.query.prezzoMax);
    var sort = (req.query.sort || 'nome_asc').trim();

    var serviziRaw = req.query.servizi;
    var selectedServices = Array.isArray(serviziRaw) ? serviziRaw : (serviziRaw ? [serviziRaw] : []);
    selectedServices = selectedServices.map(function (s) { return String(s).trim(); }).filter(Boolean);
    selectedServices = Array.from(new Set(selectedServices));

    if (camminoSlug) {
      filtroCammino = await dbGetUno('SELECT nome, slug, citta_partenza FROM trails WHERE slug = ?', [camminoSlug]);
    }

    var whereParts = [];
    var params = [];

    if (camminoSlug) {
      whereParts.push('t.slug = ?');
      params.push(camminoSlug);
    }

    if (q) {
      whereParts.push('f.nome LIKE ?');
      var like = '%' + q + '%';
      params.push(like);
    }

    if (tappa) {
      var tappaParts = tappa.split('|');
      var tappaTipo = tappaParts[0];
      var tappaNumero = Number.parseInt(tappaParts[1], 10);
      var tappaCitta = tappaParts.slice(1).join('|').trim();

      if (tappaTipo === 'start') {
        if (tappaCitta) {
          whereParts.push('t.citta_partenza = ?');
          params.push(tappaCitta);
        } else {
          whereParts.push('f.citta = t.citta_partenza');
        }
      } else if (tappaTipo === 'arrivo' && tappaCitta) {
        whereParts.push('f.citta = ?');
        params.push(tappaCitta);
      } else if (tappaTipo === 'stage' && !Number.isNaN(tappaNumero)) {
        whereParts.push('f.numero_tappa = ?');
        params.push(tappaNumero);
      }
    }

    if (!Number.isNaN(prezzoMin)) {
      whereParts.push('f.prezzo_notte >= ?');
      params.push(prezzoMin);
    }

    if (!Number.isNaN(prezzoMax)) {
      whereParts.push('f.prezzo_notte <= ?');
      params.push(prezzoMax);
    }

    var whereSql = whereParts.length ? (' WHERE ' + whereParts.join(' AND ')) : '';
    var serviceJoinSql = '';
    var groupSql = '';

    if (selectedServices.length) {
      var servicePlaceholders = selectedServices.map(function () { return '?'; }).join(', ');
      serviceJoinSql = ' JOIN facility_services fs ON fs.id_struttura = f.id JOIN service_catalog s ON s.id = fs.id_servizio';
      whereSql += (whereSql ? ' AND ' : ' WHERE ') + ('s.slug IN (' + servicePlaceholders + ')');
      Array.prototype.push.apply(params, selectedServices);
      groupSql = ' GROUP BY f.id HAVING COUNT(DISTINCT s.slug) = ?';
      params.push(selectedServices.length);
    }

    var orderMap = {
      nome_asc: 'f.nome ASC',
      nome_desc: 'f.nome DESC',
      prezzo_asc: 'f.prezzo_notte ASC, f.nome ASC',
      prezzo_desc: 'f.prezzo_notte DESC, f.nome ASC',
      capienza_desc: 'f.capacita DESC, f.nome ASC'
    };
    var orderBySql = orderMap[sort] || orderMap.nome_asc;

    var countRows = await dbGetAll(
      `SELECT COUNT(*) AS total
       FROM (
         SELECT f.id
         FROM facilities f
         LEFT JOIN trails t ON f.id_cammino = t.id
         ${serviceJoinSql}
         ${whereSql}
         ${groupSql}
       ) filtered`,
      params
    );
    var totalItems = countRows[0] ? Number(countRows[0].total) : 0;
    var totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (page > totalPages) {
      page = totalPages;
    }
    var offset = (page - 1) * pageSize;

    var facilities = await dbGetAll(
       `SELECT f.*, t.nome AS nome_cammino, t.slug AS slug_cammino
        FROM facilities f
        LEFT JOIN trails t ON f.id_cammino = t.id
        ${serviceJoinSql}
        ${whereSql}
        ${groupSql}
        ORDER BY ${orderBySql}
        LIMIT ? OFFSET ?`,
      params.concat([pageSize, offset])
     );

    var optionWhere = '';
    var optionParams = [];
    if (camminoSlug) {
      optionWhere = ' WHERE t.slug = ?';
      optionParams.push(camminoSlug);
    }

    var tappaOptions = [];
    var detailEntry = filtroCammino ? trailDetailsBySlug[filtroCammino.slug] : null;
    var detailStages = (detailEntry && Array.isArray(detailEntry.stages)) ? detailEntry.stages : [];
    var hasTrailDetails = !!(detailStages && detailStages.length);

    if (filtroCammino && filtroCammino.citta_partenza) {
      tappaOptions.push({ value: 'start', label: 'Inizio' });
    }

    if (hasTrailDetails) {
      detailStages.forEach(function (stage, index) {
        var title = String(stage.titolo || '').trim();
        var parts = title.split(' - ');
        var place = (parts.length > 1 ? parts[parts.length - 1] : title) || ('Tappa ' + (index + 1));
        tappaOptions.push({
          value: 'stage|' + (index + 1) + '|' + place,
          label: 'Tappa ' + (index + 1) + ' - ' + place
        });
      });
    } else {
      var tappeArrivo = await dbGetAll(
        `SELECT DISTINCT f.numero_tappa, f.citta
         FROM facilities f
         LEFT JOIN trails t ON f.id_cammino = t.id
         ${optionWhere}
         ORDER BY f.numero_tappa ASC`,
        optionParams
      );

      tappeArrivo.forEach(function (row) {
        if (!row.numero_tappa) return;
        var label = row.citta ? ('Tappa ' + row.numero_tappa + ' - ' + row.citta) : ('Tappa ' + row.numero_tappa);
        tappaOptions.push({
          value: 'stage|' + row.numero_tappa,
          label: label
        });
      });
    }

    var services = await dbGetAll(
      `SELECT DISTINCT s.slug, s.nome, s.sort_order
       FROM service_catalog s
       JOIN facility_services fs ON fs.id_servizio = s.id
       JOIN facilities f ON fs.id_struttura = f.id
       LEFT JOIN trails t ON f.id_cammino = t.id
       ${optionWhere}
       ORDER BY s.sort_order ASC, s.nome ASC`,
      optionParams
    );

    var pageTitle = filtroCammino ? ('Strutture - ' + filtroCammino.nome) : 'Strutture';

    var baseSearchParams = new URLSearchParams();
    Object.keys(req.query).forEach(function (key) {
      if (key === 'page') return;
      var rawValue = req.query[key];
      if (Array.isArray(rawValue)) {
        rawValue.forEach(function (entry) {
          var value = String(entry || '').trim();
          if (value) baseSearchParams.append(key, value);
        });
        return;
      }
      var singleValue = String(rawValue || '').trim();
      if (singleValue) {
        baseSearchParams.append(key, singleValue);
      }
    });

    res.render('strutture', {
       title: pageTitle,
       facilities: facilities,
       filtroCammino: filtroCammino,
       filterOptions: {
         tappe: tappaOptions,
         services: services,
         sortOptions: [
           { value: 'nome_asc', label: 'Nome (A-Z)' },
           { value: 'nome_desc', label: 'Nome (Z-A)' },
           { value: 'prezzo_asc', label: 'Prezzo crescente' },
           { value: 'prezzo_desc', label: 'Prezzo decrescente' },
           { value: 'capienza_desc', label: 'Capienza maggiore' }
         ]
       },
       activeFilters: {
         q: q,
         tappa: tappa,
         prezzoMin: Number.isNaN(prezzoMin) ? '' : prezzoMin,
         prezzoMax: Number.isNaN(prezzoMax) ? '' : prezzoMax,
         servizi: selectedServices,
         sort: sort
       },
       pagination: {
         currentPage: page,
         pageSize: pageSize,
         totalItems: totalItems,
         totalPages: totalPages,
         hasPrev: page > 1,
         hasNext: page < totalPages
       },
       baseQueryString: baseSearchParams.toString()
     });
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
    const hostOwner = await dbGetUno(
      `SELECT nome, cognome, immagine_profilo, created_at
       FROM utenti
       WHERE email = ?`,
      [facility.email_ristoratore]
    );
    let hostAnniPiattaforma = 1;
    if (hostOwner && hostOwner.created_at) {
      const createdMs = new Date(hostOwner.created_at).getTime();
      const years = (Date.now() - createdMs) / (365.25 * 24 * 60 * 60 * 1000);
      hostAnniPiattaforma = Math.max(1, Math.floor(years));
    }
    const questions = await dbGetAll(
      `SELECT q.*,
              uq.immagine_profilo AS immagine_profilo,
              (SELECT COUNT(*) FROM answers a WHERE a.id_domanda = q.id) AS num_risposte
       FROM questions q
       LEFT JOIN utenti uq ON q.email_autore = uq.email
       WHERE q.id_struttura = ?
       ORDER BY q.creato_il DESC`,
      [facility.id]
    );
    for (const q of questions) {
      q.answers = await dbGetAll(
        `SELECT a.*, u.nome AS nome_risponditore, u.cognome AS cognome_risponditore, u.immagine_profilo AS immagine_risponditore
         FROM answers a
         LEFT JOIN utenti u ON a.email_risponditore = u.email
         WHERE a.id_domanda = ?
         ORDER BY a.creato_il ASC`,
        [q.id]
      );
    }
    const reviews = await dbGetAll(
      `SELECT r.*,
              u.nome,
              u.cognome,
              (
                SELECT br2.check_in
                FROM booking_requests br2
                WHERE br2.id_struttura = r.id_struttura
                  AND br2.email_camminatore = r.email_camminatore
                  AND br2.status = 'accepted'
                ORDER BY date(br2.check_out) DESC, br2.id DESC
                LIMIT 1
              ) AS soggiorno_da,
              (
                SELECT br3.check_out
                FROM booking_requests br3
                WHERE br3.id_struttura = r.id_struttura
                  AND br3.email_camminatore = r.email_camminatore
                  AND br3.status = 'accepted'
                ORDER BY date(br3.check_out) DESC, br3.id DESC
                LIMIT 1
              ) AS soggiorno_a
       FROM reviews r
       JOIN utenti u ON r.email_camminatore = u.email
       WHERE r.id_struttura = ?
       ORDER BY date(soggiorno_a) DESC, r.creato_il DESC`,
      [facility.id]
    );
    const facilityImages = await dbGetAll(
      `SELECT id, percorso_immagine
       FROM facility_images
       WHERE id_struttura = ?
       ORDER BY creato_il DESC, id DESC`,
      [facility.id]
    );
    const facilityServices = await dbGetAll(
      `SELECT s.id, s.slug, s.nome, s.icon_type, s.icon_value, s.sort_order
       FROM facility_services fs
       JOIN service_catalog s ON fs.id_servizio = s.id
       WHERE fs.id_struttura = ?
       ORDER BY s.sort_order ASC, s.nome ASC`,
      [facility.id]
    );
    const reviewStats = await dbGetUno(
      `SELECT COUNT(*) AS totale, ROUND(AVG(voto), 1) AS media
       FROM reviews
       WHERE id_struttura = ?`,
      [facility.id]
    );
    const canReply = !!(req.user && req.user.role === 'ristoratore' && req.user.email === facility.email_ristoratore);
    let canReview = false;
    let myReview = null;
    if (req.user && req.user.role === 'camminatore') {
      const prenotazionePassata = await dbGetUno(
        `SELECT id
         FROM booking_requests
         WHERE id_struttura = ?
           AND email_camminatore = ?
           AND status = 'accepted'
           AND date(check_out) < date('now')
         LIMIT 1`,
        [facility.id, req.user.email]
      );
      canReview = !!prenotazionePassata;
      myReview = await dbGetUno(
        `SELECT id, voto, testo
         FROM reviews
         WHERE id_struttura = ? AND email_camminatore = ?`,
        [facility.id, req.user.email]
      );
    }
    var viewName = facilityNameToView[facility.nome] || 'struttura';
    res.render(viewName, {
      title: facility.nome,
      facility: facility,
      hostOwner: hostOwner,
      hostAnniPiattaforma: hostAnniPiattaforma,
      questions: questions,
      reviews: reviews,
      facilityImages: facilityImages || [],
      facilityServices: facilityServices || [],
      reviewStats: reviewStats || { totale: 0, media: null },
      canReply: canReply,
      canReview: canReview,
      myReview: myReview,
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
             OR regione LIKE ?
       ORDER BY nome`,
      [like, like, like, like]
    );
    var facilities = await dbGetAll(
      `SELECT f.*, t.nome AS nome_cammino, t.slug AS slug_cammino
       FROM facilities f
       LEFT JOIN trails t ON f.id_cammino = t.id
       WHERE f.nome LIKE ? OR f.citta LIKE ? OR f.indirizzo LIKE ?
       ORDER BY f.nome`,
      [like, like, like]
    );
    res.render('cerca', { title: 'Ricerca: ' + q, query: q, trails: trails, facilities: facilities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
