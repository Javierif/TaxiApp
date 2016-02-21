angular.module("starter.servicies_modelos", [])

.factory("NombresGuardado", function () {
    var nombres = {
        usuario: "user",
        comercios: "comercios"
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

.factory('Ofertas', function (server_constantes) {
    // Might use a resource here that returns a JSON arra
    var viendoOferta = {};
    var ofertas = [];

    return {
        getofertas: function () {
            return ofertas;
        },
        getoferta: function (numoferta) {
            return ofertas[numoferta];
        },
        addofertas: function (oferta) {
            ofertas.push(oferta);
        },
        getViendoOferta: function () {
            return viendoOferta;
        },
        setViendoOferta: function (oferta) {
            viendoOferta = oferta;
        },
        decompilajson: function (json) {
            ofertas = [];
            var ofertas_json = json.ofertas;
            var urls = server_constantes.all();
            for (var ofertadata in ofertas_json) {
                oferta = {
                    comercioAsociado: "",
                    titulo: ofertas_json[ofertadata].nombre,
                    descripcionLarga: ofertas_json[ofertadata].descripcion,
                    descuento: ofertas_json[ofertadata].descuento,
                    simbolo: ofertas_json[ofertadata].tipoDescuento.simbolo,
                    fechaActualizacion: ofertas_json[ofertadata].fechaModificacion.date,
                    mayorTiempo: ofertas_json[ofertadata].fechaCaducidad.date,
                    identificador: ofertas_json[ofertadata].id,
                    componentes: [],
                    imagenesProducto: []
                };
                var componentes = ofertas_json[ofertadata].componentesOferta;
                for (var componente in componentes) {
                    componente = {
                        identificador: componentes[componente].id,
                        titulo: componentes[componente].titulo,
                        tiempoCaducidad: componentes[componente].fechaCaducidad.date,
                        descuento: componentes[componente].descuento,
                        simbolo: ofertas_json[ofertadata].tipoDescuento.simbolo,
                        descripcionComponente: componentes[componente].descuentoTexto,
                        unidadesDisponi: componentes[componente].disponibles,
                        unidadesReser: componentes[componente].reservadas,
                        imagenDireccion: urls.URL + componentes[componente].imagen.url + "m/" +
                            componentes[componente].imagen.nombre,
                        maximasReservas: componentes[componente].unidadesMaximaReserva
                    };
                    oferta.componentes.push(componente);
                }
                var imagenes = ofertas_json[ofertadata].producto.imagenes;
                for (var imagen in imagenes) {
                    imagenurl = urls.URL + imagenes[imagen].url + "m/" + imagenes[imagen].nombre;
                    oferta.imagenesProducto.push(imagenurl);
                }
                ofertas.push(oferta);
            }

        }
    }
})

.factory('Comercios', function (NombresGuardado) {
    // Might use a resource here that returns a JSON arra
    var comercios = [];

    return {
        getComercios: function () {
            return comercios;
        },
        getComercio: function (numcomercio) {
            return comercios[numcomercio];
        },
        decompilajson: function (json) {
            /*
             *Sirve para limpiar el array de comercios de comercios anteriores guardados.
             */
            comercios = [];
            alert("dentro comer");
            var comercios_json = json.comercios;
            alert("COMERCIOS " + comercios_json);
            for (var comerciosdata in comercios_json) {
                comercio = {
                    id: comercios_json[comerciosdata].id,
                    codigo: comercios_json[comerciosdata].codigo,
                    activo: comercios_json[comerciosdata].activo,
                    titular: comercios_json[comerciosdata].titular,
                    direccion: comercios_json[comerciosdata].direccion,
                    codigopostal: comercios_json[comerciosdata].codigoPostal,
                    localidad: comercios_json[comerciosdata].localidad,
                    municipio: comercios_json[comerciosdata].municipio,
                    telefono: comercios_json[comerciosdata].telefono,
                    latitud: comercios_json[comerciosdata].latitud,
                    longitud: comercios_json[comerciosdata].longitud
                };
                comercios.push(comercio);
            }
        },
        loadcomercios: function () {
            var cargado = window.localStorage[NombresGuardado.get["comercios"]];
            if (cargado != undefined && cargado != "vacio") {
                var dat = new Date();
                var fechaactual = dat.getTime();
                var fechacomercios = window.localStorage[NombresGuardado.get["comerciosdate"]];
                try {
                    if ((fechaactual - fechacomercios) < 7200000) {
                        var comerciosparseados = JSON.parse(cargado);
                        comercios = comerciosparseados;
                        return false;
                    }
                } catch (e) {
                    alert(e);
                }
            }
            return true;
        },
        savecomercios: function () {
            var fecha = new Date();
            window.localStorage[NombresGuardado.get["comerciosdate"]] = fecha.getTime();
            window.localStorage[NombresGuardado.get["comercios"]] = JSON.stringify(user);
        },
        borrarcomercios: function () {
            window.localStorage[NombresGuardado.get["comercios"]] = "vacio";
        }
    }
});
