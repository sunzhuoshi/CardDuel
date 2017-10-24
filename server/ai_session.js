var g = require('./global.js');

var util = require('util');

var common = require('./common.js');
var PlayerState = require('./common.js').PlayerState;
var BaseSession = require('./base_session.js').BaseSession;
var config = require('./config.js');

function AISession(userID) {
    BaseSession.apply(this, arguments);
    this.setReady(true, true);
}

util.inherits(AISession, BaseSession);

AISession.prototype._joinRoom = function(room) {
    if (this.room) {
        this._leaveRoom();            
    }
    room.addSession(this, (result, roomIdOrMsg) => {
        g.logger.info('a[%d] join room[%d], result: %s, roomIdOrMsg: %s', this.userID, room.id, result, roomIdOrMsg);
        if (result) {
            this.room = room;
            this.changeState(PlayerState.STATE_ROOM);
        }
    });
};

AISession.prototype._leaveRoom = function() {
    if (this.room) {
        var room = this.room;
        g.logger.info('a[%d] leave room, roomID: %s', this.userID, room.id);            
        room.removeSession(this);            
        this.room = null;
        this.changeState(PlayerState.STATE_IDLE);
    }
};

//< intefaces for sub class
AISession.prototype.getName = function() {
    return 'AI' + Math.abs(this.userID);
}

AISession.prototype.isRemovable = function() {
    return true;
}    

AISession.prototype.onEnterState = function() {
    switch (this.state) {
        case PlayerState.STATE_ROOM:
            this.setReady(true);
            break;
    }
}

AISession.prototype.onExitState = function() {
}

AISession.prototype.onPickCard = function(cardIndex) {
}

AISession.prototype.onTakeDamage = function(damage, emitDelay) {
}

AISession.prototype.onHeal = function(heal, emitDelay) {
}

AISession.prototype.onStartTurn = function() {
    this.setTimeout('ai_pick_card', () => {
        // TODO: pick card base MC        
        //this.pickCard(Math.floor(Math.random() * this.gameData.cardList.length));
        this.pickCard(0);
    }, config.Settings.AI_PICK_CARD_DELAY);
}
//>


module.exports = {
    AISession: AISession
}