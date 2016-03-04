angular.module('starter.controllers.taxista', [])

    .controller('TaxistaCtrl', function ($scope, MapaInstancia) {
    $scope.paradas = MapaInstancia.getParadas();
    $scope.socios = MapaInstancia.getSocios();
    $scope.ubicadoText = MapaInstancia.getUbicadoText();



    $scope.$watch(function () {
        return MapaInstancia.getParadas();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.paradas = newValue;
    });

    $scope.$watch(function () {
        return MapaInstancia.getSocios();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.socios = newValue;
    });

    $scope.$watch(function () {
        return MapaInstancia.getUbicadoText();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.ubicadoText = newValue;
    });
})

    .controller('MapaTaxistaCtrl', function ($scope, $ionicLoading, $ionicPopup, Peticiones, server_constantes, Usuario, $timeout, $sails, FileUploader, MapaInstancia, MapaControl, $ionicSideMenuDelegate, $ionicModal, $filter, Servicio) {
    //screen.lockOrientation('landscape');
    var usuario = Usuario.usuario();
    $scope.ubicarDisponible = {};
    $scope.ubicarDisponible.disabled = true;
    $scope.recordImg = "./img/record.png";
    $scope.ubicadoText;
    $scope.route = [];
    var servicioTimeOut=[];
    var geocoder = new google.maps.Geocoder();
    var directionsService = new google.maps.DirectionsService();
    $scope.opcion = {
        mascota: false,
        discapacitado: false
    };
    $scope.servicioActual;
    $scope.progressValue = 0;
    $scope.ultimo = false;
    $scope.especial = [];

    $scope.ocupado = false;

    $scope.toggleLeft = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    $ionicModal.fromTemplateUrl('templates/servicio.html', function ($ionicModal) {
        $scope.modalPedir = $ionicModal;
    }, {
        // Use our scope for the scope of the modal to keep it simple
        scope: $scope,
        // The animation we want to use for the modal entrance
        animation: 'slide-in-up'
    });

    var initTaxista = function () {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo el mapa…'
        });
        inicializaMapa();
        google.maps.event.addListenerOnce($scope.map, 'idle', function () {
            MapaInstancia.cargaMapa(usuario, $scope.map).then(function () {
                $scope.paradas = MapaInstancia.getParadas();
                $scope.socios = MapaInstancia.getSocios();
                $scope.ubicadoText = MapaInstancia.getUbicadoText();
                $ionicLoading.show({
                    template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo tu geoposición…'
                });
                getCurrentPosition();
                MapaControl.borraUbicacion($scope.paradas, $scope.socios, 1, usuario.id);
                MapaControl.ubica($scope.paradas, $scope.socios, 1, usuario.id);

            });
        });
    }



    $scope.itemOnLongPress = function () {
        $scope.recordImg = "./img/recording.png";
        record();
    }

    $scope.itemOnTouchEnd = function () {
        $scope.recordImg = "./img/record.png";
        endRecord();
    }

    $scope.ubicar = function () {
        if ($scope.ubicadoText == "Ubicar") {
            postUbicar($scope.ubicarDisponible.id, usuario.grupo, usuario.latitud, usuario.longitud, usuario.id)
            MapaControl.ubica($scope.paradas, $scope.socios, $scope.ubicarDisponible.id, usuario.id);
            $scope.ubicadoText = "Desubicar";

        } else {
            postDesUbicar($scope.ubicarDisponible.id, usuario.id, usuario.grupo);
            MapaControl.borraUbicacion($scope.paradas, $scope.socios, $scope.ubicarDisponible.id, usuario.id);
            $scope.ubicadoText = "Ubicar";
        }
    }

    $scope.aceptar = function(recogida,destino) {
        $scope.modalPedir.hide();
        $scope.estiloServicio = true;
        $scope.progressValue = 1000;
        postAceptar(usuario.id,$scope.servicioid,usuario.latitud,usuario.longitud);
        Servicio.guardarServicio($scope.servicioid,$scope.recogida,$scope.destino);
        var directionsRequest = {
            origin: new google.maps.LatLng(usuario.latitud,usuario.longitud),
            destination:$scope.recogida,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        directionsService.route(
            directionsRequest,
            function(response, status)
            {
                if (status == google.maps.DirectionsStatus.OK)
                {
                    $scope.rutaOrigen = new google.maps.DirectionsRenderer({
                        map: $scope.map,
                        directions: response,
                        suppressMarkers: true
                    });
                }
            });
        if($scope.destino) {
            var directionsRequest = {
                origin: $scope.recogida,
                destination: $scope.destino,
                travelMode: google.maps.DirectionsTravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            };

            directionsService.route(
                directionsRequest,
                function(response, status)
                {
                    if (status == google.maps.DirectionsStatus.OK)
                    {
                        $scope.rutaDestino = new google.maps.DirectionsRenderer({
                            map: $scope.map,
                            directions: response,
                            polylineOptions: new google.maps.Polyline({
                                strokeColor: '#6FCB8E',
                                strokeOpacity: 0.8,
                                strokeWeight: 10
                            }),
                            suppressMarkers: true
                        });
                    }
                });
        }
    }

    $scope.rechazar = function(recogida,destino,mascota,discapacitado,fecha) {
        var lngrecogida = recogida.geometry.location.lng();
        $scope.modalPedir.hide();
        $scope.estiloServicio = false;
        $scope.ocupado = false;
        var latdestino;
        var lngdestino;
        if($scope.destino) {
            latdestino = $scope.destino.lat();
            lngdestino = $scope.destino.lng();
        }
        if($scope.ultimo) {
            postRechazarUltimo($scope.recogida.lat(),$scope.recogida.lng(),latdestino,lngdestino,fecha,$scope.servicioid,mascota,dispacitado,usuario.id);

        } else {
            postRechazar($scope.recogida.lat(),$scope.recogida.lng(),latdestino,lngdestino,fecha,$scope.servicioid,mascota,dispacitado,usuario.id);

        }
    }

    $scope.resolver = function(){
        var myPopup = $ionicPopup.show({
            template: '<select ng-model="opcion.opcion"><option>Servicio resuelto correctamente</option><option>Cliente no presente</option></select>',
            title: 'Seleccione una de las opciones',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancelar',
                    type: 'button button-outline button-energized'
                },
                {
                    text: 'Resolver',
                    type: 'button button-energized',
                    scope: $scope,
                    onTap: function (e) {
                        return $scope.opcion.opcion
                    }
                }
            ]
        });
        myPopup.then(function (res) {
            if (!(angular.isUndefined(res)) && !(res == null)) {
                $scope.rutaOrigen.setMap(null);
                if($scope.rutaDestino) {
                    $scope.rutaDestino.setMap(null)
                }
                Servicio.resuelveServicio();
                postResolverServicio(res);
                $scope.ocupado = false;
            } else {
                window.plugins.toast.showShortBottom("Selecciona una de las opciones",
                                                     function (a) {},
                                                     function (b) {});
            }
        });
    }


    var generaRuta = function(from,to,color,origen){

    }

    var valorarUbicacion = function (latitud, longitud) {
        var radio = false;
        var limite = false;
        for (parada in $scope.paradas) {
            var distancia = calculaDistancia(latitud, longitud, $scope.paradas[parada].latitud, $scope.paradas[parada].longitud);
            if (distancia < 0.15) {
                if (!radio) {
                    radio = true;
                    break;
                }
            }
            if (distancia > 0.3) {
                if (!limite) {
                    limite = true;
                }
            }
        }
        if (radio) {
            $scope.ubicarDisponible.id = $scope.paradas[parada].id;
            $scope.ubicarDisponible.disabled = false;
        }
        if (!radio && !limite) {
            $scope.ubicarDisponible.disabled = true;
            if ($scope.ubicadoText == 'Desubicar') {
                $scope.ubicar();
            }
        }
        if (limite && !radio) {
            $scope.ubicarDisponible.disabled = true;
        }
    }

    var muevete = function (latitud, longitud) {
        postMoviendose(usuario.id, usuario.grupo, latitud, longitud);
        usuario.latitud = latitud;
        usuario.longitud = longitud;
        var posicion = new google.maps.LatLng(latitud, longitud);
        $scope.socios[usuario.posicion].marcador.setPosition(posicion);
        $scope.map.panTo(posicion);
        valorarUbicacion(latitud, longitud);
    }


    var observaPosicion = function () {
        window.navigator.geolocation.watchPosition(function (location, error, options) {
            if (location.coords.accuracy < 150) {
                muevete(location.coords.latitude, location.coords.longitude);
            }
        },function error(msg) {}, {
            maximumAge: 600000,
            timeout: 50000,
            enableHighAccuracy: true
        });
    }

    var compruebaServicios = function () {
        if(Servicio.compruebaServicio()) {
            console.log("PARECER SER QUE SERVICIO DIJO QUE SI")
            $scope.ocupado = true;
            $scope.estiloServicio = true;
            var servicio = Servicio.getServicio();
            console.log("EL SERVICIO CARGADO ES " + JSON.stringify(servicio));
            $scope.servicioid = servicio.servicioid;
            $scope.recogida = new google.maps.LatLng(servicio.recogidaLat,servicio.recogidaLng);
            console.log("RECOGIDA ES " + JSON.stringify($scope.recogida));
            console.log("USUARIO LA" + JSON.stringify(usuario));
            var directionsRequest = {
                origin: new google.maps.LatLng(usuario.latitud,usuario.longitud),
                destination:$scope.recogida,
                travelMode: google.maps.DirectionsTravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            };

            directionsService.route(
                directionsRequest,
                function(response, status)
                {
                    console.log("IN");
                    if (status == google.maps.DirectionsStatus.OK)
                    {
                        console.log("ON")
                        $scope.rutaOrigen = new google.maps.DirectionsRenderer({
                            map: $scope.map,
                            directions: response,
                            suppressMarkers: true
                        });
                    }
                });

            if(servicio.latdestino) {
                $scope.destino = new google.maps.LatLng(servicio.destinoLat,servicio.destinoLng);
                var directionsRequest = {
                    origin: $scope.recogida,
                    destination: $scope.destino,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC
                };

                directionsService.route(
                    directionsRequest,
                    function(response, status)
                    {
                        if (status == google.maps.DirectionsStatus.OK)
                        {
                            $scope.rutaDestino = new google.maps.DirectionsRenderer({
                                map: $scope.map,
                                directions: response,
                                polylineOptions: new google.maps.Polyline({
                                    strokeColor: '#6FCB8E',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 10
                                }),
                                suppressMarkers: true
                            });
                        }
                    });
            }
        }
    }

    var getCurrentPosition = function () {

        window.navigator.geolocation.getCurrentPosition(function (location) {
            console.log("ACCUARY" + location.coords.accuracy)
            if (location.coords.accuracy < 1500) {
                muevete(location.coords.latitude, location.coords.longitude);
                $ionicLoading.hide();
                //comenzamos a observar si te mueves
                observaPosicion();
                compruebaServicios();
            } else {
                $ionicLoading.show({
                    template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Estamos intentando conseguir una precisión minima de 150m de tu posición, actualmente recibimos ' + location.coords.accuracy + 'm'
                });
                $timeout(function() {
                    getCurrentPosition();
                },1500);
            }
        }, function error(msg) {
            //alert('error al obtener geo local error ' + JSON.stringify(msg));
            getCurrentPosition();
        }, {
            maximumAge: 600000,
            timeout: 5000,
            enableHighAccuracy: true
        });
    }

    var inicializaMapa = function () {
        var mapOptions = {
            streetViewControl: false,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            disableDefaultUI: true
        };
        $scope.map = new google.maps.Map(document.getElementById("mapa"),
                                         mapOptions);
        return $scope.map;
    }

    var calculaDistancia = function (lat1, lon1, lat2, lon2) {
        var radlat1 = Math.PI * lat1 / 180
        var radlat2 = Math.PI * lat2 / 180
        var radlon1 = Math.PI * lon1 / 180
        var radlon2 = Math.PI * lon2 / 180
        var theta = lon1 - lon2
        var radtheta = Math.PI * theta / 180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180 / Math.PI
        dist = dist * 60 * 1.1515
        dist = dist * 1.609344
        //devuelve en kilometros
        return dist
    }

    var checkTurno = function (latitud, longitud, latdestino, lngdestino, fechaRecogida, servicioid,mascota,discapacitado,socioid,ultimo) {
        var puesto = 0;
        var ubicados = 0;
        if(socioid)
            if(socioid == usuario.id)
                return;
        /*
        * Si el taxista esta ocupado rechaza directamente el servicio y lo pasa al siguiente para que no se creen conflictos
        */
        if(!$scope.ocupado || socioid) {
            if(socioid) {
                var servicioObtenido = $filter('Object')(servicioTimeOut,{servicioid:servicioid});
                $timeout.cancel(servicioObtenido.timeout);
            }
            for (parada in $scope.paradas) {
                console.log("Paradas 1" + $scope.paradas[parada].parada);
                $scope.paradas[parada].distanciaservicio = calculaDistancia(latitud, longitud, $scope.paradas[parada].latitud, $scope.paradas[parada].longitud);
                for(ubicado in $scope.paradas[parada].ubicados) {
                    ubicados = ubicados +1;
                }
            }
            $scope.paradasFiltradas = $filter('orderBy')($scope.paradas, 'distanciaservicio');
            for(filtrado in $scope.paradasFiltradas) {
                var breaker = false;
                var encontrado = false;
                for(ubicado in $scope.paradasFiltradas[filtrado].ubicados) {
                    if($scope.paradasFiltradas[filtrado].ubicados[ubicado].id == usuario.id) {
                        breaker = true;
                        break;
                    } else {
                        if(socioid) {
                            if(encontrado) {
                                puesto = puesto+1;
                            }
                            if(socioid == $scope.paradasFiltradas[filtrado].ubicados[ubicado].id) {
                                encontrado = true;
                            }

                        } else {
                            console.log("socio " + $scope.paradasFiltradas[filtrado].ubicados[ubicado].id);
                            puesto = puesto+1;
                        }
                    }
                }
                if(breaker) {
                    break;
                }
            }
            $scope.ultimo = false;
            if(puesto+1 == ubicados) {
                $scope.ultimo = true;
            }
            var tiempo = puesto * 10000;
            var timeout = $timeout(function() {
                alert("TE TOCA!");
                $scope.servicioid=servicioid;
                servicio(latitud,longitud,latdestino,lngdestino,fechaRecogida,mascota,discapacitado);
                $scope.ocupado = true;
            },tiempo)
            servicioTimeOut.push({servicioid:servicioid,timeout:timeout,ultimo:$scope.ultimo});
        } else {
            if(ultimo){}
            postRechazar(latitud, longitud, latdestino, lngdestino, fechaRecogida, servicioid,mascota,discapacitado,usuario.id);
        }
    }

    var servicio = function(latrecogida,lngrecogida,latdestino,lngdestino,fecha,mascota,discapacitado) {
        var distancia = calculaDistancia(lngrecogida, lngrecogida,latdestino,lngdestino);
        var zoom = 16;
        if (distancia>2) {
            zoom = 12
        }
        $scope.localizacion = "http://maps.googleapis.com/maps/api/staticmap?size=640x320&sensor=false&zoom="+zoom+"&markers=" + latrecogida + "%2C" + lngrecogida;

        geocoder.geocode({
            'latLng': new google.maps.LatLng(latrecogida,lngrecogida)
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    $scope.recogidaText = results[0].formatted_address;
                    $scope.recogida =  new google.maps.LatLng(latrecogida,lngrecogida);
                } else {
                    alert('No results found');
                }
            } else {
                alert('Geocoder failed due to: ' + status);
            }
        });
        if(latdestino) {
            $scope.localizacion =  $scope.localizacion + "8&markers=color:0x4592ba|"+latdestino + "%2C" +lngdestino;
            $scope.destino =null;
            geocoder.geocode({
                'latLng': new google.maps.LatLng(latdestino,lngdestino)
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        $scope.destinoText =  results[0].formatted_address;
                        $scope.destino = new google.maps.LatLng(latdestino,lngdestino);
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });
        }
        $scope.datetimeValue = fecha;
        $scope.opcion.mascota = mascota;
        $scope.opcion.discapacitado = discapacitado;
        $scope.modalPedir.show();
        cuenta();
    }

    var cuenta = function() {
        $timeout(function(){
            if($scope.progressValue != 1000) {
                $scope.progressValue = $scope.progressValue + 1;
                var total =  $scope.progressValue * 10;
                $scope.progresstyle = "width:"+total+"%";
                if($scope.progressValue != 10) {
                    cuenta();
                } else {
                    $scope.progressValue = 0;
                    $scope.modalPedir.hide();
                    $scope.ocupado = false;
                }
            } else {
                $scope.progressValue = 0;
                $scope.modalPedir.hide();
                $scope.ocupado = true;
            }
        }, 1000);
    }

    $sails.on('connect', function socketConnected() {
        $sails.get("/taxista/conectarse/" + usuario.id + "/" + usuario.grupo);
        alert("CONECTADO");
    });


    $sails.on('reconnect', function (transport, numAttempts) {
        alert("RECONECTADO");
    });

    $sails.on("Web_Usuario", function (resp) {
        for (socio in $scope.socios) {
            if ($scope.socios[socio].id == resp.data.user) {
                var posicion = new google.maps.LatLng(resp.data.latitud, resp.data.longitud);
                $scope.socios[socio].marcador.setPosition(posicion);
                break;
            }
        }
        $scope.bars = resp.data;
    });

    $sails.on('conexion', function (resp) {
        for (socio in $scope.socios) {
            if (resp.id == $scope.socios[socio].id) {
                $scope.socios[socio].conectado = resp.conectado;
                if (resp.conectado) {
                    MapaControl.borraUbicacion($scope.paradas, $scope.socios, 1, resp.id);
                    MapaControl.ubica($scope.paradas, $scope.socios, 1, resp.id);
                    $scope.socios[socio].marcador.setIcon('./img/activoicon.png');
                    var myMedia = new Media("./img/on.wav");
                    myMedia.play();
                    window.plugins.toast.showShortBottom("Se ha conectado el taxi nº" + resp.id,
                                                         function (a) {},
                                                         function (b) {});
                } else {
                    MapaControl.borraUbicacion($scope.paradas, $scope.socios, 1, resp.id);
                    $scope.socios[socio].marcador.setIcon('./img/desconectadoicon.png');
                    window.plugins.toast.showShortBottom("Se ha desconectado el taxi nº" + resp.id,
                                                         function (a) {},
                                                         function (b) {});
                }
            }
        }
    });

    $sails.on('movimiento', function (resp) {
        for (socio in $scope.socios) {
            if ($scope.socios[socio].id == resp.user) {
                var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
                $scope.socios[socio].marcador.setPosition(posicion);
                break;
            }
        }
    });

    $sails.on('ubicado', function (resp) {
        var myMedia = new Media("./img/ubicar.wav");
        myMedia.play();
        MapaControl.ubica($scope.paradas, $scope.socios, resp.parada, resp.socio);
    });

    $sails.on('desubicar', function (resp) {
        MapaControl.borraUbicacion($scope.paradas, $scope.socios, resp.parada, resp.socio);
    });

    $sails.on('Servicio', function (resp) {
        console.log("RECIBIDO SERVICIO "+JSON.stringify(resp));
        $scope.clienteActivo = resp.datosCliente;
        checkTurno(resp.latRecogida, resp.lngRecogida, resp.latDestino,resp.lngDestino,resp.fechaRecogida,resp.id,resp.animal,resp.dispacitado);
    });

    $sails.on('ServicioRechazado', function (resp) {
        $scope.especial.push({taxista:resp.taxista})
        if(usuario.id == resp.taxista) {
                $scope.rutaOrigen.setMap(null);
                if($scope.rutaDestino) {
                    $scope.rutaDestino.setMap(null)
                }
                Servicio.resuelveServicio();
                postResolverServicio(res);
                $scope.ocupado = false;
        }

    });

    $sails.on('ServicioUltimoRechazado', function (resp) {
        console.log("Rechazado SERVICIO");
        checkTurno(resp.latRecogida, resp.lngRecogida,resp.latDestino,resp.lngDestino,resp.fechaRecogida,resp.id, resp.animal,resp.dispacitado,resp.idSocio,true);
    });

    $sails.on('AudioInterno', function(resp) {
        var introsound = new Media(resp.url)
        introsound.play()
    })


    var postResolver = function(estado,servicioid,taxistaid) {
        $sails.post('/taxista/resolver', {
            taxistaid: taxistaid,
            servicioid:servicioid,
            estado:estado
        });
    }

    var postAceptar = function(taxistaid,servicioid,latitud,longitud,clienteid) {
        $sails.post('/taxista/aceptarServicio', {
            taxistaid: taxistaid,
            servicioid:servicioid,
            cliente:clienteid,
            latitud:latitud,
            longitud:longitud,
            grupo:1
        });
    }

    var postRechazar = function(latRecogida,lngRecogida,latDestino,lngDestino,fechaRecogida,id, animal,dispacitado,idSocio) {
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
    }

    var postRechazarUltimo = function(latRecogida,lngRecogida,latDestino,lngDestino,fechaRecogida,id, animal,dispacitado,idSocio) {
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
    }

    var postMoviendose = function (usuarioId, grupo, latitud, longitud) {
        $sails.post('/taxista/moviendose', {
            user: usuarioId,
            grupo: grupo,
            latitud: latitud,
            longitud: longitud
        });
    }

    var postUbicar = function (paradaId, grupo, latitud, longitud, taxistaId) {
        console.log("UBICAnDO " + paradaId + " g " + grupo + " lat " + latitud +" lng " +longitud+" tax " + taxistaId)
        $sails.post('/taxista/ubicar', {
            parada: paradaId,
            grupo: grupo,
            latitud: latitud,
            longitud: longitud,
            taxista: taxistaId
        });
    }

    var postDesUbicar = function (paradaId, taxistaId, grupo) {
        $sails.post('/taxista/desubicar', {
            parada: paradaId,
            taxista: taxistaId,
            grupo: grupo
        });
    }

    var postResolverServicio = function (res) {
        $sails.post('/taxista/resolver', {
            servicioid: $scope.servicioid,
            resultado: res
        });
    }


    //Prepares File System for Audio Recording
    audioRecord = 'recorded.wav';
    var myMedia;
    var urlfilesystem = false;

    var win = function (r) {
        alert("WIN" + JSON.stringify(r));
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }

    var fail = function (error) {
        alert("FAIL " + error.code + "SORU " + error.source + " tar " + error.target);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var record = function () {

        var introsound = new Media("./img/record.wav", function mediaSuccess() {
            if (!urlfilesystem) {
                window.requestFileSystem(
                    LocalFileSystem.TEMPORARY,
                    0,
                    function (fileSystem) {
                        urlfilesystem = fileSystem.root.toURL();
                        /* hohohla */
                        urlfilesystem = urlfilesystem.slice(7);
                        myMedia = new Media(urlfilesystem + audioRecord);
                        myMedia.startRecord();
                    },
                    function (error) {
                        alert('Error getting file system');
                    }
                );
            } else {
                myMedia = new Media(urlfilesystem + audioRecord);
                myMedia.startRecord();

            }
        },

                                   function mediaFailure(err) {
            console.log("An error occurred: " + err.code);
        },

                                   function mediaStatus(status) {
            console.log("A status change occurred: " + status.code);
        });

        introsound.play();
    }

    var endRecord = function () {
        myMedia.stopRecord();
        myMedia.play();

        var options = new FileUploadOptions();
        options.chunkedMode = false;

        options.headers = {
            Connection: "close"
        };
        options.fileKey = "file";
        options.fileName = audioRecord;
        options.mimeType = "audio/wav";
        var ft = new FileTransfer();
        ft.upload(myMedia.src, encodeURI("http://taxialcantarilla.es/taxista/record"), win, fail, options);
    }


    initTaxista();
})
