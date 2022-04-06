/**
 * 
 * LimeDB - Server
 * 
*/

var _Transport = require('./transport');
var _Identifier = require('./identifier');
var _Utils = require('./utils');
var fs = require('fs')
var zlib = require('zlib');


var dbPath;
var database;
var changes = false;
var snapShotTime = 30;

/**
 * @class
 */
function Server() {
    this.client_list = {};
    this.methods = {};

    var _this = this;

    this._callback = function(trans, req) {
        if ( req ) {
            switch ( req.message_type ) {
                case trans._protocol._proto.MessageType.REQUEST_LOGIN:
                {
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
                    for ( var k in _this.methods ) {
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
                case trans._protocol._proto.MessageType.REQUEST_KEEPALIVE:
                {
                    if ( trans.session_id && _this.client_list[trans.session_id].login_status ) {
                        var keepalive_req = trans._protocol._proto.KeepAliveRequest.decode(req.message_body);

                        _this.client_list[trans.session_id].keepalive = _Identifier.timestamp() + 5000;

                        var keepalive_resp = trans._protocol._proto.KeepAliveResponse.encode({});
                        trans.write(trans._protocol._proto.MessageType.RESPONSE_KEEPALIVE, keepalive_resp);
                    }
                    break;
                }
                case trans._protocol._proto.MessageType.REQUEST_CALL:
                {
                    if ( trans.session_id && _this.client_list[trans.session_id].login_status ) {
                        var call_req = trans._protocol._proto.CallRequest.decode(req.message_body);

                        if ( _this.methods.hasOwnProperty(call_req.method) ) {
                            var args = [
                                function() {
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
                        }
                        else
                        {
                            var call_resp = trans._protocol._proto.CallResponse.encode({
                                call_id: call_req.call_id,
                                result: trans._protocol._proto.CallResultType.CALL_NO_METHOD,
                                method: call_req.method
                            });
                            trans.write(trans._protocol._proto.MessageType.RESPONSE_CALL, call_resp);
                        }
                    }
                    else
                    {
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

    this._onTick = function() {
        for ( var k  in _this.client_list ) {
            if ( _Identifier.timestamp() > _this.client_list[k].keepalive ) {
                //console.log('Connection attempt : ' + k);
                _this.client_list[k].connection.close();
                delete _this.client_list[k];
            }
        }
    };

    this.publish = function(name, fn) {
        if ( typeof(name) === 'function' ) {
            fn = name;
            name = null;
        }
        if ( name || fn.name ) {
            this.methods[name || fn.name] = fn;
        }
    }
    
    this.publish('get', function(ret, by, value) {
        if(typeof by !== "string") return ret("Bad lookup value");
        if(typeof value !== "string") return ret("Bad lookup value");
        if(changes === false) changes = true;
        let result = database.filter(e => e[by] === value)
        ret(result); 
    });

    this.publish('update', function(ret, by, value, updatedObject) {
        if(typeof by !== "string") return ret("Bad lookup value");
        if(typeof value !== "string") return ret("Bad lookup value");
        database = database.map(obj => updatedObject.find(o => o[by] === obj[by]) || obj);
        ret(null); 
    });

    this.publish('delete', function(ret, by, value) {
        if(typeof by !== "string") return ret("Bad lookup value");
        if(typeof value !== "string") return ret("Bad lookup value");
        if(changes === false) changes = true;
        database = database.filter(e => e[by] !== value)
        ret(null);
    });

    this.publish('insert', function(ret, object) {
        if(typeof object !== 'object') return ret("Not an Object");
        if(object.uid) return ret("Object can't have existing ID");
        if(changes === false) changes = true;
        object.uid = _Identifier.generator();
        database.push(object);
        ret(null);
    });

    this.run = async function(opt, db) {
        if ( opt.auth ) {
            this.auth = opt.auth;
        }

        this._transport = new _Transport(this._callback);

        if ( opt.type.toLowerCase() == "tcp" ) {
            if ( !opt.hasOwnProperty('host') ) {
                opt.host = '0.0.0.0'
            }
            this._transport.listenTCP(opt.port, opt.host);
        }

        this._tick = setInterval(function (){
            this._onTick
        }, 500);
        if(db ? db : db = "database.limedb") {
            if(fs.existsSync(db)){
                console.log("Running Database : " + db)
                dbPath = db;
                const data = await fs.readFileSync(db)
                await zlib.inflate(data, function(err, buf) {
                    database = JSON.parse(buf.toString("utf8"))
            });
            } else {
                console.log("Creating new Database")
                var freshDatabase = new Buffer(JSON.stringify([]), 'utf8')
                dbPath = db;
                zlib.deflate(freshDatabase, function(err, buf) {
                    fs.writeFileSync(db, buf);
                });
                database = [];
            }
        }
        this._snapshotDatabase = setInterval(function () {
            if(changes === false) return;
            zlib.deflate(JSON.stringify(database), function(err, buf) {
                if(err) return;
                changes = false;
                fs.writeFileSync(dbPath, buf);
            });
        }, snapShotTime * 1000);
    };


}

module.exports = Server;
