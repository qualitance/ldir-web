var Activity = require('./activity.model');
var User = require('../user/user.model');
var PileService = require('../pile/pile.service');

var env = require('../../config/environment');

/**
 * Returns an array of all the activities of the authenticated user
 * @param {object} req
 * @param {object} res
 */
exports.findAllMine = function (req, res) {
    User.findOne({_id: req.user._id}).exec(function (err, user) {
        if(err){
            handleError(res, "No user");
        }else{
            //init pagination vars
            var page = req.query.page || 1;
            var limit = req.query.limit || env.defaultPaginationLimit;
            page = page -1;
            if(page < 0) page = 0;

            //we will differentiate the response based on the user initiating the request
            //if user is a volunteer we need to get all the activities that refer to a pile reported by this user
            //if user is a supervisor we need to get all the activities that refer to a pile located in the user's county
            var promisedPileIds;
            if(user.role === 'volunteer'){
                promisedPileIds = PileService.getPileIds(user._id);
            }else if(user.role === 'supervisor'){
                promisedPileIds = PileService.getPilesIdsInCounty(user.county);
            }else{
                return res.handleResponse(400, {}, "activity_1");
            }
            promisedPileIds.then(
                function (pile_ids) {
                    //now we can query for activities that refer to the pile_ids obtained
                    //since the activities' "viewed" field is an array of users that viewed the activity,
                    //we need to return it as a boolean being true if the user is found in the array and false otherwise
                    var cursor = Activity.aggregate([
                        {$match: {pile: {$in: pile_ids}}},
                        {$sort: {date_created: -1}},
                        {$skip: page * limit},
                        {$limit: parseInt(limit)},
                        {$project: {
                            actor: 1,
                            verb: 1,
                            pile: 1,
                            date_created: 1,
                            viewed: {$setIsSubset: [[user._id], "$viewed"]}
                        }}
                    ]);

                    cursor.exec(function (err, activities) {
                        if(err){
                            handleError(res, err);
                        }else{
                            Activity.deepPopulate(activities, "pile.images", function (err, activities) {
                              if(err){
                                handleError(res, err);
                              }else{
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
 * Mark the activity with the specified id as viewed by the authenticated user
 * @param {object} req
 * @param {object} res
 */
exports.markAsViewed = function (req ,res) {
    if(req.query.id){
        Activity.update({_id: req.query.id}, {$addToSet: {viewed: req.user._id}}, function (err, wres) {
            if(err){
                handleError(res, err);
            }else{
                res.handleResponse(200, {success: true});
            }
        });
    }else{
        res.handleResponse(400);
    }
};

var handleError = function (res, err) {
    console.log(err);
    res.handleResponse(500, {error: true});
};
