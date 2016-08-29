===
API
===

`irc-dcc <https://github.com/tritium21/node-irc-dcc>`_ extends 
`irc <https://github.com/martynsmith/node-irc/>`_ with `Direct Client-to-Client
<https://en.wikipedia.org/wiki/Direct_Client-to-Client>`_ support.  Currently,
sending and receiving files, as well as chat sessions are supported.

DCC
---

.. js:function:: DCC (client [, options])

    `client` is the instance of `irc.Client` that you want to enable DCC support on.
    The second optional argument is an object, that looks something like the following::

        {
            ports: [2000, 2020],
            localAddress: '10.0.0.125',
            timeout: 30000
        }

    ``ports`` is a length-2 indexable object (array).  The first and second objects in that
    array should be the start and end of a port range that you want incoming DCC connections
    to bind to.  If undefined or null, the default of ``0`` is used (the OS picks a port).

    ``localAddress`` is the source address for all outgoing connections and the IP to which
    all listening connections are bound.  If unset, an attempt will be made to get this
    information off the client object.  If that is unset or undefined, a local ip address
    will be picked by the library.

    ``timeout`` is the idle time an uninitiated DCC connection will wait before erring out.
    It is set in milliseconds.

.. js:function:: DCC.sendFile (to, filename, length, callback)

    ``DCC.sendFile`` does not do any disk IO -- it is your responsibility to open the file, and 
    send the data.  The library takes care of the CTCP messaging and establishing connections.

    :param string to: The nick to send the file to
    :param string filename: The filename to send in the CTCP message
    :param number length: The length of the file in bytes
    :param callback:
        .. js:function:: (err, connection, position)

            :param err: Error, if there is an error, null otherwise
            :param connection: The `net.Socket` object
            :param number position: The offset from the start of the file to begin reading from


    .. code-block:: javascript
        :linenos:
        :emphasize-lines: 20,21,22,23,24,25,26,27,28,29,30

        // A minimal example.
        // Adjust the arguments to irc.Client as per the node-irc docs
        //
        // When your client connects to IRC, issue /ctcp <botnick> send
        //
        const fs = require("fs");
        const irc = require("irc");
        const DCC = require("irc-dcc");

        client = new irc.Client(...);
        dcc = new DCC(client);

        client.addListener('ctcp-privmsg', (from, to, text, message) => {
            if (text.split(" ")[0].toLowerCase() == "send") {
                fs.stat(__dirname + '/data.txt', (err, filestat) => {
                    if (err) {
                        client.notice(from, err);
                        return;
                    }
                    dcc.sendFile(from, 'data.txt', filestat.size,
                                 (err, con, position) => {
                        if (err) {
                            client.notice(from, err);
                            return;
                        }
                        rs = fs.createReadStream(__dirname + '/data.txt', {
                            start: position
                        });
                        rs.pipe(con);
                    });
                });
            }
        });

.. js:function:: DCC.acceptSend (from, host, port, filename, length [, position], callback)

    ``DCC.acceptSend`` does not do any disk IO -- it is your responsibility to open the file, and 
    send the data.  The library takes care of the CTCP messaging and establishing connections.

    :param string from: The nick sending the file
    :param string host: The IP address to connect to
    :param number port: The port to connect to
    :param string filename: The filename suggested by the other side
    :param number length: The length of the file in bytes
    :param number position: The offset from the beginning of the file, if you wish to resume
    :param callback:
        .. js:function:: (err, filename, connection)

            :param err: Error, if there is an error, null otherwise
            :param string filename: Name of the file
            :param connection:  The `net.Socket` object

    .. code-block:: javascript
        :linenos:
        :emphasize-lines: 15,16,17,18,19,20,21,22

        // A minimal example.
        // Adjust the arguments to irc.Client as per the node-irc docs
        //
        // When your client connects to IRC, send it a file.
        //
        const fs = require("fs");
        const irc = require("irc");
        const DCC = require("irc-dcc");

        client = new irc.Client(...);
        dcc = new DCC(client);

        client.on('dcc-send', (from, args, message) => {
            var ws = fs.createWriteStream(__dirname + "/" + args.filename)
            dcc.acceptSend(from, args.host, args.port, args.filename,
                           args.length, (err, filename, con) => {
                if (err) {
                    client.notice(from, err);
                    return;
                }
                con.pipe(ws);
            });
        });

.. js:function:: DCC.sendChat (to, callback)

    :param string to: The nick to open a chat session to
    :param calback:
        .. js:function:: (err, chat)

            :param err: Error, if there is an error, null otherwise
            :param Chat chat: The chat connection object

    .. code-block:: javascript
        :linenos:
        :emphasize-lines: 15,16,17,18,19

        // A minimal example.
        // Adjust the arguments to irc.Client as per the node-irc docs
        //
        // When your client connects to IRC, issue /ctcp <botnick> chat
        //
        const fs = require("fs");
        const irc = require("irc");
        const DCC = require("irc-dcc");

        client = new irc.Client(...);
        dcc = new DCC(client);

        client.addListener('ctcp-privmsg', (from, to, text, message) => {
            if (text.split(" ")[0].toLowerCase() == "chat") {
                dcc.sendChat(from, (err, chat) => {
                    chat.on("line", (err, chat) => {
                        chat.say("You said: " + line);
                    });
                });
            }
        });

.. js:function:: DCC.acceptChat (host, port, callback)

    :param string host: The IP address to connect to
    :param number port: The port to connect to
    :param callback:
        .. js:function:: (err, chat)

            :param err: Error, if there is an error, null otherwise
            :param Chat chat: The chat connection object

    .. code-block:: javascript
        :linenos:
        :emphasize-lines: 13,14,15,16,17,18,19

        // A minimal example.
        // Adjust the arguments to irc.Client as per the node-irc docs
        //
        // When your client connects to IRC, initiate a DCC chat with the bot
        //
        const fs = require("fs");
        const irc = require("irc");
        const DCC = require("irc-dcc");

        client = new irc.Client(...);
        dcc = new DCC(client);

        client.on('dcc-chat', (from, args, message) => {
            dcc.acceptChat(args.host, args.port, (err, chat) => {
                chat.on("line", (err, chat) => {
                    chat.say("You said: " + line);
                });
            });
        });

Events
______

``irc-dcc`` emits four new events from ``irc.Client``.  Two events are intended for
public use, and two are internal.  All four of the events are in the form
of ``function (from, args, message) {}``. See the ``irc`` documentation for the details
of ``message``.  ``args`` is an object of the parsed CTCP message, and is described 
for each of the public events.

.. js:data:: 'dcc-send'

    ::

        {
            type: "send",
            filename: <string>,  // The filename
            long: <number>,      // IP address to connect to as a long integer
            host: <string>,      // IP address to connect to as a string
            port: <number>,      // Port to connect to
            length: <number>,    // Length of file, in bytes
        }

.. js:data:: 'dcc-chat'

    ::

        {
            type: "chat",
            long: <number>,      // IP address to connect to as a long integer
            host: <string>,      // IP address to connect to as a string
            port: <number>,      // Port to connect to
        }

Chat
----

The library provides a very basic type for interacting with DCC chat
sessions, with one public method, and one event.  They are both stupendously
straight forward.

.. js:function:: Chat.say(message)

    :param string message: Message to send


Events
______

.. js:data:: 'line'

    This is in the format of ``function (line)``, and is simply the raw line
    of text from the connection.
