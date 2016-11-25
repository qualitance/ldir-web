'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name Authority
     * @description The authorities service
     * @requires $resource
     * @requires API_URL
     */
    .service('Authority', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'authorities', {}, {
            get: {method: 'GET', isArray: false}
        });
    }]);
