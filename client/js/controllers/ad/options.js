angular.module('app')
.controller('AdOptionsController', ['$scope', 'Ad', '$state', '$stateParams', 'Constant', 'OptionGroup', 'contactStrService', 'imgService', function($scope, Ad, $state, $stateParams, Constant, OptionGroup, contactStrService, imgService) {

  $scope.stateParamsId = $stateParams.id;
  $scope.isEditMode = $stateParams.isEditMode;
  $scope.action = $stateParams.isEditMode ? 'Edit' : 'Create';
  $scope.disabledOptions = {};

  //listen event for get update
  $scope.$on('exImgs', function(e, res) {
    $scope.exImgs = res;
  })
  // listen event from options-ad.abs
  $scope.$on('AdDataDelivery', function (event, data) {
    $scope.choosenOptions = data.choosenOptions;
    $scope.isServiceImg = data.isServiceImg;
  });

  //for draw all possible options
  OptionGroup.find({filter: { where: {publicationId: Constant.publicationId}, include: ['options', 'defaultOption']}}).$promise
  .then(function(res){
    $scope.optionsGroups = res;
  });


  $scope.updateIntersect = function (o) {
    if (o && Constant.intersectOption[o.id]) { //disabled options if intersect
      angular.forEach(Constant.intersectOption[o.id], function(id, index){
        if (!this[id]) this[id] = 0;
        this[id] = o.value + this[id];
      }, $scope.disabledOptions)
    } else if (!o) {
      $scope.disabledOptions = {};
      angular.forEach($scope.optionsGroups, function(o){
        $scope.updateIntersect(o)
      });
    }
  }

  $scope.changeR = function(opt, o) {
    if (opt) {
      o.choosenId = opt.value ? opt.id : o.defaultOptionId;
    };
    if (!opt && o.value) { //for id=7, id=6, id=10 (for visibled optionGroupd)
      o.choosenId = o.id == 7 ? 10 : o.id == 10 ? 14 : o.id == 6 ? 17 : o.defaultOptionId; //choose first default color as default
    } else if (!opt && !o.value) { //for id=7, id=6, id=10 (for visibled optionGroupd)
      o.choosenId = o.defaultOptionId;
    }

    o.opened= (o.id!=7 &&  o.id!=6 && o.id!=10) || (o.choosenId!=o.defaultOptionId); //close optionsGroup if nothing choosen
    o.value = o.choosenId!=o.defaultOptionId;//value update
    $scope.choosenOptions[o.id] = o.choosenId; //update choosenOptions

    $scope.$broadcast('genClasses', $scope.choosenOptions);

  }

  $scope.updateOpt = function (choosenOptions, uisref) {
    Ad.prototype$updateAttributes({id: $scope.stateParamsId}, {'options': choosenOptions}).$promise
    .then(function(){
      if ($scope.isEditMode) {
        $state.go('edit-ad.abs', { 'id': $scope.stateParamsId});
      } else {
        $state.go(uisref, {'id': $scope.stateParamsId})
      }
    })
  }

  $scope.enableImagePanel = function(opt,o) {
    if (($scope.isServiceImg && opt.id==35) || (!$scope.isServiceImg && opt.id==33)) { //if images option
      $scope.imageControl = opt.value || opt.id == o.choosenId;
    }

  }

}]);
