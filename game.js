const GAMESTATE = {
    empty: "emptyState",
    p1Turn: "p1Turn",
    p2Turn: "p2Turn",
    p1Won: "p1Won",
    p2Won: "p2Won",
    tie: "tie"
}


// Server side gamestate
module.exports = class Game {
    constructor(io) {
        this.state = GAMESTATE.empty;
        this.p1 = false;
        this.p2 = false;
        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];

        this.io = io;
        this.printGrid();
    }

    /* Prints out the tictactoe grid 
    */
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


        // Player makes a move
        if (this.state == GAMESTATE.p1Turn) {
            this.grid[y][x] = "O";
        } else {
            this.grid[y][x] = "X";
        }

        // Check current state of grid
        // Player 1 won
        var gridState = this.checkGrid();
        if (gridState == 1) {
            this.state = GAMESTATE.p1Won;
            this.io.emit('p1Won', this.grid);

        // Player 2 won
        } else if (gridState == 2) {
            this.state = GAMESTATE.p2Won;
            this.io.emit('p2Won', this.grid);

        // Players tied
        } else if (gridState == 0) {
            this.state = GAMESTATE.tie;
            this.io.emit('tie', this.grid);

        // Game still in progress
        } else {
            if (this.state == GAMESTATE.p1Turn) {
                this.state = GAMESTATE.p2Turn;
                this.io.emit('p2Turn', this.grid);
            } else {
                this.state = GAMESTATE.p1Turn;
                this.io.emit('p1Turn', this.grid);            
            }
        }
    }


    /* Decides what to do with each new person connecting to the server
        P1 - Add them to player 1
        P2 - Add them to player 2
        Spectator - do nothing

        Returns
    */
    playerJoin(socketID) {

        if (!this.p1 && !this.p2) {
            console.log("P1 joined!");
            this.p1 = socketID;
            this.io.to(this.p1).emit('p1-joinWaitForP2');

        } else if (this.p1 && !this.p2) {
            console.log("P2 joined!");
            this.p2 = socketID;
            this.io.to(this.p1).emit('p1-p2Join');
            this.io.to(this.p2).emit('p2-joinWaitForGame');

            this.startGame(1);

        } else if (this.p1 && this.p2) {
            console.log("Spectator joined. oi stop chiming in");

        } else {
            console.log("P2 is true but P1 is false ERRORRRRRR@#$%^&**#&@*&#@$^(*&@#$(*#@$)*$#(&#*(@^$(\n#@$*(&#@$(*&#(*@$!!!!!!!");
        }
    }


    /* Starts the game and sets player parameter as starting turn
       If player is undefined, a random player is selected to start first
    */
    startGame(startPlayer) {

        // Randomly choose which player goes first
        if (startPlayer == undefined) {
            this.state = (Math.random() <= 0.5) ? GAMESTATE.p1Turn : GAMESTATE.p2Turn;
   
        // Set specified player to start first
        } else {
            if (startPlayer == 1) {
                this.state = GAMESTATE.p1Turn;
            } else {
                this.state = GAMESTATE.p2Turn;
            }
        }

        // Update the clients
        if (this.state == GAMESTATE.p1Turn) {
            this.io.emit('p1Turn', this.grid);
        } else {
            this.io.emit('p2Turn', this.grid);
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

        // Check for horizontal lines
        for (var i = 0; i < this.grid.length; i++) {
            if (this.grid[i][0] == "O" && this.grid[i][1] == "O" && this.grid[i][2] == "O") {
                return 1;
            } else if (this.grid[i][0] == "X" && this.grid[i][1] == "X" && this.grid[i][2] == "X") {
                return 2;
            }
        }

        // Check for vertical lines
        for (var i = 0; i < this.grid[0].length; i++) {
            if (this.grid[0][i] == "O" && this.grid[1][i] == "O" && this.grid[2][i] == "O") {
                return 1;
            } else if (this.grid[0][i] == "X" && this.grid[1][i] == "X" && this.grid[2][i] == "X") {
                return 2;
            }
        }

        // Check diagonal lines
        if ((this.grid[0][0] == "O" && this.grid[1][1] == "O" && this.grid[2][2] == "O") || 
            (this.grid[0][2] == "O" && this.grid[1][1] == "O" && this.grid[2][0] == "O")) {
            return 1;
        } else if ((this.grid[0][0] == "X" && this.grid[1][1] == "X" && this.grid[2][2] == "X") || 
            (this.grid[0][2] == "X" && this.grid[1][1] == "X" && this.grid[2][0] == "X")) {
            return 2;
        }        

        // Check for tie
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[0].length; j++) {
                if (this.grid[i][j] == -1) {
                    return -1; // Detected -1 so game still in progress
                }
            }
        }

        // All grids were filled, so we tied
        return 0;
    }

}