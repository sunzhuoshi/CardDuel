var g = require('./global.js');

var Game = require('./game.js').Game;
var OpCodes = require('./common.js').OpCodes;
var RoomState = require('./common.js').RoomState;
var PlayerState = require('./common.js').PlayerState;
var config = require('./config.js');

var roomIDSequence = 0;

function Room() {
    this.id = ++roomIDSequence;
    this.state = RoomState.STATE_IDLE;
    this.sessions = [];

    this._game = new Game(this);
    this._gameStartTimer = null;

    this.onGameEnd = function() {
        this._updateRoomState();
    }.bind(this);

    this._game.on('end', this.onGameEnd);

    this.getSyncData = function() {
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

    this.broadcastSyncData = function() {
        this.emitInRoom(OpCodes.ROOM_DATA, true, this.getSyncData());
    };

    this._onSessionEvents = function(session) {
        session.on('disconnect', this.onPlayerDisconnect);
        session.on('ready changed', this.onPlayerReadyChanged);
    };

    this._offSessionEvents = function(session) {
        session.removeListener('disconnect', this.onPlayerDisconnect);
        session.removeListener('ready changed', this.onPlayerReadyChanged);
    };

    this._updateRoomState = function() {
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

    this._onSessionsChange = function() {
        this._updateRoomState();
        this.broadcastSyncData();                
    };

    this.addSession = (session, callback) => {
        if (this.sessions.length < Room.SIZE) {
            this.sessions.push(session);
            this._onSessionEvents(session);
            callback.call(null, true, this.id);
            this._onSessionsChange();
        }
        else {
            callback.call(null, false, 'Room is full');
        }
    };

    this.removeSession = (session) => {
        this._offSessionEvents(session);
        this.sessions = this.sessions.filter((s) => {
            return s !== session;
        });
        this._onSessionsChange();        
    };

    this.onPlayerDisconnect = function(session) {
        this.emitInRoom(OpCodes.PLAYER_DISCONNECT, session.userID);                
        this.removeSession(session);
    }.bind(this);

    this.onPlayerReadyChanged = function() {
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
            if (this._gameStartTimer) {
                clearTimeout(this._gameStartTimer);
            }
            this._gameStartTimer = setTimeout(function() {
                self.changeState(RoomState.STATE_PLAYING);
            }, config.Settings.GAME_START_COUNTDOWN * 1000);
        }
    }.bind(this);

    this.onExitState = function(state) {
        switch (this.state) {
            case RoomState.STATE_PLAYING:
                this._game.end();
                break;
        }          
    };

    this.onEnterState = function(state) {
        this._gameStartTimer = null;
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
                break;            
            case RoomState.STATE_FULL:
                this.sessions.forEach((session) => {
                    session.changeState(PlayerState.STATE_ROOM);
                });            
                break;
            default:
                break;
        }          
    };

    this.changeState = function(state) {
        if (this.state != state) {
            this.onExitState(this.state);
            this.state = state;
            this.onEnterState(state); 
        }
    };

    this.getChannelID = function() {
        return 'room' + this.id;
    };

    this.emitInRoom = function() {
        var sockets = g.io.sockets.in(this.getChannelID());
        sockets.emit.apply(sockets, arguments);
    }
};

Room.SIZE = 2;

function RoomManager() {
    RoomManager.instance = this;

    this.rooms = {};
    this.findRoom = function(roomID) {
        return this.rooms[roomID];
    };

    this._getRoomWithState = function(state) {
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

    this.getAnIdleRoom = function() {
        var room = this._getRoomWithState(RoomState.STATE_IDLE);
        if (!room) {
            room = this.createRoom();
        }
        return room;
    };

    this.findAWaitingRoom = function() {
        return this._getRoomWithState(RoomState.STATE_WAITING);
    };

    // TODO: add max size limit
    this.createRoom = function() {
        var room = new Room();
        this.rooms[room.id] = room;
        g.logger.info('created room: ' + room.id);
        return room;
    }
}

new RoomManager();

module.exports = {
    Room: Room,
    RoomManager: RoomManager
};

