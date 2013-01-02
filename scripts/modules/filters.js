var Filters = angular.module("Filters",[]);

Filters.filter('trim',function(){
	var max = 50;
	return function(text,max,spacer) {
		if(!spacer) var spacer = " ...";
		if (text && text.length > max)
			return text.slice(0, max)+spacer;	
		else
			return text;
	}

});