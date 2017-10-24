var g = require('./global.js');

var util = require('util');

var common = require('./common.js');
var PlayerState = require('./common.js').PlayerState;
var BaseSession = require('./base_session.js').BaseSession;
var config = require('./config.js');
var ai = require('./ai.js');

function AISession(userID) {
    BaseSession.apply(this, arguments);
    this.setReady(true, true);
}

util.inherits(AISession, BaseSession);

AISession.prototype.joinRoom = function(room) {
    room.addSession(this, (result) => {
        if (result) {
            this.room = room;
        }
    });
};

AISession.prototype.leaveRoom = function() {
    if (this.room) {
        this.room.removeSession(this);            
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
        var startTime = new Date().getTime();
        var oppSession = this.getOppSession();        
        let options = ai.AI.getOptions(
            this.gameData.hp, this.gameData.cardList, this.gameData.first,
            oppSession.gameData.hp, oppSession.gameData.cardList, oppSession.gameData.first,
            100
        );
        g.logger.debug('options: %s', JSON.stringify(options));
        var pick = options[Math.floor(Math.random() * options.length * 0.3)];
        g.logger.debug('pick, index: %d, win: %d', pick.index, pick.win);
        this.pickCard(pick.index);
    }, config.Settings.AI_PICK_CARD_DELAY);
}
//>


module.exports = {
    AISession: AISession
}