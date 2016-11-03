'use strict';

angular.module('ldrWebApp')
    .controller('SignupCtrl', ['$scope', 'Auth', 'User', '$location', '$window', 'LxNotificationService', '$translate',
        'responseHandler', 'AUTH_URL',
        function ($scope, Auth, User, $location, $window, LxNotificationService, $translate,
                  responseHandler, AUTH_URL) {

            $scope.user = {};
            $scope.errors = {};
            $scope.success = false;

            var email_created;

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
