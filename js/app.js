var ChatRoom = angular.module('ChatRoom', ['ngRoute']);

ChatRoom.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'views/login.html', 
				controller: 'LoginController'
			})
			.when('/rooms/:user/', {
				templateUrl: 'views/rooms.html',
				controller: 'RoomsController'
			})
			.when('rooms/:user/:room/', {
				templateUrl: 'views/room.html',
				controller: 'RoomController'
			})
			.otherwise({
				redirectTo: '/login'
			});
	}
);

ChatRoom.controller('LoginController', function ($scope, $location, $rootScope, $routeParams, socket) {

	$scope.errorMessage = '';
	$scope.nickname = '';

	$scope.login = function() {
		if ($scope.nickname === '') {
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

ChatRoom.controller('RoomsController', function ($scope, $location, $rootScope, $routeParams, socket) {
	// Query chat server for active rooms
	$scope.rooms = []
	$scope.roomList = [];
	$scope.currentUser = $routeParams.user;
	$scope.errorMessage = '';
	$scope.successMessage = '';
	$scope.roomName;
	socket.emit('rooms');
	socket.on('roomlist', function (rooms) {
		
		// list available rooms
		for(var room in rooms) {
			$scope.roomList.push(room);
		}
	});

	$scope.createRoom = function() {
		var newRoom = {
			room: $scope.roomName
		};

		var roomExist = false;
		console.log($scope.roomList);

		for(var room in $scope.roomList) {
			//TODO: check if room name exists
			var obj = room;	
			console.log("room " + obj);
		}
		

		if(!roomExist) {
			socket.emit('joinroom', newRoom, function(success, reason) {
				console.log("emit");
				if(success) {
					$scope.successMessage = "Room " + $scope.roomName + " has been created";
				} else {
					$scope.errorMessage = reason;
				}
			});
		} else {
			$scope.errorMessage = "Room name already exists";
		}
		
	}
});

ChatRoom.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentUsers = [];
	$scope.errorMessage = '';

	socket.on('updateusers', function(roomName, users, ops) {
		$scope.currentUser = users;
	});	



});
