const GAMESTATE = {
    empty: "empty",
    p1Turn: "p1Turn",
    p2Turn: "p2Turn",
    p1Won: "p1Won",
    p2Won: "p2Won",
    tie: "tie"
}

const STATE = {
    lobby: "lobby",
    queued: "queued",
    ingame: "ingame",
    endscreen: "endscreen",
    user: "user",
    system: "system"
}


// Server side gamestate
module.exports = class Game {
    constructor(p1, p1Name, p2, p2Name, lobby,  io) {
        this.state = GAMESTATE.empty;
        this.p1 = p1;
        this.p2 = p2;;
        this.p1Name = p1Name;
        this.p2Name = p2Name;

        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];

        this.io = io;

        this.p1Rematch = false;
        this.p2Rematch = false;

        this.lobby = lobby;

        this.printGrid();

        this.setupGameForClient();
        this.startGame();
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

    /* Brings player back to the lobby after end game screen
    */
    backToLobby(socketID) {
        if (this.state == GAMESTATE.p1Turn || this.state == GAMESTATE.p2Turn) {
            throw 'Can only back to lobby during end game';
        }
        if (socketID != this.p1 && socketID != this.p2) {
            throw 'Invalid socketID when back to lobbying';
        }

        // Set player has left the game
        if (socketID == this.p1) {
            this.p1 = false;
            if (this.p2 != false) {
                this.io.to(this.p2).emit('opponentLeft');
            }
        } else {
            this.p2 = false;
            if (this.p1 != false) {
                this.io.to(this.p1).emit('opponentLeft');
            }
        }


        this.io.to(socketID).emit('loadLobby');

        this.io.emit('updatePlayerStatus', {
            socketID: socketID,
            state: STATE.lobby
        });


        this.lobby.purgeGames();
    }


    /* Forfeits the game and return player to lobby
    */
    forfeitGame(socketID) {

        if (this.state != GAMESTATE.p1Turn && this.state != GAMESTATE.p2Turn) {
            throw 'Can only forfeit while game in progress';
        }
        if (socketID != this.p1 && socketID != this.p2) {
            throw 'Invalid socketID when forfeiting';
        }

        // Player 1 left
        if (socketID == this.p1) {
            console.log('forfeit by player 1')
            this.state = GAMESTATE.p2Won;
            this.io.to(this.p1).emit('loadLobby');
            this.io.to(this.p2).emit('p2Won', {
                grid: this.grid,
                left: true
            });

            this.io.emit('updatePlayerStatus', {
                socketID: this.p2,
                state: STATE.endscreen
            });

            this.p1 = false;

        // Player 2 left
        } else {
            console.log('forfeit by player 2')
            this.state = GAMESTATE.p1Won;
            this.io.to(this.p2).emit('loadLobby');
            this.io.to(this.p1).emit('p1Won', {
                grid: this.grid,
                left: true
            });    

            this.io.emit('updatePlayerStatus', {
                socketID: this.p1,
                state: STATE.endscreen
            });

            this.p2 = false;
        }


        this.io.emit('updatePlayerStatus', {
            socketID: socketID,
            state: STATE.lobby
        });
    }


    /* Shift the remaining player into P1 position if they are P2
    */
    /*shiftToP1() {
        this.p1 = this.p2;
        this.p1Name = this.p2Name;

        this.p2 = false;
        this.p2Name = false;
        this.p2Rematch = false;
    }*/


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

            this.io.emit('updatePlayerStatus', {
                socketID: this.p1,
                state: STATE.endscreen
            });
            this.io.emit('updatePlayerStatus', {
                socketID: this.p2,
                state: STATE.endscreen
            });

        // Player 2 won
        } else if (gridState == 2) {
            this.state = GAMESTATE.p2Won;
            this.io.emit('p2Won', {
                grid: this.grid,
                left: false
            });

            this.io.emit('updatePlayerStatus', {
                socketID: this.p1,
                state: STATE.endscreen
            });
            this.io.emit('updatePlayerStatus', {
                socketID: this.p2,
                state: STATE.endscreen
            });

        // Players tied
        } else if (gridState == 0) {
            this.setTieState();

            this.io.emit('updatePlayerStatus', {
                socketID: this.p1,
                state: STATE.endscreen
            });
            this.io.emit('updatePlayerStatus', {
                socketID: this.p2,
                state: STATE.endscreen
            });

        // Game still in progress
        } else {
            if (this.state == GAMESTATE.p1Turn) {
                this.setP2TurnState();
            } else {
                this.setP1TurnState();           
            }
        }
    }

    /* Helps setup the game on client side
    */
    setupGameForClient() {
        console.log("setuping clients...")
        this.io.to(this.p1).emit('setupGame', {
            playerID: 1,
            p1Name: this.p1Name,
            p2Name: this.p2Name
        });
        this.io.to(this.p2).emit('setupGame', {
            playerID: 2,
            p1Name: this.p1Name,
            p2Name: this.p2Name
        });
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

        // Set players to be in game state
        this.io.emit('updatePlayerStatus', {
            socketID: this.p1,
            state: STATE.ingame
        });

        this.io.emit('updatePlayerStatus', {
            socketID: this.p2,
            state: STATE.ingame
        });
    }

    /* Resets the given players values
    */
    /*removePlayer(player) {
        if (player == 1) {
            this.p1 = false;
            this.p1Name = false;
            this.p1Rematch = false;
        } else {
            this.p2 = false;
            this.p2Name = false;
            this.p2Rematch = false;
        }
    }*/



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

        // Both players still here and want to play again
        if (this.p1 && this.p2 && this.p1Rematch && this.p2Rematch) {
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

        if (this.p1 == false || this.p2 == false) {
            throw 'Can only offer rematch if both players present initially';
        }

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
            this.io.to(this.p2).emit('wantRematch', this.p1Name);
        } else {
            this.p2Rematch = true;
            this.io.to(this.p1).emit('wantRematch', this.p2Name);
        }

        this.checkGameRestart();
    }




    /* Decides what to do when somebody leaves
       Refer to the test to check for specifications
    */
    /*playerLeave(socketID) {

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
    }*/



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
    /*hasPlayer1() {
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
    }*/
}