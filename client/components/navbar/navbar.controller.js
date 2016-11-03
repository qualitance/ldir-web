'use strict';

angular.module('ldrWebApp')
    .controller('NavbarCtrl', ['$scope', '$location', 'Auth', 'User', 'LxDialogService', 'LxNotificationService',
        '$rootScope', '$translate', 'responseHandler',
        function ($scope, $location, Auth, User, LxDialogService, LxNotificationService,
                  $rootScope, $translate, responseHandler) {

            $scope.$on('$stateChangeStart', function () {
                $scope.navbarExpanded = false;
            });

            $rootScope.$on('updateMenuPic', function (event, image) {
                $scope.getCurrentUser.image = image;
            });

            $scope.menu = [
                {
                    'title': 'Home',
                    'link': '/'
                },
                {
                    'title': 'Map',
                    'link': '/map'
                }
            ];

            function refreshStats() {
                User.stats().$promise.then(function success(stats) {
                    if (responseHandler.getData(stats)) {
                        $scope.notificationNumber = responseHandler.getData(stats).unreadNotifications;
                    }
                    $scope.statistics = responseHandler.getData(stats).piles;
                });
            }

            refreshStats();

            $scope.$on('decrementNotification', function () {
                $scope.notificationNumber--;
            });

            $scope.isCollapsed = true;
            $scope.isLoggedIn = Auth.isLoggedIn;
            $scope.isAdmin = Auth.isAdmin;
            Auth.getCurrentUser().$promise.then(function (data) {
                $scope.getCurrentUser = responseHandler.getData(data);
            });
            $scope.hasRole = Auth.hasRole;

            $scope.logout = function () {
                Auth.logout();
                $location.path('/login');
            };

            $scope.isActive = function (route) {
                return route === $location.path();
            };

            $scope.openDialog = function (dialogId) {
                LxDialogService.open(dialogId);
                angular.element('.dialog-filter').unbind('click');

            };

            $scope.closeModal = function (dialogId) {
                LxDialogService.close(dialogId);
                LxNotificationService.info($translate.instant('views.navbar.cancelReport'));
            };

        }]);
