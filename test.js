const irc = require('irc');
const dcc = require('./lib/irc');

client = new irc.Client('irc.sorcery.net', 'Dueterium', {channels: ['#scram']})
client.addListener('join#scram', () => {
    dcc.sendFile(client, 'Tritium', 'data.txt');
});