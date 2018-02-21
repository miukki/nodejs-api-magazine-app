//low-level authentication mechanisms.  example.
angular
  .module('app')
  .controller('MyProfileController', ['$scope', 'Reader', 'Contact', 'Ad', 'Constant',
    function($scope, Reader, Contact, Ad, Constant) {
      var id  = Reader.getCurrentId();

      /*Reader given name*/
      Reader.findById({id: id, filter: {include: ['images']} }, function(res){
        $scope.isEdit = false;
        $scope.user = res;
      })

      $scope.submitForm = function() {
        if (!$scope.isEdit) {
          $scope.isEdit = true;
          return;
        }

        Reader.prototype$updateAttributes({id: id}, {username: $scope.user.username}, function(res){
          $scope.user = res;
          $scope.isEdit = false;
        })
      }

      /*delete button*/
      $scope.contactIdsLinkedWithAds = {};
      Ad.find({
        filter: {
          where: {
            ownerId: id
          },
          include: []
        }
      }).$promise.then(function(res) {
        angular.forEach(res, function(v, k) {
          angular.forEach(v.contactIds, function(v, k){
            if (!this[v]) {
              this[v] = true;
            }
          }, this)
        }, $scope.contactIdsLinkedWithAds)
      })



    function updateListC() {

/*
      why this code doesnt work. (error 401) ?
      Reader.contacts.findById({id: id}, function(res){
      });
*/
      Contact.find({filter: { where: { ownerId: id}}}, function(res){
        $scope.isEditContact = [];
        $scope.exContacts = res;
      })

    }

    updateListC();

    $scope.changeContact = function($index, item) {
      $scope.isEditContact = [];
      if (!$scope.isEditContact[$index]) {
        $scope.isEditContact[$index] = true;
        return;
      }

    }

    $scope.submitContacts = function($index, item) {
      Contact.prototype$updateAttributes({id: item.id}, {info: item.info, kind: item.kind}, function(res){
        item.info = res.info;
        $scope.isEditContact[$index] = false;
      })

    }


    //reg patterns
    $scope.patterns = {};
    angular.forEach(Constant.patternReg, function(val){
      $scope.patterns[val.name] =  val.pattern;
    })

    $scope.kind = Constant.patternReg;

    $scope.newContactCreate = function(itemAct) {
      Contact.create({}, {info: itemAct.info, kind: itemAct.name, ownerId: id}, function() {
        updateListC();
      })
    }

    $scope.deleteContact = function(id) {
      Contact.deleteById({id: id}, function(){updateListC();})
    }

  }]);
