'use strict';

/**
 * @ngdoc controller
 * @name ActivityCtrl
 * @description notifications page controller
 * @requires $scope
 * @requires Activity
 * @requires $rootScope
 * @requires $state
 * @requires responseHandler
 * @requires PILE_IMAGE_CONFIG
 * @property {String} defaultPileImageSrc - default image path
 * @property {Boolean} busyLoading - currently loading notifications flag
 * @property {Boolean} finishedLoading - finished loading all notifications flag
 * @property {Array} activities - notifications array
 */
angular.module('ldrWebApp').controller('ActivityCtrl', [
    '$scope',
    'Activity',
    '$rootScope',
    '$state',
    'responseHandler',
    'PILE_IMAGE_CONFIG',
    function ($scope, Activity, $rootScope, $state, responseHandler, PILE_IMAGE_CONFIG) {

        $scope.defaultPileImageSrc = PILE_IMAGE_CONFIG.defaults.path;
        $scope.busyLoading = false;
        $scope.finishedLoading = false;
        $scope.activities = [];
        var currentPage = 1;
        var pageLimit = 5;

        /**
         * @ngdoc
         * @name ActivityCtrl#nextPage
         * @methodOf ActivityCtrl
         * @example
         * <pre><div infinite-scroll="nextPage()" infinite-scroll-disabled="busyLoading"></pre>
         * @description
         * gets notifications next page
         */
        $scope.nextPage = function () {

            if ($scope.busyLoading || $scope.finishedLoading) {
                return;
            }
            $scope.busyLoading = true;

            Activity.query({page: currentPage, limit: pageLimit}).$promise.then(function (data) {
                if (responseHandler.getData(data).length < pageLimit) {
                    $scope.finishedLoading = true;
                }
                $scope.activities = $scope.activities.concat(responseHandler.getData(data));
                currentPage++;
                $scope.busyLoading = false;
            });
        };

        /**
         * @ngdoc
         * @name ActivityCtrl#markAsRead
         * @methodOf ActivityCtrl
         * @param {Object} activity - activity to mark as read
         * @example
         * <pre><div infinite-scroll="nextPage()" infinite-scroll-disabled="busyLoading"></pre>
         * @description
         * marks given notification as read
         */
        $scope.markAsRead = function (activity) {
            if (!activity.viewed) {
                Activity.viewed({id: activity._id}, {}).$promise.then(function (data) {
                    if (responseHandler.getData(data)) {
                        $rootScope.$broadcast('decrementNotification');
                        activity.viewed = true;
                    }
                }, function () {
                });
            }
        };

        /**
         * @ngdoc
         * @name ActivityCtrl#visitNotification
         * @methodOf ActivityCtrl
         * @param {Object} activity - activity to mark as read
         * @example
         * <pre><tr class="data-table__clickable-row" ng-repeat="activity in activities"
         ng-click="visitNotification(activity)" ng-class="{'ldr-unread': !activity.viewed}"></pre>
         * @description
         * marks given notification as read and redirects to pile view
         */
        $scope.visitNotification = function (activity) {
            $scope.markAsRead(activity);
            $state.go('app.map.pile.view', {id: activity.pile._id});
        };
    }]);
