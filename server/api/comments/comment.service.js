'use strict';

var Q = require('q');

var Comment = require('./comment.model');

/**
 * @name countCommentsBy
 * @function
 * @description counts specific user comments
 * @param {String} user_id
 */
exports.countCommentsBy = function (user_id) {
    var deferred = Q.defer();
    Comment.count({user: user_id}, function (err, count) {
        if (err) {
            deferred.reject({data: err});
        } else {
            deferred.resolve(count);
        }
    });
    return deferred.promise;
};
