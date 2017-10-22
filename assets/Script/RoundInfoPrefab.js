cc.Class({
    extends: cc.Component,

    properties: {
        captionLabel: {
            default: null,
            type: cc.Label
        },

        valueLabel: {
            default: null,
            type: cc.Label
        }
    },

    showRound: function(round) {
        this.node.active = true;
        if (round != this.valueLabel.string) {
            this._startTime = new Date().getTime();                    
        }
        this.valueLabel.string = round;
    },

    // use this for initialization
    onLoad: function () {
        this._startTime = 0;
        this._originalFontSize = this.valueLabel.fontSize;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var now = new Date().getTime();
        if (this._startTime && now - this._startTime < 1000) {
            this.valueLabel.fontSize = this._originalFontSize * 2;
        }
        else {
            this.valueLabel.fontSize = this._originalFontSize;
        }
    },
});
