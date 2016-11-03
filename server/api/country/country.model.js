'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CountrySchema = new Schema({
    name: String
});

module.exports = mongoose.model('Country', CountrySchema);
