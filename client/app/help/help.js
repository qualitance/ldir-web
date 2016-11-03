'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.help', {
                url: '/help',
                templateUrl: 'app/help/help.html',
                controller: 'HelpCtrl',
                authenticate: true
            });
    });
