angular.module('app')
.controller('AdCategoryController', ['localStorageService', '$scope', 'Category', '$state', 'Ad', 'Reader', '$stateParams', 'Constant', 'categoryService', function(localStorageService, $scope, Category, $state, Ad, Reader, $stateParams, Constant, categoryService) {
  var AdObj = {};
  $scope.isEditMode = $stateParams.isEditMode;
  $scope.stateParamsId = $stateParams.id;
  $scope.action = $stateParams.isEditMode ? 'Edit': 'Create';
  $scope.isReady = false;


  function nextStep(data){

    if ($scope.stateParamsId) {
      $scope.dataC = {'categoryId': data.id, 'actionIds': data.actionIds};
    } else if (localStorageService.isSupported) {
        angular.extend(AdObj, {'categoryId': data.id, 'actionIds': data.actionIds, 'ownerId': Reader.getCurrentId(), 'publicationId': Constant.publicationId });
        localStorageService.set('AdObj', AdObj)
    }
    $scope.isReady = true;
  }

  $scope.editAd = function(data) {
    Ad.prototype$updateAttributes({id: $stateParams.id}, data).$promise.then(function(){
      if ($stateParams.isEditMode) {
        $state.go('edit-ad.abs', { 'id': $stateParams.id});
      } else {
        $state.go('issues-ad', { 'id': $stateParams.id});
      }
    })
  }

  Category.trees({}).$promise
  .then(function(data){
    $scope.first = data.trees;

    if ($scope.stateParamsId) { //for 'update mode'
        categoryService.getChoosen($scope.stateParamsId, $scope.first)
        .then(function(res){
          var arr = res[0]; //choosen gategories
          $scope.fourthId = res[1];
          angular.forEach(arr, function(i, index){//res.slice().reverse() - copy and reverse
            $scope[this[index].id]=i;
            $scope[this[index].sub]=i.subcategories.length ? i.subcategories : i.actions.length ? i: null;
          }, Constant.categoryTmpl);
          $scope.isReady = true;
        })
    }

  });


  $scope.choseCategory = function(sub, level, extendData){
    //clean up <select> for previous step
    if (level == 0) {
      $scope.second =null;
      $scope.third = null;
      $scope.fourth = null;
    }
    if (level == 1) {
      $scope.third = null;
      $scope.fourth = null;
    }
    if (level == 2) {
      $scope.fourth = null;
    }

    if (sub && sub instanceof Object && level === undefined) { //level === undefined == means actions level
      angular.extend(extendData, {'actionIds': Array.prototype.concat.call([], sub['id'])}) //if choosen action:
      nextStep(extendData);//choosed action and [next step ~ description]
    }

    //check subcategoris
    if (sub && sub instanceof Object && sub.actions) {
      if (sub.actions.length) {
        $scope.fourth = sub; //activate show for actions
      } else {
        nextStep(sub);//actions empty, choosing category id
      };
    }

    //choosing subcategoris
    if (sub && sub instanceof Array && level === 0 ) {
      $scope.second = sub
    }
    //choosing subcategoris
    if (sub && sub instanceof Array && level === 1 ) {
      $scope.third = sub
    }

  }


}]);