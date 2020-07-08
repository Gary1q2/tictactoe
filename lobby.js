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
    constructor(io, db) {
        this.players = {};   // Store player info
        this.messages = [];  // Store messages send

        this.queue = [];     // Queue of players
        this.games = [];     // Current running games

        this.io = io;
        this.db = db;

        this.scoreboard = ['']; // [0] string

        console.log("inited lobby");
    }


    /* Updates the highscore board
    */
    updateScoreboard() {

        var scoreData = [];
        var io = this.io;
        var scoreboard = this.scoreboard;

        // Pull player scores from SQL
        var sql = 'SELECT username, score FROM users';
        this.db.query(sql, function(err, result) {
            if (err) throw err;

            console.log("query success");
            // Generate player score data and ratings
            for (var i = 0; i < result.length; i++) {

                var scoreJSON = JSON.parse(result[i].score);

                // Skip players with no wins or losses
                if (scoreJSON.win == 0 && scoreJSON.lose == 0) {
                    continue;
                }

                // Special case when 0L, can't divide by 0
                var rating;
                if (scoreJSON.lose == 0) {
                    rating = (scoreJSON.win/(scoreJSON.lose+1)).toFixed(2);
                } else {
                    rating = (scoreJSON.win/(scoreJSON.lose)).toFixed(2);
                }


                var playerData = {
                    username: result[i].username,
                    rating: rating,
                    win: scoreJSON.win,
                    lose: scoreJSON.lose,
                    draw: scoreJSON.draw
                };
                scoreData.push(playerData);
            }

            // Sort the data based on rating in increasing order
            scoreData.sort(function(a, b) {
                return b.rating - a.rating;
            });

            // Set the string scoreboard 
            var scoreString = '';
            var i = 0;
            while (i < 5) {
                if (i < scoreData.length) {
                    scoreString += (i+1) + '. ' + scoreData[i].username + ' ' +
                              scoreData[i].rating + ' ' + scoreData[i].win + 
                              'W ' + scoreData[i].lose + 'L '
                               + scoreData[i].draw + 'D<br>';
                } else {
                    scoreString += (i+1) + '. -<br>';
                }
                i++;
            }

            // Send update to all players
            io.emit('scoreboard', scoreString);

            scoreboard[0] = scoreString;
            console.log("var scoreboard = " + scoreboard[0]);
            console.log('Updated scoreboard!');
        });
    }

    /* Remove game that doesnt exist anymore
    */
    /*purgeGame(gameIndex) {
        this.games.splice(gameIndex, 1);
    }*/


    /* Retrieve messages from SQL database on server bootup
    */
    loadMessages() {
        console.log('Acquiring messages from SQL database...')

        var messages = this.messages;

        var sql = 'SELECT json FROM messages ORDER BY id';
        this.db.query(sql, function(err, result) {
            if (err) throw err;

            // Parse all SQL messages and push onto server messages array
            for (var i = 0; i < result.length; i++) {
                var msgData = JSON.parse(result[i].json);
                messages.push(msgData);
            }
            console.log('Messages finished acquiring!');
        });
    }


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
        var game = new Game(p1Socket, this.players[p1Socket].username, p2Socket, this.players[p2Socket].username, this, this.io, this.db);
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

    /* A player joined the lobby
    */
    playerJoin(socket, username, score) {
        console.log(username + " connected to lobby");

        // Add player to dict
        var player = {
            username: username,
            score: score,
            state: STATE.lobby
        };
        this.players[socket.id] = player;

        // Send lobby stuff to new player
        socket.emit('setupLobby', {
            players: this.players, 
            messages: this.messages,
            scoreboard: this.scoreboard[0]
        });

        console.log('sent score = ' + this.scoreboard[0]);

        // Send player update to all players
        socket.broadcast.emit('addPlayer', {
            player: player,
            socketID: socket.id
        });

        this.systemMsg(username + ' has joined the lobby!');
    }

    /* A player left the lobby
    */
    playerLeave(socket) {
        if (!(socket.id in this.players)) {
            throw 'Invalid socketID leaving game.... must be stale player?';
        }

        console.log('player ' + this.players[socket.id].username + ' left :(');

        // Send player removal to all players
        socket.broadcast.emit('removePlayer', socket.id);

        this.systemMsg(this.players[socket.id].username + ' has left the lobby.');
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

        // Send to SQL database
        var sql = 'INSERT INTO messages (json) VALUES (?)';
        this.db.query(sql, [JSON.stringify(msgData)], function(err, result) {
            if (err) throw err;
            console.log('System message added to SQL database');
        });
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
        console.log(this.players[socketID].username + ' sent msg ' + string);

        // Update the chat log
        var msgData = {
            type: STATE.user,
            msg: string,
            user: this.players[socketID].username
        };
        this.messages.push(msgData);

        // Send chat update to everyone
        this.io.emit('addMsg', msgData);

        // Send to SQL database
        var sql = 'INSERT INTO messages (json) VALUES (?)';
        this.db.query(sql, [JSON.stringify(msgData)], function(err, result) {
            if (err) throw err;
            console.log('Player message added to SQL database');
        });
    }

    /* Player started a game
    */
    playerPlay() {

    }
}