process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config/environment');
var mongoose = require('mongoose');

// connect to DB
mongoose.connect(config.mongo.uri, config.mongo.options);

var kue = require('kue');
var fs = require('fs');

var ImageService = require('./api/image/image.service');
var TemporaryStorage = require('./components/temporaryStorage');

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

// All errors either in Redis client library or Queue are emitted to the Queue object.
// You should bind to error events to prevent uncaught exceptions or debug kue errors.

queue.on('error', function (err) {
    console.log('Kue error: ', err);
});

// ============================================================= define queue events

// Queue-level events provide access to the job-level events previously mentioned,
// however scoped to the Queue instance to apply logic at a "global" level
queue.on('job enqueue', function (id, type) {
    console.log('Job #%s got queued of type %s', id, type);
}).on('job complete', function (id, result) {
    kue.Job.get(id, function (err, job) {
        if (err) return;
        job.remove(function (err) {
            if (err) throw err;
            console.log('removed completed job #%d', job.id);
        });
    });
});

// ============================================================= define a processor for each job

queue.process('uploadPileImage', function (job, done) {
    var buffer = new Buffer(job.data.file, 'base64');
    var file_extension = job.data.file_extension;
    var pile_id = job.data.pile_id;
    var image_id = job.data.image_id;
    var user = job.data.user;
    ImageService.processImage(buffer)
        .then(function (success) {
            ImageService.updatePileImage(user, success.resizedImageBuffer, success.resizedImageDimensions, file_extension, pile_id, image_id)
                .then(function (image) {
                    TemporaryStorage.deleteResource(file_path); // if resource is not removed, the job will still be considered successful
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        })
        .catch(function (err) {
            done(err);
        });
});
