'use strict';

var _ = require('lodash');
var County = require('./county.model');

// Get list of counties
exports.index = function (req, res) {
    var q = {};
    if (req.query.country) {
        q.country = req.query.country
    }
    County.find(q).sort({name: 1}).setOptions({lean: true}).exec(function (err, counties) {
        if (err) {
            return handleError(res, err);
        }
        return res.handleResponse(200, {success: counties});
    });
};

// Get a single county
exports.show = function (req, res) {
    County.findById(req.params.id, function (err, county) {
        if (err) {
            return handleError(res, err);
        }
        if (!county) {
            return res.handleResponse(404);
        }
        return res.handleResponse(200, {success: county});
    });
};

function handleError(res, err) {
    return res.handleResponse(500, {error: err});
}
