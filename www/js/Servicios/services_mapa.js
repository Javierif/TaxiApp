angular.module("starter.servicies_mapa", [])

    .factory("MapaInstancia", function ($q, $ionicLoading, Peticiones, Usuario, MapaControl) {
    var usuario;

    var listadoGeneral;
    var paradas;
    var socios;

    var ubicadoText = "Ubicar";
    var mapa;
    return {
        cargaMapa: function (dataUsuario, dataMapa) {
            var deferral = $q.defer();
            var promise = deferral.promise;
            usuario = dataUsuario;
            mapa = dataMapa;
            var sociomethod = this.obtenSocios();
            var paradamethod = this.obtenParadas();


            $q.all([sociomethod,paradamethod]).then(function () {
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
                var paradasConUbicados = result.paradas;
                var listaGeneral = result.listaGeneral;
                for(taxi in listaGeneral) {
                    socios[usuario.posicion].marcador = MapaControl.creaTaxiMapa(mapa,listaGeneral[taxi]);
                }
                for(parada in paradasConUbicados) {
                    paradasConUbicados[parada].prioridad = 0;
                    MapaControl.creaParadaMapa(mapa,paradasConUbicados[parada].latitud,paradasConUbicados[parada].longitud)
                    for(ubicado in paradasConUbicados[parada].taxistaUbicado) {
                        paradasConUbicados[parada].prioridad += 1;
                        if(paradasConUbicados[parada].taxistaUbicado[ubicado].id = usuario.id) {
                            paradasConUbicados[parada].priodidad = 1000;
                        }
                    }
                }

                $ionicLoading.hide();
                paradas = paradasConUbicados;
                listadoGeneral = listaGeneral;
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
                socios = result.socios;
                for(socio in socios) {
                    if(socios[socio].id == usuario.id) {
                        usuario.posicion = socio;
                        break;
                    }
                }
                deferred.resolve();
            });
            return deferred.promise;
        },
        creaParadaMapa: function (latitud, longitud) {
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
        creaTaxiMapa: function (taxista) {
            var posicion = new google.maps.LatLng(taxista.latitud, taxista.longitud);
            var icon;
            icon = './img/activo/taxi'+taxista.numerotaxi+'.png'
            var marcador = new google.maps.Marker({
                position: new google.maps.LatLng(taxista.latitud, taxista.longitud),
                icon: icon,
                map: mapa
            });
            // console.log("MARCADOR " + marcador + "ID LIST " + idListado)
            return marcador;
        },
        ubica: function (taxista,parada) {
            for(p in paradas) {
                if(paradas[p].id == parada.id) {
                    paradas[p].taxistaUbicado.push(taxista);
                    paradas[p].prioridad += 1;
                    if(taxista.id == usuario.id) {
                        paradas[p].prioridad = 1000;
                    }
                    break;
                }
            }
        },
        borraUbicacion: function (socioRecibido) {
            for (p in paradas) {
                for (ubicado in paradas[p].taxistaUbicado) {
                    if (paradas[p].taxistaUbicado[ubicado].id == socioRecibido) {
                        paradas[p].taxistaUbicado.splice(ubicado, 1);
                        paradas[p].prioridad = paradas[parada].ubicados.length;
                    }
                }
            }
        },

        getUbicadoText: function () {
            return ubicadoText;
        },
        getListadoGeneral: function() {
            return listadoGeneral;
        },
        getParadas: function () {
            return paradas;
        },
        getSocios: function () {
            return socios;
        },
        limpia: function(array,elemento) {
            var encontrado = {enarray:false,posicion:0};
            for(taxi in array) {
                if(array[taxi].id == elemento.id) {
                    encontrado.enarray = true;
                    encontrado.posicion = taxi;
                    break;
                }
            }
            if(encontrado.enarray) {
                array.splice(encontrado.posicion,1);
            }
        },
        pushTaxi: function(taxi) {
            limpia(listadoGeneral,taxi);
            listadoGeneral.push(taxi);
        },
        conectaTaxi: function(taxi) {
            for (socio in <socios) {
                if (taxi.id == socios[socio].id) {
                    socios[socio].conectado = taxi.conectado;
                    if (taxi.conectado) {
                        MapaControl.borraUbicacion(taxi);
                        limpia(listadoGeneral,taxi);
                        listadoGeneral.push[taxi];
                        socios[usuario.posicion].marcador = MapaControl.creaTaxiMapa(mapa,taxi);
                        socios[socio].marcador.setIcon('./img/activo/taxi'+socios[socio].numerotaxi+'.png');

                    } else {
                        MapaControl.borraUbicacion(taxi);
                        limpia(listadoGeneral,taxi);
                        socios[socio].marcador.setIcon('null');

                    }
                    break;
                }
            }
            return socios;
        },
        desconectaTaxi: function(taxi) {
            limpia(listadoGeneral,taxi);
            MapaControl.borraUbicacion(taxi);
        },
        mueve: function(taxi) {
            for (socio in socios) {
                if (socios[socio].id == resp.id) {
                    var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
                    socios[socio].marcador.setPosition(posicion);
                    break;
                }
            }
            return socios;
        }
        ocupar:function() {
        usuario.ocupado = !usuario.ocupado;
        if(usuario.ocupado){
        socios[usuario.posicion].marcador.setIcon('./img/ocupado/taxi'+socios[socio].numerotaxi+'.png')
    }
},
             actualizaMiPosicon: function(pos) {
    socios[usuario.posicion].marcador.setPosition(pos);
    return socios;
}
}

});
