'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app', {
                abstract: true,
                url: '',
                templateUrl: 'components/navbar/navbar.html',
                controller: 'NavbarCtrl'
            })
            .state('main', {
                url: '/',
                templateUrl: 'app/main/main.html',
                controller: 'MainCtrl',
                authenticate: false
            });
    });
