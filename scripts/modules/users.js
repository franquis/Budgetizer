var usersModule = angular.module("UsersModule",['ngResource']);

usersModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/users', {templateUrl : 'templates/users/index.html', controller:'usersCtrl'}).
		when('/users/add', {templateUrl : 'templates/users/add.html', controller:'userCtrl'}).
		when('/users/detail/:id', {templateUrl : 'templates/users/detail.html', controller:'userDetailCtrl'}).
		when('/users/edit/:id', {templateUrl : 'templates/users/edit.html', controller:'userDetailCtrl'}).
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



});

usersModule.controller("userCtrl",function($scope, $location, $log, $routeParams, Users, DataFactory){

	$scope.UserModel = {"type":"user"};

	$scope.newUser = angular.copy($scope.UserModel);
	
	$scope.addUser = function(){

		Users.save($scope.newUser,function(user){
			$scope.users.push(user);
			$scope.newUser = angular.copy($scope.UserModel);
		});

		$location.path("/users");

	};

	$scope.deleteUser = function(user){
		if(confirm("Delete '"+user.firstname+"'?")){
			var u = $scope.$parent.getUser(user._id);
			var index = jQuery.inArray(u,$scope.users);
			$scope.users.splice(index,1);
			/**
			 *	@todo: remove index from DataFactory (= refresh / rebuild)
			 *	Users.delete({id:user._id});
			**/
			console.log("User delete: ", user._id);
			$location.path("/users");
		}
	};

	$scope.editUser = function(){
		console.log($scope.user);
		//@todo remove user.fullname or move this behavior to PHP or CouchDB

	};

	$scope.isContributor = function(){
		return false;
	};
});

usersModule.controller("userDetailCtrl",function($scope, $location, $timeout, $routeParams, $log, Users, DataFactory){

	var _id = $scope.currentId = $routeParams.id;
	
	$scope.getUser = function(){
		DataFactory.getUser(_id,function(user){
			$log.info("User #"+_id+" found:",user);
			$scope.user = user;
		},function(){
			$log.warn("User #"+_id+" not found, looping...");
			$timeout(function(){$scope.getUser();},	1000);
				
		});
	};

	
	$scope.getUser();
});

