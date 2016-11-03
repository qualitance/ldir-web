var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var auth = require('../auth.service');

exports.setup = function (User, config) {
    passport.use(new FacebookStrategy({
            clientID: config.facebook.clientID,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackURL
        },
        function (accessToken, refreshToken, profile, done) {
            var facebookID = profile.id;

            auth.loginToFacebook(accessToken, facebookID, function (err, token, user) {
                return done(err, user);
            });
        }
    ));
};
