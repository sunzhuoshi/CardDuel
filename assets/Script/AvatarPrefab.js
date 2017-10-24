var PositionType = cc.Enum({
    Top: 1,
    Bottom: 2
});

cc.Class({
    extends: cc.Component,

    ctor: function() {
        this._updateHpStartTime = 0;
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

        deltaHpLabel: {
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

    updateHP: function(HP, deltaHP) {
        this.hpLabel.string = HP;
        if (deltaHP < 0) {
            this.deltaHpLabel.node.active = true;
            this.deltaHpLabel.string = deltaHP;
            this.deltaHpLabel.node.color = cc.Color.RED;
            this._updateHpStartTime = new Date().getTime();
        }
        else if (deltaHP > 0) {
            this.deltaHpLabel.node.active = true;            
            this.deltaHpLabel.string = '+' + deltaHP;
            this.deltaHpLabel.node.color = cc.Color.GREEN;
            this._updateHpStartTime = new Date().getTime();            
        }
    },

    setRoomMode: function() {
        this.heartSprite.node.active = false;
    },

    setGameMode: function() {
        this.heartSprite.node.active = true;
        this.readyLabel.node.active = false;
    },

    updateUI: function(player) {
        this.nameLabel.string =  player.name;
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
    },

    update: function(dt) {
        var now = new Date().getTime();
        if (this._updateHpStartTime && now - this._updateHpStartTime > 1000) {
            this.deltaHpLabel.node.active = false;
            this._updateHpStartTime = 0;
        }
    },
});
