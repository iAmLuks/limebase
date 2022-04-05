/**
 * 
 * LimeDB - Unique ID
 * 
*/

var _identifier = Math.round(Math.random() * 1000000);

function getTimestamp() {
    return new Date().getTime();
}
function generatorID() {
    _identifier += 1;
    return getTimestamp().toString(16) + _identifier.toString(16);
}

module.exports.timestamp = getTimestamp;
module.exports.generator = generatorID;
