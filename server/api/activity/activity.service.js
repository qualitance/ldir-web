'use strict';

var Activity = require('./activity.model');

var PushService = require('../../components/pushNotifications');
var PileService = require('../pile/pile.service');

var Q = require('q');

// Creates a new activity
exports.create = function (actor_id, verb, pile_id) {
    var deferred = Q.defer();
    var activity = new Activity({
        actor: actor_id,
        verb: verb,
        pile: pile_id,
        viewed: [actor_id]
    });
    activity.save(function (err, activity) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(activity);
            activity.deepPopulate('actor pile.user', function (err, activity) {
                if (err) {
                    console.log(err);
                } else {
                    PushService.activityNotify(activity);
                }
            });
        }
    });
    return deferred.promise;
};

exports.countUnread = function (user) {
    var deferred = Q.defer();
    var county;
    if (user.role === 'supervisor') {
        county = user.county;
    }
    PileService.getPileIds(user._id, county).then(
        function (pile_ids) {
            Activity.count({pile: {$in: pile_ids}, viewed: {$nin: [user._id]}}).exec(function (err, count) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(count);
                }
            });
        },
        function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};

exports.getIdsOfPilesContributedTo = function (user_id) {
    var deferred = Q.defer();
    Activity.aggregate([
        {
            $match: {
                actor: user_id
            }
        },
        {
            $group: {
                _id: null,
                pile_ids: {$addToSet: '$pile'}
            }
        }
    ], function (err, result) {
        if (err) {
            deferred.reject(err);
        } else if (!result || !result[0]) {
            deferred.resolve([]);
        } else {
            deferred.resolve(result[0].pile_ids);
        }
    });
    return deferred.promise;
};
