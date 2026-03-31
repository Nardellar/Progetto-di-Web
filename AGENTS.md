# AGENTS.md

## Scope del repository
- Il codice applicativo attivo e' in `Nardella-Simone-20051048/`.
- Il progetto e' un sito statico multi-pagina (nessun backend nel repo): `index.html` -> `gallery.html` -> `Via_degli_Dei.html` -> `blog.html` -> `SHG_Hotel.html`, con `contact.html` per login/registrazione mock.
- Nota di stato confermata in `Nardella-Simone-20051048/README`: molti link sono placeholder e convergono su una singola pagina sentiero/struttura.

## Architettura e flusso contenuti
- Pattern principale: pagine HTML autonome con header/footer ripetuti (non templating).
- Stili condivisi in `Nardella-Simone-20051048/assets/css/style.css`; override pagina in `gallery.css`, `contact.css`, `sentiero.css`, `singoloHotel.css`.
- Dipendenze front-end locali: Bootstrap, jQuery, Owl Carousel, Font Awesome (`Nardella-Simone-20051048/assets/{css,js}`).
- Flusso UX principale:
  - `gallery.html`: catalogo percorsi (cards overlay) -> dettaglio sentiero.
  - `Via_degli_Dei.html`: tappe (accordion Bootstrap) + CTA "Prenota ora" -> `blog.html`.
  - `blog.html`: elenco strutture -> dettaglio struttura `SHG_Hotel.html`.
  - `SHG_Hotel.html`: scheda struttura, Q&A statico, form richiesta prenotazione (non persistente).

## Workflow pratici (senza build)
- Non ci sono `package.json`, test runner o pipeline build: modifica HTML/CSS e verifica in browser.
- Per debug realistico JS/CSS, usa un server statico dalla root del progetto:
  - `python3 -m http.server 8000 --directory /home/snardella/WebstormProjects/Progetto-di-Web/Nardella-Simone-20051048`
  - poi apri `http://localhost:8000/index.html`.
- Aggiorna navbar/footer manualmente in ogni pagina: non esiste include condiviso.

## Convenzioni specifiche del progetto
- Naming pagine in `snake_case`/misto con maiuscole (`Via_degli_Dei.html`, `SHG_Hotel.html`): mantieni nomi coerenti con i link esistenti prima di rinominare.
- Contenuti prevalentemente in italiano; alcuni attributi/meta sono in inglese: evita refactor linguistici globali non richiesti.
- Pattern UI ricorrenti da preservare: `section.header`, `section.footer`, classi Bootstrap grid, bottoni CTA arancioni (`#f04c25/#F04C26`).
- Form in `contact.html` e `SHG_Hotel.html` hanno `action=""`: attualmente sono mock client-side.

## Integrazioni e gap noti (importante prima di toccare JS)
- Riferimenti a file mancanti:
  - `assets/js/script.js` e `assets/js/map.js` in `Via_degli_Dei.html`.
  - `assets/custom/js/custom.js` in `SHG_Hotel.html`.
  - `assets/css/YouTubePopUp.css` in `index.html`.
- Fancybox e YouTubePopUp sono inizializzati in `index.html`/`gallery.html`, ma mancano gli script plugin corrispondenti (solo CSS Fancybox presente, JS assente).
- Se aggiungi nuove feature JS, preferisci file esterni in `assets/js/` e aggiorna i tag `<script>` in modo esplicito.

## Convenzioni AI gia' presenti nel repo
- Regole corso in `Nardella-Simone-20051048/.cursor/rules/mf0438-progetto-esame.mdc` (Node/Express/SQLite/Passport ecc.).
- Lo stato attuale del codice e' pero' statico; tratta quel file come vincolo di direzione progettuale, non come descrizione dell'implementazione corrente.
