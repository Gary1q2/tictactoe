// Dependencies
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql');

// Class dependencies
const Game = require('./game.js');
const Lobby = require('./lobby.js');
const Account = require('./account.js');

// Global variables
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const PORT = process.env.PORT || 6969;

// Client classes
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Guineaisfat12',
    database: 'mydb'
});
const lobby = new Lobby(io, db);
const account = new Account(io, lobby, db);






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





// Connected to SQL database
db.connect(function(err) {
    if (err) throw err;
    console.log("Connected to mySQL database!");
    lobby.loadMessages();
});


// Handling communications
io.on('connection', function(socket) {

    // New player registered
    socket.on('register', function(data) {
        try {
            account.register(socket, data.username, data.password, data.confirmPassword);
        } catch (err) {
            console.log(err);
        }
    });

    // Player logged in 
    socket.on('login', function(data) {
        try {
            account.login(socket, data.username, data.password);
        } catch (err) {
            console.log(err);
        }
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
    socket.on('acceptRematch', function() {
        console.log("someone wanted to REMATCH!!!");

        try {
            var gameIndex = lobby.findPlayersGame(socket.id);
            var game = lobby.games[gameIndex]; 
            game.acceptRematch(socket.id);    
        } catch (err) {
            console.log(err);
        }
    });


    // A player disconnected
    socket.on('disconnect', function() {
        try {
            lobby.playerLeave(socket);
        } catch (err) {
            console.log(err);
        }
    });
});