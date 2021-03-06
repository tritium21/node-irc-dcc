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

const dns = require("dns");
const http = require("http");
const net = require("net");
const ip = require("ip");

module.exports.ipcache = null;

module.exports.getMyIP = (addr, callback) => {
    if (module.exports.ipcache != null) {
        callback(module.exports.ipcache);
    } else if (net.isIPv4(addr) && !ip.isPrivate(addr)) {
        module.exports.ipcache = addr;
        callback(module.exports.ipcache);
    } else if (net.isIPv4(addr) && ip.isPrivate(addr)) {
        module.exports.fromIpify(addr, (address) => { callback(address); });
    } else {
        dns.lookup(addr, { family: 4 }, (err, address) => {
            if (err || ip.isPrivate(address)) {
                module.exports.fromIpify((addr) => { callback(addr); });
            } else {
                module.exports.ipcache = address;
                callback(module.exports.ipcache);
            }
        });
    }
};
module.exports.fromIpify = function (addr, callback) {
    var opts = { "host": "api.ipify.org", "port": 80, "path": "/" };
    if (addr) {
        opts.localAddress = addr;
    }
    http.get(opts, function (resp) {
        resp.on("data", function (ip) {
            module.exports.ipcache = ip + "";
            callback(ip + "");
        });
    });
};

module.exports.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.getUnusedPort = (options, callback) => {
    var min = options.min;
    var max = options.max;
    var localAddress = options.localAddress;

    var port = module.exports.getRandomInt(min, max);
    var server = net.createServer();

    server.listen(port, localAddress, () => {
        server.once("close", function () {
            callback(port);
        });
        server.close();
    });

    server.on("error", () => {
        module.exports.getUnusedPort(options, callback);
    });
};