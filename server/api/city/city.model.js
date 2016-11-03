'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CitySchema = new Schema({
    name: String,
    plain_name: String,
    siruta: String,
    county: {type: Schema.Types.ObjectId, ref: 'County'},
    geometry: {
        type: {type: String, default: 'Polygon'},
        coordinates: []
    }
});

module.exports = mongoose.model('City', CitySchema);
