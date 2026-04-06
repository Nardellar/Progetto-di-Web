# Istruzioni per installare e provare il progetto

---
## Quick Start

1. Aprire un terminale nella cartella `server_backend`:

```bash
cd server_backend
npm install
```

2. Avviare il server:

```bash
npm start
```

Applicazione disponibile su `http://localhost:3000`.

Per sviluppo con riavvio automatico:

```bash
npm run dev
```

---
## Database SQLite

- DB usato in esecuzione: `server_backend/db/trekking.db`
- Schema: `server_backend/db/schema.sql`
- Seed: `server_backend/db/init.js`
- Dump consegna: `server_backend/db/trekking_dump.sql`

### Quando usare `node db/init.js`

`npm start` **non** popola il DB: avvia solo il server.

Eseguire `node db/init.js` solo se vuoi ricreare il database da zero:

```bash
cd server_backend
node db/init.js
```

Attenzione: questa operazione sovrascrive i dati presenti nel DB.

### Rigenerare il dump prima della consegna

Dopo le ultime modifiche dati (strutture, immagini, ecc.), rigenera il dump:

```bash
cd server_backend/db
sqlite3 trekking.db ".dump" > trekking_dump.sql
```

---
## Utenti di prova

| Ruolo | Email | Password |
|---|---|---|
| Ristoratore | `ristoratore@test.it` | `password` |
| Camminatore | `camminatore@test.it` | `password` |

Se il DB e stato creato con un seed vecchio, elimina `server_backend/db/trekking.db` e riesegui `node db/init.js`, oppure registra nuovi account da `/registrazione`.

---
## Testing funzionalita

### 1) Utenti non autenticati
- navigazione pagine pubbliche;
- ricerca testuale (barra in alto a destra);
- consultazione dettagli cammini/strutture;
- invio domanda (con nome autore richiesto).

### 2) Camminatore autenticato
- registrazione/login;
- invio domande alle strutture;
- cancellazione delle proprie domande;
- invio richieste di prenotazione;
- inserimento/modifica recensione solo dopo soggiorno completato (prenotazione `accepted` passata);
- gestione profilo (nome, cognome, immagine profilo).

### 3) Ristoratore autenticato
- area `gestione strutture` dalla pagina profilo;
- creazione/aggiornamento/eliminazione struttura;
- modifica cammino e tappa della struttura;
- gestione immagini e servizi struttura;
- risposta/modifica/cancellazione risposte alle domande;
- accettazione/rifiuto prenotazioni.

---
## Report

Il report e in:

- `REPORT_PROGETTO.md`

---
## Struttura cartelle principale (`server_backend`)

| Cartella / file | Contenuto |
|---|---|
| `app.js` | Configurazione Express, sessione, Passport |
| `routes/` | Route HTTP |
| `controllers/` | Logica applicativa |
| `views/` | Template EJS |
| `public/` | CSS, JavaScript, immagini, GPX statici |
| `db/` | SQLite, `init.js`, `schema.sql`, `trekking_dump.sql` |
| `middleware/` | Auth, upload file |
| `bin/www` | Avvio server HTTP |

---
## Autore

Simone Nardella - Matricola 20051048
