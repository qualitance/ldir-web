process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('./config/environment');

var mongoose = require('mongoose');

var async = require('async');

// connect to DB
mongoose.connect(config.mongo.uri, config.mongo.options);

var Pile = require('./api/pile/pile.model');
var User = require('./api/user/user.model');

var indexes = [
    {
        name: 'piles',
        modelName: 'Pile',
        modelSchema: Pile.schema
    },
    {
        name: 'users',
        modelName: 'User',
        modelSchema: User.schema
    }
];

// running the indexing in series instead of parallel prevents some randomly occuring errors
async.eachSeries(indexes, function resetIndex(index, callback) {
    console.log('Attempt index reset for model: ' + index.modelName);
    runIndex(index.name, index.modelName, index.modelSchema, callback);
}, function doneAllIndexes(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('DONE');
        process.exit(0);
    }
});

function runIndex(index_name, model_name, model_schema, callback) {
    //skip mongoose validation when synchronizing
    if (shouldRemoveIndexes()) {
        //remove index before doing the sync
        model_schema.statics.esTruncate({index: index_name}, function (err) {
            if (err) {
                callback(err);
            } else {
                console.log('Cleared index for model: ' + model_name);
                //do the sync after index was removed
                sync(model_name, model_schema, callback);
            }
        });
    } else {
        //do the sync without removing index
        sync(model_name, model_schema, callback);
    }
}

function sync(model_name, model_schema, callback) {

    var Model = mongoose.model(model_name, model_schema),
        stream = Model.synchronize(),
        count = 0;
    stream.on('data', function (err, doc) {
        count++;
    });
    stream.on('close', function () {
        console.log('Indexed ' + count + ' documents for model: ' + model_name);
        callback();
    });
    stream.on('error', function (err) {
        console.log(err);
    });

}

function shouldRemoveIndexes() {
    return true;
}
