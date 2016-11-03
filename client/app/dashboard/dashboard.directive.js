'use strict';
angular.module('ldrWebApp').directive('adStopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            var ev = attr.targetEvent || 'click';
            element.bind(ev, function (e) {
                if (attr.adStopEvent !== 'false') {
                    e.stopPropagation();
                }
            });
        }
    };
});
