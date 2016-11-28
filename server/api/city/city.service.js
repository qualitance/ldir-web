'use strict';

var City = require('./city.model');
var County = require('../county/county.model');

var Q = require('q');

/**
 * @name show
 * @function
 * @description gets single city by siruta code, if no city checks counties from Moldova
 * @param {String} siruta
 */
exports.getCity = function (siruta) {
    var deferred = Q.defer();
    City.findOne({siruta: siruta}, function (err, city) {
        if (err) {
            deferred.reject({data: err});
        } else if (!city) {
            //if there is no city with this siruta we check the counties because it might be from R. Moldova
            County.findOne({siruta: siruta}, function (err, county) {
                if (err) {
                    deferred.reject(err);
                } else if (!county) {
                    deferred.reject({code: 'city_1'});
                } else {
                    deferred.resolve(county);
                }
            });
        } else {
            deferred.resolve(city);
        }
    });
    return deferred.promise;
};
