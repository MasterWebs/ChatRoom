module.exports = function ( grunt ) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	var taskConfig = {
		concat: {
			options: {
				separator: '\n\n'
			},
			dist: {
				src: ['js/ChatRoom.js', 'js/LoginController.js',
					  'js/RoomsController.js', 'js/RoomController.js',
					  'js/socket-factory.js'],
				dest: 'dist/app.js'
			}
		},
		uglify: {
			my_target: {
				files: {
					'dist/app.min.js': 'dist/app.js'
				}
			}
		},
		jshint: {
			// run jshint on all files in js folder
			src: [ 'js/*.js' ],
			gruntfile: ['Gruntfile.js'],
			options: {
				curly: 	true,
				immed: 	true,
				newcap: true,
				noarg: 	true,
				sub: 	true,
				boss: 	true,
				eqnull: true,
				node: 	true,
				undef:  true,
				globals: {
					_: 		 	false,
					jQuery:  	false,
					angular: 	false,
					moment:  	false,
					console: 	false,
					$: 		 	false,
					ChatRoom: 	true,
					io: 		false 
				} 
			}
		}
	};
	grunt.initConfig(taskConfig);
	grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};
