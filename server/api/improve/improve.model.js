'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ImproveSchema = new Schema({
    description: String,
    message: String,
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    date_added: Date
});

module.exports = mongoose.model('Improve', ImproveSchema);
