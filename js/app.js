var ChatRoom = angular.module('ChatRoom', ['ngRoute']);

ChatRoom.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'views/login.html', 
				controller: 'LoginController' 
			})
			.when('/rooms', {
				templateUrl: 'views/rooms.html',
				controller: 'RoomsController'
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
		console.log("login");
		if ($scope.nickname = '') {
			console.log("error, empty nick");
			$scope.errorMessage = 'Please choose a nickname before continuing!';
		} else {
			socket.emit('addUser', $scope.nickname, function (available) {
				console.log("socker");
				if (available) {
					$location.path('/rooms/' + $scope.nickname);
				} else {
					$scope.errorMessage = 'This nickname is already taken!';
				}
			});
		}
	};
});

ChatRoom.controller('RoomsController', function($scope, $location, $rootScope, $routeParams, socket) {
	$scope.rooms = ['Room1', 'Room2', 'Room3'];
	$scope.currentUser = $routeParams.user;
});

ChatRoom.controller('RoomController', function($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentUsers = [];
	$scope.errorMessage = '';

	socket.on('updateUsers', function(roomName, users, ops) {
		if(!success) {
			$scope.errorMessage = "ERROR";
		}
	});	
});