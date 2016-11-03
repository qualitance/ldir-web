(function (module) {
    'use strict';
    module.constant('API_URL', 'https://letsdoit.qualitance.com/api/v3.0/')
        .constant('AUTH_URL', 'https://letsdoit.qualitance.com/auth/v3.0/')
        .constant('PILE_IMAGE_CONFIG', {
            defaults: {
                path: 'assets/images/image_is_uploading.png',
                width: 400,
                height: 400
            }
        });
})(angular.module('ldrWebApp'));
