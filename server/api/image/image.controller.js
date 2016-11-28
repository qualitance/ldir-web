'use strict';

var _ = require('lodash');
var Image = require('./image.model');

var PileService = require('../pile/pile.service');
var UserService = require('../user/user.service');
var ImageService = require('./image.service');

var TemporaryStorage = require('../../components/temporaryStorage');

var env = require('../../config/environment');
var Q = require('q');

/**
 * @name create
 * @function
 * @description creates a new image
 * for screenshot generates thumbnail and uploads to S3 then updates image and pile
 * for normal image, we use the "multer" plugin which parses our form data request and places any text field
 * on req.body[field] and any file field on req.files[field], then we open file from disk, establish our params for
 * updating the document that the image refers to, process image, add to DB, add to S3 and update image

 * @param {Object} req
 * @param {Object} res
 */
exports.create = function (req, res) {
    try {
        if (req.body.screenshotBase64) {
            var image = new Image();
            image.user = req.user._id;
            image.dimensions = {
                image: {width: req.body.width, height: req.body.height}
            };
            image.is_screenshot = true;
            image.save(function (err, image) {
                if (err) {
                    return handleError(res, err);
                } else {
                    decodeBase64Image(req.body.screenshotBase64).then(function (response) {
                        var imageBuffer = response;
                        var key = req.body.imageType + '/' + req.body.referenceID + '/images/' + image._id + '.jpg';
                        var thumbnailKey = req.body.imageType + '/' + req.body.referenceID + '/images/' + image._id + 'thumb.jpg';

                        ImageService.generateThumbnail(image._id, thumbnailKey, imageBuffer).then(function (success) {
                            image = success;
                        });

                        ImageService.addToS3(key, imageBuffer, function (err) {
                            if (err) {
                                return handleError(res, err);
                            } else {
                                //update image src
                                image.src = env.amazonPrefix + key;
                                image.save(function (err, image) {
                                    if (err) {
                                        return handleError(res, err);
                                    } else {
                                        PileService.addScreenshot(req.body.referenceID, image._id).then(
                                            function () {
                                                res.handleResponse(200, {success: image});
                                            },
                                            function (err) {
                                                handleError(res, err);
                                            }
                                        );
                                    }
                                });
                            }
                        });
                    });
                }
            });
        }
        else {
            if (!(req.body.imageType && req.files && req.files.file)) {
                return res.handleResponse(400, {}, 'image_6');
            }

            var imageType = req.body.imageType;
            var file = req.files.file;

            if (file.truncated) {
                return res.handleResponse(400, {}, 'image_3');
            }

            TemporaryStorage.getResource(file.name)
                .then(function (buffer) {
                    var referenceID; //id of the document that the image refers to
                    var service; //the service that will be used to update the document that the image refers to

                    if (imageType === 'user') {
                        service = UserService;
                        referenceID = req.user._id;
                    } else if (imageType === 'pile') {
                        service = PileService;
                        if (req.body.referenceID) {
                            referenceID = req.body.referenceID;
                        } else {
                            return res.handleResponse(400, {}, 'image_4');
                        }
                    } else {
                        return res.handleResponse(400, 'image_5');
                    }

                    ImageService.resizeImage(buffer, 'image').then(
                        function (success) {
                            var resizedImageBuffer = success.buffer;
                            var resizedImageDimensions = success.dimensions;

                            var image = new Image();
                            image.user = req.user._id;
                            image.dimensions = {
                                image: resizedImageDimensions
                            };
                            image.save(function (err, image) {
                                if (err) {
                                    return handleError(res, err);
                                } else {
                                    var extension = file.originalname.split('.').pop();
                                    var key = imageType + '/' + referenceID + '/images/' + image._id + '.' + extension;
                                    var thumbnailKey = imageType + '/' + referenceID + '/images/' + image._id + 'thumb.' + extension;
                                    ImageService.generateThumbnail(image._id, thumbnailKey, resizedImageBuffer).then(function (success) {
                                        image = success;
                                        ImageService.addToS3(key, resizedImageBuffer, function (err, data) {
                                            if (err) {
                                                return handleError(res, err);
                                            } else {
                                                image.src = env.amazonPrefix + key;
                                                image.save(function (err, image) {
                                                    if (err) {
                                                        return handleError(res, err);
                                                    } else {
                                                        service.addImage(referenceID, image._id).then(
                                                            function (success) {
                                                                res.handleResponse(200, {success: image});
                                                            },
                                                            function (err) {
                                                                handleError(res, err);
                                                            }
                                                        );
                                                    }
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        },
                        function (err) {
                            return handleError(res, err);
                        }
                    );
                })
                .catch(function (err) {
                    return handleError(res, err);
                });
        }
    } catch (ex) {
        return handleError(res, ex);
    }
};

/**
 * @name destroy
 * @function
 * @description deletes an image from the DB, "supervisor" role required
 * @param {Object} req
 * @param {Object} res
 */
exports.destroy = function (req, res) {
    Image.findOne({_id: req.query.id}, function (err, image) {
        if (err) {
            return handleError(res, err);
        } else if (!image) {
            return res.handleResponse(404);
        } else if (req.user.role !== 'supervisor') {

            return res.handleResponse(403);
        } else {
            image.remove(function (err) {
                if (err) {
                    return handleError(res, err);
                } else {
                    return res.handleResponse(204);
                }
            });
        }
    });
};

function handleError(res, err) {
    console.log(err);
    return res.handleResponse(500);
}

/**
 * @name decodeBase64Image
 * @function
 * @description decodes a image from a base 64 string
 * @param {String} dataString
 */
function decodeBase64Image(dataString) {
    var deferred = Q.defer();
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};

    response.type = matches[1];
    deferred.resolve(response.data = new Buffer(matches[2], 'base64'));

    return deferred.promise;
}

