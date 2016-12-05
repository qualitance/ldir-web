'use strict';

var County = require('./county.model');

var Q = require('q');

/**
 * Get county by a specific ID
 * @param siruta
 * @returns {*}
 */
exports.getCounty = function (siruta) {
    var deferred = Q.defer();
    County.findOne({siruta: siruta}, function (err, county) {
        if(err){
            deferred.reject({data: err});
        }else if(!county){
            deferred.reject({message: "county_1"});
        }else{
            deferred.resolve(county);
        }
    });
    return deferred.promise;
};
