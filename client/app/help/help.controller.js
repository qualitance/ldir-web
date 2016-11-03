'use strict';

angular.module('ldrWebApp')
    .controller('HelpCtrl', function ($scope, Auth) {
        $scope.message = 'Hello';
        $scope.helperLanguage = Auth.getCurrentUser().language;
    });
