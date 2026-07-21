PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE utenti (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  immagine_profilo TEXT,
  role TEXT NOT NULL CHECK(role IN ('camminatore', 'ristoratore')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO utenti VALUES('ristoratore@test.it','$2b$10$2CufpTrnWNORv8kop83vyeReoA56As89YeuG0hZ.p6kilSm2zpB8K','Riccardo','Mocchetto','profiles/ristoratore_test.it-1775479686508.jpg','ristoratore','2026-04-05 23:38:30');
INSERT INTO utenti VALUES('camminatore@test.it','$2b$10$2CufpTrnWNORv8kop83vyeReoA56As89YeuG0hZ.p6kilSm2zpB8K','Marco','Rossi',NULL,'camminatore','2026-04-05 23:38:30');
CREATE TABLE cammini (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  citta_partenza TEXT NOT NULL,
  citta_arrivo TEXT NOT NULL,
  regione TEXT,
  stagione_ideale TEXT,
  numero_tappe INTEGER CHECK(numero_tappe >= 0),
  lunghezza_totale_km REAL CHECK(lunghezza_totale_km >= 0),
  descrizione TEXT,
  immagine TEXT
);
INSERT INTO cammini VALUES(1,'Via degli Dei','via-degli-dei','Bologna','Firenze','Emilia-Romagna/Toscana','Primavera/Autunno',5,130.0,'Un''antica strada escursionistica attraverso i monti dell''Appennino, dalla Toscana all''Emilia-Romagna.','trails/Via degli Dei.jpg');
INSERT INTO cammini VALUES(2,'Cammino Grande di Celestino','cammino-grande-di-celestino','L''Aquila','Sulmona','Abruzzo','Primavera/Estate',5,90.0,'Un percorso spirituale attraverso l''Italia meridionale, seguendo le orme di San Celestino V.','trails/Cammino Grande di Celestino.jpg');
INSERT INTO cammini VALUES(3,'Alta Via Dolomitica','alta-via-dolomitica','Lago di Braies','Belluno','Dolomiti (Alto Adige/Veneto)','Giugno-Settembre',11,125.0,'L''Alta Via 1 delle Dolomiti attraversa il cuore delle Dolomiti dal Lago di Braies fino a Belluno, lungo un itinerario tra i piu spettacolari e celebri al mondo.','trails/Alta via Dolomitica.jpg');
INSERT INTO cammini VALUES(4,'Magna Via Francigena','magna-via-francigena','Palermo','Agrigento','Sicilia','Primavera/Autunno',9,180.0,'Un cammino che attraversa la Sicilia, seguendo le antiche vie dei pellegrini.','trails/magnaViaFrancigena.jpg');
INSERT INTO cammini VALUES(5,'Cammino dei Briganti','cammino-dei-briganti','Sante Marie','Sante Marie','Lazio/Abruzzo','Primavera/Autunno',7,100.0,'Un anello tra Lazio e Abruzzo sulle tracce dei briganti post-unitari.','trails/camminoDeiBriganti.jpg');
CREATE TABLE cammini_stagioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cammino INTEGER NOT NULL,
  stagione TEXT NOT NULL CHECK(stagione IN ('primavera', 'estate', 'autunno', 'inverno')),
  FOREIGN KEY (id_cammino) REFERENCES cammini(id),
  UNIQUE (id_cammino, stagione)
);
INSERT INTO cammini_stagioni VALUES(1,1,'primavera');
INSERT INTO cammini_stagioni VALUES(2,1,'autunno');
INSERT INTO cammini_stagioni VALUES(3,2,'primavera');
INSERT INTO cammini_stagioni VALUES(4,2,'estate');
INSERT INTO cammini_stagioni VALUES(5,3,'estate');
INSERT INTO cammini_stagioni VALUES(6,4,'primavera');
INSERT INTO cammini_stagioni VALUES(7,4,'autunno');
INSERT INTO cammini_stagioni VALUES(8,5,'primavera');
INSERT INTO cammini_stagioni VALUES(9,5,'autunno');
CREATE TABLE strutture (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_ristoratore TEXT NOT NULL,
  id_cammino INTEGER,
  nome TEXT NOT NULL,
  citta TEXT NOT NULL,
  numero_tappa INTEGER CHECK(numero_tappa >= 0),
  indirizzo TEXT,
  descrizione TEXT,
  immagine TEXT,
  prezzo_notte REAL CHECK(prezzo_notte >= 0),
  capacita INTEGER DEFAULT 0,
  FOREIGN KEY (email_ristoratore) REFERENCES utenti(email),
  FOREIGN KEY (id_cammino) REFERENCES cammini(id),
  UNIQUE (id_cammino, nome)
);
INSERT INTO strutture VALUES(1,'ristoratore@test.it',1,'SHG Hotel','Bologna',NULL,'Via Risorgimento 186','Hotel con WiFi, ristorante e bar. Valutato 8,1 per coppie.','facilities/seed/ristoratore_test.it-285328376-1775484045187.jpg',75.0,30);
INSERT INTO strutture VALUES(2,'ristoratore@test.it',1,'Residence Mugello','Madonna dei Fornelli',2,'Via del Centro 12','Affittacamere con vista montagna, colazione italiana inclusa.','facilities/seed/ristoratore_test.it-ViaDegliDeiHotel2-1775484102579.jpg',55.0,8);
INSERT INTO strutture VALUES(3,'ristoratore@test.it',1,'Residence Mugello Resort','Scarperia',4,'Via Mugello 5','Appartamenti con angolo cottura e vista giardino, a 30 km da Firenze.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483923371.jpg',95.0,20);
INSERT INTO strutture VALUES(4,'ristoratore@test.it',1,'Locanda del Passo','Monzuno',3,'Via della Torre 8','Locanda di montagna con camere essenziali, ideale per una sosta tranquilla.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483902497.jpg',62.0,14);
INSERT INTO strutture VALUES(5,'ristoratore@test.it',1,'B&B Collina del Sole','Firenze',5,'Via del Pellegrino 22','Bed & breakfast in centro storico con colazione artigianale.','facilities/seed/ristoratore_test.it-ristoratore_test.it-firenze-177540329465-1775483696367.webp',88.0,10);
INSERT INTO strutture VALUES(6,'ristoratore@test.it',3,'Rifugio Lagazuoi','Cortina d''Ampezzo',3,'Passo Falzarego','Rifugio alpino a 2752m con vista panoramica sulle Dolomiti, cucina tipica tirolese.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775481865562.webp',60.0,40);
INSERT INTO strutture VALUES(9,'ristoratore@test.it',3,'Albergo delle Cime','Belluno (La Pissa)',11,'Via degli Alpini 9','Albergo a gestione familiare vicino al centro storico.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483414284.jpg',78.0,20);
INSERT INTO strutture VALUES(11,'ristoratore@test.it',2,'Casa del Pellegrino Alento','Serramonacesca',5,'Contrada Abbazia 3','Alloggio per camminatori vicino all''Abbazia di San Liberatore, atmosfera semplice e accogliente con spazi comuni e deposito zaini.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483389781.jpg',55.0,12);
INSERT INTO strutture VALUES(12,'ristoratore@test.it',2,'Borgo del Morrone','L''Aquila',NULL,'Via Badia 18','Affittacamere storico con camere luminose e deposito bici.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483286540.jpg',72.0,16);
INSERT INTO strutture VALUES(13,'ristoratore@test.it',4,'Agriturismo Valle dei Templi','Agrigento',9,'Contrada San Biagio','Agriturismo immerso negli uliveti siciliani, a pochi km dalla Valle dei Templi.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483134931.jpg',45.0,12);
INSERT INTO strutture VALUES(14,'ristoratore@test.it',4,'Casa dei Pellegrini','Santa Cristina Gela',1,'Via del Rosario 11','Alloggio semplice con camere private e spazi comuni.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483096530.webp',52.0,14);
INSERT INTO strutture VALUES(17,'ristoratore@test.it',5,'B&B Valle del Salto','Cartore',3,'Via Fonte 6','Camere in pietra con colazione casalinga.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483076578.jpg',48.0,8);
INSERT INTO strutture VALUES(18,'ristoratore@test.it',5,'Rifugio dei Marsi','Tagliacozzo',7,'Via della Rocca 14','Rifugio con vista sulla valle, perfetto per l''ultima tappa.','facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775481841163.jpg',60.0,15);
CREATE TABLE immagini_struttura (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  percorso_immagine TEXT NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_struttura) REFERENCES strutture(id),
  UNIQUE (id_struttura, percorso_immagine)
);
INSERT INTO immagini_struttura VALUES(11,18,'facilities/seed/ristoratore_test.it-ristoratore_test.it-460646877-1775133037-1775481831300.jpg','2026-04-06 13:23:51');
INSERT INTO immagini_struttura VALUES(12,18,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775481841163.jpg','2026-04-06 13:24:01');
INSERT INTO immagini_struttura VALUES(13,6,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775481855649.jpg','2026-04-06 13:24:15');
INSERT INTO immagini_struttura VALUES(14,6,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775481865562.webp','2026-04-06 13:24:25');
INSERT INTO immagini_struttura VALUES(15,17,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483057971.jpg','2026-04-06 13:44:17');
INSERT INTO immagini_struttura VALUES(16,17,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483076578.jpg','2026-04-06 13:44:36');
INSERT INTO immagini_struttura VALUES(17,14,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483088885.webp','2026-04-06 13:44:48');
INSERT INTO immagini_struttura VALUES(18,14,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483096530.webp','2026-04-06 13:44:56');
INSERT INTO immagini_struttura VALUES(19,13,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483125791.jpg','2026-04-06 13:45:25');
INSERT INTO immagini_struttura VALUES(20,13,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483134931.jpg','2026-04-06 13:45:34');
INSERT INTO immagini_struttura VALUES(21,12,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483264065.jpg','2026-04-06 13:47:44');
INSERT INTO immagini_struttura VALUES(22,12,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483286540.jpg','2026-04-06 13:48:06');
INSERT INTO immagini_struttura VALUES(23,11,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483383846.jpg','2026-04-06 13:49:43');
INSERT INTO immagini_struttura VALUES(24,11,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483389781.jpg','2026-04-06 13:49:49');
INSERT INTO immagini_struttura VALUES(25,9,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483402603.webp','2026-04-06 13:50:02');
INSERT INTO immagini_struttura VALUES(26,9,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483414284.jpg','2026-04-06 13:50:14');
INSERT INTO immagini_struttura VALUES(27,5,'facilities/seed/ristoratore_test.it-ristoratore_test.it-firenze2-17754032892-1775483683987.webp','2026-04-06 13:54:44');
INSERT INTO immagini_struttura VALUES(28,5,'facilities/seed/ristoratore_test.it-ristoratore_test.it-firenze-177540329465-1775483696367.webp','2026-04-06 13:54:56');
INSERT INTO immagini_struttura VALUES(29,4,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483892458.jpg','2026-04-06 13:58:12');
INSERT INTO immagini_struttura VALUES(30,4,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483902497.jpg','2026-04-06 13:58:22');
INSERT INTO immagini_struttura VALUES(31,3,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483910849.webp','2026-04-06 13:58:30');
INSERT INTO immagini_struttura VALUES(32,3,'facilities/seed/ristoratore_test.it-ristoratore_test.it-ristoratore_test.it--1775483923371.jpg','2026-04-06 13:58:43');
INSERT INTO immagini_struttura VALUES(33,1,'facilities/seed/ristoratore_test.it-513956112-1775484040159.jpg','2026-04-06 14:00:40');
INSERT INTO immagini_struttura VALUES(34,1,'facilities/seed/ristoratore_test.it-285328376-1775484045187.jpg','2026-04-06 14:00:45');
INSERT INTO immagini_struttura VALUES(35,2,'facilities/seed/ristoratore_test.it-ViaDegliDeiHotel3-1775484088986.jpg','2026-04-06 14:01:28');
INSERT INTO immagini_struttura VALUES(36,2,'facilities/seed/ristoratore_test.it-ViaDegliDeiHotel2-1775484102579.jpg','2026-04-06 14:01:42');
CREATE TABLE servizi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  icona TEXT NOT NULL CHECK(icona IN ('fa', 'material')),
  valore_icona TEXT NOT NULL,
  ordine INTEGER NOT NULL DEFAULT 0
);
INSERT INTO servizi VALUES(1,'camere-non-fumatori','Camere non fumatori','material','smoke_free',20);
INSERT INTO servizi VALUES(2,'ristorante','Ristorante','material','restaurant',30);
INSERT INTO servizi VALUES(3,'ospiti-disabili','Camere/strutture per ospiti disabili','fa','fa-wheelchair',40);
INSERT INTO servizi VALUES(4,'servizio-in-camera','Servizio in camera','material','room_service',50);
INSERT INTO servizi VALUES(5,'wifi-gratuito','Connessione WiFi gratuita','fa','fa-wifi',60);
INSERT INTO servizi VALUES(6,'camere-familiari','Camere familiari','fa','fa-users',70);
INSERT INTO servizi VALUES(7,'bar','Bar','material','local_bar',80);
INSERT INTO servizi VALUES(8,'colazione','Colazione','material','free_breakfast',90);
CREATE TABLE servizi_struttura (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  id_servizio INTEGER NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_struttura) REFERENCES strutture(id),
  FOREIGN KEY (id_servizio) REFERENCES servizi(id),
  UNIQUE (id_struttura, id_servizio)
);
INSERT INTO servizi_struttura VALUES(1,2,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(2,2,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(3,2,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(4,2,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(5,2,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(6,2,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(7,2,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(8,2,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(9,5,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(10,5,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(11,5,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(12,5,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(13,5,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(14,5,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(15,5,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(16,5,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(17,4,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(18,4,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(19,4,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(20,4,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(21,4,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(22,4,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(23,4,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(24,4,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(25,3,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(26,3,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(27,3,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(28,3,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(29,3,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(30,3,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(31,3,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(32,3,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(33,1,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(34,1,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(35,1,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(36,1,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(37,1,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(38,1,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(39,1,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(40,1,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(41,12,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(42,12,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(43,12,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(44,12,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(45,12,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(46,12,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(47,12,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(48,12,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(49,11,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(50,11,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(51,11,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(52,11,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(53,11,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(54,11,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(55,11,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(56,11,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(65,9,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(66,9,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(67,9,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(68,9,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(69,9,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(70,9,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(71,9,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(72,9,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(81,6,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(82,6,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(83,6,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(84,6,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(85,6,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(86,6,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(87,6,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(88,6,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(97,13,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(98,13,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(99,13,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(100,13,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(101,13,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(102,13,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(103,13,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(104,13,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(105,14,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(106,14,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(107,14,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(108,14,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(109,14,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(110,14,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(111,14,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(112,14,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(121,17,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(122,17,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(123,17,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(124,17,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(125,17,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(126,17,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(127,17,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(128,17,5,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(137,18,7,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(138,18,6,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(139,18,1,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(140,18,8,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(141,18,3,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(142,18,2,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(143,18,4,'2026-04-05 23:38:30');
INSERT INTO servizi_struttura VALUES(144,18,5,'2026-04-05 23:38:30');
CREATE TABLE prenotazioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  email_camminatore TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  numero_ospiti INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (date(check_out) >= date(check_in)),
  FOREIGN KEY (id_struttura) REFERENCES strutture(id),
  FOREIGN KEY (email_camminatore) REFERENCES utenti(email)
);
INSERT INTO prenotazioni VALUES(1,1,'camminatore@test.it','2026-06-15','2026-06-18',2,'pending','2026-04-04 21:42:50');
INSERT INTO prenotazioni VALUES(2,1,'camminatore@test.it','2025-05-10','2025-05-12',2,'accepted','2026-04-04 21:42:50');
CREATE TABLE domande (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  nome_autore TEXT NOT NULL,
  email_autore TEXT,
  testo TEXT NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_struttura) REFERENCES strutture(id),
  FOREIGN KEY (email_autore) REFERENCES utenti(email)
);
INSERT INTO domande VALUES(1,1,'Giorgio',NULL,'Buongiorno. Volevo chiedere se ci fossero parcheggi gratuiti in zona','2023-12-25 12:35:00');
INSERT INTO domande VALUES(2,1,'Vincenzo Russotto','camminatore@test.it','È inclusa la colazione?','2024-03-07 09:56:00');
INSERT INTO domande VALUES(3,6,'Lucia',NULL,'Salve, il rifugio è aperto anche a settembre?','2025-06-15 10:20:00');
INSERT INTO domande VALUES(4,6,'Andrea',NULL,'Si può arrivare con la funivia?','2025-07-02 14:45:00');
CREATE TABLE risposte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_domanda INTEGER NOT NULL,
  email_risponditore TEXT NOT NULL,
  testo TEXT NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_domanda) REFERENCES domande(id),
  FOREIGN KEY (email_risponditore) REFERENCES utenti(email)
);
INSERT INTO risposte VALUES(1,1,'ristoratore@test.it','Certamente. A 5 minuti a piedi dalla struttura vi è un comodo e ampio parcheggio gratuito. È chiuso solo di domenica per il mercato cittadino.','2023-12-30 17:24:00');
INSERT INTO risposte VALUES(2,3,'ristoratore@test.it','Sì, il rifugio è aperto da giugno a fine settembre, meteo permettendo.','2025-06-16 09:00:00');
CREATE TABLE recensioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  email_camminatore TEXT NOT NULL,
  voto INTEGER NOT NULL CHECK(voto BETWEEN 1 AND 5),
  testo TEXT,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_struttura, email_camminatore),
  FOREIGN KEY (id_struttura) REFERENCES strutture(id),
  FOREIGN KEY (email_camminatore) REFERENCES utenti(email)
);
INSERT INTO recensioni VALUES(1,1,'camminatore@test.it',5,'Ottima esperienza: camere pulite e personale molto disponibile.','2025-05-13 10:15:00');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('cammini',5);
INSERT INTO sqlite_sequence VALUES('strutture',18);
INSERT INTO sqlite_sequence VALUES('servizi',8);
INSERT INTO sqlite_sequence VALUES('cammini_stagioni',9);
INSERT INTO sqlite_sequence VALUES('servizi_struttura',144);
INSERT INTO sqlite_sequence VALUES('immagini_struttura',36);
INSERT INTO sqlite_sequence VALUES('domande',4);
INSERT INTO sqlite_sequence VALUES('risposte',2);
INSERT INTO sqlite_sequence VALUES('prenotazioni',2);
INSERT INTO sqlite_sequence VALUES('recensioni',1);
COMMIT;
