'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name LoginCtrl
     * @description login controller
     * @requires $scope
     * @requires Auth
     * @requires $location
     * @requires $window
     * @requires LxNotificationService
     * @requires $state
     * @requires $stateParams
     * @requires User
     * @requires $translate
     * @requires responseHandler
     * @requires AUTH_URL
     * @property {Object} errors - errors object
     * @property {Object} user - user object
     * @property {Object} fail - error response flag
     */
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

            /**
             * @ngdoc
             * @name LoginCtrl#resend
             * @methodOf LoginCtrl
             * @example
             * <pre><a href='#' ng-click="resend()" class="tc-white"></pre>
             * @description
             * resends confirmation email
             */
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

            /**
             * @ngdoc
             * @name LoginCtrl#login
             * @methodOf LoginCtrl
             * @example
             * <pre><button ng-click="login(user, form)" class="btn btn--xl btn--white btn--raised" lx-ripple
             * type="submit">{{'views.login.loginButton' | translate}}
             </button></pre>
             * @description
             * login and redirect to dashboard
             */
            $scope.login = function (user, form) {
                $scope.submitted = true;
                $scope.fail.flag = false;

                if (form.$valid) {
                    Auth.login({
                            email: user.email,
                            password: user.password
                        })
                        .then(function () {
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
