var CardType = {
    TYPE_ATTACK:        'Attack',
    TYPE_DEFENCE:       'Defence',
    TYPE_LIFE_STEAL:    'LifeSteal',
    TYPE_VOID_DEFENCE:  'VoidDefence',
    TYPE_DODGE:         'Dodge',
    TYPE_UNKNOWN:       'Unknown',
};

var CardTemplateDefineList = [
    ['AT2', CardType.TYPE_ATTACK, 		    2],
    ['AT3', CardType.TYPE_ATTACK, 		    3],    
    ['AT4', CardType.TYPE_ATTACK, 		    4],        
    ['AT5', CardType.TYPE_ATTACK, 		    5],
    ['DF3', CardType.TYPE_DEFENCE,		    3],
    ['DF4', CardType.TYPE_DEFENCE,   	    4],
    ['DG', 	CardType.TYPE_DODGE,    	    0],
    ['VD1',	CardType.TYPE_VOID_DEFENCE,     1],
    ['LS1', CardType.TYPE_LIFE_STEAL, 		1],
    ['UK',  CardType.TYPE_UNKNOWN,          0],
];

var PlayerCardDefineList = [
    ['AT2', 2],
    ['AT3', 1],
    ['AT4', 1],        
    ['AT5', 1],
    ['DF3', 1],
    ['DF4', 1],
    ['DG',  1],
    ['VD1', 1],
    ['LS1', 1]    
];


var Settings = {
    PLAYER_INIT_HP:                         10,
    PLAYER_PICK_CARD_TIMEOUT:               30 * 1000, // ms
    GAME_START_COUNTDOWN:                   4, // seconds 
    GAME_NEXT_ROUND_DELAY:                  2 * 1000, // ms
    GAME_END_DELAY:                         2 * 1000, // ms
    AI_PICK_CARD_DELAY:                     1 * 1000, // ms
};

var CardVersus = function(firstPlayer, secondPlayer) {
    var firstCard = firstPlayer.getCurrentCard();
    var secondCard = secondPlayer.getCurrentCard();

    var actionDelay = 0;
    var actionDuration = 1000;

    if (firstCard.type == CardType.TYPE_DODGE || secondCard.type == CardType.TYPE_DODGE) {
        firstPlayer.setFirst(false);
        secondPlayer.setFirst(false);
        return actionDelay;
    }
    switch (firstCard.type) {
        case CardType.TYPE_LIFE_STEAL:
            switch (secondCard.type) {
                case CardType.TYPE_LIFE_STEAL: {
                    let alive = secondPlayer.takeDamage(firstCard.value, actionDelay);
                    firstPlayer.heal(firstCard.value, actionDelay);
                    if (alive) {
                        actionDelay += actionDuration;
                        firstPlayer.takeDamage(secondCard.value, actionDelay);
                        secondPlayer.heal(secondCard.value, actionDelay);
                    }
                    break;
                }                
                case CardType.TYPE_ATTACK: {
                    let alive = secondPlayer.takeDamage(firstCard.value, actionDelay);
                    firstPlayer.heal(firstCard.value, actionDelay);
                    if (alive) {
                        actionDelay += actionDuration;
                        firstPlayer.takeDamage(secondCard.value, actionDelay);
                    }							
                    break;
                }
                case CardType.TYPE_DEFENCE:
                    secondPlayer.takeDamage(firstCard.value, actionDelay);
                    firstPlayer.heal(firstCard.value, actionDelay);
                    break;
                case CardType.TYPE_VOID_DEFENCE: {
                    let alive = secondPlayer.takeDamage(firstCard.value, actionDelay);
                    firstPlayer.heal(firstCard.value, actionDelay);
                    if (alive) {
                        actionDelay += actionDuration;
                        firstPlayer.takeDamage(secondCard.value, actionDelay);
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
                    secondPlayer.heal(secondCard.value, actionDelay);        
                    if (firstPlayer.takeDamage(secondCard.value, actionDelay)) {
                        actionDelay += actionDuration;
                        secondPlayer.takeDamage(firstCard.value, actionDelay)                        
                    }
                    break;
                case CardType.TYPE_ATTACK:
                    {
                        let winnerPlayer = firstPlayer;
                        let winnerCard = firstCard;
                        let loserPlayer = secondPlayer;
                        if (secondCard.value > firstCard.value) {
                            winnerPlayer = secondPlayer;
                            winnerCard = secondCard;
                            loserPlayer  = firstPlayer;
                        }
                        loserPlayer.takeDamage(winnerCard.value, actionDelay);
                        loserPlayer.setFirst(false);
                        winnerPlayer.setFirst(true);
                    }
                    break;
                case CardType.TYPE_DEFENCE: {
                    if (firstCard.value > secondCard) {
                        secondPlayer.takeDamage(firstCard, actionDelay);                                            
                    }
                    else {
                        firstPlayer.setFirst(false);
                        secondPlayer.setFirst(true);                        
                    }
                    break;
                }
                case CardType.TYPE_VOID_DEFENCE:
                    secondPlayer.takeDamage(firstCard.value, actionDelay);
                    break;
                default:
                    break;
            }
            break;
        case CardType.TYPE_DEFENCE:
            switch (secondCard.type) {
                case CardType.TYPE_LIFE_STEAL:
                    firstPlayer.takeDamage(secondCard.value, actionDelay);
                    secondPlayer.heal(secondCard.value, actionDelay);
                    break;
                case CardType.TYPE_ATTACK: {
                    if (secondCard.value > firstCard.value) {
                        firstPlayer.takeDamage(secondCard.value);
                        firstPlayer.setFirst(false);
                        secondPlayer.setFirst(true);
                    }
                    break;
                }
                case CardType.TYPE_DEFENCE:
                    firstPlayer.setFirst(false);
                    secondPlayer.setFirst(false);
                    break;
                case CardType.TYPE_VOID_DEFENCE:
                    firstPlayer.takeDamage(secondCard.value, actionDelay);
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
                    secondPlayer.heal(secondCard.value, actionDelay);        
                    if (firstPlayer.takeDamage(secondCard.value, actionDelay)) {
                        actionDelay += actionDuration;
                        secondPlayer.takeDamage(firstCard.value, actionDelay)                        
                    }
                    break;
                case CardType.TYPE_ATTACK:
                    firstPlayer.takeDamage(secondCard.value, actionDelay);
                    firstPlayer.setFirst(false);
                    secondPlayer.setFirst(true);
                    break;
                case CardType.TYPE_DEFENCE:
                    secondPlayer.takeDamage(firstCard.value);
                    break;
                case CardType.TYPE_VOID_DEFENCE:
                    secondPlayer.takeDamage(firstCard.value, actionDelay);                
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
    return actionDelay;
};

if (typeof module !== 'undefined' && module.exports) {  
    module.exports = {
        CardType: CardType,
        CardTemplateDefineList: CardTemplateDefineList,
        PlayerCardDefineList: PlayerCardDefineList,
        CardVersus: CardVersus,
        Settings: Settings
    };
}