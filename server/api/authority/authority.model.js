'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AuthoritySchema = new Schema({
    name: String,
    city: {type: Schema.Types.ObjectId, ref: 'City'},
    county: {type: Schema.Types.ObjectId, ref: 'County'},
    fax: String,
    isDummy: Boolean
});

module.exports = mongoose.model('Authority', AuthoritySchema);
