/**
 * 
 * LimeDB - Transport
 * 
*/


var net = require('net');
var _Protocol = require('./protocol');
var _EventEmitter = require('./eventemitter')

/**
 * @class
 */
function _TransportTCP(socket, cb) {
    var _this = this;

    this.event = new _EventEmitter();

    this._socket = socket;
    this._callback = cb;
    this._protocol = new _Protocol();

    this._socket.on('data', function(data) {
        var req = _this._protocol.readProto(data);
        while ( req ) {
            _this._callback(_this, req);
            req = _this._protocol.readProto(null);
        }
    });

    this._socket.on('close', function() {
        _this.event.emit('end', this);
    });
    this._socket.on('error', function(err) {
    });

    this.write = function(type, body) {
        this._socket.write(this._protocol.writeProto(type, body));
    };

    this.close = function() {
        this._socket.end();
    };
}

/**
 * @class
 */
function _Transport(cb) {
    this._transport = null;
    this.event = new _EventEmitter();

    this.listenTCP = function(port, host) {
        var _this = this;

        if ( !this._transport ) {
            this._transport = [];
            this.server = net.createServer(function(socket) {
                var trans = new _TransportTCP(socket, cb);
                _this._transport.push(trans);

                _this.event.emit('connected', trans);

                trans.event.on('end', function (c) {
                    _this.event.emit('disconnected', c);
                    _this._transport.splice(_this._transport.indexOf(c), 1);
                });
            });
            this.server.listen(port, host);

            return true;
        }
        return false;
    };

    this.connectTCP = function(host, port, auth) {
        var _this = this;

        if ( !this._transport ) {
            this._host = host;
            this._port = port;
            this._auth = auth;
            this._connected = false;

            var tryConnect = function () {
                _this.client = new net.Socket();
                _this._transport = new _TransportTCP(_this.client, cb);

                _this._transport.event.on('end', function () {
                    if ( _this._connected ) {
                        _this._connected = false;
                        _this.event.emit('disconnected', _this._transport);
                    }
                    setTimeout(function () {
                        tryConnect();
                    }, 1000);
                });

                _this.client.connect(_this._port, _this._host, function () {
                    try {
                        _this._connected = true;
                        _this.event.emit('connected', _this._transport);

                        var login_req = _this._transport._protocol._proto.LoginRequest.encode({
                            auth: _this._auth ? _this._auth : ''
                        });
                        _this._transport.write(_this._transport._protocol._proto.MessageType.REQUEST_LOGIN, login_req);
                    } catch (err) {
                        console.log(err);
                    }
                });
            };

            tryConnect();
            return true;
        }
        return false;
    };
}

module.exports = _Transport;
