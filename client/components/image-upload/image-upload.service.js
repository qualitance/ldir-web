'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name ImageUpload
     * @description The image upload service
     * @requires Upload
     * @requires $q
     * @requires $http
     * @requires responseHandler
     * @requires API_URL
     */
    .factory('ImageUpload', ['Upload', '$q', '$http', 'responseHandler', 'API_URL',
        function (Upload, $q, $http, responseHandler, API_URL) {
        return {
            /**
             * @name ImageUpload#upload
             * @example
             * ImageUpload.upload(file, 'user').then(function (success) {},function () {}, function () {});
             * @param {Object} imageBody - image body
             * @param {String} imageType - image type
             * @param {String} referenceID - pile containing image id
             * @description
             * uploads image
             * @returns {Promise} Resolves to an empty response/error
             */
            upload: function (imageBody, imageType, referenceID) {
                var deferred = $q.defer();
                Upload.upload({
                    url: API_URL + 'images',
                    fields: {'imageType': imageType, referenceID: referenceID},
                    file: imageBody
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    deferred.notify(progressPercentage);
                }).success(function (data) {
                    if (responseHandler.getData(data)) {
                        deferred.resolve(responseHandler.getData(data));
                    } else {
                        deferred.reject(data.error);
                    }
                }).error(function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            },
            /**
             * @name ImageUpload#uploadScreenshot
             * @example
             * ImageUpload.uploadScreenshot($scope.mapScreenshot, $scope.width, $scope.height, 'pile', parent.pile._id)
             * @param {Object} screenshotBase64 - screenshot image in base64
             * @param {Integer} width
             * @param {Integer} height
             * @param {String} imageType - image type
             * @param {String} referenceID - pile containing image id
             * @description
             * uploads screenshot image
             * @returns {Promise} Resolves to an empty response/error
             */
            uploadScreenshot: function (screenshotBase64, width, height, imageType, referenceID) {
                var deferred = $q.defer();
                Upload.upload({
                    url: API_URL + 'images',
                    fields: {
                        'screenshotBase64': screenshotBase64,
                        'width': width,
                        'height': height,
                        'imageType': imageType,
                        referenceID: referenceID
                    }
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    deferred.notify(progressPercentage);
                }).success(function (data) {
                    if (responseHandler.getData(data)) {
                        deferred.resolve(responseHandler.getData(data));
                    } else {
                        deferred.reject(data.error);
                    }
                }).error(function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            },
            /**
             * @name ImageUpload#remove
             * @example
             * ImageUpload.remove($scope.allImages[$scope.allImages.index]._id)
             * @param {Object} image_id - image id to remove
             * @description
             * removes image
             * @returns {Promise} Resolves to an empty response/error
             */
            remove: function (image_id) {
                var deferred = $q.defer();
                $http.delete(API_URL + 'images', {
                        method: 'DELETE',
                        params: {
                            id: image_id
                        }
                    })
                    .success(function (resp) {
                        deferred.resolve(responseHandler.getData(resp));
                    })
                    .error(function (err) {
                        deferred.reject(err);
                    });
                return deferred.promise;
            },
            isImage: function (file) {

                var deferred = $q.defer();
                var mimeType = file.type.substring(0, 6);
                if (mimeType === 'image/') {
                    deferred.resolve(true);
                }
                else {
                    deferred.resolve(false);
                }
                return deferred.promise;
            }
        };
    }]);
