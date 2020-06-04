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

        this.p1Name = false;
        this.p2Name = false;

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


    /* Resets the grid to being empty
    */
    clearGrid() {
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[0].length; j++) {
                this.grid[i][j] = -1;
            }
        }
    }


    /* Shift the remaining player into P1 position if they are P2
    */
    shiftToP1() {
        this.p1 = this.p2;
        this.p1Name = this.p2Name;

        this.p2 = false;
        this.p2Name = false;
        this.p2Rematch = false;
    }


    /* Set the game to an empty state
       Clears the grid and sets rematching to false
    */
    setEmptyState() {
        console.log("Setting gamestate to empty -> clearing stuff...");
        this.state = GAMESTATE.empty;
        
        this.clearGrid();
        this.p1Rematch = false;
        this.p2Rematch = false;
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
            throw 'Wrong player turn';
        }

        if (x < 0 || x > this.grid[0].length || y < 0 || y > this.grid.length) {
            throw 'Munted coordinates';
        }

        if (this.state != GAMESTATE.p1Turn && this.state != GAMESTATE.p2Turn) {
            throw "Can't place mark when not in gamestate     [state = " + this.state;
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
    playerJoin(socketID, name) {
        console.log("new player with name = " + name + "  joined");

        if (name == '') {
            throw 'Player must login with a valid name!! player ignored as spectator';
        }

        if (this.state != GAMESTATE.empty) {
            throw "New contestants can ONLY join in empty state   state = " + this.state;
        }

        if (!this.p1 && !this.p2) {
            console.log("P1 joined!");
            this.p1 = socketID;
            this.p1Name = name;
            this.io.to(this.p1).emit('p1-joinWaitForP2', this.p1Name);

        } else if (this.p1 && !this.p2) {
            console.log("P2 joined!");
            this.p2 = socketID;
            this.p2Name = name;
            this.io.to(this.p1).emit('p1-p2Join', this.p2Name);
            this.io.to(this.p2).emit('p2-joinWaitForGame', {
                p1Name: this.p1Name,
                p2Name: this.p2Name
            });

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
            this.io.emit('p1Won', {
                grid: this.grid,
                left: false
            });

        // Player 2 won
        } else if (gridState == 2) {
            this.state = GAMESTATE.p2Won;
            this.io.emit('p2Won', {
                grid: this.grid,
                left: false
            });

        // Players tied
        } else if (gridState == 0) {
            this.setTieState();

        // Game still in progress
        } else {
            if (this.state == GAMESTATE.p1Turn) {
                this.setP2TurnState();
            } else {
                this.setP1TurnState();           
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
            if (Math.random() <= 0.5) {
                this.setP1TurnState();
            } else {
                this.setP2TurnState();
            }
   
        // Set a player to start
        } else if (startPlayer == 1) {
            this.setP1TurnState();
        } else {
            this.setP2TurnState();
        }
    }

    /* Resets the given players values
    */
    removePlayer(player) {
        if (player == 1) {
            this.p1 = false;
            this.p1Name = false;
            this.p1Rematch = false;
        } else {
            this.p2 = false;
            this.p2Name = false;
            this.p2Rematch = false;
        }
    }



    /* Set state to P1 winning and emit to everyone
    */
    //setP1WonState() {
    //    this.state = GAMESTATE.p1Won;
    //    this.io.emit('p1Won', this.grid);
    //}

    /* Set state to P2 winning and emit to everyone
    */
    //setP2WonState() {
    //    this.state = GAMESTATE.p2Won;
    //    this.io.emit('p2Won', this.grid);
    //}

    /* Set state to P1 turn and emit to everyone
    */
    setP1TurnState() {
        this.state = GAMESTATE.p1Turn;
        this.io.emit('p1Turn', {
            grid: this.grid,
            p1Name: this.p1Name
        });  
        console.log("set state to p1Turn  state = " + this.state);
    }

    /* Set state to P2 turn and emit to everyone
    */
    setP2TurnState() {
        this.state = GAMESTATE.p2Turn;
        this.io.emit('p2Turn', { 
            grid: this.grid,
            p2Name: this.p2Name
        });  
        console.log("set state to p2Turn  state = " + this.state);
    }

    /* Set tie state and emit to eveyrone
    */
    setTieState() {
        this.state = GAMESTATE.tie;
        this.io.emit('tie', this.grid);
    }



    /* Checks if game is ready to be reset and
       resets if it is
    */
    checkGameRestart() {

        // Everyone left
        if (!this.p1 && !this.p2) {
            this.setEmptyState();
            console.log("nobody remains.... game is reset");

        } else if (!this.p1 && this.p2) {

            // P1 left during a game
            if (this.state == GAMESTATE.p1Turn || this.state == GAMESTATE.p2Turn) {
                this.state = GAMESTATE.p2Won;
                this.io.emit('p2Won', {
                    grid: this.grid,
                    left: true
                });
                console.log("p1 left.... dog");

            // P1 left after game && P2 want to play again
            } else {
                if (this.p2Rematch) {
                    this.setEmptyState();
                    this.shiftToP1();
                    this.io.to(this.p1).emit('p1-joinWaitForP2', this.p1Name);
                    console.log("p2 is ready to play again");
                }
            }

        } else if (this.p1 && !this.p2) {

            // P2 left during a game
            if (this.state == GAMESTATE.p1Turn || this.state == GAMESTATE.p2Turn) {
                this.state = GAMESTATE.p1Won;
                this.io.emit('p1Won', {
                    grid: this.grid,
                    left: true
                });

                console.log("p2 left.... dog");

            // P2 left after game && P1 want to play again
            } else {
                if (this.p1Rematch) {
                    this.setEmptyState();
                    this.io.to(this.p1).emit('p1-joinWaitForP2', this.p1Name);
                    console.log("p1 is ready to play again");
                }
            }

        // Both players still here and want to play again
        } else if (this.p1 && this.p2 && this.p1Rematch && this.p2Rematch) {
            console.log("both players want to play again.. ");
            this.setEmptyState();
            this.startGame();
        }
    }


    /* Player accepted the rematch
       
       Can only be called by P1 and P2
       Can only be called in GAMESTATES p1Won, p2Won, tie

       Refer to the test for specifications
    */
    acceptRematch(socketID) {

        if (socketID != this.p1 && socketID != this.p2) {
            throw 'Invalid player pressed rematch';
        }

        if (this.state != GAMESTATE.p1Won && this.state != GAMESTATE.p2Won &&
            this.state != GAMESTATE.tie) {
            throw 'Can only rematch when game is not in progress';
        }

        // P1 or P2 want to rematch
        if (socketID == this.p1) {
            this.p1Rematch = true;
            this.io.to(this.p2).emit('wantRematch');
        } else {
            this.p2Rematch = true;
            this.io.to(this.p1).emit('wantRematch');
        }

        this.checkGameRestart();
    }




    /* Decides what to do when somebody leaves
       Refer to the test to check for specifications
    */
    playerLeave(socketID) {

        // Non critical player left - spectator or invalid socketID
        if (socketID != this.p1 && socketID != this.p2) {
            console.log(`Spectator ${socketID} left... who cares about them OR a fake ID left...`);
            return "out";
        }

        // Remove the player from the game
        if (socketID == this.p1) {
            this.removePlayer(1);
        } else {
            this.removePlayer(2);
        }

        this.checkGameRestart();
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