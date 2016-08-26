// stdlib
const dns = require("dns");
const http = require("http");
const net = require("net");

// third party
const ip = require("ip");

var myip = null;

module.exports = function () {
    var addr, callback;
    if (arguments.length == 2) {
        addr = arguments[0];
        callback = arguments[1];
    } else {
        addr = null;
        callback = arguments[0];
    }

    if (myip != null) {
        callback(myip);
    } else if (addr != null) {
        if (net.isIPv4(addr) && ip.isPublic(addr)) {
            myip = addr;
            callback(myip);
        } else if (net.isIPv4(addr) && ip.isPrivate(addr)) {
            fromIpify(addr, (address) => { callback(address); });
        } else {
            dns.lookup(addr, { family: 4 }, (err, address) => {
                if (err || ip.isPrivate(address)) {
                    fromIpify((addr) => { callback(addr); });
                } else {
                    myip = address;
                    callback(myip);
                }
            });
        }
    } else if (ip.isPublic(ip.address())) {
        myip = ip.address();
        callback(myip);
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
            myip = ip + "";
            callback(ip + "");
        });
    });
};
