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
    p1Won: 4,
    p2Won: 5,
    tie: 6
}




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





class Game {
    constructor() {
        this.state = GAMESTATE.empty;
        this.p1 = false;
        this.p2 = false;
        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];
    }


    printGrid() {
        console.log("Grid output =============================================");
        for (var i = 0; i < this.grid.length; i++) {
            var string = "";
            for (var j = 0; j < this.grid[0].length; j++) {
                string += this.grid[i][j] + ",";
            }
            console.log(string);
        }
        console.log("End =====================================================");
    }

    /* Resets the grid to being empty
    */
    clearGrid() {
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[0].length; j++) {
                this.grid[i][j] = -1;
            }
        }
    }

    /* Player accepted the rematch
    */
    acceptRematch(socketID) {

    }

    /* Shift the remaining player into P1 position if they are P2
    */
    shiftToP1() {

    }


    /* Places a circle or cross and moves to next turn
       socketID - socketID of sender
       x - horizontal grid (must be between 0-2)
       y - vertical grid (must be between 0-2)
       [x,y] must be -1
       Can only be called during P1/P2 turn state
    */
    placeMark(socketID, x, y) {

        if ((this.state == GAMESTATE.p1Turn && socketID != this.p1) || (this.state == GAMESTATE.p2Turn && socketID != this.p2)) {
            console.log("gamestate = " + this.state);
            console.log("socketID = " + socketID);
            console.log("p1="+this.p1 +"     p2="+this.p2);
            throw 'Wrong player turn';
        }

        if (x < 0 || x > this.grid[0].length || y < 0 || y > this.grid.length) {
            throw 'Munted coordinates';
        }

        if (this.state != GAMESTATE.p1Turn && this.state != GAMESTATE.p2Turn) {
            throw "Can't place mark when not in gamestate";
        }

        if (this.grid[y][x] != -1) {
            throw 'Mark already exists there'
        }




        // Player 1 made a move
        if (this.state == GAMESTATE.p1Turn) {
            this.grid[y][x] = "O";
            var gridState = this.checkGrid();

            if (gridState == 1) {
                this.state = GAMESTATE.p1Won;

            } else if (gridState == 2) {
                this.state = GAMESTATE.p2Won;

            } else if (gridState == 0) {
                this.state = GAMESTATE.tie;

            } else {
                this.state = GAMESTATE.p2Turn;
                io.emit('p2Turn', game.grid);
            }


        // Player 2 made a move
        } else if (this.state == GAMESTATE.p2Turn) {
            this.grid[y][x] = "X";
            var gridState = this.checkGrid();

            if (gridState == 1) {
                this.state = GAMESTATE.p1Won;

            } else if (gridState == 2) {
                this.state = GAMESTATE.p2Won;

            } else if (gridState == 0) {
                this.state = GAMESTATE.tie;

            } else {
                this.state = GAMESTATE.p1Turn;
                io.emit('p1Turn', game.grid);
            }    
        }
    }


    /* Decides what to do with each new person connecting to the server
        P1 - Add them to player 1
        P2 - Add them to player 2
        Spectator - do nothing
    */
    playerJoin(socketID) {

        if (!this.p1 && !this.p2) {
            console.log("P1 joined!");
            this.p1 = socketID;
            io.to(this.p1).emit('p1-joinWaitForP2');

        } else if (this.p1 && !this.p2) {
            console.log("P2 joined!");
            this.p2 = socketID;
            io.to(this.p1).emit('p1-p2Join');
            io.to(this.p2).emit('p2-joinWaitForGame');

            // Randomly choose which player goes first
            this.state = (Math.random() <= 0.5) ? GAMESTATE.p1Turn : GAMESTATE.p2Turn;

            // Start game after 2 seconds
            setTimeout(function() {
                if (this.state == GAMESTATE.p1Turn) {
                    io.emit('p1Turn', game.grid);
                } else {
                    io.emit('p2Turn', game.grid);
                }
            }, 2000);


        } else if (this.p1 && this.p2) {
            console.log("Spectator joined. oi stop chiming in");

        } else {
            console.log("P2 is true but P1 is false ERRORRRRRR@#$%^&**#&@*&#@$^(*&@#$(*#@$)*$#(&#*(@^$(\n#@$*(&#@$(*&#(*@$!!!!!!!");
        }
    }

    /* Decides what to do when somebody leaves
        Spectator - do nothing

        Waiting for P2 state:
        P1 - Convert to empty state

        Game state:
        P2 - P1 wins
        P1 - P2 wins

        End state:
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
       Returns: -1 - game still in progress
                 0 - tied
                 1 - P1 won
                 2 - P2 won
    */
    checkGrid() {

    }

}


const game = new Game();

game.printGrid();