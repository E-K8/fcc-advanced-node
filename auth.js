const { ObjectID } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = (app, myDataBase) => {
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
          if (!bcrypt.compareSync(password, user.password))
            return done(null, false);
          return done(null, user);
        }
      );
    })
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          'https://fcc-advanced-node.onrender.com/auth.github.callback',
      },
      function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
      }
    )
  );
};
