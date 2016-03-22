angular.module('starter.directives', [])

.directive('shake', ['$animate',
  function ($animate) {
        return {
            restrict: 'A',
            link: function ($scope, element, attrs) {
                console.log("ERROR ES " + $scope.error)
                $scope.$watch('error.id', function (newValue, oldValue) {
                    console.log("newvlue " + newValue + "OLD " + oldValue);
                    if (newValue == "error") {
                        console.log("ANIMATE")
                        $animate.addClass(element, 'shake').then(function () {
                            element.removeClass('shake');
                            $scope.error.id = "noerror";
                            return;
                        });
                    } else {
                        return;
                    }
                });
            }
        };
  }
])
