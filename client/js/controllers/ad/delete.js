angular.module('app')
.controller('DeleteAdController', ['$scope', 'Ad', '$state',
  '$stateParams', function($scope, Ad, $state, $stateParams) {

  Ad
    .deleteById({ id: $stateParams.id })
    .$promise
    .then(function() {
      $state.go('my-ads');
    });

}]);
