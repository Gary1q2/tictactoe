var game;

/* Client side gamestate
*/
class Game {
    constructor(player) {
        this.player = player;
        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];
    }

    /* Use new grid from server and update display
    */
    updateGrid(newGrid) {
        this.grid = newGrid;
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[0].length; j++) {
                if (this.grid[i][j] == "X") {
                    document.getElementById("grid_" + i + j).innerHTML = "<img src='/img/cross.png' alt='cross' width='100' height='100'>";
                } else if (this.grid[i][j] == "O") {
                    document.getElementById("grid_" + i + j).innerHTML = "<img src='/img/circle.png' alt='circle' width='100' height='100'>";
                } else {
                    document.getElementById("grid_" + i + j).innerHTML = "";
                }
            }
        }
    }
}

/* Client pressed rematch button
*/
function rematchPress() {
    socket.emit('acceptRematch');

    document.getElementById('msgBox').innerHTML = "Waiting for opponent to accept rematch";
}


// =================================================
// Socket stuff
// =================================================

const socket = io();

/* Set the game to empty state, ready to play again
*/
socket.on('emptyState', function(data) {
    game.updateGrid(data);

    document.getElementById('rematchButton').style.visibility = 'hidden';

    // Setup player 1 empty
    document.getElementById('p1Name').innerHTML = "??";
    document.getElementById('p1Piece').innerHTML = "";

    // Setup player 2 empty
    document.getElementById('p2Name').innerHTML = "??";
    document.getElementById('p2Piece').innerHTML = "";

    document.getElementById('msgBox').innerHTML = "Waiting for players...";
});




/* Opponent is asking for a rematch
*/
socket.on('wantRematch', function() {
    document.getElementById('msgBox').innerHTML = 'Your opponent would like a rematch';
});



/* Show that players tied
*/
socket.on('tie', function(data) {
    game.updateGrid(data);

    document.getElementById('msgBox').innerHTML = "Tie.....";  
    document.getElementById('rematchButton').style.visibility = 'visible';
});

/* Show that player 1 won
*/
socket.on('p1Won', function(data) {
    game.updateGrid(data);

    if (game.player == 1) {
        document.getElementById('msgBox').innerHTML = "YOU WON!!!!";   
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
    }

    document.getElementById('rematchButton').style.visibility = 'visible';
});

/* Show that player 2 won
*/
socket.on('p2Won', function(data) {
    game.updateGrid(data);

    if (game.player == 2) {
        document.getElementById('msgBox').innerHTML = "YOU WON!!!!";   
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
    }

    document.getElementById('rematchButton').style.visibility = 'visible';
});

/* Player 1's turn
*/
socket.on('p1Turn', function(data) {
    game.updateGrid(data);

    if (game.player == 1) {
        document.getElementById('msgBox').innerHTML = "It is your turn...";   
    } else {
        document.getElementById('msgBox').innerHTML = "Enemy's turn...";  
    }
});

/* Player 2's turn
*/
socket.on('p2Turn', function(data) {
    game.updateGrid(data);

    if (game.player == 2) {
        document.getElementById('msgBox').innerHTML = "It is your turn...";   
    } else {
        document.getElementById('msgBox').innerHTML = "Enemy's turn...";  
    }
});




// =================================================================
// Player 1
// =================================================================

/* Player 1 joined - setup page and wait for P2
*/
socket.on('p1-joinWaitForP2', function() {
    console.log('change my game state to waiting for P2');

    game = new Game(1);

    // Setup player 1 data
    document.getElementById('p1Name').innerHTML = "YOU";
    document.getElementById('p1Piece').innerHTML = "<img src='/img/circle.png' alt='circle' width='100' height='100'>"
    document.getElementById('msgBox').innerHTML = "Waiting for player 2";
});

// Player 2 finally joined - setup page
socket.on('p1-p2Join', function() {
    console.log('Player 2 joined...');

    // Setup player 2 data
    document.getElementById('p2Name').innerHTML = "THEM";
    document.getElementById('p2Piece').innerHTML = "<img src='/img/cross.png' alt='cross' width='100' height='100'>"
    document.getElementById('msgBox').innerHTML = "Game beginning soon..."
});




// =================================================================
// Player 2
// =================================================================

/* Player 2 joined - setup page and wait for game to begin
*/
socket.on('p2-joinWaitForGame', function() {
    console.log('You joined as player 2!!');

    game = new Game(2);

    // Setup yourself (player 2)
    document.getElementById('p1Name').innerHTML = "YOU";
    document.getElementById('p1Piece').innerHTML = "<img src='/img/cross.png' alt='cross' width='100' height='100'>"

    // Setup other (player 1)
    document.getElementById('p2Name').innerHTML = "THEM";
    document.getElementById('p2Piece').innerHTML = "<img src='/img/circle.png' alt='circle' width='100' height='100'>"

    document.getElementById('msgBox').innerHTML = "Game beginning soon...";
})