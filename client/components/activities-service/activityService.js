'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name Activity
     * @description The activity service
     * @requires $resource
     * @requires API_URL
     */
    .service('Activity', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'activities/:action', {}, {
            query: {method: 'GET', isArray: false},
            viewed: {method: 'POST', isArray: false, params: {action: 'viewed'}}
        });
    }]);
