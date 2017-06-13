# DCC Support for [node-irc](https://github.com/martynsmith/node-irc)

[![Build Status](https://travis-ci.org/tritium21/node-irc-dcc.svg?branch=master)](https://travis-ci.org/tritium21/node-irc-dcc) [![Documentation Status](http://readthedocs.org/projects/node-irc-dcc/badge/?version=latest)](http://node-irc-dcc.readthedocs.io/en/latest/?badge=latest) [![Build status](https://ci.appveyor.com/api/projects/status/5f9erkae5ga799m6?svg=true)](https://ci.appveyor.com/project/tritium21/node-irc-dcc) [![Libraries.io for GitHub](https://img.shields.io/librariesio/github/tritium21/node-irc-dcc.svg?maxAge=2592000?style=plastic)](https://libraries.io/github/tritium21/node-irc-dcc) [![Dependency Status](https://dependencyci.com/github/tritium21/node-irc-dcc/badge)](https://dependencyci.com/github/tritium21/node-irc-dcc) [![npm](https://img.shields.io/npm/v/irc-dcc.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/irc-dcc) [![GitHub issues](https://img.shields.io/github/issues/tritium21/node-irc-dcc.svg?maxAge=2592000?style=plastic)](https://github.com/tritium21/node-irc-dcc/issues) [![Coverage Status](https://coveralls.io/repos/github/tritium21/node-irc-dcc/badge.svg)](https://coveralls.io/github/tritium21/node-irc-dcc)

## A Simple DCC Echo Client Example

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
## Added DCC specific events
Event       | Description
=======================
dcc-chat    | Emitted when a remote client attempts to chat with you
dcc-send    | Emitted when a remote client attempts to send you a file
dcc-resume  | Emitted when a remote client resumes a paused file transfer
dcc-accept  | Emitted when a remote client accepts a file you are attempting to send
