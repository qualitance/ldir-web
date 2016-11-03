'use strict';

angular.module('ldrWebApp')
    .factory('ContactService', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'contact', {},
            {
                create: {
                    method: 'POST'
                }
            });
    }]);
