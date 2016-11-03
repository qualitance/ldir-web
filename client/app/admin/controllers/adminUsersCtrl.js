'use strict';

angular.module('ldrWebApp')
    .controller('AdminUsersCtrl', [
        '$scope',
        'User',
        'CountyService',
        'CountryService',
        'LxDialogService',
        'LxNotificationService',
        'HelperService',
        'Auth',
        '$state',
        '$translate',
        'responseHandler',
        function ($scope, User, CountyService, CountryService, LxDialogService, LxNotificationService, HelperService,
                  Auth, $state, $translate, responseHandler) {

            // Use the User $resource to fetch all users
            $scope.init = function () {
                Auth.getCurrentUser().$promise.then(function (data) {
                    $scope.currentUser = responseHandler.getData(data);
                });
                $scope.supervisor = {};
                $scope.data = {};
                $scope.disableBtn = true;
                $scope.user = {};

                //all counties object for dropdown
                $scope.all_counties = {
                    _id: 0,
                    code: 'All',
                    name: $translate.instant('generic.all'),
                    siruta: null
                };

                $scope.all_countries = {
                    _id: 0,
                    code: 'All',
                    name: $translate.instant('generic.all'),
                    siruta: null
                };

                $scope.state = $state;

                $scope.allUserRoles = {
                    _id: 0,
                    name: $translate.instant('generic.all'),
                    value: 'All'
                };

                //config object for filtering query
                $scope.config_obj = {
                    page: 1,
                    skip: 10,
                    limit: 10,
                    sort_by: 'first_name',
                    sort_order: -1,
                    filter_query: $scope.role
                };

                $scope.getUsers();
                CountryService.getCountries().then(function (data) {
                    $scope.countries = data;
                    if ($scope.countries[0]._id !== $scope.all_countries._id) {
                        $scope.countries.unshift($scope.all_countries);
                    }

                });
                CountyService.getAllCounties().$promise.then(
                    function (data) {
                        $scope.counties = responseHandler.getData(data);
                        if ($scope.counties[0]._id !== $scope.all_counties._id)
                            $scope.counties.unshift($scope.all_counties);
                    }
                );

                //get counties and add All option on array as first option
                CountyService.getAllCounties().$promise.then(
                    function (data) {
                        $scope.counties = responseHandler.getData(data);
                        if ($scope.counties[0]._id !== $scope.all_counties._id) {
                            $scope.counties.unshift($scope.all_counties);
                        }
                    }
                );
                $scope.roles = HelperService.getUserRoles();
                $scope.roles.unshift($scope.allUserRoles);
            };

            /**
             * @description watch for changes on the config page that may be triggered when press on
             * the page skipper select and then get the according page data
             * @return {Undefined}
             */
            $scope.$watch('config_obj.page', function () {
                $scope.getUsers();
            });

            //get users and pagination info
            $scope.getUsers = function () {
                User.all($scope.config_obj, function (data, headers) {
                    $scope.data.users = responseHandler.getData(data);
                    $scope.totalNumberUsers = headers('x-total-count');
                    $scope.totalNumberPages = Math.ceil($scope.totalNumberUsers / $scope.config_obj.skip);
                });
            };

            //function to reset filters
            $scope.resetFilter = function (property, fetchResults) {
                $scope.config_obj[property] = null;
                if (fetchResults)
                    $scope.filter(null, null, true);
            };

            // updates config object & fetches piles if required
            // fetchresults get users and reset the page counter
            // gets property to filter by and the value, and modify the config object and do the query
            $scope.filter = function (property, value, fetchResults) {
                if (property) {
                    $scope.config_obj[property] = (value) ? value :
                        (typeof($scope.config_obj[property]) === 'number') ? $scope.config_obj[property] = $scope.config_obj[property] * -1 :
                            $scope.config_obj[property] = !$scope.config_obj[property];
                }

                if (value === null) {
                    $scope.config_obj[property] = '';
                }

                if (fetchResults) {
                    $scope.resetPage();
                    $scope.getUsers();
                }
            };

            /**
             * Enable/disable filter and reset filter buttons
             * @name enableFilterBtn
             * @return {undefined}
             */
            $scope.enableFilterBtn = function () {
                $scope.clearFilterEmptyVals();
                if ($scope.user !== undefined && angular.equals({}, $scope.user) === false) {
                    $scope.disableBtn = false;
                } else {
                    $scope.disableBtn = true;
                    $scope.resetUserFilters();
                }

            };

            /**
             * Clear the filters with empty values
             * @name clearFilterEmptyVals
             * @return {undefined}
             */
            $scope.clearFilterEmptyVals = function () {
                angular.forEach($scope.user, function (value, key) {
                    if (value === '') {
                        delete $scope.user[key];
                        $scope.resetFilter('filter_by_' + key, false);
                    }
                });
            };

            /**
             * generate filters from the user selections
             * @name filterUsers
             * @return {undefined}
             */
            $scope.filterUsers = function () {
                var index = 0;
                angular.forEach($scope.user, function (value, key) {
                    index++;
                    if (value.hasOwnProperty('_id')) {
                        $scope.filter('filter_by_' + key, $scope.setSelectAllFilterValue(value._id), $scope.setFetchResults(index));
                    } else if (value.hasOwnProperty('type')) {
                        $scope.filter('filter_by_' + key, value.type, $scope.setFetchResults(index));
                    } else {
                        $scope.filter('filter_by_' + key, $scope.setSelectAllFilterValue(value), $scope.setFetchResults(index));
                    }
                });
            };

            /**
             *
             * @name setFetchResults
             * @param index
             * @returns {boolean}
             */
            $scope.setFetchResults = function (index) {
                return (Object.keys($scope.user).length === index);
            };

            /**
             *
             */
            $scope.resetUserFilters = function () {
                $scope.disableBtn = true;
                angular.forEach($scope.user, function (value, key) {
                    $scope.resetFilter('filter_by_' + key, false);
                    $scope.user[key] = '';
                });
                $scope.filter(null, null, true);
            };

            $scope.setSelectAllFilterValue = function (value) {
                if (value && value !== 0) {
                    return value;
                } else {
                    return null;
                }
            };

            //reset page on pagination
            $scope.resetPage = function () {
                $scope.config_obj.page = 1;
            };

            $scope.setPage = function (page) {

                if (page > $scope.totalNumberPages || page < 0) {
                    return;
                }

                $scope.config_obj.page = page;
                $scope.getUsers();
            };

            /*
             Modal functions start from here
             */
            $scope.alertAdmin = function (dialogId, user) {
                $scope.temp_user = user;
                LxDialogService.open(dialogId);
            };

            $scope.cancelAlert = function (dialogId) {
                LxDialogService.close(dialogId);
                LxNotificationService.info($translate.instant('views.usersList.noChanges'));
            };

            $scope.openSupervisorModal = function (dialogId) {
                $scope.submitted = false;
                LxDialogService.open(dialogId);
            };

            $scope.closeSupervisorModal = function (dialogId) {

                LxDialogService.close(dialogId);
                LxNotificationService.info($translate.instant('views.usersList.noChanges'));
            };

            //creates a supervisor after validation and sync it on the list until refresh
            $scope.createSupervisor = function (dialogId, form) {
                $scope.submitted = true;
                if (form.$valid) {
                    User.createSupervisor({
                        first_name: $scope.supervisor.first_name,
                        last_name: $scope.supervisor.last_name,
                        email: $scope.supervisor.email
                    });
                    $scope.data.users.push($scope.supervisor);
                    $scope.supervisor = {};
                    $scope.submitted = false;
                    LxDialogService.close(dialogId);
                    LxNotificationService.success($translate.instant('views.usersList.sentInvite'));
                }
            };

            $scope.makeUserInactive = function (user, dialogId) {
                user.role = 'inactive';
                User.updateUser({id: user._id}, {status: user.role}).$promise.then(function (data) {
                    $scope.user = responseHandler.getData(data);
                    LxDialogService.close(dialogId);
                    $scope.getUsers();
                    LxNotificationService.info(user.first_name + ' ' + user.last_name + ' ' + $translate.instant('views.usersList.isInactive'));
                }, function () {
                    LxDialogService.close(dialogId);
                    LxNotificationService.info($translate.instant('generic.errorSaving'));
                });
            };
            /*
             Modal functions end here
             */
            $scope.init();
        }]);
