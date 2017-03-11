'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name User
     * @description The user service
     * @requires $resource
     * @requires API_URL
     */
    .factory('User', ['$resource', 'API_URL', function ($resource, API_URL) {
        return $resource(API_URL + 'users/:action/:salt/:token', {},
            {
                activate: {
                    method: 'GET', params: {
                        action: 'activate', salt: '@salt'
                    }
                },
                getUser: {
                    method: 'GET'
                },
                updateUser: {
                    method: 'PUT'
                },
                deleteUser: {
                    method: 'DELETE'
                },
                all: {
                    method: 'GET',
                    isArray: false
                },
                createSupervisor: {
                    method: 'POST', params: {
                        action: 'create_supervisor'
                    }
                },
                resendActivation: {
                    method: 'POST', params: {
                        action: 'resendActivation'
                    }
                },
                reset: {
                    method: 'GET', params: {
                        action: 'reset', salt: '@salt'
                    }
                },
                change: {
                    method: 'PUT', params: {
                        action: 'reset', salt: '@salt'
                    }
                },
                fpw: {
                    method: 'POST', params: {
                        action: 'fpw'
                    }
                },

                save: {
                    method: 'PUT', params: {
                        action: 'me'
                    }
                },
                changePassword: {
                    method: 'PUT',
                    params: {
                        action: 'password'
                    }
                },
                create: {
                    method: 'POST'
                },
                get: {
                    method: 'GET',
                    params: {
                        action: 'me'
                    }
                },
                setPassword: {
                    method: 'POST',
                    params: {
                        action: 'set_password'
                    }
                },
                getUncompletedUser: {
                    method: 'GET',
                    params: {
                        action: 'set_password',
                        token: '@token'
                    }
                },
                stats: {method: 'GET', isArray: false, params: {action: 'stats'}},
                getUsersStatistics: {method: 'GET', isArray: false, params: {action: 'statistics'}}
            });
    }]);
