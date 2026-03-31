PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS utenti (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  immagine_profilo TEXT,
  role TEXT NOT NULL CHECK(role IN ('camminatore', 'ristoratore')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP --serve ai risotratori per mostrare su sito anzianita dell''account
);

CREATE TABLE IF NOT EXISTS trails (
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

CREATE TABLE IF NOT EXISTS facilities (
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
  FOREIGN KEY (id_cammino) REFERENCES trails(id),
  UNIQUE (id_cammino, nome)
);

CREATE TABLE IF NOT EXISTS facility_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  percorso_immagine TEXT NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_struttura) REFERENCES facilities(id),
  UNIQUE (id_struttura, percorso_immagine)
);

CREATE TABLE IF NOT EXISTS service_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  icon_type TEXT NOT NULL CHECK(icon_type IN ('fa', 'material')),
  icon_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS facility_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  id_servizio INTEGER NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_struttura) REFERENCES facilities(id),
  FOREIGN KEY (id_servizio) REFERENCES service_catalog(id),
  UNIQUE (id_struttura, id_servizio)
);

CREATE TABLE IF NOT EXISTS facility_unavailability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  data_da DATE NOT NULL,
  data_a DATE NOT NULL,
  nota TEXT,
  CHECK (date(data_a) >= date(data_da)),
  FOREIGN KEY (id_struttura) REFERENCES facilities(id)
);

CREATE TABLE IF NOT EXISTS booking_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  email_camminatore TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  numero_ospiti INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (date(check_out) >= date(check_in)),
  FOREIGN KEY (id_struttura) REFERENCES facilities(id),
  FOREIGN KEY (email_camminatore) REFERENCES utenti(email)
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  nome_autore TEXT NOT NULL,
  email_autore TEXT,
  testo TEXT NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_struttura) REFERENCES facilities(id),
  FOREIGN KEY (email_autore) REFERENCES utenti(email)
);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_domanda INTEGER NOT NULL,
  email_risponditore TEXT NOT NULL,
  testo TEXT NOT NULL,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_domanda) REFERENCES questions(id),
  FOREIGN KEY (email_risponditore) REFERENCES utenti(email)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_struttura INTEGER NOT NULL,
  email_camminatore TEXT NOT NULL,
  voto INTEGER NOT NULL CHECK(voto BETWEEN 1 AND 5),
  testo TEXT,
  creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_struttura, email_camminatore),
  FOREIGN KEY (id_struttura) REFERENCES facilities(id),
  FOREIGN KEY (email_camminatore) REFERENCES utenti(email)
);
