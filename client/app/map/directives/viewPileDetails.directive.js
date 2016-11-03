'use strict';

angular.module('ldrWebApp')
    .directive('customCarousel', ['$timeout', 'PILE_IMAGE_CONFIG', function ($timeout, PILE_IMAGE_CONFIG) {
        return {
            restrict: 'E',
            scope: {
                'images': '='
            },
            templateUrl: 'app/map/directives/viewPileDetails.template.html',
            replace: true,
            controller: function ($scope, $element, preloader) {
                $scope.defaults = {
                    src: PILE_IMAGE_CONFIG.defaults.path,
                    dimensions: {
                        width: PILE_IMAGE_CONFIG.defaults.width,
                        height: PILE_IMAGE_CONFIG.defaults.height
                    }
                };
                $scope.preloader = preloader;
                $scope.files = $scope.images;
                var sizes = {
                    th: $element[0].firstElementChild.offsetHeight,
                    tw: $element[0].firstElementChild.offsetWidth
                };

                $scope.setMainImg = function (file, index) {
                    if (file) {
                        $scope.main = file;
                        sizes.iw = file.dimensions ? file.dimensions.image.width : $scope.defaults.dimensions.width;
                        sizes.ih = file.dimensions ? file.dimensions.image.height : $scope.defaults.dimensions.height;

                        if (sizes.iw > sizes.ih) {
                            sizes.nh = sizes.th;
                            sizes.nw = sizes.iw * sizes.th / sizes.ih;
                        } else {
                            sizes.nw = sizes.tw;
                            sizes.nh = sizes.ih * sizes.tw / sizes.iw;
                        }
                        sizes.hd = (sizes.nh - sizes.th) / 2;
                        sizes.wd = (sizes.nw - sizes.tw) / 2;
                        $scope.sizes = sizes;
                        $scope.images.index = index;
                    }

                };
                if ($scope.files[0]) {
                    $scope.setMainImg($scope.files[0], 0);
                }

            },
            link: function ($scope, elem) {
                var main = angular.element(elem[0].getElementsByClassName('cc-main-image')[0]);
                $scope.items = [];
                angular.forEach($scope.files, function (file) {
                    $scope.items.push({src: file.src || $scope.defaults.src, type: 'image'});
                });

                $scope.$watchCollection(
                    'files',
                    function () {
                        $scope.setMainImg($scope.files[$scope.images.index], $scope.images.index);
                        $scope.items = [];
                        angular.forEach($scope.files, function (file) {
                            $scope.items.push({src: file.src || $scope.defaults.src, type: 'image'});
                        });
                    });
                var magnificPopup = {};
                main.bind('click', function () {
                    $.magnificPopup.open({
                        items: $scope.items,
                        removalDelay: 300,
                        mainClass: 'mfp-fade',
                        closeBtnInside: false,
                        closeMarkup: '<button title="%title%" class="mfp-close" style="display: block !important"><i class="mfp-close-icn">&times;</i></button>',
                        gallery: {
                            enabled: true
                        }
                    });
                    magnificPopup = $.magnificPopup.instance;
                    magnificPopup.goTo($scope.images.index);

                });

                $scope.$on('$stateChangeStart', function () {
                    if (magnificPopup.isOpen) {
                        magnificPopup.close();
                    }
                });
            }
        };
    }]);
