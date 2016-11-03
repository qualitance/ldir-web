'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.contact', {
                url: '/contact',
                templateUrl: 'app/contact/contact.html',
                controller: 'ContactCtrl',
                authenticate: true
            });
    });
