module.exports = class Account {
    constructor(io) {
        this.io = io;
    }

    /* Login a user
    */
    login(user, pass) {
        if (user == '' || pass == '') {
            throw 'User or pass cannot be empty';
        }

        //do SQL database checks...
    }

    /* Register a new user to SQL database
    */
    register(user, pass, confirmPass) {

    }
}