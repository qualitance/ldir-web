'use strict';

var config = require('../../config/environment');
var Q = require('q');
var gm = require('gm');

var aws = require('../../components/amazon');

var Image = require('./image.model');

/**
 * @name createFromFB
 * @function
 * @description creates new image from FB profile picture
 * @param {String} facebookID
 * @returns {Promise}
 */
function createFromFB(facebookID) {
    var deferred = Q.defer();

    var image = new Image({
        src: config.facebook.apiURL + facebookID + '/picture?type=large',
        thumb_src: config.facebook.apiURL + facebookID + '/picture',
        not_local: true
    });

    image.save(function (err, image) {
        if (err) {
            deferred.reject({data: err});
        } else {
            deferred.resolve(image);
        }
    });

    return deferred.promise;
}

/**
 * @name processImage
 * @function
 * @description calls resize image function
 * @param {String} buffer
 * @returns {Promise}
 */
function processImage(buffer) {
    var deferred = Q.defer();
    resizeImage(buffer, 'image')
        .then(function (success) {
            deferred.resolve({
                resizedImageBuffer: success.buffer,
                resizedImageDimensions: success.dimensions
            })
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
}

/**
 * @name updatePileImage
 * @function
 * @description get image from DB, upload to amazon, update image
 * @param {Object} user
 * @param {String} imageBuffer
 * @param {Object} imageDimensions
 * @param {String} imageExtension
 * @param {String} referenceID
 * @param {String} image_id
 * @returns {Promise}
 */
function updatePileImage(user, imageBuffer, imageDimensions, imageExtension, referenceID, image_id) {
    var deferred = Q.defer();

    Image.findOne({_id: image_id}, function (err, image) {
        if (err) {
            deferred.reject(err);
        } else if (!image) {
            deferred.reject('At: uploadPileImage: no image found with id ' + image_id);
        } else {
            var imageType = 'pile';
            image.user = user._id;
            image.dimensions = {
                image: imageDimensions
            };
            var key = imageType + '/' + referenceID + '/images/' + image._id + '.' + imageExtension;
            image.src = config.amazonPrefix + key;
            aws.addObjectS3(key, imageBuffer, function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    image.save(function (err, image) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            var thumbnailKey = imageType + '/' + referenceID + '/images/' + image._id + 'thumb.' + imageExtension;
                            generateThumbnail(image._id, thumbnailKey, imageBuffer)
                                .then(function (image) {
                                    deferred.resolve(image);
                                })
                                .catch(function (err) {
                                    deferred.reject(err);
                                });
                        }
                    });
                }
            });
        }
    });
}

/**
 * @name resizeImage
 * @function
 * @description resizes image
 * @param {String} buffer
 * @param {String} image_type
 * @returns {Promise}
 */
function resizeImage(buffer, image_type) {
    var deferred = Q.defer();

    getImageDimensions(buffer).then(
        function (actual) {
            getResizeDimensions(actual.width, actual.height, image_type).then(
                function (calculated) {
                    gm(buffer)
                        .resize(calculated.width, calculated.height)
                        .toBuffer(function (err, buffer) {
                            if (err) {
                                deferred.reject({data: err});
                            } else {
                                deferred.resolve({
                                    buffer: buffer,
                                    dimensions: calculated
                                });
                            }
                        });
                },
                function (err) {
                    deferred.reject({data: err});
                }
            );
        },
        function (err) {
            deferred.reject({data: err});
        }
    );
    return deferred.promise;
}

/**
 * @name getResizeDimensions
 * @function
 * @description gets maximum allowed dimension from environment, resize width or height depending on image proportions
 * make sure boundaries were not exceeded due to the division/multiplication
 * @param {String} actual_width
 * @param {String} actual_height
 * @param {String} type
 * @returns {Promise}
 */
function getResizeDimensions(actual_width, actual_height, type) {
    var deferred = Q.defer();

    if (type !== 'image' && type !== 'thumbnail') {
        deferred.reject({code: 'image_1'});
    } else {
        var max = {
            width: config.images[type + '_size'].width,
            height: config.images[type + '_size'].height
        };

        var calculated = {
            width: 0,
            height: 0
        };

        var actual = {
            width: actual_width,
            height: actual_height
        };

        var ratio = actual.width / actual.height;
        if (ratio > config.images.target_ratio) {
            calculated.width = max.width;
            calculated.height = Math.round(calculated.width / ratio);
        } else {
            calculated.height = max.height;
            calculated.width = Math.round(calculated.height * ratio);
        }
        if (calculated.height > max.height) {
            calculated.height = max.height;
        }
        if (calculated.width > max.width) {
            calculated.width = max.width;
        }
        deferred.resolve(calculated);
    }
    return deferred.promise;
}

/**
 * @name getImageDimensions
 * @function
 * @description gets image dimensions
 * @param {String} buffer
 * @returns {Promise}
 */
function getImageDimensions(buffer) {
    var deferred = Q.defer();
    gm(buffer).size(function (err, actual) {
        if (err) {
            deferred.reject({data: err});
        } else if (!actual) {
            deferred.reject({code: 'image_2'});
        } else {
            deferred.resolve(actual);
        }
    });
    return deferred.promise;
}

/**
 * @name generateThumbnail
 * @function
 * @description generates image thumbnail, adds it to S3, updates image
 * @param {String} imageID
 * @param {String} key
 * @param {String} buffer
 * @returns {Promise}
 */
function generateThumbnail(imageID, key, buffer) {
    var deferred = Q.defer();
    Image.findOne({_id: imageID}, function (err, image) {
        if (err) {
            deferred.reject({data: err});
        } else {
            try {
                resizeImage(buffer, 'thumbnail').then(
                    function (success) {
                        var resizedImageBuffer = success.buffer;
                        var resizedImageDimensions = success.dimensions;
                        aws.addObjectS3(key, resizedImageBuffer, function (err, success) {
                            if (err) {
                                deferred.reject({data: err});
                            } else {
                                image.thumb_src = config.amazonPrefix + key;
                                image.dimensions.thumb = resizedImageDimensions;
                                image.save(function (err, image) {
                                    if (err) {
                                        deferred.reject({data: err});
                                    } else {
                                        deferred.resolve(image);
                                    }
                                });
                            }
                        })
                    }
                );
            } catch (ex) {
                console.log(ex);
            }
        }
    });
    return deferred.promise;
}

/**
 * @name createEmpty
 * @function
 * @description creates empty image in DB
 * @returns {Promise}
 */
function createEmpty() {
    var deferred = Q.defer();
    var img = new Image();
    img.save(function (err, image) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(image);
        }
    });
    return deferred.promise;
}

module.exports = {
    updatePileImage: updatePileImage,
    processImage: processImage,
    createFromFB: createFromFB,
    resizeImage: resizeImage,
    generateThumbnail: generateThumbnail,
    addToS3: aws.addObjectS3,
    createEmpty: createEmpty
};
