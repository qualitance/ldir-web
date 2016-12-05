'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var deepPopulate = require('mongoose-deep-populate');

var schema = new Schema({
    actor: {type: Schema.Types.ObjectId, ref: 'User'},
    verb: String,
    pile: {type: Schema.Types.ObjectId, ref: 'Pile'},
    viewed: [{type: Schema.Types.ObjectId, ref: 'User'}],
    date_created: Date
});

schema.plugin(deepPopulate, {
    whitelist: ['actor', 'pile.user', 'pile.images']
});

schema.pre('save', function (next) {
    if(this.isNew) this.date_created = Date.now();
    next();
});

module.exports = mongoose.model('Activity', schema);
