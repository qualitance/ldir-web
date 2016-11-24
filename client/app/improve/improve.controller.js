'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name ImproveCtrl
     * @description improve page controller
     * @requires $scope
     * @requires Issues
     * @requires LxNotificationService
     * @requires LxDialogService
     * @requires $translate
     * @property {Object} issue - issue to report objects
     * @property {String} currentLang - current language
     */
    .controller('ImproveCtrl', [
        '$scope',
        'Issues',
        'LxNotificationService',
        'LxDialogService',
        '$translate',
        function ($scope, Issues, LxNotificationService, LxDialogService, $translate) {
            $scope.issue = {
                message: '',
                description: ''
            };
            var originalIssue = angular.copy($scope.issue);
            $scope.currentLang = $translate.use();

            /**
             * @ngdoc method
             * @name ImproveCtrl#sendIssue
             * @methodOf ImproveCtrl
             * @description
             * creates entered issue
             */
            $scope.sendIssue = function (form, dialogId) {
                if (form.$valid) {
                    Issues.create($scope.issue).$promise.then(function success() {
                        $scope.resetForm(form);
                    });
                    LxDialogService.close(dialogId);
                    LxNotificationService.success($translate.instant('views.report.success'));
                }
            };

            /**
             * @ngdoc method
             * @name ImproveCtrl#resetForm
             * @methodOf ImproveCtrl
             * @description
             * clears form
             */
            $scope.resetForm = function (form) {
                $scope.issue = null;
                $scope.issue = angular.copy(originalIssue);
                form.$setPristine();
            };
        }]);
