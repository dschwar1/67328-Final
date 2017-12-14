exports.init = function(app) {
  var passport = app.get('passport');
  app.all('/', index);

  app.post('/login',
          passport.authenticate('local', {
                                  failureRedirect: '/login.html',
                                  successRedirect: '/game.html'}));
  // The Logout route
  //app.get('/logout', doLogout);
}

index = function(req, res) {
  res.redirect('/login.html');
};

function doLogout(req, res){
  req.logout();
  res.redirect('/');
};