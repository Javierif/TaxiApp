angular.module('starter.controllers.clientes', [])

    .controller('ClienteMapaCtrl', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout, $sails, FileUploader, $q, MapaInstancia, MapaControl, $ionicSideMenuDelegate, $ionicModal, $sce) {
    //screen.lockOrientation('landscape');
    var usuario = Usuario.usuario();
    $scope.recordImg = "./img/record.png";
    var geocoder = new google.maps.Geocoder();
    var directionsService = new google.maps.DirectionsService();
    $scope.datetimeValue = new Date();
    $scope.opcion = {
        mascota: false,
        discapacitado: false
    };
    $scope.estiloAceptado = false;
    var timerRespuesta = false;
    var timeRespuesta = 0;



    $scope.toggleLeft = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    // Load the modal from the given template URL
    $ionicModal.fromTemplateUrl('templates/pedirTaxi.html', function ($ionicModal) {
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
            getCurrentPosition();
            mapaeventos();

        });
    }

    var preparaPedido = function () {
        var center = $scope.map.getCenter();
        $scope.localizacion = "http://maps.googleapis.com/maps/api/staticmap?size=640x320&sensor=false&zoom=18&markers=" + center.lat() + "%2C" + center.lng();

    }

    $scope.pedirTaxi = function () {
        preparaPedido();
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
        esperandoTaxi();
    }

    $scope.recogido = function () {
        console.log("RECOGIDO");
        postRecogido();
        if($scope.ruta){
            $scope.ruta.setMap(null);
        }
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
                if(timeRespuesta < 600) {
                    window.plugins.toast.showShortBottom("Todos los taxis esta ocupados, prueba en 5 minutos",
                                                         function (a) {},
                                                         function (b) {});
                }

                timeRespuesta =0;
            } else {
                esperandoTaxi();
            }

        },1000);
    }

    $scope.itemOnLongPress = function () {
        $scope.recordImg = "./img/recording.png";
        record();
    }

    $scope.itemOnTouchEnd = function () {
        $scope.recordImg = "./img/record.png";
        endRecord();
    }

    $scope.geolocation = function () {
        getCurrentPosition(true);
    }

    var getCurrentPosition = function (marcador) {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo tu geoposición…'
        });
        window.navigator.geolocation.getCurrentPosition(function (location) {
            //no importa el accuary en el cliente
            var posicion = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
            $scope.map.panTo(posicion);
            getGeoposicion();
            if(!marcador) {
                usuario.marcador = new google.maps.Marker({
                    position: posicion,
                    icon: './img/activoicon.png',
                    animation: google.maps.Animation.DROP,
                    map: $scope.map
                });
            }  else {
                usuario.marcador.panTo(posicion);
            }

            $ionicLoading.hide();
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
            // 0.1 seconds after the center of the map has changed,
            // set back the marker position.
            window.setTimeout(function () {
                var center = $scope.map.getCenter();
                usuario.marcador.setPosition(center);
            }, 100);
        });
        google.maps.event.addListener($scope.map, "dragstart", function (event) {
            console.log("DRAGGINg");
        });

        google.maps.event.addListener($scope.map, "dragend", function (event) {
            getGeoposicion();
            usuario.marcador.setAnimation(4); // fall
        });
    }

    var getGeoposicion = function () {
        window.setTimeout(function () {
            var center = $scope.map.getCenter();
            usuario.marcador.setPosition(center);
            geocoder.geocode({
                'latLng': center
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        $scope.ubicaciontext = results[0].formatted_address;
                        $scope.$apply();
                        console.log("RESULTADO " + results[0].formatted_address);
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });
        }, 100);
    };


    var generaRuta = function(from,to){
        if($scope.ruta)
            $scope.ruta.setMap(null);
        var directionsRequest = {
            origin: from,
            destination: to,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        $scope.ruta = directionsService.route(
            directionsRequest,
            function(response, status)
            {
                if (status == google.maps.DirectionsStatus.OK)
                {
                    new google.maps.DirectionsRenderer({
                        map: $scope.map,
                        directions: response
                    });
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
            $scope.estiloAceptado = true;
            $scope.trackear  = resp.taxista;
            $scope.servicioid = resp.servicioid;
            $scope.recogida = new google.maps.LatLng(resp.latRecogida,resp.lngRecogida)
            generaRuta($scope.recogida ,new google.maps.LatLng(resp.latitud,resp.longitud));
        }
    });

    $sails.on('movimiento', function (resp) {
        if ($scope.trackear == resp.user) {
            //aqui en vez de poner un simple marcador ponemos una ruta que venga hacia la recogida pintada, todo chula
            var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
            $scope.socios[socio].marcador.setPosition(posicion);
            generaRuta(posicion,$scope.recogida )
        }
    });

    var postRecogido = function() {
        $sails.post('/cliente/recogido', {
            taxistaid: $scope.trackear,
            servicioid:$scope.servicioid,
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
