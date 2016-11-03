'use strict';

angular.module('ldrWebApp')
    .factory('CommentsService', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'comments', {},
            {
                query: {
                    method: 'GET'
                },
                create: {
                    method: 'POST'
                }
            });
    }]);
