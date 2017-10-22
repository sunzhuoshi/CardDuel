// letter 'm' before 'client' is only used to control this script loading order after other lib scripts
(function() {
    function inherits(ctor, superCtor) {
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
    };

    (function setEventEmitterApiAlias() {
        EventEmitter.prototype.on = EventEmitter.prototype.addListener;
        EventEmitter.prototype.off = EventEmitter.prototype.removeListener;        
        EventEmitter.prototype.emit = EventEmitter.prototype.emitEvent;
    })();

    function Client() {
        EventEmitter.call(this);
        this.dev = true;
        this.version = 'v0.1';
        this.server = '';
        this.cmd = '';
        this.roomID = 0;
        this.userID = 0;
        this.socket = null;
        
        this.roomData = null;

        this.gameData = null;

        this.getSelfPlayerData = function(roomData) {
            var ret = null;
            var rd = roomData;
            
            if (!rd) {
                rd = this.roomData;
            }
            if (rd) {
                var self = this;
                ret = rd.players.find(function(player) {
                    return player.id === self.userID;
                });
            }
            return ret;
        }

        this.getOppPlayerData = function(roomData) {
            var ret = null;
            var rd = roomData;
            
            if (!rd) {
                rd = this.roomData;
            }
            if (rd) {            
                var self = this;
                ret = roomData.players.find(function(player) {
                    return player.id !== self.userID;
                });
            }
            return ret;
        },
        
        this._parseIntParam = function(param, defaultValue) {
            var ret = parseInt(param);
            if (NaN === ret) {
                ret = defaultValue;
            }
            return ret;
        }
    
        this._getQueryParams = function(search) {
            var ret = {};
            var qIndex = -1;
            if (search) {
                qIndex = search.indexOf('?');
            }
            if (0 <= qIndex) {
                search.substr(qIndex + 1).split('&').forEach(function(pair) {
                    var splitted = pair.split('=');
                    if (splitted.length === 2) {
                        ret[splitted[0]] = splitted[1];
                    }
                });
            }
            return ret;
        }
    
        this.init = function() {
            if (this.dev) {
                this.server = 'http://localhost:8888';
            }
            var params = this._getQueryParams(window.location.search);
            this.cmd = params['cmd'];
            this.roomID = this._parseIntParam(params['rid'], 0);
            this.userID = this._parseIntParam(params['uid'], 0);
        }
    
        this.connect = function() {
            if (!this.socket) {
                var self = this;
                
                this.socket = io(this.server);

                this.socket.packet = inject(this.socket.packet, function() {
                    console.log('sending packet: %s', arguments[0].data.join(','));                    
                });
                
                // TODO: check why it desn't work
                /*
                this.socket.onpacket = inject(this.socket.onPacket, function() {
                    console.log('received packet: %s', [...arguments].join(','));
                });
                */

                this.socket.on('connect', function() {
                    self._login();
                });
                this.socket.on(OpCodes.ROOM_DATA, function(result, dataOrMsg) {
                    if (result) {
                        self.roomData = dataOrMsg;
                    }
                });
                this.socket.on(OpCodes.GAME_DATA, function(data) {
                    self.gameData = data;
                });
            }
        },
    
        this._login = function() {
            if (!this.userID) {
                this.userID = this._parseIntParam(window.localStorage.getItem('cd_user_id'), 0);                    
            }
            this.socket.emit(OpCodes.LOGIN, this.userID);
            this.socket.on(OpCodes.LOGIN, function(result, userIdOrMsg, playerState) {
                if (result) {
                    window.localStorage.setItem('cd_user_id', userIdOrMsg);
                    // deal with server restart when we're in game scene
                    if (playerState === PlayerState.STATE_IDLE) {
                        cc.director.loadScene('EntryScene');
                    }
                    else if (playerState === PlayerState.STATE_ROOM) {
                        cc.director.loadScene('GameScene');
                    }
                }
            });
        }
    }
    inherits(Client, EventEmitter);
    window.client = new Client();
    window.client.init();
})();
