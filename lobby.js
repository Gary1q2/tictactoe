const STATE = {
    lobby: "lobby"
}

module.exports = class Lobby {
    constructor(io) {
        this.players = {};
        this.messages = [];

        this.io = io;
    }

    /* A new player joined the lobby
    */
    playerJoin(socketID, name) {
        console.log("new player with name = " + name + "  connected to lobby");

        if (name == '') {
            throw 'Player must login with a valid name!! player ignored as fail spectator';
        }

        this.players[socketID] = {
            name: name,
            state: STATE.lobby
        };
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

    /* System broadcasted a message
    */
    systemMsg() {

    }

    /* Player sent a message
    */
    playerMsg() {

    }

    /* Player started a game
    */
    playerPlay() {

    }
}