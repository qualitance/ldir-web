'use strict';

var County = require('./county.model');

var Q = require('q');

/**
 * @name getCounty
 * @function
 * @description gets single county by siruta code
 * @param {String} siruta
 */
exports.getCounty = function (siruta) {
    var deferred = Q.defer();
    County.findOne({siruta: siruta}, function (err, county) {
        if (err) {
            deferred.reject({data: err});
        } else if (!county) {
            deferred.reject({message: 'county_1'});
        } else {
            deferred.resolve(county);
        }
    });
    return deferred.promise;
};
