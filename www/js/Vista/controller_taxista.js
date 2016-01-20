angular.module('starter.controllers.taxista', [])

.controller('MapaTaxistaCtrl', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout, $sails, FileUploader) {
    //screen.lockOrientation('landscape');
    var usuario = Usuario.usuario();
    var paradas = Peticiones.getParadas(usuario.grupo);
    $scope.ubicarDisponible = {};
    $scope.ubicarDisponible.disabled = true;
    var myMedia;
    $scope.recordImg = "./img/record.png";
    $scope.ubicadoText = "Ubicar";
    $scope.uploader = new FileUploader({
        url: '/administracion/file/upload'
    });

    paradas.then(function (result) {
        $scope.paradas = result.paradas;
        var ubicados = result.ubicados;
        for (parada in $scope.paradas) {
            if (!$scope.paradas[parada].ubicados) {
                $scope.paradas[parada].prioridad = 0;
                $scope.paradas[parada].ubicados = [];
            }
            for (ubicado in ubicados) {
                if ($scope.paradas[parada].id == ubicados[ubicado].parada) {
                    $scope.paradas[parada].prioridad += 1;
                    $scope.paradas[parada].ubicados.push(ubicados[ubicado].taxista);
                    if (ubicados[ubicado].taxista.id == usuario.id) {
                        $scope.ubicadoText = "Desubicar";
                        if ($scope.paradas[parada].id == 0) {
                            $scope.paradas[parada].prioridad = 10000;
                        } else {
                            $scope.paradas[parada].prioridad = 1000;
                        }

                    }
                }
            }
        }

    })



    $ionicLoading.show({
        template: '<i class="icon ion-looping"></i> Cargando tu posicion...'
    });
    var recording = false;
    $scope.record = function () {
        if (!recording) {
            $scope.recordImg = "./img/recording.png";
            var introsound = new Media("./img/record.wav", function mediaSuccess() {
                    myMedia = new Media("recorded.wav");
                    myMedia.startRecord();
                    recording = true;
                },

                function mediaFailure(err) {
                    console.log("An error occurred: " + err.code);
                },

                function mediaStatus(status) {
                    console.log("A status change occurred: " + status.code);
                });

            introsound.play();
        } else {
            $scope.recordImg = "./img/record.png"
            myMedia.stopRecord();
            myMedia.play();
            recording = false;
        }
    };


    var borraUbicacion = function (paradaRecibida, socioRecibido) {
        for (parada in $scope.paradas) {
            if ($scope.paradas[parada].id == paradaRecibida) {
                for (ubicado in $scope.paradas[parada].ubicados) {
                    if ($scope.paradas[parada].ubicados[ubicado].id == socioRecibido) {
                        $scope.paradas[parada].ubicados.splice(ubicado, 1);
                        $scope.paradas[parada].prioridad = $scope.paradas[parada].ubicados.length;
                    }
                }

            }
        }
    }

    var ubica = function (paradaRecibida, socioRecibido) {
        for (parada in $scope.paradas) {
            console.log(" UBICA PARa " + $scope.paradas[parada].id + " Y OTRO " + paradaRecibida);
            if ($scope.paradas[parada].id == paradaRecibida) {
                for (socio in $scope.socios) {
                    if ($scope.socios[socio].id == socioRecibido) {
                        $scope.paradas[parada].ubicados.push($scope.socios[socio]);
                        if ($scope.paradas[parada].id == 0) {
                            $scope.paradas[parada].prioridad = 10000;
                        } else {
                            $scope.paradas[parada].prioridad = 1000;
                        }
                    }
                }
            }
        }
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

    $scope.ubicar = function () {
        if ($scope.ubicadoText == "Ubicar") {
            $sails.post('/taxista/ubicar', {
                parada: $scope.ubicarDisponible.id,
                grupo: usuario.grupo,
                latitud: usuario.latitud,
                longitud: usuario.longitud,
                taxista: usuario.id
            });
            ubica($scope.ubicarDisponible.id, usuario.id);
            $scope.ubicadoText = "Desubicar";

        } else {
            $sails.post('/taxista/desubicar', {
                parada: $scope.ubicarDisponible.id,
                taxista: usuario.id,
                grupo: usuario.grupo
            });
            borraUbicacion($scope.ubicarDisponible.id, usuario.id);
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

    window.navigator.geolocation.watchPosition(function (location, error, options) {
            if (location.coords.accuracy < 150) {
                $sails.post('/taxista/moviendose', {
                    user: usuario.id,
                    grupo: usuario.grupo,
                    latitud: location.coords.latitude,
                    longitud: location.coords.longitude
                });
                for (socio in $scope.socios) {
                    if ($scope.socios[socio].id == usuario.id) {
                        usuario.latitud = location.coords.latitude;
                        usuario.longitud = location.coords.longitude;

                        var posicion = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
                        $scope.socios[socio].marcador.setPosition(posicion);
                        //alert("MOVIENDO " + location.coords.latitude + " Y LONG " + location.coords.longitude)
                        $scope.map.panTo(posicion);
                        valorarUbicacion(location.coords.latitude, location.coords.longitude);

                        break;
                    }
                }
            }
        },
        function error(msg) {}, {
            maximumAge: 600000,
            timeout: 5000,
            enableHighAccuracy: true
        });

    var getCurrentPosition = function () {
        window.navigator.geolocation.getCurrentPosition(function (location) {
            console.log("Accuracy current" + location.coords.accuracy);
            //bajarlo a 150
            if (location.coords.accuracy < 150) {

                $sails.post('/taxista/moviendose', {
                    user: usuario.id,
                    grupo: usuario.grupo,
                    latitud: location.coords.latitude,
                    longitud: location.coords.longitude
                });
                var socios = Peticiones.getSocios(usuario.grupo);
                socios.then(function (result) {
                    for (socio in result) {
                        if (result[socio].puestolocal != null) {
                            for (parada in $scope.paradas) {
                                if ($scope.paradas[parada].id == result[socio].paralocal) {
                                    if ($scope.paradas[parada].ubicados == null)
                                        $scope.paradas[parada].ubicados = [];
                                    $scope.paradas[parada].ubicados.push(result[socio]);
                                    break;
                                }

                            }
                        }
                        if (result[socio].id == usuario.id) {
                            usuario.latitud = location.coords.latitude;
                            usuario.longitud = location.coords.longitude;
                            result[socio].latitud = location.coords.latitude;
                            result[socio].longitud = location.coords.longitude;
                        }
                    }
                    $scope.socios = result;
                    inicializa(location.coords.latitude, location.coords.longitude);
                });
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
    getCurrentPosition();
    var inicializa = function (latitude, longitude) {
        $ionicLoading.hide();
        borraUbicacion(1, usuario.id);
        ubica(1, usuario.id);
        posInicio = new google.maps.LatLng(latitude, longitude);

        var mapOptions = {
            streetViewControl: true,
            center: posInicio,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        map = new google.maps.Map(document.getElementById("mapa"),
            mapOptions);
        console.log("POS INICIO ", posInicio);
        map.setCenter(posInicio);

        for (parada in $scope.paradas) {
            //alert("PARADA " + $scope.paradas[parada].nombre);
            if ($scope.paradas[parada].ubicados == null)
                $scope.paradas[parada].ubicados = [];
            var posicion = new google.maps.LatLng($scope.paradas[parada].latitud, $scope.paradas[parada].longitud);
            var cityCircle = new google.maps.Circle({
                strokeColor: '#2E9AFE',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#2E9AFE',
                fillOpacity: 0.35,
                map: map,
                center: posicion,
                radius: 100
            });

            var distancia = calculaDistancia(latitude, longitude, $scope.paradas[parada].latitud, $scope.paradas[parada].longitud);
            if (distancia < 0.1) {
                $scope.ubicarDisponible.id = $scope.paradas[parada].id;
                $scope.ubicarDisponible.disabled = false;
                //alert("DENTRO  " + $scope.ubicarDisponible.disabled + " ID " + $scope.ubicarDisponible.id)
            } else {
                $scope.ubicarDisponible.disabled = true;
            }

        }

        for (socio in $scope.socios) {
            console.log("SOCIO ", $scope.socios[socio].latitud, $scope.socios[socio].longitud)
            var posicion = new google.maps.LatLng($scope.socios[socio].latitud, $scope.socios[socio].longitud);

            var contentString = '<strong>Taxi nº: </strong> ' +
                $scope.socios[socio].numerotaxi;


            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });
            var icon;
            if ($scope.socios[socio].conectado || $scope.socios[socio].id == usuario.id) {
                icon = './img/activoicon.png'
            } else {
                icon = './img/desconectadoicon.png'
            }
            var marcador = new google.maps.Marker({
                position: posicion,
                icon: icon,
                map: map
            });
            $scope.socios[socio].marcador = marcador;
            marcador.addListener('click', function (marker) {
                infowindow.open(map, $scope.socios[socio].marcador);
            });

            infowindow.open(map, marcador);
        }
        console.log("EL CENTRO ES1  ", map);
        map.setCenter(posInicio);
        $scope.map = map;

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
})
