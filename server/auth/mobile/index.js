'use strict';

var express = require('express');
var auth = require('../auth.service');

var router = express.Router();

router
    .post('/facebook', function (req, res) {
        var accessToken = req.body.accessToken;
        var facebookID = req.body.userId;

        auth.loginToFacebook(accessToken, facebookID, function (err, token, user) {
            if (err) {
                res.handleResponse(err.status, {error: err.error}, err.code);
            } else {
                user.facebook = null;
                res.handleResponse(200, {success: {token: token, user: user}});
            }
        });
    });

module.exports = router;
