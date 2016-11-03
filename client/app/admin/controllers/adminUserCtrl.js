'use strict';

angular.module('ldrWebApp')
    .controller('AdminUserCtrl', ['$scope',
        'User',
        '$state',
        'Auth',
        'responseHandler',
        function ($scope, User, $state, Auth, responseHandler) {
            $scope.hasRole = Auth.hasRole;
            User.getUser({id: $state.params.id}).$promise.then(function (data) {
                $scope.user = responseHandler.getData(data);
            });
        }]);
