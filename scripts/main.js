var Budgetizer = angular.module("Budgetizer",["EventsModule","UsersModule","ExpensesModule","Filters","Directives"]);

Budgetizer.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/', {templateUrl : 'templates/dashboard.html'}).
		otherwise({redirectTo: '/'});
}]);


Budgetizer.run(function($rootScope) {
    
    $rootScope.$on('handleEmit', function(event, args) {
        $rootScope.$broadcast('handleBroadcast', args);
    });

});

/** @see http://stackoverflow.com/questions/12657389/angularjs-load-service-then-call-controller-and-render **/
Budgetizer.factory('DataFactory',function($rootScope, $timeout,$q, $log, Users, Events, Expenses) {
    
	var models = {};
	var indexes = {"users":[],"events":[],"expenses":[],"categories":[]};


	var buildIndex = function(object, callback){
		angular.forEach(models[object],function(o,i){
			indexes[object][o._id] = i;
		});
		if(callback){
			callback(indexes[object]);
		}
	}

	var getObject = function(id,ObjType,success,error){

		if(id && angular.isDefined(indexes[ObjType])){
		
			if(angular.isDefined(indexes[ObjType][id])) {
				var index = indexes[ObjType][id];
				var object = models[ObjType][index];
				
				//Callback function
				if(success){
					success(object);
				} else {
					return object;
				}
			} else {
				if(error){
					error();
				}
			}
		} else {
			$log.error("getObject(): no objectType '"+ObjType+"'");
		}
	};
	
	/* alias for the getObject function */

	var getUser = function(id,success,error){
		return getObject(id,"users",success,error);
	}

	var getEvent = function(id,success,error){
		return getObject(id,'events',success,error);
	}

	var getExpense = function(id,success,error){
		return getObject(id,'expenses',success,error);
	}

	/* Data fetching ... */
	$rootScope.$watch(function(){return models;},function(a,b){
		//$log.info("DataFactory watcher:",a,b);
	});

	var xhr = function(poll){
		loading = 0;
		models.events =  Events.query(function(events){
				buildIndex("events");
			},function(error){
				alert("A connexion error occured...");
				$log.error(error);
		});

		models.users = Users.query(function(users){
				buildIndex("users");
			},function(error){
				alert("A connexion error occured...");
				$log.error(error);
		});

		models.expenses =  Expenses.query(function(expenses){
				buildIndex("expenses");
			},function(error){
				alert("A connexion error occured...");
				$log.error(error);
		});

		//@todo move to the db and add specific controllers
		models.categories = [
			{"_id":"1","name":"EDF"},
			{"_id":"2","name":"Eau"},
			{"_id":"3","name":"Internet"},
			{"_id":"4","name":"Transport"},
			{"_id":"5","name":"Courses"},
		];
		buildIndex("categories");

		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}

		/* Long polling.. */
		if(poll){
			$timeout(function(){xhr(poll);},poll);
		}
	};


	
	//Launching xhr requests...
	xhr();
    
    return {
    	data : models,
    	indexes: indexes,
    	get : getObject,
    	getUser: getUser,
    	getEvent: getEvent,
    	getExpense: getExpense,
    	refresh: xhr
    };
});

Budgetizer.controller('MainCtrl',function($scope, $timeout, $location, $routeParams, $log, Users, Events, Expenses, DataFactory){
	
	$scope.$log = $log;
	
	
	$scope.error = {
		"status":200
	};

	$scope.currentUrl = function(){
		return $location.path();
	};

	$scope.currentUser = {
		"_id":"5dff9eebfedec51410b07d961200088f",
		"firstname":"François",
		"lastname":"Perret du Cray"
	};

	$scope.index = {"users":[],"events":[],"expenses":[]};

	$scope.modules = [
		{"title":"Dashboard","url":"/","icon":"icon-home"},
		{"title":"Events","url":"events","icon":"icon-time"},
		{"title":"Expenses","url":"expenses","icon":"icon-money"},
		{"title":"Users","url":"users","icon":"icon-group"}
	];

	
	$scope.$watch("DataFactory.data",function(){
		$scope.categories = DataFactory.data.categories;
		$scope.events = DataFactory.data.events;
		$scope.users = DataFactory.data.users;
		$scope.expenses = DataFactory.data.expenses;
	})
	
	$scope._category = function(id){
		if(id) return DataFactory.get(id,'categories');
	};

	$scope._user = function(id){
		return DataFactory.getUser(id);
	};

	$scope._event = function(id){
		return DataFactory.getEvent(id);
	};

	$scope._expense = function(id){
		return DataFactory.getExpense(id);
	};

	/*$scope.events = Events.query(function(success){
		$scope.buildIndex("events");
	},function(error){
		$scope.error = error;
	});

	$scope.users = Users.query(function(success){
		$scope.buildIndex("users");
	},function(error){
		$scope.error = error;
	});

	$scope.expenses = Expenses.query(function(success){
		$scope.buildIndex("expenses");
	},function(error){
		$scope.error = error;
	});*/

	/** @todo remove or finish...
	//Return the current 'Obj' Object...
	$scope.getCurrentObj = function(Obj){
		
		if(!angular.isObject($scope[Obj])){
			if($routeParams.id){
				var _id = $routeParams.id;
				$scope.$parent.getObject(_id,"events",function(obj){
					$log.info("Event #"+_id+" found:",obj);
					$scope[Obj] = obj;
				},function(){
					$log.warn("Event #"+_id+" not found, fetching...");
					$scope.event = Events.get({id:_id});	
				});

			}
		}
	};
	**/
	
	// @see http://docs.angularjs.org/api/ng.$cacheFactory
	$scope.buildIndex = function(object, callback){
		angular.forEach($scope[object],function(o,i){
			$scope.index[object][o._id] = i;
		});
		if(callback){
			callback($scope.index[object]);
		}
	}

	$scope.getObject = function(id,ObjType,Found,notFound){
		if(id && angular.isDefined($scope.index[ObjType])){
			if(angular.isDefined($scope.index[ObjType][id])) {
				var index = $scope.index[ObjType][id];
				var object = $scope[ObjType][index];
				
				if(Found){
					Found(object);
				} else {
					return object;
				}
			} else {
				if(notFound){
					notFound();
				}
			}
		} else {
			$log.error("getObject(): no objectType '"+ObjType+"'");
		}
	};

	$scope.getUser = function(id){
		return $scope.getObject(id,"users");
	}


	$scope.isLinkActive = function(url){
		
		// var element = angular.element(e.srcElement);
		// var url = angular.isDefined(url) ? _url : element.children('a').attr('href');

		if(angular.isDefined(url)){	
			if(url.length > 1){
				var re = new RegExp("^\/"+url);
				return ($scope.currentUrl().match(re)) ? 'active' : '';
			} else {
				return ($scope.currentUrl()) === url ? 'active' : '';
			}
		}
	};

});

Budgetizer.controller("CatCtrl",function($scope){

	$scope.newCat = {};

	$scope.categories = $scope.$parent.categories;

	$scope.addCategory = function(){
		$scope.categories.push($scope.newCat);
		$scope.newCat = angular.copy({});
		$('#CatModal').modal('hide');
		$('#CatAlertSucces').show();
	}

});