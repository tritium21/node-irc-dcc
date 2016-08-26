const irc = require('irc');
const dcc = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Deuterium', {channels: ['#scram']})
client.addListener('ctcp-privmsg', (from, to, text, message) => {
    var cmd = text.split(" ")[0].toLowerCase();
    switch (cmd) {
        case "send":
            dcc.sendFile(client, from, __dirname + '/data.txt', () => { });
            break;
        case "chat":
            dcc.sendChat(client, 'Tritium', (chat) => {
                chat.on('line', (line) => {
                    if (line.startsWith('exit')) {
                        chat.say("Bye!!")
                        chat.disconnect();
                    } else {
                        chat.say("You said: " + line)
                    }
                });
            });
            break;
        case "dcc":
            var args = dcc.parseDCC(text);
            if (args.type == 'chat') {
                dcc.acceptChat(client, args.addr, args.port, (chat) => {
                    chat.on('line', (line) => {
                        if (line.startsWith('exit')) {
                            chat.say("Bye!!")
                            chat.disconnect();
                        } else {
                            chat.say("You said: " + line)
                        }
                    });
                });
            }
            break;
        case "exit":
            client.disconnect("goodbye!");
            process.exit();
    }

});
