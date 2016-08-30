# DCC Support for [node-irc](https://github.com/martynsmith/node-irc)

[![Build Status](https://travis-ci.org/tritium21/node-irc-dcc.svg?branch=master)](https://travis-ci.org/tritium21/node-irc-dcc) [![Documentation Status](http://readthedocs.org/projects/node-irc-dcc/badge/?version=latest)](http://node-irc-dcc.readthedocs.io/en/latest/?badge=latest)

## A Simple DCC Echo Client Example

The hello world of network programming.

```javascript
const irc = require('irc');
const DCC = require('irc-dcc');

client = new irc.Client('irc.server.net', 'MyNickname', { channels: ['#a_channel'] })
dcc = new DCC(client);

client.on('dcc-chat', (from, args, message) => {
    dcc.acceptChat(args.host, args.port, (chat) => {
        chat.on("line", (line) => {
            chat.say("You said: " + line);
        });
    });
});
```