angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/inicioLogout.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

})

.controller('iniciosesion', function($scope,Peticiones,$state,$ionicLoading,Usuario,Comercios,Ofertas,$compile) {
    var compruebacomercios = function (idcliente) {
        if(Comercios.loadcomercios()){
            var comercios = Peticiones.comercios(idcliente);
            comercios.then(
                function(result) {
                    Comercios.decompilajson(result.resultado);
                });
        }
    }

    window.navigator.geolocation.getCurrentPosition(function(location) {
        alert('Location from Phonegap' + location);
    });
    $scope.registro = function() {
        $state.go("registro");
    }

    $scope.descripcionlarga = function() {
         var alertPopup = $ionicPopup.alert({
             cssClass: 'modal',
             template: $scope.oferta.descripcionLarga
            });
    };

    $scope.login = function (email) {
        $ionicLoading.show({
            template: '<i class="icon ion-looping"></i> Conectando con el servidor...'
        });
        var respuesta = Peticiones.login(email);
        respuesta.then(
            function(result) {
                window.plugins.toast.showLongBottom(result.error_msg, function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
                if(!result.error){
                    $ionicLoading.hide();
                    Usuario.set('email',result.email);
                    Usuario.set('codigoCliente',result.codigo);
                    Usuario.set('telefono',result.telefono);
                    Usuario.set('codigoPostal',result.codigoPostal);
                    Usuario.set('fechaNacimiento',result.anoNacimiento);
                    Usuario.set('genero',result.sexo);
                    Usuario.set('codigoFarmacia',result.codigoFarmacia);
                    Usuario.saveusuario();
                    $ionicLoading.show({
                        template: '<i class="icon ion-looping"></i>Espere un momento, descargando las ofertas...'
                    });
                    compruebacomercios(result.codigo);
                    var ofertas = Peticiones.ofertas(Usuario.get('codigoCliente'));
                    ofertas.then(
                        function(result) {
                            Ofertas.decompilajson(result.resultado);
                            $state.go("app.mostradorofertas");
                            $ionicLoading.hide();
                        });

                } else {
                    $ionicLoading.hide();
                }
            }, function(errorPlayload){
                alert("error");
            });
    }
    if(Usuario.loadusuario()) {
        compruebacomercios(Usuario.get("codigoCliente"));
        $ionicLoading.show({
            template: '<i class="icon ion-looping"></i>Espere un momento, descargando las ofertas...'
        });
            var ofertas = Peticiones.ofertas(Usuario.get('codigoCliente'));
            ofertas.then(
            function(result) {
                Ofertas.decompilajson(result.resultado);
                $state.go("app.mostradorofertas");
                $ionicLoading.hide();
            });
     }

})

.controller('RegistroCtrl', function($scope,Peticiones,$state,Ofertas,$ionicLoading,Usuario,$ionicNavBarDelegate) {
    $scope.back = function(){
         $state.go("inicioLogout");
    }
    $scope.registrarse = function(cp,email,fnac,sex,telf,codfarma) {

        if(angular.isUndefined(cp) || cp == null){
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su codigo postal",
                function(a){console.log('toast success: ' + a)},
                function(b){alert('toast error: ' + b)}
            );
        } if(angular.isUndefined(email) || email == null){
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su email",
                function(a){console.log('toast success: ' + a)},
                function(b){alert('toast error: ' + b)}
            );
        }else {

            $ionicLoading.show({
                template: '<i class="icon ion-looping"></i> registrando usuario...'
            });

            var respuesta= Peticiones.registrar(cp,email,fnac,sex,telf,codfarma);
            respuesta.then(
              function(result) {
                    if(!result.error){
                        $ionicLoading.hide();
                        Usuario.set('email',email);
                        Usuario.set('codigoCliente',result.codigo);
                        Usuario.set('codigoPostal',cp);
                        Usuario.set('fechaNacimiento',fnac);
                        Usuario.set('genero',sex);
                        if (!(angular.isUndefined(telf)) && !(telf == null)){
                           Usuario.set('telefono',telf);
                        }
                        if (!(angular.isUndefined(codfarma)) && !(codfarma == null)){
                            Usuario.set('codigoFarmacia',codfarma);
                        }
                        $ionicLoading.show({
                            template: '<i class="icon ion-looping"></i>Espere un momento, descargando las ofertas...'
                        });
                        var ofertas = Peticiones.ofertas(Usuario.get('codigoCliente'));
                        ofertas.then(
                            function(result) {
                                Ofertas.decompilajson(result.resultado);
                                $state.go("app.mostradorofertas");
                                $ionicLoading.hide();
                            });

                    } else {
                        $ionicLoading.hide();
                    }
                }, function(errorPlayload){
                    $ionicLoading.hide();
                    alert("error");
                });
        }
    }
})

.controller('MostradorOfertasCtrl', function($ionicPlatform,$scope,Peticiones,$state,Ofertas) {
    $ionicLoading.show({
        template: '<i class="icon ion-looping"></i>Espere un momento, descargando las ofertas...'
    });
    var ofertasGenerales = Peticiones.getOfertasGenerales();
    ofertasGenerales.then(function(result) {
       $scope.ofertasGenerales = result;
    });
    $scope.ofertas = Ofertas.getofertas();

    $scope.detalle = function(oferta) {
        Ofertas.setViendoOferta(oferta);
        $state.go("app.detalleoferta");
    }
    $ionicPlatform.onHardwareBackButton(function() {
     event.preventDefault();
     event.stopPropagation();
  });
})

.controller('DetalleOfertaCtrl', function($scope, $stateParams, Ofertas, $ionicPopup, $ionicLoading, Peticiones,server_constantes,Usuario,$compile) {

        var site = new google.maps.LatLng(55.9879314,-4.3042387);
        var hospital = new google.maps.LatLng(55.8934378,-4.2201905);

        var mapOptions = {
          streetViewControl:true,
          center: site,
          zoom: 18,
          mapTypeId: google.maps.MapTypeId.TERRAIN
        };
        var map = new google.maps.Map(document.getElementById("map"),
            mapOptions);

        //Marker + infowindow + angularjs compiled ng-click
        var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
        var compiled = $compile(contentString)($scope);

        var infowindow = new google.maps.InfoWindow({
          content: compiled[0]
        });

        var marker = new google.maps.Marker({
          position: site,
          map: map,
          title: 'Strathblane (Job Location)'
        });

        var hospitalRoute = new google.maps.Marker({
          position: hospital,
          map: map,
          title: 'Hospital (Stobhill)'
        });

        var infowindow = new google.maps.InfoWindow({
             content:"Project Location"
        });

        infowindow.open(map,marker);

        var hospitalwindow = new google.maps.InfoWindow({
             content:"Nearest Hospital"
        });

        hospitalwindow.open(map,hospitalRoute);

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(map,marker);
        });

        $scope.map = map;

        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();

        var request = {
            origin : site,
            destination : hospital,
            travelMode : google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            }
        });

        directionsDisplay.setMap(map);

      $scope.centerOnMe = function() {
        if(!$scope.map) {
          return;
        }

        $scope.loading = $ionicLoading.show({
          content: 'Getting current location...',
          showBackdrop: false
        });
        navigator.geolocation.getCurrentPosition(function(pos) {
          $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          $scope.loading.hide();
        }, function(error) {
          alert('Unable to get location: ' + error.message);
        });
      };

      $scope.clickTest = function() {
        alert('Example of infowindow with ng-click')
      };



    var urls = server_constantes.all();
    $scope.url =urls.URL;
    $scope.oferta = Ofertas.getViendoOferta();
    $scope.descripcionlarga = function() {
         var alertPopup = $ionicPopup.alert({
             cssClass: 'modal',
             template: $scope.oferta.descripcionLarga
            });
    };
    $scope.cuponcito = function(cantidad) {
        alert($scope.data.cantidadcupon);
    }
    $scope.cupon = function(componente) {
        $scope.data = {}
        var myPopup = $ionicPopup.show({
            template: '<input type="number" ng-model="data.cantidadcupon">',
            title: 'CUPONES DESCUENTO!',
            subTitle: 'Introduzca la cantidad de artículos que quiere en su cupón descuento',
            scope: $scope,
            buttons: [
              { text: 'Cancelar'},
              { text: 'Ver cupón',
                type: 'button-positive',
                scope: $scope,
                onTap: function(e) {

                    return $scope.data.cantidadcupon
                }
              }
            ]
        });
        myPopup.then(function(res) {
            if (!(angular.isUndefined(res)) && !(res == null)){
                if(res<=0){
                     window.plugins.toast.showShortBottom("Introduzca un numero mayor de 0",
                                                         function(a){console.log('toast success: ' + a)},
                                                         function(b){alert('toast error: ' + b)});
                } else {
                   $ionicLoading.show({
                     template: '<i class="icon ion-looping"></i> data.cantidadcupon Obteniendo su código de descuento...'
                    });
                    var cupon = Peticiones.obtenerCupon(componente.identificador,Usuario.get('codigoCliente'),res);
                    cupon.then(
                        function(result){
                            if(!result.error){
                                $scope.urlcupon = result.url;
                                var myPopup = $ionicPopup.show({
                                    cssClass: 'modal',
                                    scope:$scope,
                                    template: '<img class="cuponimg" ng-src="{{url}}{{urlcupon}}">',
                                    buttons: [
                                      { text: 'Salir', type: 'button-positive'}
                                    ]
                                });
                                $ionicLoading.hide();
                            } else {
                                $ionicLoading.hide();
                            }
                        }
                    );
                }
            }
        });
        $timeout(function() {
            myPopup.close(); //close the popup after 3 seconds for some reason
        }, 3000);
     };
    $scope.info = "mostrado";
    $scope.mapa = "oculto";
    $scope.showinfo = function() {
        $scope.info = "mostrado";
        $scope.mapa = "oculto";
    }
    $scope.showmapa = function() {
        $scope.mapa = "mostrado";
        $scope.info = "oculto";
    }

    })

.controller('PerfilCtrl', function($scope,Peticiones,$state,Ofertas,$ionicLoading,Usuario,$ionicNavBarDelegate) {
    $scope.perfil = function(cp,email,fnac,sex,telf,codfarma) {

        if(angular.isUndefined(cp) || cp == null){
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su codigo postal",
                function(a){console.log('toast success: ' + a)},
                function(b){alert('toast error: ' + b)}
            );
        } if(angular.isUndefined(email) || email == null){
            window.plugins.toast.showLongBottom(
                "Introduzca correctamente su email",
                function(a){console.log('toast success: ' + a)},
                function(b){alert('toast error: ' + b)}
            );
        }else {

            $ionicLoading.show({
                template: '<i class="icon ion-looping"></i> actualizando usuario...'
            });

            var respuesta= Peticiones.perfil(cp,email,fnac,sex,telf,codfarma);
            respuesta.then(
              function(result) {
                    if(!result.error){
                        $ionicLoading.hide();
                        Usuario.set('email',email);
                        Usuario.set('codigoCliente',result.codigo);
                        Usuario.set('codigoPostal',cp);
                        Usuario.set('fechaNacimiento',fnac);
                        Usuario.set('genero',sex);
                        if (!(angular.isUndefined(telf)) && !(telf == null)){
                           Usuario.set('telefono',telf);
                        }
                        if (!(angular.isUndefined(codfarma)) && !(codfarma == null)){
                            Usuario.set('codigoFarmacia',codfarma);
                        }s
                    } else {
                        $ionicLoading.hide();
                    }
                }, function(errorPlayload){
                    $ionicLoading.hide();
                    alert("error");
                });
        }
    }
})
;
