angular.module('app')

  .service('categoryService', ['Ad', function(Ad) {
    function getChoosen(stateParamsId, TREE) {

      var getCategory = function (superId){ //serach in tree without response to server
          var arrLevel = [];
          (function searchTree(arr, superId){
            angular.forEach(arr, function(child){
              if (child.id == superId) {
                arrLevel.push(child);
                if (child.supercategoryId) {
                  searchTree(TREE, child.supercategoryId);
                }
              } else if (child.subcategories && child.subcategories.length) {
                searchTree(child.subcategories, superId);
              }
            });
          }) (TREE, superId); //TREE - tree of all categories
          return arrLevel;
      }

      return Ad.findById({id: stateParamsId, filter: { include: ['category', 'actions']}}).$promise
      .then(function(res){
        /*get active action*/
        var fourthId = res.actions.length ? res.actions[0] : undefined;;
        /*get active category id */
        var arrLevel = getCategory(res.category.id);
        return [arrLevel.slice().reverse(), fourthId];
      });
    }

    return {
      getChoosen: getChoosen
    }

  }])

  .service('imgService', ['$q','Ad','$rootScope','$http', 'Image', function($q, Ad, $rootScope,$http, Image) {
    var exImgs = [];

    var updateExistImgs = function(stateParamsid) {
      return $q(function(resolve, reject){
        Ad.findById({id: stateParamsid, filter: { include: ['images'] } }, function(data){
          exImgs = data.images;
          $rootScope.$broadcast('exImgs', exImgs);
          resolve(exImgs);
        });
      })
    };

    var getExistImgs = function(){
      return exImgs;
    }

    var getPath = function(id) {
      return '/api/Images/'+id+'/download';
    }

    var deleteById = function(id) {
        return $http.delete('/api/Images/'+id+'/removeFile').then(function(resp) {//remove from storage
          return Image.deleteById({id: id}).$promise; //remove from DB
        });
    }

    var uploadFileToUrl = function(URL, file, ContentType) {
      var fd = new FormData();
      fd.append('fileToUpload', file);
      var req = {
       method: 'POST',
       url: URL,
       data: fd,
       headers: {'Content-Type': undefined},
       transformRequest: angular.identity
      };

      return $http(req).then(function(resp) { //define cash for $http
        return resp;
      });
    };

    return {
      updateExistImgs: updateExistImgs,
      getExistImgs: getExistImgs,
      getPath: getPath,
      deleteById: deleteById,
      uploadFileToUrl: uploadFileToUrl
    };

  }])


/*
//please don't delete it
.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])
*/

  .directive('fileread', ['$q', function ($q) {
    var slice = Array.prototype.slice;
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {
                if (!ngModel) return;

                ngModel.$render = function() {};

                element.bind('change', function(e) {
                    var element = e.target;
                    var f = {};

                    $q.all(slice.call(element.files, 0).map(readFile))
                        .then(function(values) {
                            if (element.multiple) ngModel.$setViewValue(values);
                            else ngModel.$setViewValue(values.length ? values[0] : null);
                        });

                    function readFile(file) {
                        var deferred = $q.defer();

                        var reader = new FileReader();// prepare HTML5 FileReader
                        reader.onload = function(e) {
                            deferred.resolve(angular.extend(file,{fileToUpload:e.target.result}));
                        };
                        reader.onerror = function(e) {
                            deferred.reject(e);
                        };
                        reader.readAsDataURL(file);

                        return deferred.promise;
                    } //readFile

                }); //change

            } //link
    }; //return


  }])

  .factory('AuthService', ['Reader', '$q', '$rootScope', function(Reader, $q,
      $rootScope) {
    function login(email, password) {
      return Reader
        .login({email: email, password: password})
        .$promise
        .then(function(res) {
          $rootScope.currentUserId = res.user.id;
          $rootScope.currentUserEmail = res.user.email;
        });
    }

    function logout() {
      return Reader
       .logout()
       .$promise
       .then(function() {
         $rootScope.currentUserId = null;
       });
    }

    function register(email, password) {
      return Reader
        .create({
         email: email,
         password: password
       })
       .$promise;
    }

    return {
      login: login,
      logout: logout,
      register: register
    };
  }])

  .factory('FormulaService', [function() {

    return {
      init: function(desc) {
        var m = desc.match(/(\s+|$)/g);
        return m && desc.length ? m.length : 0;
      }
    };

  }])

  .factory('contactStrService', [function() {

    return function(cArr) {
      return cArr.map(function(item){
        return item.kind + ': ' + item.info;
      }).join(', ');
    }

  }])

  .factory('IssueService', [function() {

    return function(obj) {
      var arr = [];
      for (var i in obj) {
        if (obj[i]) {
          arr.push(i)
        }
      }
      return arr;
    }

  }])

  .factory('genClassesService', [function() {
    return function(o) {
      var classes = '';
      angular.forEach(o, function(v,i){
        classes += ' text-' + i + '-' + v;
      })
      return classes;
    }

  }]);
