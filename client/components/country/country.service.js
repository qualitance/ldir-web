(function (module) {
    'use strict';
    /**
     * @ngdoc service
     * @service
     * @name CountryService
     * @description Get countries service
     * @requires $resource
     * @requires API_URL
     */
    module.factory('CountryService', CountryService);
    CountryService.$inject = ['$resource', 'API_URL'];
    function CountryService($resource, API_URL) {
        var countryResource = $resource(API_URL + 'countries/:id', {
            id: '@_id'
        });

        return {
            getCountries: function () {
                return countryResource.query().$promise;
            }
        };
    }
})(angular.module('ldrWebApp'));
