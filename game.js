const GAMESTATE = {
    empty: "empty",
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

        this.p1Rematch = false;
        this.p2Rematch = false;

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


    /* Restarts the game with the same players
    */
    restartGameSamePlayers() {
        console.log('Restarted the game with same players!!!');
        this.clearGrid();

        this.p1Rematch = false;
        this.p2Rematch = false;

        this.startGame();
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
       
       Can only be called by P1 and P2
       Can only be called in GAMESTATES p1Won, p2Won, tie
    */
    acceptRematch(socketID) {

        if (socketID != this.p1 && socketID != this.p2) {
            throw 'Invalid player pressed rematch';
        }

        if (this.state != GAMESTATE.p1Won && this.state != GAMESTATE.p2Won &&
            this.state != GAMESTATE.tie) {
            throw 'Can only rematch when game is not in progress';
        }

        if (socketID == this.p1 && !this.p1Rematch) {
            this.p1Rematch = true;
            this.io.to(this.p2).emit('wantRematch');
            console.log("p1 wants to rematch....");

        } else if (socketID == this.p2 && !this.p2Rematch) {
            this.p2Rematch = true;
            this.io.to(this.p1).emit('wantRematch');
            console.log("p2 wants to rematch....");
        }

        // Restart the game with same players
        if (this.p1Rematch && this.p2Rematch) {
            this.restartGameSamePlayers();
        }

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

        // Send updated state to players
        this.updateStateAfterTurn();
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

        } else if (this.p1 && this.p2) {
            console.log("Spectator joined. oi stop chiming in");

        } else {
            console.log("P2 is true but P1 is false ERRORRRRRR@#$%^&**#&@*&#@$^(*&@#$(*#@$)*$#(&#*(@^$(\n#@$*(&#@$(*&#(*@$!!!!!!!");
        }
    }

    /* Emits the result of the gamestate to the players
       Outcomes:
       -Player 1 wins
       -Player 2 wins
       -Tie
       -Game still in progress
    */
    updateStateAfterTurn() {

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

    /* Starts the game and sets player parameter as starting turn
       If player is undefined, a random player is selected to start first
    */
    startGame(startPlayer) {
        console.log("startGame state = " + this.state);
        if (this.state != GAMESTATE.empty && this.state != GAMESTATE.p1Won &&
            this.state != GAMESTATE.p2Won && this.state != GAMESTATE.tie) {
            console.log("state = " + this.state);
            throw 'Can only start game when game has not started or is over'
        }

        if (startPlayer != undefined && startPlayer != 1 && startPlayer != 2) {
            throw 'Invalid startPlayer';
        }

        // Randomly choose which player goes first
        if (startPlayer == undefined) {
            this.state = (Math.random() <= 0.5) ? GAMESTATE.p1Turn : GAMESTATE.p2Turn;
   
        // Set player 1 to start
        } else if (startPlayer == 1) {
            this.state = GAMESTATE.p1Turn;

        // Set player 2 to start
        } else {
            this.state = GAMESTATE.p2Turn;
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

        Game state (p1Turn, p2Turn):
        P1 - P2 wins
        P2 - P1 wins

        End state (p1Won, p2Won, tie):
        P1 accept, P2 accept = restart game

        P1 leave,  P2 leave  = game go to empty state

        P1 accept, P2 leave  = put P1 in waiting state
        P1 leave,  P2 accept = put P2 in P1 position in waiting state

        P1 wait,   P2 accept = wait for P1 answer
        P1 wait,   P2 leave  = wait for P1 answer
        P1 leave,  P2 wait   = wait for P2 answer
        P1 accept, P2 wait   = wait for P2 answer
        P1 wait,   P2 wait   = wait for both answers

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

    // Return the state of the game
    getState() {
        return this.state;
    }

    // Return if player 1 is connected or not
    hasPlayer1() {
        if (this.p1) {
            return true;
        }
        return false;
    }

    // Return if player 1 is connected or not
    hasPlayer2() {
        if (this.p2) {
            return true;
        }
        return false;
    }
}