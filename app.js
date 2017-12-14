//get modules boiler plate
var express = require('express'),
http = require('http'),
morgan = require('morgan'),
app = express();
var path = require('path');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//set modules boiler plate
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('tiny'));
//passport refused to work
//var auth = require('./models/authentication.js').init(app);
//app.set('passport', auth);
//require('./routes/userRoutes.js').init(app);
app.use(express.static(__dirname + '/public'));

//set up socket.io boiler plate
var httpServer = http.Server(app);
var sio = require('socket.io');
var io = sio(httpServer);

//route error handler
app.use(function(req, res){
	var message = 'Error, did not understand path '+req.path;
	res.status(404).render('error', {'message':message});
});

//socket.io routes
var gameSockets = require('./routes/serverSocket.js');
gameSockets.init(io);
httpServer.listen(50000, function() {console.log('Listening on 50000');});