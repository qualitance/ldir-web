'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc controller
     * @name AdminEditUserCtrl
     * @description admin edit user controller
     * @requires $scope
     * @requires User
     * @requires $state
     * @requires HelperService
     * @requires LxNotificationService
     * @requires Auth
     * @requires $translate
     * @requires responseHandler
     * @property {Object} currentUser - current user object
     * @property {Object} roles - user's all roles object
     * @property {Object} statuses - user's all statuses object
     * @property {Object} user - user to edit object
     * @property {Object} selectedStatus - selected status object
     * @property {Object} selectedRole - selected role object
     */
    .controller('AdminEditUserCtrl', ['$scope',
        'User',
        '$state',
        'HelperService',
        'LxNotificationService',
        'Auth',
        '$translate',
        'responseHandler',
        function ($scope, User, $state, HelperService, LxNotificationService, Auth, $translate, responseHandler) {

            Auth.getCurrentUser().$promise.then(function (data) {
                $scope.getCurrentUser = responseHandler.getData(data);
            });
            $scope.roles = HelperService.getUserRoles();
            $scope.statuses = HelperService.getUserStatuses();

            User.getUser({id: $state.params.id}).$promise.then(function (data) {
                $scope.user = responseHandler.getData(data);
                $scope.selectedStatus = {
                    value: $scope.user.status
                };
                $scope.selectedRole = {
                    value: $scope.user.role
                };

                if ($scope.user.status !== 'pending') {
                    $scope.statuses.splice(_.findIndex($scope.statuses, function (status) {
                        return status.type === 'pending';
                    }), 1);
                }
            });

            /**
             * @ngdoc
             * @name AdminEditUserCtrl#resend
             * @methodOf AdminEditUserCtrl
             * @description resends activation email to specified user
             */
            $scope.resend = function () {

                LxNotificationService.confirm($translate.instant('views.editSingleUser.resend'),
                    $translate.instant('views.editSingleUser.resendMessage') + '?', {
                        cancel: $translate.instant('views.editSingleUser.resendNo'),
                        ok: $translate.instant('views.editSingleUser.resendYes')
                    }, function (answer) {
                        if (answer) {

                            User.resendActivation({email: $scope.user.email}).$promise
                                .then(function () {
                                    LxNotificationService.success($translate.instant('views.editSingleUser.sent'));
                                });
                        }
                    });

            };

            /**
             * @ngdoc
             * @name AdminEditUserCtrl#updateUser
             * @methodOf AdminEditUserCtrl
             * @param {Object} form - user to update form object
             * @description updates specified user
             */
            $scope.updateUser = function (form) {
                $scope.submitted = true;

                if ($scope.user.county && $scope.user.county._id) {
                    $scope.user.county = $scope.user.county._id;
                }

                if (form.$valid) {
                    User.updateUser({id: $state.params.id}, $scope.user).$promise.then(function () {
                        LxNotificationService.success($translate.instant('views.editSingleUser.updatedProfile'));
                    });
                }
            };

            /**
             * @ngdoc
             * @name AdminEditUserCtrl#refreshUser
             * @methodOf AdminEditUserCtrl
             * @description
             * changes the user's status/role, depending on the entity param
             * @param {Object} item - the selected item from dropdown
             * @param {string} entity - the type of the selected item (can be 'status' or 'role')
             */
            $scope.refreshUser = function (item, entity) {
                $scope.user[entity] = item.type;
            };
        }]);
