'use strict';

angular.module('ldrWebApp')
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
