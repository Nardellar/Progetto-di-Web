'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'public', 'images', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeEmail = String(req.user.email || 'utente')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeEmail + '-' + Date.now() + ext);
  }
});

const fileFilter = function (_req, file, cb) {
  const allowed = ['image/png', 'image/jpeg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Formato non valido: carica solo PNG o JPG/JPEG'));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

function uploadProfileImage(req, res, next) {
  upload.single('immagine_profilo')(req, res, function (err) {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Immagine troppo grande: massimo 2MB'
        : err.message;
      return res.redirect('/profilo?errore=' + encodeURIComponent(message) + '#profilo-info');
    }
    next();
  });
}

module.exports = { uploadProfileImage };
