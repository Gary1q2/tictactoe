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
    p1Turn: 2,
    p2Turn: 3,
    endGame: 4
}


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
        placeMark(grid.x, grid.y);
    });

    socket.on('disconnect', function() {
        game.playerLeave(socket.id);

    });
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

    // Places a circle or cross and moves to next turn
    placeMark(x, y) {

    }

    // Decides what to do with each new person connecting to the server
    playerJoin(socketID) {

        if (!this.p1 && !this.p2) {
            console.log("P1 joined!");
            this.p1 = socketID;

        } else if (this.p1 && !this.p2) {
            console.log("P2 joined!");
            this.p2 = socketID;

            // Randomly choose which player goes first
            this.state = (Math.random() <= 0.5) ? GAMESTATE.p1Turn : GAMESTATE.p2Turn;

        } else if (this.p1 && this.p2) {
            console.log("Spectator joined. oi stop chiming in");

        } else {
            console.log("P2 is true but P1 is false ERRORRRRRR@#$%^&**#&@*&#@$^(*&@#$(*#@$)*$#(&#*(@^$(\n#@$*(&#@$(*&#(*@$!!!!!!!");
        }
    }

    // Decides what to do when somebody leaves
    playerLeave(socketID) {

        // Critical player left
        if (socketID == this.p1 || socketID == this.p2) {


        // Spectator left
        } else {
            console.log(`Spectator ${socketID} left... who cares about them`);
        }
    }


    checkGrid() {

    }

}


const game = new Game();