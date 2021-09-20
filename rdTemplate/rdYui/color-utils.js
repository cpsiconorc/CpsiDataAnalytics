// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false */

YUI.add('color-utils', function(Y) {
	//"use strict";
	
	var colorUtils = Y.namespace('LogiXML.Color'),
		Lang = Y.Lang,

	hexToDecimal = function (hex) {
	    return Math.max(0, Math.min(parseInt(hex, 16), 255));
	},

	decimalToHex = function (decimal) {
	    var hex = decimal.toString(16);
	    return hex.length === 1 ? "0" + hex : hex;
	},

	hexToRGB = function (hex, opacity, CSS) {
	    var useOpacity = false,
			r, g, b,
			rgb = {};

	    if (!Lang.isString(hex)) {
	        return undefined;
	    }

	    if (LogiXML.opacityValidator(opacity)) {
	        useOpacity = true;
	    }

	    // Remove # if there
	    if (hex.charAt(0) === '#') {
	        hex = hex.substr(1);
	    }
	    hex = hex.toLowerCase();

	    // Shorthand notation
	    if (hex.length === 3) {
	        r = hex.substr(0, 1);
	        rgb.r = hexToDecimal(r + r);

	        g = hex.substr(1, 1);
	        rgb.g = hexToDecimal(g + g);

	        b = hex.substr(2, 1);
	        rgb.b = hexToDecimal(b + b);
	    }
	        // Normal notation
	    else if (hex.length >= 6) {
	        rgb.r = hexToDecimal(hex.substr(0, 2));
	        rgb.g = hexToDecimal(hex.substr(2, 2));
	        rgb.b = hexToDecimal(hex.substr(4, 2));
	    }

	    if (CSS === true) {
	        if (useOpacity) {
	            return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + opacity + ')';
	        }
	        return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
	    }

	    return rgb;
	},

    componentToHex = function (c) {
        var num = parseInt(c),
            hex = num.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };
	
	colorUtils.hexToCSS_RGB = function( hex, opacity ) {
		return hexToRGB( hex, opacity, true );
	};
	
	colorUtils.hexToRGB = function( hex, opacity ) {
		return hexToRGB( hex, opacity );
	};
	
	colorUtils.rgbToHex = function( r, g, b ) {
		return "#" + decimalToHex( r ) + decimalToHex( g ) + decimalToHex( b );
	};
	colorUtils.hexWithOpacity = function (c) {
	    var m = /rgba?\((\d+),(\d+),(\d+),(\d+(\.\d+)?)/.exec(c),
            ret = [];
	    if (!m) {
	        m = /rgba?\((\d+), (\d+), (\d+)/.exec(c)
	    }
	    ret.push(m ? "#" + componentToHex(m[1]) + componentToHex(m[2]) + componentToHex(m[3]) : c);
	    ret.push(m && m.length >= 4 ? m[4] : 1);
	    return ret;
	};

}, '1.0.0', {requires: [] });