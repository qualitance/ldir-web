'use strict';
/**
 * @ngdoc service
 * @service
 * @name Environment
 * @description Get environment variables
 * @requires $resource
 * @requires API_URL
 */
angular.module('ldrWebApp')
    .factory('Environment', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'environment', {},
            {query: {method: 'GET'}}
        );
    }]);
