'use strict';

angular.module('ldrWebApp')
    .controller('ContactCtrl', ['$scope', 'Auth', 'ContactService', 'LxNotificationService', '$translate',
        'responseHandler',
        function ($scope, Auth, ContactService, LxNotificationService, $translate, responseHandler) {

        $scope.init = function () {
            Auth.getCurrentUser().$promise.then(function success(data) {
                $scope.contact = _.pick(responseHandler.getData(data), ['first_name', 'last_name', 'email']);
            });
        };

        $scope.init();
        $scope.messageSending = false;
        $scope.sendMessage = function (form) {
            if (form.$valid) {
                $scope.messageSending = true;
                ContactService.create({
                    first_name: form.first_name.$viewValue,
                    last_name: form.last_name.$viewValue,
                    email: form.email.$viewValue,
                    subject: form.subject.$viewValue,
                    message: form.message.$viewValue
                }).$promise.then(function (resp) {
                    $scope.messageSending = false;
                    if (resp.success) {
                        LxNotificationService.alert($translate.instant('generic.notificationTitle'),
                            $translate.instant('generic.notificationMessage'),
                            $translate.instant('generic.notificationOKButton'),
                            function () {});
                    }
                });
            }
        };

    }]);
