const socket = io();
const account = new Account(socket);

var game;
var lobby;


const STATE = {
    lobby: "lobby",
    user: "user",
    system: "system",
    queued: "queued"
}


// Submit msg input with enter
document.getElementById('msgInput').onkeypress = function(e) {
    if (lobby && e.keyCode == 13) {
        console.log("pressed enter to submit msg");
        lobby.submitMsg();
    }
}

/* Refreshes the page and logs player out
*/
function logout() {
    document.location.reload();
}








// =================================================
// Socket stuff
// =================================================

/* Update scoreboard with new scoreboard from server
*/
socket.on('scoreboard', function(scoreString) {
    console.log('New update on scoreboard!');
    if (lobby) {
        lobby.updateScoreboard(scoreString);
    }
})


/* Failed registration - user already exists
*/
socket.on('registerFail', function() {
    console.log('user already exists...');
    account.setRegisterMsg('User already exists...');
});

/* Successfully registered user
*/
socket.on('registerSuccess', function() {
    console.log('registered user');
    account.setRegisterMsg('User registered!');
});

/* Failed to login
*/
socket.on('loginFail', function() {
    console.log('got failed login');
    document.getElementById('loginMsg').innerHTML = 'Incorrect user or pass';
});

/* Account already logged in
*/
socket.on('loggedAlready', function() {
    console.log('Account already logged in');
    document.getElementById('loginMsg').innerHTML = 'Account already logged in';
});

/* Updates a players status in lobby
*/
socket.on('updatePlayerStatus', function(data) {
    if (lobby) {
        lobby.updatePlayerStatus(data.socketID, data.state);
    }
});

/* Show the opponent left on endscreen
*/
socket.on('opponentLeft', function() {
    if (game) {
        game.appendMsgBox('<br>Opponent left');
        document.getElementById('rematchButton').style.visibility = 'hidden';
    }
});

/* Show the normal lobby state
*/
socket.on('dequeued', function() {
    if (lobby) {
        lobby.dequeue();
    } 
});

/* Show the queued state of lobby
*/
socket.on('queued', function() {
    if (lobby) {
        lobby.inQueue();
    }
});

/* Update chatbox with new message
*/
socket.on('addMsg', function(msgData) {
    if (lobby) {
        lobby.addMsg(msgData);  
    }   
});

/* Update playerbox with new player
*/
socket.on('addPlayer', function(data) {
    if (lobby) {
        lobby.addPlayer(data.player, data.socketID); 
    } 
});

/* Update playerbox with removed player
*/
socket.on('removePlayer', function(socketID) {
    if (lobby) {
        lobby.removePlayer(socketID);
    }
});


/* Setup the lobby for client
*/
socket.on('setupLobby', function(data) {
    console.log(data);
    lobby = new Lobby(socket, data.players, data.messages, data.scoreboard);
    document.getElementById('loginInterface').style.visibility = 'hidden';
    document.getElementById('lobby').style.visibility = 'visible';  
});

/* Opponent is asking for a rematch
*/
socket.on('wantRematch', function(username) {
    if (game) {
        game.setMsgBox(username + ' would like a rematch');
    }
});


/* Show that players tied
*/
socket.on('tie', function(data) {
    if (game) {
        game.updateGrid(data);

        game.setMsgBox('Tie.....');
        document.getElementById('rematchButton').style.visibility = 'visible';

        document.getElementById('backToLobbyButton').style.visibility = 'visible';
        document.getElementById('forfeitButton').style.visibility = 'hidden';
    }
});

/* Show that player 1 won
*/
socket.on('p1Won', function(data) {
    if (game) {
        game.updateGrid(data.grid);

        // P2 left during the game
        if (game.player == 1) {
            if (data.left) {
                game.setMsgBox('Opponent left...'); 
                document.getElementById('p2Name').innerHTML = "-disconncted-";
                document.getElementById('p2Piece').innerHTML = "";

            // P1 won fairly
            } else {
                game.setMsgBox('YOU WON!!!!');
                document.getElementById('rematchButton').style.visibility = 'visible';  
            }
             
        } else {
            game.setMsgBox('You lost :((');
            document.getElementById('rematchButton').style.visibility = 'visible';
        }

        document.getElementById('backToLobbyButton').style.visibility = 'visible';
        document.getElementById('forfeitButton').style.visibility = 'hidden';
    }
});

/* Show that player 2 won
*/
socket.on('p2Won', function(data) {
    if (game) {
        game.updateGrid(data.grid);

        // P1 left during the game
        if (game.player == 2) {
            if (data.left) {
                game.setMsgBox('Opponent left...');
                document.getElementById('p2Name').innerHTML = "-disconncted-";
                document.getElementById('p2Piece').innerHTML = "";

            // P2 won fairly
            } else {
                game.setMsgBox('YOU WON!!!!');
                document.getElementById('rematchButton').style.visibility = 'visible';
            }
              
        } else {
            game.setMsgBox('You lost :((('); 
            document.getElementById('rematchButton').style.visibility = 'visible';
        }

        document.getElementById('backToLobbyButton').style.visibility = 'visible';
        document.getElementById('forfeitButton').style.visibility = 'hidden';
    }
});

/* Player 1's turn
*/
socket.on('p1Turn', function(data) {
    if (game) {
        game.updateGrid(data.grid);

        if (game.player == 1) {
            game.setMsgBox('It is your turn...');  
        } else {
            game.setMsgBox(data.p1Name + "'s turn...");
        }

        document.getElementById('forfeitButton').style.visibility = 'visible';
        document.getElementById('rematchButton').style.visibility = 'hidden';
        document.getElementById('backToLobbyButton').style.visibility = 'hidden';
    }
});

/* Player 2's turn
*/
socket.on('p2Turn', function(data) {
    if (game) {
        game.updateGrid(data.grid);

        if (game.player == 2) {
            game.setMsgBox('It is your turn...'); 
        } else {
            game.setMsgBox(data.p2Name + "'s turn...");
        }

        document.getElementById('forfeitButton').style.visibility = 'visible';
        document.getElementById('rematchButton').style.visibility = 'hidden';
        document.getElementById('backToLobbyButton').style.visibility = 'hidden';
    }
});



/* Setup game screen for clients
*/
socket.on('setupGame', function(data) {
    game = new Game(socket, data.playerID);

    document.getElementById('lobby').style.visibility = 'hidden';
    document.getElementById('cancelButton').style.visibility = 'hidden';

    document.getElementById('game').style.visibility = 'visible';
    document.getElementById('forfeitButton').style.visibility = 'visible';

    // Player 1
    if (data.playerID == 1) {
        document.getElementById('p1Name').innerHTML = data.p1Name;
        document.getElementById('p1Piece').innerHTML = "<img src='/img/circle.png' alt='circle' width='150' height='150'>";
        document.getElementById('p2Name').innerHTML = data.p2Name;
        document.getElementById('p2Piece').innerHTML = "<img src='/img/cross.png' alt='cross' width='150' height='150'>";

    // Player 2
    } else {
        document.getElementById('p1Name').innerHTML = data.p2Name;
        document.getElementById('p1Piece').innerHTML = "<img src='/img/cross.png' alt='cross' width='150' height='150'>";
        document.getElementById('p2Name').innerHTML = data.p1Name;
        document.getElementById('p2Piece').innerHTML = "<img src='/img/circle.png' alt='circle' width='150' height='150'>";
    }

    // Setup message box and remove rematch button
    game.setMsgBox('Waiting for game to start...');
    document.getElementById('rematchButton').style.visibility = 'hidden';
});


/* Load the lobby back up after game
*/
socket.on('loadLobby', function() {
    console.log("set state back to lobby");
    if (lobby) {
        lobby.playerState = STATE.lobby;
        document.getElementById('playButton').innerHTML = 'Play';
        document.getElementById('playButton').style.width = '300px';
        document.getElementById('cancelButton').style.visibility = 'hidden';
        document.getElementById('backToLobbyButton').style.visibility = 'hidden';
        document.getElementById('forfeitButton').style.visibility = 'hidden';
        document.getElementById('rematchButton').style.visibility = 'hidden';

        document.getElementById('lobby').style.visibility = 'visible';
        document.getElementById('game').style.visibility = 'hidden';
    }
});