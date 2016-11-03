'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.admin', {
                url: '/admin',
                templateUrl: 'app/admin/templates/admin.html',
                controller: 'AdminCtrl'
            })
            .state('app.admin.users', {
                url: '/users',
                templateUrl: 'app/admin/templates/users_list.html',
                controller: 'AdminUsersCtrl'
            })
            .state('app.admin.statistics', {
                url: '/statistics',
                templateUrl: 'app/admin/templates/statistics.html',
                controller: 'StatisticsCtrl'
            })
            .state('app.admin.user', {
                abstract: true,
                url: '/users/:id',
                template: '<ui-view></ui-view>'
            })
            .state('app.admin.user.view', {
                url: '',
                templateUrl: 'app/admin/templates/single_user.html',
                controller: 'AdminUserCtrl'
            })
            .state('app.admin.user.edit', {
                url: '/edit',
                templateUrl: 'app/admin/templates/edit_user.html',
                controller: 'AdminEditUserCtrl'
            })
        ;
    });
