'use strict';
/**
 * @name ldrWebApp:responseHandler
 * @description
 * A service that handles all responses from back-end
 */
angular.module('ldrWebApp')
    .factory('responseHandler', function () {
        return {
            getCode: function (serverResponse) {
                return serverResponse.code;
            },
            getData: function (serverResponse) {
                return serverResponse.data ? serverResponse.data.success : {};
            },
            getErrorData: function (serverResponse) {
                return serverResponse.data ? serverResponse.data.error : {};
            }
        };
    });
