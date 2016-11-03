'use strict';

var PileService = require('../pile/pile.service');
var ActivityService = require('../activity/activity.service');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    images: [{type: Schema.Types.ObjectId, ref: 'Image'}],
    pile: {type: Schema.Types.ObjectId, ref: 'Pile'},
    description: String,
    created_at: Date
});

schema.post('save', function (comment) {
    PileService.getUserId(comment.pile).then(
        function (user_id) {
            if (user_id.toString() !== comment.user.toString()) {
                ActivityService.create(comment.user, 'comment', comment.pile).then(function (activity) {

                });
            }
        }
    )
});

module.exports = mongoose.model('Comment', schema);
