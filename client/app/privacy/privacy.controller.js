'use strict';
angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name PrivacyCtrl
     * @description privacy controller
     * @requires $http
     * @requires $scope
     * @requires $translate
     * @property {privacy} html containing privacy rules
     */
    .controller('PrivacyCtrl', ['$http', '$scope', '$translate', function ($http, $scope, $translate) {

        $http.get('/assets/pages/privacy_' + $translate.use() + '.html').success(function (data) {
            $scope.privacy = data;
        });

    }]);
