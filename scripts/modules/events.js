var eventsModule = angular.module("EventsModule",["ngResource"]);

eventsModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/events', {templateUrl : 'templates/events/index.html',controller:"EventsCtrl"}).
		when('/events/add', {templateUrl : 'templates/events/add.html',controller:"EventCtrl"}).
		when('/events/detail/:id', {templateUrl : 'templates/events/detail.html',controller:"EventDetailCtrl"}).
		when('/events/detail/:id/add', {templateUrl : 'templates/events/detail.html',controller:"EventDetailCtrl"}).

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
		"type":"event",
		"created":{
			"date":new Date(),
			"uid":$scope.currentUser._id
		}
	};
	
	$scope.newEvent = angular.copy($scope.EventModel);

	
	//Return the current 'Event' Object...
	var getEvent = function(){
		
		if(!angular.isObject($scope.event)){
			if($routeParams.id){
				var _id = $routeParams.id;
				$scope.$parent.getObject(_id,"events",function(event){
					$log.info("EventCtrl > getEvent() > Event #"+_id+" found:",event);
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

	
	getEvent();
	

	$scope.addEvent = function(){
		Events.save($scope.newEvent,function(event){
			DataFactory.data.events.push(event);
			$scope.newEvent = angular.copy($scope.EventModel);
		});
		
		$location.path("/events");

	}

});

eventsModule.controller("EventDetailCtrl",function($scope, $location, $timeout, $log, $routeParams, DataFactory){

	var url_params = $location.search();
	$scope.defaultView = "list";
	$scope.view = (url_params.view) ? url_params.view : $scope.defaultView;	
	
	$scope.ready = false;

	$scope.$on('ready',function(){
		$log.info("App ready");
		$scope.ready = true;
	})

	$scope.filters = {
		"query":"",
		'orderBy':"created.date",
		'order':false

	};

	$scope.repartition = {
		"total":0,
		"users":[]
	};
	var getRepartitionI = 0;
	$scope.expenses = [];

	var getTotal = function(){
		
		$scope.repartition.total = 0;
		angular.forEach($scope.expenses,function(expense){
			$scope.repartition.total += parseFloat(expense.amount);
		});
	};
	
	var getEvent = function(){

		if(!angular.isObject($scope.event)){
			if($routeParams.id){
				var _id = $routeParams.id;
				DataFactory.getEvent(_id,function(event){
					$log.info("EventDetailCtrl > getEvent() > Event #"+_id+" found:",event);
					$scope.event = event;
					angular.forEach(event.expenses,function(expense){
						Expense = DataFactory.getExpense(expense);
						$scope.expenses.push(Expense);
					});
					$scope.$emit("ready");
					$scope.$root.$emit("EventUpdate",{"event":event,"who":"EventDetailCtrl > getEvent()"});					
				},function(){
					$log.warn("Event #"+_id+" not found, looping...");
					$timeout(function(){
						getEvent();},1000);
				});

			}
		}
	};

	getEvent();

	$scope.$root.$on("EventUpdate",function(e,data){
		$log.info("EventUpdate detected. EventData: ",data, 'on timestamp', new Date().getTime());
		getRepartition(data.event);
		getTotal();
		// Events.save({id:$scope.event._id});
	});

	
	$scope.$root.$on('ExpenseUpdate',function(e,data){
		$log.info('ExpenseUpdate detected. EventData',data, 'on timestamp', new Date().getTime());
		getRepartition(data.event);
	});

	$scope.isContributor = function(participant,expense){
		return (jQuery.inArray(participant,expense.contributors) >= 0) ? true : false;;
	}


	var getRepartition = function(Event, participant){
		if(angular.isDefined(Event)){
			var event = Event;
		} else {
			$log.error("Required parameter 'event' ",e, "is not defined!")
			return;
		}
			
		if(event.expenses.length == 0){
			$log.info("No expenses for the current event",event._id);
		}
		getRepartitionI++;
		console.log("getRepartitionI(",$scope.event._id,")",getRepartitionI);
		var ParticipantRepartition = function(participant){
			//Clearing Repartition data for current participant
			var currentUserData = $scope.repartition.users[participant] = {"depense":0,"rembourse":0,"delta":0};

			var depense = 0, rembourse = 0, delta = 0;

			//for each expenses in the current event
			angular.forEach(event.expenses,function(expense_id){
				//Get the 'expense' object from the expense ID stored into the 'event' object.

				var expense = DataFactory.getExpense(expense_id);
			
				var NumberOfContributors = expense.contributors.length;
				
				if($scope.isContributor(participant,expense)){
					rembourse += parseFloat(expense.amount) / NumberOfContributors;
				}
				
				if( expense.creditor == participant) {
					depense += parseFloat(expense.amount);
				}
			});

			delta = parseFloat(depense - rembourse);

			$scope.repartition.users[participant] = {
				'depense': depense,
				'rembourse': rembourse,
				'delta': delta
			};
		};


		if(participant) {
			$log.info("getRepartition() called on event_id #"+event._id, 'for user', participant, 'on timestamp:', new Date().getTime());
			ParticipantRepartition(participant);
		} else {
			$log.info("getRepartition() called on event_id #"+event._id, 'on timestamp:', new Date().getTime());

			angular.forEach(event.participants,function(participant){
				ParticipantRepartition(participant);
			});
		}
	};
	
	

	



	var genereRemboursements = function(){
		
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


eventsModule.controller("ExpenseInEventCtrl",function($scope,$log){

	
	//Update the current expense with the selected participant.
	$scope.update = function($event,participant){
		
		var checkbox = $event.target;
		var action = (checkbox.checked ? 'add' : 'remove');
		
		var index = $scope.expense.contributors.indexOf(participant);
		if (action == 'add' & index == -1) {
			$scope.expense.contributors.push(participant);
		};
			
		if (action == 'remove' && index != -1) {
			$scope.expense.contributors.splice(index, 1);
		}
		$log.info("Expense update for event",$scope.event);

		$scope.$root.$emit("ExpenseUpdate",{event:$scope.event,expense:$scope.expense,participant:participant});
	};

	//Returns the 'checked' attribute for a 'checkbox' DOM element.
	$scope.isContributor = function(id){
		if(angular.isDefined($scope.expense))
			return (jQuery.inArray(id,$scope.expense.contributors) >= 0) ? 'checked' : '';
	}




});