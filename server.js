// Dependencies
var express = require('express');
var socketIO = require('socket.io');

// Global variables
var app = express();
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
app.listen(PORT, function() {
    console.log('Starting server on port ' + PORT);
});



io.on('connection', function(socket) {

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