'use strict';

var _ = require('lodash');
var Authority = require('./authority.model');

/**
 * If id is specified, returns a single authority with that id.
 * If city is specified, returns all the authorities in that city.
 * If both are specified, it ignores the city.
 * If none is specified, returns all the authorities in the same county as the user making the query
 * @param req
 * @param res
 */
exports.find = function(req, res) {
    var cursor;
    if(req.query.id){
        cursor = Authority.findOne({_id: req.query.id, county: req.user.county});
    }else if(req.query.city){
        cursor = Authority.find({city: req.query.city}).sort({name: 1});
    }else{
        cursor = Authority.find({county: req.user.county}).sort({name: 1});
    }
    cursor.exec(function (err, result) {
        if(err) { res.handleResponse(500, {error: err}); }
        return res.handleResponse(200, {success: result});
    });
};
