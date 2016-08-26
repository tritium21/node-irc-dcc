const irc = require('irc');
const dcc = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Dueterium', {channels: ['#scram']})
client.addListener('ctcp-privmsg', (from, to, text, message) => {
    console.log(text);
    var cmd = text.split(" ")[0].toLowerCase();
    console.log(cmd);
    switch (cmd) {
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
