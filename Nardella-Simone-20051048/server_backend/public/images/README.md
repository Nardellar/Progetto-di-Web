# Organizzazione immagini

Questa cartella contiene sia asset statici del sito sia upload utente.

## Struttura

- `site/`: immagini UI/globali (logo, footer, texture, banner)
- `trails/`: immagini relative ai cammini/percorsi
- `profiles/`: immagini profilo caricate dagli utenti
  - `profiles/defaults/`: avatar di default
- `facilities/`: immagini strutture
  - `facilities/seed/`: immagini demo versionate (usate da `db/init.js` e dal dump)
  - `facilities/` (root): upload runtime dei ristoratori (non versionati)
- `blog/`: immagini specifiche blog

## Convenzione path

Usa sempre path espliciti con sottocartella, ad esempio:

- `/images/site/...`
- `/images/trails/...`
- `/images/profiles/...`
- `/images/facilities/...`

