const STATE = {
    lobby: "lobby",
    user: "user",
    system: "system"
}

module.exports = class Lobby {
    constructor(io) {
        this.players = {};
        this.messages = [];

        this.io = io;
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
    playerLeave(socketID) {
        if (!(socketID in this.players)) {
            throw 'Invalid socketID leaving game.... must be stale player?';
        }

        console.log('player ' + this.players[socketID].name + 'left :(');
        delete this.players[socketID];
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