// JSLint options:
/*global LogiXML, YUI, document, window */

YUI.add('node-custom-destroy', function(Y) {
	//"use strict";

	var customClasses = [],
		originalNodeDestroy = Y.Node.prototype.destroy;
	
	Y.namespace('LogiXML.Node').destroyClassKeys = customClasses;
		
	var CustomNodeDestroy = function() {};
	
	CustomNodeDestroy.prototype = {
		destroy : function() {
			// Check all the custom classes which registered themselves for custom destructor call
			if ( this.getData ) {
				Y.each( customClasses, function( dataKey ) {
					var classInstance = this.getDOMNode() ? this.getData( dataKey ) : false;
					if ( classInstance && typeof classInstance.destroy === 'function' ) {
						classInstance.destroy();
					}
				}, this);
			}
			
			// Call original destroy
			originalNodeDestroy.apply(this, arguments);
		}
	};
	
	Y.mix( Y.Node, CustomNodeDestroy, true, null, 1 );
	

}, '1.0.0', {requires: ['node']});