'use strict';

angular.module('ldrWebApp')
    /**
     * @ngdoc service
     * @service
     * @name Help
     * @description help service
     * @requires $rootScope
     * @requires Auth
     */
    .factory('Help', ['$rootScope', 'Auth', function ($rootScope, Auth) {
        return {
            /**
             * @ngdoc method
             * @name Help#tutorial
             * @methodOf Help
             * @example
             * var items = Help.tutorial(0);
             * @description
             * calculates map resolution depending on screen resolution and browser used
             * @returns {Array} help step image required
             */
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
            /**
             * @ngdoc method
             * @name Help#display
             * @methodOf Help
             * @param {Object} items - items to display
             * @param {Function} callback - callback function
             * @example
             * Help.display(items);
             * @description
             * displays magnificPopup
             */
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
