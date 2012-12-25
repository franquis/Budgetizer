var usersModule = angular.module("UsersModule",['ngResource']);

usersModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/users', {templateUrl : 'templates/users/index.html', controller:'usersCtrl'}).
		when('/users/add', {templateUrl : 'templates/users/add.html', controller:'userAddCtrl'}).
		when('/users/detail/:id', {templateUrl : 'templates/users/detail.html', controller:'userDetailCtrl'}).
		when('/users/edit/:id', {templateUrl : 'templates/users/detail.html', controller:'userEditCtrl'}).
		otherwise({redirectTo: '/404'});
}]);

usersModule.factory('Users', function($resource){
	return $resource('api/users/:id', {}, {
		query: {method:'GET', isArray:true}
	});
});


usersModule.controller("usersCtrl",function($scope, Users){
	$scope.filters = {
		"query":"",
		'orderBy':"firstname",
		'order':false

	};
	$scope.view = "block";

	$scope.userDelete = function(user){
		if(confirm("Delete '"+user.firstname+"' ?")){
			var u = $scope.$parent.getUser(user._id);
			var i = jQuery.inArray(u,$scope.users);
			$scope.users.splice(i,1);
			Users.delete({id:user._id});
		}
	};

});

usersModule.controller("userAddCtrl",function($scope, $location, Users){

	$scope.newUser = {"type":"user"};
	
	$scope.addUser = function(){

		Users.save($scope.newUser,function(user){

			$scope.users.push(user);
			$scope.newUser = angular.copy({});
		});

		$location.path("/users");

	};
});

usersModule.controller("userDetailCtrl",function($scope, $location, $routeParams, Users){

	$scope.user = Users.get({id:$routeParams.id});
	$scope.currentId = $routeParams.id;
	// $scope.user = $scope.getUser($routeParams.id,function(user){
	// 	if(user){
	// 		$scope.user = angular.copy(user);
	// 	} else {
	// 		$scope.user = Users.query({id:$routeParams.id});
	// 	}
	// });

});