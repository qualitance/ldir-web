'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name ContactCtrl
     * @description contact page controller
     * @requires $scope
     * @requires Auth
     * @requires ContactService
     * @requires LxNotificationService
     * @requires $translate
     * @requires responseHandler
     * @property {Object} contact - contact info object
     * @property {Boolean} messageSending - sending message in progress flag
     */
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

            /**
             * @ngdoc
             * @name ContactCtrl#sendMessage
             * @methodOf ContactCtrl
             * @description
             * sends email to contact person with given message
             * @param {Object} form - send message form object
             */
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
                                function () {
                                });
                        }
                    });
                }
            };

        }]);
