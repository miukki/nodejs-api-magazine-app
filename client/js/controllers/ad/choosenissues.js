angular.module('app')
.controller('AdChoosenIssuesController', ['$scope', function($scope) {
  $scope.$on('issues', function (event, data) {
    $scope.issues = data;
  });
}]);