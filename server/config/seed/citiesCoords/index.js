var async = require('async');
var fs = require('fs');
var Q = require('q');

var Utils = require('../../../components/utils');

var City = require('../../../api/city/city.model');

var citiesPath = './server/config/seed/citiesCoords/most_simplified_coords.json';

var getObjects = function (str) {
    return JSON.parse(str).features;
};

var getSiruta = function (localId) {
    return localId.split('.').pop() + '';
};

exports.updateCitiesCoords = function () {
    var deferred = Q.defer();

    console.log('Start cities coords script');
    var GEOcities;
    try {
        console.log('Reading geojson file...');
        GEOcities = fs.readFileSync(citiesPath);
        GEOcities = getObjects(GEOcities.toString());
        console.log('Geojson file read');

        async.each(GEOcities, function (geocity, callback) {
            City.findOne({siruta: getSiruta(geocity.properties.localId)}, function (err, city) {
                if (err) {
                    callback(err);
                } else if (!city) {
                    City.find({plain_name: Utils.latinLettersOnly(geocity.properties.name)}, function (err, cities) {
                        if (err) {
                            callback(err);
                        } else if (cities.length !== 1) {
                            console.log(cities);
                            console.log(geocity);
                            callback('Error at setting city coordinates');
                        } else {
                            updateCity(cities[0]._id, geocity, callback);
                        }
                    });
                } else {
                    updateCity(city._id, geocity, callback);
                }
            });
        }, function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });

    } catch (ex) {
        deferred.reject(ex);
    }

    return deferred.promise;
};

function updateCity(id, geocity, callback) {
    City.update({_id: id}, {
        $set: {
            geometry: {
                type: geocity.geometry.type,
                coordinates: geocity.geometry.coordinates
            }
        }
    }, function (err, wres) {
        callback(err);
    })
}
