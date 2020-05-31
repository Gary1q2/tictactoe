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

// Start the game
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
    game.playerJoin(socket.id)

    socket.on('place', function(grid) {
        console.log("someone tried to place something")
        console.log(grid);

        try {
            game.placeMark(socket.id, grid.x, grid.y);
        } catch (err) {
            console.log(err);
        }

        game.printGrid();

    });

    socket.on('disconnect', function() {
        game.playerLeave(socket.id);

    });
});


