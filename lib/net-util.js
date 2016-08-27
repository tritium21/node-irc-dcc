// stdlib
const dns = require("dns");
const http = require("http");
const net = require("net");

// third party
const ip = require("ip");

var ipcache = null;

const getMyIP = module.exports.getMyIP = (addr, callback) => {
    if (ipcache != null) {
        callback(ipcache);
    } else if (net.isIPv4(addr) && ip.isPublic(addr)) {
        ipcache = addr;
        callback(ipcache);
    } else if (net.isIPv4(addr) && ip.isPrivate(addr)) {
        fromIpify(addr, (address) => { callback(address); });
    } else {
        dns.lookup(addr, { family: 4 }, (err, address) => {
            if (err || ip.isPrivate(address)) {
                fromIpify((addr) => { callback(addr); });
            } else {
                ipcache = address;
                callback(ipcache);
            }
        });
    }
};
var fromIpify = function (addr, callback) {
    var opts = { "host": "api.ipify.org", "port": 80, "path": "/" };
    if (addr) {
        opts.localAddress = addr;
    }
    http.get(opts, function (resp) {
        resp.on("data", function (ip) {
            ipcache = ip + "";
            callback(ip + "");
        });
    });
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getUnusedPort = module.exports.getUnusedPort = (options, callback) => {
    var min = options.min;
    var max = options.max;
    var localAddress = options.localAddress;

    var port = getRandomInt(min, max);
    var server = net.createServer();

    server.listen(port, localAddress, (err) => {
        server.once("close", function () {
            callback(port);
        });
        server.close();
    });

    server.on("error", () => {
        getUnusedPort(options, callback);
    });
};