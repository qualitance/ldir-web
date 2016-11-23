'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc directive
     * @name checkRequired
     * @description returns true if model value is true
     * @example
     * <pre><input type="checkbox" name="terms" ng-model="user.terms" id="checkbox1" check-required></pre>
     */
    .directive('checkRequired', [function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {
                scope.$watch(attrs.ngModel, function (newValue) {
                    ctrl.$setValidity('checkRequired', newValue === true);
                });
            }
        };
    }]);
