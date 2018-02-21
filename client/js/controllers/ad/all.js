angular.module('app')
.controller('AllAdsController', ['$scope', 'Ad','$q', 'Category', function($scope,
    Ad, $q, Category) {
    $scope.ads = Ad.find({
      filter: {
        include: [
          'category',
          'actions'
        ]
      }
    });
}]);