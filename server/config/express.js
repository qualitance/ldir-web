/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var passport = require('passport');
var multer = require('multer'); //for multipart form uploads
var response = require('../components/response');

module.exports = function (app) {
    var env = app.get('env');
    app.use(compression());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(multer({
        dest: config.formDataParser.fileSaveLocation,
        limits: {
            files: config.formDataParser.fileUploadLimit,
            fileSize: config.images.max_size
        }
    })); //parse form data. keep files in memory only
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(passport.initialize());
    app.use(response);
    if (('production' === env) || ('sandbox' === env)) {
        app.use(errorHandler()); // Error handler - has to be last
    }

    if ('development' === env || 'test' === env) {
        app.use(require('connect-livereload')());
        app.set('appPath', 'client');
        app.use(morgan('dev'));
        app.use(errorHandler()); // Error handler - has to be last
    }
};
