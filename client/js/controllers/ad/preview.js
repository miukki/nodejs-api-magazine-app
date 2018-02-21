angular.module('app')
.controller('AdPreviewController', ['$scope', 'Ad', '$state', '$stateParams', function($scope, Ad, $state, $stateParams) {
    $scope.stateParamsId = $stateParams.id;
    $scope.isEditMode = $stateParams.isEditMode;

    $scope.$on('payment', function (event, status) {
      $scope.statusPayment = status;
    });

    $scope.$on('cost', function (event, cost) {
      $scope.cost = cost;
    });

}]);
