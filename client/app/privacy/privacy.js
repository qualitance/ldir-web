'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.privacy', {
                url: '/privacy',
                templateUrl: 'app/privacy/privacy.html',
                controller: 'PrivacyCtrl',
                authenticate: true
            });
    });
