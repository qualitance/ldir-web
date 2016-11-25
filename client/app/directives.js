'use strict';
angular.module('ldrWebApp')
    /**
     * @ngdoc directive
     * @name roPhoneValidation
     * @description phone number validation for Roumania
     * @example
     * <pre><input type="text" name="phone" ro-phone-validation ng-model="user.phone" class="" required maxlength="15"></pre>
     */
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
    /**
     * @ngdoc directive
     * @name closeModalOnStateChange
     * @description closes modal on state change
     * @example
     * <pre><lx-dialog class="dialog dialog--l ldr-create-pile-modal" auto-close="false" id="viewPileDialog"
     * onclose="closingMapDialog('viewPileDialog')" close-modal-on-state-change></pre>
     */
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
    /**
     * @ngdoc directive
     * @name removeTooltip
     * @description remove tooltip from element
     * @example
     * <pre><div class="ldr-main" ldr-one-page remove-tooltip></pre>
     */
    .directive('removeTooltip', function () {
        return {
            restrict: 'A',
            link: function () {
                var tooltip = angular.element(document.getElementsByClassName('tooltip'));
                tooltip.remove();
            }
        };
    });
