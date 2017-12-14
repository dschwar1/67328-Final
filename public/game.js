var socket = io.connect('/');
var players = null;

//need to wrap in jquery function for jquery to work, idk why
$(function(){
$("#game1").submit(function(event){
	event.preventDefault();
	socket.emit('join_game', {game: "game1", team: $("#game1 #team").val()});
});

$("#game2").submit(function(event){
	event.preventDefault();
	socket.emit('join_game', {game: "game2", team: $("#game2 #team").val()});
});

socket.on('game_joined', function(data){
	players = parsePlayers(data.players);
	var team = data.team;
	$("body").html("<h1>Welcome to "+data.game+", team "+data.team+", players: <div id = 'players'>"+players+"</div></h1><br>"+
					"<canvas id='canvas' width='500', height='500', style='border:1px solid #000000;'></canvas>"
					+"<div id='play_area'><button id='startGame'>Start Game</button></div>");
	var canvas = new fabric.Canvas('canvas', {isDrawingMode: false});
	canvas.freeDrawingBrush.color = data.team;
	canvas.on('path:created', function(options){
		socket.emit('update', options.path)
	});
	socket.on('update', function(data){
		canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
	});
	$("#startGame").click(function(event){
		event.preventDefault();
		socket.emit('startGame', {players: players, game: data.game});
	});
	socket.on("gameStartFailed", function(data){
		alert("Could not start game, too few players");
	});
	socket.on("gameStart", function(data){
		if(team == data.color){
			canvas.isDrawingMode = true;
			$("#play_area").html("<form id='drawingDone' onsubmit='myFunction()'>Click the button when finished drawing<br>"+
						"What you drew: <input type='text' name='drawing' id='drawing'>"+
						"<br><input type='submit' value='submit drawing'></form>");
		}
		else{
			$("#play_area").html("Wait for other player to draw masterpiece");
		}
	});
	//I had to work around this wierd bug, I hate that bug
	window.myFunction = function(){
		event.preventDefault();
		data.drawing = $("#drawingDone #drawing").val();
		socket.emit("startVoting", data);
	}
	/*$("#drawingDone").on('submit', function(event){
		event.preventDefault();
		console.log("here");
		data.drawing = $("#drawingDone #drawing").val();
		socket.emit("startVoting", data);
	});*/
	socket.on("stopDrawing", function(data){
		canvas.isDrawingMode = false;
		$("#play_area").html("Wait for players to guess what you have drawn");
	});
	socket.on("vote", function(data){
		$("#play_area").html("<form id='vote' onsubmit='myFunction1()'>Guess what was drawn<br>"+
						"<input type='text' id='guess'></input>"+
						"<input type='submit'></form>")
	});
	window.myFunction1 = function(){
		event.preventDefault();
		data.guess = $("#vote #guess").val();
		socket.emit("voted", data);
	}
	/*$("#vote").submit(function(event){
		event.preventDefault();
		data.guess = $("#vote #guess").val();
		socket.emit("voted", data);
	});*/
	socket.on("voteCorrect", function(data){
		$("#play_area").html("Congratulations, your guess was correct and "+
			"your score is now "+data.score);
	});
	socket.on("voteIncorrect", function(data){
		$("#play_area").html("Sorry, your guess was incorrect, "+
			"your score is currently "+data.score);
	});
	socket.on("voteFinished", function(data){
		var scores = parseScores(data);
		$("#play_area").html("Round ended, Current Scores: "+scores);
		if(data.color == team) $("#play_area").append("<br><button id='startNextRound' onclick='myFunction2()'>Start Next Round</button>")
	});
	window.myFunction2 = function(){
		event.preventDefault();
		socket.emit('startNextRound', data);
	}
	/*$("#startNextRound").click(function(event){
		console.log("here");
		event.preventDefault();
		socket.emit('startNextRound', null);
	});*/
	socket.on("nextRound", function(data){
		canvas.freeDrawingBrush.color = data.color;
		if(team == data.color){
			canvas.isDrawingMode = true;
			$("#play_area").html("<form id='drawingDone' onsubmit='myFunction()'>Click the button when finished drawing<br>"+
						"What you drew: <input type='text' name='drawing' id='drawing'>"+
						"<br><input type='submit' value='submit drawing'></form>");
		}
		else{
			$("#play_area").html("Wait for other player to draw masterpiece");
		}
	});
	socket.on("gameOver", function(data){
		var scores = parseScores(data);
		$("body").html("Game ended, Final Scores: "+scores+
					"<br>To begin a new game, refresh the page"+
					"<br>Thanks for playing!");
	});
	socket.on("tooFewPlayers", function(data){
		$("body").html("Sorry but there are too few players to continue the game, Scores will not be recorded "+
					"<br>To begin a new game, refresh the page"+
					"<br>Thanks for playing!");
	});
});

socket.on('game_join_failed', function(data){
	alert("Could not join game, color slot is filled or game is in progress");
});

socket.on('player_change', function(data){
	players = parsePlayers(data);
	$("#players").html(players);
});

function parseScores(data){
	var result = ""
	for(i = 0; i < data.players.length; i++){
		if(data.players[i]) result += data.players[i]+": "+data.scores[i]+", ";
	}
	return result.slice(0, -2);
}

function parsePlayers(players){
	var result = ""
	for(i = 0; i < players.length; i++){
		if(players[i]) result += players[i] + ", ";
	}
	return result.slice(0, -2);
}

});