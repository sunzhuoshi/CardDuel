cc.Class({
    extends: cc.Component,

    properties: {
        winChanceLabel: {
            default: null,
            type: cc.Label
        },
    },

    ctor: function() {
        this._cardTemplateID = '';
    },

    showWinChance: function(winChance) {
        this.winChanceLabel.node.active = true;
        this.winChanceLabel.string = winChance;    
    },

    showBack: function() {
        this.showCardTemplateID('UK');
    },

    showCardTemplateID: function(cardTemplateID) {
        var url = '';
        var type = cardTemplateID.substr(0, 2);
        var nameMap = {
            'AT': '_attack_',
            'DF': '_defence_',
            'DG': '_dodge',
            'VD': '_voiddefence_',
            'LS': '_lifesteal_',
            'UK': '_back'
        }
        var typePart = nameMap[type];
        if (typePart) {
            var value = parseInt(cardTemplateID.substr(2, 2));
            var valuePart = '';
            
            if (value >= 0) {
                valuePart = ('0' + value).slice(-2);                
            }
            url = 'resources/Texture/poker' + typePart + valuePart + '.png';
            this.node.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(cc.url.raw(url));
            this.node.active = true;            
        }
    },

    // use this for initialization
    onLoad: function () {
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
    },
});
