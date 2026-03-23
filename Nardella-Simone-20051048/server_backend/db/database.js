'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'trekking.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Errore apertura database:', err.message);
    throw err;
  }
  console.log('Connesso al database SQLite:', DB_PATH);
});

db.run('PRAGMA foreign_keys = ON');

module.exports = db;
