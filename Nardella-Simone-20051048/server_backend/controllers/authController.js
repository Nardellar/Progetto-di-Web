'use strict';

const bcrypt = require('bcrypt');
const db = require('../db/database');

const salt_rounds = 10;

function normalizePersonName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((token) => token
      .split(/(['-])/)
      .map((part) => {
        if (part === '\'' || part === '-') return part;
        if (!part) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(''))
    .join(' ');
}

function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {

      if (err) {
        reject(err);
      }

      else {
        resolve(row);
      }
    });
  });
}

function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {

      if (err) {
        reject(err);
      }

      else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

exports.getRegistrazione = (req, res) => { 
  if (req.isAuthenticated()) {
    return res.redirect('/'); //reindirizzamento nel caso di utente già registrato
  }

  res.render('registrazione', {
    title: 'Accedi o Registrati',
    activeForm: req.query.form || 'login',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

exports.postRegister = async (req, res) => {
  const { email, password, nome, cognome, role } = req.body;

  if (!email || !password || !nome || !cognome || !role) {
    return res.redirect('/registrazione?error=Tutti i campi sono obbligatori&form=register');
  }

  if (!['camminatore', 'ristoratore'].includes(role)) {
    return res.redirect('/registrazione?error=Ruolo non valido&form=register');
  }

  try {
    const existing = await dbGet('SELECT email FROM utenti WHERE email = ?', [email]);
    if (existing) {
      return res.redirect('/registrazione?error=Email già registrata&form=register');
    }

    const hash = await bcrypt.hash(password, salt_rounds);
    const normalizedNome = normalizePersonName(nome);
    const normalizedCognome = normalizePersonName(cognome);
    await dbRun(
      'INSERT INTO utenti (email, password_hash, nome, cognome, role) VALUES (?, ?, ?, ?, ?)',
      [email, hash, normalizedNome, normalizedCognome, role]
    );

    res.redirect('/registrazione?success=Registrazione completata! Effettua il login.');
  } catch (err) {
    console.error('Errore registrazione:', err.message);
    res.redirect('/registrazione?error=Errore durante la registrazione&form=register');
  }
};

exports.postLogout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Errore logout:', err.message);
      return res.redirect('/');
    }

    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('Errore distruzione sessione:', destroyErr.message);
        }
        res.clearCookie('connect.sid');
        return res.redirect('/');
      });
      return;
    }

    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
};
