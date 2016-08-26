const irc = require('irc');
const dcc = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Dueterium', {channels: ['#scram']})
client.addListener('join#scram', () => {
    dcc.sendChat(client, 'Tritium', (chat) => {
        chat.on('line', (line) => {
            console.log(line);
            if (line.startsWith('exit')) { 
                chat.say("bye!")
                chat.disconnect();
                client.say("Bye!!")
                client.disconnect("Goobye")
                process.exit();
            }
        });
    });
});
