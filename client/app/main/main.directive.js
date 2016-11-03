'use strict';

angular.module('ldrWebApp')
    .directive('emailMatch', [function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {
                scope.$watch(attrs.ngModel, function (value) {
                    var regex = /^[\w-+]+(\.[\w-+]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/i;
                    ctrl.$setValidity('invalidEmail', (regex.exec(value) !== null));
                });
            }
        };
    }])
    .directive('ldrOnePage', [function () {
        return {
            restrict: 'A',
            link: function (scope) {

                $('.ldr-main').onepage_scroll({
                    sectionContainer: 'section',
                    easing: 'ease',
                    animationTime: 1000,
                    pagination: false,
                    updateURL: false,
                    beforeMove: function () {
                    },
                    afterMove: function () {
                    },
                    loop: false,
                    keyboard: true,
                    responsiveFallback: false,
                    responsiveHeightFallback: false,
                    disableMouseMove: false

                });

                scope.$on('$destroy', function () {
                    $('.ldr-main').destroy_onepage_scroll({
                        sectionContainer: 'section'
                    });
                });

            }
        };
    }]);
