# Report progetto - MF0438

## 1) Obiettivo e contesto

L'applicazione realizzata e un portale web dedicato ai cammini trekking, con due ruoli utente:
- **camminatore**: puo cercare percorsi e strutture, inviare domande, prenotare e lasciare recensioni;
- **ristoratore**: gestisce le proprie strutture, risponde alle domande e gestisce le richieste di prenotazione.

Il progetto implementa una parte pubblica (consultazione contenuti) e una parte autenticata (azioni riservate per ruolo), in linea con i vincoli della traccia.

## 2) Scelte architetturali

- **Approccio SSR (Server Side Rendering)** con Express + EJS.
- Motivazione principale: mantenere flussi multipagina chiari, coerenti con i laboratori del corso, con logica centralizzata lato server.
- Router principali:
  - `routes/public.js`: pagine pubbliche (`/`, `/percorsi`, `/sentiero/:slug`, `/strutture`, `/struttura/:id`, `/cerca`)
  - `routes/auth.js`: registrazione/login/logout
  - `routes/camminatore.js`: azioni camminatore (domande, prenotazioni, recensioni, profilo)
  - `routes/ristoratore.js`: gestione strutture, risposte, stato prenotazioni

## 3) Stack tecnologico

- **Backend**: Node.js, Express
- **Templating**: EJS
- **Database**: SQLite (`db/trekking.db`)
- **Autenticazione**: Passport Local + sessioni (`express-session`)
- **Validazione input**: `express-validator`
- **Upload immagini**: `multer`
- **Frontend**: HTML5, CSS3, Bootstrap, JavaScript

## 4) Modello dati (sintesi)

Le principali entita sono:
- `utenti` (profili e ruolo)
- `cammini` + `cammini_stagioni`
- `strutture` + `immagini_struttura`
- `servizi` + `servizi_struttura`
- `prenotazioni`
- `domande` + `risposte`
- `recensioni`
- `range_chiusura_struttura`

Lo schema e definito in `db/schema.sql`; dati iniziali e demo in `db/init.js`.

## 5) Flussi funzionali implementati

### 5.1 Utenti non autenticati
- navigazione pagine pubbliche;
- ricerca testuale;
- consultazione dettagli cammini/strutture;
- invio domanda (con nome autore richiesto).

### 5.2 Camminatore autenticato
- registrazione/login;
- invio domande alle strutture;
- cancellazione delle proprie domande;
- invio richieste di prenotazione;
- inserimento/modifica recensione solo dopo soggiorno completato (prenotazione `accepted` conclusa);
- gestione profilo.

### 5.3 Ristoratore autenticato
- area `gestione` con proprie strutture;
- creazione/aggiornamento/eliminazione struttura;
- gestione immagini e servizi struttura;
- risposta/modifica/cancellazione risposte alle domande;
- accettazione/rifiuto prenotazioni;
- statistiche sintetiche su richieste pendenti e domande senza risposta.

## 6) Scelte di validazione e coerenza

- Vincoli lato server su campi obbligatori e range numerici/date.
- Controlli di autorizzazione basati su ruolo e ownership dei dati.
- Nelle view EJS e usato prevalentemente output escaped (`<%= ... %>`) per mitigare XSS.
- Gestione redirect con messaggi utente in query string (`successo`/`errore`) e ancore di sezione.

## 7) Frontend e usabilita

- Struttura multipagina con layout coerente (navbar/footer condivisi via partial EJS).
- Design **desktop-first** con adattamenti responsive tramite Bootstrap e media query.
- Filtri su elenco percorsi e strutture, ricerca e paginazione.
- Componenti dinamici con JS (es. apertura/chiusura form risposta).

## 8) Requisiti della traccia coperti

- JavaScript su backend e frontend
- Node.js + Express + SQLite
- EJS per rendering server-side
- async/await lato backend
- autenticazione con Passport
- funzionalita pubbliche e funzionalita riservate
- ricerca contenuti
- gestione dati su DB (inserimento, aggiornamento, cancellazione, ricerca)

## 9) Limiti attuali e miglioramenti futuri

- Mancano test automatici formali (validazione attualmente manuale/end-to-end).
- Possibile estensione con deploy cloud stabile e monitoraggio errori.
- Migliorabile la documentazione tecnica delle query piu complesse e una maggiore normalizzazione di alcune viste legacy.

## 10) Struttura progetto (cartelle principali)

- `server_backend/app.js`: bootstrap Express/Passport/sessioni
- `server_backend/routes/`: routing HTTP
- `server_backend/controllers/`: logica applicativa
- `server_backend/views/`: template EJS
- `server_backend/public/`: asset statici (CSS/JS/immagini/GPX)
- `server_backend/db/`: SQLite + schema + seed + dump

---
Autore: Simone Nardella  
Corso: Metodologie di Programmazione per il Web (MF0438)

