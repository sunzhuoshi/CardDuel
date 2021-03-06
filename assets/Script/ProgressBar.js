cc.Class({
    extends: cc.Component,

    properties: {
        backgroundNode: {
            default: null,
            type: cc.Node
        }
    },

    ctor: function() {
        this._startTime = 0;
        this._countdown = 0;
        this._progressBar = 0;
        this._lastWidth = 0;
    },

    // use this for initialization
    onLoad: function () {
        this._progressBar = this.node.getComponent(cc.ProgressBar);
    },

    setWidth: function(width) {
        var bar = this._progressBar.node.children[0];
        this._progressBar.totalLength = width;
        this._progressBar.node.width = width;
        bar.width = width;
        bar.x = -width / 2;        
    },

    countdown: function(seconds) {
        this.node.active = true;
        this._startTime = new Date().getTime();
        this._countdown = seconds;
    },

    stop: function() {
        this.node.active = false;
        this._startTime = 0;
        this._countdown = 0;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this._progressBar.node.active && this._startTime && this._countdown) {
            let width = Math.min(cc.director.getWinSize().width, this.backgroundNode.width);

            if (this._lastWidth !== width) {
                this.setWidth(width);
            }
            var progress = (Math.floor((new Date().getTime() - this._startTime) / 1000) / this._countdown);
            if (progress > 1) {
                this._progressBar.node.active = false;
                this._startTime = 0;
                this._countdown = 0;
            }   
            else {
                this._progressBar.progress = progress;
            }                     
        }
    },
});
