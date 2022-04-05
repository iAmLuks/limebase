/**
 * 
 * LimeDB - Events
 * 
*/

var events = require('events');
var utils = require('util');

function _EventEmitter() {
    events.EventEmitter.call(this);
};
utils.inherits(_EventEmitter, events.EventEmitter);

module.exports = _EventEmitter;
