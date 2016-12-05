'use strict';

var Q = require('q');
var url = require('url');
var async = require('async');
var mailer = require('../../components/mailer');

var User = require('./user.model');

var PileService = require('../pile/pile.service');
var ActivityService = require('../activity/activity.service');
var config =  require('../../config/environment');

exports.sendActivationMail = function (req, user_email, callback) {
    var User = require('./user.model');
    User.findOne({email: user_email}).select('+createToken').exec(function (err, user) {
        if(err){
            callback(err);
        }else if(!user){
            callback("No user");
        }else{
            var activationLink, template;
            var subjectObject = {};
            var u = {
                protocol: req.protocol,
                host: req.headers.host,
                path: url.parse(req.url).pathname
            };
            if(user.createToken){
                user.createToken = user.generateCreateToken();
                activationLink = config.staticSite + '/set_password/'+user.createToken;
                template = "claim_account_multilang";
                subjectObject.subject = "claim_account";
            }else{
                user.temporaryToken = user.generateTemporaryToken();
                activationLink = config.staticSite+ '/activate/'+user.temporaryToken.token;
                template = "activation_multilang";
                subjectObject.subject = "activate_account";
            }
            user.save(function (err, user) {
                if(err){
                    callback(err);
                }else{
                    mailer.sendToExistingUser(
                        user._id,
                        template,
                        [{name: 'LINK', content: activationLink}, {name: 'WEBSITE', content: u.host}],
                        template,
                        null,
                        subjectObject
                    ).then(
                        function (success) {
                            //console.log(success);
                        },
                        function (err) {
                            console.log(err);
                        }
                    );
                    callback(false, true);
                }
            });
        }
    });
};

exports.removeImage = function (image_id) {
    var User = require('./user.model');
    var deferred = Q.defer();
    User.findOne({image: image_id}, function (err, user) {
        if(err){
            deferred.reject(err);
        }else if(!user){
            deferred.reject("No user found");
        }else{
            user.image = null;
            user.save(function (err, user) {
                if(err){
                    deferred.reject(err);
                }else{
                    deferred.resolve(user);
                }
            });
        }
    });
    return deferred.promise;
};

exports.addImage = function (user_id, image_id) {
    var User = require('./user.model');
    var deferred = Q.defer();
    User.update({_id: user_id}, {$set: {image: image_id}}, function (err, wres) {
        if(err){
            deferred.reject(err);
        }else{
            deferred.resolve(wres);
        }
    });
    return deferred.promise;
};

exports.getStats = function (user_id) {
    var User = require('./user.model');
    var deferred = Q.defer();
    User.findOne({_id: user_id}, function (err, user) {
        if(err){
            deferred.reject(err);
        }else if(!user){
            deferred.reject("No user");
        }else{
            var countStatuses;
            if(user.role === "volunteer"){
                countStatuses = ["pending", "confirmed", "clean"];
                proceed(user, countStatuses);
            }else if(user.role === "supervisor"){
                countStatuses = ["pending", "reported", "clean"];
                proceed(user, countStatuses);
            }else{
                proceed(user, false);
            }
        }
    });

    var proceed = function (user, countStatuses) {
        async.parallel([
            function (callback) {
                getPileStatuses(user, countStatuses, function (err, success) {
                    callback(err, success)
                });
            },
            function (callback) {
                getUnreadActivities(user, function (err, success) {
                    callback(err, success);
                });
            }
        ], function (err, success) {
            if(err){
                deferred.reject(err);
            }else{
                deferred.resolve({
                    piles: success[0],
                    unreadNotifications: success[1]
                });
            }
        });
    };

    var getUnreadActivities = function (user, callback) {
        ActivityService.countUnread(user).then(
            function (count) {
                callback(false, count);
            },
            function (err) {
                callback(err, false);
            }
        );
    };

    var getPileStatuses = function (user, countStatuses, parentCallback) {
        var ret = {};
        if(countStatuses){
            async.each(countStatuses, function (status, callback) {
                PileService.countByUserAndStatus(user, status).then(
                    function (count) {
                        ret[status] = count;
                        callback();
                    },
                    function (err) {
                        callback(err);
                    }
                );
            }, function (err) {
                if(err){
                    parentCallback(err, false);
                }else{
                    parentCallback(false, ret);
                }
            })
        }else{
            parentCallback(false, {});
        }
    };
    return deferred.promise;
};
