
angular.module('ldrWebApp')
/**
 * @ngdoc filter
 * @name titleCase
 * @return {String}
 * @description filter used to convert words to first upper case first letter
 */
    .filter('titleCase', function () {
        return function (str) {
            if (!str) {
                return '';
            }
            return str.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };
    })
    /**
     * @ngdoc filter
     * @name yesNo
     * @return {String}
     * @description filter used to translate true/false values in Yes/No
     */
    .filter('yesNo', function($translate) {
        return function(input) {
            return input ? $translate.instant('views.dashboard.yes') : $translate.instant('views.dashboard.no');
        };
    })
    /**
     * @ngdoc filter
     * @name emptyVal
     * @return {String}
     * @description filter used to apply " - " string for empty vals
     */
    .filter('emptyVal', function() {
        return function(input) {
            return (!input) ? '-' : input;
        };
    });
