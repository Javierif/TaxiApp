angular.module('starter.controllers.taxista', [])

.controller('MapaTaxistaCtrl', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout, $sails) {
    var usuario = Usuario.usuario();
    var paradas = Peticiones.getParadas(usuario.grupo);
    $scope.ubicarDisponible = {};
    var myMedia;
    paradas.then(function (result) {
        $scope.paradas = result;
    })

    $ionicLoading.show({
        template: '<i class="icon ion-looping"></i> Cargando tu posicion...'
    });

    $scope.record = function () {
        myMedia = new Media("record.wav");
        myMedia.startRecord();
    };

    $scope.stopRecord = function () {
        myMedia.stopRecord();
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
                    $scope.socios[socio].marcador.setIcon('http://maps.google.com/mapfiles/kml/paddle/grn-circle-lv.png');
                } else {
                    $scope.socios[socio].puestoglobal = null;
                    $scope.socios[socio].puestolocal = null;
                    $scope.socios[socio].paralocal = null;
                    $scope.socios[socio].marcador.setIcon('http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png');
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

    $scope.ubicar = function () {
        if ($scope.ubicarDisponible.disponible) {
            var ubicame = Peticiones.ubicar($scope.ubicarDisponible.id, usuario.grupo);
            ubicame.then(function (result) {
                console.log("UBICACION ", result)
            });
        }
    }

    window.navigator.geolocation.watchPosition(function (location, error, options) {
        if (location.coords.accuracy < 250) {
            for (socio in $scope.socios) {
                if ($scope.socios[socio].id == usuario.id) {
                    var posicion = new google.maps.LatLng(resp.latitud, resp.longitud);
                    $scope.socios[socio].marcador.setPosition(posicion);
                    $scope.mapa.setCenter(posicion);
                    for (parada in $scope.paradas) {
                        var distancia = calculaDistancia(location.coords.latitude, location.coords.longitude, $scope.socios[socio].latitud, $scope.socios[socio].longitude);
                        console.log(" PARADA DISTANCIA: " + distancia + "NOMBRE: " + $scope.paradas[parada].nombre);
                    }
                    break;
                }
            }

            $sails.post('/taxista/moviendose', {
                user: usuario.id,
                grupo: usuario.grupo,
                latitud: location.coords.latitude,
                longitud: location.coords.longitude
            });
        }
    }, function error(msg) {
        alert('Active la opción de GPS.');

    }, {
        maximumAge: 600000,
        timeout: 5000,
        enableHighAccuracy: true
    });

    var getCurrentPosition = function () {
        window.navigator.geolocation.getCurrentPosition(function (location) {
            console.log("Accuracy " + location.coords.accuracy);
            if (location.coords.accuracy < 250) {
                var socios = Peticiones.getSocios(usuario.grupo);
                socios.then(function (result) {
                    for (socio in result) {
                        if (result[socio].id == usuario.id) {
                            result[socio].latitud = location.coords.latitude;
                            result[socio].longitud = location.coords.longitude;
                            break;
                        }
                    }
                    $scope.socios = result;
                    inicializa(location.coords.latitude, location.coords.longitude);
                });
            } else {
                getCurrentPosition();
            }
        }, function error(msg) {
            alert('Active la opción de GPS.');

        }, {
            maximumAge: 600000,
            timeout: 5000,
            enableHighAccuracy: true
        });
    }
    getCurrentPosition();
    var inicializa = function (latitude, longitude) {
        posInicio = new google.maps.LatLng(latitude, longitude);

        var mapOptions = {
            streetViewControl: true,
            center: posInicio,
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        map = new google.maps.Map(document.getElementById("mapa"),
            mapOptions);

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
                icon = 'http://maps.google.com/mapfiles/kml/paddle/grn-circle-lv.png'
            } else {
                icon = 'http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png'
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
        $scope.map = map;
        $ionicLoading.hide();
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
        return dist
    }
})
