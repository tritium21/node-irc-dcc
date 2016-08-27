const fs = require('fs');

const irc = require('irc');
const DCC = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Deuterium', { channels: ['#scram'] })
dcc = new DCC(client, {ports: [2000, 2020]});
client.addListener('ctcp-privmsg', (from, to, text, message) => {
    var cmd = text.split(" ")[0].toLowerCase();
    switch (cmd) {
        case "send":
            dcc.sendFile(from, __dirname + '/data.txt', (err) => { if (err) { console.log(err); } });
            break;
        case "exit":
            client.disconnect("goodbye!");
            process.exit();
    }

});
