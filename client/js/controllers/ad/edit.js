angular.module('app')
.controller('EditAdController', ['$state', '$scope', '$stateParams', 'Ad', '$filter', 'genClassesService', 'imgService',function($state, $scope ,$stateParams, Ad, $filter, genClassesService, imgService) {
  $scope.action = 'Edit';
  $scope.idAd = $stateParams.id;

  Ad.findById({id: $stateParams.id, filter: { include: ['category', 'contacts', 'actions', 'issues']}})
  .$promise.then(function(res){
    $scope.item = res;
    $scope.item.updatedAt = $filter('date')($scope.item.updatedAt, 'yyyy-MM-ddTHH:mm:ss.sssZ', '+0700');
    $scope.item.createdAt = $filter('date')($scope.item.createdAt, 'yyyy-MM-ddTHH:mm:ss.sssZ', '+0700');

    angular.forEach($scope.item.issues, function(val){
      val.publishAt = $filter('date')(val.publishAt, 'yyyy-MM-ddTHH:mm:ss.sssZ', '+0700')
    })

  })
}]);