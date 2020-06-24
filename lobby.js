const Game = require('./game.js');
const STATE = {
    lobby: "lobby",
    user: "user",
    system: "system"
}

module.exports = class Lobby {
    constructor(io) {
        this.players = {};   // Store player info
        this.messages = [];  // Store messages send

        this.queue = [];     // Queue of players
        this.games = [];     // Current running games

        this.io = io;
    }

    /* Creates new game with 2 players
    */
    createGame(p1, p2) {
        var game = new Game(p1, this.players[p1].name, p2, this.players[p2].name, this.io);
        this.games.push(game);
    }

    /* Checks and matches queued players for a game
    */
    matchPlayersForGame() {
        if (this.queue.length >= 2) {
            console.log('matched a game for 2 players!');

            var p1 = this.queue.shift();
            var p2 = this.queue.shift();
            this.createGame(p1, p2);
        }
    }


    /* Queue player up for a game
    */
    queuePlayer(socket) {
        console.log("player queued!");
        if (this.queue.includes(socket.id)) {
            throw 'Player cannot join the queue more than once...';
        }

        socket.emit('queued');
        this.queue.push(socket.id);
        this.matchPlayersForGame();
    }

    /* Player canceled queue for game
    */
    cancelQueue(socketID) {
        console.log("player dequeued!");

        //console.log("queue len = " + this.queue.length)
        if (!this.queue.includes(socketID)) {
            throw 'Cannot cancel queue if not already in queue';
        }

        // Remove player from the queue
        for (var i = 0; i < this.queue.length; i++) {
            if (this.queue[i] == socketID) {
                this.queue.splice(i, 1);
                break;
            }
        }
        this.io.to(socketID).emit('dequeued');
    }

    /* A new player joined the lobby
    */
    playerJoin(socket, name) {
        console.log("new player with name = " + name + "  connected to lobby");

        if (name == '') {
            throw 'Player must login with a valid name!! player ignored as fail spectator';
        }

        // Add player to dict
        var player = {
            name: name,
            state: STATE.lobby
        };
        this.players[socket.id] = player;

        // Send lobby stuff to new player
        socket.emit('setupLobby', {
            players: this.players, 
            messages: this.messages
        });

        // Send player update to all players
        socket.broadcast.emit('addPlayer', {
            player: player,
            socketID: socket.id
        });

        this.systemMsg(name + ' has joined the lobby!');
    }

    /* A player left the lobby
    */
    playerLeave(socket) {
        if (!(socket.id in this.players)) {
            throw 'Invalid socketID leaving game.... must be stale player?';
        }

        console.log('player ' + this.players[socket.id].name + 'left :(');

        // Send player removal to all players
        socket.broadcast.emit('removePlayer', socket.id);

        this.systemMsg(this.players[socket.id].name + ' has left the lobby.');
        delete this.players[socket.id];


    }

    /* System broadcasted a message to lobby chat
    */
    systemMsg(string) {
        if (string == '') {
            throw 'System message CANNOT be empty';
        }

        // Update the chat log
        var msgData = {
            type: STATE.system,
            msg: string,
            user: STATE.system
        };
        this.messages.push(msgData);

        // Send chat update to everyone
        this.io.emit('addMsg', msgData);
    }

    /* Player sent a message to lobby chat
    */
    playerMsg(socketID, string) {
        if (string == '') {
            throw 'Message by player cannot be empty';
        }

        if (!(socketID in this.players)) {
            throw 'Invalid socketID during message send... stale playe?';
        }
        console.log(this.players[socketID].name + ' sent msg ' + string);

        // Update the chat log
        var msgData = {
            type: STATE.user,
            msg: string,
            user: this.players[socketID].name
        };
        this.messages.push(msgData);

        // Send chat update to everyone
        this.io.emit('addMsg', msgData);
    }

    /* Player started a game
    */
    playerPlay() {

    }
}