'use strict';

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/registrazione');
}

function isRistoratore(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'ristoratore') return next();
  res.status(403).render('error', { message: 'Accesso non autorizzato', error: { status: 403 } });
}

function isCamminatore(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'camminatore') return next();
  res.status(403).render('error', { message: 'Accesso non autorizzato', error: { status: 403 } });
}

module.exports = { isLoggedIn, isRistoratore, isCamminatore };
