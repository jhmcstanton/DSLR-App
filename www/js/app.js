// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('dslr', ['ionic', 'dslr.controllers'])

.run(function($ionicPlatform, $ionicPopup) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.keyframes', {
    url: '/keyframe_list',
    views: {
      'menuContent': {
        templateUrl: 'templates/keyframe_list.html',
        controller: 'KeyframeListCtrl'
      }
    }  
  })
 .state('app.single_keyframe', {
    url: '/add_keyframe',
    views: {
      'menuContent': {
        templateUrl: 'templates/add_keyframe.html',
        controller: 'AddKeyframeCtrl'
      }
    }  
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/keyframe_list');
});
