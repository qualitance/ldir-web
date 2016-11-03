'use strict';

angular.module('ldrWebApp')
    .controller('FpwCtrl', ['$scope', 'User', 'LxNotificationService', 'responseHandler', '$translate',
        function ($scope, User, LxNotificationService, responseHandler, $translate) {
        $scope.errors = {};
        $scope.user = {};
        $scope.success = false;

        $scope.reset = function (form) {
            $scope.submitted = true;

            if (form.$valid) {

                User.fpw({email: $scope.user.email}).$promise.then(function () {
                    $scope.success = true;
                }).catch(function (err) {

                    LxNotificationService.error($translate.instant(responseHandler.getCode(err.code ? err : err.data)));

                });
            }
        };

    }]);
