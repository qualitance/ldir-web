'use strict';
angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name CreatePileCtrl
     * @description create pile view controller
     * @requires $scope
     * @requires leafletData
     * @requires $rootScope
     * @requires Pile
     * @requires HelperService
     * @requires $timeout
     * @requires LxNotificationService
     * @requires LxDialogService
     * @requires Auth
     * @requires deviceDetector
     * @requires Help
     * @requires $compile
     * @requires LxProgressService
     * @requires MapHelperService
     * @requires $translate
     * @requires responseHandler
     * @property {Object} options - map options object
     * @property {Function} hasRole - authentication function that checks if user has specified role
     * @property {Object} regionBounds - map bounds
     * @property {Boolean} markersLoading - markers loading flags
     * @property {Object} map - map object
     * @property {Object} userMarker - user marker object
     */
    .controller('MapCtrl', [
        '$scope',
        'leafletData',
        '$rootScope',
        'Pile',
        'HelperService',
        '$timeout',
        'LxNotificationService',
        'LxDialogService',
        'Auth',
        'deviceDetector',
        'Help',
        '$compile',
        'LxProgressService',
        'MapHelperService',
        '$translate',
        'responseHandler',
        function ($scope, leafletData, $rootScope, Pile, HelperService, $timeout, LxNotificationService,
                  LxDialogService, Auth, deviceDetector, Help, $compile, LxProgressService, MapHelperService,
                  $translate, responseHandler) {

            Auth.getCurrentUser().$promise.then(function (data) {
                $scope.currentUserId = responseHandler.getData(data)._id;
            });

            var self = this;
            self.options = {
                zoomLevel: null,
                map: null,
                pointOnMap: null,
                mozilla: {
                    xpos: 0,
                    ypos: 0
                },
                userMarker: null
            };

            var popup = L.popup({offset: L.point(0, -60, false)});

            var cityLayer = window.cities;
            var gjLayer = L.geoJson(cityLayer);
            var moldLayer = window.mdcounties;
            var mdLayer = L.geoJson(moldLayer);

            /**
             * @ngdoc
             * @name MapCtrl#locateUser
             * @methodOf MapCtrl
             * @param {Object} args - object containing location to dra marker
             * @param {Object} map - map object
             * @description draws or sets user marker on specified location
             */
            self.locateUser = function (args, map) {

                var userMarker;
                self.options.userLocation = args.leafletEvent.latlng;

                var markerOpts = {
                    name: 'Me',
                    draggable: true,
                    icon: L.icon({
                        iconUrl: 'assets/icons/pins-07.svg',
                        iconSize: [40, 64],
                        iconAnchor: [20, 64]
                    })
                };

                if (!self.options.userMarker) {
                    userMarker = L.marker([self.options.userLocation.lat, self.options.userLocation.lng], markerOpts);
                    angular.extend(map.layers.baselayers, {
                        Me: {
                            name: 'Me',
                            type: 'xyz',
                            visible: true,
                            //INSERT MAPBOX TOKEN HERE
                            url: 'https://api.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=********',
                            'layerOptions': {
                                continuousWorld: true,
                                subdomains: ['a', 'b', 'c']
                            }
                        }
                    });

                    userMarker.setZIndexOffset(9999999);
                    userMarker.addTo(self.options.map);
                    userMarker.on('dragend', function (event) {
                        $rootScope.location = event.target._latlng;
                    });
                    self.options.userMarker = userMarker;
                } else {
                    self.options.userMarker.setLatLng(args.leafletEvent.latlng);
                }

                return self.options.userMarker;
            };

            DEBUGGING.markerTo = function () {
                var arg1 = arguments[0];
                var arg2 = arguments[1];
                var location;
                if (arg1 && arg2) {
                    location = {
                        lat: arg1,
                        lng: arg2
                    };
                } else if (arg1) {
                    location = arg1;
                } else {
                    return console.log('Invalid arguments');
                }
                $scope.userMarker.setLatLng([location.lat, location.lng]);
            };

            $scope.init = function () {
                $scope.hasRole = Auth.hasRole;
                $scope.regionBounds = MapHelperService.getRomaniaBounds();
                $scope.markersLoading = false;

                function updateProgress(processed, total, elapsed) {
                    if (elapsed > 1000) {
                        $scope.markersLoading = true;
                    }
                    if (processed === total) {
                        $scope.markersLoading = false;
                    }
                }

                $scope.map = MapHelperService.createMap();
                leafletData.getMap().then(function (map) {
                    self.options.zoomLevel = map.getZoom();
                    self.options.map = map;
                    map.locate({setView: true});
                    $scope.userMarker = self.locateUser({
                        leafletEvent: {
                            latlng: {
                                lat: 45.954968795113395,
                                lng: 24.98291015625
                            }
                        }
                    }, $scope.map);
                });

                $scope.$on('leafletDirectiveMap.locationfound', function (event, args) {
                    $scope.userMarker = self.locateUser(args, $scope.map);
                    $rootScope.location = self.options.userLocation;

                });

                /**
                 * @ngdoc
                 * @name MapCtrl#locateUser
                 * @methodOf MapCtrl
                 * @param {Object} map - map object
                 * @param {Object} cluster - cluster to add layer with drawn marker to
                 * @param {Object} pile - pile object
                 * @description draws pile on map, gets pile details on marker click event
                 */
                var addPileOnMap = function (map, cluster, pile) {
                    var icon, marker;
                    icon = MapHelperService.getPileIcon($scope.currentUserId, pile);
                    marker = new L.marker([pile.location.lat, pile.location.lng], {
                        icon: icon,
                        id: pile._id
                    });
                    marker.on('click', function (e) {
                        map.closePopup(popup);
                        var id = e.target.options.id;
                        popup.setLatLng(e.latlng);
                        Pile.query({id: id}).$promise.then(function (data) {
                            var $newScope = $scope.$new();
                            $newScope.marker = responseHandler.getData(data);
                            var content = $compile('<marker-popup></marker-popup>')($newScope);
                            var coordInPixels = map.latLngToContainerPoint(e.latlng);
                            coordInPixels.y = coordInPixels.y - 150;
                            var newCoord = map.containerPointToLatLng(coordInPixels);
                            map.setView(newCoord);
                            popup.setContent(angular.element(content)[0]);
                            popup.openOn(map);
                        });

                    });

                    cluster.addLayer(marker);
                };

                Pile.queryMap().$promise.then(function (resp) {
                        if (responseHandler.getData(resp)) {
                            leafletData.getMap().then(function (map) {
                                var cluster = L.markerClusterGroup({
                                    chunkedLoading: true,
                                    showCoverageOnHover: false,
                                    chunkProgress: updateProgress
                                });
                                $scope.$on('pileCreated', function (event, createdPile) {
                                    addPileOnMap(self.options.map, cluster, createdPile);
                                });
                                for (var i in responseHandler.getData(resp)) {
                                    addPileOnMap(map, cluster, responseHandler.getData(resp)[i]);
                                }
                                map.addLayer(cluster);
                            });

                        } else {
                            LxNotificationService.error($translate.instant('generic.errorSaving'));
                        }
                    },
                    function error() {
                        LxNotificationService.error($translate.instant('generic.errorSaving'));
                    });

                $scope.$on('closeModal', function () {
                    $timeout(function () {
                        $scope.showModal = false;
                    }, 1000);
                });

                $scope.$on('resolved-position', function (event, args) {
                    self.options.mozilla.xpos = args.data.xpos;
                    self.options.mozilla.ypos = args.data.ypos + 100;
                });

                /**
                 * @ngdoc
                 * @name MapCtrl#dropLocation
                 * @methodOf MapCtrl
                 * @param {Object} event - event object
                 * @description get location of dropped object depending on browser
                 */
                $scope.dropLocation = function (event) {
                    if (MapHelperService.getBrowser() === 'chrome' || MapHelperService.getBrowser() === 'ie') {
                        self.options.pointOnMap = self.options.map.containerPointToLatLng([event.clientX -
                        event.offsetX + 18, event.clientY - event.offsetY - MapHelperService.calculateMenuResolution() +
                        44]);

                        $scope.userMarker.setLatLng(self.options.pointOnMap);
                        $rootScope.location = self.options.pointOnMap;
                    }
                    else if (MapHelperService.getBrowser() === 'firefox') {
                        $rootScope.$broadcast('calculate-firefox', {
                            utils: {
                                resolution: MapHelperService.calculateMenuResolution()
                            }
                        });
                        self.options.pointOnMap = self.options.map.containerPointToLatLng([event.clientX -
                        self.options.mozilla.xpos, event.clientY - self.options.mozilla.ypos]);
                        $scope.userMarker.setLatLng(self.options.pointOnMap);
                        $rootScope.location = self.options.pointOnMap;
                    }
                };

            };

            /**
             * @ngdoc
             * @name MapCtrl#locateUser
             * @methodOf MapCtrl
             * @description sets user marker on specified location
             */
            $scope.locateUser = function () {
                angular.extend($scope.map, {
                    center: {
                        zoom: 18,
                        lat: self.options.userLocation.lat,
                        lng: self.options.userLocation.lng
                    }
                });
                $scope.userMarker.setLatLng([self.options.userLocation.lat, self.options.userLocation.lng]);
                LxNotificationService.success($translate.instant('views.map.located'));
            };

            /**
             * @ngdoc
             * @name MapCtrl#openModal
             * @methodOf MapCtrl
             * @param {String} dialogId - dialog id
             * @description opens help modal and updates user with viewed help presentation flag
             */
            $scope.openModal = function (dialogId) {
                if (!Auth.hasSeenWizard() && Auth.hasRole('volunteer')) {
                    var items = Help.tutorial(0);
                    Auth.getCurrentUser().$promise.then(function success(data) {
                        Help.display(items, function () {
                            var user = angular.copy(data);
                            angular.extend(user, responseHandler.getData(data));
                            user.flags.viewedPresentations.web = true;
                            var promise = user.$save();
                            promise.then(function (user) {
                                angular.extend(user, responseHandler.getData(user));
                                angular.extend(Auth.getCurrentUser(), user);
                            });
                        });
                    });
                    return;
                }

                if (typeof leafletPip.pointInLayer([$rootScope.location.lng, $rootScope.location.lat], gjLayer, true)[0] === 'undefined' &&
                    typeof leafletPip.pointInLayer([$rootScope.location.lng, $rootScope.location.lat], mdLayer, true)[0] === 'undefined'
                ) {
                    LxNotificationService.error($translate.instant('generic.outJurisdiction'));
                } else {
                    $scope.currentStep = 0;
                    $scope.showModal = true;
                    $timeout(function () {
                        LxDialogService.open(dialogId);
                        angular.element('.dialog-filter').unbind('click');
                    });
                }
            };

            $scope.init();

        }
    ]);
