var g = require('./global.js');

var util = require('util');
var Game = require('./game.js').Game;
var OpCodes = require('./common.js').OpCodes;
var RoomState = require('./common.js').RoomState;
var PlayerState = require('./common.js').PlayerState;
var config = require('./config.js');
var base = require('./base.js');

var roomIDSequence = 0;

function Room() {
    base.EventEmitterWithTimer.call(this);
    this.id = ++roomIDSequence;
    this.state = RoomState.STATE_IDLE;
    this.sessions = [];

    this._game = new Game(this);
    this.onGameEnd = this.onGameEnd.bind(this);
    this.onPlayerDisconnect = this.onPlayerDisconnect.bind(this);
    this.onPlayerReadyChanged = this.onPlayerReadyChanged.bind(this);
    
    this._game.on('end', this.onGameEnd);    
}

util.inherits(Room, base.EventEmitterWithTimer);

Room.prototype.onGameEnd = function() {
    this._updateRoomState();
};

Room.prototype.getSyncData = function() {
    var data = {
        id: this.id,
        state: this.state,
        players: []
    };
    this.sessions.forEach((session) => {
        data.players.push(session.getSyncDataInRoom());
    })
    return data;
};

Room.prototype.broadcastSyncData = function() {
    this.emitInRoom(OpCodes.ROOM_DATA, true, this.getSyncData());
};

Room.prototype._onSessionEvents = function(session) {
    session.on('disconnect', this.onPlayerDisconnect);
    session.on('ready_changed', this.onPlayerReadyChanged);
};

Room.prototype._offSessionEvents = function(session) {
    session.removeListener('disconnect', this.onPlayerDisconnect);
    session.removeListener('ready_changed', this.onPlayerReadyChanged);
};

Room.prototype._updateRoomState = function() {
    if (this.sessions.length === 0) {
        this.changeState(RoomState.STATE_IDLE);
    }
    else if (this.sessions.length < Room.SIZE) {
        this.changeState(RoomState.STATE_WAITING);           
    }
    else {
        this.changeState(RoomState.STATE_FULL);
    }
};

Room.prototype._onSessionsChange = function() {
    this._updateRoomState();
    this.broadcastSyncData();                
};

Room.prototype.addSession = function(session, callback) {
    if (this.sessions.length < Room.SIZE) {
        this.sessions.push(session);
        this._onSessionEvents(session);
        if ('function' === typeof callback) {
            callback.call(null, true, this.id);            
        }
        this._onSessionsChange();
    }
    else {
        if ('function' === typeof callback) {
            callback.call(null, false, 'Room is full');            
        }
    }
};

Room.prototype.removeSession = function(session) {
    this._offSessionEvents(session);
    this.sessions = this.sessions.filter((s) => {
        return s !== session && !s.isRemovable();
    });
    this._onSessionsChange();        
};

Room.prototype.onPlayerDisconnect = function(session) {
    this.emitInRoom(OpCodes.PLAYER_DISCONNECT, session.userID);                
    this.removeSession(session);
};

Room.prototype.onPlayerReadyChanged = function() {
    this.broadcastSyncData();
    var readyCount = 0;
    this.sessions.forEach((session) => {
        if (session.roomData.ready) {
            readyCount ++;
        }
    });
    if (readyCount === Room.SIZE) {
        var self = this;
        this.emitInRoom(OpCodes.GAME_WILL_START, config.Settings.GAME_START_COUNTDOWN);
        this.sessions.forEach((session) => {
            session.changeState(PlayerState.STATE_GAME_STARTING);
        });   
        this.setTimeout('playing', () => {
            this.changeState(RoomState.STATE_PLAYING);
        }, config.Settings.GAME_START_COUNTDOWN * 1000);
    }
};

Room.prototype.onExitState = function() {
    this.clearTimeout('playing');    
    switch (this.state) {
        case RoomState.STATE_PLAYING:
            this._game.end();
            break;
    }          
};

Room.prototype.onEnterState = function() {
    switch (this.state) {
        case RoomState.STATE_PLAYING:
            this.sessions.forEach((session) => {
                session.changeState(PlayerState.STATE_GAME);
            });
            this._game.start();
            break;
        case RoomState.STATE_WAITING:
            this.sessions.forEach((session) => {
                session.changeState(PlayerState.STATE_ROOM);
            });
            this.broadcastSyncData();                
            break;     
        case RoomState.STATE_FULL:
            this.sessions.forEach((session) => {
                session.changeState(PlayerState.STATE_ROOM);
            });
            this.broadcastSyncData();
            break;
        default:
            break;
    }          
};

Room.prototype.changeState = function(state) {
    if (this.state != state) {
        this.onExitState();
        this.state = state;
        this.onEnterState(); 
    }
};

Room.prototype.getChannelID = function() {
    return 'room' + this.id;
};

Room.prototype.emitInRoom = function() {
    var sockets = g.io.sockets.in(this.getChannelID());
    sockets.emit.apply(sockets, arguments);
}

Room.SIZE = 2;

function RoomManager() {
    RoomManager.instance = this;

    this.rooms = {};
}

RoomManager.prototype.findRoom = function(roomID) {
    return this.rooms[roomID];
};

RoomManager.prototype._getRoomWithState = function(state) {
    var room = null;
    var roomIDs = Object.keys(this.rooms);
    for (let i=0; i<roomIDs.length; ++i) {
        let rm = this.rooms[roomIDs[i]];
        if (rm.state === state) {
            room = rm;
            break;
        }     
    }
    return room;
};    

RoomManager.prototype.getAnIdleRoom = function() {
    var room = this._getRoomWithState(RoomState.STATE_IDLE);
    if (!room) {
        room = this.createRoom();
    }
    return room;
};

RoomManager.prototype.findAWaitingRoom = function() {
    return this._getRoomWithState(RoomState.STATE_WAITING);
};

// TODO: add max size limit
RoomManager.prototype.createRoom = function() {
    var room = new Room();
    this.rooms[room.id] = room;
    g.logger.info('created room: ' + room.id);
    return room;
}

new RoomManager();

module.exports = {
    Room: Room,
    RoomManager: RoomManager
};

