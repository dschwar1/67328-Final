//code modified from https://passport.67328.is/_src
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var expressSession = require('express-session');
var users = require('./users.js');

exports.init = function (app) {
  app.use(expressSession(
    {secret: 'superSecret', // Sessions will be "signed" to prevent tampering
     resave: false,     // Don't resave session if not saved
     saveUninitialized: true })); // Save uninitialized session
  // Initialize Passport
  app.use(passport.initialize());
  // Include middleware for Passport sessions.
  app.use(passport.session());
  // Return the Passport object configured here.
  return passport;
}

passport.use(new Strategy(
  function(username, password, done) {
    users.findByUsername(username, function(err, foundUser) {
      if (err) { return done(err); }
      if (!foundUser) { return done(null, false); }
      if (foundUser.password != password) { return done(null, false); }
      return done(null, foundUser);
    });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  users.findById(id, function (err, foundUser) {
    done(err, foundUser);
  });
});


