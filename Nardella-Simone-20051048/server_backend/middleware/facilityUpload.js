'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'public', 'images', 'facilities');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeEmail = String((req.user && req.user.email) || 'ristoratore')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeName = String(file.originalname || 'immagine')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 40);
    cb(null, safeEmail + '-' + safeName + '-' + Date.now() + ext);
  }
});

const fileFilter = function (_req, file, cb) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Formato non valido: carica solo PNG, JPG/JPEG o WEBP'));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024
  }
});

function uploadFacilityImage(req, res, next) {
  upload.single('immagine_struttura')(req, res, function (err) {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Immagine troppo grande: massimo 4MB'
        : err.message;
      return res.redirect('/gestione?errore=' + encodeURIComponent(message));
    }
    next();
  });
}

module.exports = { uploadFacilityImage };
