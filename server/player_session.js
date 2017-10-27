var g = require('./global.js');

var util = require('util');

var config = require('./config.js');
var RoomManager = require('./room.js').RoomManager;
var common = require('./common.js');
var OpCodes = common.OpCodes;
var PlayerState = require('./common.js').PlayerState;
var BaseSession = require('./base_session.js').BaseSession;
var AISession = require('./ai_session.js').AISession;

function PlayerSession(userID, sessionManager, socket) {
    BaseSession.apply(this, arguments);
    this.sessionManager = sessionManager;    
    this.socket = socket;
    this._setup();    
}

util.inherits(PlayerSession, BaseSession);

PlayerSession.prototype.joinRoom = function(room) {
    if (this.room) {
        this.leaveRoom();            
    }
    room.addSession(this, (result, roomIdOrMsg) => {
        this.socket.emit(OpCodes.JOIN_ROOM, result, roomIdOrMsg);
        g.logger.info('u[%d] join room[%d], result: %s, roomIdOrMsg: %s', this.userID, room.id, result, roomIdOrMsg);
        if (result) {
            this.socket.join(room.getChannelID());
            this.room = room;
        }
    });
};

PlayerSession.prototype.leaveRoom = function() {
    if (this.room) {
        var room = this.room;
        g.logger.info('u[%d] leave room, roomID: %s', this.userID, room.id);            
        this.socket.leave(room.getChannelID());
        this.socket.emit(OpCodes.LEAVE_ROOM, true, room.id);
        room.removeSession(this);            
        this.room = null;
        this.changeState(PlayerState.STATE_IDLE);
    }
};

PlayerSession.prototype._checkIfOpAllowed = function(opcode, states) {
    var allowed = false;
    if (states instanceof Array) {
        allowed = (0 <= states.indexOf(this.state));
    }
    else if ('string' === typeof states) {
        allowed = (this.state === states);
    }
    if (!allowed) {
        this.socket.emit(opcode, false, 'opcode(' + opcode + ') not allowed for state: ' + this.state);
        g.logger.warn('u[%d] opcode(%s) not allowed for state: %s', this.userID, opcode, this.state);
        return false;
    }
    return allowed;
};

//< interfaces for game.js
PlayerSession.prototype.send = function() {
    this.socket.emit.apply(this.socket, arguments);
}
//>

//< network event listeners
PlayerSession.prototype.onCreateRoom = function() {
    if (this._checkIfOpAllowed(OpCodes.CREATE_ROOM, PlayerState.STATE_IDLE)) {
        var room = RoomManager.instance.getAnIdleRoom();
        if (room) {
            this.socket.emit(OpCodes.CREATE_ROOM, true, room.id);
            this.joinRoom(room);
        }
        else {
            this.socket.emit(OpCodes.CREATE_ROOM, false, 'Failed to create room, server may be full');
        }
    }        
};

PlayerSession.prototype.onQuickMatch = function() {
    if (this._checkIfOpAllowed(OpCodes.QUICK_MATCH, PlayerState.STATE_IDLE)) {
        var waitingRoom = RoomManager.instance.findAWaitingRoom();
        if (waitingRoom) {
            this.joinRoom(waitingRoom);                    
        }
        else {
            this.socket.emit(OpCodes.QUICK_MATCH, false, 'No waiting opponent');
            // TODO: add it into waiting queue
        }
    }
};

PlayerSession.prototype.onRoomData = function() {
    if (this._checkIfOpAllowed(OpCodes.ROOM_DATA, PlayerState.STATE_ROOM)) {
        this.socket.emit(OpCodes.ROOM_DATA, true, this.room.getSyncData());
    }
};

PlayerSession.prototype.onJoinRoom = function(roomID) {
    if (this._checkIfOpAllowed(OpCodes.JOIN_ROOM, [PlayerState.STATE_IDLE, PlayerState.STATE_ROOM])) {
        if (roomID) { 
            let room;                            
            room = RoomManager.instance.findRoom(roomID);
            if (room) {
                this.joinRoom(room);
            }
            else {
                this.socket.emit(OpCodes.JOIN_ROOM, false, 'No such room');
            }
        }
    }
};

PlayerSession.prototype.onLeaveRoom = function() {
    if (this._checkIfOpAllowed(OpCodes.LEAVE_ROOM, PlayerState.STATE_ROOM)) {
        this.leaveRoom();
    }
};

PlayerSession.prototype.onPlayerChangeReady = function(ready) {
    if (this._checkIfOpAllowed(OpCodes.PLAYER_CHANGE_READY, PlayerState.STATE_ROOM)) {
        this.setReady(ready, false, () => {
            this.socket.emit(OpCodes.PLAYER_CHANGE_READY, true, this.roomData.ready);            
        });
    }
};

PlayerSession.prototype.onPlayerPickCard = function(cardIndex) {
    if (this._checkIfOpAllowed(OpCodes.PLAYER_PICK_CARD, PlayerState.STATE_GAME)) {
        this.clearTimeout('player_pick_card');
        if (this.gameData.currentCardTemplateID) {
            this.socket.emit(OpCodes.PLAYER_PICK_CARD, false, 'Card already picked');
        }
        else {
            this.pickCard(cardIndex);
        }
    }
};

PlayerSession.prototype.onChallengeAI = function() {
    if (this._checkIfOpAllowed(OpCodes.CHALLENGE_AI, PlayerState.STATE_IDLE)) {
        var room = RoomManager.instance.getAnIdleRoom();
        if (room) {
            let aiSession = new AISession(-room.id);
            aiSession.joinRoom(room);
            this.joinRoom(room);
            this.socket.emit(OpCodes.CHALLENGE_AI, true);
        }
        else {
            this.socket.emit(OpCodes.CHALLENGE_AI, false, 'Failed to create AI room');
        }
    }
};
//>
//< sub class interfaces
PlayerSession.prototype.getName = function() {
    return 'Player' + this.userID;
};

PlayerSession.prototype.onEnterState = function() {
    switch (this.state) {
        case PlayerState.STATE_DISCONNECTED:
            g.logger.info('u[%d] session disconnected', this.userID);
            this.socket = null;
            this.emit('disconnect', this);                    
            this.sessionManager.removeSession(this);
            break;
        default:
            break;            
    }
};

PlayerSession.prototype.onPickCard = function(cardIndex) {
    this.socket.emit(OpCodes.PLAYER_PICK_CARD, true, cardIndex, this.gameData.currentCardTemplateID);
};

PlayerSession.prototype.onStartTurn = function() {
    this.setTimeout('player_pick_card', () => {
            this.pickCard(Math.floor(Math.random() * this.gameData.cardList.length));
        }, config.Settings.PLAYER_PICK_CARD_TIMEOUT
    );
    this.socket.emit(OpCodes.PLAYER_TURN, config.Settings.PLAYER_PICK_CARD_TIMEOUT);
};
//>


PlayerSession.prototype._setup = function() {
    [
        ['disconnect',  function() { this.changeState(PlayerState.STATE_DISCONNECTED); }],
        [OpCodes.CREATE_ROOM, this.onCreateRoom],
        [OpCodes.QUICK_MATCH, this.onQuickMatch],     
        [OpCodes.JOIN_ROOM, this.onJoinRoom],
        [OpCodes.LEAVE_ROOM, this.onLeaveRoom],
        [OpCodes.ROOM_DATA, this.onRoomData],            
        [OpCodes.PLAYER_CHANGE_READY, this.onPlayerChangeReady],
        [OpCodes.PLAYER_PICK_CARD, this.onPlayerPickCard],
        [OpCodes.CHALLENGE_AI, this.onChallengeAI],
    ].forEach((el) => {
        this.socket.on(el[0], el[1].bind(this));
    });
};

function PlayerSessionManager() {
    PlayerSessionManager.instance = this;
    this.sessionList = [];
    this.createSession = (userID, socket, callback) => {
        var session = this.sessionList.find((session) => {
            return session.userID === userID;
        });
        if (session) {
            callback.call(null, false, 'Login failure, only one session allowed');
        }
        else {
            session = new PlayerSession(userID, this, socket);
            this.sessionList.push(session);
            callback.call(null, true, session);
        }
    };
    this.removeSession = (session) => {
        g.logger.debug('removing session, user id: %d', session.userID);
        var index = this.sessionList.indexOf(session);
        if (0 <= index) {
            this.sessionList[index].clearAllTimeouts();
            g.logger.debug('removed session, user id: %d', session.userID);
            this.sessionList.splice(index, 1);
        }
    }
}

PlayerSessionManager.prototype.findSession = function(userID) {
    return this.sessionList.find((session) => {
        return session.userID === userID;
    });
}

new PlayerSessionManager();

module.exports = {
    PlayerSessionManager: PlayerSessionManager
}