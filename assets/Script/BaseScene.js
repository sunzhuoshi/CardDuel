cc.Class({
    extends: cc.Component,

    ctor: function() {
        this.socketEventListeners = [];
    },

    properties: {
    },

    // use this for initialization
    onLoad: function () {
        this.socketEventListeners.forEach((pair) => {
            client.socket.on(pair[0], pair[1]);
        });    
    },

    onDestroy: function() {
        this.socketEventListeners.forEach((pair) => {
            client.socket.off(pair[0], pair[1]);
        });
    }
});
