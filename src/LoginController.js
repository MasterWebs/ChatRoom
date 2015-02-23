ChatRoom.controller('LoginController', ['$scope', '$location', '$rootScope', '$routeParams', 'socket',
function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.nickname = '';

	$scope.login = function() {
		if ($scope.nickname === '') {
			toastr.error('Please choose a nickname before continuing!');
		} else {
			socket.emit('adduser', $scope.nickname, function (available) {
				if (available) {
					$location.path('/rooms/' + $scope.nickname);
				} else {
					toastr.error('This nickname is already taken!');
				}
			});
		}
	};
}]);