'use strict';

var env = require('../../config/environment');

exports.find = function (req, res) {
    res.handleResponse(200, {
        success: {
            pile: env.pile,
            contact: env.contact,
            amazonBucket: env.amazonBucket,
            amazonPrefix: env.amazonPrefix,
            hostname: env.hostname,
            images: env.images
        }
    });
};
