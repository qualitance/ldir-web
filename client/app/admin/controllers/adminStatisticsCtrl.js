'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name StatisticsCtrl
     * @description admin statistics controller
     * @requires $scope
     * @requires leafletData
     * @requires $timeout
     * @requires Pile
     * @requires LxDialogService
     * @requires LxNotificationService
     * @requires LxProgressService
     * @requires $filter
     * @requires HelperService
     * @requires responseHandler
     * @property {Boolean} openInfo - open info modal flag
     * @property {Object} defaultStyle - layer style config object
     */
    .controller('StatisticsCtrl', ['$scope',
        'leafletData',
        '$timeout',
        'Pile',
        'LxDialogService',
        'LxNotificationService',
        'LxProgressService',
        '$filter',
        'HelperService',
        'responseHandler',
        function ($scope, leafletData, $timeout, Pile, LxDialogService, LxNotificationService, LxProgressService,
                  $filter, HelperService, responseHandler) {
            self.zoomLevel = null;
            self.map = null;

            $scope.openInfo = false;
            //style on hover
            $scope.defaultStyle = {
                color: '#1b914a',
                weight: 1.5,
                opacity: 0.8,
                fillOpacity: 0.2,
                fillColor: '#1b914a'
            };

            var countyLayer = window.counties.concat(window.mdcounties);
            var gjLayer = L.geoJson(countyLayer, {
                onEachFeature: onEachFeature,
                style: $scope.defaultStyle
            });

            /**
             * @ngdoc
             * @name StatisticsCtrl#calculateMapWidth
             * @methodOf StatisticsCtrl
             * @description
             * calculates map with
             */
            $scope.calculateMapWidth = function () {
                if (window.innerWidth) {
                    var leftMenuWidth = (window.innerWidth / 12) * 3;
                    var mapWidth = window.innerWidth - leftMenuWidth;
                }
                return mapWidth;
            };

            $scope.regionBounds = {
                southWest: {
                    lat: 43.634461,
                    lng: 20.020572
                },
                northEast: {
                    lat: 48.350751,
                    lng: 30.496529
                }
            };

            /**
             * @ngdoc
             * @name StatisticsCtrl#getArray
             * @methodOf StatisticsCtrl
             * @example
             <button style="margin-bottom: 10px;margin-top:10px" ng-csv="getArray(featureCounty)"
             filename="Statistics_report.csv" class="btn btn--xs btn--green btn--raised" lx-ripple
             add-bom="true">{{'views.statistics.downloadCSVReport' | translate}}</button>
             * @description
             * prepares county stats array to generate CSV from
             * @returns {Array} county - country stats array to generate CSV from
             */
            $scope.getArray = function (countyArray) {
                $scope.data = [countyArray];
                $scope.data.unshift(HelperService.headerOnCsv('County'));
                return $scope.data;
            };

            /**
             * @ngdoc
             * @name StatisticsCtrl#onMapClick
             * @methodOf StatisticsCtrl
             * @description
             * gets statistics for clicked county, sets show info flag to true
             */
            function onMapClick(e) {
                $scope.featureSiruta = leafletPip.pointInLayer([e.latlng.lng, e.latlng.lat], gjLayer, true)[0].feature.properties.SIRUTA;
                $scope.featureName = leafletPip.pointInLayer([e.latlng.lng, e.latlng.lat], gjLayer, true)[0].feature.properties.NAME;
                Pile.countyStatistics({siruta: $scope.featureSiruta}).$promise.then(function (data) {
                    $scope.featureCounty = HelperService.configObjectReport(responseHandler.getData(data), $scope.featureName, 1);
                    $scope.openInfo = true;
                });
                if ($scope.openInfo) {
                    $scope.openInfo = false;
                    $timeout(function () {
                        $scope.openInfo = true;
                    }, 300);
                }
            }

            /**
             * @ngdoc
             * @name StatisticsCtrl#highlightFeature
             * @methodOf StatisticsCtrl
             * @description
             * sets style for highlighted county
             */
            function highlightFeature(e) {
                var layer = e.target;
                layer.setStyle({
                    color: '#1b914a',
                    weight: 3,
                    opacity: 0.8,
                    fillOpacity: 0.4,
                    fillColor: '#1b914a'
                });
            }

            function resetHighlight(e) {
                gjLayer.resetStyle(e.target);
            }

            /**
             * @ngdoc
             * @name StatisticsCtrl#onEachFeature
             * @methodOf StatisticsCtrl
             * @description
             * sets options for each layer
             */
            function onEachFeature(polygon, layer) {
                layer.on({
                    click: onMapClick,
                    style: $scope.defaultStyle,
                    mouseover: highlightFeature,
                    mouseout: resetHighlight
                });
            }

            /**
             * @ngdoc
             * @name StatisticsCtrl#calculateMapStatisticsResolution
             * @methodOf StatisticsCtrl
             * @description
             * calculates statistics map height
             * @returns {Integer} statisticsMap - statistics map height
             */
            $scope.calculateMapStatisticsResolution = function () {
                if (window.innerWidth > 1023) {
                    $scope.statisticsMap = window.innerHeight - 150 - 40;
                } else {
                    $scope.statisticsMap = window.innerHeight - 50 - 40;
                }
                return $scope.statisticsMap;
            };

            /**
             * @ngdoc
             * @name StatisticsCtrl#createMap
             * @methodOf StatisticsCtrl
             * @description
             * creates leaflet map object for statistics, mapbox token is required
             */
            self.createMap = function () {
                return {
                    defaults: {
                        maxZoom: 9,
                        minZoom: 6,
                        zoomControlPosition: 'bottomright'
                    },
                    paths: {},

                    events: {
                        map: {
                            enable: ['contextmenu', 'click', 'load', 'locationfound', 'dragstart', 'dragsend', 'mouseover', 'mouseout'],
                            logic: 'emit'
                        }
                    },
                    center: {},
                    layers: {
                        baselayers: {
                            xyz: {
                                name: 'OpenStreetMap (XYZ)',
                                url: 'https://api.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=*********',
                                type: 'xyz'
                            }
                        },
                        overlays: {}
                    }
                };
            };

            /**
             * @ngdoc
             * @name StatisticsCtrl#centerMap
             * @methodOf StatisticsCtrl
             * @description
             * map is repositioned on Roumania's center
             */
            $scope.centerMap = function () {
                angular.extend($scope.map, {
                    center: {
                        zoom: 7,
                        lat: 45.834402,
                        lng: 24.996989
                    }
                });
            };

            $scope.init = function () {
                $scope.map = self.createMap();
                leafletData.getMap().then(function (map) {
                    map.addLayer(gjLayer);
                    map.locate({setView: true});
                });

                $scope.$on('leafletDirectiveMap.locationfound', function () {

                    angular.extend($scope.map, {
                        maxbounds: $scope.regionBounds
                    });
                    $scope.centerMap();
                });
            };

            $scope.init();

        }]);
