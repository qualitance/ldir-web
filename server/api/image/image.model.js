'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    async = require('async'),
    amazon = require('../../components/amazon'),
    env = require('../../config/environment');

var PileService = require('../pile/pile.service');
var UserService = require('../user/user.service');

var ImageSchema = new Schema({
    src: String,
    thumb_src: String,
    width: Number,
    height: Number,
    not_local: Boolean, //true if image is not stored on Amazon
    is_screenshot: Boolean,
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    dimensions: {
        image: {
            width: Number,
            height: Number
        },
        thumb: {
            width: Number,
            height: Number
        }
    }
});

ImageSchema
    .post('init', function () {
        this.thumb_src = this.thumb_src || this.src;
    });

/**
 * @name post
 * @function
 * @description removes image and thumbnail from amazon, then from users or piles
 * @param {String} 'remove'
 */
ImageSchema.post('remove', function (image) {
    if (!image.not_local) {
        async.parallel([
            function (callback) {
                var key = image.src.replace(env.amazonPrefix, '');
                amazon.deleteObjectS3(key, function (err, success) {
                    if (err) console.log(err);
                    callback();
                });
            },
            function (callback) {
                var key = image.thumb_src.replace(env.amazonPrefix, '');
                amazon.deleteObjectS3(key, function (err, success) {
                    if (err) console.log(err);
                    callback();
                });
            },
            function (callback) {
                UserService.removeImage(image._id).then(
                    function (success) {
                        callback();
                    },
                    function (err) {
                        console.log(err);
                        callback(); // do not handle error
                    }
                );
            },
            function (callback) {
                PileService.removeImage(image._id).then(
                    function (success) {
                        callback()
                    },
                    function (err) {
                        console.log(err);
                        callback(); // do not handle error
                    }
                );
            }
        ], function () {

        });
    } else {

    }
});

module.exports = mongoose.model('Image', ImageSchema);
