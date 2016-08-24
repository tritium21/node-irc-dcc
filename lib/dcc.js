const net = require('net');
const path = require('path');
const fs = require('fs');

const ip = require('ip');
const format = require('string-format');

const myip = require('./myip');

const send_template = "\x01DCC SEND {filename} {addr} {port} {length}\x01";

function sendFile(client, to, filename) {
    myip(self.opt.localAddress, (addr) => {
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
        });
        server.listen(0, localAddress, null, () => {
            address = server.address();
            data = {
                filename: basename,
                addr: ip.toLong(addr),
                port: address.port,
                length: filestat.size
            };
            client.say(to, format(send_template, data))
        });
    });
}

exports.sendFile = sendFile;