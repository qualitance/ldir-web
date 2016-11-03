'use strict';

var errors = require('./components/errors');

module.exports = function (app) {

    // Insert routes below
    app.use('/api/countries', require('./api/country'));
    app.use('/api/environment', require('./api/environment'));
    app.use('/api/cities', require('./api/city'));
    app.use('/api/improves', require('./api/improve'));
    app.use('/api/authorities', require('./api/authority'));
    app.use('/api/counties', require('./api/county'));
    app.use('/api/images', require('./api/image'));
    app.use('/api/state_authorities', require('./api/state_authority'));
    app.use('/api/piles', require('./api/pile'));
    app.use('/api/users', require('./api/user'));
    app.use('/api/contact', require('./api/contact'));
    app.use('/api/comments', require('./api/comments'));
    app.use('/api/activities', require('./api/activity'));

    app.use('/auth', require('./auth'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*')
        .get(function (req, res) {
            res.sendfile(app.get('appPath') + '/index.html');
        });
};
