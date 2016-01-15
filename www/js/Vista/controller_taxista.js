angular.module('starter.controllers.taxista', [])

.controller('MapaTaxistaCtrl', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout, $sails) {
    // screen.lockOrientation('landscape');
    var usuario = Usuario.usuario();
    var paradas = Peticiones.getParadas(usuario.grupo);
    $scope.ubicarDisponible = {};
    $scope.ubicarDisponible.disabled = "deshabilitado";
    var myMedia;
    $scope.recordImg = "./img/record.png"
    paradas.then(function (result) {
        $scope.paradas = result;
    })

    $ionicLoading.show({
        template: '<i class="icon ion-looping"></i> Cargando tu posicion...'
    });

    $scope.record = function () {
        $scope.recordImg = "./img/recording.png"
        myMedia = new Media("record.wav");
        myMedia.startRecord();
    };

    $scope.stopRecord = function () {
        $scope.recordImg = "./img/record.png"
        myMedia.stopRecord();
    }

    $scope.prueba = function () {
        for (socio in $scope.socios) {
            if ($scope.socios[socio].id == usuario.id) {
                var posicion = new google.maps.LatLng(37.9710623, -1.216041);
                $scope.socios[socio].marcador.setPosition(posicion);
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
                    $scope.socios[socio].puestoglobal = resp.puestoglobal;
                    $scope.socios[socio].marcador.setIcon('./img/activoicon.png');
                } else {
                    $scope.socios[socio].puestoglobal = null;
                    $scope.socios[socio].puestolocal = null;
                    $scope.socios[socio].paralocal = null;
                    $scope.socios[socio].marcador.setIcon('./img/desconectadoicon.png');
                }
            }
        }
    })

    $sails.on('movimiento', function (resp) {
        console.log("RECIBI ", resp);
        for (socio in $scope.socios) {
            if ($scope.socios[socio].id == resp.user) {
                var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
                $scope.socios[socio].marcador.setPosition(posicion);
                break;
            }
        }
    })

    $sails.on('ubicado', function (resp) {

        for (parada in $scope.paradas) {
            if ($scope.paradas[parada].id == resp.parada) {
                for (socio in $scope.socios) {
                    if ($scope.socios[socio].id == resp.socio) {
                        $scope.socios[socio].puestolocal = resp.puesto;
                        $scope.paradas[parada].ubicados.push($scope.socios[socio]);
                    }
                }
            }
            $scope.paradas[parada].ubicados.push(usuario);
        }

    })
    $scope.ubicar = function () {
        var ubicame = Peticiones.ubicar($scope.ubicarDisponible.id, usuario.grupo, usuario.latitud, usuario.longitud);
        ubicame.then(function (result) {


        });
    }
    window.navigator.geolocation.watchPosition(function (location, error, options) {
            alert("Watch ACCUARY " + location.coords.accuracy);
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
                        for (parada in $scope.paradas) {
                            var distancia = calculaDistancia(location.coords.latitude, location.coords.longitude, $scope.paradas[parada].latitud, $scope.paradas[parada].longitud);
                            console.log(" PARADA DISTANCIA: " + distancia + "NOMBRE: " + $scope.paradas[parada].nombre);
                            if (distancia < 0.1) {

                                $scope.ubicarDisponible.id = $scope.paradas[parada].id;
                                $scope.ubicarDisponible.disabled = "";
                                alert("DENTRO  " + $scope.ubicarDisponible.disabled + " ID " + $scope.ubicarDisponible.id);
                                break;
                            } else {
                                $scope.ubicarDisponible.disabled = "deshabilitado";
                            }
                        }
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
            alert("CURRENT ACCUARY " + location.coords.accuracy);
            console.log("Accuracy current" + location.coords.accuracy);
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
                                    $scope.paradas[parada].ubicados.push(result[socio]);
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
            alert('error al obtener geo local error ' + msg);
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
            alert("PARADA " + $scope.paradas[parada].nombre);
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
                $scope.ubicarDisponible.disabled = "";
                alert("DENTRO  " + $scope.ubicarDisponible.disabled + " ID " + $scope.ubicarDisponible.id)
            } else {
                $scope.ubicarDisponible.disabled = "deshabilitado";
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
