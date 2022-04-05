/**
 * 
 * LimeDB - Utils
 * 
*/

function toArray(s) {
    try {
        return Array.prototype.slice.call(s);
    } catch(e) {
        var arr = [];
        for ( var i = 0; i < s.length; ++i ) {
            arr.push(s[i]);
        }
        return arr;
    }
};

module.exports.toArray = toArray;
