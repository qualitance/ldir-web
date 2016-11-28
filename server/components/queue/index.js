'use strict';

var kue = require('kue');
var fs = require('fs');

var config = require('../../config/environment');

var ImageService = require('../../api/image/image.service');
var TemporaryStorage = require('../../components/temporaryStorage');

var queue = kue.createQueue({
    jobEvents: false,
    prefix: 'q',
    redis: {
        port: config.kue.port,
        host: config.kue.host
    }
});

/**
 * @name uploadPileImage
 * @function
 * @description  Kue stores job objects in memory until they are complete/failed to be able to emit events on them.
 * If you have a huge concurrency in uncompleted jobs, turn this feature off and use queue level events for better memory scaling.
 * @param {String} file_path
 * @param {String} file_extension
 * @param {String} pile_id
 * @param {String} image_id
 * @param {Object} user
 */
function uploadPileImage(file_path, file_extension, pile_id, image_id, user) {
    TemporaryStorage.getResource(file_path)
        .then(function (buffer) {
            queue.create('uploadPileImage', {
                file: buffer.toString('base64'),
                file_extension: file_extension,
                pile_id: pile_id,
                image_id: image_id,
                user: user
            }).save();
        })
        .catch(function (err) {
            console.log(err);
        })
}

module.exports = {
    uploadPileImage: uploadPileImage
};
