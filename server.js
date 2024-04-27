'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const myDB = require('./connection');
const { ObjectID } = require('mongodb');
const passport = require('passport');

const app = express();
let pug = require('pug');

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

passport.initialize();
passport.session();

app.set('view engine', 'pug');
app.set('views', './views/pug');

// use myDB to connect to the database and start server

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

  // Save user id to a cookie
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // retrieve user details from cookie
  passport.deserializeUser((id, done) => {
    myDB.findOne(
      {
        _id: new ObjectID(id),
      },
      (err, doc) => {
        done(null, doc);
      }
    );
  });

  app.route('/').get((req, res) => {
    req.session.count++;
    console.log(req.session);
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
    });
  });
})
  .catch((e) => {
    console.error(e);
    app.route('/').get((req, res) => {
      res.render('index', {
        title: e,
        message: 'Unable to connect to database',
      });
    });
  })
  .finally(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log('Listening on port ' + PORT);
    });
  });
