angular.module('starter.controllers.taxista', [])

    .controller('TaxistaCtrl', function ($scope, MapaInstancia,$sails) {
    $scope.paradas = MapaInstancia.getParadas();
    $scope.socios = MapaInstancia.getSocios();
    $scope.ocupado = MapaInstancia.getOcupado();
    $scope.listadoGeneral = MapaInstancia.getListadoGeneral();


    $scope.ocupa = function() {
        console.log("OCUPANDO")
        $scope.ocupado = !$scope.ocupado;
        MapaInstancia.ocupar($scope.ocupado);
    }

    $scope.$watch(function () {
        return MapaInstancia.getParadas();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.paradas = newValue;
    });

    $scope.$watch(function () {
        return MapaInstancia.getListadoGeneral();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue)
            $scope.listadoGeneral = newValue;
        console.log("LISTADO CHANGED "+JSON.stringify(MapaInstancia.getListadoGeneral()));
    });

    $scope.$watch(function () {
        return MapaInstancia.getSocios();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.socios = newValue;
    });

    $scope.$watch(function () {
        return MapaInstancia.getOcupado();
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.ocupado = newValue;
    });
})

    .controller('MapaTaxistaCtrl', function ($scope, $ionicLoading, $ionicPopup, Peticiones, server_constantes, Usuario, $timeout, $sails, FileUploader, MapaInstancia, $ionicSideMenuDelegate, $ionicModal, $filter, Servicio, PostSails) {

    var usuario = Usuario.usuario();
    $scope.ubicarDisponible = MapaInstancia.getUbicarDisponible();
    $scope.servicio = Servicio.getServicio();
    var GoogleMaps = {geocoder:new google.maps.Geocoder(),directionsService:new google.maps.DirectionsService()};

    $ionicModal.fromTemplateUrl('templates/servicio.html', function ($ionicModal) {$scope.modalPedir = $ionicModal;},
                                {scope: $scope,animation: 'slide-in-up'});

    var initTaxista = function () {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo el mapa…'
        });
        inicializaMapa();
        google.maps.event.addListenerOnce($scope.map, 'idle', function () {
            MapaInstancia.cargaMapa(usuario, $scope.map).then(function () {
                $scope.paradas = MapaInstancia.getParadas();
                $scope.socios = MapaInstancia.getSocios();
                $scope.listadoGeneral = MapaInstancia.getListadoGeneral();
                $ionicLoading.show({
                    template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo tu geoposición…'
                });
                $scope.ubicarDisponible = MapaInstancia.getUbicarDisponible();
                getCurrentPosition();
            });
        });
    }

    var directionsOrigen = function() {
        var directionsRequest = {
            origin: new google.maps.LatLng(usuario.latitud,usuario.longitud),
            destination: new google.maps.LatLng($scope.servicio.latrecogida,$scope.servicio.lngrecogida),
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        GoogleMaps.directionsService.route(
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
    }

    var directionsDestino = function() {
        var directionsRequest = {
            origin: $scope.servicio.recogida,
            destination: $scope.servicio.destino,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        GoogleMaps.directionsService.route(directionsRequest,
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

    var rechazarServicio = function(motivo) {
        console.log("RECHANZADO EL SERVICICI")
        $scope.modalPedir.hide();
        MapaInstancia.ocupar(false);
        var latdestino;
        var lngdestino;
        if($scope.destino) {
            latdestino = $scope.destino.lat();
            lngdestino = $scope.destino.lng();
        }
        PostSails.postRechazar($scope.servicio.latrecogida, $scope.servicio.lngrecogida,$scope.servicio.latdestino,$scope.servicio.lngdestino,$scope.servicio.fechaRecogida,$scope.servicio.id,$scope.servicio.mascota,$scope.servicio.dispacitado,usuario.id,motivo);
        $scope.servicio = Servicio.limpiaServicio();
    }

    var temporal = false;
    $scope.temporal = function() {
        temporal = !temporal;
        if(temporal) {
            muevete(37.9737026,-1.2097384)
        } else {
            muevete(37.9757494,-1.2135467)
        }

    }

    $scope.itemOnLongPress = function () {
        record();
    }

    $scope.itemOnTouchEnd = function () {
        endRecord();
    }

    $scope.OnTouchEndCliente = function () {
        endRecordCliente();
    }

    $scope.toggleLeft = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.ubicar = function () {
        if (!$scope.ubicarDisponible.ubicado) {
            ubicarDesubicar(true);
        } else {
            ubicarDesubicar(false);
        }
    }
    //revisar y quitar mi icono cuando acepto y despues poner el del cliente
    $scope.aceptar = function(recogida,destino) {
        $scope.modalPedir.hide();
        $scope.servicio.estiloServicio = true;
        $scope.servicio.atendiendo = false;
        $scope.servicio.progressValue = 1000;
        PostSails.postAceptar(usuario.id,$scope.servicio.id,usuario.latitud,usuario.longitud);
        Servicio.guardarServicio($scope.servicio);
        directionsOrigen();
        if($scope.destino) {
            directionsDestino();
        }
    }

    $scope.rechazar = function(recogida,destino,mascota,discapacitado,fecha) {
        rechazarServicio("Rechazado");
    }
    $scope.opcion={};
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
                console.log("LO RESUELTO ES " + JSON.stringify(res));
                $scope.rutaOrigen.setMap(null);
                if($scope.rutaDestino) {
                    $scope.rutaDestino.setMap(null)
                }
                Servicio.resuelveServicio();
                PostSails.postResolverServicio($scope.servicio.id,JSON.stringify(res));
                MapaInstancia.ocupar(false);
                $scope.servicio = Servicio.limpiaServicio();
            } else {
                window.plugins.toast.showShortBottom("Selecciona una de las opciones",
                                                     function (a) {},
                                                     function (b) {});
            }
        });
    }

    var ubicarDesubicar = function(ubicar) {
        if (ubicar) {
            PostSails.postUbicar($scope.ubicarDisponible.id, usuario.grupo, usuario.latitud, usuario.longitud, usuario.id)
            $scope.paradas = MapaInstancia.ubica($scope.ubicarDisponible.id, usuario.id);
            $scope.ubicarDisponible.ubicadoText = "Desubicar";
            $scope.ubicarDisponible.ubicado = true;
        } else {
            PostSails.postDesUbicar($scope.ubicarDisponible.id, usuario.id, usuario.grupo);
            $scope.paradas = MapaInstancia.borraUbicacion(usuario);
            $scope.ubicarDisponible.ubicadoText = "Ubicar";
            $scope.ubicarDisponible.ubicado = false;
        }
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
            if (distancia > 0.15 && distancia > 0.2) {
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

        }
        if (!radio) {
            //console.log("ESTAS FUERA DEL RANGO WUON! y los socios son " + JSON.stringify($scope.paradas));
            $scope.ubicarDisponible.disabled = true;
            ubicarDesubicar(false);
            //$scope.ubicarDisponible.disabled = true;
        }
    }

    var muevete = function (latitud, longitud) {
        PostSails.postMoviendose(usuario.id, usuario.grupo, latitud, longitud);
        usuario.latitud = latitud;
        usuario.longitud = longitud;
        var posicion = new google.maps.LatLng(latitud, longitud);
        $scope.socios = MapaInstancia.actualizaMiPosicon(posicion);
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

    /*
    *Este es el metodo que comprueba si tienes un servicio a mitad
    * Para en el caso de que cierres la app y la vuelvas a abrir siga en el servicio.
    */
    var compruebaServicios = function () {
        if(Servicio.compruebaServicio()) {
            MapaInstancia.ocupar(true);
            $scope.servicio = Servicio.getServicio();
            console.log("EL SERVICIO CARGADO ES " + JSON.stringify($scope.servicio));
            directionsOrigen();

            if(servicio.latdestino) {
                $scope.destino = new google.maps.LatLng(servicio.destinoLat,servicio.destinoLng);
                directionsDestino();
            }
        }
    }

    var getCurrentPosition = function () {
        console.log("HEY");
        window.navigator.geolocation.getCurrentPosition(function (location) {
            console.log("ACCUARY" + location.coords.accuracy)
            if (location.coords.accuracy < 1500) {
                $ionicLoading.hide();
                muevete(location.coords.latitude, location.coords.longitude);
                valorarUbicacion(location.coords.latitude, location.coords.longitude);
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
            alert('error al obtener geo local error ' + JSON.stringify(msg));
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

    var servicio = function() {
        $scope.servicio.atendiendo = true;
        var distancia = calculaDistancia($scope.servicio.lngrecogida, $scope.servicio.lngrecogida,$scope.servicio.latdestino,$scope.servicio.lngdestino);
        var zoom = 16;
        if (distancia>2) {
            zoom = 12
        }
        $scope.localizacion = "http://maps.googleapis.com/maps/api/staticmap?size=640x320&sensor=false&zoom="+zoom+"&markers=" + $scope.servicio.latrecogida + "%2C" + $scope.servicio.lngrecogida;

        GoogleMaps.geocoder.geocode({
            'latLng': new google.maps.LatLng($scope.servicio.latrecogida,$scope.servicio.lngrecogida)
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    $scope.recogidaText = results[0].formatted_address;
                } else {
                    alert('No results found');
                }
            } else {
                alert('Geocoder failed due to: ' + status);
            }
        });
        if($scope.servicio.latdestino) {
            $scope.localizacion =  $scope.localizacion + "8&markers=color:0x4592ba|"+$scope.servicio.latdestino + "%2C" +$scope.servicio.lngdestino;
            $scope.destino =null;
            GoogleMaps.geocoder.geocode({
                'latLng': new google.maps.LatLng($scope.servicio.latdestino,$scope.servicio.lngdestino)
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        $scope.destinoText =  results[0].formatted_address;
                        $scope.destino = new google.maps.LatLng($scope.servicio.latdestino,$scope.servicio.lngdestino);
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });
        }
        $scope.datetimeValue = $scope.servicio.fechaRecogida;
        $scope.modalPedir.show();
        cuenta();
    }

    var cuenta = function() {
        $timeout(function(){
            if($scope.servicio.atendiendo) {
                $scope.servicio.progressValue = $scope.servicio.progressValue + 1;
                var total =  $scope.servicio.progressValue * 10;
                $scope.servicio.progresstyle = "width:"+total+"%";
                if($scope.servicio.progressValue != 10) {
                    cuenta();
                    console.log("DANDO VUELTA");
                } else {
                    console.log("tiempo finish")
                    rechazarServicio("No Atendido");
                }
            } else {
                console.log("NO ATENDIDOOO   ")
                $scope.servicio.progressValue = 0;
                $scope.modalPedir.hide();
                MapaInstancia.ocupar(true);
            }
        }, 1000);
    }
    var inicilizadoya = false;
    $sails.on('connect', function socketConnected() {
        $sails.get("/taxista/conectarse/" + usuario.id + "/" + usuario.grupo);
        if(inicilizadoya) {
            $ionicLoading.show({
                template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo los cambios…'
            });
            $timeout(function() {
                MapaInstancia.reconnect().then(function() {
                    $scope.paradas = MapaInstancia.getParadas();
                    $scope.socios = MapaInstancia.getSocios();
                    $scope.listadoGeneral = MapaInstancia.getListadoGeneral();
                    var recarga = MapaInstancia.recargaUsuario();
                    usuario.posicion = recarga.posicion;
                    socios = recarga.socios;
                    getCurrentPosition();
                });
            },3500);
        }
        inicilizadoya = true;
    });

    $sails.on('reconnect', function (transport, numAttempts) {

    });

    $sails.on('disconnect', function () {
        $state.go("inicio");
    });

    $sails.on('conexion', function (resp) {
        console.log("CONECTADO " + JSON.stringify(resp));
        $scope.socios = MapaInstancia.conectaTaxi(resp);
        try{
            if(resp.conectado) {
                 var myMedia = new Media("/android_asset/www/www/img/on.wav");
                myMedia.play();
                window.plugins.toast.showShortBottom("Se ha conectado el taxi nº" + $scope.socios[socio].numerotaxi,
                                                     function (a) {},
                                                     function (b) {});
            } else {
                window.plugins.toast.showShortBottom("Se ha desconectado el taxi nº" + $scope.socios[socio].numerotaxi,
                                                     function (a) {},
                                                     function (b) {});
            }
        } catch(Exception){};

    });

    $sails.on('movimiento', function (resp) {
        $scope.socios = MapaInstancia.mueveSocio(resp);

    });

    $sails.on('ubicado', function (resp) {
        try{
            var myMedia = new Media("/android_asset/www/www/img/ubicar.wav");
            myMedia.play();
        } catch(exception) {
        }
        console.log("ubicado " + JSON.stringify(resp));
        $scope.paradas = MapaInstancia.ubica(resp.parada, resp.taxista);
    });

    $sails.on('desubicar', function (resp) {
        MapaInstancia.borraUbicacion(resp.socio);
    });

    $sails.on('ocupado', function(resp) {
        console.log("ALGUIEN SE OCUPO COPON " +JSON.stringify(resp));
        MapaInstancia.ocuparTaxi(resp.taxista,resp.ocupado);
    })

    $sails.on('Servicio', function (resp) {
        console.log("SERVICIO " + JSON.stringify(resp));
        console.log(" USU " + usuario.id);
        if(resp.taxista == usuario.id) {
            $scope.servicio.id = resp.id;
            $scope.servicio.latrecogida = resp.latRecogida;
            $scope.servicio.lngrecogida = resp.lngRecogida;
            $scope.servicio.latdestino = resp.latDestino;
            $scope.servicio.lngdestino = resp.lngDestino;
            $scope.servicio.fechaRecogida = resp.fechaRecogida;
            $scope.servicio.animal = resp.animal;
            $scope.servicio.discapacitado = resp.dispacitado;
            servicio()
        }
    });

    $sails.on('AudioInterno', function(resp) {
        var introsound;
        if(resp.urlandroid) {
          introsound =  new Media("http://taxialcantarilla.es"+resp.urlandroid)
        } else {
          introsound =  new Media("http://taxialcantarilla.es"+resp.url)
        }
        introsound.play()
    })

    $sails.on('AudioCliente', function(resp) {

        if(resp.servicioid == $scope.servicioid) {
            alert("ANTES DE REPRODUCIR DIGO QUE " + JSON.stringify(resp));
            var introsound = new Media("http://taxialcantarilla.es"+resp.url)
            introsound.play()
        }
    })

     audioRecord = 'recorded.mp3';
    var myMedia;
    var urlfilesystem = false;

    var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        var response = JSON.parse(r.response);
        // alert("res " + response.url);
        PostSails.postDifundirRecord({taxista:usuario.id,urlaudio:response.url});
    }

    var winClientes = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        var response = JSON.parse(r.response);
        // alert("res " + response.url);
        PostSails.postDifundirClientesRecord({servicioid:$scope.servicioid,urlaudio:response.url});
    }

    var fail = function (error) {
        //alert("FAIL " + error.code + "SORU " + error.source + " tar " + error.target);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var record = function () {
        var introsound = new Media("/android_asset/www/img/record.ogg");
        introsound.play();
        myMedia = new Media("/storage/emulated/0/"+audioRecord);
        myMedia.startRecord();

    }

    var endRecord = function () {
        myMedia.stopRecord();
        myMedia.play();

        var options = new FileUploadOptions();
        options.chunkedMode = false;

        options.headers = {
            Connection: "close"
        };
        alert(JSON.stringify(myMedia));

        options.fileKey = "file";
        options.fileName = audioRecord;
        options.mimeType = "audio/mp3";
        var ft = new FileTransfer();
        ft.upload(myMedia.src, encodeURI("http://taxialcantarilla.es/taxista/record"), win, fail, options);
    }
    var endRecordCliente = function () {
        myMedia.stopRecord();
        //alert("AQUI");
        var options = new FileUploadOptions();
        options.chunkedMode = false;

        options.headers = {
            Connection: "close"
        };
        options.fileKey = "file";
        options.fileName = audioRecord;
        options.mimeType = "audio/wav";
        var ft = new FileTransfer();
        ft.upload(myMedia.src, encodeURI("http://taxialcantarilla.es/taxista/recordCliente"), winClientes, fail, options);
    }


    initTaxista();
})
