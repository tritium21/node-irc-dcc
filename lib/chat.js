const events = require('events');
const util = require('util');

const lineDelimiter = new RegExp('\r\n|\r|\n')

var Chat = function (connection) {
    var self = this;
    self.connection = connection;

    var buffer = new Buffer('');
    function handleData(chunk) {
        if (typeof (chunk) === 'string') {
            buffer += chunk;
        } else {
            buffer = Buffer.concat([buffer, chunk]);
        }
        var lines = buffer.toString().split(lineDelimiter);
        if (lines.pop()) {
            return;
        } else {
            buffer = new Buffer('');
        }
        lines.forEach(function iterator(line) {
            if (line.length) {
                try {
                    self.emit('line', line);
                } catch (err) {
                    if (!self.connection.requestedDisconnect) {
                        throw err;
                    }
                }
            }
        });
    }

    self.connection.addListener('data', handleData);
};
util.inherits(Chat, events.EventEmitter);
Chat.prototype.say = function (message) {
    var self = this;
    if (!self.connection.requestedDisconnect) {
        self.connection.write(message + '\r\n');
    }
}
Chat.prototype.disconnect = function () {
    var self = this;
    self.connection.end();
}
module.exports = Chat;