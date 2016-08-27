const net = require("net");

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


const getUnusedPort = module.exports.getUnusedPort = (options, callback) => {
    var min = options.min;
    if (!min) {
        callback(null, 0);
        return;
    }
    var max = options.max;
    var localAddress = options.localAddress;
    var port = getRandomInt(min, max);

    var server = net.createServer();

    server.listen(port, localAddress, (err) => {
        server.once("close", function () {
            var env = options.env;
            if (env && typeof (env) === "string") {
                process.env[env] = port;
            }

            callback(err, port);
        });
        server.close();
    });

    server.on("error", () => {
        getUnusedPort(options, callback);
    });
};