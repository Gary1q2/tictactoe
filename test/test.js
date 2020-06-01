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
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,2,0);
            game.placeMark(p1Socket,0,1);
            game.placeMark(p2Socket,2,1);
            game.placeMark(p1Socket,0,2);           
            assert(game.checkGrid() == 1);
        })
    })

    context('P2 horizontal line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,1,1);
            game.placeMark(p2Socket,0,0);
            game.placeMark(p1Socket,2,1);
            game.placeMark(p2Socket,0,1);
            game.placeMark(p1Socket,2,2);      
            game.placeMark(p2Socket,0,2);     
            assert(game.checkGrid() == 2);
        })
    })

    context('P1 vertical line', function() {
        it('Player 1 wins', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,0,1);
            game.placeMark(p1Socket,1,0);
            game.placeMark(p2Socket,0,2);
            game.placeMark(p1Socket,2,0);          
            assert(game.checkGrid() == 1);
        })
    })

    context('P2 vertical line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,0,1);
            game.placeMark(p1Socket,0,2);
            game.placeMark(p2Socket,1,1);
            game.placeMark(p1Socket,2,2);     
            game.placeMark(p2Socket,2,1);      
            assert(game.checkGrid() == 2);
        })
    })

    context('P1 diagonal line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,0,1);
            game.placeMark(p1Socket,1,1);
            game.placeMark(p2Socket,0,2);
            game.placeMark(p1Socket,2,2);          
            assert(game.checkGrid() == 1);
        })
    })

    context('P2 diagonal line', function() {
        it('Player 2 wins', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,0,2);
            game.placeMark(p1Socket,0,1);
            game.placeMark(p2Socket,1,1);
            game.placeMark(p1Socket,1,0);     
            game.placeMark(p2Socket,2,0);      
            assert(game.checkGrid() == 2);
        })
    })

    context('Uncompleted game', function() {
        it('Game still in progress', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,0,2);     
            assert(game.checkGrid() == -1);
        })
    })

    context('Grids all filled, but nobody won', function() {
        it('Players tied', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1);

            game.placeMark(p1Socket,0,0);
            game.placeMark(p2Socket,0,1);
            game.placeMark(p1Socket,0,2);
            game.placeMark(p2Socket,1,0);
            game.placeMark(p1Socket,1,1);     
            game.placeMark(p2Socket,2,0);     
            game.placeMark(p1Socket,1,2);     
            game.placeMark(p2Socket,2,2); 
            game.placeMark(p1Socket,2,1);     
            assert(game.checkGrid() == 0);
        })
    })
})




// Testing startGame()
describe('Testing startGame()', function() {
    context('Undefined player', function() {
        it('P1 or P2 could start first', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame()

            assert(game.state == GAMESTATE.p1Turn || game.state == GAMESTATE.p2Turn);
        })
    })

    context('Player 1 set to go first', function() {
        it('Player 1 will go first', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(1)

            assert(game.state == GAMESTATE.p1Turn);
        })
    })

    context('Player 2 set to go first', function() {
        it('Player 2 will go first', function() {
            const game = new Game(io);
            var p1Socket = "player1";
            var p2Socket = "player2";

            game.playerJoin(p1Socket);
            game.playerJoin(p2Socket);
            game.startGame(2)

            assert(game.state == GAMESTATE.p2Turn);
        })
    })
})