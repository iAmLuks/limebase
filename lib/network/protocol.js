/**
 * 
 * LimeDB - Protocol
 * 
*/

var fs = require('fs');
var path = require("path");
var protobuf = require('protocol-buffers');

/**
 * @class
 */
function _Protocol() {
    this._proto = protobuf(fs.readFileSync(path.resolve(__dirname, "./proto/noderpc.proto")));
    this._header_size  = 4;
    this._read_buffer = new Buffer.alloc(0);

    this.readProto = function(data) {
        if ( data )
        {
            this._read_buffer = Buffer.concat([this._read_buffer, data]);
        }

        var request = null;

        if ( this._read_buffer.length > this._header_size ) {
            var msg_len  = this._read_buffer.readUInt32LE(0);

            if ( this._read_buffer.length >= (msg_len + this._header_size) ) {
                var msg = new Buffer.alloc(msg_len);
                this._read_buffer.copy(msg, 0, this._header_size, msg_len + this._header_size);

                try {
                    request = this._proto.MessageHeader.decode(msg);
                } catch( err ) {
                    console.log(err.toString());
                }

                msg = this._read_buffer;
                this._read_buffer = new Buffer.alloc(msg.length - (msg_len + this._header_size));
                msg.copy(this._read_buffer, 0, msg_len + this._header_size, msg.length);
            }
        }

        return request;
    };

    this.writeProto = function(type, body) {
        var msg = {
            message_type : type,
            message_body : body
        };

        var p = this._proto.MessageHeader.encode(msg);
        var b = new Buffer.alloc(p.length + this._header_size);

        b.writeUInt32LE(p.length, 0);
        p.copy(b, this._header_size);

        return b;
    };
}

module.exports = _Protocol;
