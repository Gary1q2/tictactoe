/* Deals with login in and signing up of accounts
*/
module.exports = class Account {
    constructor(io, lobby, db) {
        this.io = io;
        this.lobby = lobby;
        this.db = db;
    }

    /* Login a user
    */
    login(socket, user, pass) {
        if (user == '' || pass == '') {
            throw 'User or pass cannot be empty';
        }

        var lobby = this.lobby;
        var sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
        this.db.query(sql, [user, pass], function(err, result) {
            if (err) throw err;
            
            // Account can be logged in
            if (result[0] && result[0].password == pass) {
                console.log('Online = ' + result[0].online);
                if (result[0].online == false) {
                    console.log('Successful login by ' + user);
                    lobby.playerJoin(socket, user, JSON.parse(result[0].score));            

                // Account already logged in
                } else {
                    console.log('Player is already logged in');
                    socket.emit('loggedAlready');
                }

            // Wrong username or password
            } else {
                console.log('Failed login');
                socket.emit('loginFail');
            }
        });
    }

    /* Register a new user to SQL database
    */
    register(socket, user, pass, confirmPass) {
        if (user == '' || pass == '') {
            throw 'User or pass cannot be empty';
        }
        if (pass != confirmPass) {
            throw 'Passwords must match';
        }

        var score = {
            win: 0,
            lose: 0,
            draw: 0
        }

        // Check if user already exists otherwise create new account
        var sql = 'INSERT INTO users (username, password, score, online) VALUES (?, ?, ?, ?)';
        this.db.query(sql, [user, pass, JSON.stringify(score), false], function(err, result) {
            if (err) {
                console.log('User already exists...');
                socket.emit('registerFail');
                return;
            }
            console.log('Successfully registered user ' + user);
            socket.emit('registerSuccess');
        });
    }
}