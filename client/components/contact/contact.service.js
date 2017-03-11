'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name ContactService
     * @description create contact note service
     * @requires $resource
     * @requires API_URL
     */
    .factory('ContactService', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'contact', {},
            {
                create: {
                    method: 'POST'
                }
            });
    }]);
