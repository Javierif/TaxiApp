angular.module('starter.controllers', [])

.controller('loginCtrl', function ($scope, Peticiones, $state, $ionicLoading, Usuario, Comercios, Ofertas, $compile) {
    //screen.lockOrientation('portrait');
    $scope.taxista = false;
    Usuario.loadusuario()
    $scope.error = {
        id: "noerror"
    }
    $scope.inicio = true;
    $scope.seecionlogin = false;
    $scope.seccionregistro = false;
    $scope.registroid = {
        id: 1
    };

    var usuario = Usuario.usuario();

    var lanzaerror = function (message) {
        $scope.error.id = "error";
        console.log("Message " + message);
        // window.plugins.toast.showShortBottom(message,
        //     function (a) {},
        //      function (b) {});
    }

    $scope.checkstep = function (step, data1, data2) {
        switch (step) {
        case 1:
            if (!data1) {
                lanzaerror("Introduce tu nombre para continuar");
            } else {
                $scope.registroid.id = $scope.registroid.id + 1;
            }
            break;
        case 2:

            if (!data1) {
                lanzaerror('El correo es un dato necesario para tu cuenta.')
            } else if (!data2) {
                lanzaerror('¡Necesitas poner una contraseña!')
            } else {
                $ionicLoading.show({
                    template: '<ion-spinner icon="circles" class="spinner-energized"></ion-spinner><br>  Comprobando el correo...'
                });
                var checkCorreo = Peticiones.compruebaCorreo(data1);
                checkCorreo.then(function (result) {
                    $ionicLoading.hide();
                    console.log("ERROR " + JSON.stringify(result));
                    if (!result.error) {
                        $scope.registroid.id = $scope.registroid.id + 1;
                    } else {
                        lanzaerror('Este correo ya esta registrado.')
                    }
                })
            }

            break;
        case 3:
            if (!$scope.registro.telefono) {
                lanzaerror('El taxista necesita tu numero para poder contactar por cualquier problema.')
            } else {
                $ionicLoading.show({
                    template: '<ion-spinner icon="circles" class="spinner-energized"></ion-spinner><br>  Registrandote en la base de datos...'
                });
                var registro = Peticiones.registro($scope.registro.nombre, $scope.registro.apellidos, $scope.registro.correo, $scope.registro.password, $scope.registro.spam, $scope.registro.telefono);
                registro.then(function (result) {
                    $ionicLoading.hide();
                    if (!result.error) {
                        var user = result.usuario;
                        Usuario.borrarusuario();
                        Usuario.set('id', user.id);
                        Usuario.set('email', user.email);
                        Usuario.set('telefono', user.telefono);
                        Usuario.set('nombre', user.nombre);
                        Usuario.set('apellidos', user.apellidos);
                        Usuario.set('grupo', user.grupo);
                        Usuario.set('spam', user.spam);
                        Usuario.saveusuario();
                        console.log(Usuario.usuario());
                        $scope.registroid.id = $scope.registroid.id + 1;
                    }
                });
            }
            break;
        case 4:
            $state.go("taxista.mapaTaxista");
            break;
        }
    }

    $scope.init = function (data) {
        switch (data) {
        case 1:
            $scope.inicio = false;
            $scope.seecionlogin = true;
            console.log("INIT " + data);
            break;
        case 2:
            $scope.inicio = true;
            $scope.seecionlogin = false;
            break;
        case 3:
            $scope.inicio = false;
            $scope.seccionregistro = true;
        }
    }

    $scope.login = function (email, password) {
        $ionicLoading.show({
            template: '<ion-spinner icon="circles" class="spinner-energized"></ion-spinner><br>  Conectando con el servidor...'
        });
        var respuesta = Peticiones.login(email, password);
        respuesta.then(
            function (result) {
                // window.plugins.toast.showLongBottom(result.error_msg, function (a) {}, function (b) {});
                if (result.user) {
                    result = result.user;
                    $ionicLoading.hide();
                    Usuario.borrarusuario();
                    Usuario.set('id', result.id);
                    Usuario.set('email', result.email);
                    Usuario.set('telefono', result.telefono);
                    Usuario.set('nombre', result.nombre);
                    Usuario.set('apellidos', result.apellidos);
                    Usuario.set('grupo', result.grupo);
                    Usuario.saveusuario();
                    console.log(Usuario.usuario());
                    if (result.grupo > 0) {
                        $state.go("taxista.mapaTaxista");
                    }

                } else {
                    lanzaerror(result.message);
                    $ionicLoading.hide();

                }
            },
            function (errorPlayload) {});
    }

});
