'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const myDB = require('./connection');
const passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth.js');

// Initialize the Express application
const app = express();

// Create the HTTP server using the Express app
const http = require('http').createServer(app);
const io = require('socket.io')(http);

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', './views/pug');

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

// use myDB to connect to the database and start server
myDB(async (client) => {
  const myDataBase = await client.db('tricoder').collection('users');
  console.log('Successful database connection');

  routes(app, myDataBase);
  auth(app, myDataBase);

  io.on('connection', (socket) => {
    console.log('A user has connected');
  });
}).catch((e) => {
  console.log('Unsuccessful database connection');
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
