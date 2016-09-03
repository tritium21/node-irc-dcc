//  Copyright(C) 2016 Alexander Walters
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.If not, see <http://www.gnu.org/licenses/>.

const events = require("events");
const util = require("util");

const lineDelimiter = new RegExp("\r\n|\r|\n");

var Chat = function (connection) {
    var self = this;
    self.connection = connection;

    var buffer = new Buffer("");
    function handleData(chunk) {
        if (typeof (chunk) === "string") {
            buffer += chunk;
        } else {
            buffer = Buffer.concat([buffer, chunk]);
        }
        var lines = buffer.toString().split(lineDelimiter);
        if (lines.pop()) {
            return;
        } else {
            buffer = new Buffer("");
        }
        lines.forEach(function iterator(line) {
            if (line.length) {
                try {
                    self.emit("line", line);
                } catch (err) {
                    if (!self.connection.requestedDisconnect) {
                        throw err;
                    }
                }
            }
        });
    }

    self.connection.addListener("data", handleData);
};
util.inherits(Chat, events.EventEmitter);
Chat.prototype.say = function (message) {
    var self = this;
    if (!self.connection.requestedDisconnect) {
        self.connection.write(message + "\r\n");
    }
};
Chat.prototype.disconnect = function () {
    var self = this;
    self.connection.end();
};
module.exports.Chat = Chat;