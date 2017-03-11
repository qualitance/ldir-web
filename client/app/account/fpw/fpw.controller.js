'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name FpwCtrl
     * @description reset password controller
     * @requires $scope
     * @requires User
     * @requires LxNotificationService
     * @requires responseHandler
     * @requires $translate
     * @property {Object} errors - errors object
     * @property {Object} user - user object
     * @property {Boolean} success - reset password email sent with success
     */
    .controller('FpwCtrl', ['$scope', 'User', 'LxNotificationService', 'responseHandler', '$translate',
        function ($scope, User, LxNotificationService, responseHandler, $translate) {
        $scope.errors = {};
        $scope.user = {};
        $scope.success = false;

            /**
             * @ngdoc
             * @name FpwCtrl#reset
             * @methodOf FpwCtrl
             * @param {Object} form - reset password form object
             * @example
             * <pre><form class="form" name="form" ng-submit="reset(form)" novalidate ng-if="!success"></pre>
             * @description
             * sends reset password email
             */
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
