'use strict';

var config = require('../../config/environment');
var Q = require('q');
var gm = require('gm');

var aws = require('../../components/amazon');

var Image = require('./image.model');

/**
 * Save new image from facebook by specified facebookID
 * @param facebookID
 * @returns {*}
 */
function createFromFB(facebookID) {
    var deferred = Q.defer();

    var image = new Image({
        src: config.facebook.apiURL + facebookID + "/picture?type=large",
        thumb_src: config.facebook.apiURL + facebookID + "/picture",
        not_local: true
    });

    image.save(function (err, image) {
        if(err){
            deferred.reject({data: err});
        }else{
            deferred.resolve(image);
        }
    });

    return deferred.promise;
};

/**
 * Process image by resize
 * @param buffer
 * @returns {*}
 */
function processImage(buffer){
    var deferred = Q.defer();
    resizeImage(buffer, "image")
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
 * Make changes to image: modify dimensions and extension
 * @param user
 * @param imageBuffer
 * @param imageDimensions
 * @param imageExtension
 * @param referenceID
 * @param image_id
 */
function updatePileImage(user, imageBuffer, imageDimensions, imageExtension, referenceID, image_id){
    var deferred = Q.defer();

    //first, get the image from db
    Image.findOne({_id: image_id}, function(err, image){
        if(err){
            deferred.reject(err);
        }else if(!image){
            deferred.reject("At: uploadPileImage: no image found with id " + image_id);
        }else{
            var imageType = "pile";
            image.user = user._id;
            image.dimensions = {
                image: imageDimensions
            };
            var key = imageType + "/" + referenceID + "/images/" + image._id + "." + imageExtension;
            image.src = config.amazonPrefix + key;
            //add image to amazon
            aws.addObjectS3(key, imageBuffer, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    //save image
                    image.save(function (err, image) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            var thumbnailKey = imageType + "/" + referenceID + "/images/" + image._id + "thumb." + imageExtension;
                            generateThumbnail(image._id, thumbnailKey, imageBuffer)
                                .then(function(image){
                                    deferred.resolve(image);
                                })
                                .catch(function(err){
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
 * Resize image
 * @param buffer
 * @param image_type
 * @returns {*}
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
                            if(err){
                                deferred.reject({data: err});
                            }else{
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
};

/**
 * get resize dimensions; type = "image" / "thumbnail"
 * @param actual_width
 * @param actual_height
 * @param type
 * @returns {*}
 */
function getResizeDimensions(actual_width, actual_height, type) {
    var deferred = Q.defer();

    if(type != "image" && type != "thumbnail"){
        deferred.reject({code: "image_1"});
    }else{
        //get maximum allowed width and height from environment
        var max = {
            width: config.images[type+"_size"].width,
            height: config.images[type+"_size"].height
        };

        var calculated = {
            width: 0,
            height: 0
        };

        var actual = {
            width: actual_width,
            height: actual_height
        };

        console.log("=========== resize image");
        console.log("boundary:");
        console.log(max);
        console.log("initial:");
        console.log(actual);
        //decide whether to resize on width or on height based on the image's proportions
        //the idea is to get the largest possible image within the max boundary, without cropping it or changing it's ratio
        var ratio = actual.width / actual.height;
        if(ratio > config.images.target_ratio){
            calculated.width = max.width;
            calculated.height = Math.round(calculated.width / ratio);
        }else{
            calculated.height = max.height;
            calculated.width = Math.round(calculated.height * ratio);
        }
        //make sure boundaries were not exceeded due to the division/multiplication
        if(calculated.height > max.height) calculated.height = max.height;
        if(calculated.width > max.width) calculated.width = max.width;
        console.log("final:");
        console.log(calculated);

        deferred.resolve(calculated);
    }
    return deferred.promise;
};
/**
 * Returns image dimensions
 * @param buffer
 * @returns {*}
 */
function getImageDimensions (buffer) {
    var deferred = Q.defer();
    gm(buffer).size(function (err, actual) {
        if(err){
            deferred.reject({data: err});
        }else if(!actual){
            deferred.reject({code: "image_2"});
        }else{
            deferred.resolve(actual);
        }
    });
    return deferred.promise;
};
/**
 * Add thumbnail to image
 * @param imageID
 * @param key
 * @param buffer
 * @returns {*}
 */
function generateThumbnail(imageID, key, buffer) {
  var deferred = Q.defer();
    Image.findOne({_id: imageID}, function (err, image) {
        if(err){
          deferred.reject({data: err});
        }else{
            try{
                console.log("generating thumbnail...");
                resizeImage(buffer, "thumbnail").then(
                    function (success) {
                        var resizedImageBuffer = success.buffer;
                        var resizedImageDimensions = success.dimensions;
                        aws.addObjectS3(key, resizedImageBuffer, function (err, success) {
                            if(err){
                              deferred.reject({data: err});
                            }else{
                                //add thumbnail key to db
                                image.thumb_src = config.amazonPrefix + key;
                                image.dimensions.thumb = resizedImageDimensions;
                                image.save(function (err, image) {
                                    if(err){
                                      deferred.reject({data: err});
                                    }else{
                                      deferred.resolve(image);
                                    }
                                });
                            }
                        })
                    }
                );
            }catch(ex){
                console.log(ex);
            }
        }
    });
  return deferred.promise;
};
/**
 * Create an empty image
 * @returns {*}
 */
function createEmpty(){
    var deferred = Q.defer();
    var img = new Image();
    img.save(function(err, image){
        if(err){
            deferred.reject(err);
        }else{
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
