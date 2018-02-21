angular.module('app')
.controller('AdImagesController', ['$scope', 'Ad', '$state', '$stateParams', 'Reader', 'Image', 'Constant', 'imgService', function($scope, Ad, $state, $stateParams, Reader, Image, Constant, imgService) {
    var ownerId = Reader.getCurrentId();

    $scope.imgObj = {};//for set checked/unchecked flag after refresh page;
    $scope.imageMeta = {src: ''}

    loadAllImg();
    updateExistImgs(allImagesLinkedWithAds);

    function allImagesLinkedWithAds () {
      //for delete image
      $scope.allImagesLinkedWithAds = {}; //all images linked with all ads for this user.
      Ad.find({
        filter: {where: { ownerId: ownerId},include: ['images']}
      }).$promise.then(function(res) {
        angular.forEach(res, function(v, k) {
          angular.forEach(v.imageIds, function(v, k){

              this[v] = true;

          }, this)
        }, $scope.allImagesLinkedWithAds)
      })
      //end for delete img
    }

    function loadAllImg(){
      Image.find({filter: { where: { ownerId: ownerId}}}, function(res){
        $scope.allImgs = res; //choose from all existing conatcs
      });
    }

    $scope.getPath = imgService.getPath.bind()


    $scope.linkImg = function (i) {
      Ad.images[$scope.imgObj[i.id] ? 'link' : 'unlink' ]({id: $stateParams.id, fk: i.id}, {}, function(){
        updateExistImgs(allImagesLinkedWithAds); //if success update
      });
    }

    function updateExistImgs(cb) {
      imgService.updateExistImgs($stateParams.id).then(function(res){
        $scope.exImgs = res;
        angular.forEach($scope.exImgs, function(value, key) {
          this[value.id] = true; //already in add
        }, $scope.imgObj);
        if (cb) cb();
      })


    }

    $scope.unlinkImg = function(id) {
      Ad.images.unlink({id: $stateParams.id, fk: id}, {}, function(){
        $scope.imgObj[id] = false;
        updateExistImgs(allImagesLinkedWithAds);
      });
    }


    $scope.valImg = function(myFile, cb) {
      $scope.errorImage = '';
      if (!myFile) {
        $scope.errorImage = 'Image file required';
        return;
      }
      if (!Constant.patternRegFile.test(myFile.type)){
        $scope.errorImage = 'Wrong image format. Only accept: jpg/gif/png';
        return;
      }
      if (cb) {
        cb(myFile);
      }
    }

    $scope.uploadImg = function(myFile) {
      imgService.uploadFileToUrl('/api/Images/upload', myFile).then(function(res){
        if (res.data && res.data.id) {

          Image.prototype$updateAttributes({id: res.data.id}, {ownerId: ownerId}, function(imgRes){//linked with ownerId
            loadAllImg();
            Ad.images.link({id: $stateParams.id, fk: imgRes.id}, {}, function(){//link with Ad
              updateExistImgs(allImagesLinkedWithAds); //if success update
            });
          })

        }
      });
    }

    $scope.deleteImg = function(id) {
      imgService.deleteById(id).then(function(res){
        loadAllImg();
        updateExistImgs(allImagesLinkedWithAds);
      })
    }

}]);