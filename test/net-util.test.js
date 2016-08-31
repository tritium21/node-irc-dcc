/* global afterEach, it, describe */
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

const http = require("http");
const net = require("net");

describe("fromIpify", function () {
    
    var fakeEE = {
        on: simple.stub()
    };
    var get_stub = simple.stub()
    before(() => {
        simple.mock(http, "get", get_stub);
    });
    afterEach(() => {
        get_stub.reset();
        fakeEE.on.reset();
    });
    after(() => {
        simple.restore();
    })
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
    it("should bind to data", () => {
        http.get.callbackWith(fakeEE);
        netUtil.fromIpify(null, () => { });
        assert.equal(fakeEE.on.lastCall.args[0], "data");
    });
    it("should callback with 192.168.1.100", (done) => {
        http.get.callbackWith(fakeEE);
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
    it('should just be doing max+1 right now', () => {
        assert.equal(netUtil.getRandomInt(2000, 2020), 2021);
    });
});
describe("getUnusedPort", () => {
    var fakeCreate = simple.stub();
    var fakeRand = simple.stub();
    var fakeServer = {
        once: simple.stub(),
        listen: simple.stub(),
        close: simple.stub(),
        on: simple.stub()
    };
    before(() => {
        simple.mock(net, "createServer", fakeCreate);
        simple.mock(netUtil, "getRandomInt", fakeRand);
    });
    afterEach(() => {
        fakeCreate.reset();
        fakeRand.reset();
        fakeServer.once.reset();
        fakeServer.on.reset();
        fakeServer.listen.reset();
        fakeServer.close.reset();
    });
    after(() => {
        simple.restore();
    });
    it("should call getRandomInt with 2000, 2020", () => {
        fakeCreate.returnWith(fakeServer);
        netUtil.getUnusedPort({ min: 2000, max: 2020, localAddress: "192.168.1.100" }, () => { });
        assert.deepEqual(fakeRand.lastCall.args, [2000, 2020]);
    });
    it("should callback with 2001", (done) => {
        var options = { min: 2000, max: 2020, localAddress: "192.168.1.100" };
        fakeRand.returnWith(2001);
        fakeServer.listen.callbackWith();
        fakeServer.once.callbackWith();
        fakeCreate.returnWith(fakeServer);
        netUtil.getUnusedPort(options, (port) => {
            assert.equal(port, 2001);
            done()
        });
    });
    it("should recurse and callback with 2001", (done) => {
        var options = { min: 2000, max: 2020, localAddress: "192.168.1.100" };
        fakeRand.returnWith(9999).returnWith(2001);
        netUtil.getUnusedPort(options, (port) => {
            assert.equal(port, 2001);
            done()
        });
        fakeServer.on.callbackWith();
        fakeServer.once.callbackWith();
    });
});