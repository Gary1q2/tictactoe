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

const state = {
    winner: 1,
    tie: 2,
    game: 3
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

    /* Places a circle or cross and moves to next turn
    */
    placeMark(x, y) {

        if (x >= 0 && x <= this.grid[0].length) && (y >= 0 && y <= this.grid.length) {
            if (this.state == GAMESTATE.p1Turn) {
        
            } else if (this.state == GAMESTATE.p2Turn) {

            } else {
                console.log("Illegal move..... someone tried to placeMark when not in gamestate");
            }
        } else {
            console.log("Some player gave a munted af coordinates....... :(");
        }
    }


    /* Decides what to do with each new person connecting to the server
    


    */
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

    /* Decides what to do when somebody leaves
        Spectator - do nothing
        P2 -
        P1 - 

    */
    playerLeave(socketID) {

        // Critical player left
        if (socketID == this.p1 || socketID == this.p2) {


        // Spectator left
        } else {
            console.log(`Spectator ${socketID} left... who cares about them`);
        }
    }

    /* Checks if the grid has won or tied
       Returns:  'game'   - game still in progress
                 'tie'    - game tied
                 'winner' - somebody won
    */
    checkGrid() {

    }

}


const game = new Game();