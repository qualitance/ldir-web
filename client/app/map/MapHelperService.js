'use strict';
/**
 * @ngdoc service
 * @service
 * @name map helper service
 * @description The subsidy service
 * @requires deviceDetector
 */
angular.module('ldrWebApp').factory('MapHelperService', ['deviceDetector',
    function (deviceDetector) {

        var customIcon = L.Icon.extend({
            options: {
                iconSize: [40, 64],
                iconAnchor: [20, 64],
                popupAnchor: [0, -64]
            }
        });
        var icons = {
            pending: [new customIcon({iconUrl: 'assets/icons/pending_own.svg'}), new customIcon({iconUrl: 'assets/icons/pending.svg'})],
            unconfirmed: [new customIcon({iconUrl: 'assets/icons/unconfirmed_own.svg'}), new customIcon({iconUrl: 'assets/icons/unconfirmed.svg'})],
            confirmed: [new customIcon({iconUrl: 'assets/icons/confirmed_own.svg'}), new customIcon({iconUrl: 'assets/icons/confirmed.svg'})],
            reported: [new customIcon({iconUrl: 'assets/icons/reported_own.svg'}), new customIcon({iconUrl: 'assets/icons/reported.svg'})],
            clean: [new customIcon({iconUrl: 'assets/icons/clean_own.svg'}), new customIcon({iconUrl: 'assets/icons/clean.svg'})]
        };

        var detector = deviceDetector;

        return {
            /**
             * @ngdoc method
             * @name MapHelperService#getPileIcon
             * @methodOf MapHelperService
             * @example
             *  icon = MapHelperService.getPileIcon($scope.currentUserId, pile);
             * @description
             * if pile is reported by current user sets different pile icon style
             * @param {String} currentUserId - current user id
             * @param {String} pile - pile object
             * @returns {Object} icon object
             */
            getPileIcon: function (currentUserId, pile) {
                switch (pile.status) {
                    case 'confirmed':
                        return (currentUserId === pile.user) ? icons.confirmed[0] : icons.confirmed[1];
                    case 'unconfirmed':
                        return (currentUserId === pile.user) ? icons.unconfirmed[0] : icons.unconfirmed[1];
                    case 'clean':
                        return (currentUserId === pile.user) ? icons.clean[0] : icons.clean[1];
                    case 'reported':
                        return (currentUserId === pile.user) ? icons.reported[0] : icons.reported[1];
                    default:
                        return (currentUserId === pile.user) ? icons.pending[0] : icons.pending[1];
                }
            },

            getRomaniaBounds: function () {
                return {
                    southWest: {
                        lat: 43.635167,
                        lng: 20.025397
                    },
                    northEast: {
                        lat: 50.4,
                        lng: 33.264654
                    }
                };
            },

            getBrowser: function () {
                return detector.browser;
            },

            /**
             * @ngdoc method
             * @name MapHelperService#calculateMapResolution
             * @methodOf MapHelperService
             * @example
             *  resolution: MapHelperService.calculateMenuResolution()
             * @description
             * calculates map resolution depending on screen resolution and browser used
             * @returns {Object} icon object
             */
            calculateMapResolution: function () {
                var mapResolution;
                var mapContainerDesktop;

                if (this.getBrowser() === 'chrome' || this.getBrowser() === 'firefox') {
                    if (window.innerWidth > 1023) {
                        mapResolution = window.innerHeight - 150;
                    } else {
                        mapResolution = window.innerHeight - 50;
                    }
                }
                else if (this.getBrowser() === 'ie') {
                    if (window.innerWidth > 1023) {
                        mapContainerDesktop = document.querySelector('.ldr-map-container');
                        mapContainerDesktop.style.height = (window.innerHeight - 150 - 40) + 'px';
                        mapResolution = window.innerHeight - 150;
                    } else {
                        mapContainerTablet = document.querySelector('.ldr-map-container');
                        mapContainerTablet.style.height = (window.innerHeight - 50 - 40) + 'px';
                        mapResolution = window.innerHeight - 50;
                    }
                }
                return mapResolution;
            },

            calculateMenuResolution: function () {
                return window.innerHeight - this.calculateMapResolution();
            },

            createMap: function () {
                return {
                    defaults: {
                        //INSERT MAPBOX TOKEN HERE
                        tileLayer: 'https://api.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=*****',
                        maxZoom: 18,
                        minZoom: 8,
                        zoomControlPosition: 'bottomleft'
                    },
                    maxbounds: this.getRomaniaBounds(),
                    events: {
                        map: {
                            enable: ['load', 'locationfound', 'popupopen'],
                            logic: 'emit'
                        }
                    },
                    center: {},
                    layers: {
                        baselayers: {}
                    }
                };
            }
        };
    }
]);
