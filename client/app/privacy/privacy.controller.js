'use strict';

angular.module('ldrWebApp')
    .controller('PrivacyCtrl', ['$http', '$scope', '$translate', function ($http, $scope, $translate) {

        $http.get('/assets/pages/privacy_' + $translate.use() + '.html').success(function (data) {
            $scope.privacy = data;
        });

    }]);
