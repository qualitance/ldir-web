'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name PasswordCtrl
     * @description change password controller
     * @requires $scope
     * @requires $state
     * @requires User
     * @requires LxNotificationService
     * @requires $translate
     * @property {Object} errors - errors object
     * @property {Object} user - user object
     * @property {Object} success - success response flag
     */
    .controller('PasswordCtrl', [
        '$scope',
        '$state',
        'User',
        'LxNotificationService',
        '$translate',
        function ($scope, $state, User, LxNotificationService, $translate) {
            $scope.errors = {};
            $scope.success = false;

            $scope.user = {};

            /**
             * @ngdoc
             * @name PasswordCtrl#changePassword
             * @methodOf PasswordCtrl
             * @param {Object} form - change password form object
             * @example
             * <pre><form class="form" name="changePassForm" ng-submit="changePassword(changePassForm)" novalidate
             ng-if="!success"></pre>
             * @description
             * changes user password
             */
            $scope.changePassword = function (form) {

                $scope.submitted = true;

                if (form.$valid) {

                    User.change({salt: $state.params.salt}, {password: $scope.user.password1, pass: true}, function () {
                            $scope.success = true;
                            $state.go('login');
                            LxNotificationService.success($translate.instant('views.signup.setPassword.succesPasswordSet'));
                        },
                        function error(msg) {
                            console.error(msg);
                            LxNotificationService.error($translate.instant('views.signup.setPassword.failPasswordSet'));
                        }
                    );
                }
            };
        }]);
