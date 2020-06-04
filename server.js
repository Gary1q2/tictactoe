// Dependencies
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const Game = require('./game.js');

// Global variables
const app = express();
const server = http.Server(app);
const io = socketIO(server);

const PORT = 6969;
const game = new Game(io);


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
            game.playerJoin(socket.id, name)
        } catch (err) {
            console.log(err);
        }

        // Start the game if P2 joins
        if (socket.id == game.p2) {
            game.startGame();

        // Spectator joined...
        } else if (socket.id != game.p1 && socket.id != game.p2) {
            //send a spectator page...
        }
    });

    // A player tried to place a mark
    socket.on('place', function(grid) {
        console.log("state in place socket = " + game.getState());
        console.log("someone tried to place something")
        console.log(grid);

        try {
            game.placeMark(socket.id, grid.x, grid.y);
            game.printGrid();
        } catch (err) {
            console.log(err);
        }  
    });


    // A player wanted to rematch
    socket.on('acceptRematch', function() {
        console.log("someone wanted to REMATCH!!!");

        game.acceptRematch(socket.id);
    });

    // A player disconnected
    socket.on('disconnect', function() {
        game.playerLeave(socket.id);

    });
});