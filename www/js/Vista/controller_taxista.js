angular.module('starter.controllers.taxista', [])

.controller('MapaTaxistaCtrl', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout, $sails, FileUploader, $q, MapaInstancia, MapaControl) {
    //screen.lockOrientation('landscape');
    var usuario = Usuario.usuario();
    $scope.ubicarDisponible = {};
    $scope.ubicarDisponible.disabled = true;
    $scope.recordImg = "./img/record.png";
    $scope.ubicadoText;

    var initTaxista = function () {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo el mapa…'
        });
        inicializaMapa();
        google.maps.event.addListenerOnce($scope.map, 'idle', function () {
            MapaInstancia.cargaMapa(usuario, $scope.map).then(function () {
                $scope.paradas = MapaInstancia.getParadas();
                console.log("CARGADO DE insta parada" + JSON.stringify($scope.paradas));
                $scope.socios = MapaInstancia.getSocios();
                $scope.ubicadoText = MapaInstancia.getUbicadoText();
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
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-balanced"></ion-spinner><br> Obteniendo tu geoposición…'
        });
        window.navigator.geolocation.getCurrentPosition(function (location) {
            console.log("Accuracy current" + location.coords.accuracy);
            alert("accuary" + location.coords.accuracy);
            //bajarlo a 150
            if (location.coords.accuracy < 150) {
                muevete(location.coords.latitude, location.coords.longitude);
                $ionicLoading.hide();
                //comenzamos a observar si te mueves
                observaPosicion();
            } else {
                getCurrentPosition();
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
            mapTypeId: google.maps.MapTypeId.TERRAIN
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


    $sails.get("/taxista/conectarse/" + usuario.id + "/" + usuario.grupo);

    $sails.on("Web_Usuario", function (resp) {
        console.log("RECIBI ", resp);
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
        console.log("SE CONECTO ALGUIEN");
        for (socio in $scope.socios) {
            if (resp.id == $scope.socios[socio].id) {
                $scope.socios[socio].conectado = resp.conectado;
                if (resp.conectado) {
                    borraUbicacion(1, resp.id);
                    ubica(1, resp.id);
                    $scope.socios[socio].marcador.setIcon('./img/activoicon.png');
                    var myMedia = new Media("./img/on.wav");
                    myMedia.play();
                    window.plugins.toast.showShortBottom("Se ha conectado el taxi nº" + resp.id,
                        function (a) {},
                        function (b) {});
                } else {
                    borraUbicacion(1, resp.id);
                    $scope.socios[socio].marcador.setIcon('./img/desconectadoicon.png');
                    window.plugins.toast.showShortBottom("Se ha desconectado el taxi nº" + resp.id,
                        function (a) {},
                        function (b) {});
                }
            }
        }
    });

    $sails.on('movimiento', function (resp) {
        console.log("RECIBI ", resp);
        for (socio in $scope.socios) {
            if ($scope.socios[socio].id == resp.user) {
                var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
                $scope.socios[socio].marcador.setPosition(posicion);
                break;
            }
        }
    });

    $sails.on('ubicado', function (resp) {
        console.log("SE UBICO " + JSON.stringify(resp));
        var myMedia = new Media("./img/ubicar.wav");
        myMedia.play();
        ubica(resp.parada, resp.socio);
    });

    $sails.on('desubicar', function (resp) {
        console.log("DESUBICANDO A " + JSON.stringify(resp));
        borraUbicacion(resp.parada, resp.socio);
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
