'use strict';

angular.module('ldrWebApp')
    .controller('DashboardCtrl', [
        '$scope',
        'Pile',
        'Auth',
        'HelperService',
        'CountyService',
        '$state',
        '$translate',
        'responseHandler',
        'CityService',
        function ($scope, Pile, Auth, HelperService, CountyService, $state, $translate, responseHandler, CityService) {

            $scope.init = function () {
                var all_counties = {
                    _id: 0,
                    code: $translate.instant('views.dashboard.allPiles'),
                    name: $translate.instant('views.dashboard.allPiles'),
                    siruta: null
                };

                $scope.all_cities = {
                    _id: 0,
                    code: $translate.instant('views.dashboard.allPiles'),
                    name: $translate.instant('views.dashboard.allPiles'),
                    siruta: null
                };

                $scope.statuses = HelperService.getPileStatuses();

                if (Auth.hasRole('supervisor') || Auth.hasRole('admin')) {
                    $scope.status = 'pending';
                }

                Auth.getCurrentUser().$promise.then(function (data) {
                    $scope.user = responseHandler.getData(data);
                    $scope.county = angular.copy($scope.user.county);
                    if ($scope.county.country.name === 'Moldova') {
                        $scope.disableCitySelect = true;
                    }
                    $scope.populateCity($scope.user.county);
                });

                $scope.data = {};

                //query config object
                $scope.config_obj = {
                    page: 1,
                    skip: 15,
                    limit: 15,
                    contributions: false
                };

                $scope.getPiles();

                CountyService.getAllCounties().$promise.then(
                    function (data) {
                        $scope.counties = responseHandler.getData(data);
                        if ($scope.counties[0]._id != all_counties._id) {
                            $scope.counties.unshift(all_counties);
                        }
                    }
                );

                $scope.isAdmin = Auth.isAdmin;
                $scope.hasRole = Auth.hasRole;

                $scope.goToPile = function (obj) {
                    var url = $state.href($scope.hasRole('supervisor') ? 'app.map.pile.edit' : 'app.map.pile.view', obj);
                    window.open(url, '_blank');
                };

                // use case function to display county by user role
                $scope.displayDefaultCounty = function () {
                    if ($scope.user.role === 'admin') {
                        return $scope.counties[0];
                    }
                    else {
                        return $scope.user.county;
                    }
                };

                $scope.applySort('created_at');
            };

            /**
             * @description watch for changes on the config page that may be triggered when press on
             * the page skipper select and then get the according page data
             * @return {Undefined}
             */
            $scope.$watch('config_obj.page', function () {
                $scope.getPiles();
            });

            $scope.flexDim = $scope.hasRole('volunteer') ? 9 : 12;

            var filter = {};
            var sort = {};

            $scope.applySort = function (sort_by) {
                if (sort_by) {
                    if (sort.by === sort_by) {
                        sort.order = sort.order * (-1);
                    } else {
                        sort = {
                            by: sort_by,
                            order: 1
                        };
                    }
                    $scope.sort = sort;
                    refreshFilters();
                }
            };

            $scope.addFilter = function (filter_name, filter_value) {
                if (filter_name && filter_name !== 'city') {
                    if (filter_name === 'county') {
                        filter_value = filter_value._id;
                        if (filter_value === 0) filter_value = null;
                    }
                    filter[filter_name] = filter_value;
                    refreshFilters();
                } else {
                    $scope.applyCityFilter(filter_value);
                }
            };

            $scope.removeFilter = function (filter_name) {
                if (filter_name) {
                    filter[filter_name] = null;
                    refreshFilters();
                }
            };

            /**
             *
             * @param filter_value
             * @return {undefined}
             */
            $scope.applyCityFilter = function (filter_value) {
                if (filter_value._id === 0) {
                    delete $scope.config_obj.city_id;
                } else {
                    $scope.config_obj.city_id = filter_value._id;
                }
                refreshFilters();
            };

            $scope.displayFilterValue = function (filter_name) {
                if (filter_name === 'status') {
                    for (var i = 0; i < $scope.statuses.length; i++) {
                        if ($scope.statuses[i].type === filter['status']) return $scope.statuses[i].name;
                    }
                    return $translate.instant('helperService.allPile');
                }
                return '';
            };

            function refreshFilters() {
                $scope.config_obj.sort = sort;
                $scope.config_obj.filter = filter;
                $scope.getPiles();
            }

            // updates config object & fetches piles if required
            // fetchresults get piles and reset the page counter
            // gets property to filter by and the value, and modify the config object and do the query
            //same as adminUsers ctrl

            $scope.resetPage = function () {
                $scope.config_obj.page = 1;
            };

            $scope.getPiles = function () {
                Pile.query($scope.config_obj, function (data, headers) {
                    $scope.data.piles = responseHandler.getData(data);
                    $scope.totalNumberPiles = headers('x-total-count');
                    $scope.totalNumberPages = Math.ceil($scope.totalNumberPiles / $scope.config_obj.skip);
                });
            };

            $scope.setPage = function (page) {

                if (page > $scope.totalNumberPages || page < 0) {
                    return;
                }

                $scope.config_obj.page = page;
                $scope.getPiles();
            };

            $scope.goToContributions = function () {
                if (!$scope.config_obj.contributions) { //to not make a call if same button is pressed
                    $scope.config_obj.contributions = true;
                    $scope.getPiles();
                }
            };

            $scope.goToPiles = function () {
                if ($scope.config_obj.contributions) { //to not make a call if same button is pressed
                    $scope.config_obj.contributions = false;
                    $scope.getPiles();
                }
            };

            /**
             * @ngdoc method
             * @name DashboardCtrl#populateCity
             * @methodOf DashboardCtrl
             * @return {undefined}
             * @description
             * populate city select
             */
            $scope.populateCity = function (item) {
                CityService.getByCounty(item._id).$promise.then(function (data) {
                    $scope.cities = responseHandler.getData(data);
                    if ($scope.cities.length !== 0 && ($scope.cities[0]._id != $scope.all_cities._id)) {
                        $scope.cities.unshift($scope.all_cities);
                    }
                }, function () {
                    LxNotificationService.info($translate.instant('generic.serverError'));
                });
            };

            $scope.init();
        }]);
