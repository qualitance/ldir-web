var Activity = require('./activity.model');
var User = require('../user/user.model');
var PileService = require('../pile/pile.service');

var env = require('../../config/environment');

/**
 * @name findAllMine
 * @function
 * @description finds all activities related to the user initiating the request, if the user is a volunteer we get all
 * the activities that refer to reported piles by the user, if the user is a supervisor we get all the activities
 * related to piles in user's county
 * we query for activities that refer to the pile_ids obtained, since the activities' "viewed" field is an array of
 * users that viewed the activity, we need to return it as a boolean being true if the user is found in the array and
 * false otherwise
 * @param {Object} req
 * @param {Object} res
 */
exports.findAllMine = function (req, res) {
    User.findOne({_id: req.user._id}).exec(function (err, user) {
        if (err) {
            handleError(res, 'No user');
        } else {
            var page = req.query.page || 1;
            var limit = req.query.limit || env.defaultPaginationLimit;
            page = page - 1;
            if (page < 0) {
                page = 0;
            }
            var promisedPileIds;
            if (user.role === 'volunteer') {
                promisedPileIds = PileService.getPileIds(user._id);
            } else if (user.role === 'supervisor') {
                promisedPileIds = PileService.getPilesIdsInCounty(user.county);
            } else {
                return res.handleResponse(400, {}, 'activity_1');
            }
            promisedPileIds.then(
                function (pile_ids) {

                    var cursor = Activity.aggregate([
                        {$match: {pile: {$in: pile_ids}}},
                        {$sort: {date_created: -1}},
                        {$skip: page * limit},
                        {$limit: parseInt(limit)},
                        {
                            $project: {
                                actor: 1,
                                verb: 1,
                                pile: 1,
                                date_created: 1,
                                viewed: {$setIsSubset: [[user._id], '$viewed']}
                            }
                        }
                    ]);

                    cursor.exec(function (err, activities) {
                        if (err) {
                            handleError(res, err);
                        } else {
                            Activity.deepPopulate(activities, 'pile.images', function (err, activities) {
                                if (err) {
                                    handleError(res, err);
                                } else {
                                    res.handleResponse(200, {success: activities});
                                }
                            });
                        }
                    });
                },
                function (err) {
                    handleError(res, err);
                }
            );
        }
    });
};

/**
 * @name markAsViewed
 * @function
 * @description marks activity as viewed
 * @param {Object} req
 * @param {Object} res
 */
exports.markAsViewed = function (req, res) {
    if (req.query.id) {
        Activity.update({_id: req.query.id}, {$addToSet: {viewed: req.user._id}}, function (err) {
            if (err) {
                handleError(res, err);
            } else {
                res.handleResponse(200, {success: true});
            }
        });
    } else {
        res.handleResponse(400);
    }
};

var handleError = function (res, err) {
    console.log(err);
    res.handleResponse(500, {error: true});
};
