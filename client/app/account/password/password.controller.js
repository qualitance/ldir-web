'use strict';

angular.module('ldrWebApp')
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
