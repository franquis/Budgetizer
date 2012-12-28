var eventsModule = angular.module("EventsModule",["ngResource"]);

eventsModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/events', {templateUrl : 'templates/events/index.html',controller:"EventsCtrl"}).
		when('/events/add', {templateUrl : 'templates/events/add.html',controller:"EventCtrl"}).
		when('/events/detail/:id', {templateUrl : 'templates/events/detail.html',controller:"EventDetailCtrl"}).

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

eventsModule.controller("EventCtrl",function($scope, $location, $log, $routeParams, Events, DataFactory){
	
	

	$scope.EventModel = {
		"type":"event"
	};
	
	$scope.newEvent = angular.copy($scope.EventModel);

	
	//Return the current 'Event' Object...
	$scope.getEvent = function(){
		
		if(!angular.isObject($scope.event)){
			if($routeParams.id){
				var _id = $routeParams.id;
				$scope.$parent.getObject(_id,"events",function(event){
					$log.info("Event #"+_id+" found:",event);
					$scope.event = event;
				},function(){
					$scope.getEvent();
					// $log.warn("Event #"+_id+" not found, fetching...");
					// $scope.event = Events.get({id:_id},function(success){
					// 	$log.info("Event #"+_id+" fetched!");
					// });	
				});

			}
		}
	};

	
	$scope.getEvent();
	

	$scope.addEvent = function(){
		DataFactory.data.events.push($scope.newEvent);
		/*
		Events.save($scope.newEvent,function(event){
			DataFactory.data.events.push(event);
			$scope.newEvent = angular.copy($scope.EventModel);
		});
		*/
		//$location.path("/events");

	}

});

eventsModule.controller("EventDetailCtrl",function($scope, $location, $timeout, $log, $routeParams, DataFactory){

	var url_params = $location.search();
	$scope.defaultView = "list";
	$scope.view = (url_params.view) ? url_params.view : $scope.defaultView;	
	
	$scope.filters = {
		"query":"",
		'orderBy':"created.date",
		'order':false

	};

	$scope.totalDepense = 0;
	
	$scope.expenses = [];

	$scope.buildTotal = function(){
		$scope.totalDepense = 0;
		angular.forEach($scope.expenses,function(expense){
			$scope.totalDepense += expense.amount;
		});
	};
	
	$scope.getEvent = function(){
		
		if(!angular.isObject($scope.event)){
			if($routeParams.id){
				var _id = $routeParams.id;
				DataFactory.get(_id,"events",function(event){
					$log.info("Event #"+_id+" found:",event);
					$scope.event = event;
					angular.forEach(event.expenses,function(expense){
						Expense = DataFactory.getExpense(expense);
						$scope.expenses.push(Expense);

					});
					$scope.buildTotal();
				},function(){
					$log.warn("Event #"+_id+" not found, looping...");
					$timeout(function(){
						$scope.getEvent();},1000);
				});

			}
		}
	};

	$scope.getEvent();

	$scope.$watch(function(){return $scope.expenses;},function(a,b){
		$scope.buildTotal();
	});

	$scope.$root.$on("EventUpdate",function(event,b){
		$scope.buildTotal();
	});

	$scope.isContributor = function(id,expense){
		return (jQuery.inArray(id,expense.contributors) >= 0) ? 'true' : 'false';
	}


	$scope.getRep = function(participant, callback){
		var depense = 0, rembourse = 0;

		angular.forEach($scope.expenses,function(expense){

			var contributors = expense.contributors.length;
			
			if($scope.isContributor(participant,expense)){
				rembourse += expense.amount / contributors;
			}
			
			if( expense.creditor == participant) {
				depense += expense.amount;
			}

		});
		var output = {
			depense: depense,
			rembourse: rembourse,
			delta: depense - rembourse
		};

		if(callback){
			callback(output);
		} else {
			return output;
		}
	};
	
	

	$scope.$root.$on('ExpenseUpdate',function(event,data){
		//console.log('ExpenseUpdate',data);
	
	});



	$scope.genereRemboursements = function(){
		
		$scope.remboursements = [];
		var a = [];
		angular.forEach($scope.participants, function(participant,i){
			var delta = participant.data.depense - participant.data.rembourse;
			a.push({"id":participant.id,"montant":delta});
		});
				
		while( a.length > 0){
			// On tri le tableau par montant croisant
			a.sort(function(a,b) { return parseFloat(a.montant) - parseFloat(b.montant);});
			
			var b = {"receveur":"","montant":0,"debiteur":""};
			
			// Le plus gros debiteur est le premier element du tableau i.e -50€
			var debiteur = a[0];
			// Le plus gros crediteur est le dernier element du tableau i.e 40€
			var receveur = a[a.length -1];
			
			if(receveur == debiteur){
				break;
			}
			
			// On calcule la diff entre les deux montant i.e -50 + 40 = -10
			var diff = Math.round( (debiteur.montant + receveur.montant)*100)/100;
			
			//Si la différence est positive, le debiteur a remboursé sa dette, il est exclu du tableau
			if(diff > 0){
				a.splice(0, 1);
				receveur.montant = diff;
				
				b.montant = Math.abs(debiteur.montant);
				b.receveur = $scope.getParticipant(receveur.id).nom;
				b.debiteur = $scope.getParticipant(debiteur.id).nom;
			//Si la différence est négative, le receveur est totalement remboursé, il est exclu du tableau
			} else if(diff < 0){
				
				debiteur.montant = diff;
				
				a.splice(a.length -1, 1);
				
				b.montant = Math.abs(receveur.montant);
				b.receveur = $scope.getParticipant(receveur.id).nom;
				b.debiteur = $scope.getParticipant(debiteur.id).nom;
			//Si la différence est nulle, le receveur et le debiteur sont exclus du tableau
			} else {
				a.splice(0, 1);
				a.splice(a.length -1, 1);
				b.montant = receveur.montant;
				b.receveur = $scope.getParticipant(receveur.id).nom;
				b.debiteur = $scope.getParticipant(debiteur.id).nom;
			}
			if(b.montant != 0)
				$scope.remboursements.push(b);
		}
			
		return false;
	}

});