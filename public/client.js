//var game;

/* Client side gamestate
*/
/*class Game {
    constructor(player) {
        this.player = player;  // Indicates whether player 1 or player 2

        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];

        // Update the grid!!!
        this.updateGrid(this.grid);
    }*/

    /* Use new grid from server and update display
    */
    /*updateGrid(newGrid) {
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
}*/


var lobby;
class Lobby {
    constructor() {
        this.messages = [];
    }

    /* Push new message from server onto chatbox
    */
    addMsg(msg) {
        this.messages.push(msg);
        document.getElementById('chatBox').innerHTML += msg + '<br>';
    }
}

// Focus the name input text box
document.getElementById('nameInput').focus();

// Submit name input with enter
document.getElementById('nameInput').onkeypress = function(e) {
    if (e.keyCode == 13) {
        console.log("pressed enter to submit name");
        submitName();
    }
}

// Submit msg input with enter
document.getElementById('msgInput').onkeypress = function(e) {
    if (e.keyCode == 13) {
        console.log("pressed enter to submit msg");
        submitMsg();
    }
}





/* Client pressed rematch button
*/
/*function rematchPress() {
    socket.emit('acceptRematch');

    var opponentName = document.getElementById('p2Name').innerHTML;
    document.getElementById('msgBox').innerHTML = "Waiting for "+opponentName+" to accept rematch";
}*/


/* Client submitted their name
*/
function submitName() {

    // Client side empty name preventation
    if (document.getElementById('nameInput').value == '') {
        document.getElementById('welcomeMsg').innerHTML = 'Plz enter a real name:';
 
    // Submit the name and get result
    } else {
        socket.emit('submitName', document.getElementById('nameInput').value);

        // Create the lobby and reveal it
        lobby = new Lobby();

        document.getElementById('welcomeBox').style.visibility = 'hidden';
        document.getElementById('gameBox').style.visibility = 'visible';    
    }
}

/* Player submitted a message
*/
function submitMsg() {
    console.log("submit msg");

    // Only send message if not empty string
    if (document.getElementById('msgInput').value != '') {
        socket.emit('msgLobby-player', document.getElementById('msgInput').value);
        document.getElementById('msgInput').value = '';
    }
}



// =================================================
// Socket stuff
// =================================================

const socket = io();


/* Update chatbox with new message
*/
socket.on('addMsg', function(msg) {
    lobby.addMsg(msg);
});


/* Opponent is asking for a rematch
*/
/*socket.on('wantRematch', function(name) {
    document.getElementById('msgBox').innerHTML = name + ' would like a rematch';
});*/


/* Show that players tied
*/
/*socket.on('tie', function(data) {
    game.updateGrid(data);

    document.getElementById('msgBox').innerHTML = "Tie.....";  
    document.getElementById('rematchButton').style.visibility = 'visible';
});*/

/* Show that player 1 won
*/
/*socket.on('p1Won', function(data) {
    game.updateGrid(data.grid);

    // P2 left during the game
    if (game.player == 1) {
        if (data.left) {
            document.getElementById('msgBox').innerHTML = "Opponent left...";  
            document.getElementById('p2Name').innerHTML = "-disconncted-";
            document.getElementById('p2Piece').innerHTML = "";

        // P1 won fairly
        } else {
            document.getElementById('msgBox').innerHTML = "YOU WON!!!!";   
        }
         
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
    }

    document.getElementById('rematchButton').style.visibility = 'visible';
});*/

/* Show that player 2 won
*/
/*socket.on('p2Won', function(data) {
    game.updateGrid(data.grid);

    // P1 left during the game
    if (game.player == 2) {
        if (data.left) {
            document.getElementById('msgBox').innerHTML = "Opponent left...";  
            document.getElementById('p2Name').innerHTML = "-disconncted-";
            document.getElementById('p2Piece').innerHTML = "";

        // P2 won fairly
        } else {
            document.getElementById('msgBox').innerHTML = "YOU WON!!!!"; 
        }
          
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
    }

    document.getElementById('rematchButton').style.visibility = 'visible';
});*/

/* Player 1's turn
*/
/*socket.on('p1Turn', function(data) {
    game.updateGrid(data.grid);

    if (game.player == 1) {
        document.getElementById('msgBox').innerHTML = "It is your turn...";   
    } else {
        document.getElementById('msgBox').innerHTML = data.p1Name + "'s turn...";  
    }

    // Remove rematch button
    document.getElementById('rematchButton').style.visibility = 'hidden';
});*/

/* Player 2's turn
*/
/*socket.on('p2Turn', function(data) {
    game.updateGrid(data.grid);

    if (game.player == 2) {
        document.getElementById('msgBox').innerHTML = "It is your turn...";   
    } else {
        document.getElementById('msgBox').innerHTML = data.p2Name + "'s turn...";  
    }

    // Remove rematch button
    document.getElementById('rematchButton').style.visibility = 'hidden';
});*/




// =================================================================
// Player 1
// =================================================================

/* Player 1 joined - setup page and wait for P2
*/
/*socket.on('p1-joinWaitForP2', function(p1Name) {
    console.log('change my game state to waiting for P2');

    game = new Game(1);

    // Setup player 1 data
    document.getElementById('p1Name').innerHTML = p1Name;
    document.getElementById('p1Piece').innerHTML = "<img src='/img/circle.png' alt='circle' width='150' height='150'>";

    // Setup player 2 empty
    document.getElementById('p2Name').innerHTML = "??";
    document.getElementById('p2Piece').innerHTML = "";

    // Setup message box
    document.getElementById('msgBox').innerHTML = "Waiting for player 2";

    // Remove rematch
    document.getElementById('rematchButton').style.visibility = 'hidden';
});*/




// Player 2 finally joined - setup page
/*socket.on('p1-p2Join', function(p2Name) {
    console.log('Player 2 joined...');

    // Setup player 2 data
    document.getElementById('p2Name').innerHTML = p2Name;
    document.getElementById('p2Piece').innerHTML = "<img src='/img/cross.png' alt='cross' width='150' height='150'>"
    document.getElementById('msgBox').innerHTML = "Game beginning soon..."
});*/




// =================================================================
// Player 2
// =================================================================

/* Player 2 joined - setup page and wait for game to begin
*/
/*socket.on('p2-joinWaitForGame', function(data) {
    console.log('You joined as player 2!!');

    game = new Game(2);

    // Setup yourself (player 2)
    document.getElementById('p1Name').innerHTML = data.p2Name;
    document.getElementById('p1Piece').innerHTML = "<img src='/img/cross.png' alt='cross' width='150' height='150'>"

    // Setup other (player 1)
    document.getElementById('p2Name').innerHTML = data.p1Name;
    document.getElementById('p2Piece').innerHTML = "<img src='/img/circle.png' alt='circle' width='150' height='150'>"

    document.getElementById('msgBox').innerHTML = "Game beginning soon...";
});*/