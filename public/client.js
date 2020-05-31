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
                }
            }
        }
    }
}




// =================================================
// Socket stuff
// =================================================

const socket = io();

/* Show that players tied
*/
socket.on('tie', function(data) {
    game.updateGrid(data);

    document.getElementById('msgBox').innerHTML = "Tie.....";  

})

/* Show that player 1 won
*/
socket.on('p1Won', function(data) {
    game.updateGrid(data);

    if (game.player == 1) {
        document.getElementById('msgBox').innerHTML = "YOU WON!!!!";   
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
    }

})

/* Show that player 2 won
*/
socket.on('p2Won', function(data) {
    game.updateGrid(data);

    if (game.player == 2) {
        document.getElementById('msgBox').innerHTML = "YOU WON!!!!";   
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
    }

})

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



    // Setup buttons
    //var grids = document.getElementsByClassName('clicker');
    //for (var i = 0; i < grids.length; i++) {
    //    grids[i].innerHTML = 'O';
    //}
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

    // Setup buttons
    //var grids = document.getElementsByClassName('clicker');
    //for (var i = 0; i < grids.length; i++) {
    //    grids[i].innerHTML = 'X';
    //}

    document.getElementById('msgBox').innerHTML = "Game beginning soon...";
})