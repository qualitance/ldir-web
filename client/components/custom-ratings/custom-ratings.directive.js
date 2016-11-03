angular.module('customRatings', []).directive('customRatings', [function () {
    return {
        restrict: 'E',
        scope: {
            model: '=ngModel'
        },
        replace: true,
        transclude: true,
        template: "<div class='custom-ratings' ng-class=\"{'rating-1': model == 1, 'rating-2': model == 2, 'rating-3': model == 3, 'rating-4': model == 4, 'rating-5': model == 5, 'over-1': over == 1, 'over-2': over == 2, 'over-3': over == 3, 'over-4': over == 4, 'over-5': over == 5}\"><ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul>" +
        "<div class='pile-size-container'><div class='pile-size-label-container'><span class='pile-size-label'>3x90L</span></div> <div class='pile-size-label-container'><span class='pile-size-label'>10x90L</span></div> <div class='pile-size-label-container'><span class='pile-size-label'>25x90L</span></div> <div class='pile-size-label-container'>" +
        "<span class='pile-size-label'>50x90L</span></div> <div class='pile-size-label-container'><span class='pile-size-label'>>75x90L</span></div> </div></div>",
        controller: ['$scope', '$attrs', function ($scope) {
            $scope.over = 0;
            $scope.setRating = function (rating) {
                $scope.model = rating;
                $scope.$apply();
            };
            $scope.setOver = function (over) {
                $scope.over = over;
                $scope.$apply();
            };
        }],
        link: function (scope, elem, attrs) {
            if (!attrs.hasOwnProperty('disabled')) {
                angular.forEach(elem.children().children(), function (li) {
                    li.addEventListener('mouseover', function () {
                        scope.setOver(parseInt(li.innerHTML));
                    });
                    li.addEventListener('mouseout', function () {
                        scope.setOver(0);
                    });
                    li.addEventListener('click', function () {
                        scope.setRating(parseInt(li.innerHTML));
                    });
                });
            }
        }
    };
}]);
