'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name HelpCtrl
     * @description help page controller
     * @requires $scope
     * @requires Auth
     * @property {String} message - hello message
     * @property {String} helperLanguage - current user language

     */
    .controller('HelpCtrl', function ($scope, Auth) {
        $scope.message = 'Hello';
        $scope.helperLanguage = Auth.getCurrentUser().language;
    });
