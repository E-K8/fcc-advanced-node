'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const myDB = require('./connection');
const { ObjectID } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');
app.set('views', './views/pug');

// use myDB to connect to the database and start server

myDB(async (client) => {
  const myDataBase = await client.db('tricoder').collection('users');
  console.log('Successful database connection');

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
    });
  });

  app
    .route('/login')
    .post(
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res) => {
        res.redirect('/profile');
      }
    );

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', {
      username: req.user.username,
    });
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne(
        {
          username: username,
        },
        (err, user) => {
          console.log(`User ${username} attempted to log in.`);
          if (err) return done(err);
          if (!user) return done(null, false);
          if (password !== user.password) return done(null, false);
          return done(null, user);
        }
      );
    })
  );

  // Serialization and deserialization ↓
  // Save user id to a cookie
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // retrieve user details from cookie
  passport.deserializeUser((id, done) => {
    console.log(`Deserializing user with ID: ${id}`);
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      console.log(`Found user: ${doc}`);
      done(null, doc);
    });
  });
}).catch((e) => {
  console.log('Unsuccessful database connection');
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
