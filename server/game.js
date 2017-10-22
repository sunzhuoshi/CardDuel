var g = require('./global.js');

var events = require('events');
var util = require('util');

var CardTemplateManager = require('./card.js').CardTemplateManager;
var OpCodes = require('./common.js').OpCodes;
var CardVersus = require('./config.js').CardVersus;
var config = require('./config.js');

function Game(room) {
    events.EventEmitter.call(this);
    this.room = room;      
    this.firstSession = null;
    this.secondSession = null;
	this.round = 0;
    this.sessions = [];
    this.winnerUserID = 0;
    this._isEnded = false;
    this._timers = {};
    
    //< TODO: refactor 
    this._getSyncDataForPlayer = function(session) {
        var ret = {
            id: this.room.id,
            round: this.round,
            players: []
        };
        this.sessions.forEach((s) => {
            var playerDataInGame = s.getSyncDataInGame();
            if (s !== session) {
                playerDataInGame.data = playerDataInGame.data.cloneAsOpp();
            }
            ret.players.push(playerDataInGame);
        });
        return ret;
    };

    this._getSyncFirstData = function() {
        var data = [];
        this.sessions.forEach((session) => {
            data.push({
                id: session.userID,
                first: session.gameData.first
            });
        });
        return data;
    };
    //>

    this._generateWinner = function() {        
        if (this.sessions.length === 2 && 
            this.sessions[0].gameData.hp === this.sessions[1].gameData.hp) {
            this.winnerUserID = 0;
        }
        else {
            this.winnerUserID = this.sessions.sort((a, b) => {
                return a.gameData.hp < b.gameData.hp;
            })[0].userID;                
        }
        g.logger.info('winner of game(%d): %d', this.room.id, this.winnerUserID);
        this.sessions.forEach((session) => {
            g.logger.debug('u[%d] hp: %d', session.userID, session.gameData.hp);
        });
    };

    this._ifGameEnds = function() {
        return this.sessions.some((session) => {
            return session.gameData.hp <= 0 || session.gameData.cardList.length === 0;
        });
    };

    this._updateFirst = function() {
        this.firstSession = this.sessions.find((session) => {
            return session.first;
        });
        if (!this.firstSession) {
            let firstSessionIndex = Math.random() > 0.5? 1: 0;
            let secondSessionIndex = (firstSessionIndex + 1) % 2;
            this.firstSession = this.sessions[firstSessionIndex];
            this.firstSession.setFirst(true);
            this.secondSession = this.sessions[secondSessionIndex];
            this.secondSession.setFirst(false);
        }
    };

    /*
    this._broadcastSyncData = function() {
        this.emitInGame(OpCodes.GAME_DATA_FIRST, this._getSyncFirstData());
    };
    */

    this._startRound = function() {
        g.logger.debug('######## round %d ########', this.round);
        this.emitInGame(OpCodes.GAME_ROUND, this.round);
        this._updateFirst();        
        this._syncGameData();        
        this.sessions.forEach((session) => {            
            session.startTurn();
        });
    };

    this._cardVersus = function() {
        var dataList = [];

        dataList.push({
            userID: this.firstSession.userID,
            cardTemplateID: this.firstSession.gameData.currentCardTemplateID
        });
        dataList.push({
            userID: this.secondSession.userID,
            cardTemplateID: this.secondSession.gameData.currentCardTemplateID            
        })
        this.emitInGame(OpCodes.GAME_CARD_VERSUS, dataList);

        CardVersus(this.firstSession, this.secondSession);

        this.sessions.forEach((session) => {
            session.gameData.currentCardTemplateID = ''
        });

        if (this._ifGameEnds()) {
            this._timers['round_timer'] = setTimeout(() => {
                this.sessions.forEach((session) => {
                    session.gameData.setToEnd();
                });
                this._syncGameData();
                this._generateWinner();
                this.emitInGame(OpCodes.GAME_END, this.winnerUserID);        
                this._timers['end_timer'] = setTimeout(() => {
                    this.end();
                }, config.Settings.GAME_END_DELAY);                    
            }, config.Settings.GAME_NEXT_ROUND_DELAY);
        }   
        else {
            this._timers['round_timer'] = setTimeout(() => {
                this.round ++;
                this._startRound();
            }, config.Settings.GAME_NEXT_ROUND_DELAY);
        }
    };

    this.onPlayerPickCard = function() {
        if (!this.winnerUserID &&
            this.firstSession.gameData.currentCardTemplateID.length > 0 && this.secondSession.gameData.currentCardTemplateID.length > 0) {
            this._cardVersus();
        }
        else {
            var dataList = [];
            this.sessions.forEach((session) => {
                dataList.push({
                    id: session.userID,
                    picked: 0 < session.gameData.currentCardTemplateID.length,
                    cardCount: session.gameData.cardList.length
                });
            });
            this.emitInGame(OpCodes.GAME_DATA_PICKED, dataList);
        }
    }.bind(this);

    this._onSessions = function() {
        this.sessions.forEach((session) => {
            session.on('pick card', this.onPlayerPickCard);
        });
    };

    this._offSessions = function() {
        this.sessions.forEach((session) => {
            session.removeListener('pick card', this.onPlayerPickCard);
        })
    }

    this._setup = function() {
        this.firstSession = null;
        this.secondSession = null;
        this.winnerUserID = 0;
        this.round = 1;
        this._isEnded = false;        
        this._timers = {};
        this.sessions = this.room.sessions;
        this.sessions.forEach((session) => {
            session.gameData.reset();
            session.game = this;
        });
        this._onSessions();
    };

    this._syncGameData = function() {
        this.sessions.forEach((session) => {
            session.socket.emit(OpCodes.GAME_DATA, this._getSyncDataForPlayer(session));
        });
    },
            
	this.start = function() {
        this._setup();
        this.emitInGame(OpCodes.GAME_START, true);
        this._startRound();
    };

    this.end = function() {
        if (!this._isEnded) {
            this._isEnded = true;
            for (let key in Object.keys(this._timers)) {
                clearTimeout(this._timers[key]);
            }
            this._timers = {};
    
            if (this.sessions.length) {
                this._offSessions();
                this.sessions = [];
                this.emit('end');
            }
        }
    };

    this.emitInGame = function() {
        this.room.emitInRoom.apply(this.room, arguments);
    };
}

util.inherits(Game, events.EventEmitter);

module.exports = {
    Game: Game
};

