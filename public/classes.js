// Client classes

/* Logining in and registering accounts
*/
class Account {

    constructor(socket) {
        this.socket = socket;
    }

    /* Login using username and password
    */
    login(user, pass) {

        if (user == '' || pass == '') {
            document.getElementById('loginMsg').innerHTML = 'User or pass cant be empty';
            return;   
        }

        this.socket.emit('login', {
            username: user,
            password: pass
        });
        document.getElementById('loginMsg').innerHTML = 'Request send to server';
    }

    /* Switch to register account interface
    */
    switchToRegister() {
        document.getElementById('loginInterface').style.visibility = 'hidden';
        document.getElementById('registerBox').style.visibility = 'visible';

        account.setRegisterMsg('');
    }

    /* Switch to login account interface
    */
    switchToLogin() {
        document.getElementById('registerBox').style.visibility = 'hidden';
        document.getElementById('loginInterface').style.visibility = 'visible';

        document.getElementById('loginMsg').innerHTML = '';
    }

    /* Register a new account
    */
    register(user, pass, confirmPass) {

        if (user == '') {
            account.setRegisterMsg('Please enter valid username');
            return;
        }
        if (pass == '') {
            account.setRegisterMsg('Plz enter valid password');
            return;        
        }
        if (pass != confirmPass) {
            account.setRegisterMsg('Pass must match');
            return;        
        }

        this.socket.emit('register', {
            username: user,
            password: pass,
            confirmPassword: confirmPass
        });
        account.setRegisterMsg('Request send to server');
    }

    /* Change the register help message
    */
    setRegisterMsg(string) {
        document.getElementById('registerMsg').innerHTML = string;
    }
}


/* Client side gamestate
*/
class Game {
    constructor(socket, player) {
        this.socket = socket;

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

    /* Client pressed rematch button
    */
    rematchPress() {
        this.socket.emit('acceptRematch');

        var opponentName = document.getElementById('p2Name').innerHTML;
        this.setMsgBox("Waiting for " + opponentName + " to accept rematch");
    }


    /* Forfeits and return back to lobby
    */
    forfeitGame() {
        console.log("foreited the game");
        this.socket.emit('forfeitGame');
    }


    /* Go back to lobby after game
    */
    backToLobby() {
        console.log("back to lobby time");
        this.socket.emit('backToLobby');
    }

    /* Set the message box
    */
    setMsgBox(string) {
        document.getElementById('msgBox').innerHTML = string;
    }

    /* Append to message box
    */
    appendMsgBox(string) {
        document.getElementById('msgBox').innerHTML += string;
    }
}



class Lobby {
    constructor(socket, players, messages, scoreboard) {
        this.socket = socket;
        this.players = players;        // array
        this.messages = messages;      // dict
        this.scoreboard = scoreboard;  // string

        this.playerState = STATE.lobby;

        this.refreshChatbox();
        this.refreshPlayersBox();
        this.refreshOnlineCount();
        this.updateScoreboard(scoreboard);
    }

    /* Update the scoreboard
    */
    updateScoreboard(scoreString) {
        console.log('updated scorestring = ' + scoreString);
        this.scoreboard = scoreString;
        document.getElementById('scoreBox').innerHTML = scoreString;
    }

    /* Player submitted a message
    */
    submitMsg() {
        console.log("submit msg");

        // Only send message if not empty string
        if (document.getElementById('msgInput').value != '') {
            this.socket.emit('msgLobby-player', document.getElementById('msgInput').value);
            document.getElementById('msgInput').value = '';
        }
    }


    /* Player pressed play button to queue up for game
    */
    queueUp() {
        if (this.playerState == STATE.lobby) {
            console.log("queued up for game...");
            this.socket.emit('playerQueued');    
        }
    }

    /* Player pressed cancel queue button
    */
    cancelQueue() {
        if (this.playerState == STATE.queued) {
            console.log("player CANCELED QUEUE!!!");
            this.socket.emit('cancelQueue');
        }
    }


    /* Updates a players status in lobby
    */
    updatePlayerStatus(socketID, state) {
        this.players[socketID].state = state;
        this.refreshPlayersBox();
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
            document.getElementById('playersBox').innerHTML += this.players[key].username + ' - ' + this.players[key].state + '<br>';
        }
    }
}