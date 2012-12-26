var eventsModule = angular.module("EventsModule",["ngResource"]);

eventsModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/events', {templateUrl : 'templates/events/index.html',controller:"EventsCtrl"}).
		when('/events/add', {templateUrl : 'templates/events/add.html',controller:"EventCtrl"}).
		when('/events/detail/:id', {templateUrl : 'templates/events/detail.html',controller:"EventCtrl"}).

		otherwise({redirectTo: '/404'});
}]);

eventsModule.factory('Events', function($resource){
	return $resource('api/events/:id', {}, {
		query: {method:'GET', isArray:true}
	});
});

eventsModule.controller("EventsCtrl",function($scope, $location, Events){
	
	$scope.events = $scope.$parent.events;
	$scope.filters = {
		"query":"",
		'orderBy':"name",
		'order':false

	};
	var url_params = $location.search();
	$scope.view = (url_params.view) ? url_params.view : "block";
});

eventsModule.controller("EventCtrl",function($scope, $location, $routeParams, Events){
	$scope.newEvent = {
		"type":"event"
	};


	$scope.getCurrentEvent = function(){
		if(!angular.isObject($scope.event)){
			if($routeParams.id){
				$scope.event = Events.get({id:$routeParams.id});
			}
		}
	};

	$scope.getCurrentEvent();

	$scope.addEvent = function(){
		Events.save($scope.newEvent,function(event){
			$scope.$parent.events.push(event);
			$scope.newEvent = angular.copy({});
		});

		$location.path("/events");

	}

});