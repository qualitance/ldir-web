'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router.post('/', function (req, res, next) {
    if (!req.body.email || !req.body.password) {
        return res.handleResponse(400);
    }
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return res.handleResponse(500, err);
        }
        if (!user) {
            return res.handleResponse(info.status, {error: info.additional}, info.code);
        }

        var token = auth.signToken(user._id, user.role);
        res.handleResponse(200, {success: {token: token, user: user}});
    })(req, res, next)
});

module.exports = router;
