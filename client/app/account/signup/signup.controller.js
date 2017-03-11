'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name SignupCtrl
     * @description user sign in controller
     * @requires $scope
     * @requires Auth
     * @requires User
     * @requires $location
     * @requires LxNotificationService
     * @requires $translate
     * @requires responseHandler
     * @requires AUTH_URL
     * @property {Object} errors - errors object
     * @property {Object} user - user object
     * @property {Object} success - success response flag
     */
    .controller('SignupCtrl', ['$scope', 'Auth', 'User', '$location', '$window', 'LxNotificationService', '$translate',
        'responseHandler', 'AUTH_URL',
        function ($scope, Auth, User, $location, $window, LxNotificationService, $translate,
                  responseHandler, AUTH_URL) {

            $scope.user = {};
            $scope.errors = {};
            $scope.success = false;

            var email_created;

            /**
             * @ngdoc
             * @name SignupCtrl#register
             * @methodOf SignupCtrl
             * @param {Object} user - user object
             * @param {Object} form -  new user form object
             * @example
             * <pre><form class="form" name="form" ng-submit="register(user, form)" novalidate ng-if="!success">
             </pre>
             * @description
             * resends confirmation email
             */
            $scope.register = function (user, form) {
                $scope.submitted = true;
                var mailLanguage = $translate.use();
                if (form.$valid) {
                    Auth.createUser({
                            terms: user.terms,
                            pass: true,
                            email: user.email,
                            password: user.password1,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            language: mailLanguage
                        })
                        .then(function (user) {
                            $scope.success = true;
                            email_created = responseHandler.getData(user).email;
                        })
                        .catch(function (err) {
                            LxNotificationService.error($translate.instant('signUpError'));
                            err = responseHandler.getErrorData(err.data);
                            $scope.errors = {};

                            // Update validity of form fields that match the mongoose errors
                            angular.forEach(err.errors, function (error, field) {
                                form[field].$setValidity('mongoose', false);
                                $scope.errors[field] = error.message;
                            });
                        });
                }
            };

            /**
             * @ngdoc
             * @name SignupCtrl#resend
             * @methodOf SignupCtrl
             * @example
             * <pre><button class="btn btn--xl btn--white btn--raised" lx-ripple ng-click="resend()">
             *     {{'views.signup.resend' | translate}}</button></pre>
             * @description
             * resends confirmation email
             */
            $scope.resend = function () {
                User.resendActivation({email: email_created}).$promise
                    .then(function () {
                        LxNotificationService.alert($translate.instant('views.signup.resendTitle'),
                            $translate.instant('views.signup.resendMessage'),
                            $translate.instant('views.signup.resendOKButton'), function () {
                            });
                    });
            };

            $scope.niceToKnow = function (user) {
                if (user.first_name && user.last_name && !$scope.niceToKnowSent) {
                    $scope.niceToKnowSent = true;
                    LxNotificationService.notify($translate.instant('views.signup.niceToKnow') +
                        ' ' + user.first_name + ' ' + user.last_name + '.', 'emoticon', false, 'blue');
                }
            };

            $scope.loginOauth = function (provider) {
                $window.location.href = AUTH_URL + provider;
            };
        }]);
