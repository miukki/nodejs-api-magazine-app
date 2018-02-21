angular.module('app')
.controller('AdContactsController', ['$scope', 'Ad', '$state',
  '$stateParams', 'Contact', 'Reader', 'Constant', '$q', function($scope, Ad, $state, $stateParams, Contact, Reader, Constant, $q) {

    $scope.stateParamsId = $stateParams.id;
    $scope.isEditMode = $stateParams.isEditMode;
    $scope.action = $stateParams.isEditMode ? 'Edit': 'Create';

    $scope.cObj = {};//for set checked/unchecked flag after refresh page;

    var ownerId = Reader.getCurrentId();

    Contact.find({filter: { where: { ownerId: ownerId}}}, function(res){
      $scope.allContacts = res; // for possibilities choose from all existing conatcs
    });


    $scope.linkContact = function (c) {
      Ad.contacts[$scope.cObj[c.id] ? 'link' : 'unlink' ]({id: $stateParams.id, fk: c.id}, {}, function(){
        updateList(); //if success update
      });
    }

    function updateList() {


      Ad.findById({id: $stateParams.id, filter: { include: ['contacts'] } }, function(data){

        $scope.exContacts = data.contacts;

        angular.forEach($scope.exContacts, function(value, key) {
          this[value.id] = true; //already in add
        }, $scope.cObj);

      });


    }

    updateList();

    //sample data for client validation
    $scope.kind = Constant.patternReg;

    $scope.submitForm = function(data) {
      Ad
        .contacts.create({id: $stateParams.id}, {
        "info": data.info,
        "kind": data.name,
        "ownerId": ownerId
      }, function(data){
          updateList();
        });
    };

    $scope.deleteContact = function(id) {

      Ad.contacts.unlink({id: $stateParams.id, fk: id}, {}, function(){
        $scope.cObj[id] = false;
        updateList();
      });

    }

}]);
