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
app.use(cookieParser());
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
  db.get('SELECT email, nome, cognome, role FROM utenti WHERE email = ?', [email], (err, user) => {
    if (err) {
      return done(err);
    }
    done(null, user);
  });
});

app.use((req, res, next) => {
  res.locals.user = req.user || null;
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
