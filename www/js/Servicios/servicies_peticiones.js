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

    .factory('PostSails',function($sails){
    return {
        postResolver: function(estado,servicioid,taxistaid) {
            $sails.post('/taxista/resolver', {
                taxistaid: taxistaid,
                servicioid:servicioid,
                estado:estado
            });
        },

        postAceptar: function(taxistaid,servicioid,latitud,longitud,clienteid) {
            $sails.post('/taxista/aceptarServicio', {
                taxistaid: taxistaid,
                servicioid:servicioid,
                cliente:clienteid,
                latitud:latitud,
                longitud:longitud,
                grupo:1
            });
        },

        postRechazar: function(latRecogida,lngRecogida,latDestino,lngDestino,fechaRecogida,id, animal,dispacitado,idSocio) {
            $sails.post('/taxista/rechazar', {
                idSocio: usuario.id,
                latRecogida: latRecogida,
                lngRecogida: lngRecogida,
                latDestino: latDestino,
                lngDestino: lngDestino,
                fechaRecogida: fechaRecogida,
                id:id,
                animal:animal,
                discapacitado: dispacitado
            });
        },

        postRechazarUltimo: function(latRecogida,lngRecogida,latDestino,lngDestino,fechaRecogida,id, animal,dispacitado,idSocio) {
            $sails.post('/taxista/rechazarUltimo', {
                idSocio: usuario.id,
                latRecogida: latRecogida,
                lngRecogida: lngRecogida,
                latDestino: latDestino,
                lngDestino: lngDestino,
                fechaRecogida: fechaRecogida,
                id:id,
                animal:animal,
                discapacitado: discapacitado
            });
        },

        postOcupar: function(idUsuario,ocupado) {
            console.log("POST " + idUsuario + " ocu " +ocupado);
            $sails.post('/taxista/ocupartaxi', {
                idUsuario:idUsuario,
                ocupado:ocupado
            });
        },

        postMoviendose: function (usuarioId, grupo, latitud, longitud) {
            $sails.post('/taxista/moviendose', {
                user: usuarioId,
                grupo: grupo,
                latitud: latitud,
                longitud: longitud
            });
        },

        postUbicar: function (paradaId, grupo, latitud, longitud, taxistaId) {
            console.log("UBICAnDO " + paradaId + " g " + grupo + " lat " + latitud +" lng " +longitud+" tax " + taxistaId)
            $sails.post('/taxista/ubicar', {
                parada: paradaId,
                grupo: grupo,
                latitud: latitud,
                longitud: longitud,
                taxista: taxistaId
            });
        },

        postDesUbicar: function (paradaId, taxistaId, grupo) {
            $sails.post('/taxista/desubicar', {
                parada: paradaId,
                taxista: taxistaId,
                grupo: grupo
            });
        },

        postResolverServicio: function (servicioid,res) {
            $sails.post('/taxista/resolver', {
                servicioid: servicioid,
                resultado: res
            });
        },

        postDifundirRecord: function (res) {
            $sails.post('/taxista/difundirRecord', res);
        },

        postDifundirClientesRecord: function (res) {
            $sails.post('/taxista/enviarRecordCliente', res);
        }
    }
});
