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

var assert = require('assert');
var simple = require('simple-mock');
var DCC = require('../lib/dcc');
var netUtil = require('../lib/net-util');
var ip = require('ip')

describe('DCC.parseDCC()', function() {
    it('should return null', function () {
        var args = DCC.parseDCC('This is not a dcc message')
        assert.equal(args, null);
    })
    it('should return a send', function () {
        var args = DCC.parseDCC('DCC SEND foo_bar.pdf 3232235876 6500 95871')
        var expected = {
            type: 'send',
            long: 3232235876,
            host: '192.168.1.100',
            port: 6500,
            filename: 'foo_bar.pdf',
            length: 95871
        }
        assert.deepEqual(args, expected);
    })
    it('should return a chat', function () {
        var args = DCC.parseDCC('DCC CHAT chat 3232235876 6500')
        var expected = {
            type: 'chat',
            long: 3232235876,
            host: '192.168.1.100',
            port: 6500,
        }
        assert.deepEqual(args, expected);
    })
    it('should return an accept', function () {
        var args = DCC.parseDCC('DCC ACCEPT foo_bar.pdf 6500 31565')
        var expected = {
            type: 'accept',
            port: 6500,
            filename: 'foo_bar.pdf',
            position: 31565
        }
        assert.deepEqual(args, expected);
    })
    it('should return a resume', function () {
        var args = DCC.parseDCC('DCC RESUME foo_bar.pdf 6500 31565')
        var expected = {
            type: 'resume',
            port: 6500,
            filename: 'foo_bar.pdf',
            position: 31565
        }
        assert.deepEqual(args, expected);
    })
})

describe('DCC', () => {
    var stub_client = {
        opt: {},
        addListener: simple.stub(),
        emit: simple.stub(),
    };
    afterEach(() => {
        simple.restore()
        stub_client.addListener.reset();
        stub_client.emit.reset();
    });
    describe('(constructor)', () => {
        describe('Client.addListener', () => {
            it('should addListener once', () => {
                var dcc = new DCC(stub_client, {});
                assert.equal(stub_client.addListener.callCount, 1);
            });
            it('should addListener ctcp-privmsg', () => {
                var dcc = new DCC(stub_client, {});
                assert.equal(stub_client.addListener.lastCall.args[0], "ctcp-privmsg");
            });
        });
        describe('Client.emit', () => {
            it('should emit DCC SEND', () => {
                var dcc = new DCC(stub_client, {});
                var hnd = stub_client.addListener.lastCall.args[1];
                var expected = [
                    'dcc-send',
                    'user',
                    {
                        type: 'send',
                        long: 3232235876,
                        host: '192.168.1.100',
                        port: 6500,
                        filename: 'foo_bar.pdf',
                        length: 95871
                    },
                    'message'
                ]
                hnd('user', null, 'DCC SEND foo_bar.pdf 3232235876 6500 95871', 'message');
                assert.deepEqual(stub_client.emit.lastCall.args, expected);
            });
            it('should not emit anything', () => {
                var dcc = new DCC(stub_client, {});
                var hnd = stub_client.addListener.lastCall.args[1];
                hnd('user', null, 'PING 12345678', 'message');
                assert.equal(stub_client.emit.callCount, 0);
            });
        });
        describe('Attributes', () => {
            it('should set the ports to 0', () => {
                var dcc = new DCC(stub_client, {});
                assert.equal(dcc.ports, 0)
            });
            it('should set the ports to [2000, 2020]', () => {
                var dcc = new DCC(stub_client, { ports: [2000, 2020] });
                assert.deepEqual(dcc.ports, [2000, 2020])
            });
            it('should set localAddress to 192.168.1.100 (automatic)', () => {
                simple.mock(ip, 'address').returnWith('192.168.1.100');
                var dcc = new DCC(stub_client, {});
                assert.equal(dcc.localAddress, '192.168.1.100');
            });
            it('should set localAddress to 192.168.1.100 (from client)', () => {
                var temp = {
                    opt: { localAddress: '192.168.1.100' },
                    addListener: simple.stub(),
                    emit: simple.stub(),
                };
                var dcc = new DCC(temp, {});
                assert.equal(dcc.localAddress, '192.168.1.100');
            });
            it('should set localAddress to 192.168.1.100 (from options)', () => {
                var dcc = new DCC(stub_client, { localAddress: '192.168.1.100' });
                assert.equal(dcc.localAddress, '192.168.1.100');
            });
            it('should set the timeout to 30000', () => {
                var dcc = new DCC(stub_client, {});
                assert.equal(dcc.timeout, 30000);
            });
            it('should set the timeout to 8675309 (from options)', () => {
                var dcc = new DCC(stub_client, { timeout: 8675309 });
                assert.equal(dcc.timeout, 8675309);
            });
        });
    });
    describe('#getIP', () => {
        it('should callback with 192.168.1.100', (done) => {
            var dcc = new DCC(stub_client, {});
            simple.mock(netUtil, 'getMyIP').callbackWith('192.168.1.100')
            dcc.getIP((host) => {
                assert.equal(host, '192.168.1.100');
                done();
            });
        });
    });
    describe('#getPort', () => {
        it('should callback with 0 (options.ports: 0)', (done) => {
            var dcc = new DCC(stub_client, {ports: 0});
            simple.mock(netUtil, 'getUnusedPort').callbackWith(99999)
            dcc.getPort((port) => {
                assert.equal(port, 0);
                done();
            });
        });
        it('should callback with 2000', (done) => {
            var dcc = new DCC(stub_client, { ports: [2000, 2020] });
            simple.mock(netUtil, 'getUnusedPort').callbackWith(2000)
            dcc.getPort((port) => {
                assert.equal(port, 2000);
                done();
            });
        });
    });
    describe('#getPortIP', () => {
        it('should callback with 192.168.1.100:2000', (done) => {
            var dcc = new DCC(stub_client, { ports: [2000, 2020] });
            simple.mock(netUtil, 'getUnusedPort').callbackWith(2000)
            simple.mock(netUtil, 'getMyIP').callbackWith('192.168.1.100')
            dcc.getPortIP((details) => {
                var expected = {
                    host: '192.168.1.100',
                    long: 3232235876,
                    port: 2000
                };
                assert.deepEqual(details, expected);
                done();
            });
        });
    });
});