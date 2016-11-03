'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config/environment');

var router = express.Router();

router
    .get('/', function (req, res, next) {
        var options = {
            scope: ['email', 'user_about_me'],
            failureRedirect: '/signup',
            session: false
        };
        if (req.query.missingPermissions === 'true') {
            options.authType = 'rerequest';
        }
        passport.authenticate('facebook', options)(req, res, next);
    })

    .get('/callback', function (req, res, next) {
        passport.authenticate('facebook', {session: false}, function (err, user) {
            if (err) {
                console.log(err);
                if (err.missingPermissions) {
                    res.redirect('/auth/facebook?missingPermissions=true');
                } else {
                    res.redirect(config.staticSite + '/login/');
                }
            } else {
                req.user = user;
                next();
            }
        })(req, res, next);
    }, auth.setTokenCookie);

module.exports = router;
