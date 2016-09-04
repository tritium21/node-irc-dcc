/* global afterEach, before, after, it, describe */
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

var assert = require("assert");
var simple = require("simple-mock");
var DCC = require("../lib/dcc");
var netUtil = require("../lib/net-util");
var ip = require("ip");
var net = require("net");

describe("DCC.parseDCC()", function () {
    it("should return null", function () {
        var args = DCC.parseDCC("This is not a dcc message");
        assert.equal(args, null);
    });
    it("should return a send", function () {
        var args = DCC.parseDCC("DCC SEND foo_bar.pdf 3232235876 6500 95871");
        var expected = {
            type: "send",
            long: 3232235876,
            host: "192.168.1.100",
            port: 6500,
            filename: "foo_bar.pdf",
            length: 95871
        };
        assert.deepEqual(args, expected);
    });
    it("should return a chat", function () {
        var args = DCC.parseDCC("DCC CHAT chat 3232235876 6500");
        var expected = {
            type: "chat",
            long: 3232235876,
            host: "192.168.1.100",
            port: 6500,
        };
        assert.deepEqual(args, expected);
    });
    it("should return an accept", function () {
        var args = DCC.parseDCC("DCC ACCEPT foo_bar.pdf 6500 31565");
        var expected = {
            type: "accept",
            port: 6500,
            filename: "foo_bar.pdf",
            position: 31565
        };
        assert.deepEqual(args, expected);
    });
    it("should return a resume", function () {
        var args = DCC.parseDCC("DCC RESUME foo_bar.pdf 6500 31565");
        var expected = {
            type: "resume",
            port: 6500,
            filename: "foo_bar.pdf",
            position: 31565
        };
        assert.deepEqual(args, expected);
    });
});

describe("DCC", () => {
    describe("(constructor)", () => {
        var fakeClient;
        before(() => {
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                removeListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
                once: simple.stub()
            };
        });
        afterEach(() => {
            fakeClient.addListener.reset();
            fakeClient.removeListener.reset();
            fakeClient.emit.reset();
            fakeClient.ctcp.reset();
            fakeClient.once.reset();
        });
        after(() => {
            simple.restore();
        });
        describe("Client.addListener", () => {
            it("should addListener once", () => {
                new DCC(fakeClient, {});
                assert.equal(fakeClient.addListener.callCount, 1);
            });
            it("should addListener ctcp-privmsg", () => {
                new DCC(fakeClient, {});
                assert.equal(fakeClient.addListener.lastCall.args[0], "ctcp-privmsg");
            });
        });
        describe("Client.emit", () => {
            it("should emit DCC SEND", () => {
                new DCC(fakeClient, {});
                var hnd = fakeClient.addListener.lastCall.args[1];
                var expected = [
                    "dcc-send",
                    "user",
                    {
                        type: "send",
                        long: 3232235876,
                        host: "192.168.1.100",
                        port: 6500,
                        filename: "foo_bar.pdf",
                        length: 95871
                    },
                    "message"
                ];
                hnd("user", null, "DCC SEND foo_bar.pdf 3232235876 6500 95871", "message");
                assert.deepEqual(fakeClient.emit.lastCall.args, expected);
            });
            it("should not emit anything", () => {
                new DCC(fakeClient, {});
                var hnd = fakeClient.addListener.lastCall.args[1];
                hnd("user", null, "PING 12345678", "message");
                assert.equal(fakeClient.emit.callCount, 0);
            });
        });
        describe("Attributes", () => {
            it("should set the ports to 0 (automatic)", () => {
                var dcc = new DCC(fakeClient, {});
                assert.equal(dcc.ports, 0);
            });
            it("should set the ports to [2000, 2020] (from options)", () => {
                var dcc = new DCC(fakeClient, { ports: [2000, 2020] });
                assert.deepEqual(dcc.ports, [2000, 2020]);
            });
            it("should set localAddress to 192.168.1.100 (automatic)", () => {
                simple.mock(ip, "address").returnWith("192.168.1.100");
                var dcc = new DCC(fakeClient, {});
                assert.equal(dcc.localAddress, "192.168.1.100");
            });
            it("should set localAddress to 192.168.1.100 (from client)", () => {
                var temp = {
                    opt: { localAddress: "192.168.1.100" },
                    addListener: simple.stub(),
                    emit: simple.stub(),
                };
                simple.mock(ip, "address").returnWith("INVALID");
                var dcc = new DCC(temp, {});
                assert.equal(dcc.localAddress, "192.168.1.100");
            });
            it("should set localAddress to 192.168.1.100 (from options)", () => {
                simple.mock(ip, "address").returnWith("INVALID");
                var dcc = new DCC(fakeClient, { localAddress: "192.168.1.100" });
                assert.equal(dcc.localAddress, "192.168.1.100");
            });
        });
    });
    describe("#getIP", () => {
        var fakeClient;
        before(() => {
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                removeListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
                once: simple.stub()
            };
        });
        after(() => {
            simple.restore();
        });
        it("should callback with 192.168.1.100", (done) => {
            var dcc = new DCC(fakeClient, {});
            simple.mock(netUtil, "getMyIP").callbackWith("192.168.1.100");
            dcc.getIP((host) => {
                assert.equal(host, "192.168.1.100");
                done();
            });
        });
    });
    describe("#getPort", () => {
        var fakeClient;
        before(() => {
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                removeListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
                once: simple.stub()
            };
        });
        after(() => {
            simple.restore();
        });
        it("should callback with 0 (options.ports: 0)", (done) => {
            var dcc = new DCC(fakeClient, {ports: 0});
            simple.mock(netUtil, "getUnusedPort").callbackWith(99999);
            dcc.getPort((port) => {
                assert.equal(port, 0);
                done();
            });
        });
        it("should callback with 2000", (done) => {
            var dcc = new DCC(fakeClient, { ports: [2000, 2020] });
            simple.mock(netUtil, "getUnusedPort").callbackWith(2000);
            dcc.getPort((port) => {
                assert.equal(port, 2000);
                done();
            });
        });
    });
    describe("#getPortIP", () => {
        var fakeClient;
        before(() => {
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                removeListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
                once: simple.stub()
            };
        });
        after(() => {
            simple.restore();
        });
        it("should callback with 192.168.1.100:2000", (done) => {
            var dcc = new DCC(fakeClient, { ports: [2000, 2020] });
            simple.mock(netUtil, "getUnusedPort").callbackWith(2000);
            simple.mock(netUtil, "getMyIP").callbackWith("192.168.1.100");
            dcc.getPortIP((details) => {
                var expected = {
                    host: "192.168.1.100",
                    long: 3232235876,
                    port: 2000
                };
                assert.deepEqual(details, expected);
                done();
            });
        });
    });
    describe("#acceptFile", () => {
        var fakeClient;
        before(() => {
            simple.mock(DCC, "acceptAndConnectFile");
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
                once: simple.stub()
            };
            DCC.acceptAndConnectFile.loop = false;
            fakeClient.addListener.loop = false;
            fakeClient.emit.loop = false;
            fakeClient.ctcp.loop = false;
            fakeClient.once.loop = false;
        });
        afterEach(() => {
            DCC.acceptAndConnectFile.reset();
            fakeClient.addListener.reset();
            fakeClient.emit.reset();
            fakeClient.ctcp.reset();
            fakeClient.once.reset();
        });
        after(() => {
            simple.restore();
        });
        it("should call acceptAndConnectFile (no position)", () => {
            var fakeCB = () => { };
            var expected = [
                {
                    host: "192.168.1.100",
                    port: 2000,
                    localAddress: "0.0.0.0"
                },
                "filename",
                fakeCB
            ];
            var dcc = new DCC(fakeClient, {localAddress: "0.0.0.0"});
            dcc.acceptFile("nick", "192.168.1.100", 2000, "filename", 1234567, fakeCB);
            assert.deepEqual(DCC.acceptAndConnectFile.lastCall.args, expected);
        });
        it("should call acceptAndConnectFile (with position)", () => {
            var fakeCB = () => { };
            var expected = [
                {
                    host: "192.168.1.100",
                    port: 2000,
                    localAddress: "0.0.0.0"
                },
                "filename",
                fakeCB
            ];
            fakeClient.once.callbackWith("nick", {filename: "filename", port: 2000});
            var dcc = new DCC(fakeClient, { localAddress: "0.0.0.0" });
            dcc.acceptFile("nick", "192.168.1.100", 2000, "filename", 1234567, 1234, fakeCB);
            assert.deepEqual(DCC.acceptAndConnectFile.lastCall.args, expected);
        });
        it("should call irc.Client.ctcp (with position)", () => {
            var fakeCB = () => { };
            var expected = ["nick", "privmsg", "DCC RESUME filename 2000 1234"];
            var dcc = new DCC(fakeClient, { localAddress: "0.0.0.0" });
            dcc.acceptFile("nick", "192.168.1.100", 2000, "filename", 1234567, 1234, fakeCB);
            assert.deepEqual(fakeClient.ctcp.lastCall.args, expected);
        });
    });
    describe("#sendFile", () => {
        var fakeClient;
        var fakeCon;
        var fakeServer;
        before(() => {
            simple.mock(net, "createServer");
            simple.mock(DCC.prototype, "getPortIP");
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                removeListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
                once: simple.stub()
            };

            fakeServer = {
                close: simple.stub(),
                listen: simple.stub(),
                address: simple.stub(),
                on: simple.stub()
            };
            fakeCon = {
                addListener: simple.stub(),
                setTimeout: simple.stub(),
            };
            net.createServer.loop = false;
            DCC.prototype.getPortIP.loop = false;
            fakeClient.addListener.loop = false;
            fakeClient.removeListener.loop = false;
            fakeClient.emit.loop = false;
            fakeClient.ctcp.loop = false;
            fakeClient.once.loop = false;
            fakeServer.close.loop = false;
            fakeServer.listen.loop = false;
            fakeServer.address.loop = false;
            fakeServer.on.loop = false;
            fakeCon.addListener.loop = false;
            fakeCon.setTimeout.loop = false;
        });
        afterEach(() => {
            net.createServer.reset();
            DCC.prototype.getPortIP.reset();
            fakeClient.addListener.reset();
            fakeClient.removeListener.reset();
            fakeClient.emit.reset();
            fakeClient.ctcp.reset();
            fakeClient.once.reset();
            fakeServer.close.reset();
            fakeServer.listen.reset();
            fakeServer.address.reset();
            fakeServer.on.reset();
            fakeCon.addListener.reset();
            fakeCon.setTimeout.reset();
        });
        after(() => {
            simple.restore();
        });
        it("should callback with a fake connection", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, (err, con) => {
                assert.equal(fakeCon, con);
                done();
            });
        });
        it("should remove listener", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, () => { done(); });
            assert(fakeClient.removeListener.called);
        });
        it("should close the server", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, () => { done(); });
            assert(fakeServer.close.called);
        });
        it("should send a DCC SEND message", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            fakeServer.address.returnWith({ port: 2000 });
            fakeServer.listen.callbackWith();
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, () => { done(); });
            assert.deepEqual(
                fakeClient.ctcp.lastCall.args,
                ["to", "privmsg", "DCC SEND filename 3232235876 2000 0"]
            );
        });
        it("should callback with pos == 0", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            fakeServer.address.returnWith({ port: 2000 });
            fakeServer.listen.callbackWith();
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, (err, con, pos) => {
                assert.equal(pos, 0);
                done();
            });
        });
        it("should not resume", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.address.returnWith({ port: 2000 });
            fakeServer.listen.callbackWith();
            fakeClient.once.callbackWith(
                "to",
                {
                    filename: "filename2",
                    port: 2000,
                    position: 50
                }
            );
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, () => {
                done();
            });
            assert.deepEqual(
                fakeClient.ctcp.lastCall.args,
                ["to", "privmsg", "DCC SEND filename 3232235876 2000 0"]
            );
        });
        it("should resume", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.address.returnWith({ port: 2000 });
            fakeServer.listen.callbackWith();
            fakeClient.once.callbackWith(
                "to",
                {
                    filename: "filename",
                    port: 2000,
                    position: 50
                }
            );
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, () => {
                done();
            });
            assert.deepEqual(
                fakeClient.ctcp.lastCall.args,
                ["to", "privmsg", "DCC ACCEPT filename 2000 50"]
            );
        });
        it("should callback with pos == 50", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.address.returnWith({ port: 2000 });
            fakeServer.listen.callbackWith();
            fakeClient.once.callbackWith(
                "to",
                {
                    filename: "filename",
                    port: 2000,
                    position: 50
                }
            );
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendFile("to", "filename", 0, (err, con, pos) => {
                assert.equal(pos, 50);
                done();
            });
        });

    });
    describe("#acceptChat", () => {
        var fakeClient;
        var fakeCon;
        before(() => {
            fakeCon = {
                on: simple.stub(),
                addListener: simple.stub()
            };
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                emit: simple.stub(),
            };
            simple.mock(net, "connect");
            net.createServer.loop = false;
            fakeCon.addListener.loop = false;
            fakeCon.on.loop = false;
        });
        afterEach(() => {
            net.connect.reset();
            fakeCon.addListener.reset();
            fakeCon.on.reset();
        });
        after(() => {
            simple.restore();
        });
        it("should attempt to connect", () => {
            var dcc = new DCC(fakeClient, { localAddress: "192.168.1.50" });
            dcc.acceptChat("192.168.1.100", 1234, () => { });
            var expected = {
                host: "192.168.1.100",
                port: 1234,
                localAddress: "192.168.1.50"
            };
            assert.deepEqual(expected, net.connect.lastCall.args[0]);
        });
        it("should callback with Chat of con", (done) => {
            net.connect.returnWith(fakeCon);
            fakeCon.on.callbackWith();
            var dcc = new DCC(fakeClient, { localAddress: "192.168.1.50" });
            dcc.acceptChat("192.168.1.100", 1234, (err, chat) => {
                assert.equal(chat.connection, fakeCon);
                done();
            });
        });
    });
    describe("#sendChat", () => {
        var fakeClient;
        var fakeCon;
        var fakeServer;
        before(() => {
            simple.mock(net, "createServer");
            simple.mock(DCC.prototype, "getPortIP");
            fakeClient = {
                opt: {},
                addListener: simple.stub(),
                emit: simple.stub(),
                ctcp: simple.stub(),
            };
            fakeCon = {
                on: simple.stub(),
                addListener: simple.stub()
            };
            fakeServer = {
                listen: simple.stub(),
                address: simple.stub(),
                on: simple.stub(),
                close: simple.stub()
            };
            net.createServer.loop = false;
            DCC.prototype.getPortIP.loop = false;
            fakeClient.ctcp.loop = false;
            fakeServer.listen.loop = false;
            fakeServer.address.loop = false;
            fakeServer.on.loop = false;
        });
        afterEach(() => {
            net.createServer.reset();
            DCC.prototype.getPortIP.reset();
            fakeClient.ctcp.reset();
            fakeServer.listen.reset();
            fakeServer.address.reset();
            fakeServer.on.reset();
        });
        after(() => {
            simple.restore();
        });
        it("should send a DCC CHAT", (done) => {
            var expected = ["to", "privmsg", "DCC CHAT chat 3232235876 2000"];
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.listen.callbackWith();
            fakeServer.address.returnWith({ port: 2000 });
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendChat("to", () => { done(); });
            assert.deepEqual(fakeClient.ctcp.lastCall.args, expected);
        });
        it("should close the server", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendChat("to", () => { done(); });
            assert(fakeServer.close.called);
        });
        it("should callback with Chat of con", (done) => {
            DCC.prototype.getPortIP.callbackWith({
                host: "192.168.1.100",
                long: 3232235876,
                port: 2000
            });
            net.createServer.returnWith(fakeServer);
            fakeServer.on.callbackWith(fakeCon);
            var dcc = new DCC(fakeClient, {});
            dcc.sendChat("to", (err, chat) => {
                assert.equal(chat.connection, fakeCon);
                done();
            });
        });
    });
});