'use strict';

var kue = require('kue');
var fs = require('fs');

var config = require('../../config/environment');

var ImageService = require('../../api/image/image.service');
var TemporaryStorage = require('../../components/temporaryStorage');

// ============================================================= configure Kue

// Kue stores job objects in memory until they are complete/failed to be able to emit events on them.
// If you have a huge concurrency in uncompleted jobs, turn this feature off and use queue level events for better memory scaling.
var queue = kue.createQueue({
    jobEvents: false,
    prefix: 'q',
    redis: {
        port: config.kue.port,
        host: config.kue.host
    }
});

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
