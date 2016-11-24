'use strict';
/**
 * @ngdoc filter
 * @name capitalizeFirstLetter
 * @description capitalize first letter of string
 * @example
 *  <pre><span class="fs-body-2 display-block">[{{displayFilterValue('status') | capitalizeFirstLetter}}]</span></pre>
 */
angular.module('ldrWebApp').filter('capitalizeFirstLetter', function () {

    return function (input) {
        if (typeof input === 'string') {
            input = input.toLowerCase();
            return input.substring(0, 1).toUpperCase() + input.substring(1);
        } else {
            return input;
        }
    };
});
