var Directives = angular.module("Directives",[]);

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

Directives.directive('chosen',function(){
    var linker = function(scope,element, attr, ctrl){
        $(element).select2({
            
        });
    };
    return {
        restrict: 'A',
        require: 'ngModel',
        link: linker
    };
});

Directives.directive('uiSelect2', ['$http', function (uiConfig, $http) {
  var options = {
    'width':'copy'
  };
  return {
    require: '?ngModel',
    compile: function (tElm, tAttrs) {
        var watch,
        repeatOption,
        repeatAttr,
        isSelect = $(tElm).is('select'),
        isMultiple = (tAttrs.multiple !== undefined);

      // Enable watching of the options dataset if in use
      if ($(tElm).is('select')) {
        repeatOption = $(tElm).find('option[ng-repeat], option[data-ng-repeat]');

        if (repeatOption.length) {
            repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
            watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
        }
      }

      return function (scope, elm, attrs, controller) {
        // instance-specific options
        var opts = angular.extend({}, options, scope.$eval(attrs.uiSelect2));

        if (isSelect) {
          // Use <select multiple> instead
          delete opts.multiple;
          delete opts.initSelection;
        } else if (isMultiple) {
          opts.multiple = true;
        }

        if (controller) {
          // Watch the model for programmatic changes
          controller.$render = function () {
            if (isSelect) {
              $(elm).select2('val', controller.$modelValue);
            } else {
              if (isMultiple && !controller.$modelValue) {
                $(elm).select2('data', []);
              } else if (angular.isObject(controller.$modelValue)) {
                $(elm).select2('data', controller.$modelValue);
              } else {
                $(elm).select2('val', controller.$modelValue);
              }
            }
          };


          // Watch the options dataset for changes
          if (watch) {
            scope.$watch(watch, function (newVal, oldVal, scope) {
              if (!newVal) return;
              // Delayed so that the options have time to be rendered
              setTimeout(function () {
                $(elm).select2('val', controller.$viewValue);
                // Refresh angular to remove the superfluous option
                $(elm).trigger('change');
              });
            });
          }

          if (!isSelect) {
            // Set the view and model value and update the angular template manually for the ajax/multiple select2.
            $(elm).bind("change", function () {
              scope.$apply(function () {
                controller.$setViewValue($(elm).select2('data'));
              });
            });

            if (opts.initSelection) {
              var initSelection = opts.initSelection;
              opts.initSelection = function (element, callback) {
                initSelection(element, function (value) {
                  controller.$setViewValue(value);
                  callback(value);
                });
              };
            }
          }
        }

        attrs.$observe('disabled', function (value) {
            $(elm).select2(value && 'disable' || 'enable');
        });

        if (attrs.ngMultiple) {
            scope.$watch(attrs.ngMultiple, function(newVal) {
                $(elm).select2(opts);
            });
        }

        // Set initial value since Angular doesn't
        elm.val(scope.$eval(attrs.ngModel));

        // Initialize the plugin late so that the injected DOM does not disrupt the template compiler
        setTimeout(function () {
            $(elm).select2(opts);
        });
      };
    }
  };
}]);