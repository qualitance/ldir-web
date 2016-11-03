'use strict';
angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.dashboard', {
                url: '/dashboard',
                templateUrl: 'app/dashboard/dashboard.html',
                controller: 'DashboardCtrl',
                authenticate: true
            })
        ;
    });
