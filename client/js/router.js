angular.module('app')
.config(['$stateProvider', '$urlRouterProvider', 'Constant', function($stateProvider, $urlRouterProvider, Constant) {

  $stateProvider
    .state('contacts-ad', {
      url: '/contacts-ad/:id/:isEditMode',
      templateUrl: 'ad-contacts.html',
      controller: 'AdContactsController',
      authenticate: true
    })
    .state('options-ad', {
      url: '/options-ad/:id/:isEditMode',
      templateUrl: 'ad-options.html',
      controller: 'AdOptionsController',
      authenticate: true
    })
    .state('options-ad.abs', {
      url: '/abs',
      views: {
        'imgs': {
          templateUrl: 'ad-images.html',
          controller: 'AdImagesController'
        },
        'textpreview': Constant.uiview.textpreview,
        '': {
          //template: 'foo'
        }

      }
    })
    .state('preview-ad', {
      url: '/preview-ad/:id/:isEditMode',
      templateUrl: 'ad-preview.html',
      controller: 'AdPreviewController',
      authenticate: true
    })
    .state('preview-ad.abs', {
      url: '/abs',
      views: {
        'textpreview': Constant.uiview.textpreview,
        'choosencategories': {
          templateUrl: 'ad-choosencategories.html',
          controller: 'AdCategoryController'
        },
        'choosenissues': Constant.uiview.choosenissues
      }
    })
    .state('all-ads', {
      url: '/all-ads',
      templateUrl: 'all-ads.html',
      controller: 'AllAdsController'
    })
    .state('edit-ad', {
      url: '/edit-ad/:id',
      templateUrl: 'edit-form.html',
      controller: 'EditAdController',
      authenticate: true
    })
    .state('edit-ad.abs', {
      url: '/abs',
      views: {
        'choosenissues': Constant.uiview.choosenissues,
        'textpreview': Constant.uiview.textpreview
      }
    })

    .state('descr-ad', {
      url: '/descr-ad/:id/:isEditMode',
      templateUrl: 'ad-descr.html',
      controller: 'AdDescrController',
      authenticate: true
    })
    .state('category-ad', {
      url: '/category-ad/:id/:isEditMode',
      templateUrl: 'ad-category.html',
      controller: 'AdCategoryController',
      authenticate: true
    })
    .state('issues-ad', {
      url: '/issues-ad/:id/:isEditMode',
      templateUrl: 'ad-issues.html',
      controller: 'AdIssuesController',
      authenticate: true
    })
    .state('delete-ad', {
      url: '/delete-ad/:id',
      controller: 'DeleteAdController',
      authenticate: true
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'forbidden.html',
    })
    .state('login', {
      url: '/login',
      templateUrl: 'login.html',
      controller: 'AuthLoginController'
    })
    .state('logout', {
      url: '/logout',
      controller: 'AuthLogoutController'
    })
    .state('my-ads', {
      url: '/my-ads',
      templateUrl: 'my-ads.html',
      controller: 'MyAdsController',
      authenticate: true
    })
    .state('my-profile', {
      url: '/my-profile/:id',
      templateUrl: 'my-profile.html',
      controller: 'MyProfileController',
      authenticate: true
    })
    .state('sign-up', {
      url: '/sign-up',
      templateUrl: 'sign-up-form.html',
      controller: 'SignUpController',
    })
    .state('sign-up-success', {
      url: '/sign-up/success',
      templateUrl: 'sign-up-success.html'
    });
  $urlRouterProvider.otherwise('all-ads');
}]);