angular.module('starter.controllers.clientes', [])

    .controller('ClienteMapaCtrl', function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, Servicio, $compile, $timeout, $sails, FileUploader, $q, MapaInstancia, $ionicSideMenuDelegate, $ionicModal, $sce) {

    var usuario = Usuario.usuario();
    var googlemaps = {geocoder: new google.maps.Geocoder(),directions:new google.maps.DirectionsService()};
    $scope.servicio = Servicio.getServicio();;
    $scope.datetimeValue = new Date();
    $scope.marcadoresServicio = [];
    var timeRespuesta = 0;

    $scope.toggleLeft = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    // Load the modal from the given template URL
    $ionicModal.fromTemplateUrl('templates/pedirTaxi.html', function ($ionicModal) {
        $scope.modalPedir = $ionicModal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
    });

    var initTaxista = function () {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo el mapa…'
        });
        inicializaMapa();
        google.maps.event.addListenerOnce($scope.map, 'idle', function () {
            getCurrentPosition(false);
            mapaeventos();
        });
    }

    $scope.pedirTaxi = function () {
        var center = $scope.map.getCenter();
        $scope.localizacion = "http://maps.googleapis.com/maps/api/staticmap?size=640x320&sensor=false&zoom=18&markers=" + center.lat() + "%2C" + center.lng();
        $scope.modalPedir.show();
    }

    $scope.confirmarTaxi = function (destino, fecha, discapacitado, mascota) {
        var center = $scope.map.getCenter();
        var latdestino;
        var lngdestino;
        if (destino) {
            latdestino = destino.geometry.location.lat();
            lngdestino = destino.geometry.location.lng();
        }
        $sails.post('/cliente/pedirtaxi', {
            idCliente: usuario.id,
            grupo: 1,
            latRecogida: center.lat(),
            lngRecogida: center.lng(),
            latDestino: latdestino,
            lngDestino: lngdestino,
            fechaRecogida: fecha,
            discapacitado: discapacitado,
            mascota: mascota
        });
        //funcion pedir cuanto tiempo espero
        esperandoTaxi();
    }

    $scope.recogido = function () {
        var myPopup = $ionicPopup.show({
            template: '',
            title: '¿Ya se ha montado en el taxi?',
            scope: $scope,
            buttons: [
                {
                    text: 'NO',
                    type: 'button button-outline button-energized'
                },
                {
                    text: 'SI',
                    type: 'button button-energized',
                    scope: $scope,
                    onTap: function (e) {
                        return true;
                    }
                }
            ]
        });
        myPopup.then(function (res) {
            if(res) {
                console.log("RECOGIDO");
                postRecogido();
                if($scope.ruta){
                    $scope.ruta.setMap(null);
                }
                $scope.servicio.estiloServicio = false;
                for(marcador in $scope.marcadoresServicio) {
                    $scope.marcadoresServicio[marcador].setMap(null);
                }
                Servicio.resuelveServicio();
            }
        });
    }

    $scope.rechazaServicio = function () {
        var myPopup = $ionicPopup.show({
            template: 'Tenga en cuenta que el taxista puede estar ya en camino, solo rechace el servicio si es estrictamente necesario.',
            title: '¿Está usted segur@?',
            scope: $scope,
            buttons: [
                {
                    text: 'NO',
                    type: 'button button-outline button-energized'
                },
                {
                    text: 'SI',
                    type: 'button button-energized',
                    scope: $scope,
                    onTap: function (e) {
                        return true;
                    }
                }
            ]
        });
        myPopup.then(function (res) {
            if(res) {
                console.log("RECOGIDO");
                postRechazar();
                if($scope.ruta){
                    $scope.ruta.setMap(null);
                }
                $scope.servicio.estiloServicio = false;
                Servicio.resuelveServicio();
            }

        });
    }

    $scope.itemOnLongPress = function () {
        record();
    }

    $scope.itemOnTouchEnd = function () {
        endRecord();
    }

    $scope.geolocation = function () {
        getCurrentPosition(true);
    }

    var esperandoTaxi = function() {
        $timeout(function() {
            var hours   = Math.floor(timeRespuesta / 3600);
            var minutes = Math.floor((timeRespuesta - (hours * 3600)) / 60);
            var seconds = timeRespuesta - (hours * 3600) - (minutes * 60);
            if (hours   < 10) {hours   = "0"+hours;}
            if (minutes < 10) {minutes = "0"+minutes;}
            if (seconds < 10) {seconds = "0"+seconds;}
            var time    = minutes+':'+seconds;
            timeRespuesta = timeRespuesta + 1;
            $ionicLoading.show({
                template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Conectandonos con los taxistas.<br> tiempo estimado: 02:00 <br> tiempo espera: '+time
            });
            if(timeRespuesta >200){
                $ionicLoading.hide();
                $scope.modalPedir.hide();
                if(timeRespuesta > 600) {
                    try{
                        window.plugins.toast.showShortBottom("Todos los taxis esta ocupados, prueba en 5 minutos",
                                                             function (a) {},
                                                             function (b) {});
                    } catch(e){}

                }

                timeRespuesta =0;
            } else {
                esperandoTaxi();
            }

        },1000);
    }

    var compruebaServicio = function() {
        if(Servicio.compruebaServicio()){
            $scope.servicio = Servicio.getServicio();
            generaRuta(new google.maps.LatLng($scope.servicio.latrecogido,$scope.servicio.lngrecogido) ,new google.maps.LatLng($scope.servicio.latdestino,$scope.servicio.lngdestino));
        }
    }

    var getCurrentPosition = function (marcador) {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo tu geoposición…'
        });
        window.navigator.geolocation.getCurrentPosition(function (location) {
            //no importa el accuary en el cliente
            var posicion = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
            $scope.map.panTo(posicion);
            $ionicLoading.hide();
            getGeoposicion();
            if(!marcador) {
                usuario.marcador = new google.maps.Marker({
                    position: posicion,
                    icon: './img/esperataxi.png',
                    animation: google.maps.Animation.DROP,
                    map: $scope.map
                });
                compruebaServicio();
            }  else {
                usuario.marcador.panTo(posicion);
            }


        }, function error(msg) {
            alert('error al obtener geo local error ' + JSON.stringify(msg));
            getCurrentPosition();
        }, {
            maximumAge: 600000,
            enableHighAccuracy: false,
            timeout: 50000
        });
    }

    var inicializaMapa = function () {
        var mapOptions = {
            streetViewControl: false,
            zoom: 18,
            draggable: true,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            disableDefaultUI: true
        };
        $scope.map = new google.maps.Map(document.getElementById("mapa"),
                                         mapOptions);
        return $scope.map;
    }

    var mapaeventos = function () {
        google.maps.event.addListener($scope.map, 'center_changed', function () {
            window.setTimeout(function () {
                if(!$scope.servicio.estiloServicio){
                    var center = $scope.map.getCenter();
                    usuario.marcador.setPosition(center);
                    usuario.marcador.setIcon('./img/pedirtaxi.png');
                }
            }, 100);
        });
        google.maps.event.addListener($scope.map, "dragstart", function (event) {

        });

        google.maps.event.addListener($scope.map, "dragend", function (event) {
            if(!$scope.servicio.estiloServicio){
                usuario.marcador.setAnimation(4); // fall
                getGeoposicion();
                usuario.marcador.setIcon('./img/esperataxi.png')
            }
        });
    }

    var getGeoposicion = function () {
        window.setTimeout(function () {
            var center = $scope.map.getCenter();
            usuario.marcador.setPosition(center);
            googlemaps.geocoder.geocode({
                'latLng': center
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        $scope.ubicaciontext = results[0].formatted_address;
                        $scope.$apply();
                    } else {
                        console.log('No results found');
                    }
                } else {
                    console.log('Geocoder failed due to: ' + status);
                }
            });
        }, 100);
    };

    var generaRuta = function(from,to){
        if($scope.ruta)
            $scope.ruta.setMap(null);
        var directionsRequest = {
            origin: to,
            destination: from,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        googlemaps.directions.route(
            directionsRequest,
            function(response, status)
            {
                if (status == google.maps.DirectionsStatus.OK)
                {
                    $scope.ruta = new google.maps.DirectionsRenderer({
                        map: $scope.map,
                        directions: response,
                        suppressMarkers : true
                    });
                    var markerini = new google.maps.Marker({
                        position: to,
                        map: $scope.map,
                        icon: './img/activoicon.png',
                    });
                    $scope.marcadoresServicio.push(markerini);

                }
            }
        );;
    };

    $sails.get("/cliente/conectarse/" + usuario.id + "/1");

    $sails.on("Aceptado", function (resp) {
        console.log("ME LLEGO QUE ME ACEPTO! " + resp.cliente +" yo " + usuario.id);
        console.log(" TODO " + JSON.stringify(resp))
        if(resp.cliente == usuario.id) {
            timeRespuesta=1000;
            $scope.servicio.estiloServicio = true;
            $scope.servicio.taxiTrackear  = resp.taxista;
            $scope.servicio.id = resp.servicioid;
            $scope.servicio.latrecogida = resp.latRecogida;
            $scope.servicio.lngrecogida = resp.lngRecogida;
            Servicio.guardarServicio($scope.servicio);
            generaRuta(new google.maps.LatLng(resp.latRecogida,resp.lngRecogida) ,new google.maps.LatLng(resp.latitud,resp.longitud));
        }
    });

    $sails.on("noatendido", function(resp) {
        if(resp.idcliente == usuario.id) {
            timeRespuesta =700;
        }
    })

    $sails.on('movimiento', function (resp) {
        if ($scope.servicio.taxiTrackear&&$scope.servicio.taxiTrackear == resp.user) {
            //aqui en vez de poner un simple marcador ponemos una ruta que venga hacia la recogida pintada, todo chula
            var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
            $scope.marcadoresServicio[0].setPosition(posicion);
            generaRuta(posicion,new google.maps.LatLng($scope.servicio.latrecogida,$scope.servicio.lngrecogida));
        }
    });

    $sails.on('AudioCliente', function(resp) {
        if(resp.servicioid == $scope.servicioid) {
            var introsound;
            if(resp.urlandroid) {
                introsound =  new Media("http://taxialcantarilla.es"+resp.urlandroid)
            } else {
                introsound =  new Media("http://taxialcantarilla.es"+resp.url)
            }

        }
    })

    var postRecogido = function() {
        $sails.post('/cliente/recogido', {
            taxistaid: $scope.servicio.taxiTrackear,
            servicioid:$scope.servicioid,
        });
    }

    var postRechazar = function() {
        $sails.post('/cliente/rechazar', {
            taxistaid: $scope.servicio.taxiTrackear,
            servicioid:$scope.servicioid,
        });
    }

    var postEnviarRecordTaxista = function (res) {
        $sails.post('/cliente/enviarrecord', res);
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
        var response = JSON.parse(r.response);
        postEnviarRecordTaxista({servicioid:$scope.servicioid,urlaudio:response.url,grupo:1});
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
        //myMedia.play();

        var options = new FileUploadOptions();
        options.chunkedMode = false;

        options.headers = {
            Connection: "close"
        };
        options.fileKey = "file";
        options.fileName = audioRecord;
        options.mimeType = "audio/wav";
        var ft = new FileTransfer();
        ft.upload(myMedia.src, encodeURI("http://taxialcantarilla.es/cliente/record"), win, fail, options);
    }


    initTaxista();
})
