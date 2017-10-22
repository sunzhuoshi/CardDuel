var g = require('./global.js');

var CardType = {
    TYPE_ATTACK:        'Attack',
    TYPE_DEFENCE:       'Defence',
    TYPE_LIFE_STEAL:    'LifeSteal',
    TYPE_VOID_DEFENCE:  'VoidDefence',
    TYPE_DODGE:         'Dodge',
    TYPE_UNKNOWN:       'Unknown',
};

var CardTemplateDefineList = [
    ['AT1', CardType.TYPE_ATTACK, 		    1],
    ['AT2', CardType.TYPE_ATTACK, 		    2],
    ['AT5', CardType.TYPE_ATTACK, 		    5],
    ['DF1', CardType.TYPE_DEFENCE,		    1],
    ['DF2', CardType.TYPE_DEFENCE,   	    2],
    ['DF5', CardType.TYPE_DEFENCE,   	    5],
    ['DG', 	CardType.TYPE_DODGE,    	    0],
    ['VD1',	CardType.TYPE_VOID_DEFENCE,     1],
    ['LS1', CardType.TYPE_LIFE_STEAL, 		1],
    ['UK',  CardType.TYPE_UNKNOWN,          0],
];

var PlayerCardDefineList = [
    ['AT1', 1],
    ['AT2', 1],
    ['AT5', 1],
    ['DF1', 1],
    ['DF2', 1],
    ['DF5', 1],
    ['DG',  1],
    ['VD1', 1],
    ['LS1', 1]    
];


var Settings = {
    PLAYER_INIT_HP:                         10,
    PLAYER_PICK_CARD_TIMEOUT:               999 * 1000, // ms
    GAME_START_COUNTDOWN:                   3, // seconds 
    GAME_NEXT_ROUND_DELAY:                  2 * 1000, // ms
    GAME_END_DELAY:                         2 * 1000, // ms
};

var CardVersus = function(firstPlayer, secondPlayer) {
    var firstCard = firstPlayer.getCurrentCard();
    var secondCard = secondPlayer.getCurrentCard();

    g.logger.debug('u[%d]%s vs. u[%d]%s', firstPlayer.userID, firstCard.id, secondPlayer.userID, secondCard.id);

    if (!firstCard || !secondCard) {
        g.logger.warn('void card, user1: %d, user2: %d', firstPlayer.userID, secondPlayer.userID);
        return;
    }

    if (firstCard.type == CardType.TYPE_DOGUE || secondCard.type == CardType.TYPE_DOGUE) {
        firstPlayer.setFirst(false);
        secondPlayer.setFirst(false);
        return;
    }
    switch (firstCard.type) {
        case CardType.TYPE_LIFE_STEAL:
            switch (secondCard.type) {
                case CardType.TYPE_LIFE_STEAL: {
                    let alive = secondPlayer.takeDamage(firstCard.value);
                    firstPlayer.heal(firstCard.value);
                    if (alive) {
                        firstPlayer.takeDamage(secondCard.value);
                        secondPlayer.heal(secondCard.value);
                    }
                    break;
                }                
                case CardType.TYPE_ATTACK: {
                    let alive = secondPlayer.takeDamage(firstCard.value);
                    firstPlayer.heal(firstCard.value);
                    if (alive) {
                        firstPlayer.takeDamage(secondCard.value);
                    }							
                    break;
                }
                case CardType.TYPE_DEFENCE:
                    secondPlayer.takeDamage(firstCard.value - secondCard.value);
                    firstPlayer.heal(firstCard.value);
                    break;
                case CardType.TYPE_VOID_DEFENCE: {
                    let alive = secondPlayer.takeDamage(firstCard.value);
                    firstPlayer.heal(firstCard.value);
                    if (alive) {
                        firstPlayer.takeDamage(secondCard.value);
                    }						
                    break;
                }
                default:
                    break;
            }
            break;
        case CardType.TYPE_ATTACK:
            switch (secondCard.type) {
                case CardType.TYPE_LIFE_STEAL:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                        secondPlayer.heal(secondCard.value);
                    }
                    break;
                case CardType.TYPE_ATTACK:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                    }
                    break;
                case CardType.TYPE_DEFENCE: {
                    let damage = firstCard.value - secondCard.value;
                    secondPlayer.takeDamage(damage);                    
                    if (damage <= 0) {
                        firstPlayer.setFirst(false);
                        secondPlayer.setFirst(true);
                    }
                    break;
                }
                case CardType.TYPE_VOID_DEFENCE:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                    }					
                    break;
                default:
                    break;
            }
            break;
        case CardType.TYPE_DEFENCE:
            switch (secondCard.type) {
                case CardType.TYPE_LIFE_STEAL:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                        secondPlayer.heal(secondCard.value);
                    }
                    break;
                case CardType.TYPE_ATTACK: {
                    let damage = secondCard.value - firstCard.value;
                    firstPlayer.takeDamage(damage);                    
                    if (damage) {
                        firstPlayer.setFirst(false);
                        secondPlayer.setFirst(true);
                    }
                    break;
                }
                case CardType.TYPE_DEFENCE:
                    break;
                case CardType.TYPE_VOID_DEFENCE:
                    firstPlayer.takeDamage(secondCard.value);
                    secondPlayer.setFirst(true);
                    firstPlayer.setFirst(false);
                    break;
                default:
                    break;
            }			
            break;
        case CardType.TYPE_VOID_DEFENCE:
            switch (secondCard.type) {
                case CardType.TYPE_LIFE_STEAL:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                        secondPlayer.heal(secondCard.value);
                    }
                    break;
                case CardType.TYPE_ATTACK:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                    }
                    break;
                case CardType.TYPE_DEFENCE:
                    secondPlayer.takeDamage(firstCard.value);
                    break;
                case CardType.TYPE_VOID_DEFENCE:
                    if (secondPlayer.takeDamage(firstCard.value)) {
                        firstPlayer.takeDamage(secondCard.value);
                    }					
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    } 
};

module.exports = {
    CardType: CardType,
    CardTemplateDefineList: CardTemplateDefineList,
    PlayerCardDefineList: PlayerCardDefineList,
    CardVersus: CardVersus,
    Settings: Settings
};

