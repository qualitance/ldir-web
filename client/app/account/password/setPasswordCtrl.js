'use strict';

angular.module('ldrWebApp')
    .controller('SetPasswordCtrl', ['$scope',
        '$stateParams',
        'User',
        '$state',
        '$location',
        function ($scope, $stateParams, User, $state, $location) {
            User.getUncompletedUser({token: $stateParams.token}).$promise.then(
                function success(user) {
                    $scope.user = user;
                },
                function error() {
                    $location.path('/');
                }
            );

            $scope.setPassword = function () {
                User.setPassword({
                    token: $stateParams.token,
                    password: $scope.user.password1
                }).$promise.then(function success() {
                    $state.go('login', {});
                });
            };
        }]);
