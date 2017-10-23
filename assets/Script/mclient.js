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
        this.cmd = '';
        this.roomID = 0;
        this.userID = 0;
        this.socket = null;
        this.roomData = null;
        this.gameData = null;

        var origin = window.location.origin;
        var index = origin.indexOf(':', origin.indexOf(':') + 1);
        if (0 <= index) {
            this.server = origin.substr(0, index);
        }
        else {
            this.server = origin;
        }
        this.server += ':8888';
    }

    inherits(Client, EventEmitter);
    
    Client.prototype.getSelfPlayerData = function(roomData) {
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

    Client.prototype.getOppPlayerData = function(roomData) {
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
        
    Client.prototype._parseIntParam = function(param, defaultValue) {
        var ret = parseInt(param);
        if (NaN === ret) {
            ret = defaultValue;
        }
        return ret;
    }
    
    Client.prototype._getQueryParams = function(search) {
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
    
    Client.prototype.init = function() {
        var params = this._getQueryParams(window.location.search);
        this.cmd = params['cmd'];
        this.roomID = this._parseIntParam(params['rid'], 0);
        this.userID = this._parseIntParam(params['uid'], 0);
    }
    
    Client.prototype.connect = function() {
        if (!this.socket) {
            var self = this;
            
            this.socket = io(this.server);

            this.socket.packet = inject(this.socket.packet, function() {
                if (arguments[0].data) {
                    console.log('sending packet: %s', arguments[0].data.join(','));                    
                }
                else {
                    console.log('sending packet: %s', JSON.stringify(arguments));
                }
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
    }
        
    Client.prototype._login = function() {
        if (!this.userID) {
            this.userID = this._parseIntParam(window.localStorage.getItem('cd_user_id'), 0);                    
        }
        this.socket.emit(OpCodes.LOGIN, this.userID);
        this.socket.on(OpCodes.LOGIN, (result, userIdOrMsg, playerState) => {
            if (result) {
                this.userID = userIdOrMsg;
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

    Client.prototype.hideQRcode = function() {
        if (this._qrcodeDiv) {
            this._qrcodeDiv.style.display = 'none';
        }            
    }

    Client.prototype.showQRcode = function() {
        if (cc.sys.isBrowser) {
            if (!this._qrcodeDiv && !this._qrcode) {
                var div = document.getElementById('qrcode');
                var QRCODE_SIZE = 192;
                if (!div) {
                    div = document.createElement('DIV');
                    div.id = 'qrcode';
                    div.style.position = 'absolute';
                    div.style.left = '50%';
                    div.style.top = '40%';
                    div.style.margin = ('-' + QRCODE_SIZE / 2 + 'px -' + QRCODE_SIZE / 2 + 'px');
                    div.onchange
                    document.getElementById('Cocos2dGameContainer').appendChild(div);
                }
                this._qrcodeDiv = div;
                this._qrcode = new QRCode(div, {
                    text: (window.location.origin + '?cmd=join_room&rid=' + client.roomData.id),
                    width: QRCODE_SIZE,
                    height: QRCODE_SIZE,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H                
                });
            }
            else if (this._qrcode) {
                this._qrcode.clear();
                this._qrcode.makeCode(window.location.origin + '?cmd=join_room&rid=' + client.roomData.id);
                this._qrcodeDiv.style.display = 'block';                    
            }
        }
    }            
    window.client = new Client();
    window.client.init();
})();
