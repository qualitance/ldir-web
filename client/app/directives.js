'use strict';
angular.module('ldrWebApp')
    .directive('roPhoneValidation', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.unshift(function (value) {
                    if (!attrs.required && value === '') {
                        ngModel.$setValidity('phone', true);
                        return value;
                    }
                    else {
                        var regex1 = /^([0-9\(\)\-\+\s]){5,15}$/;
                        if (regex1.test(value)) {
                            ngModel.$setValidity('phone', true);

                        }
                        else {
                            ngModel.$setValidity('phone', false);
                        }
                        return value;
                    }
                });
            }
        };
    })
    .directive('closeModalOnStateChange', function (LxDialogService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.$on('$stateChangeStart', function () {
                    if (attrs.id && element[0].style.display === 'block') {
                        LxDialogService.close(attrs.id);
                    }
                });
            }
        };
    })
    .directive('removeTooltip', function () {
        return {
            restrict: 'A',
            link: function () {
                var tooltip = angular.element(document.getElementsByClassName('tooltip'));
                tooltip.remove();
            }
        };
    });
