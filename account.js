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
        var sql = 'SELECT password FROM users WHERE username = ? AND password = ?';
        this.db.query(sql, [user, pass], function(err, result) {
            if (err) throw err;            
            if (result[0] && result[0].password == pass) {
                console.log('Successful login by ' + user);
                lobby.playerJoin(socket, user);
            } else {
                console.log('Failed login');
                socket.emit('loginFail');
            }
        });
    }


    /* Register a new user to SQL database
    */
    register(user, pass, confirmPass) {

    }
}