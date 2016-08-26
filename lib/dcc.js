// stdlib
const net = require('net');
const path = require('path');
const fs = require('fs');

// third party
const ip = require('ip');
const format = require('string-format');

// sibling
const myip = require('./myip');
const Chat = require('./chat');

const send_template = "DCC SEND {filename} {addr} {port} {length}";
const chat_template = "DCC CHAT chat {addr} {port}";

function patch() {
    var irc = require('irc');
    irc.Client.prototype.sendFile = function() {
        sendFile.apply(null, [this].concat(Array.prototype.slice.call(arguments)))
    }
    irc.Client.prototype.sendChat = function () {
        sendChat.apply(null, [this].concat(Array.prototype.slice.call(arguments)))
    }
}

function sendFile(client, to, filename, callback) {
    myip(client.opt.localAddress, (addr) => {
        if (!client.opt.localAddress) {
            var localAddress = '0.0.0.0';
        } else {
            var localAddress = client.opt.localAddress
        }
        var basename = path.basename(filename);
        var fullpath = path.resolve(filename);
        var filestat = fs.statSync(fullpath);

        var server = net.createServer((con) => {
            server.close();
            var readstream = fs.createReadStream(fullpath);
            readstream.pipe(con);
            readstream.on('end', () => {callback()})
        });
        server.listen(0, localAddress, null, () => {
            address = server.address();
            data = {
                filename: basename,
                addr: ip.toLong(addr),
                port: address.port,
                length: filestat.size
            };
            client.ctcp(to, 'privmsg', format(send_template, data))
        });
    });
}

function sendChat(client, to, callback) {
    myip(client.opt.localAddress, (addr) => {
        if (!client.opt.localAddress) {
            var localAddress = '0.0.0.0';
        } else {
            var localAddress = client.opt.localAddress
        }

        var server = net.createServer((con) => {
            server.close();
            callback(new Chat(con));
        });
        server.listen(0, localAddress, null, () => {
            address = server.address();
            data = {
                addr: ip.toLong(addr),
                port: address.port,
            };
            client.ctcp(to, 'privmsg', format(chat_template, data))
        });
    });
}
function parseDCC(line) {
    var tokens = line.split(' ');
    switch (tokens[1].toLowerCase()) {
        case 'send':
            return {
                type: 'send',
                filename: tokens[2],
                addr: ip.fromLong(parseInt(tokens[3])),
                port: parseInt(tokens[4]),
                length: parseInt(tokens[5])
            }
        case 'chat':
            return {
                type: 'chat',
                addr: ip.fromLong(parseInt(tokens[3])),
                port: parseInt(tokens[4]),
            }
    }
}

function acceptChat(client, addr, port, callback) {
    var options = {
        host: addr,
        port: port,
    }
    if (!client.opt.localAddress) {
        options.localAddress = '0.0.0.0';
    } else {
        options.localAddress = client.opt.localAddress
    }
    var client = net.connect(options, () => {
        callback(new Chat(client));
    });
}

module.exports.sendFile = sendFile;
module.exports.sendChat = sendChat;
module.exports.parseDCC = parseDCC;
module.exports.acceptChat = acceptChat;
module.exports.patch = patch;
