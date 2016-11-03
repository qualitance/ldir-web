/**
 * @name ldrWebApp:browserLanguageService
 * @description
 * A service that detects the browser's language
 */
'use strict';
angular.module('ldrWebApp')
    .factory('browserLanguageService', ['$window', function ($window) {
        return {
            /**
             * @name detectLanguage
             * @description
             * Returns the language of the browser
             *
             * @returns {string} The detected language
             */
            detectLanguage: function () {
                var lang = $window.navigator.languages ? $window.navigator.languages[0] : null;
                lang = lang || $window.navigator.language || $window.navigator.browserLanguage || $window.navigator.userLanguage;
                if (lang.indexOf('-') !== -1) {
                    lang = lang.split('-')[0];
                }

                if (lang.indexOf('_') !== -1) {
                    lang = lang.split('_')[0];
                }
                return lang;
            }
        };
    }]);
