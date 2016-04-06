angular.module("starter.servicies_modelos", [])

    .factory("NombresGuardado", function () {
    var nombres = {
        usuario: "user",
        servicio: "servicio"
    }
    return {
        get: function (nombre) {
            return nombres[nombre];
        }
    }
})

    .factory("Usuario", function (NombresGuardado) {
    // Might use a resource here that returns a JSON arra

    var user = {
        codigoCliente: "",
        email: "",
        telefono: "",
        codigoPostal: "",
        fechaNacimiento: "",
        genero: "",
        codigoFarmacia: "",
        codigoDispositivo: ""
    }
    var estado = "Iniciar Sesión"
    return {
        usuario: function () {
            return user;
        },
        get: function (atributo) {
            return user[atributo];
        },
        set: function (atributo, value) {
            user[atributo] = value;
        },
        loadusuario: function () {
            var cargado = window.localStorage[NombresGuardado.get["usuario"]];
            if (cargado != undefined && cargado != "vacio") {
                console.log(JSON.stringify(cargado));
                user = JSON.parse(cargado);
                return true;
            }
            return false;
        },
        saveusuario: function () {
            window.localStorage[NombresGuardado.get["usuario"]] = JSON.stringify(user);
        },
        borrarusuario: function () {
            window.localStorage[NombresGuardado.get["usuario"]] = "vacio";
        },
        getEstado: function () {
            return estado;
        },
        setEstado: function (data) {
            estado = data;
        }
    }
})

    .factory('Servicio', function (NombresGuardado) {
    // Might use a resource here that returns a JSON arra
    var servicio = {};
    var ocupado = false;
    return {
        getServicio: function() {
            return servicio;
        },
        guardarServicio:function(servicio){
            var rlat = servicio.recogida.lat();
            var rlng = servicio.recogida.lng();
            var dlat;
            var dlng;
            if(destino) {
                dlat = servicio.destino.lat();
                dlng = servicio.destino.lng();
            }
            var servicioSave = {
                servicioid:servicio.id,recogidaLat:rlat,recogidaLng:rlng,destinoLat:dlat,destinoLng:dlng};
            window.localStorage["servicio"] = JSON.stringify(servicioSave);
        },
        guardarServicioCliente:function(trackear,servicioid,latRecogida,lngRecogida,latitud,longitud){
            servicio = {servicioid:servicioid,taxistaid:trackear,recogidaLat:latRecogida,recogidaLng:lngRecogida,destinoLat:latitud,destinoLng:longitud};
            window.localStorage["servicio"] = JSON.stringify(servicio);
        },
        compruebaServicio: function() {
            var cargado = window.localStorage["servicio"];
            if (cargado != undefined && cargado != "false") {
                console.log(JSON.stringify(cargado));
                servicio = JSON.parse(cargado);
                return true;
            }
            return false;
        },
        resuelveServicio: function() {
            window.localStorage["servicio"] = false;
        }
    }
});
