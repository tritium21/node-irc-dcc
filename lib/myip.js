const dns = require('dns');
const http = require('http');
const net = require('net');
const util = require('util');

const ip = require('ip');

var myip = null;

module.exports = function() {
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
        } else if (net.isIPv4(self.addr) && ip.isPrivate(self.addr)) {
            fromIpify(addr, (address) => {callback(address);});
        } else {
            dns.lookup(addr, {family: 4}, (err, address, family) => {
                if (err || ip.isPrivate(address)) {
                    fromIpify((addr) => {callback(addr);});
                } else {
                    myip = address;
                    callback(myip);
                }
            });
        }
    } else if (ip.isPublic(ip.address())) {
        self.myip = ip.address();
        callback(myip);
    } else {
        fromIpify((addr) => {callback(addr);});
    }
}
var fromIpify = function() {
    var opts = {'host': 'api.ipify.org', 'port': 80, 'path': '/'};
    if (arguments.length == 2 && net.isIPv4(arguments[0])) {
        opts.localAddress = arguments[0];
        var callback = arguments[1];
    } else {
        var callback = arguments[0];
    }
    http.get(opts, function(resp) {
        resp.on('data', function(ip) {
            myip = ip + '';
            callback(ip + '');
        });
    });
}
