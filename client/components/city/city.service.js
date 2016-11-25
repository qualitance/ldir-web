'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name City
     * @description Get cities service
     * @requires $resource
     * @requires API_URL
     */
    .factory('City', function ($resource,API_URL) {
        return $resource(API_URL + 'cities/:id/:county/:countyId',
            {
                id: '@_id',
            },
            {
                query: {
                    method: 'GET',
                    isArray: false
                },
                queryByCounty: {
                    method: 'GET',
                    isArray: false,
                    params:{
                        id:'all',
                        county: 'county',
                        countyId: '@countyId'
                    }
                },
            }
        );
    })

    .factory('CityService', ['City',
        function (City) {
            return {
                getCity: function (params) {
                    return City.query({city: params.id})
                },
                getAll: function () {
                    return City.query()
                },
                getByCounty : function(countyId){
                    return City.queryByCounty({countyId: countyId});
                }
            }
        }
    ])
;
