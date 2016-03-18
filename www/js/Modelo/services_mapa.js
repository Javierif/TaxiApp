angular.module("starter.servicies_mapa", [])

    .factory("MapaInstancia", function ($q, $ionicLoading, Peticiones, Usuario, MapaControl) {
    var usuario;

    var paradas;
    var socios;

    var ubicadoText = "Ubicar";
    var mapa;

    var ocupado = false;
    return {
        cargaMapa: function (dataUsuario, dataMapa) {
            var deferral = $q.defer();
            var promise = deferral.promise;
            usuario = dataUsuario;
            mapa = dataMapa;
            var paradamethod = this.obtenParadas();
            var sociomethod = this.obtenSocios();

            $q.all([paradamethod, sociomethod]).then(function () {
                deferral.resolve();
            })
            return deferral.promise;

        },
        obtenParadas: function () {
            $ionicLoading.show({
                template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Dibujando las paradas…'
            });;
            var deferred = $q.defer();
            var paradasPeticion = Peticiones.getParadas(usuario.grupo);
            paradasPeticion.then(function (result) {
                var ubicados = result.ubicados;
                var paradasObtenidas = result.paradas;
                for (parada in paradasObtenidas) {
                    if (!paradasObtenidas[parada].ubicados) {
                        paradasObtenidas[parada].prioridad = 0;
                        paradasObtenidas[parada].ubicados = [];
                    }
                    for (ubicado in ubicados) {
                        console.log("PARADA " + paradasObtenidas[parada].id + " == " + ubicados[ubicado].parada)
                        if (paradasObtenidas[parada].id && paradasObtenidas[parada].id == ubicados[ubicado].parada) {

                            paradasObtenidas[parada].prioridad += 1;
                            paradasObtenidas[parada].ubicados.push(ubicados[ubicado].taxista);
                            if (ubicados[ubicado].taxista.id == usuario.id) {
                                if (paradasObtenidas[parada].id == 1) {
                                    paradasObtenidas[parada].prioridad = 10000;
                                } else {
                                    paradasObtenidas[parada].prioridad = 1000;
                                    ubicadoText = 'Desubicar';
                                }
                            }
                        }
                    }
                    MapaControl.creaParadaMapa(mapa, paradasObtenidas[parada].latitud, paradasObtenidas[parada].longitud);
                }
                $ionicLoading.hide();
                paradas = paradasObtenidas;
                deferred.resolve()
            })
            return deferred.promise;
        },

        obtenSocios: function () {
            $ionicLoading.show({
                template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo los socios taxistas…'
            });
            var deferred = $q.defer();
            var sociosObtenidos = Peticiones.getSocios(usuario.grupo);
            sociosObtenidos.then(function (result) {
                console.log("SOCIOS OBTENIDOS ES " + JSON.stringify(result));
                socios = result;
                for (socio in result) {
                    if (result[socio].id == usuario.id) {
                        usuario.posicion = socio;
                    }
                    MapaControl.creaTaxiMapa(mapa, usuario, result, result[socio], socio);
                }
                deferred.resolve();
            });
            return deferred.promise;
        },


        setOcupado: function(data) {
            ocupado = data;
        },

        getOcupado: function() {
            return ocupado;
        }

        getUbicadoText: function () {
            return ubicadoText;
        },
        getParadas: function () {
            return paradas;
        },
        getSocios: function () {
            return socios;
        }
    }

})

    .factory("MapaControl", function () {
    return {
        creaParadaMapa: function (mapa, latitud, longitud) {
            var posicion = new google.maps.LatLng(latitud, longitud);
            var cityCircle = new google.maps.Circle({
                strokeColor: '#2E9AFE',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#2E9AFE',
                fillOpacity: 0.35,
                map: mapa,
                center: posicion,
                radius: 100
            });

        },
        creaTaxiMapa: function (mapa, usuario, socios, taxista, idListado) {
            var posicion = new google.maps.LatLng(taxista.latitud, taxista.longitud);
            var icon;
            if (socios[idListado].conectado || socios[idListado].id == usuario.id) {
                icon = './img/iconmap/taxi'+taxista.numerotaxi+'.png'
            } else {
                icon = 'null'
            }
            var marcador = new google.maps.Marker({
                position: new google.maps.LatLng(taxista.latitud, taxista.longitud),
                icon: icon,
                map: mapa
            });
            // console.log("MARCADOR " + marcador + "ID LIST " + idListado)
            socios[idListado].marcador = marcador;
        },
        ubica: function (paradas, socios, paradaRecibida, socioRecibido) {
            console.log("PRIMERA VEZ DENTRO")
            for (parada in paradas) {
                if (paradas[parada].id == paradaRecibida) {
                    console.log("2");
                    for (socio in socios) {
                        if (socios[socio].id == socioRecibido) {
                            paradas[parada].ubicados.push(socios[socio]);
                            if (paradas[parada].id == 1) {
                                paradas[parada].prioridad = 10000;
                            } else {
                                paradas[parada].prioridad = 1000;
                            }
                            break;
                        }

                    }
                    break;
                }
            }
        },
        borraUbicacion: function (paradas, socios, paradaRecibida, socioRecibido) {
            for (parada in paradas) {
                if (paradas[parada].id == paradaRecibida) {
                    for (ubicado in paradas[parada].ubicados) {
                        if (paradas[parada].ubicados[ubicado].id == socioRecibido) {
                            paradas[parada].ubicados.splice(ubicado, 1);
                            paradas[parada].prioridad = paradas[parada].ubicados.length;
                        }
                    }

                }
            }
        },
    }
})
