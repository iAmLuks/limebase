/**
 * 
 * LimeDB - RPC
 * 
*/

var _Server = require('./server/server.js');
var _Client = require('./client/client.js');

module.exports = {
	Server : _Server,
	Client : _Client,
};
