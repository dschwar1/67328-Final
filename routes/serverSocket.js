//waaay too many variables and copy paste stuff, need to cut down in future
var fabric = require('fabric').fabric;
var canvas1 = new fabric.Canvas('canvas');
var canvas2 = new fabric.Canvas('canvas');
var players1 = [false, false, false, false];
var players2 = [false, false, false, false];
var currentTurn1 = null;
var currentTurn2 = null;
var in_session1 = null;
var in_session2 = null;
var drawing1 = null;
var drawing2 = null;
var score1 = [0, 0, 0, 0];
var score2 = [0, 0, 0, 0];
var voted1 = 0;
var voted2 = 0;
var numPlayers1 = 0;
var numPlayers2 = 0;

exports.init = function(io){

	//on new connection
	io.sockets.on('connection', function(socket){
		var team = null;
		var room = null;
		var room_canvas = null;
		var is_player = null;
		var score = 0;

		//player joins game
		socket.on('join_game', function(data){
			is_player = checkAvailability(data.game, data.team);
			if(!is_player){
				socket.emit("game_join_failed", null);
				return;
			}
			socket.join(data.game);
			team = data.team;
			room = data.game;
			if(room == "game1"){
				data.players = players1
				numPlayers1++;
				socket.emit('update', canvas1.toJSON());
			}
			else if(room == "game2"){
				data.players = players2
				numPlayers2++;
				socket.emit('update', canvas2.toJSON());
			}
			socket.emit("game_joined", data);
			socket.broadcast.to(room).emit('player_change', data.players);
		});

		socket.on('update', function(data){
			//code modified from https://stackoverflow.com/questions/35168635/how-to-restore-reuse-json-serialized-objects-in-fabricjs/35171360#35171360
			if(data.game = "game1"){
			fabric.util.enlivenObjects([data], function(objects) {
  				objects.forEach(function(o) {
   					canvas1.add(o);
				});
 			});
			socket.broadcast.to(room).emit('update', canvas1.toJSON());
			}
			else if(data.game = "game2"){
				fabric.util.enlivenObjects([data], function(objects) {
  				objects.forEach(function(o) {
   					canvas2.add(o);
				});
 			});
			socket.broadcast.to(room).emit('update', canvas2.toJSON());
			}
		});

		socket.on('startGame', function(data){
			if(canGameStart(data)){
				if(data.game == "game1") {
					currentTurn1 = setTurn(data);
					data.currentTurn = currentTurn1;
					data.color = players1[currentTurn1];
					in_session1 = true;
					socket.emit("gameStart", data);
					socket.broadcast.to(room).emit("gameStart", data);
				}
				else if(data.game == "game2") {
					currentTurn2 = setTurn(data);
					data.currentTurn = currentTurn1;
					data.color = players1[currentTurn1];
					in_session2 = true;
					socket.emit("gameStart", data);
					socket.broadcast.to(room).emit("gameStart", data);
				}
			}
			else{
				socket.emit("gameStartFailed", null);
			}
		});

		socket.on("startVoting", function(data){
			if(data.game == "game1") {
				drawing1 = data.drawing;
				socket.emit("stopDrawing", null);
				socket.broadcast.to(room).emit("vote", null);
			}
			else if(data.game == "game2") {
				drawing2 = data.drawing;
				socket.emit("stopDrawing", null);
				socket.broadcast.to(room).emit("vote", null);
			}
		});

		socket.on("voted", function(data){
			if(data.game == "game1") {
				voted1++;
				if(drawing1.toLowerCase() == data.guess.toLowerCase()){
					score1[players1.indexOf(team)]++;
					score++;
					data.score = score;
					socket.emit("voteCorrect", data);
				}
				else{
					data.score = score;
					socket.emit("voteIncorrect", data);
				}
				data.scores = score1;
				if(voted1 == (numPlayers1-1)){
					data.color = players1[currentTurn1];
					data.players = players1;
					socket.emit("voteFinished", data);
					socket.broadcast.to(room).emit("voteFinished", data);
				}
			}
			else if(data.game == "game2") {
				if(drawing2.toLowerCase() == data.guess.toLowerCase()){
					score2[players2.indexOf(team)]++;
					score++;
					data.score = score;
					socket.emit("voteCorrect", data);
				}
				else{
					data.score = score;
					socket.emit("voteIncorrect", data);
				}
				data.scores = score2;
				if(voted2 == (numPlayers2-1)){
					data.color = players2[currentTurn2];
					data.players = players2;
					socket.emit("voteFinished", data);
					socket.broadcast.to(room).emit("voteFinished", data);
				}
			}
		});

		socket.on('startNextRound', function(data){
			if(data.game == "game1"){
				currentTurn1 = nextTurn(data);
				if(!currentTurn1){
					data.scores = score1;
					socket.emit("gameOver", data);
					socket.broadcast.to(room).emit("gameOver", data);
					restartGame(data);
					return;
				}
				data.currentTurn = currentTurn1;
				canvas1.clear();
				voted1 = 0;
				data.players = players1;
				data.color = players1[currentTurn1];
				socket.emit("nextRound", data);
				socket.broadcast.to(room).emit("nextRound", data);
				socket.emit('update', canvas1.toJSON());
				socket.broadcast.to(room).emit('update', canvas1.toJSON());
			}
			else if(data.game == "game2"){
				currentTurn2 = nextTurn(data);
				if(!currentTurn2){
					data.scores = score2;
					socket.emit("gameOver", data);
					socket.broadcast.to(room).emit("gameOver", data);
					restartGame(data);
					return;
				}
				data.currentTurn = currentTurn2;
				canvas2.clear();
				voted2 = 0;
				data.players = players2;
				data.color = players2[currentTurn2];
				socket.emit("nextRound", data);
				socket.broadcast.to(room).emit("nextRound", data);
				socket.emit('update', canvas2.toJSON());
				socket.broadcast.to(room).emit('update', canvas2.toJSON());
			}
		})

		//on disconnect
		socket.on('disconnect', function(){
			if(is_player){
				if(room == "game1"){
					if(numPlayers1 == 0) return;
					players = players1;
					numPlayers1--;
					if(numPlayers1 < 2 && in_session1){
						socket.emit("tooFewPlayers", null);
						socket.broadcast.to(room).emit("tooFewPlayers", null);
						restartGame({game: "game1"});
					}
				}
				else if(room == "game2"){
					if(numPlayers2 == 0) return;
					players = players2;
					numPlayers2--;
					if(numPlayers2 < 2 && in_session2){
						socket.emit("tooFewPlayers", null);
						socket.broadcast.to(room).emit("tooFewPlayers", null);
						restartGame({game: "game2"});
					}
				}
				removePlayer(team, room);
				socket.broadcast.to(room).emit('player_change', players);
			}
		});
	});
}

function restartGame(data){
	if(data.game == "game1"){
		canvas1.clear();
		players1 = [false, false, false, false];
		currentTurn1 = null;
		in_session1 = null;
		drawing1 = null;
		score1 = [0, 0, 0, 0];
		voted1 = 0;
		numPlayers1 = 0;
	}
	else if(data.game == "game2"){
		canvas2.clear();
		players2 = [false, false, false, false];
		currentTurn2 = null;
		in_session2 = null;
		drawing2 = null;
		score2 = [0, 0, 0, 0];
		voted2 = 0;
		numPlayers2 = 0;
	}
}

function nextTurn(data){
	if(data.game == "game1"){
		for(i=currentTurn1+1; i < players1.length; i++){
			if(players1[i]) return i;
		}
	}
	else if(data.game == "game2"){
		for(i=currentTurn2+1; i < players2.length; i++){
			if(players2[i]) return i;
		}
	}
	return false;
}

function setTurn(data){
	if(data.game == "game1"){
		for(i=0; i < players1.length; i++){
			if(players1[i]) return i;
		}
	}
	else if(data.game == "game2"){
		for(i=0; i < players2.length; i++){
			if(players2[i]) return i;
		}
	}
}

function canGameStart(data){
	if(data.game == "game1"){
		var playerCount = 0;
		for(i=0; i < players1.length; i++){
			if(players1[i]) playerCount++;
		}
		return (playerCount > 1);
	}
	else if(data.game == "game2"){
		var playerCount = 0;
		for(i=0; i < players2.length; i++){
			if(players2[i]) playerCount++;
		}
		return (playerCount > 1);
	}
}

function removePlayer(team, room){
	if(room == "game1"){
		if(team == "red") players1[0] = false;
		else if(team == "blue") players1[1] = false;
		else if(team == "green") players1[2] = false;
		else if(team == "yellow") players1[3] = false;
	}
	else if(room == "game2"){
		if(team == "red") players2[0] = false;
		else if(team == "blue") players2[1] = false;
		else if(team == "green") players2[2] = false;
		else if(team == "yellow") players2[3] = false;
	}
}

function checkAvailability(game, color){
	if(game == "game1"){
		if(in_session1) return null;
		if(color == "red") {
			if(!players1[0]){
				players1[0] = "red";
				return players1[0];
			}
		}
		else if(color == "blue") {
			if(!players1[1]){
				players1[1] = "blue";
				return players1[1];
			}
		}
		else if(color == "green") {
			if(!players1[2]){
				players1[2] = "green";
				return players1[2];
			}
		}
		else if(color == "yellow") {
			if(!players1[3]){
				players1[3] = "yellow";
				return players1[3];
			}
		}
	}
	else if(game == "game2"){
		if(in_session2) return null;
		if(color == "red") {
			if(!players2[0]){
				players2[0] = "red";
				return players2[0];
			}
		}
		else if(color == "blue") {
			if(!players2[1]){
				players2[1] = "blue";
				return players2[1];
			}
		}
		else if(color == "green") {
			if(!players2[2]){
				players2[2] = "green";
				return players2[2];
			}
		}
		else if(color == "yellow") {
			if(!players2[3]){
				players2[3] = "yellow";
				return players2[3];
			}
		}
	}
	return null;
}
