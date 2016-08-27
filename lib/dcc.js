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
const parse = require("./parser").parse;
const getUnusedPort = require("./port").getUnusedPort;

const send_template = "DCC SEND {filename} {addr} {port} {length}";
const chat_template = "DCC CHAT chat {addr} {port}";
const accept_template = "DCC ACCEPT {filename} {port} {position}";
const resume_template = "DCC RESUME {filename} {port} {position}";

function sendFile(client, options, callback) {
    myip(client.opt.localAddress, (addr) => {
        var to = options.to;
        var filename = options.filename
        var localAddress;
        if (!client.opt.localAddress) {
            localAddress = "0.0.0.0";
        } else {
            localAddress = client.opt.localAddress;
        }
        var basename = path.basename(filename).replace(/ /g, "_");
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
            var port_options = {
                min: options.port_start,
                max: options.port_end || options.port_start + 10,
                localAddress: localAddress
            };
            getUnusedPort(port_options, (err, port) => {
                if (err) {
                    throw err;
                }
                server.listen(port, localAddress, null, () => {
                    var address = server.address();
                    var data = {
                        filename: basename,
                        addr: ip.toLong(addr),
                        port: address.port,
                        length: filestat.size
                    };
                    client.ctcp(to, "privmsg", format(send_template, data));
                    client.once("ctcp-privmsg", (from, to, text) => {
                        if (!text.toLowerCase().startsWith("dcc")) {
                            return;
                        }
                        var args = parseDCC(text);
                        if (!args.type == "resume") {
                            return;
                        }
                        if (args.filename == basename && args.port == address.port) {
                            start = args.position;
                            var data = {
                                filename: basename,
                                port: args.port,
                                position: args.position,
                            };
                            client.ctcp(from, "privmsg", format(accept_template, data));
                        }
                    });
                });
            });
        });
    });
}

function sendChat(client, options, callback) {
    var to = options.to;
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
        var port_options = {
            min: options.port_start,
            max: options.port_end || options.port_start + 10,
            localAddress: localAddress
        };
        getUnusedPort(port_options, (err, port) => {
            if (err) {
                throw err;
            }

            server.listen(0, localAddress, null, () => {
                var address = server.address();
                var data = {
                    addr: ip.toLong(addr),
                    port: address.port,
                };
                client.ctcp(to, "privmsg", format(chat_template, data));
            });
        });
    });
}
function parseDCC(line) {
    var args;
    try {
        args = parse(line);
        if (args.hasOwnProperty("addr")) {
            args.addr = ip.fromLong(args.addr);
        }
        return args;
    } catch (e) {
        return null;
    }
}
function acceptSend(client, options, callback) {
    var con_options = {
        host: options.addr,
        port: options.port,
    };
    if (!client.opt.localAddress) {
        con_options.localAddress = "0.0.0.0";
    } else {
        con_options.localAddress = client.opt.localAddress;
    }
    if (!options.resume) {
        _acceptAndCallback(con_options, options, callback);
    } else {
        client.ctcp(options.from, "privmsg", format(resume_template, {
            filename: options.filename,
            port: options.port,
            position: options.resume
        }));
        client.once("ctcp-privmsg", (from, to, text) => {
            var args = parseDCC(text);
            if (args && args.type == "accept" && args.filename == options.filename && args.port == options.port) {
                _acceptAndCallback(con_options, options, callback);
            }
        });
    }
}
function _acceptAndCallback(con_options, options, callback) {
    var received = 0;
    var buf = Buffer.allocUnsafe(4);
    var con = net.connect(con_options, () => {
        callback(con, options.filename);
    });
    con.addListener("data", (data) => {
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
