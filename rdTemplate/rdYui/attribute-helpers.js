// JSLint options:
/*global LogiXML, YUI, document, window */

YUI.add('attribute-helpers', function(Y) {
	//"use strict";
	
	var helpers = Y.namespace('LogiXML.Attribute'),
		Lang = Y.Lang;
	
	helpers.booleanValidator = function( val ) {
		return Lang.isString( val ) || Lang.isBoolean( val );
	};
		
	helpers.booleanSetter = function( val ) {
		if ( Lang.isBoolean( val ) ) {
			return val;
		}
		val = val.toLowerCase();
		
		if ( val === 'true' ) {
			return true;
		}
		
		return false;
	};
	
}, '1.0.0', { requires: [] });