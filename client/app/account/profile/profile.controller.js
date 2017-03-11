'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name ProfileCtrl
     * @description profile controller
     * @requires CountyService
     * @requires LxNotificationService
     * @requires LxDialogService
     * @requires Auth
     * @requires $filter
     * @requires ImageUpload
     * @requires $rootScope
     * @requires $timeout
     * @requires LxProgressService
     * @requires $state
     * @requires CountryService
     * @requires $translate
     * @requires HelperService
     * @requires responseHandler
     * @property {Object} user - current user object
     * @property {Object} selectedLanguage - selected language object
     * @property {Object} country - current user country object
     * @property {Array} countries - all countries array
     * @property {Array} counties - all counties array
     * @property {Object} availableLanguages - available languages object
     * @property {Object} errors - error response object
     */
    .controller('ProfileCtrl', ['$scope',
        'CountyService',
        'LxNotificationService',
        'LxDialogService',
        'Auth',
        '$filter',
        'ImageUpload',
        '$rootScope',
        '$timeout',
        'LxProgressService',
        '$state',
        'CountryService',
        '$translate',
        'HelperService',
        'responseHandler',
        function ($scope, CountyService, LxNotificationService, LxDialogService, Auth, $filter, ImageUpload, $rootScope,
                  $timeout, LxProgressService, $state, CountryService, $translate, HelperService, responseHandler) {

            var uploadMaxFileSize = $rootScope.environment.images.max_size;

            var hadProfileComplete = Auth.hasProfileComplete();

            $scope.init = function () {
                Auth.getCurrentUser().$promise.then(function success(data) {
                    angular.extend(data, responseHandler.getData(data));
                    $scope.user = angular.copy(data);
                    $scope.selectedLanguage = {
                        value: $scope.user.language
                    };
                    var params = {};
                    if ($scope.user.county) {
                        $scope.country = angular.copy($scope.user.county.country);
                        params = {
                            id: $scope.country._id
                        };
                    }
                    CountyService.getCounties(params).$promise.then(
                        function (data) {
                            $scope.counties = responseHandler.getData(data);
                            if ($scope.counties[0]._id === 0) {
                                $scope.counties.shift();
                            }
                        }
                    );
                    CountryService.getCountries().then(function (response) {
                        $scope.countries = response;
                    });
                    $scope.availableLanguages = HelperService.getAvailableLanguages();
                });
                $scope.errors = {};
            };

            /**
             * @ngdoc
             * @name ProfileCtrl#resetCounties
             * @methodOf ProfileCtrl
             * @param {Object} selectedCountry - selected country
             * @example
             * <pre><ui-select name="country" ng-model="country" required ng-change="resetCounties(country)"></pre>
             * @description
             * gets counties depending on selected country
             */
            $scope.resetCounties = function (selectedCountry) {
                var params = {
                    id: selectedCountry._id
                };
                CountyService.getCounties(params).$promise.then(
                    function (data) {
                        $scope.counties = responseHandler.getData(data);
                        if ($scope.counties[0]._id === 0) {
                            $scope.counties.shift();
                        }
                        $scope.user.county = $scope.counties[0];
                    }
                );
            };

            /**
             * @ngdoc
             * @name ProfileCtrl#openPasswordDialog
             * @methodOf ProfileCtrl
             * @example
             * <pre><button class="btn btn--xl btn--black btn--flat" lx-ripple ng-click="openPasswordDialog()" type="button"></pre>
             * @description
             * opens change password dialog
             */
            $scope.openPasswordDialog = function () {
                $scope.submitted = false;
                $scope.pass = {
                    password0: '',
                    password1: '',
                    password2: ''
                };
                $scope.errors = {};
                LxDialogService.open('password');
            };

            /**
             * @ngdoc
             * @name ProfileCtrl#closePasswordDialog
             * @methodOf ProfileCtrl
             * @param {Object} form - change password form object
             * @param {Object} user - user form object
             * @example
             * <pre><form name="pwd" ng-submit="closePasswordDialog(pwd, user)" novalidate></pre>
             * @description
             * saves new password on dialog close
             */
            $scope.closePasswordDialog = function (form, user) {

                $scope.submitted = true;

                if (form.$valid) {

                    if (!user.pass) {
                        $scope.user.password0 = null;
                    }
                    var message = (!user.pass) ? $translate.instant('views.profile.setSuccessPass') : $translate.instant('views.profile.changeSuccessPass');

                    Auth.changePassword($scope.pass.password0, $scope.pass.password1).then(function () {
                        LxDialogService.close('password');
                        $timeout(function () {
                            user.pass = true;
                            angular.extend($scope.user, user);
                            LxNotificationService.success(message);
                        }, 300);
                    }).catch(function () {
                        LxNotificationService.error($translate.instant('views.profile.incorrectPass') + '!');
                    });

                } else if ($scope.pass.password1 !== $scope.pass.password2) {
                    LxNotificationService.error($translate.instant('views.profile.passNotMatch'));
                }
            };

            /**
             * @ngdoc
             * @name ProfileCtrl#update
             * @methodOf ProfileCtrl
             * @param {Object} form - user profile form object
             * @example
             * <pre><button data-ng-click="update(form)" style="float: right" class="btn btn--xl btn--green btn--raised"
             lx-ripple type="submit">{{'views.profile.saveChanges' | translate}}</button></pre>
             * @description
             * updates user profile
             */
            $scope.update = function (form) {
                $scope.submitted = true;

                if (form.$valid) {

                    var promise = $scope.user.$save();

                    promise.then(function (user) {
                        angular.extend(user, responseHandler.getData(user));
                        angular.extend(Auth.getCurrentUser(), user);
                        $translate.use(user.language.toLowerCase());
                        LxNotificationService.success($translate.instant('views.profile.profileSaveMessage'));
                        if (!hadProfileComplete) {
                            $state.go('app.map.display');
                        }
                    }, function (err) {
                        LxNotificationService.error($translate.instant('profileError'));
                        err = responseHandler.getErrorData(err.data);
                        $scope.errors = {};
                        angular.forEach(err.errors, function (error, field) {
                            form[field].$setValidity('mongoose', false);
                            $scope.errors[field] = error.message;
                        });

                    });

                }
            };

            /**
             * @ngdoc
             * @name ProfileCtrl#changeProfilePic
             * @methodOf ProfileCtrl
             * @param {Array} $files - array containing new profile image
             * @example
             * <pre><button class="btn btn--m btn--green btn--fab" lx-ripple ngf-select="changeProfilePic($files)"
             ngf-multiple="false" ngf-accept="'image/*'"><i class="mdi mdi-camera"></i></button></pre>
             * @description
             * uploads new profile image, then updates the user profile
             */
            $scope.changeProfilePic = function ($files) {
                if ($files && $files[0]) {
                    var file = $files[0];
                    ImageUpload.isImage(file).then(function (result) {
                        if (!result) {
                            LxNotificationService.warning($translate.instant('views.profile.onlyImages') + '!');
                        } else {
                            if (file.size <= uploadMaxFileSize) {
                                ImageUpload.upload(file, 'user').then(
                                    function (success) {
                                        $scope.user.image = success;
                                        $rootScope.$emit('updateMenuPic', $scope.user.image);
                                        LxProgressService.circular.hide();
                                    },
                                    function () {
                                        LxProgressService.circular.hide();
                                        LxNotificationService.error($translate.instant('views.profile.errorSavingPhoto') + '!')
                                    },
                                    function () {
                                        LxProgressService.circular.show('#000000', '#progress');
                                    }
                                );
                            } else {
                                LxNotificationService.warning($translate.instant('views.profile.fileLabel') + ' ' +
                                    file.name + ' ' + $translate.instant('views.profile.fileLimit') +
                                    parseFloat(uploadMaxFileSize / (1024 * 1024)) + 'MB!');
                            }
                        }
                    });
                }
            };

            $scope.init();

            $scope.changeLanguage = function (selectedLanguage) {
                $scope.user.language = selectedLanguage.value;
            };

        }])

    .filter('setBackgroundImage', [
        function () {
            return function (input) {
                if (input) {
                    return {'background-image': 'url(' + input.src + ')'};
                }
            };
        }
    ]);

