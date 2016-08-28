# DCC Support for [node-irc](https://github.com/martynsmith/node-irc)

## A Simple DCC Echo Client Example

The hello world of network programming.

```javascript
const irc = require('irc');
const DCC = require('irc-dcc');

client = new irc.Client('irc.server.net', 'MyNickname', { channels: ['#a_channel'] })
dcc = new DCC(client);

function chatListener(chat) {
    return (line) => {
        switch (line) {
            case "exit":
                chat.say("Good Bye.");
                chat.disconnect();
                break;
            default:
                chat.say("You said: " + line);
        }
    };
}

client.on('dcc-chat', (from, args, message) => {
    dcc.acceptChat(args.host, args.port, (chat) => {
        chat.on("line", chatListener(chat));
    });
});
```