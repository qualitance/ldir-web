'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('terms', {
                url: '/terms',
                templateUrl: 'app/terms/terms.html',
                controller: 'TermsCtrl',
                authenticate: false
            });
    });
