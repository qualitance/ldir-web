'use strict';

angular.module('ldrWebApp')
    /**
     * @name pageSkipper
     * @param config
     * @param pages
     * @type element
     * @description Skip to page directive
     * @requires $scope
     */
    .directive('pageSkipper', function () {
        return {
            restrict: 'E',
            templateUrl: 'components/page-skipper/page-skipper.template.html',
            scope: {'config': '=', 'pages': '='},
            controller: function ($scope) {
                /**
                 * @name pageSkipper#generateArray
                 * @param {Number} start
                 * @param {Number} end
                 * @description generate an array in form {start} to {end}
                 * @returns {Array}
                 */
                function generateArray(start, end) {
                    var list = [];
                    for (var i = start; i <= end; i++) {
                        list.push(i);
                    }
                    return list;
                }

                /**
                 * @name pageSkipper#skipToPage
                 * @param {Number} item
                 * @description get the desired page
                 * @return {Undefined}
                 */
                $scope.skipToPage = function (item) {
                    $scope.config.page = (item === undefined) ? 1 : item;
                };

                $scope.selectedPage = 1;
                $scope.pagesList = generateArray(1, $scope.pages);
            }
        };
    });
