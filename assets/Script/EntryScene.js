var BaseScene = require('BaseScene');

cc.Class({
    extends: BaseScene,

    ctor: function() {
        this.socketEventListeners = [
            [OpCodes.CREATE_ROOM, this.onCreateRoomResponse.bind(this)],
            [OpCodes.JOIN_ROOM, this.onJoinRoomResponse.bind(this)],
            [OpCodes.QUICK_MATCH, this.onQuickMatchResponse.bind(this)],
        ]
    },

    properties: {
        quickMatchButton: {
            default: null,
            type: cc.Button
        },
        hostGameButton: {
            default: null,
            type: cc.Button
        }
    },

    // use this for initialization
    onLoad: function () {
        client.connect();
        this._super();
        cc.director.preloadScene('GameScene');  // load game scene to save time to transit
        this.quickMatchButton.node.on('click', this.onQuickMatchButtonClick, this);
        this.hostGameButton.node.on('click', this.onHostGameButtonClick, this);
    },

    onDestroy: function() {
        this._super();
    },

    onQuickMatchButtonClick: function() {
        client.socket.emit(OpCodes.QUICK_MATCH);
    },

    onHostGameButtonClick: function() {
        client.socket.emit(OpCodes.CREATE_ROOM);
    },

    onCreateRoomResponse: function(result, roomIdOrMsg) {
        if (!result) {
            // TODO: show error message
        }
    },

    onJoinRoomResponse: function(result, roomIdOrMsg) {
        if (result) {
            cc.director.loadScene('GameScene');            
        }
        else {
            // TODO: show error message
        }
    },

    onQuickMatchResponse: function(result, roomIdOrMsg) {
        if (result) {

        }
        else {
            console.log('quick match result: %s, reason: %s', result, roomIdOrMsg);
            // TODO: show error message
        }
    }

});
