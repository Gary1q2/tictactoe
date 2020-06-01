// Dependencies
const assert = require('assert');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Game = require('../game.js');

// Global variables
const app = express();
const server = http.Server(app);
const io = socketIO(server);

const GAMESTATE = {
    empty: "empty",
    p1Turn: "p1Turn",
    p2Turn: "p2Turn",
    p1Won: "p1Won",
    p2Won: "p2Won",
    tie: "tie"
}


// Testing checkGrid()
describe('Testing checkGrid()', function() {
    context('P1 horizontal line', function() {
        it('Player 1 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,2,0);
            game.placeMark(p1,0,1);
            game.placeMark(p2,2,1);
            game.placeMark(p1,0,2);           
            assert(game.checkGrid() == 1);
        });
    });

    context('P2 horizontal line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,1,1);
            game.placeMark(p2,0,0);
            game.placeMark(p1,2,1);
            game.placeMark(p2,0,1);
            game.placeMark(p1,2,2);      
            game.placeMark(p2,0,2);     
            assert(game.checkGrid() == 2);
        });
    });

    context('P1 vertical line', function() {
        it('Player 1 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,0,1);
            game.placeMark(p1,1,0);
            game.placeMark(p2,0,2);
            game.placeMark(p1,2,0);          
            assert(game.checkGrid() == 1);
        });
    });

    context('P2 vertical line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,0,1);
            game.placeMark(p1,0,2);
            game.placeMark(p2,1,1);
            game.placeMark(p1,2,2);     
            game.placeMark(p2,2,1);      
            assert(game.checkGrid() == 2);
        });
    });

    context('P1 diagonal line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,0,1);
            game.placeMark(p1,1,1);
            game.placeMark(p2,0,2);
            game.placeMark(p1,2,2);          
            assert(game.checkGrid() == 1);
        });
    });

    context('P2 diagonal line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,0,2);
            game.placeMark(p1,0,1);
            game.placeMark(p2,1,1);
            game.placeMark(p1,1,0);     
            game.placeMark(p2,2,0);      
            assert(game.checkGrid() == 2);
        });
    });

    context('Uncompleted game', function() {
        it('Game still in progress', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,0,2);     
            assert(game.checkGrid() == -1);
        });
    });

    context('Grids all filled, but nobody won', function() {
        it('Players tied', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.placeMark(p1,0,0);
            game.placeMark(p2,0,1);
            game.placeMark(p1,0,2);
            game.placeMark(p2,1,0);
            game.placeMark(p1,1,1);     
            game.placeMark(p2,2,0);     
            game.placeMark(p1,1,2);     
            game.placeMark(p2,2,2); 
            game.placeMark(p1,2,1);     
            assert(game.checkGrid() == 0);
        });
    });
});




// Testing startGame()
describe('Testing startGame()', function() {
    context('Undefined player', function() {
        it('P1 or P2 could start first', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame();

            assert(game.getState() == GAMESTATE.p1Turn || game.getState() == GAMESTATE.p2Turn);
        });
    });

    context('Player 1 set to go first', function() {
        it('Player 1 will go first', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            assert(game.getState() == GAMESTATE.p1Turn);
        });
    });

    context('Player 2 set to go first', function() {
        it('Player 2 will go first', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";

            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(2);

            assert(game.getState() == GAMESTATE.p2Turn);
        });
    });
});


// Testing playerLeave()
describe('Testing playerLeave()', function() {

    // Setup P1 win gameover scenario
    function setup(game, p1, p2) { 
        game.playerJoin(p1);
        game.playerJoin(p2);
        game.startGame(1);
        game.placeMark(p1,0,0);
        game.placeMark(p2,1,0);
        game.placeMark(p1,0,1);
        game.placeMark(p2,1,1);
        game.placeMark(p1,0,2); 
    }

    context('Only P1 and P1 leaves', function() {
        it('Set to empty state', function() {
            const game = new Game(io);
            var p1 = "player1";
            game.playerJoin(p1);

            game.playerLeave(p1);
            assert(game.getState() == GAMESTATE.empty);
        });
    });

    context('P1 leaves during game', function() {
        it('P2 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";
            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.playerLeave(p1);
            assert(game.getState() == GAMESTATE.p2Won);
        });
    });

    context('P2 leaves during game', function() {
        it('P1 wins', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";
            game.playerJoin(p1);
            game.playerJoin(p2);
            game.startGame(1);

            game.playerLeave(p2);
            assert(game.getState() == GAMESTATE.p1Won);      
        });
    });

    context('P1 and P2 accept rematch', function() {
        it('Game restarts simply', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";
            setup(game, p1, p2);    

            game.acceptRematch(p1);
            game.acceptRematch(p2);
            assert(game.getState() == GAMESTATE.p1Turn || game.getState() == GAMESTATE.p2Turn);
            assert(game.hasPlayer1() && game.hasPlayer2());
        });
    });

    context('P1 and P2 leave after gameover', function() {
        it('Set to empty state', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";
            setup(game, p1, p2);

            game.playerLeave(p1);
            game.playerLeave(p2);
            assert(game.getState() == GAMESTATE.empty);
            assert(!game.hasPlayer1() && !game.hasPlayer2());
        });
    });

    context('P1 accept rematch, but P2 leaves', function() {
        it('P1 set to wait for new game', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";
            setup(game, p1, p2);
    
            game.acceptRematch(p1);
            game.playerLeave(p2);
            assert(game.getState() == GAMESTATE.empty);
            assert(game.hasPlayer1() && !game.hasPlayer2());
        });
    });

    context('P2 accept rematch, but P1 leaves', function() {
        it('P2 converted to P1 and set to wait for new game', function() {
            const game = new Game(io);
            var p1 = "player1";
            var p2 = "player2";
            setup(game, p1, p2);
    
            game.acceptRematch(p1);
            game.playerLeave(p2);
            assert(game.getState() == GAMESTATE.empty);  
            assert(game.hasPlayer1() && !game.hasPlayer2());
        });
    });
});