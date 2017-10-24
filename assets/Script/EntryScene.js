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

        challengeAIButton: {
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
        this.challengeAIButton.node.on('click', this.onChallengeAIButtonClick, this);
        this.versionLabel.string = client.version;
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, (event) => {
            if (client.socket.connected) {
                client.processloginCmd();
            }
        });    
    },

    onDestroy: function() {
        this._super();
    },

    _emitPacket: function() {
        client.clearLoginCmd();
        if (client.socket.connected) {
            client.socket.emit.apply(client.socket, arguments);            
        }
        else {
            this.messagePrefab.showMessage('NOT CONNECTED', 1);
            client.socket.connect();
        }
    },

    onQuickMatchButtonClick: function() {
        this._emitPacket(OpCodes.QUICK_MATCH);
    },

    onHostGameButtonClick: function() {
        this._emitPacket(OpCodes.CREATE_ROOM);
    },

    onChallengeAIButtonClick: function() {
        this._emitPacket(OpCodes.CHALLENGE_AI);
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
    },
});
