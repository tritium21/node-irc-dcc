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
        simple.restore()
        stub_con.addListener.reset();
        stub_con.write.reset();
        stub_con.end.reset();
    });
    it('should listen for data events', () => {
        var chat = new Chat(stub_con);
        assert.equal(stub_con.addListener.lastCall.args[0], "data");
    });
    it('should emit lines', () => {
        var chat = new Chat(stub_con);
        simple.mock(chat, "emit");
        var hnd = stub_con.addListener.lastCall.args[1];
        hnd("this is a");
        hnd(" line\r\n");
        assert.deepEqual(chat.emit.lastCall.args, ["line", "this is a line"]);
    });
    it('should write without error', () => {
        var chat = new Chat(stub_con);
        chat.say("this is a test")
        assert.equal(stub_con.write.lastCall.args, "this is a test\r\n");
    });
    it('should disconnect with #end', () => {
        var chat = new Chat(stub_con);
        chat.disconnect();
        assert.equal(stub_con.end.callCount, 1);
    });
});