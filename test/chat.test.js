var assert = require('assert');
var simple = require('simple-mock');

describe('Chat', () => {
    var Chat = require('../lib/chat');
    var stub_con = {
        addListener: simple.stub(),
        emit: simple.stub(),
        write: simple.stub(),
        end: simple.stub()
    };

    afterEach(() => {
        stub_con.addListener.reset();
        stub_con.write.reset();
        stub_con.end.reset();
    });
    describe('listen', () => {
        it('should listen for data events', () => {
            var chat = new Chat(stub_con);
            assert.equal(stub_con.addListener.lastCall.args[0], "data");
        });
    });
    describe('emit', () => {
        it('should emit lines', () => {
            var chat = new Chat(stub_con);
            simple.mock(chat, "emit");
            var hnd = stub_con.addListener.lastCall.args[1];
            hnd("this is a line\r\n");
            assert.equal(chat.emit.lastCall.args[0], "line");
            assert.equal(chat.emit.lastCall.args[1], "this is a line");
        });
    });
    describe('#say', () => {
        it('should write without error', () => {
            var chat = new Chat(stub_con);
            chat.say("this is a test")
            assert.equal(stub_con.write.lastCall.args, "this is a test\r\n");
        });
    });
    describe('#disconnect', () => {
        it('should disconnect with #end', () => {
            var chat = new Chat(stub_con);
            chat.disconnect();
            assert.equal(stub_con.end.callCount, 1);
        });
    })
});