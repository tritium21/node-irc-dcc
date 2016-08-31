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

describe("fromIpify", function () {
    var http = require("http");
    var fakeEE = {
        on: simple.stub()
    };
    beforeEach(() => {
        simple.mock(http, "get");
    });
    afterEach(() => {
        simple.restore();
        fakeEE.on.reset();
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
