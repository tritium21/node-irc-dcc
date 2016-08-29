===
API
===

`irc-dcc <https://github.com/tritium21/node-irc-dcc>`_ extends 
`irc <https://github.com/martynsmith/node-irc/>`_ with `Direct Client-to-Client
<https://en.wikipedia.org/wiki/Direct_Client-to-Client>`_ support.  Currently,
sending and recieving files, as well as chat sessions are supported.

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

    `ports` is a length-2 indexable object (array).  The first and second objects in that
    array should be the start and end of a port range that you want incomming DCC connections
    to bind to.  If undefined or null, the default of `0` is used (the OS picks a port).

    `localAddress` is the source address for all outgoing connections and the IP to which
    all listening connections are bound.  If unset, an attempt will be made to get this
    information off the client object.  If that is unset or undefined, a local ip address
    will be picked by the library.

    `timeout` is the idle time an uninitiated DCC connection will wait before erroring out.
    It is set in miliseconds.

.. js:function:: DCC.sendFile (to, filename, length, callback)

    `DCC.sendFile` does not do any disk IO -- it is your responsibility to open the file, and 
    send the data.  The library takes care of the CTCP messaging and establishing connections.

    :param string to: The nick to send the file to.
    :param string filename: The filename to send in the CTCP message.
    :param number length: The length of the file in bytes.
    :param callback:
        .. js:function:: (err, connection, position)

            :param err: Error, if there is an error, null otherwise
            :param connection: The `net.Socket` object.
            :param number position: The offset from the start of the file to begin reading from


    .. code-block:: javascript
        :linenos:
        :emphasize-lines: 20,21,22,23,24,25,26,27

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
                    dcc.sendFile(from, 'data.txt', filestat.size, (err, con, position) => {
                        if (err) {
                            client.notice(from, err);
                            return;
                        }
                        rs = fs.createReadStream(__dirname + '/data.txt', { start: position });
                        rs.pipe(con);
                    });
                });
            }
        });


Chat
----

ToDo