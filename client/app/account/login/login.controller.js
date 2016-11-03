'use strict';

angular.module('ldrWebApp')
    .controller('LoginCtrl', ['$scope', 'Auth', '$location', '$window', 'LxNotificationService', '$state',
        '$stateParams', 'User', '$translate', 'responseHandler', 'AUTH_URL',
        function ($scope, Auth, $location, $window, LxNotificationService, $state,
                  $stateParams, User, $translate, responseHandler, AUTH_URL) {
            $scope.user = {};
            $scope.errors = {};
            $scope.fail = {
                flag: false
            };

            if ($stateParams.error) {
                LxNotificationService.error(responeHandler.getCode($stateParams.error.code ? $stateParams.error : $stateParams.error.data));
                $stateParams.error = null;
            }

            $scope.resend = function () {

                LxNotificationService.confirm($translate.instant('views.login.resendConfirmTitle'),
                    $translate.instant('views.login.resendConfirmMessage') + '?', {
                    cancel: $translate.instant('views.login.resendConfirmCancelButton'),
                    ok: $translate.instant('views.login.resendConfirmOKButton')
                }, function (answer) {
                    if (answer) {

                        User.resendActivation({email: $scope.user.email}).$promise
                            .then(function () {
                                LxNotificationService.success($translate.instant('views.login.resendConfirmMessageSent') + '.');
                            });

                        $scope.fail.flag = false;

                    }
                });

            };

            $scope.login = function (user, form) {
                $scope.submitted = true;
                $scope.fail.flag = false;

                if (form.$valid) {
                    Auth.login({
                            email: user.email,
                            password: user.password
                        })
                        .then(function () {
                            // Logged in, redirect to dashboard
                            $state.go(Auth.getDefaultScreen());
                        })
                        .catch(function (err) {
                            LxNotificationService.error($translate.instant(responseHandler.getCode(err.code ? err : err.data)));
                        });
                }
            };

            $scope.loginOauth = function (provider) {
                $window.location.href = AUTH_URL + provider;
            };
        }]);
