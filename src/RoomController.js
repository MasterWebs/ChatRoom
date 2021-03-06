angular.module('ChatRoom').controller('RoomController', ['$scope', '$location', '$rootScope', '$routeParams', 'socket',
function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.users = [];
	$scope.ops = [];
	$scope.messageHistory = [];
	$scope.privateMsgHistory = [];
	$scope.topic = '';
	$scope.roomTopic = '';
	$scope.banned = false;
	$scope.nextMessage = '';
	$scope.isOp = false;
	$scope.privateMessage = '';
	$scope.fromUser = '';
	$scope.private = false;

	var joinObj = {
		room: $scope.currentRoom
	};

	socket.emit('joinroom', joinObj, function (success, reason) {
		if (!success) {
			$scope.banned = true;
			toastr.error('You have been banned from room ' + $scope.currentRoom);
			$location.path('/rooms/' + $scope.currentUser);
		}
	});

	$scope.options = function () {
		if($scope.topic === '') {
			toastr.error('You must fill in topic');
		} else {
			var topic = {
				room: $scope.currentRoom,
				topic: $scope.topic
			};	
			socket.emit('settopic', topic);
			toastr.success("Topic changed to " + $scope.topic);
			$scope.topic = '';
		}


	};

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
			//send private message
			socket.emit('privatemsg', message, function (sent) {
				if(!sent) {
					toastr.error('Could not send message');
				} else {
					toastr.success('\"' + $scope.nextMessage + '\" sent to ' + user);
					$scope.nextMessage = '';
				}
			});
		} else {
			toastr.error("Message field cannot be empty");
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
				toastr.error('Could not kick user');
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
				toastr.error('Could not ban ' + user);
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

		toastr.info('\"' + message + '\" from ' + username, 'Private Message');

		$scope.privateMsgHistory.push(msg);
	});

	socket.on('banned', function(room, userKicked, user) {
		if ($scope.currentRoom === room && $scope.currentUser === userKicked) {
			//the user in this room has been banned
			//redirect to lobby
			toastr.error('You have been banned from room ' + $scope.currentRoom);
			$location.path('/rooms/' + $scope.currentUser);
		} 
	});

	socket.on('kicked', function (room, userKicked, user) {
		if ($scope.currentRoom === room && $scope.currentUser === userKicked) {
			// the user in this room has been kicked
			// redirect him to the room list
			toastr.warning('You have been kicked from room ' + $scope.currentRoom);
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
				$scope.users.push(user);
			}

			if ($scope.ops.length === 0 && $scope.users.length > 0) {
				// if room has no op, the first user in user list is opped (if user list is not empty)
				var userOpped = $scope.users.shift();
				var opObj = {
					user: userOpped,
					room: $scope.currentRoom
				};

				socket.emit('op', opObj, function (success) {
					// we don't have to do anything, if user is opped the updateusers
					// event will let our client know
				});
			}

			for(var i = 0; i < $scope.ops.length; i++) {
				if($scope.currentUser === $scope.ops[i]) {
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
			$scope.roomTopic = topic;
		}
	});

	$scope.$on('$destroy', function() {
		// unsubscribe to socket events when site is left
		socket.removeAllListeners('kicked');
		socket.removeAllListeners('banned');
		socket.removeAllListeners('recv_privatemsg');
		socket.removeAllListeners('updateusers');
		socket.removeAllListeners('updatechat');
		socket.removeAllListeners('updatetopic');
	});
}]);