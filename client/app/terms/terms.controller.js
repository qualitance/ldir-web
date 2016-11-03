'use strict';

angular.module('ldrWebApp')
    .controller('TermsCtrl', ['$http', '$scope', '$sce', '$translate', function ($http, $scope, $sce, $translate) {

        $http.get('/assets/pages/terms_' + $translate.use() + '.html').success(function (data) {
            $scope.terms = $sce.trustAsHtml(data);
        });

    }]);
