var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var db = require('./db/database');
var imageLegacyMap = require('./config/imageLegacyMap');
var publicRouter = require('./routes/public');
var authRouter = require('./routes/auth');
var camminatoreRouter = require('./routes/camminatore');
var ristoratoreRouter = require('./routes/ristoratore');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Backward compatibility: old /images/<basename> references are rewritten to the new organized folders.
app.use(function (req, _res, next) {
  if (!req.path.startsWith('/images/')) {
    return next();
  }

  var relPathRaw = req.path.slice('/images/'.length);
  var relPath = relPathRaw;
  try {
    relPath = decodeURIComponent(relPathRaw);
  } catch (_err) {
    relPath = relPathRaw;
  }

  if (relPath.indexOf('/') !== -1) {
    return next();
  }

  var mapped = imageLegacyMap[relPath];
  if (!mapped) {
    return next();
  }

  var queryIndex = req.url.indexOf('?');
  var query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
  req.url = '/images/' + mapped + query;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'trekking-upo-secret-2026',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    db.get('SELECT * FROM utenti WHERE email = ?', [email], (err, user) => {
      if (err){
        return done(err);
      }
      if (!user){
        return done(null, false, { message: 'Email non trovata' });
      }

      bcrypt.compare(password, user.password_hash, (err, match) => {
        if (err){
          return done(err);
        } 
        if (!match) {
          return done(null, false, { message: 'Password errata' });
        }
        return done(null, user);
      });
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  db.get('SELECT email, nome, cognome, role, immagine_profilo FROM utenti WHERE email = ?', [email], (err, user) => {
    if (err) {
      return done(err);
    }
    done(null, user);
  });
});

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.noticeSuccess = req.query.successo || req.query.success || null;
  res.locals.noticeError = req.query.errore || req.query.error || null;

  if (req.isAuthenticated && req.isAuthenticated()) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  next();
});

app.use('/', publicRouter);
app.use('/', authRouter);
app.use('/', camminatoreRouter);
app.use('/', ristoratoreRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
