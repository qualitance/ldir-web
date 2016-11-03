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
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
    return compose()
    // Validate jwt
        .use(function (req, res, next) {
            // allow access_token to be passed through query parameter as well
            if (req.query && req.query.hasOwnProperty('access_token')) {
                req.headers.authorization = 'Bearer ' + req.query.access_token;
            }
            validateJwt(req, res, next);
        })
        // Attach user to request
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
 * Checks if the user role meets the minimum requirements of the route
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
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
    return jwt.sign({_id: id}, config.secrets.session, {expiresInMinutes: 60 * 24 * 3});
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
    if (!req.user) {
        return res.handleResponse(404, {}, 'auth_service_1');
    }
    var token = signToken(req.user._id, req.user.role);
    res.cookie('token', JSON.stringify(token), {domain: config.staticSite.replace(/(http|https):\/\//, '')});
    res.redirect(config.staticSite);
}

var loginToFacebook = function (accessToken, facebookID, callback) {
    if (!facebookID || !accessToken) {
        callback({code: 'auth_mobile_1', status: 400});
    } else {
        var url = config.facebook.apiURL + facebookID + '?access_token=' + accessToken + '&fields=id,first_name,last_name,email,verified';
        // CALL FB API WITH RECEIVED ID AND TOKEN
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

                //check if a user is already registered with this facebook id
                User.findOne({
                        'facebook.id': facebookID
                    },
                    function (err, user) {
                        if (err) {
                            callback({error: err, status: 500});
                        } else if (!user) {
                            //create one; watch caveat: email is already taken
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
                                    //sync facebook info
                                    _.assign(user, fb_user);
                                    //sync profile image
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
                            //synchronize
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
