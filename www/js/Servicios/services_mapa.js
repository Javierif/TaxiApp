angular.module("starter.servicies_mapa", [])

    .factory("MapaInstancia", function ($q, $ionicLoading, Peticiones, PostSails, Usuario) {
    var usuario;

    var listadoGeneral;
    var listaubicados;
    var paradas;
    var socios;

    var ubicarDisponible = {disabled:true,ubicadoText:"Ubicar",ubicado:false};
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
        reconnect: function() {
            var deferral = $q.defer();
            var promise = deferral.promise;

            var sociomethod = this.obtenSocios();
            var paradamethod = this.obtenParadas();
            var limpiaSocios = this.limpiaSocios();
            var limpiaParadas = this.limpiaParadas();


            $q.all([limpiaSocios,limpiaParadas,sociomethod,paradamethod]).then(function () {
                deferral.resolve();
            })
            return deferral.promise;
        },
        limpiaSocios: function() {
            for(socio in socios) {
                if(socios[socio].marcador) {
                    socios[socio].marcador.setMap(null);
                }
            }
            socios.splice(0,socios.length);
        },
        limpiaParadas: function() {
            paradas.splice(0,paradas.length);
            listadoGeneral.splice(0,listadoGeneral.length)
        },
        recargaUsuario: function() {
            if(!socios[usuario.posicion].marcador){
                socios[usuario.posicion].marcador = this.creaTaxiMapa(socios[usuario.posicion],socios[usuario.posicion].ocupado);
            }
            return {socios:socios,posicion:usuario.posicion};
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
                var listaGeneral = result.taxistanoubicados;
                listaubicados = result.taxistaubicados;
                console.log("PARADA CON UBICADO "+JSON.stringify(paradasConUbicados));
                console.log("LISTA GENERAL "+ JSON.stringify(listaGeneral));
                for(taxi in listaGeneral) {
                    for(socio in socios) {
                        if(socios[socio].id == listaGeneral[taxi].id) {
                            socios[socio].marcador = instancia.creaTaxiMapa(listaGeneral[taxi],listaGeneral[taxi].ocupado);
                            if(socios[socio].id == usuario.id) {
                                usuario.ocupado = listaGeneral[taxi].ocupado;
                            }
                            break;
                        }

                    }
                }

                for(parada in paradasConUbicados) {
                    paradasConUbicados[parada].prioridad = 0;
                    instancia.creaParadaMapa(paradasConUbicados[parada].latitud,paradasConUbicados[parada].longitud)
                    paradasConUbicados[parada].ubicados = [];
                    for(ubicado in paradasConUbicados[parada].taxistasUbicados) {
                        paradasConUbicados[parada].prioridad += 1;
                        paradasConUbicados[parada].ubicados.push(instancia.getSocio(paradasConUbicados[parada].taxistasUbicados[ubicado]));
                        if(paradasConUbicados[parada].taxistasUbicados[ubicado] = usuario.id) {
                            ubicarDisponible.ubicado = true;
                            ubicarDisponible.ubicadoText = "Desubicar";
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
        creaTaxiMapa: function (taxista,ocupado) {
            console.log("CREO TAXISTA " + taxista);
            var posicion = new google.maps.LatLng(taxista.latitud, taxista.longitud);
            var icon;
            if(!ocupado) {
                icon = './img/activo/taxi'+taxista.numerotaxi+'.png'
            } else {
                icon = './img/ocupado/taxi'+taxista.numerotaxi+'.png'
            }

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
                    this.limpia(listadoGeneral,taxi);
                    listaubicados.push(taxi)
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
            console.log("BORRANDO UBICACION DE "+ socioRecibido)
            if(isNaN(socioRecibido)){
                socioRecibido = socioRecibido.id;
            }
            for (p in paradas) {
                for (ubicado in paradas[p].ubicados) {
                    if (paradas[p].ubicados[ubicado].id == socioRecibido) {
                        this.limpia(listaubicados,paradas[p].ubicados[ubicado]);
                        listadoGeneral.push(paradas[p].ubicados[ubicado]);
                        paradas[p].ubicados.splice(ubicado, 1);
                        paradas[p].prioridad = paradas[parada].ubicados.length;
                    }
                }
            }
            return paradas;
        },

        getUbicarDisponible: function () {
            return ubicarDisponible;
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
        ubicadoTaxi: function(taxista) {
          var ubicado = false;
            for(taxi in listaubicados) {
                if(listaubicados[taxi].id == taxista.id) {
                    ubicado = true;
                }
            }
            if(ubicado) {
                return true;
            } else {
                return false;
            }
        },
        conectaTaxi: function(taxi) {
            for (socio in socios) {
                if (taxi.id == socios[socio].id) {
                    socios[socio].conectado = taxi.conectado;
                    if (taxi.conectado) {
                        if(!this.ubicadoTaxi(socios[socio])) {
                            listadoGeneral.push(socios[socio]);
                        }
                        if(socios[socio].marcador) {
                            socios[socio].marcador.setMap(null);
                        }

                        socios[socio].marcador=this.creaTaxiMapa(socios[socio],socios[socio].ocupado);
                        socios[socio].marcador.setIcon('./img/activo/taxi'+socios[socio].numerotaxi+'.png');
                    } else {
                        socios[socio].marcador.setIcon('null');
                        this.borraUbicacion(socios[socio].id);
                        this.limpia(listadoGeneral,socios[socio]);
                    }
                    break;
                }
            }
            return socios;
        },
        getListadoUbicados: function() {
            return listaubicados
        },
        desconectaTaxi: function(taxi) {
            this.limpia(listadoGeneral,taxi);
            this.limpia(listaubicados,taxi);
            this.borraUbicacion(taxi);
        },
        ocupar:function(ocupado) {
            usuario.ocupado = !usuario.ocupado;
            if(ocupado){
                socios[usuario.posicion].marcador.setIcon('./img/ocupado/taxi'+socios[usuario.posicion].numerotaxi+'.png')
            }  else {
                socios[usuario.posicion].marcador.setIcon('./img/activo/taxi'+socios[usuario.posicion].numerotaxi+'.png')
            }
            console.log("PUES " + usuario.id + " Y POS " + ocupado);
            PostSails.postOcupar(usuario.id,ocupado)
        },
        ocuparTaxi: function(idTaxi,ocupado) {
            for(socio in socios) {
                if(idTaxi == socios[socio].id) {
                    socios[socio].ocupado = ocupado;
                    if(ocupado) {
                        socios[socio].marcador.setIcon('./img/ocupado/taxi'+socios[socio].numerotaxi+'.png');
                    } else {
                        socios[socio].marcador.setIcon('./img/activo/taxi'+socios[socio].numerotaxi+'.png');
                    }
                }
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
