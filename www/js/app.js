// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.servicies_peticiones', 'starter.servicies_modelos', 'angular-carousel'])

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

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/menu.html",
            controller: 'AppCtrl'
        })
        .state('inicio', {
            url: "/inicio",
            templateUrl: "templates/inicio.html",
            controller: 'inicioCtrl'
        })
        .state('app.login', {
            url: "/login",
            views: {
                'menuContent': {
                    templateUrl: "templates/login.html",
                    controller: 'loginCtrl'
                }
            }
        })
        .state('app.registro', {
            url: "/registro",
            views: {
                'menuContent': {
                    templateUrl: "templates/registro.html",
                    controller: 'RegistroCtrl'
                }
            }
        })
        .state('app.mostradorofertas', {
            url: "/mostradorofertas",
            views: {
                'menuContent': {
                    templateUrl: "templates/mostradorofertas.html",
                    controller: 'MostradorOfertasCtrl'
                }
            }
        })
        .state('app.detalleoferta', {
            url: "/detalleoferta",
            views: {
                'menuContent': {
                    templateUrl: "templates/detalleoferta.html",
                    controller: 'DetalleOfertaCtrl'
                }
            }
        })
        .state('app.perfil', {
            url: "/perfil",
            views: {
                'menuContent': {
                    templateUrl: "templates/perfil.html",
                    controller: 'PerfilCtrl'
                }
            }
        });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/inicio');
});
