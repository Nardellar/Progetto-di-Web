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
    INSERT OR IGNORE INTO trails (name, slug, city_start, city_end, description, image)
    VALUES
      ('Via degli Dei', 'via-degli-dei', 'Bologna', 'Firenze',
       'Un''antica strada escursionistica attraverso i monti dell''Appennino, dalla Toscana all''Emilia-Romagna.',
       'Via degli Dei.jpg'),
      ('Kungsleden', 'kungsleden', 'Abisko', 'Hemavan',
       'Un sentiero storico nel nord della Svezia, che attraversa paesaggi selvaggi e antiche foreste.',
       'Kungsleden.jpg'),
      ('Cammino Grande di Celestino', 'cammino-grande-di-celestino', 'L''Aquila', 'Sulmona',
       'Un percorso spirituale attraverso l''Italia meridionale, seguendo le orme di San Celestino V.',
       'Cammino Grande di Celestino.jpg'),
      ('Alta Via Dolomitica', 'alta-via-dolomitica', 'Braies', 'Belluno',
       'Un percorso alpino tra le Dolomiti, con panorami mozzafiato sulle vette più famose.',
       'Alta via Dolomitica.jpg'),
      ('Grande Anello dei Sibillini', 'grande-anello-dei-sibillini', 'Visso', 'Visso',
       'Un anello escursionistico nel cuore del Parco Nazionale dei Monti Sibillini.',
       'GrandeAnelloDeiSibillini.jpg'),
      ('Magna Via Francigena', 'magna-via-francigena', 'Palermo', 'Agrigento',
       'Un cammino che attraversa la Sicilia, seguendo le antiche vie dei pellegrini.',
       'magnaViaFrancigena.jpg'),
      ('Cammino dei Briganti', 'cammino-dei-briganti', 'Sante Marie', 'Sante Marie',
       'Un anello tra Lazio e Abruzzo sulle tracce dei briganti post-unitari.',
       'camminoDeiBriganti.jpg');

    -- Utente ristoratore di test (password: password123 - hash bcrypt)
    INSERT OR IGNORE INTO users (email, password_hash, nome, role)
    VALUES
      ('ristoratore@test.it', '$2b$10$placeholder_hash_da_sostituire', 'Matteo Barbieri', 'ristoratore'),
      ('camminatore@test.it', '$2b$10$placeholder_hash_da_sostituire', 'Marco Rossi', 'camminatore');

    -- Strutture di test (collegate alla Via degli Dei, trail_id = 1)
    INSERT OR IGNORE INTO facilities (owner_user_id, trail_id, name, city, address, description, image, capacity)
    VALUES
      (1, 1, 'SHG Hotel', 'Zola Predosa', 'Via Risorgimento 186', 
       'Hotel con WiFi, ristorante e bar. Valutato 8,1 per coppie.',
       'BadoloHotel1.jpg', 30),
      (1, 1, 'Appartamento degli Dei', 'Madonna dei Fornelli', 'Via del Centro 12',
       'Affittacamere con vista montagna, colazione italiana inclusa.',
       'ViaDegliDeiHotel2.jpg', 8),
      (1, 1, 'Residence Mugello Resort', 'Scarperia', 'Via Mugello 5',
       'Appartamenti con angolo cottura e vista giardino, a 30 km da Firenze.',
       'ViaDegliDeiHotel3.jpg', 20);

    -- Domande di esempio
    INSERT OR IGNORE INTO questions (facility_id, author_name, author_user_id, text)
    VALUES
      (1, 'Giorgio', NULL, 'Buongiorno. Volevo chiedere se ci fossero parcheggi gratuiti in zona'),
      (1, 'Vincenzo Russotto', 2, 'È inclusa la colazione?');

    -- Risposta di esempio
    INSERT OR IGNORE INTO answers (question_id, responder_user_id, text)
    VALUES
      (1, 1, 'Certamente. A 5 minuti a piedi dalla struttura vi è un comodo e ampio parcheggio gratuito.');
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
