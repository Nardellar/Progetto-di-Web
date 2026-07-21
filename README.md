# Trekking UPO — Portale cammini e strutture

Applicazione web per esplorare cammini di trekking, consultare strutture lungo il percorso e gestire prenotazioni, domande e recensioni.

Due ruoli utente:

- **Camminatore**: ricerca percorsi/strutture, prenota, chiede informazioni, recensisce dopo un soggiorno.
- **Ristoratore**: gestisce le proprie strutture, immagini, servizi e risponde a prenotazioni e domande.

Progetto d’esame **MF0438** — Simone Nardella (matricola 20051048).

---

## Stack

| Area | Tecnologia |
|---|---|
| Backend | Node.js, Express |
| Template SSR | EJS |
| Database | SQLite (`sqlite3`) |
| Auth | Passport Local + `express-session` + bcrypt |
| Validazione | express-validator |
| Upload | Multer |
| Mappe | Leaflet + tracce GPX statiche |

---

## Requisiti

- Node.js e npm
- Opzionale: CLI `sqlite3` (solo se preferisci il dump SQL al posto di `node db/init.js`)

---

## Quick Start

Dalla root del repository:

```bash
cd Nardella-Simone-20051048/server_backend
npm install
```

### Creare / popolare il database

Scegli **una** delle due opzioni.

**Opzione A — seed Node (consigliata):**

```bash
node db/init.js
```

**Opzione B — dump SQL:**

```bash
sqlite3 db/trekking.db < db/trekking_dump.sql
```

Se hai un database vecchio o inconsistente, elimina `db/trekking.db` e riesegui l’inizializzazione.

### Avviare il server

```bash
npm start
```

Applicazione su [http://localhost:3000](http://localhost:3000).

### Variabile d’ambiente (opzionale)

| Variabile | Default | Uso |
|---|---|---|
| `SESSION_SECRET` | `trekking-upo-secret-2026` | Secret per firmare il cookie di sessione |

Esempio:

```bash
SESSION_SECRET='il-tuo-secret' npm start
```

---

## Utenti di prova

| Ruolo | Email | Password |
|---|---|---|
| Ristoratore | `ristoratore@test.it` | `password` |
| Camminatore | `camminatore@test.it` | `password` |

---

## Funzionalità principali

### Utenti non autenticati

- Navigazione pagine pubbliche
- Ricerca testuale (barra in alto)
- Dettaglio cammini e strutture (con mappa GPX dove disponibile)
- Invio domanda a una struttura (nome autore obbligatorio se anonimo)

### Camminatore autenticato

- Login / logout / aggiornamento profilo (inclusa immagine)
- Richieste di prenotazione
- Domande e cancellazione delle proprie
- Recensione solo dopo prenotazione `accepted` con check-out passato

### Ristoratore autenticato

- Area gestione strutture (`/gestione`)
- CRUD strutture, immagini, servizi, cammino/tappa
- Accettazione / rifiuto prenotazioni
- Risposta / modifica / cancellazione risposte alle domande

---

## Mappe GPX

Le tracce sono file statici in `Nardella-Simone-20051048/server_backend/public/gpx`.  
Il nome file per ciascun cammino è associato allo slug in `Nardella-Simone-20051048/server_backend/config/trailDetails.js`.  
Nella pagina sentiero, `trail-map.js` scarica il GPX e lo disegna con Leaflet.

---

## Struttura cartelle

```text
Nardella-Simone-20051048/
├── README.md
├── Traccia/                 # PDF traccia d’esame
├── documentazione/          # Relazione PDF
└── server_backend/
    ├── app.js               # Express, sessione, Passport, router
    ├── bin/www              # Avvio HTTP
    ├── routes/              # Route HTTP
    ├── controllers/         # Logica applicativa
    ├── views/               # Template EJS
    ├── public/              # CSS, JS, immagini, GPX
    ├── db/                  # schema, seed, dump SQLite
    ├── middleware/          # Auth e upload
    └── config/              # Dettagli cammini (tappe, GPX, gallery)
```

---

## Documentazione d’esame

- Traccia: [`Traccia/MF0438 - Progetto Esame.docx.pdf`](Nardella-Simone-20051048/Traccia/MF0438 - Progetto Esame.docx.pdf)
- Relazione: [`Nardella-Simone-20051048/documentazione/Relazione.pdf`](Nardella-Simone-20051048/documentazione/Relazione.pdf)

---

## Note

- Il file `db/trekking.db` è generato in locale e **non** è versionato.
- Le immagini caricate dagli utenti a runtime (profilo / strutture) non sono versionate.
- In repo restano gli esempi demo in `public/images/facilities/seed/` e l’avatar di default in `profiles/defaults/`, così un clone ha subito strutture con foto.

---

## Autore

Simone Nardella — Matricola 20051048
