'use strict';
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
