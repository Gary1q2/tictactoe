var express = require('express');
var http = require('http');


var app = express();
var server = http.Server(app);

app.set('port', 5000);



// Routing
app.get('/', function(req, res) {
    res.send("Hello world!");
});



// Starts the server
server.listen(5000, function() {
    console.log('Starting server on port 5000');
});