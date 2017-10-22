var OpCodes = {
	LOGIN: 					'login',					// c => s: userID; s => c: result, userID, newSession
	CREATE_ROOM:			'create_room',				// c => s: ; s => result, roomID
	QUICK_MATCH:			'quick_match',				// c => s: ; s => result, roomID
	JOIN_ROOM: 				'join_room',				// c => s: roomID; s => c: result, roomID
	LEAVE_ROOM:				'leave_room',				// c => s: roomID; s => c: result, roomID
	ROOM_DATA:				'room_data',  				// c => s: ; s => c: result, {roomID, state, [{UserID, ready}]}
	PLAYER_CHANGE_READY:	'player_change_ready',		// c => s: ready; s => c: ready	 
	GAME_WILL_START:		'game_will_start',			// s => c: delay
	GAME_START: 			'game_start',				// s => c: ; 
	PLAYER_GAME_DATA: 		'player_game_data',			// s => c: hp, cards	// not used
	GAME_DATA:				'game_data',				// s => c: roomID, round, [{playerID, playerHP, playerCards}]
	GAME_ROUND: 			'game_round',				// s => c: round
	PLAYER_TURN: 			'player_turn', 				// s => c: ;
	GAME_DATA_FIRST:		'game_data_first',			// s => c: [{playerID, first}]
	PLAYER_PICK_CARD: 		'player_pick_card',			// c => s: cardIndex; s => c: cardIndex, cardClassID,
	GAME_DATA_PICKED:		'game_data_picked',			// s => c: [{playerID, picked}]
	GAME_CARD_VERSUS:		'game_card_versus',			// s => c: firstCardTemplateID, secondCardTemplateID, firstUserID, secondUserID
	PLAYER_TAKE_DAMAGE: 	'player_tack_damage',		// s => c: damage
	PLAYER_HEAL: 			'player_heal',				// s => c: heal
	PLAYER_QUIT: 			'player_quit', 				// not used
	PLAYER_DISCONNECT: 		'player_disconnect',		// s => c: userID	
	GAME_END: 				'game_end'					// not used
};

var PlayerState = {
	STATE_IDLE: 			'idle',	// default state after login
	STATE_ROOM:				'room',	// in room
	STATE_GAME_STARTING:	'game_starting',  // game start counting down, ready change not allowed
	STATE_GAME:				'game',  // in game	
	STATE_DISCONNECTED: 	'disconnected',
};

var RoomState = {
	STATE_IDLE:			'idle',
	STATE_WAITING:		'waiting',
	STATE_FULL:			'full',
	STATE_PLAYING: 		'playing',
};

// change it to false in product version
var debug = true;

function inject(original, fn) {
	if (debug) {
		return function () {
			var ret = original.apply(this, arguments);
			fn.apply(this, arguments);
			return ret;
		};	
	}
	else {
		return original
	}
};

function clone(obj) {
    if (null == obj || "object" != typeof obj) {
		return obj;
	}
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		OpCodes: OpCodes,
		PlayerState: PlayerState,
		RoomState: RoomState,
		util: {
			inject: inject,
			clone: clone,
		}
	}
}
