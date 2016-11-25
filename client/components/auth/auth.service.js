'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name Auth
     * @description The authentication service
     * @requires $location
     * @requires $rootScope
     * @requires $http
     * @requires $cookieStore
     * @requires $q
     * @requires responseHandler
     * @requires $translate
     * @requires AUTH_URL
     */
    .factory('Auth', function Auth($location, $rootScope, $http, User, $cookieStore, $q, responseHandler,
                                   $translate, AUTH_URL) {
        var currentUser = {};
        if ($cookieStore.get('token')) {
            currentUser = User.get();
        }

        return {
            /**
             * @ngdoc
             * @name Auth#login
             * @methodOf Auth
             * @param  {Object} user - login info
             * @param  {Function} callback - optional
             * @example
             * Auth.login({email: user.email,password: user.password})
             * @description
             * Tries to login a user
             * @returns {Promise} Resolves to an empty response/error
             */
            login: function (user, callback) {
                var cb = callback || angular.noop;
                var deferred = $q.defer();

                $http.post(AUTH_URL + 'local', {
                    email: user.email,
                    password: user.password
                }).success(function (data) {
                    $cookieStore.put('token', responseHandler.getData(data).token);
                    currentUser = User.get();
                    deferred.resolve(responseHandler.getData(data));
                    return cb();
                }).error(function (err) {
                    this.logout();
                    deferred.reject(err);
                    return cb(err);
                }.bind(this));

                return deferred.promise;
            },

            /**
             * @ngdoc
             * @name Auth#logout
             * @methodOf Auth
             * @description
             * Delete access token and user info
             */
            logout: function () {
                $cookieStore.remove('token');
                $translate.use($cookieStore.get('browserLanguage'));
                currentUser = {};
            },

            /**
             * @ngdoc
             * @name Auth#createUser
             * @methodOf Auth
             * @param  {Object} user - user info
             * @param  {Function} callback - optional
             * @example
             *  Auth.createUser({terms: user.terms, pass: true,email: user.email, password: user.password1,
             *  first_name: user.first_name, last_name: user.last_name, language: mailLanguage})
             * @description
             * Tries to create a user
             * @returns {Promise} Resolves to an empty response/error
             */
            createUser: function (user, callback) {
                var cb = callback || angular.noop;

                return User.create(user,
                    function () {
                        return cb(user);
                    },
                    function (err) {
                        return cb(err);
                    }.bind(this)).$promise;
            },

            /**
             * @ngdoc
             * @name Auth#changePassword
             * @methodOf Auth
             * @param  {String}   oldPassword
             * @param  {String}   newPassword
             * @param  {Function} callback    - optional
             * @example
             * Auth.changePassword($scope.pass.password0, $scope.pass.password1)
             * @description
             * Tries to change the password
             * @returns {Promise} Resolves to an empty response/error
             */
            changePassword: function (oldPassword, newPassword, callback) {
                var cb = callback || angular.noop;

                return User.changePassword({
                    oldPassword: oldPassword,
                    newPassword: newPassword
                }, function (user) {
                    return cb(responseHandler.getData(user));
                }, function (err) {
                    return cb(err);
                }).$promise;
            },

            /**
             * @ngdoc
             * @name Auth#getCurrentUser
             * @description - Gets all available info on authenticated user
             * @return {Object} user
             */
            getCurrentUser: function () {
                return currentUser;
            },

            /**
             * @ngdoc
             * @name Auth#isLoggedIn
             * @description - Check if a user is logged in
             * @return {Boolean}
             */
            isLoggedIn: function () {
                return responseHandler.getData(currentUser).hasOwnProperty('role');
            },

            /**
             * @ngdoc
             * @name Auth#isLoggedInAsync
             * @description - Waits for currentUser to resolve before checking if user is logged in
             */
            isLoggedInAsync: function (cb) {
                if (currentUser.hasOwnProperty('$promise')) {
                    currentUser.$promise.then(function () {
                        cb(true);
                    }).catch(function () {
                        cb(false);
                    });
                } else if (responseHandler.getData(currentUser).hasOwnProperty('role')) {
                    cb(true);
                } else {
                    cb(false);
                }
            },

            /**
             * @ngdoc
             * @name Auth#isAdmin
             * @description - Check if a user is an admin
             * @return {Boolean}
             */
            isAdmin: function () {
                return responseHandler.getData(currentUser).role === 'admin';
            },
            /**
             * @ngdoc
             * @name Auth#hasRole
             * @description - check user's role
             * @param role
             * @returns {Boolean}
             */
            hasRole: function (role) {
                return responseHandler.getData(currentUser).role === role;
            },

            /**
             * @ngdoc
             * @name Auth#getToken
             * @description - Get auth token
             * @returns {String}
             */
            getToken: function () {
                return $cookieStore.get('token');
            },

            hasProfileComplete: function () {
                return (currentUser.hasOwnProperty('$promise') && responseHandler.getData(currentUser).phone &&
                responseHandler.getData(currentUser).first_name && responseHandler.getData(currentUser).last_name &&
                responseHandler.getData(currentUser).county);
            },

            hasSeenWizard: function () {
                return (currentUser.hasOwnProperty('$promise') &&
                responseHandler.getData(currentUser).flags.viewedPresentations.web);
            },

            getDefaultScreen: function () {
                return 'app.map.display';
            }
        };
    });
