angular.module('starter.servicies_peticiones', [])

.factory('server_constantes', function () {

    var constantesTaxistas = {
        GRUPO: 'grupo',
        EMAIL: "email",
        PASSWORD: "password",
        PARADA: 'parada',
        LATITUD: 'latitud',
        LONGITUD: 'longitud',
        TAXISTA: 'taxista',
        NOMBRE: 'nombre',
        APELLIDOS: 'apellidos',
        SPAM: 'spam',
        TELEFONO: 'telefono'
    }

    var urls = {
        URL: "http://taxialcantarilla.es",
        LOGIN: '/login',
        CHECKCORREO: '/checkcorreo',
        GETSOCIOS: "/taxista/getSocios/",
        GETPARADAS: "/taxista/getParadas/",
        REGISTRO: '/registro'
    }
    return {
        allTaxista: function () {
            return constantesTaxistas;
        },
        allUrls: function () {
            return urls;
        }
    }
})

.factory('Peticiones', function (server_constantes, $http, $q) {
    return {
        login: function (correo, password) {
            var urls = server_constantes.allUrls();
            var constante = server_constantes.allTaxista();
            var peticionjson = {};
            peticionjson[constante.EMAIL] = correo;
            peticionjson[constante.PASSWORD] = password;
            var deferred = $q.defer();
            console.log(" URL " + urls.URL + " LOGIN " + urls.LOGIN);
            $http.post(urls.URL + urls.LOGIN, peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function(response, status, headers, config) {
            });
            return deferred.promise;
        },
        getSocios: function (grupo) {
            var urls = server_constantes.allUrls();
            var deferred = $q.defer();
            $http.get(urls.URL + urls.GETSOCIOS + grupo)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },
        getParadas: function (grupo) {
            var urls = server_constantes.allUrls();
            var deferred = $q.defer();
            $http.get(urls.URL + urls.GETPARADAS + grupo)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },
        compruebaCorreo: function (correo) {
            var urls = server_constantes.allUrls();
            var constante = server_constantes.allTaxista();
            var peticionjson = {};
            peticionjson[constante.EMAIL] = correo;
            var deferred = $q.defer();
            console.log(" URL " + urls.URL + " checkcorreo " + urls.CHECKCORREO);
            $http.post(urls.URL + urls.CHECKCORREO, peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {});
            return deferred.promise;
        },
        registro: function (nombre, apellidos, correo, password, spam, telefono) {
            var urls = server_constantes.allUrls();
            var constante = server_constantes.allTaxista();
            var peticionjson = {};
            peticionjson[constante.NOMBRE] = nombre;
            peticionjson[constante.APELLIDOS] = apellidos;
            peticionjson[constante.SPAM] = spam;
            peticionjson[constante.PASSWORD] = password;
            peticionjson[constante.TELEFONO] = telefono;
            peticionjson[constante.EMAIL] = correo;
            var deferred = $q.defer();
            $http.post(urls.URL + urls.REGISTRO, peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {});
            return deferred.promise;
        }
    }
})

.factory('PeticiosRtc', function (server_constantes, $q) {


});
