'use strict';

angular.module('ldrWebApp')
    .factory('County', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'counties/:id',
            {id: '@_id'},
            {
                query: {
                    method: 'GET',
                    isArray: false
                }
            }
        );
    }])

    .factory('CountyService', ['County',
        function (County) {
            return {
                getCounties: function (params) {
                    return County.query({country: params.id});
                },
                getAllCounties: function () {
                    return County.query();
                }
            };
        }
    ])
;
