/* global after, afterEach, before, beforeEach, it, describe */
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

const assert = require("assert");
const simple = require("simple-mock");
const netUtil = require("../lib/net-util");

const dns = require("dns");
const http = require("http");
const net = require("net");
const ip = require("ip");

describe("getMyIP", () => {
    before(() => {
        simple.mock(net, "isIPv4");
        net.isIPv4.loop = false;
        simple.mock(ip, "isPrivate");
        ip.isPrivate.loop = false;
        simple.mock(netUtil, "fromIpify");
        netUtil.fromIpify.loop = false;
        simple.mock(dns, "lookup");
        dns.lookup.loop = false;
    });
    afterEach(() => {
        netUtil.ipcache = null;
    });
    after(() => {
        simple.restore();
    });
    it("should callback with 192.168.1.100 (overide ipcache)", (done) => {
        netUtil.ipcache = "192.168.1.100";
        netUtil.getMyIP(null, (addr) => {
            assert.equal(addr, "192.168.1.100");
            done();
        });
    });
    it("should callback with invalid (from argument)", (done) => {
        net.isIPv4.returnWith(true);
        ip.isPrivate.returnWith(false);
        netUtil.getMyIP("invalid", (addr) => {
            assert.equal(addr, "invalid");
            assert(!netUtil.fromIpify.called);
            done();
        });
    });
    it("should callback with 192.168.1.100 (from ipify)", (done) => {
        net.isIPv4.returnWith(true).returnWith(true);
        ip.isPrivate.returnWith(true).returnWith(true);
        netUtil.fromIpify.callbackWith("192.168.1.100")
        netUtil.getMyIP("invalid", (addr) => {
            assert.equal(addr, "192.168.1.100");
            done();
        });
    });
    it("should callback with 192.168.1.100 (from ipify via dns, err)", (done) => {
        net.isIPv4.returnWith(false).returnWith(false);
        dns.lookup.callbackWith(new Error(), null);
        netUtil.fromIpify.callbackWith("192.168.1.100")
        netUtil.getMyIP("invalid", (addr) => {
            assert.equal(addr, "192.168.1.100");
            done();
        });
    });
    it("should callback with 192.168.1.100 (from ipify via dns, private)", (done) => {
        net.isIPv4.returnWith(false).returnWith(false);
        ip.isPrivate.returnWith(true);
        dns.lookup.callbackWith(null, null);
        netUtil.fromIpify.callbackWith("192.168.1.100")
        netUtil.getMyIP("invalid", (addr) => {
            assert.equal(addr, "192.168.1.100");
            done();
        });
    });
    it("should callback with 192.168.1.100 (from dns)", (done) => {
        net.isIPv4.returnWith(false).returnWith(false);
        ip.isPrivate.returnWith(false);
        dns.lookup.callbackWith(null, "192.168.1.100");
        netUtil.getMyIP("invalid", (addr) => {
            assert.equal(addr, "192.168.1.100");
            done();
        });
    });
});

describe("fromIpify", function () {
    var fakeEE;

    before(() => {
        fakeEE = {
            on: simple.stub()
        };
        fakeEE.loop = false;

        simple.mock(http, "get");
        http.get.callbackWith(fakeEE);
        http.get.loop = true;
    });
    afterEach(() => {
        http.get.reset();
        fakeEE.on.reset();
    });
    after(() => {
        simple.restore();
    });
    it("should not set localAddress", () => {
        netUtil.fromIpify(null, () => {});
        var expected = { "host": "api.ipify.org", "port": 80, "path": "/" };
        assert.deepEqual(http.get.lastCall.args[0], expected);
    });
    it("should set localAddress", () => {
        netUtil.fromIpify("192.168.1.100", () => { });
        var expected = { "host": "api.ipify.org", "port": 80, "path": "/", "localAddress": "192.168.1.100"};
        assert.deepEqual(http.get.lastCall.args[0], expected);
    });
    it("should callback with 192.168.1.100", (done) => {
        fakeEE.on.callbackWith("192.168.1.100");
        netUtil.fromIpify(null, (ip) => {
            assert.equal(ip, "192.168.1.100");
            done();
        });
    });
});
describe("getRandomInt", () => {
    before(() => {
        simple.mock(Math, "random", () => { return 1; });
    });
    after(() => {
        simple.restore();
    });
    it("should just be doing max+1 right now", () => {
        assert.equal(netUtil.getRandomInt(2000, 2020), 2021);
    });
});
describe("getUnusedPort", () => {
    var fakeServer;

    before(() => {
        fakeServer = {
            once: simple.stub(),
            listen: simple.stub(),
            close: () => { },
            on: simple.stub()
        };
        fakeServer.listen.loop = false;
        fakeServer.on.loop = false;
        fakeServer.once.loop = false;

        simple.mock(net, "createServer");
        net.createServer.loop = false;
        simple.mock(netUtil, "getRandomInt");
        netUtil.getRandomInt.loop = false;
    });
    after(() => {
        simple.restore();
    });
    afterEach(() => {
        net.createServer.reset();
        netUtil.getRandomInt.reset();
        fakeServer.once.reset();
        fakeServer.on.reset();
        fakeServer.listen.reset();
    });
    it("should call getRandomInt with 2000, 2020", () => {
        net.createServer.returnWith(fakeServer);
        netUtil.getUnusedPort({ min: 2000, max: 2020, localAddress: "192.168.1.100" }, () => { });
        assert.deepEqual(netUtil.getRandomInt.lastCall.args, [2000, 2020]);
    });
    it("should callback with 2001", (done) => {
        var options = { min: 2000, max: 2020, localAddress: "192.168.1.100" };
        netUtil.getRandomInt.returnWith(2001);
        fakeServer.listen.callbackWith();
        fakeServer.once.callbackWith();
        net.createServer.returnWith(fakeServer);
        netUtil.getUnusedPort(options, (port) => {
            assert.equal(port, 2001);
            done();
        });
    });
    it("should recurse and callback with 2002", (done) => {
        var options = { min: 2000, max: 2020, localAddress: "192.168.1.100" };
        netUtil.getRandomInt.returnWith(9999).returnWith(2002);
        fakeServer.listen.callbackWith().callbackWith();
        fakeServer.on.callbackWith();
        fakeServer.once.callFn(() => { }).callbackWith();
        net.createServer.returnWith(fakeServer).returnWith(fakeServer);
        netUtil.getUnusedPort(options, (port) => {
            assert.equal(port, 2002);
            done();
        });
    });
});