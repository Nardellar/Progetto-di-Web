# Organizzazione immagini

Questa cartella contiene sia asset statici del sito sia upload utente.

## Struttura

- `site/`: immagini UI/globali (logo, footer, texture, banner)
- `trails/`: immagini relative ai cammini/percorsi
- `facility-showcase/`: immagini statiche di esempio per strutture
- `profiles/`: immagini profilo caricate dagli utenti
  - `profiles/defaults/`: avatar di default
- `facilities/`: immagini caricate dai ristoratori per le strutture
- `blog/`: immagini specifiche blog

## Compatibilita legacy

Il progetto mantiene la compatibilita con i vecchi riferimenti `/images/<nomefile>`
grazie alla mappa in `server_backend/config/imageLegacyMap.js` e al middleware in `server_backend/app.js`.

Questo permette di riordinare i file senza dover aggiornare subito tutte le view/CSS/record DB.

