var AvatarPrefab = require('AvatarPrefab');
var RoomInfoPrefab = require('RoomInfoPrefab');
var RoundInfoPrefab = require('RoundInfoPrefab');
var CardPrefab = require('CardPrefab');
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

        oppPickedCardPrefab: {
            default: null,
            type: CardPrefab
        },

        gameResultLabel: {
            default: null,
            type: cc.Label
        }
    },

    ctor: function() {
        this.addSocketEventListener(OpCodes.ROOM_DATA, this.onRoomDataResponse.bind(this));
        this.addSocketEventListener(OpCodes.LEAVE_ROOM, this.onLeaveRoomResponse.bind(this));
        this.addSocketEventListener(OpCodes.PLAYER_CHANGE_READY, this.onPlayerChangeReadyResponse.bind(this));
        this.addSocketEventListener(OpCodes.GAME_WILL_START, this.onGameWillStartNotification.bind(this));
        this.addSocketEventListener(OpCodes.GAME_START, this.onGameStartNotification.bind(this));
        this.addSocketEventListener(OpCodes.GAME_DATA, this.onGameDataNotification.bind(this));
        this.addSocketEventListener(OpCodes.PLAYER_TURN, this.onPlayerTurnNotification.bind(this));
        this.addSocketEventListener(OpCodes.PLAYER_PICK_CARD, this.onPlayerPickCardResponse.bind(this));
        this.addSocketEventListener(OpCodes.GAME_DATA_FIRST, this.onGameDataFirstNotification.bind(this));
        this.addSocketEventListener(OpCodes.GAME_DATA_PICKED, this.onGameDataPickedNotification.bind(this));
        this.addSocketEventListener(OpCodes.GAME_CARD_VERSUS, this.onGameCardVersusNotification.bind(this));
        this.addSocketEventListener(OpCodes.GAME_ROUND, this.onGameRoundNotification.bind(this));     
        this.addSocketEventListener(OpCodes.PLAYER_TAKE_DAMAGE, this.onPlayerTakeDamageNotification.bind(this));                                                                   
        this.addSocketEventListener(OpCodes.GAME_END, this.onGameEndNotification.bind(this));                                                                           
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

                this.roomInfoPrefab.showRoomID(roomData.id);
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
                this.selfFirstLabel.node.active = player.data.first;
            }
            else {
                this.oppFirstLabel.node.active = player.data.first;
            }
            avatarPrefab.updateUI(player);
            cardsPrefab.updateUI(player.data.cardList);
        });
        this.roundInfoPrefab.showRound(gameData.round);
        this.roundInfoPrefab.node.active = true;
        this.oppPickedCardPrefab.node.active = false;
    },

    onPlayerTurnNotification: function() {
        this.selfCardsPrefab.locked = false;
    },

    onPlayerPickCardResponse: function(result, cardIndex, cardTemplateID) {
        if (!result) {
            // TODO: move the picked card back
        }
    },

    onGameDataNotification: function(gameData) {
        this._updateUIInGame(gameData);
    },

    onGameDataFirstNotification: function(gameFirstData) {
        gameFirstData.forEach((el) => {
            if (el.id === client.userID) {
                this.selfFirstLabel.node.active = el.first;
            }
            else {
                this.oppFirstLabel.node.active = el.first;
            }
        });
        this.selfCardsPrefab.locked = false;
    },

    onGameDataPickedNotification: function(gamePickedData) {
        gamePickedData.forEach((el) => {
            if (el.id !== client.userID) {
                if (el.picked) {
                    this.oppPickedCardPrefab.showBack();
                    this.oppCardsPrefab.updateUI(el.cardCount);                    
                }
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

    onGameCardVersusNotification: function(dataList) {
        dataList.forEach((data) => {
            if (data.userID !== client.userID) {
                this.oppPickedCardPrefab.showCardTemplateID(data.cardTemplateID);
            }
        });
    },

    onGameRoundNotification: function(round) {
        this.roundInfoPrefab.valueLabel.string = round;
    },

    onPlayerTakeDamageNotification: function(userID, damage, hp) {
        if (damage < 0) {
            damage = 0;
        }
        if (userID === client.userID) {
            this.selfAvatarPrefab.updateHP(hp, -damage);
        }
        else {
            this.oppAvatarPrefab.updateHP(hp, -damage);
        }
    },

    onPlayerHealNotification: function(userID, heal, hp) {
        if (heal < 0) {
            heal = 0;
        }

        if (userID === client.userID) {
            this.selfAvatarPrefab.updateHP(hp, heal);
        }
        else {
            this.oppAvatarPrefab.updateHP(hp, heal);
        }
    },

    onGameEndNotification: function(winnerUserID) {
        if (0 === winnerUserID) {
            this.messagePrefab.showMessage('DRAW GAME', 1, 64);           
        }
        else if (winnerUserID === client.userID) {
            this.messagePrefab.showMessage('YOU WIN!', 1, 64);                       
        }
        else {
            this.messagePrefab.showMessage('YOU LOSE...', 1, 64);           
        }
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
