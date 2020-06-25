// Dependencies
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const Game = require('./game.js');
const Lobby = require('./lobby.js');

// Global variables
const app = express();
const server = http.Server(app);
const io = socketIO(server);

const PORT = 6969;
const lobby = new Lobby(io);
//const game = new Game(io);


// Set folder to public
app.use(express.static('public'));

// Routing
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Starts the server
server.listen(PORT, function() {
    console.log(`Starting server on port ${PORT}`);
});



// Handling communications
io.on('connection', function(socket) {

    // Player logged in
    socket.on('submitName', function(name) {

        try {
            lobby.playerJoin(socket, name)
        } catch (err) {
            console.log(err);
        }

        // Start the game if P2 joins
        //if (socket.id == game.p2) {
        //    game.startGame();

        // Spectator joined...
        //} else if (socket.id != game.p1 && socket.id != game.p2) {
            //send a spectator page...
        //}
    });

    // Player sent a message in lobby
    socket.on('msgLobby-player', function(msg) {
        try {
            lobby.playerMsg(socket.id, msg);
        } catch (err) {
            console.log(err);
        }
    });


    // Player queued up for game
    socket.on('playerQueued', function() {
        try {
            lobby.queuePlayer(socket);
        } catch (err) {
            console.log(err);
        }
    });

    // Player canceled queue for game
    socket.on('cancelQueue', function() {
        try {
            lobby.cancelQueue(socket.id);
        } catch (err) {
            console.log(err);
        }
    });


    // Bring player back to lobby after end game
    socket.on('backToLobby', function() {
        console.log("player back to lobby");
        try {
            var gameIndex = lobby.findPlayersGame(socket.id);
            var game = lobby.games[gameIndex];
            game.backToLobby(socket.id);
        } catch (err) {
            console.log(err);
        }
    });


    // Player forfeited the game
    socket.on('forfeitGame', function() {
        console.log('player forfeited the game');
        try {
            var gameIndex = lobby.findPlayersGame(socket.id);
            var game = lobby.games[gameIndex];
            game.forfeitGame(socket.id);
        } catch (err) {
            console.log(err);
        }
    });




    // A player tried to place a mark
    socket.on('place', function(grid) {;
        console.log("someone tried to place something");
        console.log(grid);

        try {
            var gameIndex = lobby.findPlayersGame(socket.id);
            var game = lobby.games[gameIndex];
            console.log("state in place socket = " + game.getState())
            game.placeMark(socket.id, grid.x, grid.y);
            game.printGrid();
        } catch (err) {
            console.log(err);
        }
    });


    // A player wanted to rematch
    /*socket.on('acceptRematch', function() {
        console.log("someone wanted to REMATCH!!!");

        game.acceptRematch(socket.id);
    });*/




    // A player disconnected
    socket.on('disconnect', function() {
        try {
            lobby.playerLeave(socket);
        } catch (err) {
            console.log(err);
        }
    });
});