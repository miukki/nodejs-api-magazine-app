angular.module('app')
.controller('AdIssuesController', ['$state', '$scope', 'Issue', '$stateParams', 'Ad', 'IssueService', 'localStorageService', function($state, $scope, Issue, $stateParams, Ad, IssueService, localStorageService) {
$scope.isEditMode = $stateParams.isEditMode;
$scope.stateParamsId = $stateParams.id;
$scope.action = $stateParams.isEditMode ? 'Edit': 'Create';

var issueIdsChecked = {};
var AdObj = {};
$scope.issueIdsArr = []; //only checked id

$scope.updateIssues = function() {
  Ad.prototype$updateAttributes({id: $stateParams.id}, {issueIds: $scope.issueIdsArr}).$promise.then(function(){
    if ($stateParams.isEditMode) {
      $state.go('edit-ad.abs', { 'id': $stateParams.id});
    } else {
      $state.go('descr-ad', { 'id': $stateParams.id});
    }
  })
}

$scope.nextStep = function() {
  if(!$scope.isEditMode && localStorageService.isSupported) {
      AdObj = localStorageService.get('AdObj')
      angular.extend(AdObj, {'issueIds': $scope.issueIdsArr});
      localStorageService.set('AdObj', AdObj);
      $state.go('descr-ad', { 'id': null});
  }
}

if (!$stateParams.id && !$scope.isEditMode) {
  getIssueList();
}

$scope.Issue = function(item) {
  issueIdsChecked[item.id] = item.value
  $scope.issueIdsArr = IssueService(issueIdsChecked);
}

function getIssueList(){
  Issue.find({
    filter: {
      where: {
        publicationId: 1
      },
      include: []
    }
  }).$promise.then(function(data){
    $scope.issues = data;
    if ($stateParams.id) {
      angular.forEach($scope.issues, function(val){
          val.value = issueIdsChecked[val.id];
      })
    }
  });
}

if ($stateParams.id) {
  Ad.findById({id: $stateParams.id}).$promise.then(function(res){
    $scope.item = res;
    angular.forEach($scope.item.issueIds, function(val){
      this[val] = true;
    }, issueIdsChecked)
    $scope.issueIdsArr = IssueService(issueIdsChecked);
    return issueIdsChecked;
  }).then(function(){
    getIssueList();
  })
}

}]);
