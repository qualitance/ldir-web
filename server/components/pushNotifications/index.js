var request = require('request');
var Q = require('q');
var Mustache = require('mustache');
var env = require('../../config/environment');
var pushMessages = require('../../storage/language/pushNotifications');

exports.activityNotify = function (activity) {
    if (activity.actor._id && activity.actor.role && activity.pile.user._id && activity.pile.user.flags.receivePushNotifications && activity.pile.user.role && activity.pile.nr_ord) {
        var actor = {
            id: activity.actor._id.toString(),
            role: activity.actor.role
        };
        var pileOwner = {
            id: activity.pile.user._id.toString(),
            notificationsEnabled: activity.pile.user.flags.receivePushNotifications,
            role: activity.pile.user.role,
            language: activity.pile.user.language
        };
        var verb = activity.verb;
        // We now have all the details of the new activity.
        // Place all of the sending logic below.
        // Use pushServerNotify function to send a message to a user
        if (pileOwner.notificationsEnabled) {
            //we can proceed
            if (actor.id !== pileOwner.id) { //prevent self notify
                //format a nice message to send as notification
                var messageCode;
                var data = {
                    nr_ord: activity.pile.nr_ord
                };
                if (verb === 'pending') {
                    messageCode = 'pushNotifications_1'
                } else if (verb === 'confirmed') {
                    messageCode = 'pushNotifications_2'
                } else if (verb === 'unconfirmed') {
                    messageCode = 'pushNotifications_3'
                } else if (verb === 'reported') {
                    messageCode = 'pushNotifications_4'
                } else if (verb === 'clean') {
                    messageCode = 'pushNotifications_5'
                } else if (verb === 'confirmation.confirm') {
                    messageCode = 'pushNotifications_6'
                } else if (verb === 'confirmation.unconfirm') {
                    messageCode = 'pushNotifications_7'
                } else if (verb === 'comment') {
                    messageCode = 'pushNotifications_8'
                }

                if (messageCode) {
                    var message = generateMessage(messageCode, data, pileOwner.language)
                    pushServerNotify(pileOwner.id, message);
                }
            }
        }
    } else {
        console.error('Activity missing parameters');
    }
};

var pushServerNotify = function (user_id, message) {
    try {
        var formattedUsers = [env.pushNotifications.userPrefix + user_id.toString()];
        var body = {
            'users': formattedUsers,
            'android': {
                'collapseKey': 'optional',
                'data': {
                    'message': message
                }
            },
            'ios': {
                'badge': 0,
                'alert': message,
                'sound': 'soundName'
            }
        };

        if (env.pushNotifications.preventSend) {
            console.log('Prevented notification sending');
            return;
        }

        request({
            url: env.pushNotifications.server + '/send',
            method: 'POST',
            json: true,
            body: body,
            strictSSL: env.pushNotifications.strictSSL
        }, function (error, message, response) {
            if (error) {
                handleError(error);
            }
        });
    } catch (ex) {
        handleError(ex);
    }
};

exports.subscribe = function (deviceName, deviceToken, user_id) {

    var deferred = Q.defer();

    // if user logs in from a device, subscribe user for push notifications

    if (deviceName && deviceToken) {
        //first, unsubscribe this device to prevent conflicts with logging in different users on same device
        unsubscribeUser(user_id).then(
            function (success) {
                //subscribe user for push notifications
                var subscribeData = {
                    'user': env.pushNotifications.userPrefix + user_id.toString(),
                    'type': deviceName,
                    'token': deviceToken
                };

                request({
                    url: env.pushNotifications.server + '/subscribe',
                    method: 'POST',
                    json: true,
                    body: subscribeData,
                    strictSSL: env.pushNotifications.strictSSL
                }, function (error, message, response) {
                    if (error) {
                        deferred.reject({code: 'pushNotifications_9'});
                    } else {
                        deferred.resolve('Subscribed');
                    }
                });
            },
            function (err) {
                console.log(err);
            }
        );

    }
    return deferred.promise;
};

var unsubscribeDevice = function (deviceToken) {
    var deferred = Q.defer();
    if (deviceToken) {
        unsubscribe('token', deviceToken).then(
            function (success) {
                deferred.resolve(success);
            },
            function (err) {
                deferred.reject({data: err});
            }
        );
    } else {
        deferred.reject({code: 'pushNotifications_10'});
    }
    return deferred.promise;
};

var unsubscribeUser = function (user_id) {
    var deferred = Q.defer();
    if (user_id) {
        unsubscribe('user', env.pushNotifications.userPrefix + user_id.toString()).then(
            function (success) {
                deferred.resolve(success);
            },
            function (err) {
                deferred.reject({data: err});
            }
        );
    } else {
        deferred.reject({code: 'pushNotifications_11'});
    }
    return deferred.promise;
};

var unsubscribe = function (usType, usData) {

    var deferred = Q.defer();

    if (usType && usData) {
        //unsubscribe user from push notifications
        var unsubscribeData = {};
        unsubscribeData[usType] = usData;

        request({
            url: env.pushNotifications.server + '/unsubscribe',
            method: 'POST',
            json: true,
            body: unsubscribeData,
            strictSSL: env.pushNotifications.strictSSL
        }, function (error, message, response) {
            if (error) {
                deferred.reject('Error at unsubscribe request');
            } else {
                deferred.resolve('Unsubscribed');
            }
        });
    } else {
        deferred.reject({code: 'pushNotifications_12'});
    }
    return deferred.promise;
};

function generateMessage(messageCode, data, language) {
    var message = pushMessages[language][messageCode];
    return Mustache.render(message, data)
}

exports.unsubscribeDevice = unsubscribeDevice;
exports.unsubscribeUser = unsubscribeUser;

var handleError = function (err) {
    console.log(err);
};
