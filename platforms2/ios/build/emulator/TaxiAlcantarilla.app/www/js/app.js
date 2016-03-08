// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.controllers.taxista', 'starter.controllers.clientes', 'starter.servicies_mapa', 'starter.servicies_peticiones', 'starter.servicies_modelos', 'starter.directives', 'angular-carousel', 'ngSails', 'pasvaz.bindonce', 'angularAudioRecorder', 'angularFileUpload', 'wu.staticGmap', 'ion-datetime-picker'])

.config(['$sailsProvider', function ($sailsProvider) {
        $sailsProvider.url = 'http://taxialcantarilla.es:80';
        io.sails.url = 'http://taxialcantarilla.es:80';
}])
    .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.defaults.useXDomain = true;
            delete $httpProvider.defaults.headers.common['X-Requested-With'];
}
])

.run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })
    .config(function (recorderServiceProvider) {
        recorderServiceProvider
            .forceSwf(false)
            //.setSwfUrl('/lib/recorder.swf')
            .withMp3Conversion(true);
    })
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider


            .state('inicio', {
                url: "/inicio",
                templateUrl: "templates/inicio.html",
                controller: 'loginCtrl'
            })
            .state('taxista', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'TaxistaCtrl'
            })
            .state('taxista.mapaTaxista', {
                url: "/mapaTaxista",
                views: {
                    'menuContent': {
                        templateUrl: "templates/taxistamapa.html",
                        controller: 'MapaTaxistaCtrl'
                    }
                }
            })
            .state('clientemapa', {
                url: "/clientemapa",
                templateUrl: "templates/clientemapa.html",
                controller: 'ClienteMapaCtrl'
            })

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/inicio');
    });