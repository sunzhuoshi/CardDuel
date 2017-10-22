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

        showBack: {
            default: false
        },
    },

    ctor: function() {
        this._cardTemplateIdList = [];
        this._pickCardPrefab = null;
    },

    // use this for initialization
    onLoad: function() {
        this._cardWidth = this.cardTemplateSprite.node.width;
        this.containerNode.removeAllChildren();
    },

    updateUI: function(cardTemplateIdListOrLength) {
        var cardTemplateIdList = [];
        if ('number' === typeof cardTemplateIdListOrLength) {
            cardTemplateIdList = new Array(cardTemplateIdListOrLength);
            cardTemplateIdList.fill('UK');
        }
        else {
            cardTemplateIdList = cardTemplateIdListOrLength;
        }
        this.containerNode.removeAllChildren();  
        this.cardTemplateIdList = cardTemplateIdList;
        
        var space = this.containerNode.width / cardTemplateIdList.length;
        var left = 0 - this.containerNode.width / 2 + this._cardWidth / 2;
        var index = 0;
        var self = this;
        this.cardTemplateIdList.forEach((cardTemplateID) => {
            var cardPrefab = cc.instantiate(this.cardPrefabTemplate);
            if (this.showBack) {
                cardPrefab.getComponent('CardPrefab').showBack();
            }
            else {
                cardPrefab.getComponent('CardPrefab').showCardTemplateID(cardTemplateID);                
            }
            cardPrefab.x = left;
            left += space;
            cardPrefab.cardIndex = index ++;
            cardPrefab.parent = this.containerNode;

            if (this.interactivable) {
                var node = cardPrefab;
                node.onTouchStart = function(event) {
                    if (!event.getID() && !self.locked) {
                        console.log('touch start, index: ' + this.cardIndex);
                        self._pickCardPrefab = this;
                        this._startLocalVec = this.parent.convertTouchToNodeSpace(event);
                        if (!this._originalPosition) {
                            this._originalPosition = this.getPosition();                            
                        }
                        this._startPosition = this.getPosition();
                    }
                }
                node.onTouchMove = function(event) {
                    if (!event.getID() && !self.locked) {
                        if (this === self._pickCardPrefab) {
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
                    if (!event.getID() && !self.locked) {
                        if (cc.Intersection.rectRect(
                            self.dropTargetCollisionNode.getBoundingBox(),
                            this.getBoundingBox())) {
                            this.position = self.dropTargetPositionNode.position;
                            self.locked = true;                            
                            self.node.emit('pick card', this.cardIndex);
                        }
                        else {
                            self._pickCardPrefab = null;
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
});
