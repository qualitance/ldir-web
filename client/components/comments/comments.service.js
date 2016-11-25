'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name CommentsService
     * @description Get comments service
     * @requires $resource
     * @requires API_URL
     */
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
