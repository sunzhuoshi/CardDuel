const SSL_KEY = '/etc/letsencrypt/archive/gifer.cn/privkey2.pem';
const SSL_CERT = '/etc/letsencrypt/archive/gifer.cn/fullchain2.pem';
const SSL_CA = '/etc/letsencrypt/archive/gifer.cn/chain2.pem';
const isSSL = true;

var g = require('./global.js');

var express = require('express');
var app = express();
var fs = require('fs');

var server;
if (isSSL) {
	server = require('https').createServer({
		key: fs.readFileSync(SSL_KEY),
		cert: fs.readFileSync(SSL_CERT),
		ca: fs.readFileSync(SSL_CA)
	}, app);
}
else {
	server = require('http').Server(app);	
}
var io = require('socket.io')(server);
var common = require('./common.js');
var OpCodes = common.OpCodes;
var PlayerSessionManager = require('./player_session.js').PlayerSessionManager;

g.io = io;

var userIDSequence = 1;

var UriMap = {
	'/config.js': '/config.js',
	'/ai.js': '/ai.js',
};

app.use('/static', express.static(__dirname + '/static'));

Object.keys(UriMap).forEach((key) => {
	app.get(key, (req, res) => {
		res.sendFile(__dirname + UriMap[key]);
	});
});

io.on('connection', function(socket) {
	g.logger.debug('new connection, id: %s', socket.id);
	// hack to show sending packets
	socket.emit = common.util.inject(socket.emit, function() {
		var args = [...arguments].map((arg) => {
			if ('object' === typeof arg) {
				return JSON.stringify(arg);
			}
			else {
				return arg;
			}
		});
		g.logger.debug('[%s] u[%d] sending packet: %s', socket.id, socket.userID, args.join(','));
	});

	socket.userID = 0; // only for debugging
	socket.use((packet, next) => {
		g.logger.debug('[%s] u[%d] received packet: %s', socket.id, socket.userID, packet);
		return next();
	});
	socket.on('disconnect', (reason) => {
		g.logger.debug('socket disconnected, id: %s, reason: %s', socket.id, reason);
		socket.removeAllListeners();
		socket.on('reconnect', () => {
			g.logger.debug('socket reconnect, id: %s', socket.id);
		});
	});
	socket.on(OpCodes.LOGIN, function(userID) {
		if (!userID || userID > userIDSequence || PlayerSessionManager.instance.findSession(userID)) {
			userID = ++userIDSequence;
			g.logger.info('generated user id: %d', userID);
		}
		socket.userID = userID;
		PlayerSessionManager.instance.createSession(userID, socket, function(result, sessionOrMsg) {
			if (result) {
				socket.emit(OpCodes.LOGIN, result, sessionOrMsg.userID, sessionOrMsg.state);
			}
			else {
				socket.emit(OpCodes.LOGIN, result, sessionOrMsg);
				socket.disconnect(true);
			}
		});
	});
});

server.listen(8888, function() {
	g.logger.info('listening on *:8888');
});


