var City = require('../../api/city/city.model');
var County = require('../../api/county/county.model');
var Q = require('q');

/**
 * @name getSiruta
 * @function
 * @description gets siruta code
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
var getSiruta = function (req, res, next) {
    if (!req.body.location) {
        return res.handleResponse(400, {}, 'geoJsonMiddleware_1');
    }

    City.findOne({
        geometry: {
            $geoIntersects: {
                $geometry: {
                    'type': 'Point',
                    'coordinates': [req.body.location.lng, req.body.location.lat]
                }
            }
        }
    }, {siruta: 1, _id: 0}, function (err, doc) {
        if (err) {
            console.log(err);
            return handleError(res, err);
        } else if (!doc) {
            checkMoldova(req.body.location).then(
                function (success) {
                    req.body.siruta = success;
                    next();
                },
                function (err) {
                    return res.handleResponse(400, {error: err});
                }
            );
        } else {
            req.body.siruta = doc.siruta;
            next();
        }
    });
};

/**
 * @name checkMoldova
 * @function
 * @description checks if given location is in Moldova's county, return its siruta
 * @param {Object} pileLocation
 */
function checkMoldova(pileLocation) {
    var deferred = Q.defer();
    County.findOne({
        geometry: {
            $geoIntersects: {
                $geometry: {
                    'type': 'Point',
                    'coordinates': [pileLocation.lng, pileLocation.lat]
                }
            }
        }
    }, {siruta: 1, _id: 0}, function (err, doc) {
        if (err) {
            deferred.reject(err);
        } else if (!doc) {
            deferred.reject({code: 'geoJsonMiddleware_2'});
        } else {
            deferred.resolve(doc.siruta);
        }
    });
    return deferred.promise;
}

function handleError(res, err) {
    return res.handleResponse(500, {error: err});
}

module.exports = getSiruta;
