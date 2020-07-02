// Client classes

/* Logining in and registering accounts
*/
class Account {

    constructor() {

    }

    /* Login using username and password
    */
    login() {

    }

    /* Switch to register account interface
    */
    switchToRegister() {
        document.getElementById('loginInterface').style.visibility = 'hidden';
        document.getElementById('registerBox').style.visibility = 'visible';
    }

    /* Switch to login account interface
    */
    switchToLogin() {
        document.getElementById('registerBox').style.visibility = 'hidden';
        document.getElementById('loginInterface').style.visibility = 'visible';
    }

    /* Register a new account
    */
    register() {

    }
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
            document.getElementById('playersBox').innerHTML += this.players[key].name + ' - ' + this.players[key].state + '<br>';
        }
    }
}