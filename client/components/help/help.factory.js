'use strict';

angular.module('ldrWebApp')
    .factory('Help', ['$rootScope', 'Auth', function ($rootScope, Auth) {
        return {
            tutorial: function (id) {
                switch (id) {
                    case 0:
                        return [
                            {
                                src: '/assets/images/help1_' + Auth.getCurrentUser().language + '.jpg',
                                type: 'image'
                            },
                            {
                                src: '/assets/images/help2_' + Auth.getCurrentUser().language + '.jpg',
                                type: 'image'
                            },
                            {
                                src: '/assets/images/help3_' + Auth.getCurrentUser().language + '.jpg',
                                type: 'image'
                            }
                        ];
                    case 1:
                        return [
                            {
                                src: '/assets/images/diagram_' + Auth.getCurrentUser().language + '.jpg',
                                type: 'image'
                            }
                        ];
                    default:
                        return [];
                }
            },
            display: function (items, callback) {
                callback = callback || angular.noop;
                $.magnificPopup.open({
                    items: items,
                    gallery: {
                        enabled: true
                    },
                    modal: false,
                    enableEscapeKey: false,
                    closeOnBgClick: false,
                    closeBtnInside: false,
                    removalDelay: 300,
                    mainClass: 'mfp-fade',
                    callbacks: {
                        beforeClose: function () {
                            callback();
                        },
                        change: function () {

                            var mfp = $.magnificPopup.instance;
                            var container = $(mfp.container);
                            this.content.off('click');

                            if (mfp.index >= mfp.items.length - 1) {
                                container.addClass('mfp-last');
                            }
                            else {
                                container.removeClass('mfp-last');
                            }
                            if (mfp.index === 0) {
                                container.addClass('mfp-first');
                            }
                            else {
                                container.removeClass('mfp-first');
                            }
                            this.content.on('click', function () {
                                return false;

                            });
                            $('.mfp-close').on('click', function () {
                                mfp.close();
                            });

                            $rootScope.$on('$stateChangeStart', function () {
                                mfp.close();
                            });

                        }

                    }
                });

            }
        };
    }]);
