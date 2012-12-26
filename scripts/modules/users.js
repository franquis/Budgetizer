var usersModule = angular.module("UsersModule",['ngResource']);

usersModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/users', {templateUrl : 'templates/users/index.html', controller:'usersCtrl'}).
		when('/users/add', {templateUrl : 'templates/users/add.html', controller:'userCtrl'}).
		when('/users/detail/:id', {templateUrl : 'templates/users/detail.html', controller:'userDetailCtrl'}).
		when('/users/edit/:id', {templateUrl : 'templates/users/edit.html', controller:'userCtrl'}).
		otherwise({redirectTo: '/404'});
}]);

usersModule.factory('Users', function($resource){
	return $resource('api/users/:id', {}, {
		query: {method:'GET', isArray:true}
	});
});


usersModule.controller("usersCtrl",function($scope, $location, Users){
	$scope.filters = {
		"query":"",
		'orderBy':"firstname",
		'order':false

	};
	var url_params = $location.search();
	$scope.view = (url_params.view) ? url_params.view : "block";

	/*$scope.userDelete = function(user){
		if(confirm("Delete '"+user.firstname+"' ?")){
			var u = $scope.$parent.getUser(user._id);
			var i = jQuery.inArray(u,$scope.users);
			$scope.users.splice(i,1);
			Users.delete({id:user._id});
		}
	};*/

});

usersModule.controller("userCtrl",function($scope, $location, $routeParams, Users){

	$scope.newUser = {"type":"user"};
	
	$scope.getCurrentUser = function(){
		if(!angular.isObject($scope.user)){
			if($routeParams.id){
				$scope.user = Users.get({id:$routeParams.id});
			}
		}
	};

	$scope.getCurrentUser();	

	$scope.addUser = function(){

		Users.save($scope.newUser,function(user){
			$scope.users.push(user);
			$scope.newUser = angular.copy({});
		});

		$location.path("/users");

	};

	$scope.deleteUser = function(user){
		if(confirm("Delete '"+user.firstname+"'?")){
			var u = $scope.$parent.getUser(user._id);
			var index = jQuery.inArray(u,$scope.users);
			$scope.users.splice(index,1);
			//Users.delete({id:user._id});
			console.log("User delete: ", user._id);

			$location.path("/users");
		}
	};

	$scope.editUser = function(){
		console.log($scope.user);
		//@todo remove user.fullname;

	};
});

usersModule.controller("userDetailCtrl",function($scope, $location, $routeParams, Users){

	$scope.user = Users.get({id:$routeParams.id});
	$scope.currentId = $routeParams.id;
	
});

