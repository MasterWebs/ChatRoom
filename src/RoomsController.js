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
				// redirect user to his room, where it will be created
				$location.path('/rooms/' + $scope.currentUser + '/' + newRoom.room);
				console.log("redirect to ze room");
			} else {
				$scope.errorMessage = "Room name cannot be empty";
			}
		} else {
			$scope.errorMessage = "Room name already exists";
		}
		
	};
});