'use strict';

var _ = require('lodash');
var Authority = require('./authority.model');

/**
 * @name find
 * @function
 * @description get lists of all authorities
 * @param {Object} req
 * @param {Object} res
 */
exports.find = function (req, res) {
    var cursor;
    if (req.query.id) {
        cursor = Authority.findOne({_id: req.query.id, county: req.user.county});
    } else if (req.query.city) {
        cursor = Authority.find({city: req.query.city}).sort({name: 1});
    } else {
        cursor = Authority.find({county: req.user.county}).sort({name: 1});
    }
    cursor.exec(function (err, result) {
        if (err) {
            res.handleResponse(500, {error: err});
        }
        return res.handleResponse(200, {success: result});
    });
};
