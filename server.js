var Buffer = require('buffer').Buffer;
	dgram = require('dgram'),
	socket = dgram.createSocket("udp4");

var express = require('express')
	app = express(),
  	http = require('http')
	server = http.createServer(app)
	io = require('socket.io').listen(server);

app.configure(function(){
	app.use(express.favicon());
	app.use(express.static(__dirname + '/public'));
});


server.listen(8124);


io.sockets.on('connection', function(web_socket) {

	web_socket.emit('init', {
		msg: 'Initialized'
	});

	web_socket.on('message', function(data) {
		// console.log("message from client: " + data.msg);

		// var buf = new Buffer(data.msg);

		var buf = new Buffer(data.msg.length);

		for (var i=0; i<data.msg.length; i++){
			buf.writeUInt8(parseInt(data.msg[i]), i);
		}
		
		// console.log("buffer sent: " + buf);



		socket.send(buf, 0, buf.length, 8888, "10.118.73.220", function(err, bytes) {
			if(err) console.log('error: ' + err);
			// else console.log('successful');
		});
	});

	//Message received back from the Arduino
	socket.on("message", function(msg, rinfo) {
		// console.log("Message: " + msg + "\nfrom " + rinfo.address + ":" + rinfo.port);

		// web_socket.emit('msg', {
		// 	msg: "Message: " + msg + "\nfrom " + rinfo.address + ":" + rinfo.port
		// });

	});

});

socket.bind(8125);

