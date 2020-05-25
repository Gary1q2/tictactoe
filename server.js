// Dependencies
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Global variables
const app = express();
const server = http.Server(app);
const io = socketIO(server);

const PORT = 6969;
const GAMESTATE = {
    empty: 1,
    waitP2: 2,
    p1Turn: 3,
    p2Turn: 4,
    endGame: 5
}


// Routing
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Starts the server
server.listen(PORT, function() {
    console.log('Starting server on port ' + PORT);
});




setInterval(function() {
    io.sockets.emit('message', 'hi!');
}, 1000);




io.on('connection', function(socket) {
    console.log("A player joined");
});


class Game {
    constructor() {
        this.state = GAMESTATE.empty;
        this.p1 = false;
        this.p2 = false;
        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];
    }

    playerJoin() {

    }


    toWaiting() {

    }

    toP1Turn() {

    }

}