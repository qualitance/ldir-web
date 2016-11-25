angular.module('ldrWebApp')
    /**
     * @ngdoc directive
     * @name markerPopup
     * @description shows marker popup
     * @example
     * <pre><marker-popup></marker-popup></pre>
     */
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
    /**
     * @ngdoc directive
     * @name markerDraggableUtil
     * @description sets marker style while dragging
     * @example
     * <pre><div class="ldr-draggable-icon" data-drag="true" jqyoui-draggable="{animate:true, containment: 'offset',
     * onStart: 'startedDragging()', onStop:'finishedDragging()'}" marker-draggable-util
     * lx-tooltip="{{'views.map.dragToLocation' | translate}}" tooltip-position="left"></pre>
     */
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
    /**
     * @ngdoc directive
     * @name uploadPhoto
     * @description upload photo step in create pile dialog
     * @example
     * <pre><div ng-if="currentStep===0" upload-photo></div></pre>
     */
    .directive('uploadPhoto', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_photos.html',
            link: function () {
            }
        };
    })
    /**
     * @ngdoc directive
     * @name pileCreation
     * @description add pile details step in create pile dialog
     * @example
     * <pre><div ng-if="currentStep===1" pile-creation></div></pre>
     */
    .directive('pileCreation', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_details.html',
            link: function () {
            }
        };
    })
    /**
     * @ngdoc directive
     * @name pileComments
     * @description add pile comments step in create pile dialog
     * @example
     * <pre><div ng-if="currentStep===2" pile-comments></div></pre>
     */
    .directive('pileComments', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_comments.html',
            link: function () {
            }
        };
    })
    /**
     * @ngdoc directive
     * @name pileSummary
     * @description pile summary step in create pile dialog
     * @example
     * <pre><div ng-if="currentStep===3" pile-summary></div></pre>
     */
    .directive('pileSummary', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/map/templates/add_pile_summary.html',
            link: function () {
            }
        };
    })
    /**
     * @ngdoc directive
     * @name issueModal
     * @description report issue dialog
     * @example
     * <pre><issue-modal></issue-modal></pre>
     */
    .directive('issueModal', function () {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'app/improve/report_issue.html',
            link: function () {
            }
        };
    })
    /**
     * @ngdoc directive
     * @name firefoxCompatibility
     * @description listens to 'calculate-firefox' event, calculates drop location for firefox and broadcast 'resolved-position' event when done
     * @example
     * <pre><leaflet class="map" ng-if="map" defaults="map.defaults" center="map.center" markers="map.markers"
     * layers="map.layers" maxbounds="map.maxbounds" width="100%" data-drop="true"
     * jqyoui-droppable="{onDrop : 'dropLocation($event)',containment:'offset', multiple: true }" firefox-compatibility></pre>
     */
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

