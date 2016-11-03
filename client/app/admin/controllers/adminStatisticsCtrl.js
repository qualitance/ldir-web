'use strict';

angular.module('ldrWebApp')
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

            $scope.getArray = function (countyArray) {
                $scope.data = [countyArray];
                $scope.data.unshift(HelperService.headerOnCsv('County'));
                return $scope.data;
            };

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

            function onEachFeature(polygon, layer) {
                layer.on({
                    click: onMapClick,
                    style: $scope.defaultStyle,
                    mouseover: highlightFeature,
                    mouseout: resetHighlight
                });
            }

            $scope.calculateMapStatisticsResolution = function () {
                if (window.innerWidth > 1023) {
                    $scope.statisticsMap = window.innerHeight - 150 - 40;
                } else {
                    $scope.statisticsMap = window.innerHeight - 50 - 40;
                }
                return $scope.statisticsMap;
            };

            //CREATE leaflet map for statistics

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
                                url: 'https://api.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicXVhbGl0YW5jZSIsImEiOiJkYTY0ODQzMGM1MDFlOGVhM2FiZjc3M2ZkYmQ2MjA0NSJ9.3bxLXwcDaG_V0H3reJzLBg',
                                type: 'xyz'
                            }
                        },
                        overlays: {}
                    }
                };
            };

            $scope.centerMap = function () {
                angular.extend($scope.map, {
                    center: {
                        zoom: 7,
                        lat: 45.834402, //middle of romania
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
