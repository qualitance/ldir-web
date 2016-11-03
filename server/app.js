'use strict';

function dumpError(err) {
    if (typeof err === 'object') {
        if (err.message) {
            console.log('\nMessage: ' + err.message)
        }
        if (err.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(err.stack);
        }
    } else {
        console.log('dumpError :: argument is not an object');
    }
}

try {
    // Set default node environment to development
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';

    var express = require('express');
    var mongoose = require('mongoose');
    require('mongoose-pagination');
    var config = require('./config/environment');

    /**
     * To get started passing errors to Raven, it is recommended to initialize
     * Raven’s global error handler using patchGlobal. This will cause any uncaught exception
     * which would bubble up to the Node runtime to be captured and processed by Raven.
     */

    // Connect to database
    mongoose.connect(config.mongo.uri, config.mongo.options);

    //enable scheduled jobs
    require('./components/schedule');

    // Setup server
    var app = express();

    // The request handler must be the first item

    //enable CORS
    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Total-Count');
        next();
    });
    var server = require('http').createServer(app);
    require('./config/express')(app);
    require('./routes')(app);

    // Start server
    server.listen(config.port, config.ip, function () {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });

    // Expose app
    exports = module.exports = app;

} catch (e) {
    dumpError(e)
}
