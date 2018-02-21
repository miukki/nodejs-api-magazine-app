 angular.module('app')
.controller('AdTextPreviewController', ['$scope', '$state', '$stateParams', 'Ad', 'genClassesService', 'contactStrService', 'imgService', function($scope, $state, $stateParams, Ad, genClassesService, contactStrService, imgService) {

  Ad.findById({id: $stateParams.id, filter: { include: ['contacts', 'category', 'issues']}}).$promise
  .then(function(res){

    $scope.$parent.$broadcast('issues', res.issues);//send issues for choosenissues
    $scope.$emit('payment', res.paymentStatus);//send issues for paymentstatus
    $scope.$emit('cost', res.cost);//cost
    console.log('res.cost', res)

    $scope.text = ''.concat(res.text, res.text ? ' ' : '', contactStrService(res.contacts) );
    $scope.count = res.count;
    $scope.contactsL = res.contacts.length

    var isServiceImg = res.category && res.category.custom && res.category.custom.type == 'service';
    var choosenOptions = res.options;

    $scope.$emit('AdDataDelivery', {'isServiceImg': isServiceImg, 'choosenOptions': choosenOptions});

    genClasses(choosenOptions);//init Classes
  })

  function genClasses (o) {
    $scope.class = genClassesService(o);
  }

  $scope.$on('genClasses', function (event, choosenOptions) {
    genClasses(choosenOptions); //updated Classes
  });

  /*for images preview*/
  imgService.updateExistImgs($stateParams.id).then(function(res){
    $scope.exImgs = res;
  })

  /*for images path*/
  $scope.getPath = imgService.getPath.bind();//nice example of .bind


}]);
