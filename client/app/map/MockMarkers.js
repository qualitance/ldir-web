'use strict';
angular.module('ldrWebApp')
    .factory('MockMarkers', function () {
        return {
            getPiles: function () {
                return [{
                    id: 1,
                    layer: 'Piles',
                    lat: 44.435392,
                    lng: 26.073542,
                    description: 'lorem 1',
                    draggable: false,
                    focus: false
                },
                    {
                        id: 2,
                        layer: 'Piles',
                        lat: 44.439498,
                        lng: 26.069959,
                        draggable: false,
                        description: 'lorem 2',
                        compileMessage: true,
                        focus: false
                    },
                    {
                        id: 3,
                        layer: 'Piles',
                        lat: 44.739498,
                        lng: 26.269959,
                        draggable: false,
                        description: 'lorem 3',
                        focus: false
                    },
                    {
                        id: 4,
                        layer: 'Piles',
                        lat: 44.939498,
                        lng: 27.069959
                    }];
            }
        };
    });
