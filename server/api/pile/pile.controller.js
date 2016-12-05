'use strict';

var _ = require('lodash');
var Pile = require('./pile.model');

var CountyService = require('../county/county.service');
var CityService = require('../city/city.service');
var CounterService = require('../counter/counter.service');
var ActivityService = require('../activity/activity.service');
var AuthorityService = require('../authority/authority.service');
var PileService = require('./pile.service');
var ImageService = require('../image/image.service');

var Queue = require('../../components/queue');
var UtilsService = require('../../components/utils');
var StatisticsService = require('../../components/statistics');

var env = require('../../config/environment');

var Q = require('q');
var async = require('async');

/**
 * 	This works differently depending on the user making the query.
 * 	If the user is admin, all the piles are returned, otherwise all the piles that are not hidden are returned.
 * 	Additionally, if the user is a volunteer, all the piles with a not pending status and pending piles reported
 * 	by the user are returned
 * @param req
 * @param res
 */
exports.findOnMap = function (req, res) {
    //find piles without is_hidden field or with is_hidden field set to false
    if (req.user.role === 'admin') {
      var query = {}
    } else {
      var query = {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]};
      if (req.user.role === 'volunteer') {
        //find piles with a not pending status and pending piles reported by this user
        query = {$and: [{$or: [{status: {$ne: "unconfirmed"}}, {user: req.user._id}]}, {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]}]};
      }
    }
    Pile.find(query, '_id location nr_ord size status user').setOptions({lean: true}).exec(function (err, piles) {
        if(err){
            handleError(res, err);
        }else{
            res.handleResponse(200, {success: piles});
        }
    });
};

/**
 * The query works differently depending on the user role.
 * If the user is a volunteer: a param contributions=true may be specified, in which case only the piles that the user
 * contributed to (ex commented on) are returned, otherwise only the piles created by the user are returned.
 * If user is supervisor: only the piles located in the supervisor's county are returned.
 * If user is admin: all the piles are returned, including the ones that are hidden
 * @param req
 * @param res
 */
exports.find = function (req, res) {
    var id = req.query.id;
    if(id){
        Pile.findOne({_id: id}).populate('images county city allocated.authority allocated.user user screenshot').setOptions({lean: true}).exec(function (err, pile) {
            if(err) { return handleError(res, err); }
            if(!pile) { return res.handleResponse(404); }
            return res.handleResponse(200, {success: pile});
        });
    }else{
        //get all params
        var contributions = req.query.contributions;
        var page = req.query.page || 1;
        var limit = req.query.limit || env.defaultPaginationLimit;
        var filter = req.query.filter;
        var city = req.query.city_id;
        var sort = req.query.sort;
        var user = req.user; //get user from request
        var cleanedFilter = {};

        if(filter){
          try{
            filter = JSON.parse(filter);
            //allow only certain filters to pass and only if they have a value
            if(filter.county) cleanedFilter.county = filter.county;
            if(filter.status) cleanedFilter.status = filter.status;
          }catch(ex){
            return res.handleResponse(400, {}, "pile_1");
          }
        }

        if(sort){
          try{
            sort = JSON.parse(sort);
          }catch(ex){
            return res.handleResponse(400, {}, "pile_2");
          }
        }

        //form a complex query object based on the params above
        var query = {};

        //======================================================================= differentiate query based on role
        async.parallel([
            function (callback) {
                if(user.role === 'volunteer'){
                    //=================================================================================== VOLUNTEER
                    if(contributions !== 'true'){
                        //find piles reported by this volunteer
                        query['user'] = user._id;
                        callback();
                    }else{
                        //find piles this volunteer contributed to, except piles created by this volunteer
                        ActivityService.getIdsOfPilesContributedTo(user._id).then(
                            function (pile_ids) {
                                query['user'] = {$ne: user._id};
                                query['_id'] = {$in: pile_ids};
                                callback();
                            },
                            function (err) {
                                callback(err);
                            }
                        );
                    }
                }else if(user.role === 'supervisor'){
                    //================================================================================== SUPERVISOR
                    //find piles located in this supervisor's county
                    if(!user.county){
                        callback("Supervisor has no county");
                    }else{
                        query['county'] = user.county;
                        if(city){
                            query['city'] = city;
                            callback();
                        }else{
                            callback();
                        }
                    }
                }else{
                    //======================================================================================= ADMIN
                    //please proceed, sir
                    callback();
                }
            },
            function (callback) {
                //filter by field value
                if(cleanedFilter){
                  _.assign(query, cleanedFilter);
                }
                callback();
            }
        ], function (err) {
            if(err){
                handleError(res, err);
            }else{
                //proceed to pagination and sorting
                //use a cursor for this
                if(user.role === 'admin') {
                  var cursor = Pile.find(query).populate('images user city county');
                } else {
                  var cursor = Pile.find({$and : [query , {$or: [{is_hidden : false}, {is_hidden : {$exists : false}}]}]}).populate('images user city county');
                }
                if(sort && sort.by){
                    var sortQuery = {};
                    sortQuery[sort.by] = sort.order;
                    cursor.sort(sortQuery);
                }
                cursor.setOptions({lean: true}).paginate(page, limit, function (err, piles, total) {
                    if(err){
                        return handleError(res, err);
                    }else{
                        res.setHeader('X-Total-Count', total);
                        //res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
                        res.handleResponse(200, {success: piles});
                    }
                });
            }
        });
    }
};

/**
 * Create a new pile
 * @param {Object} req - request object
 * @param {String} req.body.siruta - Unique code given to cities/counties by authorities
 * @param {number} req.body.size - Pile size
 * @param {Object} req.body.location - Object containing lat and long
 * @param {Object} req.body.location.lat - Latitude
 * @param {Object} req.body.location.lng - Longitude
 * @param {String[]} req.body.content - Array of pile types
 * @param {String[]} req.body.areas - ????
 * @param res
 */
exports.create = function (req, res) {
    // the "multer" plugin parses our form data request and places any text field on req.body[field] and any file field on req.files[field]
    // the text fields should already be parsed in a previous middleware and we should have the pile details on req.body
    // validate files
    for(var key in req.files){
        var file = req.files[key];
        if (file.truncated) return res.handleResponse(400, {}, "image_3");
    }
    if(req.body.county) delete req.body.county;
    if(req.body.city) delete req.body.city;
    if(!req.body.siruta){
        return res.handleResponse(400, {}, "pile_3");
    }else if(req.body.size && (req.body.size<1 || req.body.size>5)){
        return res.handleResponse(400, {}, "pile_4");
    }else{
        CityService.getCity(req.body.siruta).then(
            function (c) {
                var pile = new Pile(req.body);
                pile.city = c.county ? c._id : null;
                pile.county = c.county ? c.county : c._id;
                pile.user = req.user._id;
                CounterService.getNextSequence("pile").then(
                    function (seq) {
                        pile.nr_ord = seq;
                        // create empty images and add their references to the pile
                        var imageIds = [];
                        async.each(req.files, function processFile(file, callback) {
                            ImageService.createEmpty()
                                .then(function (image) {
                                    imageIds.push(image._id);
                                    var extension = file.mimetype || file.name.split(".").pop();
                                    Queue.uploadPileImage(file.name, extension, pile._id, image._id, req.user); // happens async
                                    callback();
                                })
                                .catch(function (err) {
                                    callback(err);
                                });
                        }, function doneProcessingFiles(err) {
                            if(err){
                                return handleError(res, err);
                            }else{
                                // set the references to the empty images created
                                pile.images = imageIds;
                                pile.save(function (err, pile) {
                                    if(err){
                                        return handleError(res, err);
                                    }else{
                                        return res.handleResponse(201, {success: pile});
                                    }
                                });
                            }
                        });
                    },
                    function (err) {
                        handleError(res, err);
                    }
                );
            }, function (err) {
                return handleError(res, err);
            }
        );
    }
}

// Updates an existing pile in the DB.
exports.update = function(req, res) {
  UtilsService.allowFields(req.body, ["status","description"]);
  Pile.findById(req.query.id).exec(function (err, pile) {
    if (err) { return handleError(res, err); }
    if(!pile) { return res.handleResponse(404); }
    var updated = _.assign(pile, req.body);
    updated.updated_by = req.user._id;
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      pile.populate('images', function (err, pile) {
          if (err) { return handleError(res, err); }
          return res.handleResponse(200, {success: pile});
      });
    });
  });
};

exports.updateLocation = function(req, res) {
  UtilsService.allowFields(req.body, ["location","siruta"]);
  Pile.findById(req.query.id).exec(function (err, pile) {
    if (err) { return handleError(res, err); }
    if(!pile) { return res.handleResponse(404); }
    if(!req.body.siruta){
      return res.handleResponse(400, {}, "pile_3");
    }else {
      CityService.getCity(req.body.siruta).then(
        function (c) {
          req.body.city = c.county ? c._id : null;
          req.body.county = c.county ? c.county : c._id;
          var updated = _.assign(pile, req.body);
          updated.updated_by = req.user._id;
          updated.save(function (err) {
            if (err) {
              return handleError(res, err);
            }
            pile.populate('images city county', function (err, pile) {
              if (err) {
                return handleError(res, err);
              }
              return res.handleResponse(200, {success: pile});
            });
          });
        });
    }
  });
};

exports.hide = function(req, res) {
  UtilsService.allowFields(req.body, ["is_hidden"]);
  Pile.findById(req.query.id).exec(function (err, pile) {
    if (err) { return handleError(res, err); }
    if(!pile) { return res.handleResponse(404); }
    var updated = _.assign(pile, req.body);
    updated.updated_by = req.user._id;
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      pile.populate('images', function (err, pile) {
        if (err) { return handleError(res, err); }
        return res.handleResponse(200, {success: pile});
      });
    });
  });
};

/**
 * 	A pdf containing the pile details is sent to the authority. If the due_date is exceeded, the supervisor is notified
 * @param req
 * @param res
 */
exports.allocate = function (req, res) {
    var due_date = req.body.due_date;
    if(!due_date) return res.handleResponse(400, {}, "pile_5");
    try{
        due_date = UtilsService.resetTimeInDate(new Date(due_date));
        var min_due_date = UtilsService.resetTimeInDate(UtilsService.datePlusDays(new Date(), env.pile.min_reported_days));
        if(due_date < min_due_date){
            return res.handleResponse(400, {"min_reported_days": env.pile.min_reported_days}, "pile_6");
        }
    }catch(ex){
        return res.handleResponse(400, {}, "pile_7");
    }
    var authority_id = req.body.authority_id;
    if(!authority_id) return res.handleResponse(400, {}, "pile_8");
    var pile_id = req.body.pile_id;
    if(!pile_id) return res.handleResponse(400, {}, "pile_9");
    Pile.findOne({_id: pile_id}, function (err, pile) {
        if(err){
            return handleError(res, err);
        }else if(!pile){
            return res.handleResponse(404, {}, "pile_10");
        }else{
            AuthorityService.validateAuthorityId(authority_id, pile.city).then(
                function (authority_id) {
                    var nr_ord;
                    if(pile.allocated && typeof pile.allocated.nr_ord === "number") {
                        nr_ord = pile.allocated.nr_ord + 1;
                    }else{
                        nr_ord = 0;
                    }
                    pile.allocated = {
                        user: req.user._id,
                        authority: authority_id,
                        due_date: due_date,
                        file_path: null,
                        nr_ord: nr_ord
                    };
                    pile.status = "reported";
                    pile.updated_by = req.user._id;
                    pile.save(function (err, pile) {
                        if(err){
                            return handleError(res, err);
                        }else{
                            Pile.populate(pile, {path: "allocated.user allocated.authority"}, function (err, pile) {
                                if(err){
                                    handleError(res, err);
                                }else{
                                    res.handleResponse(200, {success: pile});
                                }
                            });
                            //generate pdf and send to authority async
                            PileService.generateAuthorityReport(pile_id).then(
                              function (buffer) {
                                AuthorityService.sendToAuthority(authority_id, buffer);
                              },
                              function (err) {
                                console.log(err);
                              }
                            );
                        }
                    });
                },
                function (err) {
                    return res.handleResponse(403, {}, err.code);
                }
            );
        }
    });
};

/**
 * 	A notification is sent to the user that reported the pile
 * @param req
 * @param res
 */
exports.pileConfirmation = function (req, res) {
    var action = req.body.action;
    var notAction;
    var pile_id = req.body.pile;
    if(!pile_id || (action!=="confirm" && action!=="unconfirm")){
        res.handleResponse(400, {}, "pile_11");
    }else{
        if(action === "confirm"){
            notAction = "unconfirm";
        }else{
            notAction = "confirm";
        }
        //parse modify query; user can make a single confirm / unconfirm on a pile
        var add = {};
        var remove = {};
        add[action] = req.user._id;
        remove[notAction] = req.user._id;
        var modifyQuery = {$addToSet: add, $pull: remove, last_update: new Date()};
        //parse find query
        //prevent self confirm / unconfirm of pile
        //prevent multiple confirm / unconfirm of the same pile, otherwise too many notifications will be triggered
        var query = {_id: pile_id, user: {$ne: req.user._id}};
        query[action] = {$nin: [req.user._id]};
        Pile.update(query, modifyQuery, function (err, wres) {
            if(err){
                handleError(res, err);
            }else{
                Pile.findOne({_id: pile_id}, function (err, pile) {
                    if(err){
                        handleError(res, err);
                    }else if(!pile){
                        res.handleResponse(404, {}, "pile_10");
                    }else{
                        res.handleResponse(200, {success: pile});
                        if(wres > 0) ActivityService.create(req.user._id, "confirmation."+action, pile._id);
                    }
                });
            }
        });
    }
};

/**
 * 	The piles statistics for the county / period are returned
 * 	body: siruta, date_start, date_end;
 * 	For the query to work, you must provide either a siruta code for a county, or a date start and date end, or all of them.
 * @param req
 * @param res
 */
exports.getStatistics = function (req, res) {
    var siruta = req.body.siruta;
    var date_start = req.body.date_start;
    var date_end = req.body.date_end;
    var county_id;

    var getStats = function () {
        StatisticsService.getPileStats(county_id, date_start, date_end).then(
            function (stats) {
                res.handleResponse(200, {success: stats});
            },
            function (err) {
                res.handleResponse(err.status||500, {error: err});
            }
        );
    };

    if(siruta){
        CountyService.getCounty(siruta).then(
            function (county) {
                county_id = county._id.toString();
                getStats();
            },
            function (err) {
                handleError(res, err);
            }
        );
    }else{
        getStats();
    }
};

//// Deletes a pile from the DB.
//exports.destroy = function(req, res) {
//  Pile.findById(req.params.id, function (err, pile) {
//    if(err) { return handleError(res, err); }
//    if(!pile) { return res.send(404); }
//    pile.remove(function(err) {
//      if(err) { return handleError(res, err); }
//      return res.send(204);
//    });
//  });
//};

function handleError(res, err) {
  console.log(err);
  return res.handleResponse(500, {error: "SERVER_ERROR"});
}
