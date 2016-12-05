process.env.NODE_ENV = process.env.NODE_ENV || 'development';
//zz
var mongoose = require('mongoose');
var config = require('./config/environment');

mongoose.connect(config.mongo.uri, config.mongo.options);
require('./config/seed');
