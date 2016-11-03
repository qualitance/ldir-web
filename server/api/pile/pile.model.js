'use strict';

var mongoose = require('mongoose'),
    mongoosastic = require('mongoosastic'),
    User = require('../user/user.model'),
    Image = require('../image/image.model'),
    StateAuthority = require('../state_authority/state_authority.model'),
    County = require('../county/county.model'),
    Schema = mongoose.Schema;

var ActivityService = require('../activity/activity.service');
var MailService = require('../../components/mailer');

var env = require('../../config/environment');

var PileSchema = new Schema({
    nr_ord: {
        type: Number,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['confirmed', 'unconfirmed', 'pending', 'reported', 'clean'],
        default: 'pending',
        es_type: 'string',
        es_indexed: true,
        index: true
    },
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'Image'
    }],
    screenshot: {
        type: Schema.Types.ObjectId,
        ref: 'Image'
    },
    content: {type: Array, es_type: 'string', es_indexed: true},
    areas: {type: Array, es_type: 'string', es_indexed: true},
    size: {type: Number, es_type: 'integer', es_indexed: true},
    description: String,
    created_at: {type: Date, default: Date.now, es_type: 'date', es_indexed: true},
    last_update: {type: Date, es_type: 'date', es_indexed: true},
    location: {
        lat: Number,
        lng: Number
    },
    county: {
        type: Schema.Types.ObjectId,
        ref: 'County',
        es_indexed: true
    },
    city: {
        type: Schema.Types.ObjectId,
        ref: 'City',
        es_indexed: true
    },
    confirm: [{type: Schema.Types.ObjectId, ref: 'User'}],
    unconfirm: [{type: Schema.Types.ObjectId, ref: 'User'}],
    allocated: {
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        authority: {type: Schema.Types.ObjectId, ref: 'Authority'},
        //default due date is 30 days
        due_date: {type: Date, default: new Date() + (30 * 24 * 60 * 60 * 100)},
        notified: {type: Boolean, default: false},
        file_path: String,
        nr_ord: {
            type: Number,
            trim: true
        }
    },
    is_hidden: {type: Boolean, es_type: 'boolean', es_indexed: true, index: true}
});

PileSchema.post('init', function () {
    //remember current status, so that we can verify whether it was changed or not
    this.oldStatus = this.status;
});

PileSchema.pre('save', function (next) {
    //isNew is a predefined property present in mogoose's pre save hook
    //we can assign it to our own wasNew property so that we can verify in the post save hook
    //whether the saved document is newly created or just updated
    this.wasNew = this.isNew;
    this.last_update = Date.now();
    next();
});

PileSchema.post('save', function (doc) {
    var updated_by = this.updated_by;
    //if the document is newly created or it's status has been updated, create an activity for it
    if (this.wasNew || this.oldStatus !== doc.status) {
        var actor = updated_by || doc.user;
        ActivityService.create(actor, doc.status, doc._id).then(function (activity) {
        });
    }
    //if the status has been updated send email to owner
    if (this.oldStatus && this.oldStatus !== this.status) {
        MailService.events.pileStatusChanged(doc.user, doc.status);
    }
});

//elastic search setup
PileSchema.plugin(mongoosastic, {hosts: [env.elasticHost]});

module.exports = mongoose.model('Pile', PileSchema);
