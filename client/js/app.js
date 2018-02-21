angular
  .module('app', [
    'ui.router',
    'lbServices',
    'LocalStorageModule',
    'angularMoment'
  ])

  .config(function(LoopBackResourceProvider, localStorageServiceProvider) {

      // Use a custom auth header instead of the default 'Authorization'
      LoopBackResourceProvider.setAuthHeader('X-Access-Token');

      //https://github.com/grevory/angular-local-storage
      localStorageServiceProvider
        .setPrefix('app')
        .setStorageType('localStorage')
        .setNotify(true, true);
  })

  .run(['$rootScope', '$state', 'Reader', 'amMoment', function($rootScope, $state, Reader, amMoment) {
    //change locale amMoment.changeLocale('ru');

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      // redirect to login page if not logged in
      if (toState.authenticate && !Reader.getCurrentId()) {
        event.preventDefault(); //prevent current page from loading
        $state.go('forbidden');
      }
    });
  }])
  .constant('Constant', {
    'patternReg': [
      {name:'phone', pattern: /^\d+$/, placeholder: 'enter phone'},
      {name:'email', pattern: /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i, placeholder: 'enter email'},
      {name:'website', pattern: /^(http|https|ftp)?(:\/\/)?(www|ftp)?.?[a-z0-9-]+(.|:)([a-z0-9-]+)+([\/?].*)?$/, placeholder: 'enter website'},
    ],
    'patternRegFile': /^(image\/gif|image\/jpeg|image\/png)$/i,
    'publicationId': 1,
    'categoryTmpl': [{id: 'firstId', sub: 'second'}, {id: 'secondId', sub: 'third'}, {id: 'thirdId', sub: 'fourth'}],
    'intersectOption': {
      6: [5,10,7,8,9],
      10: [5,6,8,9],
      7: [5,6,8,9],
      8: [5,6,10,7,9],
      9: [5,6,10,7,8],
      5: [6,10,7,8,9]
    },
    'uiview': {
      'textpreview': {
        templateUrl: 'ad-textpreview.html',
        controller: 'AdTextPreviewController'
      },
      'choosenissues': {
        templateUrl: 'ad-choosenissues.html',
        controller: 'AdChoosenIssuesController'
      }
    }


});
