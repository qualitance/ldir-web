'use strict';

angular.module('ldrWebApp')
    .factory('Auth', function Auth($location, $rootScope, $http, User, $cookieStore, $q, responseHandler,
                                   $translate, AUTH_URL) {
        var currentUser = {};
        if ($cookieStore.get('token')) {
            currentUser = User.get();
        }

        return {
            /**
             * Authenticate user and save token
             * @param  {Object}   user     - login info
             * @param  {Function} callback - optional
             * @return {Promise}
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
             * Delete access token and user info
             */
            logout: function () {
                $cookieStore.remove('token');
                $translate.use($cookieStore.get('browserLanguage'));
                currentUser = {};
            },

            /**
             * Create a new user
             * @param  {Object}   user     - user info
             * @param  {Function} callback - optional
             * @return {Promise}
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
             * Change password
             * @param  {String}   oldPassword
             * @param  {String}   newPassword
             * @param  {Function} callback    - optional
             * @return {Promise}
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
             * Gets all available info on authenticated user
             * @return {Object} user
             */
            getCurrentUser: function () {
                return currentUser;
            },

            /**
             * Check if a user is logged in
             * @return {Boolean}
             */
            isLoggedIn: function () {
                return responseHandler.getData(currentUser).hasOwnProperty('role');
            },

            /**
             * Waits for currentUser to resolve before checking if user is logged in
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
             * Check if a user is an admin
             * @return {Boolean}
             */
            isAdmin: function () {
                return responseHandler.getData(currentUser).role === 'admin';
            },
            /**
             * check user's role
             * @param role
             * @returns {boolean}
             */
            hasRole: function (role) {
                return responseHandler.getData(currentUser).role === role;
            },

            /**
             * Get auth token
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
