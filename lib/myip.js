const dns = require('dns');
const events = require('events');
const http = require('http');
const util = require('util');

const ip = require('ip');

exports = MyIP;

// Try REALLY hard to get a publicly accessable IP
// var myip = new MyIP('192.168.1.75')
// myip.on('myip' (addr) => {console.log('got address: ' + addr);})
// myip.lookup()
//
// Should this be MyIP(addr, callback) instead?
// Should this not be a type of its own?
function MyIP(addr) {
    var self = this;
    self.myip = null;
    self.addr = addr;
}
util.inherits(MyIP, events.EventEmitter);
MyIP.prototype.lookup = function() {
    var self = this;
    if (self.myip != null) {
        self.emit('myip', self.myip);
    } else if (self.addr != null) {
        if (ip.isV4Format(self.addr) && ip.isPublic(self.addr)) {
            self.myip = self.addr;
            self.emit('myip', self.addr);
        } else if (ip.isV4Format(self.addr) && ip.isPrivate(self.addr)) {
            self.fromIpify();
        } else {
            dns.lookup(self.addr, {family: 4}, (err, address, family) => {
                if (err || ip.isPrivate(address)) {
                    self.fromIpify();
                } else {
                    self.myip = address;
                    self.emit('myip', address);
                }
            });
        }
    } else if (ip.isPublic(ip.address())) {
        self.myip = ip.address()
        self.emit('myip', self.myip);
    } else {
        self.fromIpify();
    }
}
MyIP.prototype.fromIpify = function() {
    var self = this;
    var opts = {'host': 'api.ipify.org', 'port': 80, 'path': '/'};
    if (self.addr) {
        opts.localAddress = self.addr;
    } 
    http.get(opts, function(resp) {
        resp.on('data', function(ip) {
            self.myip = ip + '';
            self.emit('myip', ip + '');
        });
    });
}