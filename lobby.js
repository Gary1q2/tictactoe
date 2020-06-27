const Game = require('./game.js');
const STATE = {
    lobby: "lobby",
    queued: "queued",
    ingame: "ingame",
    endscreen: "endscreen",
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

    /* Remove game that doesnt exist anymore
    */
    /*purgeGame(gameIndex) {
        this.games.splice(gameIndex, 1);
    }*/



    /* Remove all games that have ended
    */
    purgeGames() {
        console.log("purging games...");
        var index = 0;
        while (index < this.games.length) {
            var game = this.games[index];
            if (game.p1 == false && game.p2 == false) {
                this.games.splice(index, 1);
                console.log("REMOVED game @ index " + index);
            } else {
                index++;
            }
        }

        console.log("Remaining games = " + this.games.length);
    }

    /* Creates new game with 2 players
    */
    createGame(p1Socket, p2Socket) {
        var game = new Game(p1Socket, this.players[p1Socket].name, p2Socket, this.players[p2Socket].name, this, this.io);
        this.games.push(game);
    }

    /* Checks and matches queued players for a game
    */
    matchPlayersForGame() {
        if (this.queue.length >= 2) {
            console.log('matched a game for 2 players!');

            var p1Socket = this.queue.shift();
            var p2Socket = this.queue.shift();
            this.createGame(p1Socket, p2Socket);
        }
    }


    /* Given the socket.id, return the game index the player belongs in
        Returns - int (the index of the game)
    */
    findPlayersGame(socketID) {
        for (var i = 0; i < this.games.length; i++) {
            if (socketID == this.games[i].p1 || socketID == this.games[i].p2) {
                console.log(socketID + " id found in game index " + i);
                return i;
            }
        }
        
        throw 'Player isnt found in any existing games';
    }


    /* Queue player up for a game
    */
    queuePlayer(socket) {
        console.log("player queued!");
        if (this.queue.includes(socket.id)) {
            throw 'Player cannot join the queue more than once...';
        }

        this.queue.push(socket.id);

        socket.emit('queued');
        this.io.emit('updatePlayerStatus', {
            socketID: socket.id,
            state: STATE.queued
        });

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
        this.io.emit('updatePlayerStatus', {
            socketID: socketID,
            state: STATE.lobby
        });
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