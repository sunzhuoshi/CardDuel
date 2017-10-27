cc.Class({
    extends: cc.Component,

    ctor: function() {
        this._startTime = null;
        this._countdown = 0;
    },

    properties: {
        timerLabel: {
            default: null,
            type: cc.Label
        }
    },


    setCountdown: function(countdownInseconds) {
        this.node.active = true;
        this._startTime = new Date().getTime();
        this._countdown = countdownInseconds;
    },

    // use this for initialization
    onLoad: function () {
        this._timerLabelInitFontSize = this.timerLabel.fontSize;
    },

    // called every frame, uncomment this function to activate update callback    
    update: function(dt) {
        if (this._startTime) {
            var seconds = this._countdown - 1 - Math.floor((new Date().getTime() - this._startTime) / 1000);
            if (seconds > 0) {
                this.timerLabel.string = seconds;
            }
            else if (seconds === 0) {
                if (this.timerLabel.string == '1') {
                    this.timerLabel.fontSize = this._timerLabelInitFontSize / 2;                
                    this.timerLabel.string = 'GAME START!';    
                }
            }
            else {
                this.node.active = false;                                
                this.timerLabel.fontSize = this._timerLabelInitFontSize;                
            }
        }

    }
});
