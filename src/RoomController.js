ChatRoom.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.users = [];
	$scope.ops = [];
	$scope.messageHistory = [];
	$scope.nextMessage = '';
	$scope.errorMessage = '';
	$scope.isOp = false;
	$scope.userToKick = ''; //gets the input to kick user

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
				$scope.errorMessage = "Coult not ban " + user;
			}
		});
	};

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
		if (roomName === $scope.currentRoom) {
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
		if (roomName === $scope.currentRoom) {
			// empty list of messages
			$scope.messageHistory = msgHistory;
		}
	});
});