var expensesModule = angular.module("ExpensesModule",["ngResource"]);

expensesModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/expenses', {templateUrl : 'templates/expenses/index.html',controller:"ExpensesCtrl"}).
		when('/expenses/add', {templateUrl : 'templates/expenses/add.html',controller:"ExpenseCtrl"}).
		when('/expenses/detail/:id', {templateUrl : 'templates/expenses/detail.html',controller:"ExpenseCtrl"}).

		otherwise({redirectTo: '/404'});
}]);

expensesModule.factory('Expenses', function($resource){
	return $resource('api/expenses/:id', {}, {
		query: {method:'GET', isArray:true}
	});
});

expensesModule.controller("ExpensesCtrl",function($scope, $location){
	var url_params = $location.search();
	$scope.view = (url_params.view) ? url_params.view : "block";
	$scope.event = $scope.$parent.event;

	

});

expensesModule.controller("ExpenseCtrl",function($scope, $routeParams, Expenses, DataFactory){

	$scope.event = $scope.$parent.event;
	$scope.ExpenseModel = {
		"type":"expense",
		"event_id":$routeParams.id,
		"created":{
			"date":new Date(),
			"uid":$scope.currentUser._id
		}
	};
	$scope.newExpense = angular.copy($scope.ExpenseModel);

	$scope.addExpense = function(){
		Expenses.save($scope.newExpense,function(expense){
			$scope.$parent.expenses.push(expense);
			$scope.newExpense = angular.copy($scope.ExpenseModel);
			//@todo broadcast event ?
		});
		$scope.$root.$emit("EventUpdate",{event:$scope.event});
		$scope.$parent.view = $scope.$parent.defaultView; //@todo change this to return to the previous view
	}

	$scope.deleteExpense = function(){
		if(confirm("Delete '"+$scope.expense.description+"'?")){
			var _id = $scope.expense._id;
			var ExpenseIndex = DataFactory.indexes.expenses[_id];
			$scope.$parent.expenses.splice(ExpenseIndex,1);
			//Expenses.delete({id:_id});
			$scope.$root.$emit("EventUpdate",{event:$scope.event});
			console.log("Removing expense #"+$scope.expense);
		}
		
	};

});

expensesModule.controller('ExpenseDetailCtrl',function($rootScope, $scope, Expenses, DataFactory){
	$scope.filters = $scope.$parent.filters;

	$scope.update = function($event,participant){
		var expense = $scope.expense;
		var checkbox = $event.target;
		var action = (checkbox.checked ? 'add' : 'remove');
		
		var index = expense.contributors.indexOf(participant);
		if (action == 'add' & index == -1) {
			expense.contributors.push(participant);
		};
			
		if (action == 'remove' && index != -1) {
			expense.contributors.splice(index, 1);
		}
		
		$scope.$root.$emit("ExpenseUpdate",{expense:expense,participant:participant});
	};

	$scope.isContributor = function(id){
		return (jQuery.inArray(id,$scope.expense.contributors) >= 0) ? 'checked' : '';
	}


});