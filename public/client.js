var game;
var lobby;
var account = new Account();

const STATE = {
    lobby: "lobby",
    user: "user",
    system: "system",
    queued: "queued"
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
function rematchPress() {
    socket.emit('acceptRematch');

    var opponentName = document.getElementById('p2Name').innerHTML;
    game.setMsgBox("Waiting for " + opponentName + " to accept rematch");
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

/* Player pressed play button to queue up for game
*/
function queueUp() {
    if (lobby.playerState == STATE.lobby) {
        console.log("queued up for game...");
        socket.emit('playerQueued');    
    }
}

/* Player pressed cancel queue button
*/
function cancelQueue() {
    if (lobby.playerState == STATE.queued) {
        console.log("player CANCELED QUEUE!!!");
        socket.emit('cancelQueue');
    }
}


/* Forfeits and return back to lobby
*/
function forfeitGame() {
    console.log("foreited the game");
    socket.emit('forfeitGame');
}

/* Go back to lobby after game
*/
function backToLobby() {
    console.log("back to lobby time");
    socket.emit('backToLobby');
}

// =================================================
// Socket stuff
// =================================================

const socket = io();

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


/* Updates a players status in lobby
*/
socket.on('updatePlayerStatus', function(data) {
    lobby.updatePlayerStatus(data.socketID, data.state);
});

/* Show the opponent left on endscreen
*/
socket.on('opponentLeft', function() {
    document.getElementById('rematchButton').style.visibility = 'hidden';
    game.appendMsgBox('<br>Opponent left');
});

/* Show the normal lobby state
*/
socket.on('dequeued', function() {
    lobby.dequeue();
});

/* Show the queued state of lobby
*/
socket.on('queued', function() {
    lobby.inQueue();
});

/* Update chatbox with new message
*/
socket.on('addMsg', function(msgData) {
    lobby.addMsg(msgData);
});

/* Update playerbox with new player
*/
socket.on('addPlayer', function(data) {
    lobby.addPlayer(data.player, data.socketID);
});

/* Update playerbox with removed player
*/
socket.on('removePlayer', function(socketID) {
    lobby.removePlayer(socketID);
});


/* Setup the lobby for client
*/
socket.on('setupLobby', function(data) {
    lobby = new Lobby(data.players, data.messages);
    document.getElementById('loginInterface').style.visibility = 'hidden';
    document.getElementById('lobby').style.visibility = 'visible';  
});

/* Opponent is asking for a rematch
*/
socket.on('wantRematch', function(name) {
    game.setMsgBox(name + ' would like a rematch');
});


/* Show that players tied
*/
socket.on('tie', function(data) {
    game.updateGrid(data);

    game.setMsgBox('Tie.....');
    document.getElementById('rematchButton').style.visibility = 'visible';

    document.getElementById('backToLobbyButton').style.visibility = 'visible';
    document.getElementById('forfeitButton').style.visibility = 'hidden';
});

/* Show that player 1 won
*/
socket.on('p1Won', function(data) {
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
});

/* Show that player 2 won
*/
socket.on('p2Won', function(data) {
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
});

/* Player 1's turn
*/
socket.on('p1Turn', function(data) {
    game.updateGrid(data.grid);

    if (game.player == 1) {
        game.setMsgBox('It is your turn...');  
    } else {
        game.setMsgBox(data.p1Name + "'s turn...");
    }

    document.getElementById('forfeitButton').style.visibility = 'visible';
    document.getElementById('rematchButton').style.visibility = 'hidden';
    document.getElementById('backToLobbyButton').style.visibility = 'hidden';
});

/* Player 2's turn
*/
socket.on('p2Turn', function(data) {
    game.updateGrid(data.grid);

    if (game.player == 2) {
        game.setMsgBox('It is your turn...'); 
    } else {
        game.setMsgBox(data.p2Name + "'s turn...");
    }

    document.getElementById('forfeitButton').style.visibility = 'visible';
    document.getElementById('rematchButton').style.visibility = 'hidden';
    document.getElementById('backToLobbyButton').style.visibility = 'hidden';
});



/* Setup game screen for clients
*/
socket.on('setupGame', function(data) {
    game = new Game(data.playerID);

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
    lobby.playerState = STATE.lobby;
    document.getElementById('playButton').innerHTML = 'Play';
    document.getElementById('playButton').style.width = '300px';
    document.getElementById('cancelButton').style.visibility = 'hidden';
    document.getElementById('backToLobbyButton').style.visibility = 'hidden';
    document.getElementById('forfeitButton').style.visibility = 'hidden';
    document.getElementById('rematchButton').style.visibility = 'hidden';


    document.getElementById('lobby').style.visibility = 'visible';
    document.getElementById('game').style.visibility = 'hidden';
});