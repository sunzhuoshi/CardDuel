var AvatarPrefab = require('AvatarPrefab');
var RoomInfoPrefab = require('RoomInfoPrefab');
var RoundInfoPrefab = require('RoundInfoPrefab');
var CardsPrefab = require('CardsPrefab');
var GameStartCountdownPrefab = require('GameStartCountdownPrefab');

var BaseScene = require('BaseScene');

cc.Class({
    extends: BaseScene,

    properties: {
        getReadyButton: {
            default: null,
            type: cc.Button
        },

        leaveButton: {
            default: null,
            type: cc.Button
        },

        oppAvatarPrefab: {
            default: null,
            type: AvatarPrefab
        },

        selfAvatarPrefab: {
            default: null,
            type: AvatarPrefab
        },

        oppFirstLabel: {
            default: null,
            type: cc.Label
        },

        selfFirstLabel: {
            default: null,
            type: cc.Label
        },
        
        roundInfoPrefab: {
            default: null,
            type: RoundInfoPrefab
        },

        roomInfoPrefab: {
            default: null,
            type: RoomInfoPrefab
        },

        oppCardsPrefab: {
            default: null,
            type: CardsPrefab
        },

        selfCardsPrefab: {
            default: null,
            type: CardsPrefab
        },

        gameStartCountdownPrefab: {
            default: null,
            type: GameStartCountdownPrefab
        },

        oppPickedCardSprite: {
            default: null,
            type: cc.Sprite
        },

        selfPickedCardSprite: {
            default: null,
            type: cc.Sprite
        }
    },

    ctor: function() {
        this.socketEventListeners = [
            [OpCodes.ROOM_DATA, this.onRoomDataResponse.bind(this)],
            [OpCodes.LEAVE_ROOM, this.onLeaveRoomResponse.bind(this)],
            [OpCodes.PLAYER_CHANGE_READY, this.onPlayerChangeReadyResponse.bind(this)],
            [OpCodes.GAME_WILL_START, this.onGameWillStartNotification.bind(this)],
            [OpCodes.GAME_START, this.onGameStartNotification.bind(this)],
            [OpCodes.GAME_DATA, this.onGameDataNotification.bind(this)],
            [OpCodes.PLAYER_TURN, this.onPlayerTurnNotification.bind(this)],
            [OpCodes.GAME_DATA_FIRST, this.onGameDataFirstNotification.bind(this)],
            [OpCodes.GAME_DATA_PICKED, this.onGameDataPickedNotification.bind(this)],
        ];
    },

    // use this for initialization
    onLoad: function () {
        this._super();
        this._updateUIInRoom(client.roomData);
        this.getReadyButton.node.on('click', this.onGetReadyButtonClick, this);
        this.leaveButton.node.on('click', this.onLeaveRoomButtonClick, this);
        this.selfCardsPrefab.node.on('pick card', this.onPickCard, this);
    },

    onDestroy: function() {
        this._super();
    },

    _updateUIInRoom: function(roomData) {
        if (roomData) {
            if (roomData.state === RoomState.STATE_WAITING || roomData.state === RoomState.STATE_FULL) {
                this.selfAvatarPrefab.setRoomMode();
                this.oppAvatarPrefab.setRoomMode();
              
                this.getReadyButton.node.active = true;
                this.leaveButton.node.active = true;

                this.selfAvatarPrefab.node.active = true;
                this.selfAvatarPrefab.updateUI(client.getSelfPlayerData(roomData));                                   
                if (roomData.state === RoomState.STATE_WAITING) {
                    this.oppAvatarPrefab.node.active = false;
                }
                else if (roomData.state === RoomState.STATE_FULL) {
                    this.oppAvatarPrefab.node.active = true;
                    this.oppAvatarPrefab.updateUI(client.getOppPlayerData(roomData));
                }

                this.selfCardsPrefab.node.active = false;
                this.oppCardsPrefab.node.active = false;

                this.selfFirstLabel.node.active = false;
                this.oppFirstLabel.node.active = false;

                this.roundInfoPrefab.node.active = false;
                this.roomInfoPrefab.valueLabel.string = roomData.id;
            }
        }
    },

    _updateUIInGame: function(gameData) {
        this.selfCardsPrefab.node.active = true;
        this.oppCardsPrefab.node.active = true;        
        gameData.players.forEach((player) => {
            let avatarPrefab = this.oppAvatarPrefab;
            let cardsPrefab = this.oppCardsPrefab;
            if (player.id === client.userID) {
                avatarPrefab = this.selfAvatarPrefab;
                cardsPrefab = this.selfCardsPrefab;
            }
            avatarPrefab.updateUI(player);
            cardsPrefab.updateUI(player.data.cardList);
        });
        this.roundInfoPrefab.valueLabel.string = gameData.round;
    },

    onPlayerTurnNotification: function() {
        console.log('onPlayerTurnNotification');
    },

    onGameDataNotification: function(gameData) {
        this._updateUIInGame(gameData);
    },

    onGameDataFirstNotification: function(gameFirstData) {
        gameFirstData.forEach((el) => {
            if (el.id === this.userID) {
                this.selfFirstLabel.node.active = el.first;
            }
            else {
                this.oppFirstLabel.node.active = el.first;
            }
        });
    },

    onGameDataPickedNotification: function(gamePickedData) {
        gamePickedData.forEach((el) => {
            if (el.id !== this.userID) {
                //this.oppPickedCardPrefeb
            }
        });
    },

    onRoomDataResponse: function(result, dataOrMsg) {
        if (result) {
            this._updateUIInRoom(dataOrMsg);
        }
    },

    onLeaveRoomResponse: function(result) {
        if (result) {
            cc.director.loadScene('EntryScene');            
        }
    },

    onPlayerChangeReadyResponse: function(result, ready) {
        if (result) {
            this.selfAvatarPrefab.readyLabel.node.active = ready;
        }
    },

    onGameWillStartNotification: function(countdown) {
        this.getReadyButton.node.active = false;
        this.leaveButton.node.active = false;
        this.selfAvatarPrefab.readyLabel.node.active = false;
        this.oppAvatarPrefab.readyLabel.node.active = false;
        this.gameStartCountdownPrefab.setCountdown(countdown);
    },

    onGameStartNotification: function() {
    },

    onGetReadyButtonClick: function() {
        client.socket.emit(OpCodes.PLAYER_CHANGE_READY, !client.getSelfPlayerData().data.ready);
    },

    onLeaveRoomButtonClick: function() {
        client.socket.emit(OpCodes.LEAVE_ROOM);
    },

    onPickCard: function(event) {
        client.socket.emit(OpCodes.PLAYER_PICK_CARD, event.detail);
    }
});
