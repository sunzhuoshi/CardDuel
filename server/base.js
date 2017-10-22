var events = require('events');
var util = require('util');

var EventEmitterWithTimer = function() {
    events.EventEmitter.apply(this, arguments);
    this._timers = {};
};

util.inherits(EventEmitterWithTimer, events.EventEmitter);

EventEmitterWithTimer.prototype.setTimeout = function(timerName, func, ms) {
    this.clearTimeout(timerName);
    this._timers[timerName] = setTimeout(func, ms);    
};

EventEmitterWithTimer.prototype.clearTimeout = function(timerName) {
    var timer = this._timers[timerName];
    if (timer) {
        clearTimeout(timer);
        delete this._timers[timerName];
    }
};

EventEmitterWithTimer.prototype.clearAllTimeouts = function() {
    for (var name in Object.keys(this._timers)) {
        this.clearTimeout(name);
    }
};

module.exports = {
    EventEmitterWithTimer: EventEmitterWithTimer,
}
