'use strict';

angular.module('ldrWebApp')
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
            $scope.sendIssue = function (form, dialogId) {
                if (form.$valid) {
                    Issues.create($scope.issue).$promise.then(function success() {
                        $scope.resetForm(form);
                    });
                    LxDialogService.close(dialogId);
                    LxNotificationService.success($translate.instant('views.report.success'));
                }
            };
            $scope.resetForm = function (form) {
                $scope.issue = null;
                $scope.issue = angular.copy(originalIssue);
                form.$setPristine();
            };
        }]);
