angular
  .module('app')
  .controller('header', ['$scope', 'Reader',
      function($scope, Reader) {

        Reader.getCurrent(function(res){
          $scope.currentUserId = res.id;
          $scope.currentUserEmail = res.email
        });


  }]);
