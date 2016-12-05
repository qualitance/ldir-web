'use strict';

var _ = require('lodash');
var City = require('./city.model');

/**
 * Returns an array with all the cities
 * @param req
 * @param res
 */
exports.index = function(req, res) {
    var params = {};
    if(req.params.id === 'all' && req.params.countyId !== undefined){
        params.county = req.params.countyId;
    }
    City.find(params,function (err, citys) {
        if(err) { return handleError(res, err); }
        return res.handleResponse(200, {success: citys});
    });
};

/**
 * Returns a specific city selected by its ID
 * @param req
 * @param res
 */
exports.show = function(req, res) {
  City.findById(req.params.id, function (err, city) {
    if(err) { return handleError(res, err); }
    if(!city) { return res.handleResponse(404); }
    return res.handleResponse(200, {success: city});
  });
};

function handleError(res, err) {
  return res.handleResponse(500, {error: err});
}
