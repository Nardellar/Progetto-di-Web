'use strict';

/**
 * Errore applicativo con status HTTP e redirect opzionale.
 * Estende Error per integrarsi col middleware di Express.
 */
class AppError extends Error {
  constructor(message, status = 500, redirectUrl = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.redirectUrl = redirectUrl;
  }

  static notFound(message = 'Risorsa non trovata') {
    return new AppError(message, 404);
  }

  static forbidden(message = 'Accesso non autorizzato') {
    return new AppError(message, 403);
  }

  static badRequest(message = 'Richiesta non valida') {
    return new AppError(message, 400);
  }
}

module.exports = AppError;
