angular.module('app')
.controller('MyAdsController', ['$scope', 'Ad', 'Reader', '$filter', function($scope, Ad, Reader, $filter) {
  Ad.find({
    filter: {
      where: {
        ownerId: Reader.getCurrentId()
      },
      include: ['issues', 'actions', 'category']
    }
  }, function(res) {
    $scope.action = 'My Ads';
    $scope.ads = {'active': [], 'archive': []};

    angular.forEach(res, function(ad, key){
    var keepGoing = true;
    ad.freezing = false;
    ad.active = false;

      angular.forEach(ad.issues, function(value, key) {
        if (keepGoing) {

          var currentDate = $filter('toUtc')(new Date());
          var submissionDeadline = $filter('toUtc')(value['submissionDeadline']);
          var publishAt = $filter('toUtc')(value['publishAt']);

          if (currentDate < publishAt) {
            ad.publishAt = publishAt;
            ad.submissionDeadline = submissionDeadline;
            keepGoing = false;
            ad.active = true;
            ad.freezing = currentDate > submissionDeadline ? true : false;
          }

        }
      });
      if (ad.active) {
       this.active.push(ad)
      } else {
       this.archive.push(ad)
      }
    }, $scope.ads);

  });

}]);