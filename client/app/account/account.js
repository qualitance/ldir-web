'use strict';

angular.module('ldrWebApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('login', {
                url: '/login/:error',
                templateUrl: 'app/account/login/login.html',
                controller: 'LoginCtrl'
            })
            .state('signup', {
                url: '/signup',
                templateUrl: 'app/account/signup/signup.html',
                controller: 'SignupCtrl'
            })
            .state('app.profile', {
                url: '/profile',
                templateUrl: 'app/account/profile/profile.html',
                controller: 'ProfileCtrl',
                authenticate: true,
                allowUnfinishedUser: true
            })
            .state('fpw', {
                url: '/fpw',
                templateUrl: 'app/account/fpw/fpw.html',
                controller: 'FpwCtrl'
            })
            .state('reset', {
                url: '/reset/:salt',
                templateUrl: 'app/account/password/password.html',
                controller: 'PasswordCtrl',
                resolve: {
                    'user': ['User', '$stateParams', '$location', '$q', 'responseHandler',
                        function (User, $stateParams, $location, $q, responseHandler) {
                            var deferred = $q.defer();
                            User.reset({salt: $stateParams.salt}).$promise.then(function (data) {
                                deferred.resolve(responseHandler.getData(data));
                            }, function () {
                                $location.path('/');
                            });
                            return deferred.promise;
                        }]
                }
            })
            .state('activate', {
                url: '/activate/:salt',
                controller: 'ActivateCtrl',
                templateUrl: 'app/account/activate/activate.html',
                resolve: {
                    'activate': ['User', '$stateParams', '$location', '$q',
                        function (User, $stateParams, $location, $q) {
                            var deferred = $q.defer();
                            User.activate({salt: $stateParams.salt}, function () {
                                deferred.resolve(true);
                            }, function () {
                                $location.path('/');
                            });
                            return deferred.promise;
                        }]
                }
            })
            .state('password', {
                url: '/password',
                templateUrl: 'app/account/password/password.html',
                controller: 'PasswordCtrl',
                authenticate: true
            })
            .state('set_password', {
                url: '/set_password/:token',
                templateUrl: 'app/account/password/set_password.html',
                controller: 'SetPasswordCtrl'
            });
    })
    .run();
