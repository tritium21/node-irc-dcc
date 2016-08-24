const irc = require('irc');
const dcc = require('../lib/dcc');

dcc.patch()

client = new irc.Client('irc.sorcery.net', 'Dueterium', {channels: ['#scram']})
client.addListener('join#scram', () => {
    client.sendFile('Tritium', __dirname + '/data.txt', () => {
        client.disconnect('file sent');
        process.exit();
    });
});
