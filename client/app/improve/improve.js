'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.admin.improve', {
                url: '/improve',
                abstract: true,
                template: '<ui-view></ui-view>'
            })
            .state('app.admin.improve.list_issues', {
                url: '/issues_list',
                templateUrl: 'app/improve/improve.html',
                controller: 'IssuesListCtrl'
            })
        ;
    });
