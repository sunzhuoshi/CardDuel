cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    ctor: function() {
        this._cardTemplateID = '';
    },

    setCardTemplateID: function(cardTemplateID) {
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
        }
    },

    // use this for initialization
    onLoad: function () {
        //this.setCardTemplateID('AT9');
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
