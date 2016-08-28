const fs = require('fs');

const irc = require('irc');
const DCC = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Deuterium', { channels: ['#scram'] })
dcc = new DCC(client, {ports: [2000, 2020]});
client.addListener('ctcp-privmsg', (from, to, text, message) => {
    var cmd = text.split(" ")[0].toLowerCase();
    switch (cmd) {
        case "send":
            fs.stat(__dirname + '/data.txt', (err, filestat) => {
                if (err) {
                    client.notice(from, err);
                    return;
                }
                dcc.sendFile(from, 'data.txt', filestat.size, (err, con, position) => {
                    if (err) {
                        client.notice(from, err);
                        return;
                    }
                    rs = fs.createReadStream(__dirname + '/data.txt', { start: position });
                    rs.pipe(con);
                });
            });
            break;
        case "chat":
            dcc.sendChat(from, (chat) => {
                chat.on("line", (line) => {
                    switch (line) {
                        case "exit":
                            chat.say("Good Bye.");
                            chat.disconnect();
                            break;
                        default:
                            chat.say("You said: " + line);
                    }
                });
            });
            break;
        case "exit":
            client.disconnect("goodbye!");
            process.exit();
    }

});
client.on('dcc-send', (from, args, message) => {
    var ws = fs.createWriteStream(__dirname + "/" + args.filename)
    dcc.acceptSend(from, args.host, args.port, args.filename, args.length, (err, filename, con) => {
        if (err) {
            client.notice(from, err);
            return;
        }
        con.pipe(ws);
    });
});