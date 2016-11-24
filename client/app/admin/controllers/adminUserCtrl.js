'use strict';
/**
 * @ngdoc controller
 * @name AdminUserCtrl
 * @description admin user controller
 * @requires $scope
 * @requires User
 * @requires $state
 * @requires Auth
 * @requires responseHandler
 * @property {Boolean} user - selected user object
 */
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
