var AWS = require('aws-sdk');
var env = require('../../config/environment');

AWS.config.update(
    {
        accessKeyId: env.amazonKey,
        secretAccessKey: env.amazonSecret,
        region: env.amazonRegion
    }
);

//configure credentials for use on server only; assign credentials based on role (never use master credentials)
//    AWS.config.credentials = new AWS.TemporaryCredentials({
//        RoleArn: 'arn:aws:iam::578381890239:role/msdAdmin'
//    });
//s3 object for use on server
var s3 = new AWS.S3();
//bucket retrieved from environment variables
var amazonBucket = env.amazonBucket;

/**
 * @name deleteObjectS3
 * @function
 * @description delete object from S3
 * @param {String} key
 * @param {Function} callback
 */
var deleteObjectS3 = function (key, callback) {
    s3.deleteObject({Bucket: amazonBucket, Key: key}, function (err, data) {
        callback(err, data);
    });
};

/**
 * @name addObjectS3
 * @function
 * @description add object from S3
 * @param {String} key
 * @param {Object} body
 * @param {Function} callback
 */
var addObjectS3 = function (key, body, callback) {
    var full_path = env.amazonPrefix + key;
    s3.upload({Bucket: amazonBucket, Key: key, Body: body, ACL: 'public-read'}, function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(false, full_path);
        }
    });

};

exports.deleteObjectS3 = deleteObjectS3;
exports.addObjectS3 = addObjectS3;
