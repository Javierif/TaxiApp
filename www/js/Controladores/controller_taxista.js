angular.module('starter.controllers.taxista', [])

    .controller('TaxistaCtrl', function ($scope, MapaInstancia) {
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
    var GoogleMaps = {geocoder:new google.maps.Geocoder(),directionsService:new google.maps.DirectionsService()};


    $scope.servicio = {id:0,mascota: false,discapacitado: false,estiloServicio:false,progressValue:0,progresstyle:"",atendiendo:false};


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
            destination:$scope.servicio.recogida,
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
    }

    var directionsDestino = function() {
        var directionsRequest = {
            origin: $scope.servicio.recogida,
            destination: $scope.servicio.destino,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        directionsService.route(directionsRequest,
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
        $scope.modalPedir.hide();
        $scope.servicio.estiloServicio = false;
        $scope.servicio.atendiendo = false;
        MapaInstancia.ocupar(false);
        var latdestino;
        var lngdestino;
        if($scope.destino) {
            latdestino = $scope.destino.lat();
            lngdestino = $scope.destino.lng();
        } PostSails.postRechazar($scope.recogida.lat(),$scope.recogida.lng(),latdestino,lngdestino,fecha,$scope.servicioid,mascota,dispacitado,usuario.id,motivo);
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
                PostSails.postResolverServicio(res);
                MapaInstancia.ocupar(false);
            } else {
                window.plugins.toast.showShortBottom("Selecciona una de las opciones",
                                                     function (a) {},
                                                     function (b) {});
            }
        });
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
            if (distancia > 0.15 && distancia < 0.3) {
                if (!limite) {
                    limite = true;
                }
            }
        }
        if (radio) {
            $scope.ubicarDisponible.id = $scope.paradas[parada].id;
            $scope.ubicarDisponible.disabled = false;
        }
        if (!radio && !limite && $scope.paradas && $scope.paradas.length>1) {
            console.log("ESTAS FUERA DEL RANGO WUON! y los socios son " + JSON.stringify($scope.paradas));
            $scope.ubicarDisponible.disabled = true;
            $scope.ubicar();
        }
        if (limite && !radio) {
            $scope.ubicarDisponible.disabled = true;
        }
    }

    var muevete = function (latitud, longitud) {
        PostSails.postMoviendose(usuario.id, usuario.grupo, latitud, longitud);
        usuario.latitud = latitud;
        usuario.longitud = longitud;
        var posicion = new google.maps.LatLng(latitud, longitud);
        $scope.socios = MapaInstancia.actualizaPosicion(posicion);
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
            $scope.servicio.estiloServicio = true;
            var servicio = Servicio.getServicio();
            console.log("EL SERVICIO CARGADO ES " + JSON.stringify(servicio));
            $scope.servicio.id = servicio.id;
            $scope.recogida = new google.maps.LatLng(servicio.recogidaLat,servicio.recogidaLng);
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
                    $scope.recogida =  new google.maps.LatLng($scope.servicio.latrecogida,$scope.servicio.lngrecogida);
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
                if($scope.progressValue != 10) {
                    cuenta();
                } else {
                    rechazarServicio("No Atendido");
                }
            } else {
                $scope.servicio.progressValue = 0;
                $scope.modalPedir.hide();
                MapaInstancia.ocupar(true);
            }
        }, 1000);
    }

    $sails.on('connect', function socketConnected() {
        $sails.get("/taxista/conectarse/" + usuario.id + "/" + usuario.grupo);
    });

    $sails.on('reconnect', function (transport, numAttempts) {
    });

    $sails.on('conexion', function (resp) {
        console.log("CONECTADO " + JSON.stringify(resp));
        $scope.socios = MapaInstancia.conectaTaxi(resp);
        try{
            if(resp.conectado) {
                var myMedia = new Media("./img/on.wav");
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
            var myMedia = new Media("./img/ubicar.wav");
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
            $scope.servicio.latRecogida = resp.latRecogida;
            $scope.servicio.lngRecogida = resp.lngRecogida;
            $scope.servicio.latDestino = resp.latDestino;
            $scope.servicio.lngDestino = resp.lngDestino;
            $scope.servicio.fechaRecogida = resp.fechaRecogida;
            $scope.servicio.animal = resp.animal;
            $scope.servicio.discapacitado = resp.dispacitado;
            servicio()
        }
    });

    $sails.on('AudioInterno', function(resp) {
        alert("ANTES DE REPRODUCIR DIGO QUE " + JSON.stringify(resp));
        var introsound = new Media("http://taxialcantarilla.es"+resp.url)
        introsound.play()
    })

    $sails.on('AudioCliente', function(resp) {

        if(resp.servicioid == $scope.servicioid) {
            alert("ANTES DE REPRODUCIR DIGO QUE " + JSON.stringify(resp));
            var introsound = new Media("http://taxialcantarilla.es"+resp.url)
            introsound.play()
        }
    })

    //Prepares File System for Audio Recording
    audioRecord = 'recorded.wav';
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

    var endRecordCliente = function () {
        myMedia.stopRecord();
        myMedia.play();
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
