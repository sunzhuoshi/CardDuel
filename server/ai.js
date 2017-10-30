if ('undefined' !== typeof module) {
    var config = require('./config.js');
    var card = require('./card.js');
    var CardVersus = config.CardVersus;
    var Settings = config.Settings;
    
    var CardTemplateIdToObject = function(id) {
        return card.CardTemplateManager.instance.getCardTemplate(id);
    }
}
else {
    var CardTemplateIdToObject = function(id) {
        var ret = null;
        var el = CardTemplateDefineList.find((el) => {
            return el[0] === id;
        });
        if (el) {
            ret = {
                id: id,
                type: el[1],
                value: el[2]
            }
        }
        return ret;
    }
}

var AITestPlayer = function(hp, cards, first) {    
    this.first = first;
    this.cards = cards.slice();
    this.pickedCard = '';
    this.hp = hp;
}
//< interfaces for config.js
AITestPlayer.prototype.setFirst = function(first) {
    this.first = first;
    return this;
}

AITestPlayer.prototype.takeDamage = function(damage, emitDelay) {
    if (damage > 0) {
        this.hp -= damage;
        if (this.hp < 0) {
            this.hp = 0;
        }
    }
    return this.hp > 0;
}

AITestPlayer.prototype.getCurrentCard = function() {
    if (this.pickedCard.length > 0) {
        return CardTemplateIdToObject(this.pickedCard);
    }
    return null;
}

AITestPlayer.prototype.heal = function(heal, emitDelay) {
    if (heal > 0) {
        this.hp += heal;
    }
}
//>

AITestPlayer.prototype.pickCard = function(cardIndex) {
    if (0 === this.pickedCard.length) {
        this.pickedCard = this.cards[cardIndex];
        this.cards.splice(cardIndex, 1);    
    }
    return this;
}

AITestPlayer.prototype.randomPickCard = function() {
    this.pickCard(Math.floor(Math.random() * this.cards.length));
}

AITestPlayer.prototype.clone = function() {
    var ret = JSON.parse(JSON.stringify(this));
    ret.__proto__ = AITestPlayer.prototype;
    return ret;
}

var AI = {
    getOptions: function(selfHP, selfCards, selfFirst, oppHP, oppCards, oppFirst, episodes) {
        var options = new Array(selfCards.length);
        var playouts = [];
        for (var i=0; i<selfCards.length; ++i) {
            options[i] = {
                win: 0,
                lose: 0,
                draw: 0,
                index: i,                
            };
            var playout = [
                new AITestPlayer(selfHP, selfCards, selfFirst),
                new AITestPlayer(oppHP, oppCards, oppFirst)
            ];
            playout[0].pickCard(i);
            playouts[i] = playout;

            for (var j=0; j<episodes; j++) {
                options[i][this.playEpisode(playout, true)] ++;
            }
        }
        options.forEach(function(el) {
            for (var key in el) {
                if (key !== 'index') {
                    el[key] = (el[key] * 100 / episodes).toFixed(2);                    
                }
            }
        });
        return options.sort(function(a, b) {
            return a.win < b.win;
        });
    },

    _ifGameEnds: function(playout) {
        return playout.some((player) => {
            return player.hp === 0 || player.cards.length === 0;
        })
    },

    _getResult: function(playout) {
        if (playout[0].hp > playout[1].hp) {
            return 'win';
        }
        else if (playout[0].hp < playout[1].hp) {
            return 'lose';
        }
        else {
            return 'draw';
        }
    },

    _updateFirst: function(playout) {
        playout.firstPlayer = playout.find((player) => {
            return player.first;
        });
        if (playout.firstPlayer) {
            playout.secondPlayer = playout.find((player) => {
                return !player.first;
            })
        }
        else {
            let firstIndex = Math.random() > 0.5? 1: 0;
            let secondIndex = (firstIndex + 1) % 2;
            playout.firstPlayer = playout[firstIndex].setFirst(true);
            playout.secondPlayer = playout[secondIndex].setFirst(false);
        }
    },
    
    playEpisode: function(playout, ifClone) {
        var workPlayout = playout;
        if (ifClone) {
            workPlayout = [
                playout[0].clone(),
                playout[1].clone()
            ];
        }
        while (!this._ifGameEnds(workPlayout)) {
            workPlayout.forEach((player) => {
                if (0 === player.pickedCard.length) {
                    player.randomPickCard();
                }
            });                
            this._updateFirst(workPlayout);
            CardVersus(workPlayout.firstPlayer, workPlayout.secondPlayer);
            workPlayout.forEach((player) => {
                player.pickedCard = '';
            });              
        }
        return this._getResult(workPlayout);
    },

    getRates: function(playout, episodes) {
        var ret = {
            'win': 0,
            'lose': 0,
            'draw': 0
        };
        for (var i=0; i<episodes; ++i) {
            ret[this.playEpisode(playout, true)] ++;
        }
        for (var key in result) {
            ret[key] = (result[key] / episodes).toFixed(2);
        }
        return ret;
    }
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
        AI: AI
    };
}
