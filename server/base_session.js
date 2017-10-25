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

function BaseSession(userID) {
    base.EventEmitterWithTimer.call(this);
    this.userID = userID;
    this.name = this.getName();
    this.state = PlayerState.STATE_IDLE;

    this.room = null;
    this.game = null;
    this.roomData = {
        ready: false,
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
            // change the card order randomly
            for (var i=0; i<this.cardList.length; ++i) {
                var index = Math.floor(Math.random() * this.cardList.length);
                var tmp = this.cardList[i];
                this.cardList[i] = this.cardList[index];
                this.cardList[index] = tmp;
            }
        },
        cloneAsOpp: function() {
            var clone = common.util.clone(this);
            clone.cardList = clone.cardList.sort((a, b) => {
                return a > b;
            });
            return clone;
        }     
    }
}

util.inherits(BaseSession, base.EventEmitterWithTimer);

BaseSession.prototype.getSyncDataInRoom = function() {
    return {
        id: this.userID,
        name: this.name,
        data: this.roomData
    }
}

BaseSession.prototype.getSyncDataInGame = function() {
    return {
        id: this.userID,
        name: this.name,
        data: this.gameData,
    }
}

BaseSession.prototype.setReady = function(ready, silent, callback) {
    var oldReady = this.roomData.ready;
    this.roomData.ready = ready;
    if ('function' === typeof callback) {
        callback.call(null);
    }
    if (!silent && oldReady !== this.roomData.ready) {
        this.emit('ready_changed', this);
    }
}

BaseSession.prototype._onEnterState = function() {
    switch (this.state) {
        case PlayerState.STATE_GAME:
            this.setReady(false, true);
            break;
    }
}

BaseSession.prototype._onExitState = function() {
    this.clearAllTimeouts();    
}

BaseSession.prototype.changeState = function(state) {
    if (state != this.state) {
        this._onExitState();
        this.onExitState();
        this.state = state;
        this._onEnterState();
        this.onEnterState();
    }
}

BaseSession.prototype.getOppSession = function() {
    var ret = null;
    if (this.room) {
        ret = this.room.sessions.find((el) => {
            return el !== this;
        });
    }
    return ret;
}

//< interfaces for config.js
BaseSession.prototype.setFirst = function(first) {
    this.gameData.first = first;
}

BaseSession.prototype.takeDamage = function(damage, emitDelay) {
    if (damage > 0) {
        this.gameData.hp -= damage;
        if (this.gameData.hp < 0) {
            this.gameData.hp = 0;
        }
    }
    g.logger.debug('u[%d] take damage: %d, hp: %d', this.userID, damage, this.gameData.hp);
    if (0 < emitDelay) {
        this.setTimeout('take_damage', () => {
            this.game.emitInGame(OpCodes.PLAYER_TAKE_DAMAGE, this.userID, damage, this.gameData.hp);
        }, emitDelay);
    } 
    else {
        this.game.emitInGame(OpCodes.PLAYER_TAKE_DAMAGE, this.userID, damage, this.gameData.hp);        
    }    
    return this.gameData.hp > 0;
}

BaseSession.prototype.heal = function(heal, emitDelay) {
    if (heal > 0) {
        this.gameData.hp += heal;
    }
    g.logger.debug('u[%d] heal: %d, hp: %d', this.userID, heal, this.gameData.hp);
    if (0 < emitDelay) {
        this.setTimeout('heal', () => {
            this.game.emitInGame(OpCodes.PLAYER_HEAL, this.userID, heal, this.gameData.hp);        
        }, emitDelay);
    }
    else {
        this.game.emitInGame(OpCodes.PLAYER_HEAL, this.userID, heal, this.gameData.hp);        
    }    
}

BaseSession.prototype.getCurrentCard = function() {
    return CardTemplateManager.instance.getCardTemplate(this.gameData.currentCardTemplateID);
}
//>

//< interfaces for game.js
BaseSession.prototype.pickCard = function(cardIndex) {
    this.gameData.currentCardTemplateID = this.gameData.cardList[cardIndex];
    this.gameData.cardList.splice(cardIndex, 1);
    this.onPickCard(cardIndex);
    this.emit('pick card', this.gameData.currentCardTemplateID);
}

BaseSession.prototype.startTurn = function() {
    this.gameData.currentCardTemplateID = '';
    this.onStartTurn(); 
}

BaseSession.prototype.send = function() {
}
//>
//< interface for sub class
BaseSession.prototype.getName = function() {
    console.error('It MUST be implemented!');
}

BaseSession.prototype.isRemovable = function() {
    return false;
}

BaseSession.prototype.onEnterState = function() {
}

BaseSession.prototype.onExitState = function() {
}

BaseSession.prototype.onPickCard = function(cardIndex) {
}

BaseSession.prototype.onStartTurn = function() {
}
//>

module.exports = {
    BaseSession: BaseSession
}