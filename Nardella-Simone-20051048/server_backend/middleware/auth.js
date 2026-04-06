'use strict';

var AppError = require('../utils/AppError');

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/registrazione');
}

function isRistoratore(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'ristoratore') return next();
  next(AppError.forbidden());
}

function isCamminatore(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'camminatore') return next();
  next(AppError.forbidden());
}

module.exports = { isLoggedIn, isRistoratore, isCamminatore };
