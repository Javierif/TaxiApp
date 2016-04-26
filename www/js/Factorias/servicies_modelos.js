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
    var servicio = {
        id:0,
        mascota: false,
        discapacitado: false,
        estiloServicio:false,
        progressValue:0,
        progresstyle:"",
        atendiendo:false,
        latrecogida:false,
        lngrecogida:false,
        latdestino:false,
        lngdestino:false,
        fechaRecogida:false,
        idCliente:0,
    };
    var ocupado = false;
    return {
        getServicio: function() {
            return servicio;
        },
        guardarServicio:function(servicio){
            window.localStorage["servicio"] = servicio;
        },
        compruebaServicio: function() {
            var cargado = window.localStorage["servicio"];
            if (cargado != undefined && cargado != "false") {
                servicio = JSON.parse(cargado);
                console.log(servicio);
                console.log("POS PIJO " + servicio.id);
                return true;
            }
            return false;
        },
        resuelveServicio: function() {
            window.localStorage["servicio"] = false;
        },
        limpiaServicio : function() {
            return {id:0,mascota: false,discapacitado: false,estiloServicio:false,progressValue:0,progresstyle:"",atendiendo:false,latrecogida:false,lngrecogida:false,latdestino:false,lngdestino:false,fechaRecogida:false,idCliente:0};
        }
    }
});
