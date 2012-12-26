var Budgetizer = angular.module("Budgetizer",["EventsModule","UsersModule","Filters"]);

Budgetizer.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/', {templateUrl : 'templates/dashboard.html'}).
		otherwise({redirectTo: '/'});
}]);

Budgetizer.controller('MainCtrl',function($scope,$location, Users, Events){
	
	$scope.error = {
		"status":200
	};

	$scope.currentUrl = function(){
		return $location.path();
	};

	$scope.currentUser = {
		"firstname":"François",
		"lastname":"Perret du Cray"
	};

	$scope.users = Users.query(function(success){
		$scope.buildUserIndex();
	},function(error){
		$scope.error = error;
	});

	$scope.usersIndex = [];

	$scope.modules = [
		{"title":"Dashboard","url":"/","icon":"icon-home"},
		{"title":"Events","url":"events","icon":"icon-time"},
		{"title":"Expenses","url":"expenses","icon":"icon-money"},
		{"title":"Users","url":"users","icon":"icon-group"}
	];
	$scope.events = Events.query();



	$scope.buildUserIndex = function(){
		angular.forEach($scope.users,function(user,i){
			$scope.usersIndex[user._id] = i;
		});
	};

	$scope.getUser = function(id,callback){
		if(id){
			var index = $scope.usersIndex[id];
			var user = $scope.users[index];
			if(callback){
				callback(user);
			} else {
				return user;
			}
		}
	};
	$scope.isLinkActive = function(url){

		if(url.length > 1){
			var re = new RegExp("^\/"+url);
			return ($scope.currentUrl().match(re)) ? 'active' : '';
		} else {
			return ($scope.currentUrl()) === url ? 'active' : '';
		}
	};

});