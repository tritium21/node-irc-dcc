// stdlib
const net = require("net");
const path = require("path");
const fs = require("fs");

// third party
const ip = require("ip");
const format = require("string-format");

// sibling
const myip = require("./myip");
const Chat = require("./chat");

const send_template = "DCC SEND {filename} {addr} {port} {length}";
const chat_template = "DCC CHAT chat {addr} {port}";
const accept_template = "DCC ACCEPT {filename} {port} {position}";

function sendFile(client, to, filename, callback) {
    myip(client.opt.localAddress, (addr) => {
        var localAddress;
        if (!client.opt.localAddress) {
            localAddress = "0.0.0.0";
        } else {
            localAddress = client.opt.localAddress;
        }
        var basename = "\"" + path.basename(filename).replace(/ /g, "_") + "\"";
        var fullpath = path.resolve(filename);
        fs.stat(fullpath, (err, filestat) => {
            if (!err) {
                callback(err);
            }
            var start = 0;
            var server = net.createServer((con) => {
                server.close();
                var recieved = 0;
                con.addListener("data", (data) => {
                    recieved = data.readUInt32BE(0);
                    if (recieved > filestat.size) {
                        callback(new Error("Other side received more than the length of the file"));
                    }
                });
                var readstream = fs.createReadStream(fullpath, { start: start, end: filestat.size });
                readstream.pipe(con);
                readstream.on("end", () => { callback(null); });
            });
            server.listen(0, localAddress, null, () => {
                var address = server.address();
                var data = {
                    filename: basename,
                    addr: ip.toLong(addr),
                    port: address.port,
                    length: filestat.size
                };
                client.ctcp(to, "privmsg", format(send_template, data));
                client.once('ctcp-privmsg', (from, to, text, message) => {
                    if (!text.toLowerCase().startsWith("dcc")) {
                        return;
                    }
                    var args = parseDCC(text);
                    if (!args.type == 'resume') {
                        return;
                    }
                    if (args.filename == basename && args.port == address.port) {
                        start = args.position;
                        var data = {
                            filename: basename,
                            port: args.port,
                            position: args.position,
                        }
                        client.ctcp(from, 'privmsg', format(accept_template, data));
                    }
                });
            });
        });
    });
}

function sendChat(client, to, callback) {
    myip(client.opt.localAddress, (addr) => {
        var localAddress;
        if (!client.opt.localAddress) {
            localAddress = "0.0.0.0";
        } else {
            localAddress = client.opt.localAddress;
        }

        var server = net.createServer((con) => {
            server.close();
            callback(new Chat(con));
        });
        server.listen(0, localAddress, null, () => {
            var address = server.address();
            var data = {
                addr: ip.toLong(addr),
                port: address.port,
            };
            client.ctcp(to, "privmsg", format(chat_template, data));
        });
    });
}
function parseDCC(line) {
    var tokens = line.split(" ");
    switch (tokens[1].toLowerCase()) {
        case "send":
            return {
                type: "send",
                filename: tokens[2],
                addr: ip.fromLong(parseInt(tokens[3])),
                port: parseInt(tokens[4]),
                length: parseInt(tokens[5])
            };
        case "chat":
            return {
                type: "chat",
                addr: ip.fromLong(parseInt(tokens[3])),
                port: parseInt(tokens[4]),
            };
        case "resume":
            return {
                type: "resume",
                filename: tokens[2],
                port: parseInt(tokens[3]),
                position: parseInt(tokens[4])
            };
    }
}
function acceptSend(client, addr, port, filename, length, callback) {
    var options = {
        host: addr,
        port: port,
    };
    if (!client.opt.localAddress) {
        options.localAddress = "0.0.0.0";
    } else {
        options.localAddress = client.opt.localAddress;
    }

    var received = 0;
    var buf = Buffer.allocUnsafe(4);
    var con = net.connect(options, () => {
        callback(con, filename);
    });
    con.addListener('data', (data) => {
        received += Buffer.byteLength(data);
        buf.writeUInt32BE(received, 0);
        con.write(buf);
    });
}

function acceptChat(client, addr, port, callback) {
    var options = {
        host: addr,
        port: port,
    };
    if (!client.opt.localAddress) {
        options.localAddress = "0.0.0.0";
    } else {
        options.localAddress = client.opt.localAddress;
    }
    var con = net.connect(options, () => {
        callback(new Chat(con));
    });
}

module.exports.sendFile = sendFile;
module.exports.sendChat = sendChat;
module.exports.parseDCC = parseDCC;
module.exports.acceptSend = acceptSend;
module.exports.acceptChat = acceptChat;
