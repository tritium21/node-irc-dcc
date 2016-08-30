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
var Chat = require('../lib/chat');

describe('Chat', () => {
    var stub_con = {
        addListener: simple.stub(),
        emit: simple.stub(),
        write: simple.stub(),
        end: simple.stub()
    };

    afterEach(() => {
        simple.restore()
        stub_con.addListener.reset();
        stub_con.write.reset();
        stub_con.end.reset();
    });
    describe('(constructor)', () => {
        it('should listen for data events', () => {
            var chat = new Chat(stub_con);
            assert.equal(stub_con.addListener.lastCall.args[0], "data");
        });
        it('should emit lines (from string)', () => {
            var chat = new Chat(stub_con);
            simple.mock(chat, "emit");
            var hnd = stub_con.addListener.lastCall.args[1];
            hnd("this is a");
            hnd(" line\r\n");
            assert.deepEqual(chat.emit.lastCall.args, ["line", "this is a line"]);
        });
        it('should emit lines (from buffer)', () => {
            var chat = new Chat(stub_con);
            simple.mock(chat, "emit");
            var hnd = stub_con.addListener.lastCall.args[1];
            hnd(new Buffer("this is a", "utf8"));
            hnd(new Buffer(" line\r\n", "utf8"));
            assert.deepEqual(chat.emit.lastCall.args, ["line", "this is a line"]);
        });
        it('should eat the error', () => {
            assert.doesNotThrow(() => {
                var temp = {
                    addListener: simple.stub(),
                    emit: simple.stub(),
                    write: simple.stub(),
                    end: simple.stub(),
                    requestedDisconnect: true
                };
                var chat = new Chat(temp);
                var hnd = temp.addListener.lastCall.args[1];
                simple.mock(chat, "emit").throwWith(new TypeError());
                hnd('this is a line\r\n')
            }, TypeError);
        });
        it('should not eat the error', () => {
            assert.throws(() => {
                var chat = new Chat(stub_con);
                var hnd = stub_con.addListener.lastCall.args[1];
                simple.mock(chat, "emit").throwWith(new TypeError());
                hnd('this is a line\r\n');
            }, TypeError);
        });
    });
    describe('#say()', () => {
        it('should write without error', () => {
            var chat = new Chat(stub_con);
            chat.say("this is a test")
            assert.equal(stub_con.write.lastCall.args, "this is a test\r\n");
        });
    });
    describe('#disconnect()', () => {
        it('should disconnect with #end', () => {
            var chat = new Chat(stub_con);
            chat.disconnect();
            assert.equal(stub_con.end.callCount, 1);
        });
    });
});