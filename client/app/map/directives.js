angular.module('ldrWebApp')
    .directive('markerPopup', function () {
        return {
            restrict: 'E',
            scope: true,
            templateUrl: 'app/map/templates/marker_popup.html',
            controller: ['$scope', 'PILE_IMAGE_CONFIG', function ($scope, PILE_IMAGE_CONFIG) {
                $scope.defaultPileImageSrc = PILE_IMAGE_CONFIG.defaults.path;
            }],
            link: function () {
            }
        };
    })
    .directive('markerDraggableUtil', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.startedDragging = function () {
                    element.removeClass('ldr-draggable-animate');
                };
                scope.finishedDragging = function () {
                    element.addClass('ldr-draggable-animate');
                    attrs.$set('style', 'left: 0; top: 0; position: relative');
                };
            }
        };
    })
    .directive('uploadPhoto', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_photos.html',
            link: function () {
            }
        };
    })
    .directive('pileCreation', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_details.html',
            link: function () {
            }
        };
    })
    .directive('pileComments', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_comments.html',
            link: function () {
            }
        };
    })
    .directive('pileSummary', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_summary.html',
            link: function () {
            }
        };
    })
    .directive('issueModal', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/improve/report_issue.html',
            link: function () {
            }
        };
    })
    .directive('firefoxCompatibility', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'AE',
            scope: false,
            link: function (scope, element) {
                var self = this;
                self.resolution = 0;
                scope.$on('calculate-firefox', function (event, args) {
                    self.resolution = args.utils.resolution;
                    var xpos = element.offset().left;
                    var ypos = element.offset().top - self.resolution;

                    $rootScope.$broadcast('resolved-position', {
                        data: {
                            xpos: xpos,
                            ypos: ypos
                        }
                    });
                });
            }
        };
    }]);

