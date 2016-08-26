const events = require('events');
const util = require('util');

const lineDelimiter = new RegExp('\r\n|\r|\n')

function Chat(connection) {
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
module.exports.Chat = Chat;