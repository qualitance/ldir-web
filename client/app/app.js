'use strict';

var DEBUGGING = {};

angular.module('ldrWebApp', [
        'ngRaven',
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ui.router',
        'ui.bootstrap',
        'leaflet-directive',
        'ngMessages',
        'ngFileUpload',
        'ngMessages',
        'lumx',
        'ngFitText',
        'angularUtils.directives.dirPagination',
        'customRatings',
        'validation.match',
        'preloader',
        'ng-slide-down',
        'ngDragDrop',
        'angularMoment',
        'infinite-scroll',
        'ngCsv',
        'ng.deviceDetector',
        'pascalprecht.translate',
        'ui.select'
    ])
    .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $urlRouterProvider
            .otherwise('/');

        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('NetworkInterceptor');
    })

    .constant('APPCONST', {
        'DEFAULTLANG': 'ro',
        'AVAILABLELANGUAGES': ['en', 'ro']
    })

    .config(function ($translateProvider, APPCONST) {
        $translateProvider.useSanitizeValueStrategy(null);
        $translateProvider.preferredLanguage(APPCONST.DEFAULTLANG);
        $translateProvider.useStaticFilesLoader({
            prefix: 'resources/locale-',
            suffix: '.json'
        });
        $translateProvider.registerAvailableLanguageKeys(
            ['en', 'ro'],
            {
                'en*': 'en',
                'ro*': 'ro'
            }
        ).determinePreferredLanguage();
        var prefered = $translateProvider.preferredLanguage();
        if (APPCONST.AVAILABLELANGUAGES.indexOf($translateProvider.preferredLanguage()) === -1) {
            prefered = APPCONST.DEFAULTLANG;
        }
        $translateProvider.use(prefered);
    })

    .config(function ($provide) {

        $provide.factory('NetworkInterceptor', function ($q, $rootScope, $cookieStore, $location) {
            return {
                request: function (config) {
                    config.headers = config.headers || {};
                    if ($cookieStore.get('token')) {
                        config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
                    }
                    return config;
                },
                requestError: function (rejection) {
                    return rejection;
                },
                response: function (response) {
                    return response;
                },
                responseError: function (response) {
                    if (response.status === 401) {
                        $location.path('/login/');
                        $cookieStore.remove('token');
                        return $q.reject(response);
                    }
                    else {
                        return $q.reject(response);
                    }
                }
            };
        });
    })
    .config(function (uiSelectConfig) {
        uiSelectConfig.theme = 'select2';
    })

    .run(['$rootScope', '$location', 'Auth', '$state', '$q', '$urlRouter', 'LxNotificationService', 'Help',
        'Environment', '$translate', 'APPCONST', 'browserLanguageService', 'responseHandler', 'amMoment', '$cookieStore',
        function ($rootScope, $location, Auth, $state, $q, $urlRouter, LxNotificationService, Help, Environment,
                  $translate, APPCONST, browserLanguageService, responseHandler, amMoment, $cookieStore) {
            $cookieStore.put('browserLanguage', $translate.use());
            $rootScope.$state = $state;
            amMoment.changeLocale($translate.use());
            $rootScope.$on('$stateChangeStart', function (event, nextState) {
                Auth.isLoggedInAsync(function (loggedIn) {
                    if (nextState.authenticate && !loggedIn) {
                        $translate.use(APPCONST.DEFAULTLANG);
                        $location.path('/login');
                    } else {
                        if (loggedIn) {

                            if (nextState.name === 'main') {
                                $state.go('app.dashboard');
                            }

                            Auth.getCurrentUser().$promise.then(
                                function success(data) {
                                    angular.extend(data, responseHandler.getData(data));
                                    var user = angular.copy(data);
                                    if (user.language) {
                                        $translate.use(user.language.toLowerCase());
                                        amMoment.changeLocale($translate.use());
                                    } else {
                                        user.language = $translate.use();
                                        user.$save.then(function () {
                                                $translate.use(user.language);
                                                amMoment.changeLocale($translate.use());
                                            }, function () {
                                                LxNotificationService.info($translate.instant('generic.serverError'));
                                            }
                                        );
                                    }
                                    if (Auth.hasProfileComplete() || (!Auth.hasProfileComplete() && nextState.allowUnfinishedUser)) {
                                        if (Auth.hasRole('volunteer') && nextState.name === 'main') {
                                            return $state.go(Auth.getDefaultScreen());
                                        }
                                        else if ((Auth.hasRole('supervisor') || Auth.hasRole('admin')) && nextState.name === 'main') {
                                            return $state.go('app.dashboard');
                                        }
                                    } else {
                                        LxNotificationService.info($translate.instant('generic.profileNeeded'));
                                        return $state.go('app.profile');
                                    }
                                }
                            );
                        }
                    }
                });
            });

            Environment.query().$promise.then(function (resp) {
                $rootScope.environment = responseHandler.getData(resp);
            });
        }]);
