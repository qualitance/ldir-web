'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name TermsCtrl
     * @description terms controller
     * @requires $http
     * @requires $scope
     * @requires $sce
     * @requires $translate
     * @property {terms} html containing terms and conditions
     */
    .controller('TermsCtrl', ['$http', '$scope', '$sce', '$translate', function ($http, $scope, $sce, $translate) {

        $http.get('/assets/pages/terms_' + $translate.use() + '.html').success(function (data) {
            $scope.terms = $sce.trustAsHtml(data);
        });

    }]);
