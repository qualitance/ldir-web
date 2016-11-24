'use strict';
/**
 * @ngdoc controller
 * @name ViewPileCtrl
 * @description view pile controller
 * @requires $scope
 * @requires $rootScope
 * @requires $filter
 * @requires leafletData
 * @requires Pile
 * @requires $q
 * @requires Auth
 * @requires ImageUpload
 * @requires LxNotificationService
 * @requires MapHelperService
 * @requires $translate
 * @requires responseHandler
 * @property {Function} hasRole - authentication function that checks if user has specified role
 * @property {Object} center - pile object
 * @property {Boolean} savableScreenshot - screenshot can be saved depending on pile status
 * @property {Boolean} savingScreenshot - saving screenshot in progress
 * @property {Object} defaults - map options
 * @property {Object} regionBounds - map bounds
 * @property {Integer} marker - pile marker, icon color depending on status
 * @property {Integer} markerOpts - marker options
 */
angular.module('ldrWebApp').controller('ViewPileOnMapCtrl', ['$scope', '$rootScope', '$filter', 'leafletData', 'Pile',
    '$q', 'Auth', 'ImageUpload', 'LxNotificationService', 'MapHelperService', '$translate', 'responseHandler',
    function ($scope, $rootScope, $filter, leafletData, Pile,
              $q, Auth, ImageUpload, LxNotificationService, MapHelperService, $translate, responseHandler) {

        var parent = $scope.$parent.$parent;

        $scope.hasRole = Auth.hasRole;

        $scope.center = parent.pile.location;
        $scope.savableScreenshot = (parent.pile.status === 'confirmed') || (parent.pile.status === 'reported');
        $scope.savingScreenshot = true;
        $scope.defaults = {
            //INSERT MAPBOX TOKEN HERE
            tileLayer: 'https://api.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=******',
            minZoom: 8
        };
        $scope.regionBounds = MapHelperService.getRomaniaBounds();
        angular.extend($scope.center, {zoom: 18});

        var marker = {
            focus: true,
            icon: {
                iconUrl: 'assets/icons/pins-05.svg',
                iconSize: [40, 64],
                iconAnchor: [20, 64],
                popupAnchor: [0, -64]
            },
            label: {
                message: $filter('decToDms')(parent.pile.location.lat, 'lat') + '<br>' +
                $filter('decToDms')(parent.pile.location.lng, 'lng'),
                options: {
                    noHide: true
                }
            }
        };

        var markerOpts = {
            name: 'Pile',
            draggable: true,
            icon: L.icon({
                iconUrl: 'assets/icons/pins-05.svg',
                iconSize: [40, 64],
                iconAnchor: [20, 64]
            }),
            title: $translate.instant('views.editViewPile.dragNewLocation')
        };

        switch (parent.pile.status) {
            case 'confirmed':
                marker.icon.iconUrl = 'assets/icons/pins-06.svg';
                markerOpts.icon = new L.icon({
                    iconUrl: 'assets/icons/pins-06.svg',
                    iconSize: [40, 64],
                    iconAnchor: [20, 64]
                });
                break;
            case 'unconfirmed':
                marker.icon.iconUrl = 'assets/icons/pins-01.svg';
                markerOpts.icon = new L.icon({
                    iconUrl: 'assets/icons/pins-01.svg',
                    iconSize: [40, 64],
                    iconAnchor: [20, 64]
                });
                break;
            case 'clean':
                marker.icon.iconUrl = 'assets/icons/pins-04.svg';
                markerOpts.icon = new L.icon({
                    iconUrl: 'assets/icons/pins-04.svg',
                    iconSize: [40, 64],
                    iconAnchor: [20, 64]
                });
                break;
            case 'reported':
                marker.icon.iconUrl = 'assets/icons/pins-03.svg';
                markerOpts.icon = new L.icon({
                    iconUrl: 'assets/icons/pins-03.svg',
                    iconSize: [40, 64],
                    iconAnchor: [20, 64]
                });
                break;
        }

        $scope.markers = {
            pile: marker
        };

        angular.extend($scope.markers.pile, parent.pile.location);

        if (parent.showEditableMarker) {
            leafletData.getMap().then(function (map) {
                $scope.editableMarker = new L.marker(parent.pile.location, markerOpts).setZIndexOffset(999999999).addTo(map);
            });
        }
        /**
         * @ngdoc
         * @name ViewPileOnMapCtrl#$watch
         * @methodOf ViewPileOnMapCtrl
         * @description saves location on marker move
         */
        $scope.$watch('editableMarker._latlng', function () {
            if ($scope.editableMarker) {
                $scope.location = $scope.editableMarker.getLatLng();
            }
        });

        /**
         * @ngdoc
         * @name ViewPileOnMapCtrl#saveLocation
         * @methodOf ViewPileOnMapCtrl
         * @description updates pile and parent pile object with new location
         */
        $scope.saveLocation = function () {
            var myPile = angular.copy(parent.pile);
            myPile.location = $scope.editableMarker.getLatLng();
            Pile.updateLocation({id: parent.pile._id}, myPile).$promise.then(function (data) {
                $rootScope.truePileLocation = responseHandler.getData(data).location;
                LxNotificationService.success($translate.instant('views.editViewPile.locationSuccesSave'));
            });
        };

        /**
         * @ngdoc
         * @name ViewPileOnMapCtrl#takeScreenshot
         * @methodOf ViewPileOnMapCtrl
         * @description takes map screenshot
         */
        $scope.takeScreenshot = function () {
            $scope.savingScreenshot = false;
            leafletData.getMap().then(function (map) {
                leafletImage(map, $scope.makeImage);
            });
        };

        /**
         * @ngdoc
         * @name ViewPileOnMapCtrl#makeImage
         * @methodOf ViewPileOnMapCtrl
         * @description draws canvas with shown map, converts it to image, uploads image and updates parent images object
         */
        $scope.makeImage = function (err, canvas) {
            function getDataURL() {
                var deferred = $q.defer();
                $scope.width = canvas.width;
                $scope.height = canvas.height;
                deferred.resolve($scope.mapScreenshot = canvas.toDataURL('image/jpeg'));
                return deferred.promise;
            }

            var promise = getDataURL();
            promise.then(function () {
                ImageUpload.uploadScreenshot($scope.mapScreenshot, $scope.width, $scope.height, 'pile', parent.pile._id).then(function (data) {
                    if (parent.allImages[parent.allImages.length - 1].is_screenshot) {
                        parent.allImages[parent.allImages.length - 1] = data;
                    }
                    else {
                        parent.allImages.push(data);
                        parent.minSize = 2;
                        parent.maxSize = 4;
                    }
                    LxNotificationService.success($translate.instant('views.editViewPile.screenshotSuccess'));
                    $scope.savingScreenshot = true;
                }, function error() {
                    LxNotificationService.error($translate.instant('views.editViewPile.errorUpload'));
                    $scope.savingScreenshot = true;
                });
            });
        };
    }]);
