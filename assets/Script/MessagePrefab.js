cc.Class({
    extends: cc.Component,

    properties: {
    },

    ctor: function() {
        this._startTime = 0;
        this._durationInSeconds = 0;
        this._originalFontSize = 0;
    },

    showMessage: function(message, durationInSeconds, fontSize) {
        this.node.active = true;
        this.node.getComponent(cc.Label).string = message;
        if (0 < fontSize) {
            this.node.getComponent(cc.Label).fontSize = fontSize;
        }
        this._startTime = new Date().getTime();
        this._durationInSeconds = durationInSeconds;
    },

    // use this for initialization
    onLoad: function () {
        this._originalFontSize = this.node.getComponent(cc.Label).fontSize;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var now = new Date().getTime();
        if (0 === this._startTime || now - this._startTime > this._durationInSeconds * 1000) {
            this.node.active = false;
        }
    },
});
