'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CountySchema = new Schema({
    code: String,
    name: String,
    plain_name: String,
    siruta: String,
    geometry: {
        type: {type: String, default: 'Polygon'},
        coordinates: []
    },
    country: {type: Schema.Types.ObjectId, ref: 'Country'}
});

CountySchema.path('code').validate(function (code) {
    return code.length <= 2 || code.indexOf('MD') > -1;
}, 'Invalid county code');

module.exports = mongoose.model('County', CountySchema);
