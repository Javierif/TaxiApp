angular.module('starter.servicies_peticiones', [])

.factory('server_constantes', function() {
  // Might use a resource here that returns a JSON arra

    var constantes = {
        URL : "http://localhost:1337",
        URL_API : "/api/v1",
        URL_INICISIOSESION: "/iniciosesion",
        URL_REGISTRO: "/alta",
        URL_COMERCIOS: "/comercios",
        URL_DESCARGAOFERTAS: "/ofertas",
        URL_GUARDAPERFIL: "/perfil",
        URL_OFERTAOBSERVADA: "/oferta/observada",
        URL_OFERTARESERVAR: "/oferta/reserva",
        URL_COMPRA: "/compra",
        URL_MISRESERVAS: "/cliente/reservas",

        SERVER_CODIGO: "codigo",
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

  return {
    all: function() {
      return constantes;
    },
    get: function(constante) {
        return constantes[constante];
    }
  }
})

.factory('Peticiones', function(server_constantes,$http,$q) {
   return {

    login: function(correo) {
        var urls = server_constantes.all();
        var peticionjson = {};
        peticionjson[urls.SERVER_EMAIL] = correo;
        var deferred = $q.defer();
        $http.post(urls.URL+urls.URL_API+urls.URL_INICISIOSESION, peticionjson)
            .success(function(respuesta){
             //   window.plugins.toast.showLongBottom(respuesta.error_msg, function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
                deferred.resolve({
                    error: respuesta.error,
                    error_msg: respuesta.error_msg,
                    email : respuesta.email,
                    codigo : respuesta.codigo,
                    codigoPostal : respuesta.codigoPostal,
                    sexo : respuesta.sexo,
                    anoNacimiento : respuesta.anoNacimiento,
                    telefono : respuesta.telefono,
                    codigoFarmacia : respuesta.codigoFarmacia
                });
            }).error(function(error){
                window.plugins.toast.showLongBottom(error.error_msg,
                    function(a){
                        console.log('toast success: ' + a)
                    },
                    function(b){alert(
                    'toast error: ' + b)
                    });
            });
        return deferred.promise;
    },

    //////////REGISTRAR/////////
    registrar: function(cp,correo,fnac,sex,telf,codfarma) {
        var urls = server_constantes.all();
        var peticionjson = {};
        var deferred = $q.defer();
        peticionjson[urls.SERVER_CODPOSTAL]=cp;
        peticionjson[urls.SERVER_EMAIL]=correo;
        peticionjson[urls.SERVER_ANONACIMIENTO]=fnac;
        peticionjson[urls.SERVER_SEXO]=sex;
        peticionjson[urls.SERVER_TELEFONO]=telf;
        peticionjson[urls.SERVER_CODFARMACIA]="";
        peticionjson[urls.SERVER_CODFARMACIA]=codfarma;
        $http.post(urls.URL+urls.URL_API+urls.URL_REGISTRO, peticionjson)
            .success(function(result){
                window.plugins.toast.showLongBottom(result.error_msg,
                    function(a){
                        console.log('toast success: ' + a)
                    },
                    function(b){
                    alert('toast error: ' + b)
                    });
                 deferred.resolve({
                    error: result.error,
                    error_msg: result.error_msg,
                    codigo : result.codigo
                });
            }).error(function(result){
                window.plugins.toast.showLongBottom(
                    result.error_msg,
                    function(a){console.log('toast success: ' + a)},
                    function(b){alert('toast error: ' + b)});

            });
        return deferred.promise;
    },

    comercios: function(codigo) {
        var urls = server_constantes.all();
        var peticionjson = {};
        var deferred = $q.defer();
        peticionjson[urls.SERVER_CODIGO]= codigo;
        $http.post(urls.URL+urls.URL_API+urls.URL_COMERCIOS, peticionjson)
            .success(function(respuesta){
             //   window.plugins.toast.showLongBottom(respuesta.error_msg, function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
                deferred.resolve({
                    error:false,
                    resultado:respuesta
                });
            alert(respuesta.dominio);
            }).error(function(error){
                window.plugins.toast.showLongBottom(error.error_msg,
                    function(a){
                        console.log('toast success: ' + a)
                    },
                    function(b){
                        alert('toast error: ' + b)
                    });
            });
        return deferred.promise;
    },
       ///////////OFERTAS/////////
    getOfertasGenerales: function() {
        var urls = server_constantes.all();
        var deferred = $q.defer();
        $http.get(urls.URL+"/getcupones")
            .success(function(respuesta){
                deferred.resolve(respuesta);
        }).error(function(error){
               console.log(error);
        });
        return deferred.promise;
    },

    ofertas: function(codigo){
        var urls = server_constantes.all();
        var peticionjson = {};
        var deferred = $q.defer();
        peticionjson[urls.SERVER_CODIGO]= codigo;
        $http.post(urls.URL+urls.URL_API+urls.URL_DESCARGAOFERTAS,peticionjson)
        .success(
            function(result){
                deferred.resolve({
                    error:false,
                    resultado:result
                });
            }).error(
            function(result){
                window.plugins.toast.showLongBottom(
                    result.error_msg,
                    function(a){console.log('toast success: ' + a)},
                    function(b){alert('toast error: ' + b)}
                );
                deferred.resolve({
                    error:true
                });
            });
            return deferred.promise;
    },
       /////////////CUPON/////////////////
    obtenerCupon: function(idcomponente,codigocliente,cantidad) {
        var urls = server_constantes.all();
        var peticionjson = {};
        var deferred = $q.defer();
        peticionjson[urls.SERVER_CODIGO]=codigocliente;
        peticionjson[urls.SERVER_COMPONENTEOFERTA]=idcomponente;
        peticionjson[urls.SERVER_UNIDADES]=cantidad;
        $http.post(urls.URL+urls.URL_API+urls.URL_COMPRA, peticionjson)
            .success(function(result){
                 deferred.resolve({
                    error: result.error,
                    error_msg: result.error_msg,
                    url: result.url
                });
            }).error(function(result){
                window.plugins.toast.showLongBottom(
                    result.error_msg,
                    function(a){console.log('toast success: ' + a)},
                    function(b){alert('toast error: ' + b)});

            });
        return deferred.promise;
    },
        ////////////PERFIL////////////
    perfil: function(cp,correo,fnac,sex,telf,codfarma) {
        var urls = server_constantes.all();
        var peticionjson = {};
        var deferred = $q.defer();
        peticionjson[urls.SERVER_CODPOSTAL]=cp;
        peticionjson[urls.SERVER_EMAIL]=correo;
        peticionjson[urls.SERVER_ANONACIMIENTO]=fnac;
        peticionjson[urls.SERVER_SEXO]=sex;
        peticionjson[urls.SERVER_TELEFONO]=telf;
        peticionjson[urls.SERVER_CODFARMACIA]="";
        peticionjson[urls.SERVER_CODFARMACIA]=codfarma;
        $http.post(urls.URL+urls.URL_API+urls.URL_GUARDAPERFIL, peticionjson)
            .success(function(result){
                window.plugins.toast.showLongBottom(result.error_msg, function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
                 deferred.resolve({
                    error: result.error,
                    error_msg: result.error_msg,
                    codigo : result.codigo
                });
            }).error(function(result){
                window.plugins.toast.showLongBottom(
                    result.error_msg,
                    function(a){console.log('toast success: ' + a)},
                    function(b){alert('toast error: ' + b)});

            });
        return deferred.promise;
    }

   }
});
