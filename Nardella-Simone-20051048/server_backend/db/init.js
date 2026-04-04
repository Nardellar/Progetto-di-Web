'use strict';

const fs = require('fs');
const path = require('path');
const db = require('./database');

const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

console.log('Inizializzazione database...');

db.exec(schemaSQL, (err) => {
  if (err) {
    console.error('Errore creazione tabelle:', err.message);
    process.exit(1);
  }
  console.log('Tabelle create.');

  const seed = `
    -- Percorsi precaricati
    INSERT OR IGNORE INTO trails
      (nome, slug, citta_partenza, citta_arrivo, regione, stagione_ideale, numero_tappe, lunghezza_totale_km, descrizione, immagine)
    VALUES
      ('Via degli Dei', 'via-degli-dei', 'Bologna', 'Firenze', 'Emilia-Romagna/Toscana', 'Primavera/Autunno', 5, 130,
       'Un''antica strada escursionistica attraverso i monti dell''Appennino, dalla Toscana all''Emilia-Romagna.',
       'Via degli Dei.jpg'),
      ('Cammino Grande di Celestino', 'cammino-grande-di-celestino', 'L''Aquila', 'Sulmona', 'Abruzzo', 'Primavera/Estate', 5, 90,
       'Un percorso spirituale attraverso l''Italia meridionale, seguendo le orme di San Celestino V.',
       'Cammino Grande di Celestino.jpg'),
      ('Alta Via Dolomitica', 'alta-via-dolomitica', 'Lago di Braies', 'Belluno', 'Dolomiti (Alto Adige/Veneto)', 'Giugno-Settembre', 11, 125,
       'L''Alta Via 1 delle Dolomiti attraversa il cuore delle Dolomiti dal Lago di Braies fino a Belluno, lungo un itinerario tra i piu spettacolari e celebri al mondo.',
       'Alta via Dolomitica.jpg'),
      ('Magna Via Francigena', 'magna-via-francigena', 'Palermo', 'Agrigento', 'Sicilia', 'Primavera/Autunno', 9, 180,
       'Un cammino che attraversa la Sicilia, seguendo le antiche vie dei pellegrini.',
       'magnaViaFrancigena.jpg'),
      ('Cammino dei Briganti', 'cammino-dei-briganti', 'Sante Marie', 'Sante Marie', 'Lazio/Abruzzo', 'Primavera/Autunno', 7, 100,
       'Un anello tra Lazio e Abruzzo sulle tracce dei briganti post-unitari.',
       'camminoDeiBriganti.jpg');

    -- Utenti di test (password placeholder da sostituire con hash bcrypt reale)
    INSERT OR IGNORE INTO utenti (email, password_hash, nome, cognome, role)
    VALUES
      ('ristoratore@test.it', '$2b$10$4WaBiHLC6sbeUaUsj.MrHeCDUzityuJ9maOZT.1bJJh9k4hWPihyu', 'Matteo', 'Barbieri', 'ristoratore'),
      ('camminatore@test.it', '$2b$10$4WaBiHLC6sbeUaUsj.MrHeCDUzityuJ9maOZT.1bJJh9k4hWPihyu', 'Marco', 'Rossi', 'camminatore');

    -- Strutture di test - Via degli Dei (trail_id = 1)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, numero_tappa, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 1, 'SHG Hotel', 'Zola Predosa', 1, 'Via Risorgimento 186', 
       'Hotel con WiFi, ristorante e bar. Valutato 8,1 per coppie.',
       'BadoloHotel1.jpg', 75.00, 30),
      ('ristoratore@test.it', 1, 'Appartamento degli Dei', 'Madonna dei Fornelli', 2, 'Via del Centro 12',
       'Affittacamere con vista montagna, colazione italiana inclusa.',
       'ViaDegliDeiHotel2.jpg', 55.00, 8),
      ('ristoratore@test.it', 1, 'Residence Mugello Resort', 'Scarperia', 4, 'Via Mugello 5',
       'Appartamenti con angolo cottura e vista giardino, a 30 km da Firenze.',
       'ViaDegliDeiHotel3.jpg', 95.00, 20),
      ('ristoratore@test.it', 1, 'Locanda del Passo', 'Monzuno', 3, 'Via della Torre 8',
       'Locanda di montagna con camere essenziali, ideale per una sosta tranquilla.',
       NULL, 62.00, 14),
      ('ristoratore@test.it', 1, 'B&B Collina del Sole', 'Firenze', 5, 'Via del Pellegrino 22',
       'Bed & breakfast in centro storico con colazione artigianale.',
       NULL, 88.00, 10);

    -- Strutture - Alta Via Dolomitica (trail_id = 3)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, numero_tappa, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 3, 'Rifugio Lagazuoi', 'Cortina d''Ampezzo', 3, 'Passo Falzarego',
       'Rifugio alpino a 2752m con vista panoramica sulle Dolomiti, cucina tipica tirolese.',
       NULL, 60.00, 40),
      ('ristoratore@test.it', 3, 'Hotel Tre Cime', 'Auronzo di Cadore', 1, 'Via Nazionale 15',
       'Hotel accogliente ai piedi delle Tre Cime di Lavaredo, ideale per escursionisti.',
       NULL, 85.00, 25),
      ('ristoratore@test.it', 3, 'Rifugio del Pelmo', 'Val di Zoldo', 6, 'Strada del Giau 3',
       'Rifugio con cucina locale e camere condivise per trekker.',
       NULL, 70.00, 28),
      ('ristoratore@test.it', 3, 'Albergo delle Cime', 'Belluno', 11, 'Via degli Alpini 9',
       'Albergo a gestione familiare vicino al centro storico.',
       NULL, 78.00, 20);

    -- Strutture - Cammino Grande di Celestino (trail_id = 2)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, numero_tappa, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 2, 'Locanda Eremi della Majella', 'Pacentro', 2, 'Via del Castello 7',
       'Piccola locanda in pietra a due passi dal centro storico, con camere rustiche e colazione con prodotti locali. Ideale come tappa intermedia del cammino.',
       NULL, 68.00, 10),
      ('ristoratore@test.it', 2, 'Casa del Pellegrino Alento', 'Serramonacesca', 5, 'Contrada Abbazia 3',
       'Alloggio per camminatori vicino all''Abbazia di San Liberatore, atmosfera semplice e accogliente con spazi comuni e deposito zaini.',
       NULL, 55.00, 12),
      ('ristoratore@test.it', 2, 'Borgo del Morrone', 'Sulmona', 1, 'Via Badia 18',
       'Affittacamere storico con camere luminose e deposito bici.',
       NULL, 72.00, 16);

    -- Strutture - Magna Via Francigena (trail_id = 4)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, numero_tappa, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 4, 'Agriturismo Valle dei Templi', 'Agrigento', 1, 'Contrada San Biagio',
       'Agriturismo immerso negli uliveti siciliani, a pochi km dalla Valle dei Templi.',
       NULL, 45.00, 12),
      ('ristoratore@test.it', 4, 'Casa dei Pellegrini', 'Caltanissetta', 4, 'Via del Rosario 11',
       'Alloggio semplice con camere private e spazi comuni.',
       NULL, 52.00, 14),
      ('ristoratore@test.it', 4, 'Dimora del Gelsomino', 'Palermo', 9, 'Via dei Mercanti 5',
       'Piccola dimora con colazione siciliana e terrazza panoramica.',
       NULL, 80.00, 10);

    -- Strutture - Cammino dei Briganti (trail_id = 5)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, numero_tappa, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 5, 'Ostello del Brigante', 'Sante Marie', 1, 'Via del Castello 2',
       'Ostello per camminatori con cucina condivisa e deposito zaini.',
       NULL, 38.00, 22),
      ('ristoratore@test.it', 5, 'B&B Valle del Salto', 'Cartore', 3, 'Via Fonte 6',
       'Camere in pietra con colazione casalinga.',
       NULL, 48.00, 8),
      ('ristoratore@test.it', 5, 'Rifugio dei Marsi', 'Tagliacozzo', 7, 'Via della Rocca 14',
       'Rifugio con vista sulla valle, perfetto per l\'ultima tappa.',
       NULL, 60.00, 15);

    -- Catalogo servizi predefiniti
    INSERT OR IGNORE INTO service_catalog (slug, nome, icon_type, icon_value, sort_order)
    VALUES
      ('camere-non-fumatori', 'Camere non fumatori', 'material', 'smoke_free', 20),
      ('ristorante', 'Ristorante', 'material', 'restaurant', 30),
      ('ospiti-disabili', 'Camere/strutture per ospiti disabili', 'fa', 'fa-wheelchair', 40),
      ('servizio-in-camera', 'Servizio in camera', 'material', 'room_service', 50),
      ('wifi-gratuito', 'Connessione WiFi gratuita', 'fa', 'fa-wifi', 60),
      ('camere-familiari', 'Camere familiari', 'fa', 'fa-users', 70),
      ('bar', 'Bar', 'material', 'local_bar', 80),
      ('colazione', 'Colazione', 'material', 'free_breakfast', 90);

    -- Per default assegniamo tutti i servizi alle strutture demo
    INSERT OR IGNORE INTO facility_services (id_struttura, id_servizio)
    SELECT f.id, s.id
    FROM facilities f
    CROSS JOIN service_catalog s;

    INSERT OR IGNORE INTO facility_images (id_struttura, percorso_immagine)
    VALUES
      (1, 'BadoloHotel1.jpg'),
      (1, 'ViaDegliDeiHotel2.jpg'),
      (1, 'ViaDegliDeiHotel3.jpg'),
      (2, 'ViaDegliDeiHotel2.jpg'),
      (3, 'ViaDegliDeiHotel3.jpg');

    -- Date non disponibili di esempio
    INSERT OR IGNORE INTO facility_unavailability (id_struttura, data_da, data_a, nota)
    VALUES
      (1, '2026-07-10', '2026-07-20', 'Manutenzione camere'),
      (2, '2026-08-01', '2026-08-05', 'Struttura al completo');

    -- Domande di esempio - SHG Hotel
    INSERT OR IGNORE INTO questions (id_struttura, nome_autore, email_autore, testo, creato_il)
    VALUES
      (1, 'Giorgio', NULL, 'Buongiorno. Volevo chiedere se ci fossero parcheggi gratuiti in zona', '2023-12-25 12:35:00'),
      (1, 'Vincenzo Russotto', 'camminatore@test.it', 'È inclusa la colazione?', '2024-03-07 09:56:00');

    -- Domande - Rifugio Lagazuoi
    INSERT OR IGNORE INTO questions (id_struttura, nome_autore, email_autore, testo, creato_il)
    VALUES
      (4, 'Lucia', NULL, 'Salve, il rifugio è aperto anche a settembre?', '2025-06-15 10:20:00'),
      (4, 'Andrea', NULL, 'Si può arrivare con la funivia?', '2025-07-02 14:45:00');

    -- Risposte
    INSERT OR IGNORE INTO answers (id_domanda, email_risponditore, testo, creato_il)
    VALUES
      (1, 'ristoratore@test.it', 'Certamente. A 5 minuti a piedi dalla struttura vi è un comodo e ampio parcheggio gratuito. È chiuso solo di domenica per il mercato cittadino.', '2023-12-30 17:24:00'),
      (3, 'ristoratore@test.it', 'Sì, il rifugio è aperto da giugno a fine settembre, meteo permettendo.', '2025-06-16 09:00:00');

    -- Prenotazioni demo
    INSERT OR IGNORE INTO booking_requests (id_struttura, email_camminatore, check_in, check_out, numero_ospiti, status)
    VALUES
      (1, 'camminatore@test.it', '2026-06-15', '2026-06-18', 2, 'pending'),
      (1, 'camminatore@test.it', '2025-05-10', '2025-05-12', 2, 'accepted');

    -- Recensioni demo
    INSERT OR IGNORE INTO reviews (id_struttura, email_camminatore, voto, testo, creato_il)
    VALUES
      (1, 'camminatore@test.it', 5, 'Ottima esperienza: camere pulite e personale molto disponibile.', '2025-05-13 10:15:00');
  `;

  db.exec(seed, (err) => {
    if (err) {
      console.error('Errore inserimento dati seed:', err.message);
    } else {
      console.log('Dati seed inseriti.');
    }
    db.close();
    console.log('Database inizializzato con successo.');
  });
});
