/**
 * 
 * LimeDB - Server
 * 
 */

const _Transport = require('../network/transport');
const _Identifier = require('../network/identifier');
const _Utils = require('../network/utils');
const insert = require('./insert.js')
const get = require('./get.js')
const deleteObject = require('./deleteObject.js')
const updateProperty = require('./updateProperty.js')
const updateObject = require('./updateObject.js')
const createDatabase = require('./createDatabase.js')
const createTable = require('./createTable.js')
const init = require('./init.js')

function Server() {
    this.client_list = {};
    this.methods = {};

    var _this = this;

    this._callback = function (trans, req) {
        if (req) {
            switch (req.message_type) {
                case trans._protocol._proto.MessageType.REQUEST_LOGIN: {
                    var login_req = trans._protocol._proto.LoginRequest.decode(req.message_body);

                    var login_ret = (_this.auth && login_req.auth == _this.auth) ? true : false;

                    trans.session_id = _Identifier.generator();

                    _this.client_list[trans.session_id] = {
                        session_id: trans.session_id,
                        keepalive: _Identifier.timestamp() + (login_ret ? 5000 : 0),
                        connection: trans,
                        login_status: login_ret
                    };

                    var methods_list = [];
                    for (var k in _this.methods) {
                        methods_list.push(k);
                    }

                    var login_resp = trans._protocol._proto.LoginResponse.encode({
                        result: (login_ret ? trans._protocol._proto.LoginResultType.LOGIN_SUCCESS : trans._protocol._proto.LoginResultType.LOGIN_AUTH_FAILED),
                        session_id: trans.session_id,
                        methods: methods_list
                    });
                    trans.write(trans._protocol._proto.MessageType.RESPONSE_LOGIN, login_resp);

                    break;
                }
                case trans._protocol._proto.MessageType.REQUEST_KEEPALIVE: {
                    if (trans.session_id && _this.client_list[trans.session_id].login_status) {
                        var keepalive_req = trans._protocol._proto.KeepAliveRequest.decode(req.message_body);

                        _this.client_list[trans.session_id].keepalive = _Identifier.timestamp() + 5000;

                        var keepalive_resp = trans._protocol._proto.KeepAliveResponse.encode({});
                        trans.write(trans._protocol._proto.MessageType.RESPONSE_KEEPALIVE, keepalive_resp);
                    }
                    break;
                }
                case trans._protocol._proto.MessageType.REQUEST_CALL: {
                    if (trans.session_id && _this.client_list[trans.session_id].login_status) {
                        var call_req = trans._protocol._proto.CallRequest.decode(req.message_body);

                        if (_this.methods.hasOwnProperty(call_req.method)) {
                            var args = [
                                function () {
                                    var call_resp = trans._protocol._proto.CallResponse.encode({
                                        call_id: call_req.call_id,
                                        result: trans._protocol._proto.CallResultType.CALL_SUCCESS,
                                        method: call_req.method,
                                        returns: JSON.stringify(_Utils.toArray(arguments))
                                    });
                                    trans.write(trans._protocol._proto.MessageType.RESPONSE_CALL, call_resp);
                                }
                            ].concat(_Utils.toArray(JSON.parse(call_req.arguments)));

                            _this.methods[call_req.method].apply(_this, args);
                        } else {
                            var call_resp = trans._protocol._proto.CallResponse.encode({
                                call_id: call_req.call_id,
                                result: trans._protocol._proto.CallResultType.CALL_NO_METHOD,
                                method: call_req.method
                            });
                            trans.write(trans._protocol._proto.MessageType.RESPONSE_CALL, call_resp);
                        }
                    } else {
                        var call_resp = trans._protocol._proto.CallResponse.encode({
                            call_id: call_req.call_id,
                            result: trans._protocol._proto.CallResultType.CALL_AUTH_FAILED,
                            method: call_req.method
                        });
                        trans.write(trans._protocol._proto.MessageType.RESPONSE_CALL, call_resp);
                    }
                    break;
                }
            }
        }
    };

    
    init();

    this._onTick = function () {
        for (var k in _this.client_list) {
            if (_Identifier.timestamp() > _this.client_list[k].keepalive) {
                //console.log('Connection attempt : ' + k);
                _this.client_list[k].connection.close();
                delete _this.client_list[k];
            }
        }
    };

    this.publish = function (name, fn) {
        if (typeof (name) === 'function') {
            fn = name;
            name = null;
        }
        if (name || fn.name) {
            this.methods[name || fn.name] = fn;
        }
    }

    this.publish('createDatabase', createDatabase)

    this.publish('createTable', createTable)

    this.publish('insert', insert);
    
    this.publish('get', get);

    this.publish('updateProperty', updateProperty);

    this.publish('updateObject', updateObject);

    this.publish('delete', deleteObject);


    this.run = async function (opt, db) {
        if (opt.auth) {
            this.auth = opt.auth;
        }

        this._transport = new _Transport(this._callback);

        if (opt.connection.toLowerCase() == "tcp") {
            if (!opt.hasOwnProperty('host')) {
                opt.host = '0.0.0.0'
            }
            this._transport.listenTCP(opt.port, opt.host);
        }

        /* Database Option Types 
           1 - Memory Database
            Loads database solely in memory
            Lookups happen only from the memory
           2 - Hybrid Database ( default option )
            Loads objects in memory only if they're looked up
            Lookups happen in the memory first, if object does not exist in memory we look up on disk and save it in memory.
           3 - Normal Database
            Lookups happen only using disk read
        */

        if (opt.type) {
            if (opt.type === 1) databaseType = 1;
            if (opt.type === 2) databaseType = 2;
            if (opt.type === 3) databaseType = 3;
            if (opt.type != 1 && opt.type != 2 && opt.type != 3) throw console.error("Wrong Database Type");
        } else {
            databaseType = 2;
        }

        this._tick = setInterval(function () {
            this._onTick
        }, 500);
    };


}

module.exports = Server;