'use strict';

angular.module('ldrWebApp')
    .factory('Environment', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'environment', {},
            {query: {method: 'GET'}}
        );
    }]);
