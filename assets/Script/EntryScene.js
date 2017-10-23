var BaseScene = require('BaseScene');

cc.Class({
    extends: BaseScene,

    ctor: function() {
        this.addSocketEventListener(OpCodes.CREATE_ROOM, this.onCreateRoomResponse.bind(this));
        this.addSocketEventListener(OpCodes.JOIN_ROOM, this.onJoinRoomResponse.bind(this));
        this.addSocketEventListener(OpCodes.QUICK_MATCH, this.onQuickMatchResponse.bind(this));
    },

    properties: {
        quickMatchButton: {
            default: null,
            type: cc.Button
        },

        hostGameButton: {
            default: null,
            type: cc.Button
        },

        versionLabel: {
            default: null,
            type: cc.Label
        }
    },

    // use this for initialization
    onLoad: function () {
        client.connect();
        this._super();
        cc.director.preloadScene('GameScene');  // load game scene to save time to transit
        this.quickMatchButton.node.on('click', this.onQuickMatchButtonClick, this);
        this.hostGameButton.node.on('click', this.onHostGameButtonClick, this);
        this.versionLabel.string = client.version;
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, (event) => {
            if (client.socket.connected) {
                client.processloginCmd();
            }
            else {
                this.showMessage('NOT CONNECTED', 1);
            }
        });    
    },

    onDestroy: function() {
        this._super();
    },

    onQuickMatchButtonClick: function() {
        if (client.socket.connected) {
            client.socket.emit(OpCodes.QUICK_MATCH);            
        }
        else {
            this.messagePrefab.showMessage('NOT CONNECTED', 1);
        }
    },

    onHostGameButtonClick: function() {
        if (client.socket.connected) {
            client.socket.emit(OpCodes.CREATE_ROOM);            
        }
        else {
            this.messagePrefab.showMessage('NOT CONNECTED', 1);
        }
    },

    onCreateRoomResponse: function(result, roomIdOrMsg) {
        if (!result) {
            this.messagePrefab.showMessage(roomIdOrMsg);
        }
    },

    onJoinRoomResponse: function(result, roomIdOrMsg) {
        if (result) {
            cc.director.loadScene('GameScene');            
        }
        else {
            this.messagePrefab.showMessage(roomIdOrMsg, 2);            
        }
    },

    onQuickMatchResponse: function(result, roomIdOrMsg) {
        if (!result) {
            this.messagePrefab.showMessage(roomIdOrMsg, 2);
        }
    }

});
