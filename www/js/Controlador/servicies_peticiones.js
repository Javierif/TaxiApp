angular.module('starter.servicies_peticiones', [])

.factory('server_constantes', function () {
    // Might use a resource here that returns a JSON arra

    var constantes = {
        URL: "http://localhost:1337",
        URL_API: "/api/v1",
        URL_INICISIOSESION: "/iniciosesion",
        URL_REGISTRO: "/alta",
        URL_COMERCIOS: "/comercios",
        URL_DESCARGAOFERTAS: "/ofertas",
        URL_GUARDAPERFIL: "/perfil",
        URL_OFERTAOBSERVADA: "/oferta/observada",
        URL_OFERTARESERVAR: "/oferta/reserva",
        URL_COMPRA: "/compra",
        URL_MISRESERVAS: "/cliente/reservas",

        SERVER_CODIGO: "codigoCliente",
        SERVER_EMAIL: "email",
        SERVER_TELEFONO: "telefono",
        SERVER_CODPOSTAL: "codigoPostal",
        SERVER_ANONACIMIENTO: "anoNacimiento",
        SERVER_SEXO: "sexo",
        SERVER_CODFARMACIA: "codigoFarmacia",
        SERVER_ERRORMSG: "error_msg",
        SERVER_ACTIVO: "activo",
        SERVER_ID: "id",
        SERVER_TITULAR: "titular",
        SERVER_DIRECCION: "direccion",
        SERVER_LOCALIDAD: "localidad",
        SERVER_MUNICIPIO: "municipio",
        SERVER_LATITUD: "latitud",
        SERVER_LONGITUD: "longitud",
        SERVER_WIFI: "wifi",
        SERVER_MAC: "mac",
        SERVER_LOCALIZARGPS: "localizarGPS",
        SERVER_LOCALIZARWIFI: "localizarWIFI",
        SERVER_COMERCIO: "comercio",
        SERVER_COMERCIOS: "comercios",
        SERVER_OFERTASCOMERCIO: "ofertasComercio",
        SERVER_IMAGENES: "imagenes",
        SERVER_PRODUCTO: "producto",
        SERVER_DOMINIO: "dominio",
        SERVER_URL: "url",
        SERVER_NOMBRE: "nombre",
        SERVER_TITULO: "titulo",
        SERVER_FECHACADUCIDAD: "fechaCaducidad",
        SERVER_DESCUENTO: "descuento",
        SERVER_TIPODESCUENTO: "tipoDescuento",
        SERVER_SIMBOLO: "simbolo",
        SERVER_DESCRIPCION: "descripcion",
        SERVER_DESCUENTOTEXTO: "descuentoTexto",
        SERVER_DISPONIBLES: "disponibles",
        SERVER_RESERVADAS: "reservadas",
        SERVER_UNIDADESMAXIMARESERVA: "unidadesMaximaReserva",
        SERVER_IMAGEN: "imagen",
        SERVER_FECHAMODIFICACION: "fechaModificacion",
        SERVER_COMPONENTESOFERTA: "componentesOferta",
        SERVER_COMPONENTEOFERTA: "componenteOferta",
        SERVER_OFERTAS: "ofertas",
        SERVER_OFERTA: "oferta",
        SERVER_UNIDADES: "unidades",
        SERVER_OPERACION: "operacion"
    }

    var constantesTaxistas = {
        URL: "http://localhost:1337",
        GRUPO: 'grupo',
        PARADA: 'parada'
    }
    return {
        all: function () {
            return constantes;
        },
        get: function (constante) {
            return constantes[constante];
        },
        allTaxista: function () {
            return constantesTaxistas;
        }
    }
})

.factory('Peticiones', function (server_constantes, $http, $q) {
    return {

        login: function (correo, password) {
            var urls = server_constantes.all();
            var peticionjson = {};
            peticionjson[urls.SERVER_EMAIL] = correo;
            peticionjson['password'] = password;
            var deferred = $q.defer();
            $http.post(urls.URL + "/login", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {});
            return deferred.promise;
        },
        getSocios: function (grupo) {
            var urls = server_constantes.all();
            var deferred = $q.defer();
            $http.get(urls.URL + "/taxista/getSocios/" + grupo)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },
        getParadas: function (grupo) {
            var urls = server_constantes.all();
            var deferred = $q.defer();

            $http.get(urls.URL + "/taxista/getParadas/" + grupo)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },
        ubicar: function (idParada, grupo) {
            var contastes = server_constantes.allTaxista();
            var peticionjson = {};
            peticionjson[contastes.PARADA] = idParada;
            peticionjson[contastes.GRUPO] = grupo;

            var deferred = $q.defer();
            $http.post(urls.URL + "/taxista/ubicar", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {});
            return deferred.promise;

        },
        //////////REGISTRAR/////////
        registrar: function (id, cp, email, fnac, sex, telf, codfarma, nombre) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['usuario'] = id;
            peticionjson[urls.SERVER_CODPOSTAL] = cp;
            peticionjson[urls.SERVER_EMAIL] = email;
            peticionjson[urls.SERVER_ANONACIMIENTO] = fnac;
            peticionjson[urls.SERVER_SEXO] = sex;
            peticionjson[urls.SERVER_TELEFONO] = telf;
            peticionjson[urls.SERVER_CODFARMACIA] = codfarma;
            peticionjson['nombre'] = nombre
            $http.post(urls.URL + "/registroapp", peticionjson)
                .success(function (result) {
                    deferred.resolve(result);
                }).error(function (result) {

                });
            return deferred.promise;
        },


        getReservas: function (idUsuario) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['idUsuario'] = idUsuario;
            $http.post(urls.URL + "/getreservasapp", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },

        reservar: function (idCupon, codigoCliente, cantidad, farmacia) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['usuario'] = codigoCliente;
            peticionjson['cantidad'] = cantidad;
            peticionjson['idCupon'] = idCupon;
            peticionjson['farmacia'] = farmacia
            $http.post(urls.URL + "/reservar", peticionjson)
                .success(function (result) {
                    deferred.resolve(result);
                }).error(function (result) {

                });
            return deferred.promise;
        },
        ///////////OFERTAS/////////
        getOfertasGenerales: function (idUsuario) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['idUsuario'] = idUsuario;
            $http.post(urls.URL + "/getcupones", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },

        getOfertasEspecificas: function (latitud, longitud, idUsuario) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson[urls.SERVER_LATITUD] = latitud;
            peticionjson[urls.SERVER_LONGITUD] = longitud;
            peticionjson['idUsuario'] = idUsuario
            $http.post(urls.URL + "/getcuponesespecifico", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },

        getFarmacias: function (latitud, longitud) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson[urls.SERVER_LATITUD] = latitud;
            peticionjson[urls.SERVER_LONGITUD] = longitud;
            $http.post(urls.URL + "/getfarmacias", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },

        getFarmacia: function (idFarmacia) {
            var urls = server_constantes.all();
            var deferred = $q.defer();
            $http.get(urls.URL + "/getfarmacia/" + idFarmacia)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },

        getOferta: function (idOferta, usuario) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['idCupon'] = idOferta;
            peticionjson['idUsuario'] = usuario;
            $http.post(urls.URL + "/getcupon", peticionjson)
                .success(function (respuesta) {
                    deferred.resolve(respuesta);
                }).error(function (error) {
                    console.log(error);
                });
            return deferred.promise;
        },
        /////////////CUPON/////////////////
        obtenerCupon: function (idCupon, codigocliente, cantidad) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['idCupon'] = idCupon;
            peticionjson[urls.SERVER_CODIGO] = codigocliente;
            peticionjson[urls.SERVER_UNIDADES] = cantidad;
            $http.post(urls.URL + "/codigocupon", peticionjson)
                .success(function (result) {
                    deferred.resolve({
                        url: result.img,
                        codigo: result.codigo
                    });
                }).error(function (result) {

                });
            return deferred.promise;
        },
        ////////////PERFIL////////////
        perfil: function (id, cp, email, fnac, sex, telf, codfarma, nombre) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['usuario'] = id;
            peticionjson[urls.SERVER_CODPOSTAL] = cp;
            peticionjson[urls.SERVER_EMAIL] = email;
            peticionjson[urls.SERVER_ANONACIMIENTO] = fnac;
            peticionjson[urls.SERVER_SEXO] = sex;
            peticionjson[urls.SERVER_TELEFONO] = telf;
            peticionjson[urls.SERVER_CODFARMACIA] = codfarma;
            peticionjson['nombre'] = nombre
            $http.put(urls.URL + "/actualizaPerfil", peticionjson)
                .success(function (result) {
                    window.plugins.toast.showLongBottom(result.error_msg, function (a) {
                        console.log('toast success: ' + a)
                    }, function (b) {
                        alert('toast error: ' + b)
                    });
                    deferred.resolve({
                        error: result.error,
                        error_msg: result.error_msg,
                        codigo: result.codigo
                    });
                }).error(function (result) {
                    window.plugins.toast.showLongBottom(
                        result.error_msg,
                        function (a) {
                            console.log('toast success: ' + a)
                        },
                        function (b) {
                            alert('toast error: ' + b)
                        });

                });
            return deferred.promise;
        },
        actualizaFarmacia: function (usuario, codfarma) {
            var urls = server_constantes.all();
            var peticionjson = {};
            var deferred = $q.defer();
            peticionjson['usuario'] = usuario;
            peticionjson[urls.SERVER_CODFARMACIA] = codfarma;
            $http.put(urls.URL + "/actualizarFarmacia", peticionjson)
                .success(function (result) {
                    window.plugins.toast.showLongBottom(result.error_msg, function (a) {
                        console.log('toast success: ' + a)
                    }, function (b) {
                        alert('toast error: ' + b)
                    });
                    deferred.resolve({
                        error: result.error,
                        error_msg: result.error_msg,
                        codigo: result.codigo
                    });
                }).error(function (result) {
                    window.plugins.toast.showLongBottom(
                        result.error_msg,
                        function (a) {
                            console.log('toast success: ' + a)
                        },
                        function (b) {
                            alert('toast error: ' + b)
                        });

                });
            return deferred.promise;
        }

    }
});
