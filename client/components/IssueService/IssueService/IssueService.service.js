'use strict';

angular.module('ldrWebApp')
    .service('Issues', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'improves', {}, {
            query: {method: 'GET', isArray: false},
            create: {method: 'POST', isArray: false},
            update: {method: 'PUT', isArray: false},
            delete: {method: 'DELETE', isArray: false}
        });
    }]);
