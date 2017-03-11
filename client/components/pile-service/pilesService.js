'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name Pile
     * @description The pile service
     * @requires $resource
     * @requires API_URL
     */
    .service('Pile', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'piles/:action', {}, {
            query: {method: 'GET', isArray: false},
            queryMap: {method: 'GET', isArray: false, params: {action: 'map'}},
            create: {method: 'POST', isArray: false},
            update: {method: 'PUT', isArray: false},
            hide: {
                method: 'PUT',
                params: {
                    'action': 'hide'
                },
                isArray: false
            },
            updateLocation: {
                method: 'PUT',
                params: {
                    'action': 'updateLocation'
                },
                isArray: false
            },
            delete: {method: 'DELETE', isArray: false},
            confirm: {
                method: 'POST',
                params: {
                    'action': 'pileConfirmation'
                }
            },
            allocate: {
                method: 'POST',
                params: {
                    'action': 'allocate'
                }
            },
            countyStatistics: {
                method: 'POST',
                params: {
                    'action': 'statistics'
                }
            }
        });
    }]);
