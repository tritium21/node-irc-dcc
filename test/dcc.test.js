var assert = require('assert');
var simple = require('simple-mock');
var DCC = require('../lib/dcc');

describe('parseDCC', function() {
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
