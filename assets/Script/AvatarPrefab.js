var PositionType = cc.Enum({
    Top: 1,
    Bottom: 2
});

cc.Class({
    extends: cc.Component,

    ctor: function() {
    },

    properties: {
        avatarSprite: {
            default: null,
            type: cc.Sprite
        },

        nameLabel: {
            default: null,
            type: cc.Label
        },

        readyLabel: {
            default: null,
            type: cc.Label
        },

        heartSprite: {
            default: null,
            type: cc.Sprite
        },

        hpLabel: {
            default: null,
            type: cc.Label
        },

        readyLabel: {
            default: null,
            type: cc.Label
        },

        readyLabelPosition: {
            default: 1, 
            type: PositionType,
        }
    },

    setRoomMode: function() {
        this.heartSprite.node.active = false;
    },

    setToGameMode: function() {
        this.heartSprite.node.active = true;
        this.readyLabel.node.active = false;
    },

    updateUI: function(player) {
        this.nameLabel.string = 'Player' + player.id;
        if (undefined !== player.data.hp) {
            this.heartSprite.node.active = true;
            this.hpLabel.string = player.data.hp;
        }
        if (undefined !== player.data.ready) {
            this.readyLabel.node.active = player.data.ready;            
        }
    },

    onLoad: function() {
        this.readyLabel.node.y = (3 - this.readyLabelPosition * 2) * Math.abs(this.readyLabel.node.y);                
    }
});
