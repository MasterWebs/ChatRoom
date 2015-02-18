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

ChatRoom.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.users = [];
	$scope.ops = [];
	$scope.messageHistory = [];
	$scope.privateMsgHistory = [];
	$scope.topic = '';
	$scope.banned = false;
	$scope.nextMessage = '';
	$scope.errorMessage = '';
	$scope.isOp = false;
	$scope.userToKick = ''; //gets the input to kick user
	$scope.privateMessage = '';
	$scope.fromUser = '';

	var joinObj = {
		room: $scope.currentRoom
	};

	socket.emit('joinroom', joinObj, function (success, reason) {
		if (!success) {
			$scope.errorMessage = "You have been banned from this room, you will not see any activity";
			$scope.banned = true;
		}
	});

	$scope.partRoom = function () {
		// redirect user to room list
		$location.path('/rooms/' + $scope.currentUser);
		// let server know that user has left the room
		socket.emit('partroom', $scope.currentRoom);
	};

	$scope.sendMsg = function () {
		if ($scope.nextMessage !== '') {
			// only handle non-empty messages
			var message = {
				roomName: $scope.currentRoom,
				msg: $scope.nextMessage
			};
			// send message to server
			socket.emit('sendmsg', message);
			$("#msg").val('');
			$scope.nextMessage = '';
		}
	};

	$scope.privateMsg = function (user) {
		if($scope.nextMessage !== '') {
			//only handle non-empty messages
			var message = {
				nick: user,
				message: $scope.nextMessage
			};
			console.log("nick: " + message.user);
			console.log("message: " + message.message);
			//send private message
			socket.emit('privatemsg', message, function (sent) {
				if(!sent) {
					$scope.errorMessage = "Could not send message";
				} else {
					$("#msg").val('');
					$scope.nextMessage = '';
				}
			});
		}
	};

/* When a room creator wants to kick a user from the room.
Parameters:an object containing the following properties: { user : "The username of the user being kicked", room: "The ID of the room"
a callback function, accepting a single boolean parameter, stating if the user could be kicked or 7not.
The server will emit the following events if the user was successfully kicked: "kicked" to the user being kicked,
and "updateusers" to the rest of the users in the room.*/
	$scope.kickUser = function (user) {
		//only handle non-empty kicks
		var kick = {
			user: user,
			room: $scope.currentRoom
		};

		socket.emit('kick', kick, function(kicked) {
			if (!kicked) {
				$scope.errorMessage = "Could not kick user";
			}
		});
	};

	$scope.banUser = function(user) {
		var ban = {
			user: user,
			room: $scope.currentRoom
		};

		socket.emit('ban', ban, function(banned) {
			if (!banned) {
				$scope.errorMessage = "Could not ban " + user;
			}
		});
	};

	socket.on('recv_privatemsg', function(username, message) {
		/*$scope.fromUser = username;
		$scope.privateMessage = message;*/
		var msg = {
			nick: username,
			message: message
		};

		$scope.privateMsgHistory.push(msg);
	});

	socket.on('banned', function(room, userKicked, user) {
		console.log("socket on");
		if ($scope.currentRoom === room && $scope.currentUser === userKicked) {
			//the user in this room has been banned
			//redirect to lobby
			$location.path('/rooms/' + $scope.currentUser);
		} 
	});

	socket.on('kicked', function (room, userKicked, user) {
		if ($scope.currentRoom === room && $scope.currentUser === userKicked) {
			// the user in this room has been kicked
			// redirect him to the room list
			$location.path('/rooms/' + $scope.currentUser);
		}
	});

	/* The server responds by emitting the following events: "updateusers" (to all participants in the room),
	"updatetopic" (to the newly joined user, not required to handle this), "servermessage" with the first parameter
	set to "join" ( to all participants in the room, informing about the newly added user). If a new room is being
	created, the message "updatechat" is also emitted. */

	socket.on('updateusers', function (roomName, users, ops) {
		// we only want to update the users for this particular room
		// and if the user is not banned
		if (roomName === $scope.currentRoom && !$scope.banned) {
			// empty list of users and ops
			$scope.users = [];
			$scope.ops = [];
			// populate users and ops lists with updated information
			for (var op in ops) {
				$scope.ops.push(op);
			}

			for (var user in users) {
				// we do not want ops to be listed as users
				var isOp = false;

				for (var j = 0; j < $scope.ops.length; j++) {
					if (user === $scope.ops[j]) {
						isOp = true;
					}
				}

				if (!isOp) {
					$scope.users.push(user);
				}
			}

			for(var i = 0; i < $scope.ops.length; i++) {
				if($scope.currentUser == $scope.ops[i]) {
					$scope.isOp = true;
				}
			}
		}
	});

	socket.on('updatechat', function (roomName, msgHistory) {
		// we only want to update the messages for this particular room
		// and if the user is not banned
		if (roomName === $scope.currentRoom && !$scope.banned) {
			// empty list of messages
			$scope.messageHistory = msgHistory;
		}
	});

	socket.on('updatetopic', function (roomName, topic, user) {
		// we only want to update the topic for this particular room
		// and if the user is not banned
		if (roomName === $scope.currentRoom && !$scope.banned) {
			$scope.topic = topic;
		}
	});
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
		// clear room list
		$scope.roomList = [];
		// list available rooms
		for(var room in rooms) {
			$scope.roomList.push(room);
		}
	});

	$scope.enterRoom = function(roomEntered) {
		// redirect user to room page
		$location.path('/rooms/' + $scope.currentUser + '/' + roomEntered);
	};

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
			if($scope.roomName !== '') {
				socket.emit('joinroom', newRoom, function (success, reason) {
					if(success) {
						/* $scope.successMessage = "Room " + newRoom.room + " has been created";
						$scope.roomList.push(newRoom.room); */
						$location.path('/rooms/' + $scope.currentUser + '/' + newRoom.room);
					} else {
						$scope.errorMessage = reason;
					}
				});
			} else {
				$scope.errorMessage = "Room name cannot be empty";
			}
		} else {
			$scope.errorMessage = "Room name already exists";
		}
		
	};
});

// Factory to wrap around the socket functions
// Borrowed from Brian Ford
// http://briantford.com/blog/angular-socket-io.html
ChatRoom.factory('socket', function ($rootScope) {
    var socket = io.connect('http://localhost:8080');
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});