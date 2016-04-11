angular.module("starter.servicies_mapa", [])

    .factory("MapaInstancia", function ($q, $ionicLoading, Peticiones, Usuario) {
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
            var instancia = this;
            paradasPeticion.then(function (result) {
                var paradasConUbicados = result.paradas;
                var listaGeneral = result.taxistasGeneral;
                console.log("PARADA CON UBICADO "+JSON.stringify(paradasConUbicados))
                for(taxi in listaGeneral) {
                    for(socio in socios) {
                        if(socios[socio].id == listaGeneral[taxi].id) {
                            socios[usuario.posicion].marcador = instancia.creaTaxiMapa(listaGeneral[taxi]);
                            break;
                        }

                    }
                }
                for(parada in paradasConUbicados) {
                    paradasConUbicados[parada].prioridad = 0;
                    instancia.creaParadaMapa(paradasConUbicados[parada].latitud,paradasConUbicados[parada].longitud)
                    paradasConUbicados[parada].ubicados = [];
                    for(ubicado in paradasConUbicados[parada].taxistaUbicado) {
                        paradasConUbicados[parada].prioridad += 1;
                        paradasConUbicados[parada].ubicados.push(this.getSocio(paradasConUbicados[parada].taxistaUbicado[ubicado]));
                        if(paradasConUbicados[parada].taxistaUbicado[ubicado] = usuario.id) {
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
        ubica: function (parada,taxista) {
            for(p in paradas) {
                if(paradas[p].id == parada) {
                    var taxi = this.getSocio(taxista);
                    paradas[p].ubicados.push(taxi);
                    paradas[p].prioridad += 1;
                    if(taxista == usuario.id) {
                        paradas[p].prioridad = 1000;
                    }
                    break;
                }
            }
            return paradas;
        },
        borraUbicacion: function (socioRecibido) {
            for (p in paradas) {
                for (ubicado in paradas[p].ubicados) {
                    if (paradas[p].ubicados[ubicado].id == socioRecibido) {
                        paradas[p].ubicados.splice(ubicado, 1);
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
        getSocio: function(idSocio) {
            var devolver = false;
            for(socio in socios) {
                if(socios[socio].id == idSocio) {
                    devolver = socios[socio];
                    break;
                }
            }
            return devolver;
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
            for (socio in socios) {
                if (taxi.id == socios[socio].id) {
                    socios[socio].conectado = taxi.conectado;
                    if (taxi.conectado) {
                        console.log("EL TAXISTA CONECTADO ES " + socios[socio]);
                        this.borraUbicacion(socios[socio]);
                        this.limpia(listadoGeneral,socios[socio]);
                        listadoGeneral.push(socios[socio]);
                        socios[socio].marcador =this.creaTaxiMapa(mapa,socios[socio]);
                        socios[socio].marcador.setIcon('./img/activo/taxi'+socios[socio].numerotaxi+'.png');
                    } else {
                        this.borraUbicacion(socios[socio]);
                        this.limpia(listadoGeneral,socios[socio]);
                        socios[socio].marcador.setIcon('null');

                    }
                    break;
                }
            }
            return socios;
        },
        desconectaTaxi: function(taxi) {
            limpia(listadoGeneral,taxi);
            borraUbicacion(taxi);
        },
        actualizaPosicion: function(taxi) {
            for (socio in socios) {
                if (socios[socio].id == taxi.id) {
                    var posicion = new google.maps.LatLng(taxi.latitud, taxi.longitud);
                    socios[socio].marcador.setPosition(posicion);
                    break;
                }
            }
            return socios;
        },
        ocupar:function() {
            usuario.ocupado = !usuario.ocupado;
            if(usuario.ocupado){
                socios[usuario.posicion].marcador.setIcon('./img/ocupado/taxi'+socios[socio].numerotaxi+'.png')
            }
        },
        getOcupado: function() {
            if(usuario) {
                return usuario.ocupado;
            } else {
                return false;
            }
        },
        actualizaMiPosicon: function(pos) {
            socios[usuario.posicion].marcador.setPosition(pos);
            return socios;
        },
        mueveSocio: function(data) {
            for(socio in socios) {
                if(socios[socio].id == data.id && socios[socio].conectado) {
                    var posicion = new google.maps.LatLng(data.latitud,data.longitud);
                    socios[socio].marcador.setPosition(posicion);
                }
            }
        }
    }

});
