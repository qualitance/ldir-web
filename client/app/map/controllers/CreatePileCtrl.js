'use strict';
/**
 * @ngdoc controller
 * @name CreatePileCtrl
 * @description create pile view controller
 * @requires $rootScope
 * @requires $scope
 * @requires LxDialogService
 * @requires LxNotificationService
 * @requires $timeout
 * @requires $state
 * @requires Pile
 * @requires Upload
 * @requires HelperService
 * @requires $sce
 * @requires ImageUpload
 * @requires preloader
 * @requires $translate
 * @requires responseHandler
 * @requires Auth
 * @requires API_URL
 * @property {Integer} uploadMaxFileSize - environment maximum upload size
 * @property {Object} bgImage - default background image
 * @property {Object} files - image files
 * @property {Boolean} inprogress - images uploading in progress
 * @property {Object} steps - create pile steps config objects
 * @property {Function} getThumbnail - generate photo thumbnail function
 * @property {Object} materials - materials object
 * @property {Object} areas - areas object
 * @property {Object} pile - pile to create object
 */
angular.module('ldrWebApp').controller('CreatePileCtrl', [
    '$rootScope',
    '$scope',
    'LxDialogService',
    'LxNotificationService',
    '$timeout',
    '$state',
    'Pile',
    'Upload',
    'HelperService',
    '$sce',
    'ImageUpload',
    'preloader',
    '$translate',
    'responseHandler',
    'Auth',
    'API_URL',
    function ($rootScope, $scope, LxDialogService, LxNotificationService, $timeout, $state, Pile, Upload, HelperService,
              $sce, ImageUpload, preloader, $translate, responseHandler, Auth, API_URL) {
        var self = this;
        var uploadMaxFileSize = $rootScope.environment.images.max_size;
        $scope.bgImage = '#FFF url("../assets/images/map/type_description_' +
            Auth.getCurrentUser().language + '.svg") no-repeat center center';
        $scope.files = [];
        $scope.inprogress = false;

        /**
         * @ngdoc
         * @name CreatePileCtrl#checkedMaterialType
         * @methodOf CreatePileCtrl
         * @description check if material type is selected
         * @returns {Boolean} response
         */
        self.checkedMaterialType = function () {
            var response = false;
            angular.forEach($scope.materials, function (item) {
                if (item.selected) {
                    response = true;
                }
            });
            return response;
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#checkedArea
         * @methodOf CreatePileCtrl
         * @description check if area is selected
         * @returns {Boolean} response
         */
        self.checkedArea = function () {
            var response = false;
            angular.forEach($scope.areas, function (item) {
                if (item.selected) {
                    response = true;
                }
            });
            return response;
        };

        $scope.init = function () {
            $scope.steps = [
                {
                    name: $translate.instant('views.addPile.stepOne'),
                    isValid: function () {
                        if ($scope.files.length) {
                            return true;
                        }
                        else {
                            LxNotificationService.warning($translate.instant('views.addPile.photoRequired') + '!');
                        }
                        return false;
                    }
                },
                {
                    name: $translate.instant('views.addPile.stepTwo'),
                    isValid: function () {
                        if (self.checkedMaterialType()) {
                            return true;

                        }
                        else {
                            LxNotificationService.warning($translate.instant('views.addPile.materialRequired') + '!');
                        }
                        return false;
                    }
                },
                {
                    name: $translate.instant('views.addPile.stepThree'),
                    isValid: function () {
                        return true;
                    }
                },
                {
                    name: $translate.instant('views.addPile.stepFour'),
                    isValid: function () {
                        return true;
                    }
                }
            ];

            $scope.getThumbnail = HelperService.generateThumbnail;
            $scope.materials = HelperService.getPileMaterials();
            $scope.areas = HelperService.getPileAreas();
            $scope.pile = {
                size: 3
            };
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#$watchCollection
         * @methodOf CreatePileCtrl
         * @description splice files array if limit is exceeded
         */
        $scope.$watchCollection('files', function () {
            if ($scope.files.length > 3) {
                $scope.files = $scope.files.slice(0, 3);
                LxNotificationService.warning($translate.instant('views.addPile.photoMaxLimit') + '!');
            }
        });

        /**
         * @ngdoc
         * @name CreatePileCtrl#selectFiles
         * @methodOf CreatePileCtrl
         * @param {Object} files - image files to upload
         * @description for each image file generates thumbnail
         */
        $scope.selectFiles = function (files) {
            angular.forEach(files, function (file) {
                ImageUpload.isImage(file).then(
                    function (result) {
                        if (!result) {
                            LxNotificationService.warning($translate.instant('views.addPile.onlyPhotos') + '!');
                        } else {
                            if (file.size <= uploadMaxFileSize) {
                                $scope.inprogress = true;
                                HelperService.generateThumbnail(file).then(function (imageUrl) {

                                    preloader.preloadImages([imageUrl]).then(function handleResolve() {
                                        $scope.inprogress = false;
                                    }, function handleReject() {
                                        $scope.inprogress = false;
                                    });

                                    file.thumbnailImage = $sce.trustAsResourceUrl(imageUrl);
                                    $scope.files.push(file);
                                });
                            } else {
                                LxNotificationService.warning($translate.instant('views.addPile.file') + ' ' +
                                    file.name + ' ' + $translate.instant('views.addPile.fileExceeds') + ' ' +
                                    parseFloat(uploadMaxFileSize / (1024 * 1024)) + ' MB!');
                            }
                        }
                    }
                );
            });
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#canNavigateToStep
         * @param {String) step - step number
         * @methodOf CreatePileCtrl
         * @description check if user can go to next step
         */
        $scope.canNavigateToStep = function (step) {
            return (step >= 0 && step < $scope.steps.length && $scope.steps[step].isAvailable &&
            (step !== $scope.currentStep));
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#goToStep
         * @methodOf CreatePileCtrl
         * @param {String) step - step number
         * @description redirects to specified step
         */
        $scope.goToStep = function (step) {
            if ($scope.canNavigateToStep(step)) {
                $scope.currentStep = step;
            }
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#nextStep
         * @methodOf CreatePileCtrl
         * @description redirects to next steps
         */
        $scope.nextStep = function () {
            if ($scope.steps[$scope.currentStep].isValid()) {
                $scope.pile.location = $rootScope.location;
                $scope.steps[$scope.currentStep].isAvailable = true;
                $scope.currentStep += 1;
                $scope.steps[$scope.currentStep].isAvailable = true;
            }
            $scope.hasAreas = _.find($scope.areas, function (area) {
                return area.selected === true;
            });
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#previousStep
         * @methodOf CreatePileCtrl
         * @description redirects to previous step
         */
        $scope.previousStep = function () {
            if ($scope.canNavigateToStep($scope.currentStep - 1)) {
                $scope.currentStep -= 1;
            }
        };

        /**
         * @ngdoc
         * @name CreatePileCtrl#resetPile
         * @methodOf CreatePileCtrl
         * @description resets pile object
         */
        $scope.resetPile = function () {
            $scope.pile = {
                size: 3,
                location: $rootScope.location
            };
            $scope.pile.content = [];
            $scope.pile.areas = [];
            $scope.pile.description = '';
        };

        $scope.saving = false;

        /**
         * @ngdoc
         * @name CreatePileCtrl#createPile
         * @methodOf CreatePileCtrl
         * @description maps pile object, uploads pile and images, resets pile object
         */
        $scope.createPile = function () {

            $scope.saving = true;

            $scope.location = $rootScope.location;
            $scope.pile.content = [];
            $scope.pile.areas = [];

            angular.forEach($scope.materials, function (material) {
                if (material.selected) {
                    $scope.pile.content.push(material.type);
                }
            });
            angular.forEach($scope.areas, function (area) {
                if (area.selected) {
                    $scope.pile.areas.push(area.type);
                }
            });

            Upload.upload({
                url: API_URL + 'piles',
                data: {
                    'pile': $scope.pile,
                    file: $scope.files
                }
            }).progress(function () {
            }).success(function (data) {
                var pile = responseHandler.getData(data);
                if (pile) {
                    $rootScope.$broadcast('pileCreated', pile);
                    $scope.files = [];

                    $scope.resetPile();
                    $scope.currentStep = 0;
                    $scope.saving = false;

                    angular.forEach($scope.materials, function (pile) {
                        pile.selected = false;
                    });
                    angular.forEach($scope.areas, function (area) {
                        area.selected = false;
                    });

                    LxDialogService.close('createPile');
                    LxNotificationService.info($translate.instant('views.addPile.reportSuccess'));
                } else {
                    LxNotificationService.error($translate.instant('views.addPile.errorUpload'));
                    $scope.saving = false;
                }
            }).error(function () {
                LxNotificationService.error($translate.instant('views.addPile.errorUpload'));
                $scope.saving = false;
            });
        };

        $scope.closeModal = function (modalId) {
            LxDialogService.close(modalId);
            $scope.files = [];
            $scope.currentStep = 0;
            $scope.$emit('closeModal');
            LxNotificationService.info($translate.instant('views.addPile.cancelReport'));
        };

        $scope.init();

    }]);
