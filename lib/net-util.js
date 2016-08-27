// stdlib
const dns = require("dns");
const http = require("http");
const net = require("net");

// third party
const ip = require("ip");

var ipcache = null;

const getMyIP = module.exports.getMyIP = () => {
    var addr, callback;
    if (arguments.length == 2) {
        addr = arguments[0];
        callback = arguments[1];
    } else {
        addr = null;
        callback = arguments[0];
    }

    if (ipcache != null) {
        callback(ipcache);
    } else if (addr != null) {
        if (net.isIPv4(addr) && ip.isPublic(addr)) {
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
    } else if (ip.isPublic(ip.address())) {
        ipcache = ip.address();
        callback(ipcache);
    } else {
        fromIpify((addr) => { callback(addr); });
    }
};
var fromIpify = function () {
    var opts = { "host": "api.ipify.org", "port": 80, "path": "/" };
    var callback;
    if (arguments.length == 2 && net.isIPv4(arguments[0])) {
        opts.localAddress = arguments[0];
        callback = arguments[1];
    } else {
        callback = arguments[0];
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
    if (!min) {
        callback(null, 0);
        return;
    }
    var max = options.max;
    var localAddress = options.localAddress;
    var port = getRandomInt(min, max);

    var server = net.createServer();

    server.listen(port, localAddress, (err) => {
        server.once("close", function () {
            var env = options.env;
            if (env && typeof (env) === "string") {
                process.env[env] = port;
            }

            callback(err, port);
        });
        server.close();
    });

    server.on("error", () => {
        getUnusedPort(options, callback);
    });
};