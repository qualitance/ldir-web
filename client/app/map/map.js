'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.map', {
                abstract: true,
                url: '/map',
                template: '<ui-view></ui-view>'
            })
            .state('app.map.display', {
                url: '',
                templateUrl: 'app/map/templates/map.html',
                controller: 'MapCtrl'
            })
            .state('app.map.pile', {
                abstract: true,
                url: '/pile',
                template: '<ui-view></ui-view>'
            })
            .state('app.map.pile.view', {
                url: '/:id',
                templateUrl: 'app/map/templates/view_pile.html',
                controller: 'ViewPileCtrl',
                resolve: {
                    currentPile: ['Pile', '$stateParams', '$q', 'responseHandler',
                        function (Pile, $stateParams, $q, responseHandler) {
                        var deferred = $q.defer();
                        Pile.query({id: $stateParams.id}).$promise.then(function (data) {
                            deferred.resolve(responseHandler.getData(data));
                        });
                        return deferred.promise;
                    }]
                }
            })
            .state('app.map.pile.edit', {
                url: '/:id/edit',
                templateUrl: 'app/map/templates/edit_pile.html',
                controller: 'EditPileCtrl',
                resolve: {
                    currentPile: ['Pile', '$stateParams', '$q', 'responseHandler',
                        function (Pile, $stateParams, $q, responseHandler) {
                        var deferred = $q.defer();
                        Pile.query({id: $stateParams.id}).$promise.then(function (data) {
                            deferred.resolve(responseHandler.getData(data));
                        });
                        return deferred.promise;
                    }]
                }
            })
        ;
    });
