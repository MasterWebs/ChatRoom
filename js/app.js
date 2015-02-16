var ChatRoom = angular.module('ChatRoom', ['ngRoute']);

ChatRoom.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'views/login.html', 
				controller: 'LoginController'
			})
			.when('/rooms/:user', {
				templateUrl: 'views/rooms.html',
				controller: 'RoomsController'
			})
			.when('/rooms/:user/:room', {
				templateUrl: 'views/room.html',
				controller: 'RoomController'
			})
			.otherwise({
				redirectTo: '/login'
			});
	}
]);

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
	$scope.rooms = [];
	$scope.roomList = [];
	$scope.currentUser = $routeParams.user;
	$scope.errorMessage = '';
	$scope.successMessage = '';
	$scope.roomName = '';
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

		for(var i = 0; i < $scope.roomList.length; i++) {
			// check if room name exists
			if(newRoom.room === $scope.roomList[i]) {
				roomExist = true;
			}
		}
		

		if(!roomExist) {
			socket.emit('joinroom', newRoom, function (success, reason) {
				if(success) {
					$scope.successMessage = "Room " + newRoom.room + " has been created";
					$scope.roomList.push(newRoom.room);
				} else {
					$scope.errorMessage = reason;
				}
			});
		} else {
			$scope.errorMessage = "Room name already exists";
		}
		
	};
});

ChatRoom.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.users = [];
	$scope.ops = [];
	$scope.messageHistory = [];
	$scope.errorMessage = '';

	var obj = {
		room: $scope.currentRoom
	};

	socket.emit('joinroom', obj, function (success, reason) {
		if (!success) {
			$scope.errorMessage = reason;
		}
	});

	$scope.partRoom = function () {
		// redirect user to room list
		$location.path('/rooms/' + $scope.currentUser);
		// let server know that user has left the room
		socket.emit('partroom', $scope.currentRoom);
	};

	/* The server responds by emitting the following events: "updateusers" (to all participants in the room),
	"updatetopic" (to the newly joined user, not required to handle this), "servermessage" with the first parameter
	set to "join" ( to all participants in the room, informing about the newly added user). If a new room is being
	created, the message "updatechat" is also emitted. */

	socket.on('updateusers', function (roomName, users, ops) {
		// we only want to update the users for this particular room
		if (roomName === $scope.currentRoom) {
			// empty list of users and ops
			console.log('update the users!');
			$scope.users = [];
			$scope.ops = [];
			// populate users and ops lists with updated information
			for (var user in users) {
				console.log('adding user: ' + user);
				$scope.users.push(user);
			}
			for (var op in ops) {
				console.log('adding op: ' + op);
				$scope.ops.push(op);
			}
		}
	});

	socket.on('updatechat', function (roomName, msgHistory) {
		// we only want to update the messages for this particular room
		if (roomName === $scope.currentRoom) {
			// empty list of messages
			$scope.messageHistory = msgHistory;
		}
	});
});