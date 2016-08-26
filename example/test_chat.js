const irc = require('irc');
const dcc = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Dueterium', {channels: ['#scram']})
client.addListener('join#scram', () => {
    dcc.sendChat(client, 'Tritium', (chat) => {
        chat.on('line', (line) => {
            console.log(line);
            if (line.startsWith('exit')) { 
                client.disconnect();
                process.exit();
            }
        });
    });
});
