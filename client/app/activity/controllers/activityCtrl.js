'use strict';

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
        $scope.visitNotification = function (activity) {
            $scope.markAsRead(activity);
            $state.go('app.map.pile.view', {id: activity.pile._id});
        };
    }]);
