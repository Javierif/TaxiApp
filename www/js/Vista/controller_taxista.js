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

.controller('MapaTaxistaCtrl', function ($scope, Ofertas, $ionicLoading, Peticiones, server_constantes, Usuario, $timeout, $sails, FileUploader, MapaInstancia, MapaControl, $ionicSideMenuDelegate, $ionicModal, $filter) {
    //screen.lockOrientation('landscape');
    var usuario = Usuario.usuario();
    $scope.ubicarDisponible = {};
    $scope.ubicarDisponible.disabled = true;
    $scope.recordImg = "./img/record.png";
    $scope.ubicadoText;
    $scope.route = [];
    var servicioTimeOut=[];
    var geocoder = new google.maps.Geocoder();
    $scope.opcion = {
        mascota: false,
        discapacitado: false
    };
    $scope.progressValue = 0;

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
            },
            function error(msg) {}, {
                maximumAge: 600000,
                timeout: 5000,
                enableHighAccuracy: true
            });
    }

    var getCurrentPosition = function () {

        window.navigator.geolocation.getCurrentPosition(function (location) {
            console.log("ACCUARY" + location.coords.accuracy)
            if (location.coords.accuracy < 1500) {
                muevete(location.coords.latitude, location.coords.longitude);
                $ionicLoading.hide();
                //comenzamos a observar si te mueves
                observaPosicion();
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

    var checkTurno = function (latitud, longitud, latdestino, lngdestino, fechaRecogida, servicioid,mascota,discapacitado,socioid) {
        var puesto = 0;
        if(socioid) {
            var servicioObtenido = $filter('Object')(servicioTimeOut,{servicioid:servicioid});
            $timeout.cancel(servicioObtenido.timeout);
        }
        for (parada in $scope.paradas) {
            console.log("Paradas 1" + $scope.paradas[parada].parada);
            $scope.paradas[parada].distanciaservicio = calculaDistancia(latitud, longitud, $scope.paradas[parada].latitud, $scope.paradas[parada].longitud);
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
        console.log("MI PUESTO es " + puesto + "Y LOS SOCIOS SOMOS... " + $scope.socios.length)
        if(puesto == $scope.socios.length) {
            alert("CUIDADIN QUE SOY EL ULTIMO :O")
        }
        var tiempo = puesto * 10000;
        console.log("PUESTO "+ puesto + " SOCIOS "+ $scope.socios.length)
        var timeout = $timeout(function() {
            alert("TE TOCA!");
            servicio(latitud,longitud,latdestino,lngdestino,fechaRecogida,mascota,discapacitado);
        },tiempo)
        servicioTimeOut.push({servicioid:servicioid,timeout:timeout});
    }

    var servicio = function(latrecogida,lngrecogida,latdestino,lngdestino,fecha,mascota,discapacitado) {
            var distancia = calculaDistancia(lngrecogida, lngrecogida,latdestino,lngdestino);
            var zoom = 16;
            if (distancia>2) {
                zoom = 12
            }
            $scope.localizacion = "http://maps.googleapis.com/maps/api/staticmap?size=640x320&sensor=false&zoom="+zoom+"&markers=" + latrecogida + "%2C" + lngrecogida+"8&markers=color:0x4592ba|"+latdestino + "%2C" +lngdestino;
            geocoder.geocode({
                'latLng': new google.maps.LatLng(latrecogida,lngrecogida)
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
            geocoder.geocode({
                'latLng': new google.maps.LatLng(latdestino,lngdestino)
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        $scope.destinoText =  results[0].formatted_address;
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });
            $scope.datetimeValue = fecha;
            $scope.opcion.mascota = mascota;
            $scope.opcion.discapacitado = discapacitado;
            $scope.modalPedir.show();
            cuenta();

    }

    var cuenta = function() {
      $timeout(function(){
        $scope.progressValue = $scope.progressValue + 1;
        var total =  $scope.progressValue * 10;
        $scope.progresstyle = "width:"+total+"%";
        if($scope.progressValue != 10) {
            cuenta();
        } else {
            $scope.progressValue = 0;
            $scope.modalPedir.hide();
        }
      }, 1000);
    }

    $sails.get("/taxista/conectarse/" + usuario.id + "/" + usuario.grupo);

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
        checkTurno(resp.latRecogida, resp.lngRecogida, resp.latDestino,resp.lngDestino,resp.fechaRecogida,resp.id,resp.animal,resp.dispacitado);
    });

    $sails.on('ServicioRechazado', function (resp) {
        console.log("Rechazado SERVICIO");
        checkTurno(resp.latRecogida, resp.lngRecogida,resp.latDestino,resp.lngDestino,resp.fechaRecogida,resp.id, resp.animal,resp.dispacitado,resp.idSocio);
    });



    var postMoviendose = function (usuarioId, grupo, latitud, longitud) {
        $sails.post('/taxista/moviendose', {
            user: usuarioId,
            grupo: grupo,
            latitud: latitud,
            longitud: longitud
        });
    }

    var postUbicar = function (paradaId, grupo, latitud, longitud, taxistaId) {
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
