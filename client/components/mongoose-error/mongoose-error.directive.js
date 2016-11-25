'use strict';
angular.module('ldrWebApp')
    /**
     * @ngdoc directive
     * @name mongooseError
     * @description sets model's mongoose validity to true
     * @example
     * <pre><input type="text" name="email" ng-model="user.email" required mongoose-error email-match></pre>
     */
    .directive('mongooseError', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                element.on('keydown', function () {
                    return ngModel.$setValidity('mongoose', true);
                });
            }
        };
    });
