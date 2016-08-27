const fs = require('fs');

const irc = require('irc');
const dcc = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Deuterium', {channels: ['#scram']})
client.addListener('ctcp-privmsg', (from, to, text, message) => {
    var cmd = text.split(" ")[0].toLowerCase();
    switch (cmd) {
        case "send":
            dcc.sendFile(client, { to:from, filename:__dirname + '/data.txt', port_start: 2000, port_end: 2020 }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            break;
        case "chat":
            dcc.sendChat(client, { to: 'Tritium', port_start: 2000, port_end: 2020 }, (chat) => {
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
            switch (args.type) {
                case 'chat':
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
                    break;
                case 'send':
                    args.from = from;
                    dcc.acceptSend(client, args, (connection, filename) => {
                        var ws = fs.createWriteStream(__dirname + '/' + filename);
                        connection.pipe(ws);
                    });
                    break;
            }
            break;
        case "exit":
            client.disconnect("goodbye!");
            process.exit();
    }

});
