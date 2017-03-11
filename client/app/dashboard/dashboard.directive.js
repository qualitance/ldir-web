'use strict';
/**
 * @ngdoc directive
 * @name adStopEvent
 * @description disables propagation for click event on div
 * @example
 * <pre>div ad-stop-event></pre>
 */
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
