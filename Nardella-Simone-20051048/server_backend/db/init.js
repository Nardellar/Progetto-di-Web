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
      ('Kungsleden', 'kungsleden', 'Abisko', 'Hemavan', 'Svezia', 'Estate', 20, 440,
       'Un sentiero storico nel nord della Svezia, che attraversa paesaggi selvaggi e antiche foreste.',
       'Kungsleden.jpg'),
      ('Cammino Grande di Celestino', 'cammino-grande-di-celestino', 'L''Aquila', 'Sulmona', 'Abruzzo', 'Primavera/Estate', 7, 90,
       'Un percorso spirituale attraverso l''Italia meridionale, seguendo le orme di San Celestino V.',
       'Cammino Grande di Celestino.jpg'),
      ('Alta Via Dolomitica', 'alta-via-dolomitica', 'Braies', 'Belluno', 'Trentino-Alto Adige/Veneto', 'Estate', 10, 120,
       'Un percorso alpino tra le Dolomiti, con panorami mozzafiato sulle vette più famose.',
       'Alta via Dolomitica.jpg'),
      ('Grande Anello dei Sibillini', 'grande-anello-dei-sibillini', 'Visso', 'Visso', 'Marche/Umbria', 'Primavera/Estate', 9, 120,
       'Un anello escursionistico nel cuore del Parco Nazionale dei Monti Sibillini.',
       'GrandeAnelloDeiSibillini.jpg'),
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
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 1, 'SHG Hotel', 'Zola Predosa', 'Via Risorgimento 186', 
       'Hotel con WiFi, ristorante e bar. Valutato 8,1 per coppie.',
       'BadoloHotel1.jpg', 75.00, 30),
      ('ristoratore@test.it', 1, 'Appartamento degli Dei', 'Madonna dei Fornelli', 'Via del Centro 12',
       'Affittacamere con vista montagna, colazione italiana inclusa.',
       'ViaDegliDeiHotel2.jpg', 55.00, 8),
      ('ristoratore@test.it', 1, 'Residence Mugello Resort', 'Scarperia', 'Via Mugello 5',
       'Appartamenti con angolo cottura e vista giardino, a 30 km da Firenze.',
       'ViaDegliDeiHotel3.jpg', 95.00, 20);

    -- Strutture - Alta Via Dolomitica (trail_id = 4)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 4, 'Rifugio Lagazuoi', 'Cortina d''Ampezzo', 'Passo Falzarego',
       'Rifugio alpino a 2752m con vista panoramica sulle Dolomiti, cucina tipica tirolese.',
       NULL, 60.00, 40),
      ('ristoratore@test.it', 4, 'Hotel Tre Cime', 'Auronzo di Cadore', 'Via Nazionale 15',
       'Hotel accogliente ai piedi delle Tre Cime di Lavaredo, ideale per escursionisti.',
       NULL, 85.00, 25);

    -- Strutture - Magna Via Francigena (trail_id = 6)
    INSERT OR IGNORE INTO facilities (email_ristoratore, id_cammino, nome, citta, indirizzo, descrizione, immagine, prezzo_notte, capacita)
    VALUES
      ('ristoratore@test.it', 6, 'Agriturismo Valle dei Templi', 'Agrigento', 'Contrada San Biagio',
       'Agriturismo immerso negli uliveti siciliani, a pochi km dalla Valle dei Templi.',
       NULL, 45.00, 12);

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

    -- Prenotazione demo
    INSERT OR IGNORE INTO booking_requests (id_struttura, email_camminatore, check_in, check_out, numero_ospiti, status)
    VALUES
      (1, 'camminatore@test.it', '2026-06-15', '2026-06-18', 2, 'pending');
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
