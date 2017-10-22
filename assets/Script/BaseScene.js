var MessagePrefab = require('MessagePrefab');

cc.Class({
    extends: cc.Component,

    ctor: function() {
        this.socketEventListeners = [];
    },

    properties: {
        messagePrefab: {
            default: null,
            type: MessagePrefab
        }        
    },

    addSocketEventListener: function(event, listener) {
        if ('string' !== typeof event || 'function' !== typeof listener) {
            console.error('invalid socket event listener, event: %s, handler: %s', event, listener);            
        }
        else {
            this.socketEventListeners.push([event, listener]);            
        }
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
