var ChatRoom = angular.module('ChatRoom', ['ngRoute']);

ChatRoom.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'views/login.html', 
				controller: 'LoginController'
			})
			.when('/rooms:user/', {
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
		if ($scope.nickname = '') {
			console.log("error, empty nick");
			$scope.errorMessage = 'Please choose a nickname before continuing!';
		} else {
			socket.emit('adduser', $scope.nickname, function (available) {
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

	socket.on('updateusers', function(roomName, users, ops) {
		$scope.currentUser = users;
	});	

	socket.emit('joinroom', $scope.currentRoom, function(success, reason) {
		if(!success) {
			$scope.errorMessage = reason;
		}
			
	});
});