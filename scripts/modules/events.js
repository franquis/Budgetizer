var eventsModule = angular.module("EventsModule",["ngResource"]);

eventsModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/events', {templateUrl : 'templates/events/index.html',controller:"EventsCtrl"}).
		when('/events/add', {templateUrl : 'templates/events/add.html',controller:"AddEventCtrl"}).

		otherwise({redirectTo: '/404'});
}]);

eventsModule.factory('Events', function($resource){
	return $resource('api/events/', {}, {
		query: {method:'GET', isArray:true}
	});
});

eventsModule.controller("EventsCtrl",function($scope, Events){
	//$scope.events = $scope.$parent.events;

});

eventsModule.controller("AddEventCtrl",function($scope, $location, Events){
	$scope.newEvent = {};

	$scope.addEvent = function(){


	}

});