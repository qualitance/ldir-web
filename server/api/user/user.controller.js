'use strict';

var User = require('./user.model');
var County = require('../county/county.model');
var mongoose = require('mongoose');
var config = require('../../config/environment');
var mailer = require('../../components/mailer');
var moment = require('moment');
var url = require('url');
var _ = require('lodash');
var UserService = require('./user.service');
var UtilsService = require('../../components/utils');
var PushService = require('../../components/pushNotifications');
var env = require('../../config/environment');

var CountyService = require('../county/county.service');
var StatisticsService = require('../../components/statistics');

var validationError = function (res, err) {
    return res.handleResponse(422, {error: err});
};
function handleError(res, err) {
    console.log(err);
    return res.handleResponse(500);
}

/**
 * @name query_users
 * @function
 * @description gets list of all users, except "admin"
 * @param {Object} req
 * @param {Object} res
 */
exports.query_users = function (req, res) {
    if (req.query.id) {
        User.findById(req.query.id).select('+phone +address').populate('county').exec(function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.handleResponse(404, {}, 'user_10');
            }
            res.handleResponse(200, {success: user});
        });
    } else {
        var query = {};
        var page = req.query.page || 1;
        var limit = req.query.limit || env.defaultPaginationLimit;
        var sort_by = req.query.sort_by;
        var sort_order = req.query.sort_order;
        var country = req.query.filter_by_country;

        for (var q in req.query) {
            if (q.indexOf('filter_by_') !== -1 && req.query[q] && q !== 'filter_by_country') {
                var key = q.split('filter_by_')[1];
                if (key === 'first_name' || key === 'last_name' || key === 'email') {
                    query[key] = {
                        $regex: new RegExp('^' + req.query[q]),
                        $options: 'i'
                    };
                }
                else {
                    query[key] = req.query[q];
                }
            }
        }

        var cursor = User.find(query).select('+phone +address').deepPopulate('county county.country');
        if (sort_by && sort_order) {
            var sort = {};
            sort[sort_by] = sort_order;
            cursor.sort(sort);
        }
        cursor.paginate(page, limit, function (err, users, total) {
            if (err) {
                return handleError(res, err);
            } else {
                if (country) {
                    for (var i = 0; i < users.length; i++) {
                        if (!users[i].county) {
                            users.splice(i, 1);
                            i--;
                        } else if (users[i].county.country._id.toString() != req.query.filter_by_country) {
                            users.splice(i, 1);
                            i--;
                        }
                    }
                }

                res.setHeader('X-Total-Count', total);
                res.handleResponse(200, {success: users});
            }
        });
    }
};

/**
 * @name edit_user
 * @function
 * @description updates user, protecting user's private data from being altered
 * @param {Object} req
 * @param {Object} res
 */
exports.edit_user = function (req, res) {
    User.findOne({_id: req.query.id}, function (err, user) {
        if (err) {
            handleError(res, err);
        } else if (!user) {
            res.handleResponse(404);
        } else if (user.role === 'admin') {
            res.handleResponse(403);
        } else {
            UtilsService.discardFields(req.body, [
                'created_at', 'updated_at', 'image', 'pile_count', 'newsletter',
                'sync', 'pass', 'password', 'hashedPassword', 'provider', 'salt', 'facebook',
                'device', 'temporaryToken', 'createToken', '_id'
            ]);
            _.assign(user, req.body);
            user.updatedBy = req.user;
            user.save(function (err, user) {
                if (err) {
                    handleError(res, err);
                } else {
                    res.handleResponse(200, {success: user});
                }
            });
        }
    });
};

/**
 * @name delete_user
 * @function
 * @description deletes user
 * @param {Object} req
 * @param {Object} res
 */
exports.delete_user = function (req, res) {
    User.remove({_id: req.query.id}, function (err, wRes) {
        if (err) {
            handleError(res, err);
        } else {
            res.handleResponse(200, {success: wRes}, 'user_1');
        }
    });
};

/**
 * @name create_supervisor
 * @function
 * @description creates supervisor from admin account
 * @param {Object} req
 * @param {Object} res
 */
exports.create_supervisor = function (req, res) {

    if (!req.body.first_name || !req.body.last_name || !req.body.email) {
        return validationError(res, 'Missing params');
    }

    var newUser = new User({
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name
    });

    newUser.role = 'supervisor';
    newUser.provider = 'local';
    newUser.status = 'pending';
    newUser.terms = true;
    newUser.pass = true;
    newUser.createToken = newUser.generateCreateToken();
    newUser.created_at = Date.now();

    newUser.save(function (err, user) {
        if (err) return validationError(res, err);

        var u = {
            protocol: req.protocol,
            host: req.headers.host,
            path: url.parse(req.url).pathname
        };

        var link = config.staticSite + '/set_password/' + user.createToken;

        mailer.sendToExistingUser(
            user._id,
            'claim_account_multilang',
            [{name: 'LINK', content: link}, {name: 'WEBSITE', content: u.host}],
            'claim_account',
            null,
            {subject: 'claim_account'}
        ).then(
            function (success) {
                res.handleResponse(200);
            },
            function (error) {
                handleError(res, error);
            }
        );
    });
};

/**
 * @name getStatisticsAll
 * @function
 * @description get statistics for all users
 * @param {Object} req
 * @param {Object} res
 */
exports.getStatisticsAll = function (req, res) {
    User.find({}, {
        first_name: 1,
        last_name: 1,
        email: 1,
        role: 1,
        county: 1,
        created_at: 1
    }).populate('county').exec(function (err, users) {
        if (err) {
            console.log(err);
            res.handleResponse(500);
        } else {
            res.handleResponse(200, {success: users});
        }
    });
};

/**
 * @name me
 * @function
 * @description get logged in user info
 * @param {Object} req
 * @param {Object} res
 */
exports.me = function (req, res, next) {
    var userId = req.user._id;
    User.findOne({
        _id: userId
    }).select('+phone +address +image').deepPopulate('county image county.country').setOptions({lean: true}).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.handleResponse(401);
        }
        res.handleResponse(200, {success: user});
    });
};

/**
 * @name update
 * @function
 * @description updates logged in user profile
 * @param {Object} req
 * @param {Object} res
 */
exports.update = function (req, res) {
    UtilsService.discardFields(req.body, [
        '_id', 'email', 'created_at', 'updated_at', 'pile_count', 'role', 'status', 'password',
        'pass', 'hashedPassword', 'provider', 'salt', 'facebook', 'device', 'temporaryToken', 'createToken'
    ]);
    if (req.body.image && req.body.image._id) {
        req.body.image = req.body.image._id; //populated images can come back and haunt you
    }
    if (req.body.county && req.body.county._id) {
        req.body.county = req.body.county._id; //populated counties can also come back and haunt you
    }

    User.findById(req.user._id, function (err, user) {
        if (err) {
            return handleError(res, err);
        }

        if (!user) {
            return res.handleResponse(404);
        }

        var updated = _.merge(user, req.body);
        updated.save(function (err) {

            if (err) {
                return handleError(res, err);
            }
            User.findById(req.user._id).select('+phone +address +image').deepPopulate('county image county.country').exec(function (err, user) {

                if (err) {
                    return handleError(res, err);
                }
                return res.handleResponse(200, {success: user});
            });
        });

    });

};

/**
 * @name destroy
 * @function
 * @description removes logged in user
 * @param {Object} req
 * @param {Object} res
 */
exports.destroy = function (req, res) {
    User.findByIdAndRemove(req.user._id, function (err, user) {
        if (err) {
            return res.handleResponse(500, {error: err});
        }
        return res.handleResponse(204);
    });
};

/**
 * @name changePasswordbyAuth
 * @function
 * @description changes logged in user password
 * @param {Object} req
 * @param {Object} res
 */
exports.changePasswordbyAuth = function (req, res, next) {

    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    if (!newPass) {
        return res.handleResponse(400);
    }

    var changePass = function (user) {
        user.password = newPass;
        user.provider = 'local';
        user.pass = true;
        user.save(function (err) {
            if (err) {
                return validationError(res, err);
            }
            res.handleResponse(200);
        });
    };

    User.findById(userId).select('+hashedPassword +salt').exec(function (err, user) {
        if (user.pass) {
            if (!oldPass) {
                return res.handleResponse(400);
            } else if (user.authenticate(oldPass)) {
                changePass(user);
            } else {
                res.handleResponse(403);
            }
        } else {
            changePass(user);
        }
    });
};

/**
 * @name getUserStatistics
 * @function
 * @description gets logged in user stats
 * @param {Object} req
 * @param {Object} res
 */
exports.getUserStatistics = function (req, res) {
    UserService.getStats(req.user._id).then(
        function (stats) {
            res.handleResponse(200, {success: stats});
        },
        function (err) {
            handleError(res, err);
        }
    );
};

/**
 * @name subscribeDevice
 * @function
 * @description subscribes device for push notifications
 * @param {Object} req
 * @param {Object} res
 */
exports.subscribeDevice = function (req, res) {
    var deviceType = req.body.deviceType;
    var deviceToken = req.body.deviceToken;
    if (!deviceType || !deviceToken) {
        res.handleResponse(400, {error: 'user_11'});
    } else {
        PushService.subscribe(deviceType, deviceToken, req.user._id).then(
            function (stats) {
                res.handleResponse(200, {success: stats});
            },
            function (err) {
                handleError(res, err);
            }
        );
    }
};

/**
 * @name unsubscribeDevice
 * @function
 * @description unsubscribes device for push notifications
 * @param {Object} req
 * @param {Object} res
 */
exports.unsubscribeDevice = function (req, res) {
    var deviceToken = req.body.deviceToken;
    if (!deviceToken) {
        res.handleResponse(400, {error: 'user_11'});
    } else {
        PushService.unsubscribeDevice(deviceToken).then(
            function (succes) {
                res.handleResponse(200, {success: succes});
            },
            function (err) {
                handleError(res, err);
            }
        );
    }
};

/**
 * @name create
 * @function
 * @description creates new user
 * @param {Object} req
 * @param {Object} res
 */
exports.create = function (req, res) {

    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
        return res.handleResponse(400);
    }

    var newUser = new User({
        email: email,
        password: password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        language: req.body.language
    });

    newUser.provider = 'local';
    newUser.role = 'volunteer';
    newUser.status = 'pending';
    newUser.terms = true;
    newUser.pass = true;
    newUser.password = req.body.password;
    newUser.created_at = Date.now();

    newUser.save(function (err, user) {
        if (err) {
            return validationError(res, err);
        }

        UserService.sendActivationMail(req, user.email, function (err, success) {
            if (err) {
                handleError(res, err);
            } else {
                res.handleResponse(200, {success: _.omit(user.toObject(), ['hashedPassword', 'salt'])});
            }
        });
    });
};

/**
 * @name findUserByToken
 * @function
 * @description finds user by token
 * @param {Object} req
 * @param {Object} res
 */
exports.findUserByToken = function (req, res) {
    if (!req.params.token) {
        return res.handleResponse(400);
    }
    User.findOne({createToken: req.params.token}, function (err, user) {
        if (err) {
            handleError(res, err);
        } else if (!user) {
            res.handleResponse(404, {}, 'user_2');
        } else if (user.status === 'inactive') {
            res.handleResponse(403, {}, 'user_3');
        } else {
            res.handleResponse(200, {success: user});
        }
    });
};

/**
 * @name setPassByToken
 * @function
 * @description sets password by user created by admin
 * @param {Object} req
 * @param {Object} res
 */
exports.setPassByToken = function (req, res) {
    if (!req.body.token || !req.body.password) {
        res.handleResponse(400, {}, 'user_4');
    } else {
        User.findOne({createToken: req.body.token}).select('+salt').exec(function (err, user) {
            if (err) {
                handleError(res, err);
            } else if (!user) {
                res.handleResponse(404, {}, 'user_2');
            } else if (user.status === 'inactive') {
                res.handleResponse(403, {}, 'user_3');
            } else {
                user.password = req.body.password;
                user.status = 'active';
                user.createToken = null;
                user.save(function (err, user) {
                    if (err) {
                        handleError(res, err);
                    } else {
                        res.handleResponse(200);
                    }
                });
            }
        });
    }
};

/**
 * @name resendActivation
 * @function
 * @description resends activation email
 * @param {Object} req
 * @param {Object} res
 */
exports.resendActivation = function (req, res) {
    if (!req.body.email) {
        return res.handleResponse(400);
    }
    UserService.sendActivationMail(req, req.body.email, function (err, success) {
        if (err) {
            handleError(res, err);
        } else {
            res.handleResponse(200, {}, 'user_5');
        }
    });
};

/**
 * @name reset
 * @function
 * @description finds user based on temporary token
 * @param {Object} req
 * @param {Object} res
 */
exports.reset = function (req, res, next) {

    var token = req.params.token;
    if (!token) {
        return res.handleResponse(400);
    }

    User.findOne({'temporaryToken.token': token, 'temporaryToken.expires': {$gt: Date.now()}}, function (err, user) {
        if (err) {
            return validationError(res, err);
        }

        if (!user) {
            return res.handleResponse(404);
        }
        else {

            res.handleResponse(200);

        }
    });

};

/**
 * @name changePasswordByToken
 * @function
 * @description changes user password based on temporary token
 * @param {Object} req
 * @param {Object} res
 */
exports.changePasswordByToken = function (req, res) {

    var token = req.params.token;
    if (!token || !req.body.password) {
        return res.handleResponse(400);
    }

    User.findOne({
        'temporaryToken.token': token,
        'temporaryToken.expires': {$gt: Date.now()}
    }).select('+salt').exec(function (err, user) {
        if (err) {
            return validationError(res, err);
        }

        if (!user) {
            return res.handleResponse(404);
        }

        user.password = req.body.password;
        user.temporaryToken = null;

        user.save(function (err) {
            if (err) {
                return handleError(res, err);
            }
            return res.handleResponse(200, {}, 'user_6');
        });

    });

};

/**
 * @name fpw
 * @function
 * @description sends e-mail with link to reset password
 * @param {Object} req
 * @param {Object} res
 */
exports.fpw = function (req, res, next) {

    if (!req.body.email) {
        return res.handleResponse(400);
    }

    var u = {
        protocol: req.protocol,
        host: req.headers.host,
        path: url.parse(req.url).pathname
    };

    User.findOne({email: req.body.email}, function (err, user) {
        if (err) {
            return validationError(res, err);
        }

        if (!user) {
            return res.handleResponse(404, {}, 'user_7');
        }

        if (user.status !== 'active') {
            return res.handleResponse(403, {}, 'user_8');
        }

        else {

            user.temporaryToken = user.generateTemporaryToken();

            user.save(function (err) {

                if (err) {
                    return validationError(res, err);
                }

                mailer.sendToExistingUser(
                    user._id,
                    'reset_multilang',
                    [{
                        name: 'LINK',
                        content: config.staticSite + '/reset/' + user.temporaryToken.token
                    }, {name: 'WEBSITE', content: u.host}],
                    'reset',
                    null,
                    {subject: 'reset_pass'}
                );

                res.handleResponse(200, {success: {addr: user.email}}, 'user_9');

            });

        }

    });

};

/**
 * @name activate
 * @function
 * @description activates user account based on temporary token
 * @param {Object} req
 * @param {Object} res
 */
exports.activate = function (req, res, next) {

    var token = req.params.token;
    if (!token) {
        return res.handleResponse(400);
    }

    User.findOne({
        'temporaryToken.token': token,
        'temporaryToken.expires': {$gt: Date.now()}
    }).exec(function (err, user) {

        if (err) {
            return validationError(res, err);
        } else if (!user) {
            return res.handleResponse(404);
        } else if (user.status !== 'pending') {
            return res.handleResponse(403);
        } else {
            user.status = 'active';
            user.temporaryToken = null;

            user.save(function (err) {
                if (err) {
                    return validationError(res, err);
                } else {
                    return res.handleResponse(200, {success: user});
                }
            });
        }
    });
};

/**
 * @name authCallback
 * @function
 * @description authentication callback
 * @param {Object} req
 * @param {Object} res
 */
exports.authCallback = function (req, res, next) {
    res.redirect('/');
};
