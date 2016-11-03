'use strict';

angular.module('ldrWebApp')
    .controller('ActivateCtrl', ['activate', '$scope', function (activate, $scope) {
        $scope.activate = activate;
    }]);
