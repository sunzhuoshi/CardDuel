var g = require('./global.js');

var events = require('events'); 
var util = require('util');

var config = require('./config.js');
var RoomManager = require('./room.js').RoomManager;
var common = require('./common.js');
var OpCodes = common.OpCodes;
var PlayerState = require('./common.js').PlayerState;
var CardTemplateManager = require('./card.js').CardTemplateManager;
var base = require('./base.js');

function PlayerSession(sessionManager, userID, socket) {
    base.EventEmitterWithTimer.call(this);    
    this.sessionManager = sessionManager;
    this.userID = userID;
    this.socket = socket;
    this.state = PlayerState.STATE_IDLE;

    this.room = null;

    this.game = null;

    this.roomData = {
        ready: false
    };

    this.getSyncDataInRoom = function() {
        return {
            id: this.userID,
            data: this.roomData
        }
    };

    this.getSyncDataInGame = function() {
        return {
            id: this.userID,
            data: this.gameData
        }
    };

    this.gameData = {
        hp: config.PLAYER_MAX_HP,
        first: false,
        currentCardTemplateID: '',
        cardList: [],
        setToEnd: function() {
            this.first = false;
            this.currentCardTemplateID = '';
        },
        reset: function() {
            this.hp = config.Settings.PLAYER_INIT_HP;
            this.first = false;
            this.currentCardTemplateID = '';
            this.cardList = [];
            config.PlayerCardDefineList.forEach((cardDefine) => {
                let templateID = cardDefine[0];
                let count = cardDefine[1];
                for (let i=0; i<count; ++i) {
                    this.cardList.push(templateID);
                }
            });
        },
        cloneAsOpp: function() {
            var clone = common.util.clone(this);
            clone.cardList = clone.cardList.map(() => {
                return 'UK';
            })
            return clone;
        }
    };

    this.syncSelfGameData = function() {
        this.socket.emit(OpCodes.PLAYER_GAME_DATA, JSON.stringify(this.gameData));
    };

    this._joinRoom = function(room) {
        if (this.room) {
            this._leaveRoom();            
        }
        room.addSession(this, (result, roomIdOrMsg) => {
            this.socket.emit(OpCodes.JOIN_ROOM, result, roomIdOrMsg);
            g.logger.info('u[%d] join room[%d], result: %s, roomIdOrMsg: %s', this.userID, room.id, result, roomIdOrMsg);
            if (result) {
                this.socket.join(room.getChannelID());
                this.room = room;
                this.changeState(PlayerState.STATE_ROOM);
            }
        });
    };

    this.onRoomData = function() {
        if (this._checkIfOpAllowed(OpCodes.ROOM_DATA, PlayerState.STATE_ROOM)) {
            this.socket.emit(OpCodes.ROOM_DATA, true, this.room.getSyncData());
        }
    }.bind(this);

    this._leaveRoom = function() {
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

    this._checkIfOpAllowed = function(opcode, states) {
        var allowed = false;
        if ('Array' === typeof states) {
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

    this.onCreateRoom = function() {
        if (this._checkIfOpAllowed(OpCodes.CREATE_ROOM, PlayerState.STATE_IDLE)) {
            var room = RoomManager.instance.getAnIdleRoom();
            if (room) {
                this.socket.emit(OpCodes.CREATE_ROOM, true, room.id);
                this._joinRoom(room);
            }
            else {
                this.socket.emit(OpCodes.CREATE_ROOM, false, 'Failed to create room, server may be full');
            }
        }        
    }.bind(this);

    this.onQuickMatch = function() {
        if (this._checkIfOpAllowed(OpCodes.QUICK_MATCH, PlayerState.STATE_IDLE)) {
            var waitingRoom = RoomManager.instance.findAWaitingRoom();
            if (waitingRoom) {
                this._joinRoom(waitingRoom);                    
            }
            else {
                this.socket.emit(OpCodes.QUICK_MATCH, false, 'No waiting opponent');
                // TODO: add it into waiting queue
            }
        }
    }.bind(this);

    this.onJoinRoom = function(roomID) {
        if (this._checkIfOpAllowed(OpCodes.JOIN_ROOM, [PlayerState.STATE_IDLE, PlayerState.STATE_ROOM])) {
            if (roomID) { 
                let room;                            
                room = RoomManager.instance.findRoom(roomID);
                if (room) {
                    this._joinRoom(room);
                }
                else {
                    this.socket.emit(OpCodes.JOIN_ROOM, false, 'No such room');
                }
            }
        }
    }.bind(this);

    this.onLeaveRoom = function() {
        if (this._checkIfOpAllowed(OpCodes.LEAVE_ROOM, PlayerState.STATE_ROOM)) {
            this._leaveRoom();    
        }
    }.bind(this);

    this.onPlayerChangeReady = function(ready) {
        if (this._checkIfOpAllowed(OpCodes.PLAYER_CHANGE_READY, PlayerState.STATE_ROOM)) {
            var oldReady = this.roomData.ready;
            this.roomData.ready = ready;
            this.socket.emit(OpCodes.PLAYER_CHANGE_READY, true, this.roomData.ready);         
            if (oldReady !== this.roomData.ready) {
                this.emit('ready changed', this);
            }
        }
    }.bind(this);

    this.changeState = function(state) {
        if (state != this.state) {
            var oldState = this.state;
            this.state = state;
            switch (this.state) {
                case PlayerState.STATE_ROOM:
                    this.roomData.ready = false;
                    break;
                case PlayerState.STATE_DISCONNECTED: 
                    this.clearAllTimeouts();                
                    g.logger.info('u[%d] session disconnected', this.userID);
                    this.socket.disconnect(true);
                    this.socket = null;
                    this.emit('disconnect', this);                    
                    this.sessionManager.removeSession(this);
                    break;
                default:
                    break;
            }
        }
    };

    //< player interface used in config.js
    this.setFirst = function(first) {
        this.gameData.first = first;
    };

    this.takeDamage = function(damage) {
        if (damage > 0) {
            this.gameData.hp -= damage;
            if (this.gameData.hp < 0) {
                this.gameData.hp = 0;
            }
        }
        g.logger.debug('u[%d] take damage: %d, hp: %d', this.userID, damage, this.gameData.hp);
        this.game.emitInGame(OpCodes.PLAYER_TAKE_DAMAGE, this.userID, damage, this.gameData.hp);
        return this.gameData.hp > 0;
    };

    this.heal = function(hp) {
        if (hp > 0) {
            this.gameData.hp += hp;
        }
        g.logger.debug('u[%d] heal: %d, hp: %d', this.userID, hp, this.gameData.hp);        
        this.socket.emit(OpCodes.PLAYER_HEAL, hp, this.gameData.hp);
    };

    this.getCurrentCard = function() {
        return CardTemplateManager.instance.getCardTemplate(this.gameData.currentCardTemplateID);
    };
    //>

    //< game
    this._pickCard = function(cardIndex) {
        this.gameData.currentCardTemplateID = this.gameData.cardList[cardIndex];
        this.gameData.cardList.splice(cardIndex, 1);
        this.socket.emit(OpCodes.PLAYER_PICK_CARD, true, cardIndex, this.gameData.currentCardTemplateID);
        this.emit('pick card', this.gameData.currentCardTemplateID);
    };

    this._playerPickCardTimeout = function() {
        var cardIndex = (Math.floor(Math.random() * this.gameData.cardList.length));
        this._pickCard(cardIndex);
    }.bind(this);

    this.onPlayerPickCard = function(cardIndex) {
        if (this._checkIfOpAllowed(OpCodes.PLAYER_PICK_CARD, PlayerState.STATE_GAME)) {
            this.clearTimeout('player_pick_card');
            if (this.gameData.currentCardTemplateID) {
                this.socket.emit(OpCodes.PLAYER_PICK_CARD, false, 'Card already picked');
            }
            else {
                this._pickCard(cardIndex);
            }
        }
    }.bind(this);

    this.startTurn = function(pickCardCallback) {
        this.gameData.currentCardTemplateID = '';
        this.setTimeout('player_pick_card', this._playerPickCardTimeout, config.Settings.PLAYER_PICK_CARD_TIMEOUT);         
        this.socket.emit(OpCodes.PLAYER_TURN);  
    };
    //>

    this._setup = function() {
        this.socket.on('disconnect', () => {
            this.changeState(PlayerState.STATE_DISCONNECTED);
        });

        [
            [OpCodes.CREATE_ROOM, this.onCreateRoom],
            [OpCodes.QUICK_MATCH, this.onQuickMatch],     
            [OpCodes.JOIN_ROOM, this.onJoinRoom],
            [OpCodes.LEAVE_ROOM, this.onLeaveRoom],
            [OpCodes.ROOM_DATA, this.onRoomData],            
            [OpCodes.PLAYER_CHANGE_READY, this.onPlayerChangeReady],
            [OpCodes.PLAYER_PICK_CARD, this.onPlayerPickCard]
        ].forEach((el) => {
            this.socket.on(el[0], el[1]);
        });
    };
    this._setup();
}

util.inherits(PlayerSession, base.EventEmitterWithTimer);

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
            session = new PlayerSession(this, userID, socket);
            this.sessionList.push(session);
            callback.call(null, true, session);
        }
    };
    this.removeSession = (session) => {
        g.logger.debug('removing session, user id: %d', session.userID);
        var index = this.sessionList.indexOf(session);
        if (0 <= index) {
            g.logger.debug('removed session, user id: %d', session.userID);
            this.sessionList.splice(index, 1);
        }
    }
}

new PlayerSessionManager();


module.exports = {
    PlayerSession: PlayerSession,
    PlayerSessionManager: PlayerSessionManager
}