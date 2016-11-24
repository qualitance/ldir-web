'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name MainCtrl
     * @description main controller
     * @requires Auth
     * @requires $state
     * @requires LxNotificationService
     * @requires $scope
     * @requires ContactService
     * @requires $translate
     */
    .controller('MainCtrl', ['Auth', '$state', 'LxNotificationService', '$scope', 'ContactService', '$translate',
        function (Auth, $state, LxNotificationService, $scope, ContactService, $translate) {

            /**
             * @ngdoc
             * @name MainCtrl#contact
             * @methodOf MainCtrl
             * @param {Object} form - contact us form object
             * @description creates contact us note
             */
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
                                function () {
                                });
                        }
                    });
                }
            };
        }]);
