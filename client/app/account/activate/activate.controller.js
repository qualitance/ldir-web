'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name ActivateCtrl
     * @description activate account controller
     * @requires activate
     * @requires $scope
     * @property {Boolean} activate - user has active account
     */
    .controller('ActivateCtrl', ['activate', '$scope', function (activate, $scope) {
        $scope.activate = activate;
    }]);
