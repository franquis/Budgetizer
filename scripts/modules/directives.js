var Directives = angular.modules("Directives",[]);

Directives.directive('pikaday',function(){
	var linker = function(scope,element,attr,ctrl) {
     	$(element).pikaday({
        	firstDay: 1,
        	format: 'DD/MM/YYYY',
        	i18n: {
        		months        : ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Aôut','Septembre','Octobre','Novembre','Décembre'],
        		weekdays      : ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
        		weekdaysShort : ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
        	},
        	onSelect: function(a){
        		var z = moment(new Date(a));
        		/**	@todo format date **/
        		
        		//var d = this.getMoment().getYear();
        		ctrl.$setViewValue(a);
        		scope.$apply();
           	}
        });
        
    };
	
	return {
		restrict:'A',
		require: 'ngModel',
		link: linker
	};
});