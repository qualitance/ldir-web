'use strict';

angular.module('ldrWebApp')
    .service('Authority', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'authorities', {}, {
            get: {method: 'GET', isArray: false}
        });
    }]);
