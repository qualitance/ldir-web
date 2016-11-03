angular.module('ldrWebApp').directive('bindHelpScreen', ['Help', 'LxNotificationService', '$translate',
    function (Help, LxNotificationService, $translate) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                element.bind('click', function () {
                    var items = Help.tutorial(parseInt(attr.bindHelpScreen));
                    if (!items.length) {
                        LxNotificationService.warning($translate.instant('views.help.notAvailable'));
                    }
                    else {
                        Help.display(items);
                    }
                });
            }
        };
    }]);
