angular.module('starter.controllers', [])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout, Usuario, $state) {
    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };
    var usuario = Usuario.usuario();

    if (usuario.email)
        Usuario.setEstado("Perfil");
    $scope.log = Usuario.getEstado();
    // Open the login modal
    $scope.login = function (layout) {
        var usuario = Usuario.usuario();
        if (!usuario.email) {
            console.log("HASTA AQUI")
            $state.go("app.login")
        } else {
            switch (layout) {
            case 0:
                $state.go("app.perfil")
                break;
            case 1:
                $state.go("app.mipharmaprive")
                break;
            case 2:
                $state.go("app.reservas")
            }
        }

    };

})

.controller('inicioCtrl', function ($scope, Peticiones, $state, $ionicLoading, Usuario, Comercios, Ofertas, $compile) {

    $scope.entrar = function () {
        $state.go("app.mostradorofertas");
    }
    Usuario.loadusuario()
    var usuario = Usuario.usuario();
    $scope.id = usuario.codigoCliente;
    if (!usuario.codigoCliente) {
        var usuario = Peticiones.creaAnonimo();
        usuario.then(function (result) {
            Usuario.set('codigoCliente', result.usuario.id);
            Usuario.borrarusuario();
            Usuario.saveusuario();
            $scope.id2 = usuario.codigoCliente
        });
    }

})


.controller('loginCtrl', function ($scope, Peticiones, $state, $ionicLoading, Usuario, Comercios, Ofertas, $compile) {

    $scope.registro = function () {
        $state.go("app.registro");
    }

    $scope.login = function (email) {
        $ionicLoading.show({
            template: '<i class="icon ion-looping"></i> Conectando con el servidor...'
        });
        var respuesta = Peticiones.login(email);
        respuesta.then(
            function (result) {
                if (result[0])
                    result = result[0];
                // window.plugins.toast.showLongBottom(result.error_msg, function (a) {}, function (b) {});
                if (!result.error) {
                    $ionicLoading.hide();
                    Usuario.borrarusuario();
                    Usuario.set('email', result.email);
                    Usuario.set('codigoCliente', result.id);
                    Usuario.set('telefono', result.telefono);
                    Usuario.set('codigoPostal', result.codigoPostal);
                    Usuario.set('fechaNacimiento', result.anoNacimiento);
                    Usuario.set('genero', result.sexo);
                    Usuario.set('codigoFarmacia', result.codigoFarmacia);
                    Usuario.saveusuario();
                    console.log(Usuario.usuario());
                    $state.go("app.mostradorofertas");
                } else {
                    window.plugins.toast.showShortBottom(result.msg,
                        function (a) {},
                        function (b) {});
                    $ionicLoading.hide();
                }
            },
            function (errorPlayload) {});
    }

})


.controller('RegistroCtrl', function ($scope, Peticiones, $state, Ofertas, $ionicLoading, Usuario, $ionicNavBarDelegate) {
    var usuario = Usuario.usuario();
    $scope.registrarse = function (cp, email, fnac, sex, telf, codfarma, nombre) {

        if (angular.isUndefined(cp) || cp == null) {
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su codigo postal",
                function (a) {},
                function (b) {}
            );
        }
        if (angular.isUndefined(email) || email == null) {
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su email",
                function (a) {},
                function (b) {}
            );
        } else {

            $ionicLoading.show({
                template: '<i class="icon ion-looping"></i> registrando usuario...'
            });

            var respuesta = Peticiones.registrar(usuario.codigoCliente, cp, email, fnac, sex, telf, codfarma, nombre);
            respuesta.then(
                function (result) {
                    if (!result.error) {
                        $ionicLoading.hide();
                        Usuario.set('email', email);
                        Usuario.set('codigoCliente', result.codigo);
                        Usuario.set('codigoPostal', cp);
                        Usuario.set('fechaNacimiento', fnac);
                        Usuario.set('genero', sex);
                        Usuario.set('nombre', nombre);
                        if (!(angular.isUndefined(telf)) && !(telf == null)) {
                            Usuario.set('telefono', telf);
                        }
                        if (!(angular.isUndefined(codfarma)) && !(codfarma == null)) {
                            Usuario.set('codigoFarmacia', codfarma);
                        }
                        $state.go("app.mostradorofertas");
                    } else {
                        window.plugins.toast.showShortBottom(result.msg,
                            function (a) {},
                            function (b) {});
                        $ionicLoading.hide();
                    }
                },
                function (errorPlayload) {
                    $ionicLoading.hide();
                    alert("error");
                });
        }
    }
})

.controller('MostradorOfertasCtrl', function ($ionicPlatform, $scope, Peticiones, $state, Ofertas, $ionicLoading, Usuario) {
    $ionicLoading.show({
        template: '<i class="icon ion-looping"></i>Espere un momento, descargando las ofertas...'
    });
    var usuario = Usuario.usuario();
    var ofertasGenerales = Peticiones.getOfertasGenerales(usuario.codigoCliente);
    ofertasGenerales.then(function (result) {
        $scope.ofertasGenerales = result;
        $ionicLoading.hide();
    });
    $scope.ofertas = Ofertas.getofertas();

    window.navigator.geolocation.getCurrentPosition(function (location) {
        var especificas = Peticiones.getOfertasEspecificas(location.coords.latitude, location.coords.longitude);
        especificas.then(function (result) {
            $scope.ofertasEspecificas = result;
        });
    });
    $scope.detalle = function (oferta) {
        Ofertas.setViendoOferta(oferta);
        $state.go("app.detalleoferta");
    }
    $ionicPlatform.onHardwareBackButton(function () {
        event.preventDefault();
        event.stopPropagation();
    });
})

.controller('DetalleOfertaCtrl', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout) {

    $scope.oferta = Ofertas.getViendoOferta();
    var usuario = Usuario.usuario();
    var map;
    var posInicio;
    if ($scope.oferta.asociado) {
        var farmaciaAsociada = Peticiones.getFarmacia($scope.oferta.asociado);
        farmaciaAsociada.then(function (result) {
            console.log("RESUL ", result);
            $scope.farmacias[0] = result;
        });
    } else {
        window.navigator.geolocation.getCurrentPosition(function (location) {
            var farmaciasCercanas = Peticiones.getFarmacias(location.coords.latitude, location.coords.longitude);
            farmaciasCercanas.then(function (result) {
                $scope.farmacias = result;
            });
        });
    }


    var inicializa = function () {
        if (!$scope.farmacias)
            return;
        if ($scope.farmacias.lenght > 1) {
            var zoom = 8;
        } else {
            var zoom = 15;
        }

        posInicio = new google.maps.LatLng($scope.farmacias[0].latitud, $scope.farmacias[0].longitud);
        var mapOptions = {
            streetViewControl: true,
            center: posInicio,
            zoom: zoom,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        map = new google.maps.Map(document.getElementById("map"),
            mapOptions);

        for (farmacia in $scope.farmacias) {
            var posicion = new google.maps.LatLng($scope.farmacias[farmacia].latitud, $scope.farmacias[farmacia].longitud);

            console.log("farmacias ", $scope.farmacias);
            console.log("direc ", $scope.farmacias[farmacia].direccion);
            var contentString = '<strong>Dirección de la farmacia: </strong> ' +
                $scope.farmacias[farmacia].direccion;


            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            var farmaciaMarker = new google.maps.Marker({
                position: posicion,
                map: map
            });
            farmaciaMarker.addListener('click', function () {
                infowindow.open(map, farmaciaMarker);
            });

            var farmaciaMarker = new google.maps.Marker({
                position: posicion,
                map: map
            });
            infowindow.open(map, farmaciaMarker);
        }

        reloaded = true;
        $scope.map = map;
    }

    $scope.cupon = function () {
        var disponibilidad = Peticiones.getOferta($scope.oferta.id, usuario.codigoCliente);
        disponibilidad.then(function (result) {
            $scope.oferta.cantidadMaxUser = result[0].cantidadMaxUser;
            ejecutaCupon();
        });
    }

    $scope.reserva = function () {
        var disponibilidad = Peticiones.getOferta($scope.oferta.id, usuario.codigoCliente);
        disponibilidad.then(function (result) {
            $scope.oferta.reservadas = result[0].reservadas
            ejecutaReserva();
        });
    }
    var urls = server_constantes.all();
    $scope.url = urls.URL;

    var ejecutaCupon = function () {
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<input type="number" ng-model="data.cantidadcupon" placeholder= "La cantidad minima es ' + $scope.oferta.cantidadMin + '">',
            title: 'Introduzca la cantidad de articulos que quiere en su cupón descuento',
            subTitle: 'Solo quedan disponibles: ' + $scope.oferta.cantidadMaxUser,
            scope: $scope,
            buttons: [
                {
                    text: 'Cancelar',
                    type: 'button button-outline button-calm'
                },
                {
                    text: 'Ver cupón',
                    type: 'button button-calm',
                    scope: $scope,
                    onTap: function (e) {
                        return $scope.data.cantidadcupon
                    }
              }
            ]
        });
        myPopup.then(function (res) {
            if (!(angular.isUndefined(res)) && !(res == null)) {
                if (res <= 0) {
                    window.plugins.toast.showShortBottom("Introduzca un numero mayor de 0",
                        function (a) {},
                        function (b) {});
                } else if (res < $scope.oferta.cantidadMin) {
                    window.plugins.toast.showShortBottom("La cantidad mínima para poder ofrecerte este cupón es " + $scope.oferta.cantidadMin,
                        function (a) {},
                        function (b) {});
                } else if (res > $scope.oferta.cantidadMaxUser) {
                    window.plugins.toast.showShortBottom("La cantidad maxima disponible para este cupón es " + $scope.oferta.cantidadMaxUser,
                        function (a) {},
                        function (b) {});
                } else {
                    $ionicLoading.show({
                        template: '<i class="icon ion-looping"></i> Obteniendo su código de descuento...'
                    });
                    var cupon = Peticiones.obtenerCupon($scope.oferta.id, usuario.codigoCliente, res);
                    cupon.then(
                        function (result) {
                            $scope.urlcupon = result.url;
                            $scope.barcodecodigo = result.codigo;
                            console.log("cupo ", $scope.url, $scope.urlcupon);
                            var pop = $ionicPopup.show({
                                scope: $scope,
                                template: '<img class="cuponimg" ng-src="{{urlcupon}}"><br><p class="barcode">{{barcodecodigo}}</p>',
                                buttons: [
                                    {
                                        text: 'Salir',
                                        type: 'button-positive'
                                        }
                                    ]
                            });
                            $ionicLoading.hide();
                        }
                    );
                }
            }
        });
        $timeout(function () {
            myPopup.close(); //close the popup after 20 seconds for some reason
        }, 20000);
    };

    //tengo que hacer que si no esta registrado avisarle que se registre
    var ejecutaReserva = function () {
        $scope.data = {};
        var boton;
        var texto = "Introduzca la cantidad de articulos que quiere reservar";
        if (!usuario.email) {
            boton = "Iniciar sesión";
        } else if (!usuario.farmacia) {
            boton = "Ver Farmacias PharmaPrivé";
            texto = "No tienes farmacia asignada, para poder reservar necesitas tener una farmacia PharmaPrivé.";
        } else  {
            boton = "Reservar";
        }
        var myPopup = $ionicPopup.show({
            template: '<input type="number" ng-model="data.cantidadcupon">',
            title: texto,
            subTitle: 'Tienes reservadas: ' + $scope.oferta.reservadas,
            scope: $scope,
            buttons: [
                {
                    text: 'Cancelar'
                },
                {
                    text: boton,
                    type: 'button-positive',
                    scope: $scope,
                    onTap: function (e) {
                        return $scope.data.cantidadcupon
                    }
              }
            ]
        });
        myPopup.then(function (res) {
            if (!usuario.farmacia) {
                $state.go('app.mipharmaprive');
            } else if (usuario.email) {
                if (!(angular.isUndefined(res)) && !(res == null)) {
                    if (res <= 0) {
                        window.plugins.toast.showShortBottom("Introduzca un numero mayor de 0",
                            function (a) {},
                            function (b) {});
                    } else if (res < $scope.oferta.cantidadMin) {
                        window.plugins.toast.showShortBottom("La cantidad mínima para poder ofrecerte este cupón es " + $scope.oferta.cantidadMin,
                            function (a) {},
                            function (b) {});
                    } else if (res > $scope.oferta.cantidadMaxUser) {
                        window.plugins.toast.showShortBottom("La cantidad maxima disponible para este cupón es " + $scope.oferta.cantidadMaxUser,
                            function (a) {},
                            function (b) {});
                    } else {
                        if (res <= 0) {
                            window.plugins.toast.showShortBottom("Introduzca un numero mayor de 0",
                                function (a) {},
                                function (b) {});
                        } else {
                            $ionicLoading.show({
                                template: '<i class="icon ion-looping"></i> data.cantidadcupon Obteniendo su código de descuento...'
                            });
                            var cupon = Peticiones.reserva($scope.oferta.id, Usuario.get('codigoCliente'), res);
                            cupon.then(
                                function (result) {
                                    if (!result.error) {
                                        window.plugins.toast.showShortBottom("Reservado correctamente",
                                            function (a) {},
                                            function (b) {});
                                        $scope.oferta.reservadas += res;
                                        $ionicLoading.hide();
                                    } else {
                                        $ionicLoading.hide();
                                    }
                                }
                            );
                        }
                    }
                }
            } else {
                $state.go("app.login");
            }
        });
        $timeout(function () {
            myPopup.close(); //close the popup after 20 seconds for some reason
        }, 20000);
    };
    $scope.info = "mostrado";
    $scope.mapa = "oculto";
    $scope.showinfo = function () {
        $scope.info = "mostrado";
        $scope.mapa = "oculto";
    }
    $scope.showmapa = function () {
        $scope.mapa = "mostrado";
        $scope.info = "oculto";
    }

    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */

    $scope.opciones = [{
        show: false
    }, {
        show: false
    }, {
        show: false
    }];
    var reloaded = false;
    $scope.toggleGroup = function (group) {
        if ($scope.opciones[group].show)
            $scope.opciones[group].show = false;
        else
            $scope.opciones[group].show = true;
        if (!reloaded) {
            inicializa();
        }
    };
    $scope.isGroupShown = function (group) {
        return $scope.opciones[group].show;
    };

})

.controller('PerfilCtrl', function ($scope, Peticiones, $state, Ofertas, $ionicLoading, Usuario, $ionicNavBarDelegate) {
    console.log("OSTIA");
    var usuario = Usuario.usuario();

    if (!usuario.email) {

        $state.go("app.login")
    } else {

    }
    $scope.perfil = function (cp, email, fnac, sex, telf, codfarma) {

        if (angular.isUndefined(cp) || cp == null) {
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su codigo postal",
                function (a) {
                    console.log('toast success: ' + a)
                },
                function (b) {
                    alert('toast error: ' + b)
                }
            );
        }
        if (angular.isUndefined(email) || email == null) {
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su email",
                function (a) {
                    console.log('toast success: ' + a)
                },
                function (b) {
                    alert('toast error: ' + b)
                }
            );
        } else {

            $ionicLoading.show({
                template: '<i class="icon ion-looping"></i> actualizando usuario...'
            });

            var respuesta = Peticiones.perfil(cp, email, fnac, sex, telf, codfarma);
            respuesta.then(
                function (result) {
                    if (!result.error) {
                        $ionicLoading.hide();
                        Usuario.set('email', email);
                        Usuario.set('codigoCliente', result.codigo);
                        Usuario.set('codigoPostal', cp);
                        Usuario.set('fechaNacimiento', fnac);
                        Usuario.set('genero', sex);
                        if (!(angular.isUndefined(telf)) && !(telf == null)) {
                            Usuario.set('telefono', telf);
                        }
                        if (!(angular.isUndefined(codfarma)) && !(codfarma == null)) {
                            Usuario.set('codigoFarmacia', codfarma);
                        }
                        s
                    } else {
                        $ionicLoading.hide();
                    }
                },
                function (errorPlayload) {
                    $ionicLoading.hide();
                    alert("error");
                });
        }
    }
})

.controller('ReservaCtrl', function ($ionicPlatform, $scope, Peticiones, $state, Ofertas, $ionicLoading, Usuario) {
    $ionicLoading.show({
        template: '<i class="icon ion-looping"></i>Espere un momento, descargando las reservas...'
    });
    var usuario = Usuario.usuario();
    console.log(usuario.email);
    if (!usuario.email) {
        $state.go("app.login")
    }
    var ofertasGenerales = Peticiones.getReservas(usuario.codigoCliente);
    ofertasGenerales.then(function (result) {
        $scope.reservas = result;
        $ionicLoading.hide();
    });

    $scope.detalle = function (oferta) {
        Ofertas.setViendoOferta(oferta);
        $state.go("app.detalleoferta");
    }
    $ionicPlatform.onHardwareBackButton(function () {
        event.preventDefault();
        event.stopPropagation();
    });
});

.controller('MiPharmaPrive', function ($scope, $stateParams, $state, Ofertas, $ionicPopup, $ionicLoading, Peticiones, server_constantes, Usuario, $compile, $timeout) {

    $scope.oferta = Ofertas.getViendoOferta();
    var usuario = Usuario.usuario();
    var map;
    var posInicio;
    if (usuario.codigoFarmacia) {
        var farmaciaAsociada = Peticiones.getFarmacia(usuario.codigoFarmacia);
        farmaciaAsociada.then(function (result) {
            $scope.farmacia = result;
            inicializa();
        });
    }
    window.navigator.geolocation.getCurrentPosition(function (location) {
        var farmaciasCercanas = Peticiones.getFarmacias(location.coords.latitude, location.coords.longitude);
        farmaciasCercanas.then(function (result) {
            $scope.farmacias = result;
            if (!usuario.codigoFarmacia) {
                inicializa();
            }

        });
    });



    var inicializa = function () {
        if (usuario.codigoFarmacia) {
            posInicio = new google.maps.LatLng($scope.farmacia.latitud, $scope.farmacia.longitud);
        } else {
            posInicio = new google.maps.LatLng($scope.farmacias[0].latitud, $scope.farmacias[0].longitud);
        }

        var mapOptions = {
            streetViewControl: true,
            center: posInicio,
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        map = new google.maps.Map(document.getElementById("map"),
            mapOptions);

        if (usuario.codigoFarmacia) {

            var contentString = '<strong>Dirección de la farmacia: </strong> ' +
                $scope.farmacia.direccion;


            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            var farmaciaMarker = new google.maps.Marker({
                position: posicion,
                map: map
            });
            farmaciaMarker.addListener('click', function () {
                $scope.farmaciaSeleccionada = $scope.farmacia.id;
                infowindow.open(map, farmaciaMarker);
            });

            var farmaciaMarker = new google.maps.Marker({
                position: posicion,
                map: map
            });
            infowindow.open(map, farmaciaMarker);
        }

        for (farmacia in $scope.farmacias) {
            var posicion = new google.maps.LatLng($scope.farmacias[farmacia].latitud, $scope.farmacias[farmacia].longitud);

            var contentString = '<strong>Dirección de la farmacia: </strong> ' +
                $scope.farmacias[farmacia].direccion;


            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            var farmaciaMarker = new google.maps.Marker({
                position: posicion,
                map: map
            });
            farmaciaMarker.addListener('click', function () {
                $scope.farmaciaSeleccionada = $scope.farmacias[farmacia].id;
                infowindow.open(map, farmaciaMarker);
            });

            var farmaciaMarker = new google.maps.Marker({
                position: posicion,
                map: map
            });
            infowindow.open(map, farmaciaMarker);
        }

        reloaded = true;
        $scope.map = map;
    }

})
