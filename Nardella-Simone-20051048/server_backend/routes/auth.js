'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

router.get('/registrazione', authController.getRegistrazione);

router.post('/register', authController.postRegister);

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/registrazione?error=Email o password errati'
}));

router.post('/logout', authController.postLogout);

module.exports = router;
