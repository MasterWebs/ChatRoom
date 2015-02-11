var ChatRoom = angular.module('ChatRoom', ['ngRoute']);

ChatRoom.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'views/login.html', 
				controller: 'LoginController' 
			})
			.otherwise({
				redirectTo: '/login'
			});
	}
);

ChatRoom.controller('LoginController', function($scope, $location, $rootScope, $routeParams, socket) {

	$scope.errorMessage = '';
	$scope.nickname = '';

	$scope.login = function() {
		if ($scope.nickname = '') {
			$scope.errorMessage = 'Please choose a nickname before continuing!';
		} else {
			socket.emit('addUser', $scope.nickname, function (available) {
				if (available) {
					$location.path('/rooms/' + $scope.nickname);
				} else {
					$scope.errorMessage = 'This nickname is already taken!';
				}
			});
		}
	};
});