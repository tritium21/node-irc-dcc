const irc = require('irc');
const dcc = require('../lib/dcc');

client = new irc.Client('irc.sorcery.net', 'Dueterium', {channels: ['#scram']})
client.addListener('join#scram', () => {
    dcc.sendFile(client, 'Tritium', 'data.txt', () => {
        client.disconnect('file sent');
        process.exit();
    });
});