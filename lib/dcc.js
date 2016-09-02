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

const net = require("net");
const ip = require("ip");
const format = require("string-format");
const netUtil = require("./net-util");
const Chat = require("./chat");
const parse = require("./parser").parse;

const send_template = "DCC SEND {filename} {addr} {port} {length}";
const chat_template = "DCC CHAT chat {addr} {port}";
const accept_template = "DCC ACCEPT {filename} {port} {position}";
const resume_template = "DCC RESUME {filename} {port} {position}";


const DCC = module.exports = function (client, options) {
    var self = this;
    self.client = client;
    self.ports = options.ports || 0;
    self.localAddress = options.localAddress || client.opt.localAddress || ip.address();
    self.client.addListener("ctcp-privmsg", (from, to, text, message) => {
        var args = parseDCC(text);
        if (args) {
            self.client.emit("dcc-" + args.type, from, args, message);
        }
    });
};
DCC.prototype.getIP = function (callback) {
    var self = this;
    netUtil.getMyIP(self.localAddress, callback);
};
DCC.prototype.getPort = function (callback) {
    var self = this;
    if (self.ports == 0) {
        callback(0);
    } else {
        netUtil.getUnusedPort({
            min: self.ports[0],
            max: self.ports[1],
            localAddress: self.localAddress
        }, callback);
    }
};
DCC.prototype.getPortIP = function (callback) {
    var self = this;
    self.getIP((host) => {
        self.getPort((port) => {
            callback({
                host: host,
                long: ip.toLong(host),
                port: port
            });
        });
    });
};
DCC.prototype.sendFile = function (to, filename, length, callback) {
    var self = this;
    filename = filename.replace(/ /g, "_");

    self.getPortIP((details) => {
        var start = 0;

        function resumeCallback(from, args) {
            if (args.filename == filename) {
                start = args.position;
                var data = {
                    filename: filename,
                    port: args.port,
                    position: args.position,
                };
                self.client.ctcp(from, "privmsg", format(accept_template, data));
            }
        }
        var server = net.createServer();
        server.on("connection", (con) => {
            server.close();
            callback(null, con, start);
            self.client.removeListener("dcc-resume", resumeCallback);
            var recieved = 0;
            con.addListener("data", (data) => {
                recieved = data.readUInt32BE(0);
                if (recieved > length) {
                    callback(new Error("Other side received more than the length of the file"), null, null);
                }
            });
        });
        server.listen(details.port, self.localAddress, null, () => {
            var address = server.address();
            var data = {
                filename: filename,
                addr: details.long,
                port: address.port,
                length: length
            };
            self.client.ctcp(to, "privmsg", format(send_template, data));
            self.client.once("dcc-resume", resumeCallback);
        });
    });
};
DCC.prototype.acceptSend = function (from, host, port, filename, length, position, callback) {
    var self = this;
    if (typeof position == "function") {
        callback = position;
        position = null;
    }
    var connection_options = {
        host: host,
        port: port,
        localAddress: self.localAddress
    };
    function acceptCallback(from, args) {
        if (args.filename == filename && args.port == port) {
            _acceptAndCallback();
        }
    }

    function _acceptAndCallback() {
        var received = 0;
        var buf = new Buffer(4);
        var client = net.connect(connection_options, () => {
            callback(null, filename, client);
        });
        client.addListener("data", (data) => {
            received += Buffer.byteLength(data);
            buf.writeUInt32BE(received, 0);
            client.write(buf);
        });
    }
    if (!position) {
        _acceptAndCallback();
        return;
    }
    self.client.ctcp(from, "privmsg", format(resume_template, {
        filename: filename,
        port: port,
        position: position
    }));
    self.client.once("dcc-accept", acceptCallback);
};
DCC.prototype.sendChat = function (to, callback) {
    var self = this;
    self.getPortIP((details) => {
        var server = net.createServer((con) => {
            server.close();
            callback(null, new Chat(con));
        });
        server.listen(details.port, self.localAddress, null, () => {
            var address = server.address();
            var data = {
                addr: details.long,
                port: address.port,
            };
            self.client.ctcp(to, "privmsg", format(chat_template, data));
        });
    });
};
DCC.prototype.acceptChat = function (host, port, callback) {
    var self = this;
    var options = {
        host: host,
        port: port,
        localAddress: self.localAddress
    };
    var con = net.connect(options, () => {
        callback(null, new Chat(con));
    });
};

const parseDCC = module.exports.parseDCC = function (line) {
    var args;
    try {
        args = parse(line);
        if (args.hasOwnProperty("long")) {
            args.host = ip.fromLong(args.long);
        }
        return args;
    } catch (e) {
        return null;
    }
};