'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    type: String,
    seq: Number
});

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
};

module.exports = mongoose.model('Counter', schema);