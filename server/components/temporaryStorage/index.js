var fs = require('fs');
var path = require('path');
var Q = require('q');

var env = require('../../config/environment');

var storage_path = env.formDataParser.fileSaveLocation;

function getResource(name) {
    var deferred = Q.defer();
    fs.readFile(path.join(storage_path, name), function (err, buffer) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(buffer);
        }
    });
    return deferred.promise;
}

function saveResource(name, buffer) {
    var deferred = Q.defer();
    fs.writeFile(path.join(storage_path, name), buffer, function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function deleteResource(name) {
    var deferred = Q.defer();
    fs.unlink(path.join(storage_path, name), function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

module.exports = {
    getResource: getResource,
    saveResource: saveResource,
    deleteResource: deleteResource
}
