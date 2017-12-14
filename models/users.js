//code modified from https://passport.67328.is/_src
var users = [
  { id: 1,
    username: 'random_guy5213', 
    password: 'secret', 
    totalScore: 0},
  { id: 2, 
    username: 'dude711', 
    password: 'admin', 
    totalScore: 0}
  ];

exports.findByUsername = function(username, callback) {
  var foundUser = null;
  var err = null;
  // search for the user with a given username
  for (var i = 0 ; i < users.length ; i++) {
    if (users[i].username == username) {
      foundUser = users[i];
      break;
    }
  }
  callback(err, foundUser);
}

exports.findById = function(id, callback) {
  var foundUser = null;
  var err = null;
  // search for the user with a given id
  for (var i = 0 ; i < users.length ; i++) {
    if (users[i].id == id) {
      foundUser = users[i];
      break;
    }
  }
  callback(err, foundUser);
}

exports.addUser = function(username, password, callback) {
  var err = null;
  var newUser = null
  // check if unique
  for (var i = 0 ; i < users.length ; i++) {
    if (users[i].username == username) {
      err = "User already exists";
    }
  }
  if(!err){
  	newUser = {
  		id: (users[users.length-1].id+1),
  		username: username,
  		password: password,
  		totalScore: 0}
  	users.push(newUser)
  }
  callback(err, newUser);
}