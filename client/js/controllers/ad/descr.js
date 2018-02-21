angular.module('app')
.controller('AdDescrController', ['$state', '$scope', 'localStorageService', '$stateParams', 'Ad', 'FormulaService', 'contactStrService', function($state, $scope, localStorageService, $stateParams, Ad, FormulaService, contactStrService){

  $scope.isEditMode = $stateParams.isEditMode;
  $scope.stateParamsId = $stateParams.id;
  $scope.action = $stateParams.isEditMode ? 'Edit' : 'Create';

  var AdObj = {};

  if ($stateParams.id) {
    Ad.findById({id: $stateParams.id, filter: { include: ['contacts']} })
    .$promise.then(function(res){
      $scope.item = res;
      $scope.cStr= contactStrService($scope.item.contacts);
      $scope.updatePreview();
    });
  } else {
    $scope.item = {placeholder:'text example..'};
  }

  $scope.updatePreview = function() {
    $scope.textarea = ''.concat($scope.item.text, $scope.item.text? ' ' : '', $scope.cStr);
  }

  $scope.nextStep = function(){
    AdObj = localStorageService.get('AdObj')
    angular.extend(AdObj, {'text': $scope.item.text, 'count': $scope.item.count});

    Ad.create(AdObj, function(res){
      $state.go('contacts-ad', { 'id': res.id});
    });
  }

  $scope.updateDescr = function(){
    Ad.prototype$updateAttributes({id: $stateParams.id}, {'text': $scope.item.text, 'count': $scope.item.count}).$promise.then(function(){
      if ($stateParams.isEditMode) {
        $state.go('edit-ad.abs', { 'id': $stateParams.id});
      } else {
        $state.go('contacts-ad', { 'id': $stateParams.id});
      }
    })
  }

  $scope.Descr = function(desc) {
    $scope.item.count = FormulaService.init(desc);
  }

}]);