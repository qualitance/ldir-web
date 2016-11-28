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
 * @name findOnMap
 * @function
 * @description find piles for map (with is_hidden false or undefined) depending on user role
 * @param {Object} req
 * @param {Object} res
 */
exports.findOnMap = function (req, res) {
    if (req.user.role !== 'admin') {
        var query = {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]};
        if (req.user.role === 'volunteer') {
            query = {$and: [{$or: [{status: {$ne: 'unconfirmed'}}, {user: req.user._id}]}, {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]}]};
        }
    }
    Pile.find(query, '_id location nr_ord size status user').setOptions({lean: true}).exec(function (err, piles) {
        if (err) {
            handleError(res, err);
        } else {
            res.handleResponse(200, {success: piles});
        }
    });
};

/**
 * @name find
 * @function
 * @description find pile for dashboard view
 * get all params, allow only certain filters to pass and only if they have a value, differentiate query based on role
 * for volunteer, find piles contributed to, except piles created by this volunteer
 * for supervisor, find piles located in this supervisor's county
 * proceed to pagination and sorting, using a cursor
 * @param {Object} req
 * @param {Object} res
 */
exports.find = function (req, res) {
    var id = req.query.id;
    if (id) {
        Pile.findOne({_id: id}).populate('images county city allocated.authority allocated.user user screenshot').setOptions({lean: true}).exec(function (err, pile) {
            if (err) {
                return handleError(res, err);
            }
            if (!pile) {
                return res.handleResponse(404);
            }
            return res.handleResponse(200, {success: pile});
        });
    } else {
        var contributions = req.query.contributions;
        var page = req.query.page || 1;
        var limit = req.query.limit || env.defaultPaginationLimit;
        var filter = req.query.filter;
        var city = req.query.city_id;
        var sort = req.query.sort;
        var user = req.user; //get user from request
        var cleanedFilter = {};

        if (filter) {
            try {
                filter = JSON.parse(filter);
                //allow only certain filters to pass and only if they have a value
                if (filter.county) cleanedFilter.county = filter.county;
                if (filter.status) cleanedFilter.status = filter.status;
            } catch (ex) {
                return res.handleResponse(400, {}, 'pile_1');
            }
        }

        if (sort) {
            try {
                sort = JSON.parse(sort);
            } catch (ex) {
                return res.handleResponse(400, {}, 'pile_2');
            }
        }

        var query = {};

        async.parallel([
            function (callback) {
                if (user.role === 'volunteer') {
                    if (contributions !== 'true') {
                        query['user'] = user._id;
                        callback();
                    } else {
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
                } else if (user.role === 'supervisor') {
                    if (!user.county) {
                        callback('Supervisor has no county');
                    } else {
                        query['county'] = user.county;
                        if (city) {
                            query['city'] = city;
                            callback();
                        } else {
                            callback();
                        }
                    }
                } else {
                    callback();
                }
            },
            function (callback) {
                if (cleanedFilter) {
                    _.assign(query, cleanedFilter);
                }
                callback();
            }
        ], function (err) {
            if (err) {
                handleError(res, err);
            } else {
                var cursor = {};
                if (user.role === 'admin') {
                    cursor = Pile.find(query).populate('images user city county');
                } else {
                    cursor = Pile.find({$and: [query, {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]}]}).populate('images user city county');
                }
                if (sort && sort.by) {
                    var sortQuery = {};
                    sortQuery[sort.by] = sort.order;
                    cursor.sort(sortQuery);
                }
                cursor.setOptions({lean: true}).paginate(page, limit, function (err, piles, total) {
                    if (err) {
                        return handleError(res, err);
                    } else {
                        res.setHeader('X-Total-Count', total);
                        res.handleResponse(200, {success: piles});
                    }
                });
            }
        });
    }
};


/**
 * @name create
 * @function
 * @description uses the "multer" plugin to parse our form data request and places any text field on req.body[field]
 * and any file field on req.files[field]
 * the text fields should already be parsed in a previous middleware and we should have the pile details on req.body
 * validate files
 * create empty images and add their references to the pile
 * set the references to the empty images created
 * @param {Object} res
 * @param {Object} req - request object
 * @param {String} req.body.siruta - Unique code given to cities/counties by authorities
 * @param {number} req.body.size - Pile size
 * @param {Object} req.body.location - Object containing lat and long
 * @param {Object} req.body.location.lat - Latitude
 * @param {Object} req.body.location.lng - Longitude
 * @param {String[]} req.body.content - Array of pile types
 * @param {String[]} req.body.areas - Array of pile areas
 */
exports.create = function (req, res) {
    for (var key in req.files) {
        var file = req.files[key];
        if (file.truncated) {
            return res.handleResponse(400, {}, 'image_3');
        }
    }
    if (req.body.county) {
        delete req.body.county;
    }
    if (req.body.city) {
        delete req.body.city;
    }
    if (!req.body.siruta) {
        return res.handleResponse(400, {}, 'pile_3');
    } else if (req.body.size && (req.body.size < 1 || req.body.size > 5)) {
        return res.handleResponse(400, {}, 'pile_4');
    } else {
        CityService.getCity(req.body.siruta).then(
            function (c) {
                var pile = new Pile(req.body);
                pile.city = c.county ? c._id : null;
                pile.county = c.county ? c.county : c._id;
                pile.user = req.user._id;
                CounterService.getNextSequence('pile').then(
                    function (seq) {
                        pile.nr_ord = seq;

                        var imageIds = [];
                        async.each(req.files, function processFile(file, callback) {
                            ImageService.createEmpty()
                                .then(function (image) {
                                    imageIds.push(image._id);
                                    var extension = file.mimetype || file.name.split('.').pop();
                                    Queue.uploadPileImage(file.name, extension, pile._id, image._id, req.user); // happens async
                                    callback();
                                })
                                .catch(function (err) {
                                    callback(err);
                                });
                        }, function doneProcessingFiles(err) {
                            if (err) {
                                return handleError(res, err);
                            } else {
                                pile.images = imageIds;
                                pile.save(function (err, pile) {
                                    if (err) {
                                        return handleError(res, err);
                                    } else {
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
};

/**
 * @name update
 * @function
 * @description updates existing pile
 * @param {Object} req
 * @param {Object} res
 */
exports.update = function (req, res) {
    UtilsService.allowFields(req.body, ['status', 'description']);
    Pile.findById(req.query.id).exec(function (err, pile) {
        if (err) {
            return handleError(res, err);
        }
        if (!pile) {
            return res.handleResponse(404);
        }
        var updated = _.assign(pile, req.body);
        updated.updated_by = req.user._id;
        updated.save(function (err) {
            if (err) {
                return handleError(res, err);
            }
            pile.populate('images', function (err, pile) {
                if (err) {
                    return handleError(res, err);
                }
                return res.handleResponse(200, {success: pile});
            });
        });
    });
};

/**
 * @name updateLocation
 * @function
 * @description updates pile location
 * @param {Object} req
 * @param {Object} res
 */
exports.updateLocation = function (req, res) {
    UtilsService.allowFields(req.body, ['location', 'siruta']);
    Pile.findById(req.query.id).exec(function (err, pile) {
        if (err) {
            return handleError(res, err);
        }
        if (!pile) {
            return res.handleResponse(404);
        }
        if (!req.body.siruta) {
            return res.handleResponse(400, {}, 'pile_3');
        } else {
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

/**
 * @name hide
 * @function
 * @description sets pile hidden flag to true
 * @param {Object} req
 * @param {Object} res
 */
exports.hide = function (req, res) {
    UtilsService.allowFields(req.body, ['is_hidden']);
    Pile.findById(req.query.id).exec(function (err, pile) {
        if (err) {
            return handleError(res, err);
        }
        if (!pile) {
            return res.handleResponse(404);
        }
        var updated = _.assign(pile, req.body);
        updated.updated_by = req.user._id;
        updated.save(function (err) {
            if (err) {
                return handleError(res, err);
            }
            pile.populate('images', function (err, pile) {
                if (err) {
                    return handleError(res, err);
                }
                return res.handleResponse(200, {success: pile});
            });
        });
    });
};

/**
 * @name allocate
 * @function
 * @description allocate pile to authority, generate pdf and send to authority async
 * @param {Object} req
 * @param {Object} res
 */
exports.allocate = function (req, res) {
    var due_date = req.body.due_date;
    if (!due_date) {
        return res.handleResponse(400, {}, 'pile_5');
    }
    try {
        due_date = UtilsService.resetTimeInDate(new Date(due_date));
        var min_due_date = UtilsService.resetTimeInDate(UtilsService.datePlusDays(new Date(), env.pile.min_reported_days));
        if (due_date < min_due_date) {
            return res.handleResponse(400, {'min_reported_days': env.pile.min_reported_days}, 'pile_6');
        }
    } catch (ex) {
        return res.handleResponse(400, {}, 'pile_7');
    }
    var authority_id = req.body.authority_id;
    if (!authority_id) return res.handleResponse(400, {}, 'pile_8');
    var pile_id = req.body.pile_id;
    if (!pile_id) return res.handleResponse(400, {}, 'pile_9');
    Pile.findOne({_id: pile_id}, function (err, pile) {
        if (err) {
            return handleError(res, err);
        } else if (!pile) {
            return res.handleResponse(404, {}, 'pile_10');
        } else {
            AuthorityService.validateAuthorityId(authority_id, pile.city).then(
                function (authority_id) {
                    var nr_ord;
                    if (pile.allocated && typeof pile.allocated.nr_ord === 'number') {
                        nr_ord = pile.allocated.nr_ord + 1;
                    } else {
                        nr_ord = 0;
                    }
                    pile.allocated = {
                        user: req.user._id,
                        authority: authority_id,
                        due_date: due_date,
                        file_path: null,
                        nr_ord: nr_ord
                    };
                    pile.status = 'reported';
                    pile.updated_by = req.user._id;
                    pile.save(function (err, pile) {
                        if (err) {
                            return handleError(res, err);
                        } else {
                            Pile.populate(pile, {path: 'allocated.user allocated.authority'}, function (err, pile) {
                                if (err) {
                                    handleError(res, err);
                                } else {
                                    res.handleResponse(200, {success: pile});
                                }
                            });
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
 * @name pileConfirmation
 * @function
 * @description confirm/unconfirm pile, prevent multiple actions on the same pile
 * @param {Object} req
 * @param {Object} res
 */
exports.pileConfirmation = function (req, res) {
    var action = req.body.action;
    var notAction;
    var pile_id = req.body.pile;
    if (!pile_id || (action !== 'confirm' && action !== 'unconfirm')) {
        res.handleResponse(400, {}, 'pile_11');
    } else {
        if (action === 'confirm') {
            notAction = 'unconfirm';
        } else {
            notAction = 'confirm';
        }
        var add = {};
        var remove = {};
        add[action] = req.user._id;
        remove[notAction] = req.user._id;
        var modifyQuery = {$addToSet: add, $pull: remove, last_update: new Date()};
        var query = {_id: pile_id, user: {$ne: req.user._id}};
        query[action] = {$nin: [req.user._id]};
        Pile.update(query, modifyQuery, function (err, wres) {
            if (err) {
                handleError(res, err);
            } else {
                Pile.findOne({_id: pile_id}, function (err, pile) {
                    if (err) {
                        handleError(res, err);
                    } else if (!pile) {
                        res.handleResponse(404, {}, 'pile_10');
                    } else {
                        res.handleResponse(200, {success: pile});
                        if (wres > 0) {
                            ActivityService.create(req.user._id, 'confirmation.' + action, pile._id);
                        }
                    }
                });
            }
        });
    }
};

/**
 * @name getStatistics
 * @function
 * @description get statistics for specified county, within the date range
 * @param {Object} req
 * @param {Object} res
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
                res.handleResponse(err.status || 500, {error: err});
            }
        );
    };

    if (siruta) {
        CountyService.getCounty(siruta).then(
            function (county) {
                county_id = county._id.toString();
                getStats();
            },
            function (err) {
                handleError(res, err);
            }
        );
    } else {
        getStats();
    }
};

function handleError(res, err) {
    console.log(err);
    return res.handleResponse(500, {error: 'SERVER_ERROR'});
}
