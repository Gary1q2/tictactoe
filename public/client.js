var game;
var lobby;

const STATE = {
    lobby: "lobby",
    user: "user",
    system: "system",
    queued: "queued"
}


/* Client side gamestate
*/
class Game {
    constructor(player) {
        this.player = player;  // Indicates whether player 1 or player 2

        this.grid = [[-1, -1, -1],
                     [-1, -1, -1],
                     [-1, -1, -1]];

        // Update the grid!!!
        this.updateGrid(this.grid);
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



class Lobby {
    constructor(players, messages) {
        this.players = players;   // array
        this.messages = messages; // dict

        this.playerState = STATE.lobby;

        this.refreshChatbox();
        this.refreshPlayersBox();
        this.refreshOnlineCount();
    }

    /* Show the normal lobby state after dequeueing
    */
    dequeue() {
        this.playerState = STATE.lobby;
        document.getElementById('playButton').innerHTML = 'Play';
        document.getElementById('playButton').style.width = '300px';
        document.getElementById('cancelButton').style.visibility = 'hidden';
    }

    /* Set client state to display queued lobby state
    */
    inQueue() {
        this.playerState = STATE.queued;
        document.getElementById('playButton').innerHTML = 'in queue';
        document.getElementById('playButton').style.width = '200px';
        document.getElementById('cancelButton').style.visibility = 'visible';
    }

    /* Push new message from server onto chatbox
    */
    addMsg(msgData) {
        this.messages.push(msgData);
        this.refreshChatbox();
   }

    /* Push new player to playerbox
    */
    addPlayer(playerData, socketID) {
        this.players[socketID] = playerData;
        this.refreshPlayersBox();
        this.refreshOnlineCount();
    }

    /* Remove player from playerbox
    */
    removePlayer(socketID) {
        delete this.players[socketID];
        this.refreshPlayersBox();
        this.refreshOnlineCount();
    }

    /* Update the number of online people number
    */
    refreshOnlineCount() {
        document.getElementById('playersOnline').innerHTML = Object.keys(this.players).length + ' online!';
    }

    /* Update the chatbox and scrollbar
    */
    refreshChatbox() {

        var chatbox = document.getElementById('chatBox');
        chatbox.innerHTML = '';
        var oldScrollHeight = chatbox.scrollHeight;

        // Populate the chatbox with the right style
        for (var i = 0; i < this.messages.length; i++) {
            var msg = this.messages[i];
            if (msg.type == STATE.system) {
                chatbox.innerHTML += msg.msg + '<br>';
            } else {
                chatbox.innerHTML += msg.user + ': ' + msg.msg + '<br>';
            }
        } 

        // Update the scrollbar because scrollHeight has changed
        if (oldScrollHeight != chatbox.scrollHeight) {
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    }

    /* Update the players box
    */
    refreshPlayersBox() {
        document.getElementById('playersBox').innerHTML = '';
        for (var key in this.players) {
            document.getElementById('playersBox').innerHTML += this.players[key].name + ' - ' + this.players[key].state + '<br>';
        }
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
function rematchPress() {
    socket.emit('acceptRematch');

    var opponentName = document.getElementById('p2Name').innerHTML;
    document.getElementById('msgBox').innerHTML = "Waiting for "+opponentName+" to accept rematch";
}


/* Client submitted their name
*/
function submitName() {

    // Client side empty name preventation
    if (document.getElementById('nameInput').value == '') {
        document.getElementById('welcomeMsg').innerHTML = 'Plz enter a real name:';
 
    // Submit the name and get result
    } else {
        socket.emit('submitName', document.getElementById('nameInput').value); 
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
    document.getElementById('welcomeBox').style.visibility = 'hidden';
    document.getElementById('gameBox').style.visibility = 'visible';  
});

/* Opponent is asking for a rematch
*/
socket.on('wantRematch', function(name) {
    document.getElementById('msgBox').innerHTML = name + ' would like a rematch';
});


/* Show that players tied
*/
socket.on('tie', function(data) {
    game.updateGrid(data);

    document.getElementById('msgBox').innerHTML = "Tie.....";  
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
            document.getElementById('msgBox').innerHTML = "Opponent left...";  
            document.getElementById('p2Name').innerHTML = "-disconncted-";
            document.getElementById('p2Piece').innerHTML = "";

        // P1 won fairly
        } else {
            document.getElementById('msgBox').innerHTML = "YOU WON!!!!"; 
            document.getElementById('rematchButton').style.visibility = 'visible';  
        }
         
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
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
            document.getElementById('msgBox').innerHTML = "Opponent left...";  
            document.getElementById('p2Name').innerHTML = "-disconncted-";
            document.getElementById('p2Piece').innerHTML = "";

        // P2 won fairly
        } else {
            document.getElementById('msgBox').innerHTML = "YOU WON!!!!"; 
            document.getElementById('rematchButton').style.visibility = 'visible';
        }
          
    } else {
        document.getElementById('msgBox').innerHTML = "You lost :(((";  
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
        document.getElementById('msgBox').innerHTML = "It is your turn...";   
    } else {
        document.getElementById('msgBox').innerHTML = data.p1Name + "'s turn...";  
    }

    // Remove rematch button
    document.getElementById('rematchButton').style.visibility = 'hidden';
});

/* Player 2's turn
*/
socket.on('p2Turn', function(data) {
    game.updateGrid(data.grid);

    if (game.player == 2) {
        document.getElementById('msgBox').innerHTML = "It is your turn...";   
    } else {
        document.getElementById('msgBox').innerHTML = data.p2Name + "'s turn...";  
    }

    // Remove rematch button
    document.getElementById('rematchButton').style.visibility = 'hidden';
});



/* Setup game screen for clients
*/
socket.on('setupGame', function(data) {
    game = new Game(data.playerID);

    document.getElementById('lobby').style.visibility = 'hidden';
    document.getElementById('cancelButton').style.visibility = 'hidden';

    document.getElementById('game').style.visibility = 'visible';

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
    document.getElementById('msgBox').innerHTML = "Waiting for game to start...";
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

    document.getElementById('lobby').style.visibility = 'visible';
    document.getElementById('game').style.visibility = 'hidden';
});