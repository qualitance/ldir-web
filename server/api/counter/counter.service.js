'use strict';

var Counter = require('./counter.model');

var Q = require('q');

/**
 * Find and Modify counter sequence
 * @param type
 * @returns {*}
 */
exports.getNextSequence = function (type) {
    var deferred = Q.defer();
    Counter.findAndModify({type: type}, {}, {$inc: {seq: 1}}, {new: true}, function (err, counter) {
        if(err){
            deferred.reject(err);
        }else{
            deferred.resolve(counter.seq);
        }
    });
    return deferred.promise;
};
