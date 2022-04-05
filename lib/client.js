/**
 * 
 * LimeDB - Client
 * 
*/

var _Transport = require('./transport');
var _EventEmitter = require('./eventemitter')
var _Identifier = require('./identifier');
var _Utils = require('./utils');

/**
 * @class
 */
function Client() {
    this.event = new _EventEmitter();

    this.timeout = 5000;    //  5s
    this.client = {};
    this.methods = [];
    this.pending = {};

    var _this = this;

    this._keepalive = function() {
        var keepalive_req = _this.client.connection._protocol._proto.KeepAliveRequest.encode({});
        _this.client.connection.write(_this.client.connection._protocol._proto.MessageType.REQUEST_KEEPALIVE, keepalive_req);
    };

    this._invoker = function(method_name) {
        var args = _Utils.toArray(arguments);
        var method = {
            id: _Identifier.generator(),
            name: method_name,
            cb: args[1],
            param: args.slice(2)
        };

        this.pending[method.id] = method;
        this.pending[method.id].timeout = setTimeout(function() {
            method.cb('timeout', null);
            delete _this.pending[method.id];
        }, this.timeout);

        var call_req = _this.client.connection._protocol._proto.CallRequest.encode({
            call_id: method.id,
            method: method.name,
            arguments: JSON.stringify(method.param)
        });
        _this.client.connection.write(_this.client.connection._protocol._proto.MessageType.REQUEST_CALL, call_req);
    };

    this._callback = function(trans, req) {
        if ( req ) {
            switch ( req.message_type ) {
                case trans._protocol._proto.MessageType.RESPONSE_LOGIN:
                {
                    var login_resp = trans._protocol._proto.LoginResponse.decode(req.message_body);

                    if ( trans._protocol._proto.LoginResultType.LOGIN_SUCCESS == login_resp.result ) {
                        trans.session_id = login_resp.session_id;
                        _this.client.session_id = trans.session_id;
                        _this.client.connection = trans;

                        for ( var i = 0; i < login_resp.methods.length; ++i ) {
                            _this[login_resp.methods[i]] = _this._invoker.bind(_this, login_resp.methods[i]);
                            _this.methods.push(login_resp.methods[i]);
                        }

                        _this.event.emit('ready');

                        _this._tick = setTimeout(_this._keepalive, 3000);
                    }
                    else
                    {
                        _this.event.emit('error', 'Remote RPC Server auth failed.');
                    }
                    break;
                }
                case trans._protocol._proto.MessageType.RESPONSE_KEEPALIVE:
                {
                    var keepalive_resp = trans._protocol._proto.KeepAliveResponse.decode(req.message_body);
                    _this._tick = setTimeout(_this._keepalive, 3000);
                    break;
                }
                case trans._protocol._proto.MessageType.RESPONSE_CALL:
                {
                    var call_resp = trans._protocol._proto.CallResponse.decode(req.message_body);
                    if ( _this.pending.hasOwnProperty(call_resp.call_id) ) {
                        clearTimeout(_this.pending[call_resp.call_id].timeout);

                        switch ( call_resp.result ) {
                            case trans._protocol._proto.CallResultType.CALL_SUCCESS:
                            {
                                _this.pending[call_resp.call_id].cb.apply(_this, [null].concat(JSON.parse(call_resp.returns)));
                                break;
                            }
                            case trans._protocol._proto.CallResultType.CALL_NO_METHOD:
                            {
                                _this.pending[call_resp.call_id].cb('unknown method', null);
                                break;
                            }
                            case trans._protocol._proto.CallResultType.CALL_AUTH_FAILED:
                            {
                                _this.pending[call_resp.call_id].cb('auth failed', null);
                                break;
                            }
                        }

                        delete _this.pending[call_resp.call_id];
                    }
                    break;
                }
            }
        }
    };

    this.tryConnect = function(opt) {
        this._transport = new _Transport(this._callback);

        this._transport.event.on('connected', function(c) {
            _this.event.emit('connected');
        });
        this._transport.event.on('disconnected', function(c) {
            _this.event.emit('disconnected');
        });

        if ( opt.type.toLowerCase() == "tcp" ) {
            this._transport.connectTCP(opt.host, opt.port, opt.auth);
        }
    };
}

module.exports = Client;
