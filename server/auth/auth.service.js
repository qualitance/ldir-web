'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var validateJwt = expressJwt({secret: config.secrets.session});
var request = require('request');
var url = require('url');
var _ = require('lodash');

var ImageService = require('../api/image/image.service');

/**
 * @name isAuthenticated
 * @function
 * @description validate jwt, attaches the user object to the request if authenticated, otherwise returns 403
 */
function isAuthenticated() {
    return compose()
        .use(function (req, res, next) {
            if (req.query && req.query.hasOwnProperty('access_token')) {
                req.headers.authorization = 'Bearer ' + req.query.access_token;
            }
            validateJwt(req, res, next);
        })
        .use(function (req, res, next) {
            User.findById(req.user._id).exec(function (err, user) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.handleResponse(401);
                }

                req.user = user;
                next();
            });
        });
}

/**
 * @name hasRole
 * @function
 * @description checks if the user role meets the minimum requirements of the route
 * @param {String} roleRequired
 */
function hasRole(roleRequired) {
    if (!roleRequired) {
        throw new Error('Required role needs to be set');
    }

    return compose()
        .use(isAuthenticated())
        .use(function meetsRequirements(req, res, next) {
            if (req.user.role && (req.user.role === roleRequired)) {
                next();
            }
            else {
                res.handleResponse(403);
            }
        });
}

/**
 * @name signToken
 * @function
 * @description returns a jwt token signed by the app secret
 * @param {String} id
 */
function signToken(id) {
    return jwt.sign({_id: id}, config.secrets.session, {expiresInMinutes: 60 * 24 * 3});
}

/**
 * @name setTokenCookie
 * @function
 * @description set token cookie directly for oAuth strategies
 * @param {Object} req
 * @param {Object} res
 */
function setTokenCookie(req, res) {
    if (!req.user) {
        return res.handleResponse(404, {}, 'auth_service_1');
    }
    var token = signToken(req.user._id, req.user.role);
    res.cookie('token', JSON.stringify(token), {domain: config.staticSite.replace(/(http|https):\/\//, '')});
    res.redirect(config.staticSite);
}

/**
 * @name loginToFacebook
 * @function
 * @description calls FB api with received id and token
 * check if a user is already registered with this facebook id, create one if not
 * synchronize info
 * @param {String} accessToken
 * @param {String} facebookID
 * @param {Function} callback
 */
var loginToFacebook = function (accessToken, facebookID, callback) {
    if (!facebookID || !accessToken) {
        callback({code: 'auth_mobile_1', status: 400});
    } else {
        var url = config.facebook.apiURL + facebookID + '?access_token=' + accessToken + '&fields=id,first_name,last_name,email,verified';
        var options = {
            url: url,
            method: 'GET',
            strictSSL: true
        };

        request(options, function (error, message, response) {
            var parsedResponse;
            try {
                parsedResponse = JSON.parse(response);
                if (!parsedResponse.email) {
                    parsedResponse = {code: 'auth_mobile_2', missingPermissions: true}
                }
            } catch (ex) {
                parsedResponse = {code: 'auth_mobile_3'}
            }

            if (error) {
                console.log(error);
                callback({code: 'auth_mobile_3', status: 400});
            } else if (parsedResponse.code) {
                callback({
                    code: parsedResponse.code,
                    status: 400,
                    missingPermissions: parsedResponse.missingPermissions
                });
            } else {

                var fb_user = {
                    first_name: parsedResponse.first_name,
                    last_name: parsedResponse.last_name,
                    email: parsedResponse.email.toLowerCase(),
                    facebook: parsedResponse
                };

                User.findOne({
                        'facebook.id': facebookID
                    },
                    function (err, user) {
                        if (err) {
                            callback({error: err, status: 500});
                        } else if (!user) {
                            User.findOne({email: fb_user.email}, function (err, user) {
                                if (err) {
                                    callback({error: err, status: 500});
                                } else {
                                    if (!user) {
                                        user = new User(fb_user);
                                        user.provider = 'facebook';
                                        user.role = 'volunteer';
                                        user.status = parsedResponse.verified ? 'active' : 'pending';
                                        user.terms = true;
                                    }
                                    _.assign(user, fb_user);
                                    ImageService.createFromFB(facebookID).then(
                                        function (image) {
                                            user.image = image._id;
                                            proceed(user);
                                        },
                                        function (err) {
                                            proceed(user);
                                        }
                                    );
                                }
                            });
                        } else {
                            User.findOne({
                                'facebook.id': {$ne: facebookID},
                                email: fb_user.email
                            }, function (err, test_user) {
                                if (err) {
                                    callback({error: err, status: 500});
                                } else if (test_user) {
                                    callback({code: 'auth_mobile_5', status: 422});
                                } else {
                                    _.assign(user, fb_user);
                                    if (user.status === 'pending' && parsedResponse.verified) {
                                        user.status = 'active';
                                    }
                                    proceed(user);
                                }
                            });
                        }
                    }
                );

                var proceed = function (user) {
                    user.save(function (err, user) {
                        if (err) {
                            console.log(err);
                            callback({error: err, status: 500});
                        } else if (user.status === 'active') {
                            var token = signToken(user._id);
                            callback(false, token, user);
                        } else if (user.status === 'pending') {
                            callback({code: 'auth_mobile_6', status: 403});
                        } else {
                            callback({error: 'auth_mobile_7', status: 403});
                        }
                    });
                };
            }
        });
    }
};

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
exports.loginToFacebook = loginToFacebook;
