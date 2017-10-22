var CardPrefab = require('CardPrefab');

cc.Class({
    extends: cc.Component,

    properties: {
        cardPrefabTemplate: {
            default: null,
            type: cc.Prefab
        },

        containerNode: {
            default: null,
            type: cc.Node
        },

        cardTemplateSprite: {
            default: null,
            type: cc.Sprite
        },

        dropTargetCollisionNode: {
            default: null,
            type: cc.Node
        },

        dropTargetPositionNode: {
            default: null,
            type: cc.Node
        },

        interactivable: {
            default: false
        },

        locked: {
            default: false
        },
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    ctor: function() {
        this._cardTemplateIdList = [];
        this._pickedIndex = -1;
    },

    // use this for initialization
    onLoad: function() {
        this._cardWidth = this.cardTemplateSprite.node.width;
        this.containerNode.removeAllChildren();
    },

    /*
    _getSpriteFrameName: function(cardTemplateID) {
        var ret = '';
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
            ret = 'resources/Texture/poker' + typePart + valuePart + '.png';
        }
        return ret;
    },
    */

    updateUI: function(cardTemplateIdList) {        
        this.containerNode.removeAllChildren();        
        this.cardTemplateIdList = cardTemplateIdList;
        
        var space = this.containerNode.width / cardTemplateIdList.length;
        var left = 0 - this.containerNode.width / 2 + this._cardWidth / 2;
        var index = 0;
        var self = this;
        this.cardTemplateIdList.forEach((cardTemplateID) => {
            /*
            var node = new cc.Node(cardTemplateID);
            var sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = new cc.SpriteFrame(cc.url.raw(this._getSpriteFrameName(cardTemplateID)));
            node.x = left;
            left += space;
            node.cardIndex = index ++;
            node.parent = this.containerNode;
            */
            var cardPrefab = cc.instantiate(this.cardPrefabTemplate);
            cardPrefab.getComponent('CardPrefab').setCardTemplateID(cardTemplateID);
            cardPrefab.x = left;
            left += space;
            cardPrefab.cardIndex = index ++;
            cardPrefab.parent = this.containerNode;

            if (this.interactivable) {
                var node = cardPrefab;
                node.onTouchStart = function(event) {
                    if (!event.getID() && !this.locked) {
                        console.log('touch start, index: ' + this.cardIndex);
                        self._pickedIndex = this.cardIndex;
                        this._startLocalVec = this.parent.convertTouchToNodeSpace(event);
                        if (!this._originalPosition) {
                            this._originalPosition = this.getPosition();                            
                        }
                        this._startPosition = this.getPosition();
                    }
                }
                node.onTouchMove = function(event) {
                    if (!event.getID() && !this.locked) {
                        if (this.cardIndex === self._pickedIndex) {
                            this.position = cc.pAdd(
                                this._startPosition,
                                cc.pSub(
                                    this.parent.convertTouchToNodeSpace(event), 
                                    this._startLocalVec
                                )
                            );
                        }    
                    }
                }
                node.onTouchEnd = function(event) {
                    if (!event.getID() && !this.locked) {
                        if (cc.Intersection.rectRect(
                            self.dropTargetCollisionNode.getBoundingBox(),
                            this.getBoundingBox())) {
                            this.position = self.dropTargetPositionNode.position;
                            this.locked = true;                            
                            self.node.emit('pick card', this.cardIndex);
                        }
                        else {
                            self._pickedIndex = -1;
                            this.position = this._originalPosition;
                        }
                    }
                }
                node.on(cc.Node.EventType.TOUCH_START, node.onTouchStart, node);
                node.on(cc.Node.EventType.TOUCH_MOVE, node.onTouchMove, node);
                node.on(cc.Node.EventType.TOUCH_END, node.onTouchEnd, node);    
            }
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
