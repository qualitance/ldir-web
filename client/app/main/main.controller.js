'use strict';

angular.module('ldrWebApp')
    .controller('MainCtrl', ['Auth', '$state', 'LxNotificationService', '$scope', 'ContactService', '$translate',
        function (Auth, $state, LxNotificationService, $scope, ContactService, $translate) {

        $scope.contact = function (form) {
            if (form.$valid) {
                ContactService.create({
                    first_name: form.first_name.$viewValue,
                    last_name: form.last_name.$viewValue,
                    email: form.email.$viewValue,
                    message: form.message.$viewValue
                }).$promise.then(function (resp) {
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
