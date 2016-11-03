var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _ = require('lodash');

exports.setup = function (User, config) {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password' // this is the virtual field on the model
        },
        function (email, password, done) {
            User.findOne({
                email: email.toLowerCase()
            }).select('+hashedPassword +salt').populate('deactivatedBy').exec(function (err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false, {status: 403, code: 'auth_local_1', additional: {status: 'missing'}});
                }

                if (!user.authenticate(password)) {
                    return done(null, false, {status: 403, code: 'auth_local_1', additional: {status: 'invalid'}});
                }

                if (user.status !== 'active') {
                    var msg, additional = {status: user.status};
                    if (user.status === 'pending') {
                        msg = 'auth_local_2';
                    } else {
                        if (user.deactivatedBy) {
                            msg = 'auth_local_3';
                            additional = _.extend(additional, {admin: user.deactivatedBy.email});
                        } else {
                            msg = 'auth_local_4';
                        }
                    }

                    return done(null, false, {status: 401, code: msg, additional: additional});

                }

                user.hashedPassword = null;
                user.salt = null;
                return done(null, user);

            });
        }
    ));
};
