'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.activity', {
                url: '/notifications',
                templateUrl: 'app/activity/templates/notifications_view.html',
                controller: 'ActivityCtrl'
            })
        ;
    });
