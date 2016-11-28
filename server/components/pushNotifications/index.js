var request = require('request');
var Q = require('q');
var Mustache = require('mustache');
var env = require('../../config/environment');
var pushMessages = require('../../storage/language/pushNotifications');

/**
 * @name activityNotify
 * @function
 * @description map activity details, format notification message,
 * use PushServerNotify function to send a message to a user
 * @param {Object} activity
 */
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
        if (pileOwner.notificationsEnabled) {
            if (actor.id !== pileOwner.id) {
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

/**
 * @name pushServerNotify
 * @function
 * @description creates a request to push notifications server
 * @param {String} user_id
 * @param {String} message
 */
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

/**
 * @name subscribe
 * @function
 * @description subscribe user for push notifications,
 * first, unsubscribe this device to prevent conflicts with logging in different users on same device
 * @param {String} deviceName
 * @param {String} deviceToken
 * @param {String} user_id
 * @return {Promise}
 */
exports.subscribe = function (deviceName, deviceToken, user_id) {

    var deferred = Q.defer();

    if (deviceName && deviceToken) {
        //
        unsubscribeUser(user_id).then(
            function (success) {
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

/**
 * @name unsubscribeDevice
 * @function
 * @description unsubscribe device from push notifications,
 * @param {String} deviceToken
 * @return {Promise}
 */
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

/**
 * @name unsubscribeUser
 * @function
 * @description unsubscribe user from push notifications,
 * @param {String} user_id
 * @return {Promise}
 */
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

/**
 * @name unsubscribe
 * @function
 * @description unsubscribe from push notifications,
 * @param {String} usType
 * @param {String} usData
 * @return {Promise}
 */
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

/**
 * @name generateMessage
 * @function
 * @description generates message
 * @param {String} messageCode
 * @param {Object} data
 * @param {String} language
 */
function generateMessage(messageCode, data, language) {
    var message = pushMessages[language][messageCode];
    return Mustache.render(message, data)
}

exports.unsubscribeDevice = unsubscribeDevice;
exports.unsubscribeUser = unsubscribeUser;

var handleError = function (err) {
    console.log(err);
};
