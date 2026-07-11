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
var AppError = require('./utils/AppError');
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


//Middlware globale sempre attivato per fornire user e notifiche di successo/errore a ejs e anche per controllare se user è autenticato
app.use((req, res, next) => {
  //per avere user nel codcie ejs
  res.locals.user = req.user || null;
  //per avere notice successo o errore nella url, non messo nei parametri ejs dato che dopo post sempre redirect e si perde il parametro
  res.locals.noticeSuccess = req.query.successo || req.query.success || null;
  res.locals.noticeError = req.query.errore || req.query.error || null;

  if (req.isAuthenticated()) {
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
  next(AppError.notFound('Pagina non trovata'));
});

//render di error universale
app.use(function (err, req, res, next) {
  if (err instanceof AppError && err.redirectUrl) {
    return res.redirect(err.redirectUrl);
  }
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
