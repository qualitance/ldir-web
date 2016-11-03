'use strict';

angular.module('ldrWebApp')
    .filter('decToDms', ['$sce', function ($sce) {
        return function (input, latlng) {
            var v = input.toString().split('.');
            var pole = (latlng === 'lat' ? (parseInt(v[1]) < 0 ? 'S' : 'N') : (parseInt(v[1]) < 0) ? 'V' : 'E');

            var t = parseFloat('0.' + v[1]) * 3600;

            var o = {
                deg: v[0],
                min: Math.floor(t / 60)
            };
            o.sec = Math.round((t - (o.min * 60)) * 1000) / 1000;

            return $sce.trustAsHtml(pole + '&nbsp;' + o.deg + '&deg;&nbsp;' + o.min + '&#8242;&nbsp;' + o.sec + '&#8243;');
        };
    }]);
