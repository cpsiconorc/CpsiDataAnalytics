// JSLint options:
/*jslint browser: true, forin: true, nomen: true, sub: true, white: true, regexp: true */
/*global LogiXML: true, YUI: false, Y: false, document: false, Node: false, window: false */

/*
 * JSlint doesn't like //"use strict"; at the top of JS files unless you scope.  Reason being
 * this file might be concatenated with others therefore force the concatenated file to run in
 * strict mode.  global.js is always loaded independently so we're fine. */

//"use strict";
/* 
 * Create namespace for LogiXML javascript code to live under.
 * Help prevent collisions with customer code and remove functions
 * from global space.
 */
if (window.LogiXML === undefined) {
    window.LogiXML = {};
}

LogiXML.cancelEvent = function (e) {
    e = e || window.event;

    if (!e)
        return false;

    e.cancelBubble = true;

    if (e.stopPropagation)
        e.stopPropagation();

    if (e.preventDefault)
        e.preventDefault();

    return false;
};

// Phantom JS doesn't support Math.trunc natively
Math.trunc = Math.trunc || function (x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x);
};

if (LogiXML.decodeHtml === undefined) {
    LogiXML.decodeHtml = function(htmlString, decodeTags) {
        var result = htmlString.toString();
        if (result && result.indexOf("&") != -1) {
            if (!LogiXML.decodeHtmlTextArea) {
                LogiXML.decodeHtmlTextArea = document.createElement("textarea");
            }
            LogiXML.decodeHtmlTextArea.innerHTML = result;
            if (LogiXML.isIE() && LogiXML.isIE() <= 9) {
                result = LogiXML.decodeHtmlTextArea.innerHTML;

            } else {
                result = LogiXML.decodeHtmlTextArea.value;
            }
        }
        if (!decodeTags && result)
        {
            result = result.replace(/</g, "&lt;");
        }

        return result;
    }
}

/// REPDEV-21152
/// Studio Preview browser bug can trigger blur on textboxes when it didn't actually blur
/// This function detects if that happened, and if it did it fixes the issue and returns true
/// This function should never return true in Chrome, IE, Firefox, or Edge
/// If this returns true when it shouldn't, it could be due to the use of `element.simulate("blur")`
/// if so, change it to `element.blur()` and all should be well again
LogiXML.isFalseBlur = function () {
    if (window
        && window.event
        && window.event.type == "blur"
        && window.event.target
        && document
        && document.activeElement
        && document.activeElement == window.event.target)
    {
        document.activeElement.focus();
        return true;
    }

    return false;
};

LogiXML.isSelfTarget = function (target) {
    return (!target
        || target == "_self"
        || target == window.name
        || (target == "_top" && window === window.top)
        || (target == "_parent" && window === window.parent));
}

LogiXML.rd = {};
LogiXML.guids = {};

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    }
}

Array.prototype.maxArray = function () {
    return Math.max.apply(null, this);
};

Array.prototype.minArray = function () {
    return Math.min.apply(null, this);
};

String.prototype.startsWith = function(str) {
    return this.indexOf(str) === 0;
};
String.prototype.endsWith = function(str) {
    return this.indexOf(str, this.length - str.length) !== - 1;
};

if (!Array.prototype.some) {
    Array.prototype.some = function (fun /*, thisArg */) {
        //'use strict;
        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function')
            throw new TypeError();

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(thisArg, t[i], i, t))
                return true;
        }

        return false;
    };
}

LogiXML.layout = {};
LogiXML.layout.isRendererElementCreated = false;
LogiXML.layout.getTextDimensions = function(text, style, className) {
    var div;
    if (LogiXML.layout.isRendererElementCreated && (div = document.getElementById('textDimensionDivision')) != null) {
        div.style.display = "block";
    }
    else{
        div = document.createElement("lDiv");
        div.setAttribute('id', 'textDimensionDivision');
        document.body.appendChild(div);
        LogiXML.layout.isRendererElementCreated = true;
    }
        
    if (style && style.toString().length != 0) {
        div.style.fontFamily = style.fontFamily;
        div.style.fontSize = style.fontSize || '';
        div.style.fontWeight = style.fontWeight || 'normal';
        if (style.width) {
            div.style.width = style.width;
        }
    } else {
        div.style = '';
    }
    div.style.position = "absolute";
    div.style.left = -1000;
    div.style.top = -1000;
    div.innerHTML = text;
    if (className) {
        div.className = className;
    } else {
        div.className = '';
    }

    var result = {
        width: div.clientWidth,
        height: div.clientHeight
    };
    div.style.display = "none";
    div = null;

    return result;
};

// Utilities
LogiXML.inspect = function( inspectMe ) {
	var inspectString = "",
		item;
	if ( typeof inspectMe === 'object' || typeof inspectMe === 'array' )
	{
		for( item in inspectMe )
		{
			inspectString += item + " : " + inspectMe[item] + "\n";
		}
		return inspectString;
	}
	
	return inspectMe;
};

LogiXML.isDomNode = function( checkMe ) {
	return (typeof Node === 'object' ?
		// DOM2 supporting browser check
		checkMe instanceof Node :
		// Non-compliant browser check
		checkMe && typeof checkMe === 'object' && typeof checkMe.nodeType === 'number' && typeof checkMe.nodeName=== 'string');	
};

LogiXML.isNumeric = function(input) {
    var re = /^-{0,1}\d*\.{0,1}\d+$/;
    return re.test(input);
};

LogiXML.opacityValidator = function( val ) {
	var opacity = val;
	if ( Y.Lang.isString( val ) ) {
		opacity = parseFloat( val );
	}
	
	if ( Y.Lang.isNumber( opacity ) ) {
		return val >= 0.0 && val <= 1.0;
	}
	
	return false;
};

LogiXML.isNodeVisible = function (node) {

	if (node.getStyle('display') == 'none')
		return false

	while (Y.Lang.isValue(node.ancestor())) {
		node = node.ancestor();
		
		if (node.getStyle('display') == 'none')
			return false;
	}
	
	return true;
}

LogiXML.String = {};
/*
 * Checks if a String is whitespace, empty ("") or null.
 * non-strings always return undefined
*/
LogiXML.String.isBlank = function( testMe ) {
	
	if ( Y.Lang.isString( testMe ) ) {
		return (testMe.length !== 0) ? Y.Lang.trim( testMe ) === '' : true ;
	}
	
	return undefined;
};

LogiXML.String.isNotBlank = function( testMe ) {
	
	if ( Y.Lang.isString( testMe ) ) {
		return !LogiXML.String.isBlank( testMe );
	}
	
	return undefined;
};

LogiXML.Math = {};

LogiXML.Math.expRegression = function (data) {
    var N = data.length;
    var y = [];
    var x = [];
    for (var i = 0; i < data.length; i++) {
        // ignore points <= 0, log undefined.
        if (data[i][1] <= 0) {
            N--;
        }
        else {
            x.push(data[i][0]);
            y.push(Math.log(data[i][1]));
        }
    }
    var SX = 0;
    var SY = 0;
    var SXX = 0;
    var SXY = 0;
    var SYY = 0;
    for (i = 0; i < N; i++) {
        SX = SX + x[i];
        SY = SY + y[i];
        SXY = SXY + x[i] * y[i];
        SXX = SXX + x[i] * x[i];
        SYY = SYY + y[i] * y[i];
    }
    var slope = (N * SXY - SX * SY) / (N * SXX - SX * SX);
    var intercept = (SY - slope * SX) / N;
    var interceptExp = Math.exp(intercept);
    var slopeExp = Math.exp(slope);
    var result = [];
    for (i = 0; i < data.length; i++) {
        result.push([x[i], interceptExp * Math.pow(slopeExp, x[i])]);
    }
    result.sort();
    return result;
};
// we expect an array of arrays here where every sub array is the list of coordinates [[x,y],[x1,y1]...]
LogiXML.Math.linearRegression = function (coordinates) {
    /**
    * Code for regression extracted from jqplot.trendline.js
    *
    * Version: 1.0.0a_r701
    *
    * Copyright (c) 2009-2011 Chris Leonello
    * jqPlot is currently available for use in all personal or commercial projects
    * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL
    * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can
    * choose the license that best suits your project and use it accordingly.
    *
    **/
    var sx = 0;
    var sy = 0;
    var sxx = 0;
    var sxy = 0;
    var syy = 0;
    for (var index = 0; index < coordinates.length; index++) {
        var x = coordinates[index][0];
        var y = coordinates[index][1];
        sx = sx + x;
        sy = sy + y;
        sxy = sxy + x * y;
        sxx = sxx + x * x;
        syy = syy + y * y;
    }
    var slope = (coordinates.length * sxy - sx * sy) / (coordinates.length * sxx - sx * sx);
    var intercept = (sy - slope * sx) / coordinates.length;
    var result = [];
    // we can optimize this by adding only first and last points to the resulting array
    for (index = 0; index < coordinates.length; index++) {
        x = coordinates[index][0];
        result.push([x, slope * x + intercept]);
    }
    result.sort();
    return result;
};
LogiXML.Math.roundToSignificantDigit =  function( val, sig ) {
	if ( !(Y.Lang.isNumber( val ) && Y.Lang.isNumber( sig )) ) {
		return undefined;
	}
	
	if ( isNaN( val ) || isNaN( sig ) ) {
		return undefined;
	}
	
	if ( val === 0 ) {
		return 0;
	}
	
	if ( Math.round( val ) === val )
	{
		return val;
	}
	
	var mult = Math.pow(10, sig - Math.floor(Math.log(val < 0 ? -val: val) / Math.LN10) - 1);
	return Math.round(val * mult) / mult;
};

LogiXML.Math.getSignificantDigits = function( val ) {
	var significantDigits = 0;
	if ( isNaN( val ) ) {
		return undefined;
	}
	
	if ( val === 0 ) {
		return 0;
	}
	
	val = Math.abs(val).toString();
	// We need to get rid of the leading zeros for the numbers.
	val = val.replace( /^0+/, '');
	
	// Remove trailing 0's
	var re = /[^0](\d*[^0])?/;
	
	// Check if the number has a decimal point
	// Yes, then significant digits is just length of the string minus the decimal point
	if ( /\./.test( val ) ) {
		significantDigits = val.length - 1;
	}
	// No, well remove trailing 0's and check the length
	else {
		significantDigits = (val.match( re ) || [''])[0].length;
	}
	
	return significantDigits;
};

//Namespaces for super elements
LogiXML.Dashboard = {};
LogiXML.AnalysisGrid = {};

//Namespaces for supporting JS files
LogiXML.Ajax = {};
LogiXML.Ajax.AjaxTarget = function() {
	if ( LogiXML.Ajax._ajaxTarget === undefined )
	{
		LogiXML.Ajax._ajaxTarget = new Y.EventTarget();
	}
		
	return LogiXML.Ajax._ajaxTarget;
};
LogiXML.SubReport = {};
LogiXML.SubReport.initSubReports = function() {
	Y.each(Y.all('iframe'), function(nodeFrame) {		
		if (LogiXML.isNodeVisible(nodeFrame) 
		&& !Y.Lang.isValue(nodeFrame.getData('waitkey'))
		&& nodeFrame.getAttribute('src') == ''
        && nodeFrame.getData('hiddensource'))
			nodeFrame.set('src', nodeFrame.getData('hiddensource'));
	});
}
LogiXML.Tabs = LogiXML.Tabs || new Array();
LogiXML.Tabs.addTabs = function (obj) {
    // see if the tab is already here
    var alreadyHere = false;
    for (var i = LogiXML.Tabs.length - 1; i >= 0; i--) {
        var t = LogiXML.Tabs[i];

        if (t.get("_id") != obj.id)
            continue; // not the same tab, keep looking

        if (t.get("destroyed")) {
            // tab was here before but was destroyed, remove it, and reposition after adding it back
            LogiXML.Tabs.splice(i, 1);
            continue;
        }

        if (t.get("reportID") != obj.reportid) {
            continue;
        }

        if (t.get('_orientation') != obj.orientation) {
            continue;
        }

        if (t.get('isMobile') != obj.isMobile) {
            continue;
        }

        alreadyHere = true;
        break;
    }

    if (!alreadyHere)
        LogiXML.Tabs.push(new Y.LogiXML.Tabs(obj));

    if (obj.id == "rdDashboardTabs")
        LogiXML.Dashboard.pageDashboard.rdPositiontabSettingsCog();
};

LogiXML.WaitPanel = {};
LogiXML.Resize = {};
LogiXML.DraggableColumns = {};
LogiXML.ResizableColumns = {};
LogiXML.CellColorSlider = {};
LogiXML.InputSlider = {};
LogiXML.PopupPanel = {};
LogiXML.PopupMenu = {};
LogiXML.StartupScripts = {};

	/* Shim in Date parsing and toString code for ISO 8601 from https://github.com/kriskowal/es5-shim
	 * 
	 * Copyright 2009, 2010 Kristopher Michael Kowal. All rights reserved.
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to
	 * deal in the Software without restriction, including without limitation the
	 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	 * sell copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
	 * IN THE SOFTWARE.
	 */
(function(){
	//
	// Date
	// ====
	//

	// ES5 15.9.5.43
	// http://es5.github.com/#x15.9.5.43
	// This function returns a String value represent the instance in time
	// represented by this Date object. The format of the String is the Date Time
	// string format defined in 15.9.1.15. All fields are present in the String.
	// The time zone is always UTC, denoted by the suffix Z. If the time value of
	// this object is not a finite Number a RangeError exception is thrown.
	if (!Date.prototype.toISOString || (new Date(-62198755200000).toISOString().indexOf('-000001') === -1)) {
		Date.prototype.toISOString = function toISOString() {
			var result, length, value, year;
			if (!isFinite(this)) {
				throw new RangeError("Date.prototype.toISOString called on non-finite value.");
			}

			// the date time string format is specified in 15.9.1.15.
			result = [this.getUTCMonth() + 1, this.getUTCDate(),
				this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
			year = this.getUTCFullYear();
			year = (year < 0 ? '-' : (year > 9999 ? '+' : '')) + ('00000' + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6);

			length = result.length;
			while (length--) {
				value = result[length];
				// pad months, days, hours, minutes, and seconds to have two digits.
				if (value < 10) {
					result[length] = "0" + value;
				}
			}
			// pad milliseconds to have three digits.
			return year + "-" + result.slice(0, 2).join("-") + "T" + result.slice(2).join(":") + "." +
				("000" + this.getUTCMilliseconds()).slice(-3) + "Z";
		};
	}
	
	// ES5 15.9.4.2
	// http://es5.github.com/#x15.9.4.2
	// based on work shared by Daniel Friesen (dantman)
	// http://gist.github.com/303249
	if (!Date.parse || (Date.parse && Date.parse("+275760-09-13T00:00:00.000Z") !== 8.64e15))  {
		// XXX global assignment won't work in embeddings that use
	    // an alternate object for the context.
	    var origDate = Date;
		Date = (function(NativeDate) {
			// Date.length === 7
			var Date = function Date(Y, M, D, h, m, s, ms) {
				var length = arguments.length;
				if (this instanceof NativeDate) {
					var date = length === 1 && String(Y) === Y ? // isString(Y)
						// We explicitly pass it through parse:
						new NativeDate(origDate.parse(Y)) :
						// We have to manually make calls depending on argument
						// length here
						length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
						length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
						length >= 5 ? new NativeDate(Y, M, D, h, m) :
						length >= 4 ? new NativeDate(Y, M, D, h) :
						length >= 3 ? new NativeDate(Y, M, D) :
						length >= 2 ? new NativeDate(Y, M) :
						length >= 1 ? new NativeDate(Y) :
									  new NativeDate();
					// Prevent mixups with unfixed Date object
					date.constructor = Date;
					return date;
				}
				return NativeDate.apply(this, arguments);
			};

			// 15.9.1.15 Date Time String Format.
			var isoDateExpression = new RegExp("^" +
				"(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign + 6-digit extended year
				"(?:-(\\d{2})" + // optional month capture
				"(?:-(\\d{2})" + // optional day capture
				"(?:" + // capture hours:minutes:seconds.milliseconds
					"T(\\d{2})" + // hours capture
					":(\\d{2})" + // minutes capture
					"(?:" + // optional :seconds.milliseconds
						":(\\d{2})" + // seconds capture
						"(?:\\.(\\d{3}))?" + // milliseconds capture
					")?" +
				"(?:" + // capture UTC offset component
					"Z|" + // UTC capture
					"(?:" + // offset specifier +/-hours:minutes
						"([-+])" + // sign capture
						"(\\d{2})" + // hours offset capture
						":(\\d{2})" + // minutes offset capture
					")" +
				")?)?)?)?" +
			"$");

			// Copy any custom methods a 3rd party library may have added
			for (var key in NativeDate) {
				Date[key] = NativeDate[key];
			}

			// Copy "native" methods explicitly; they may be non-enumerable
			Date.now = NativeDate.now;
			Date.UTC = NativeDate.UTC;
			Date.prototype = NativeDate.prototype;
			Date.prototype.constructor = Date;

			// Upgrade Date.parse to handle simplified ISO 8601 strings
			Date.parse = function parse(string) {
				var match = isoDateExpression.exec(string);
				if (match) {
					match.shift(); // kill match[0], the full match
					// parse months, days, hours, minutes, seconds, and milliseconds
					for (var i = 1; i < 7; i++) {
						// provide default values if necessary
						match[i] = +(match[i] || (i < 3 ? 1 : 0));
						// match[1] is the month. Months are 0-11 in JavaScript
						// `Date` objects, but 1-12 in ISO notation, so we
						// decrement.
						if (i == 1) {
							match[i]--;
						}
					}

					// parse the UTC offset component
					var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();

					// compute the explicit time zone offset if specified
					var offset = 0;
					if (sign) {
						// detect invalid offsets and return early
						if (hourOffset > 23 || minuteOffset > 59) {
							return NaN;
						}

						// express the provided time zone offset in minutes. The offset is
						// negative for time zones west of UTC; positive otherwise.
						offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == "+" ? -1 : 1);
					}

					// Date.UTC for years between 0 and 99 converts year to 1900 + year
					// The Gregorian calendar has a 400-year cycle, so
					// to Date.UTC(year + 400, .... ) - 12622780800000 == Date.UTC(year, ...),
					// where 12622780800000 - number of milliseconds in Gregorian calendar 400 years
					var year = +match[0];
					if (0 <= year && year <= 99) {
						match[0] = year + 400;
						return NativeDate.UTC.apply(this, match) + offset - 12622780800000;
					}

					// compute a new UTC date value, accounting for the optional offset
					return NativeDate.UTC.apply(this, match) + offset;
				}
				return NativeDate.parse.apply(this, arguments);
			};

			return Date;
		})(Date);
	}
}());

// Shim in String trim if needed
if ( !String.prototype.trim ) {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g,'');
	};
}
LogiXML.isNotEmptyObject = function (object) {
    return (object.y != null && object.y != undefined) ||
        (object.low != null && object.low != undefined ||
        object.high != null && object.high != undefined);
};

if (!Array.isArray) {
    Array.isArray = function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

LogiXML.isNotEmpty2dArray = function (object) {
    return Array.isArray(object) &&
        (object[0] != null && object[0] != undefined ||
        object[1] != null && object[1] != undefined);
};
LogiXML.isNotEmptyValue = function (object) {
    return typeof object == "number";
};
LogiXML.hasValue = function (object) {
    return (object != null &&
        (this.isNotEmptyObject(object) ||
        this.isNotEmpty2dArray(object) ||
        this.isNotEmptyValue(object)));
};
LogiXML.newIndex = function getRandomInt(min, max) {
    min = min || 0;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
LogiXML.fireEvent = function (ele, eventName) {
    if (!ele || !eventName)
        return null;

    if (eventName.length > 2 && eventName.startsWith("on"))
        eventName = eventName.substr(2);

    if (document.createEvent) {
        var e = document.createEvent("HTMLEvents");
        e.initEvent(eventName, false, true);
        return ele.dispatchEvent(e);
    }

    if (ele.fireEvent)
        return ele.fireEvent("on" + eventName);

    var fun = ele["on" + eventName];

    if (!fun)
        return null;

    if (typeof fun == "function")
        return fun();

    if (typeof fun === "string") {
        if (fun.indexOf("javascript:") === 0)
            fun = fun.substr(11).trim();

        if (fun.indexOf("void(") === 0 || fun.indexOf("void ") === 0)
            return null;

        return eval(fun);
    }

    return null;
};
LogiXML.getRandomElements = function (array, count) {
    if (array.length <= count) {
        return array;
    }
    var indexes = [];
    do {
        var index = LogiXML.newIndex(count);
        if (!indexes.indexOf(index) != -1) {
            indexes.push(index);
        }
    } while (indexes.length <= count)
    return indexes;
};
LogiXML.attr = function (elem, prop, value) {
    var key,
		ret;
    if (Y.Lang.isString(prop)) {
        if (defined(value)) {
            elem.setAttribute(prop, value);
        } else if (elem && elem.getAttribute) {
            ret = elem.getAttribute(prop);
        }
    } else if (Y.Lang.isValue(prop) && Y.Lang.isObject(prop)) {
        for (key in prop) {
            elem.setAttribute(key, prop[key]);
        }
    }
    return ret;
}
String.prototype.format = String.prototype.format || function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
    });
};
LogiXML.TemplateEngine = function (tpl, data) {
    var re = /<%([^%>]+)?%>/gm;
    if (LogiXML.isIE()) {
        ieReplaceByRegex();
    }
    else {
        while (tpl.match(re)) {
            var match = re.exec(tpl.toString())
            tpl = tpl.toString().replace(match[0], data[match[1]])
        }
    }
    return tpl;
    function ieReplaceByRegex() {
        while (match = re.exec(tpl.toString())) {
            tpl = tpl.replace(match[0], data[match[1]])
        }
        if (match = re.exec(tpl.toString()))
        {
            tpl = tpl.replace(match[0], data[match[1]])
            ieReplaceByRegex();
        }
    }
}

LogiXML.isAncestorID = function (ele, id) {
    if (!ele || !id)
        return false;

    if (ele.id == id)
        return true;

    return LogiXML.isAncestorID(ele.parentNode, id);
};

LogiXML.isIE=function () {
    var myNav = navigator.userAgent.toLowerCase();
    var ieNumber = parseInt(myNav.split('msie')[1] || myNav.split('rv:')[1]);
    return ieNumber <= 11 ? ieNumber : false;
}

LogiXML.getUtcDateStringWithoutClientOffset = function (dt) {
    var tzo = -dt.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function (num) {
            var norm = Math.abs(Math.floor(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return dt.getFullYear()
        + '-' + pad(dt.getMonth() + 1)
        + '-' + pad(dt.getDate())
        + 'T' + pad(dt.getHours())
        + ':' + pad(dt.getMinutes())
        + ':' + pad(dt.getSeconds())
        + dif + pad(tzo / 60)
        + ':' + pad(tzo % 60);
}

LogiXML.getTimestampWithoutClientOffset = function (dt) {
    return Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds());
}

//YUI().use('resize-base', 'rdResizer', function (Y) {
//        //it is a stub for loading resizer and necessary .css, see yui-config.js
//});

YUI().use('node', 'event', function (Y) {
    LogiXML.EventBus = LogiXML.EventBus || {};
    LogiXML.EventBus.ChartCanvasEvents = function () {
        if (LogiXML.EventBus._ChartCanvasEvents === undefined) {
            LogiXML.EventBus._ChartCanvasEvents = new Y.EventTarget();
        }
        return LogiXML.EventBus._ChartCanvasEvents;
    };

});

LogiXML.getGuid = function () {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
LogiXML.getObjectX = function (eleObject) {
    return (eleObject.offsetParent ? (LogiXML.getObjectX(eleObject.offsetParent) + eleObject.offsetLeft) : eleObject.offsetLeft);
};
LogiXML.getObjectY = function (eleObject) {
    return (eleObject.offsetParent ? (LogiXML.getObjectY(eleObject.offsetParent) + eleObject.offsetTop) : eleObject.offsetTop);
};
LogiXML.listeners = [];
LogiXML.Listener = function (obj, eventName, func) {
    this.obj = obj;
    this.eventName = eventName;
    this.func = func;

    this.matches = function (obj, eventName) {
        return (this.obj === obj && this.eventName === eventName);
    }
};
LogiXML.addListener = function (ele, eventName, func) {
    var listener = new LogiXML.Listener(ele, eventName, func);

    if (ele.addEventListener)
        ele.addEventListener(eventName, func);
    else {
        eventName = "on" + eventName;

        if (ele.attachEvent)
            ele.attachEvent(eventName, func);
        else
            ele[eventName] = func;
    }

    LogiXML.listeners.push(listener);

    return listener;
};
LogiXML.clearListeners = function (obj) {
    for (var i = LogiXML.listeners.length - 1; i >= 0; i--) {
        listener = LogiXML.listeners[i];

        if (listener && listener.obj === obj)
            LogiXML.removeListener(listener);
    }
}
LogiXML.removeListener = function (listener) {
    if (!listener)
        return;

    var ele = listener.obj;
    var func = listener.func;
    var eventName = listener.eventName;

    if (ele.removeEventListener)
        ele.removeEventListener(eventName, func);
    else {
        eventName = "on" + eventName;

        if (ele.detachEvent)
            ele.detachEvent(eventName, func);
        else
            ele[eventName] = null;
    }

    for (var i = LogiXML.listeners.length - 1; i >= 0; i--) {
        if (LogiXML.listeners[i] === listener)
            LogiXML.listeners.splice(i, 1);
    }
};
LogiXML.trigger = function (ele, eventName, arg1) {
    var listener;
    var argsToPass = Array.prototype.slice.call(arguments, 2);

    for (var i = 0; i < LogiXML.listeners.length; i++) {
        listener = LogiXML.listeners[i];

        if (listener && listener.matches(ele, eventName)) {
            listener.func.apply(ele, argsToPass);
        }
    }
};
LogiXML.copyObject = function (source, target) {
    if (!target)
        target = {};

    if (typeof source == "function")
        source = source.prototype;

    for (var propName in source) {
        var value = source[propName];

        if (typeof value == "function")
            target[propName] = value.bind(target);
        else if (typeof value == "object") {
            var obj = target[propName];
            target[propName] = LogiXML.copyObject(value, obj);
        }
        else if (!target.hasOwnProperty(propName))
            target[propName] = value;
    }

    return target;
};
LogiXML.getQueryStringParam = function (name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);

    if (!results)
        return null;

    if (!results[2])
        return '';

    return decodeURIComponent(results[2].replace(/\+/g, " "));
};
LogiXML.getReportID = function () {
    return LogiXML.getQueryStringParam("rdReport");
};
LogiXML.scriptsLoading = LogiXML.scriptsLoading || [];
LogiXML.getScriptFromLink = LogiXML.getScriptFromLink || function (a, bKeepJavascriptPrefix, details) {
    if (details)
        details.attributeName = null;

    if (!a)
        return "";

    var script = a.href;

    if (script && script.indexOf("javascript:") == 0)
        script = script.substr(11);

    if (!script || script.replace(/[ ;]/g, "") == "void(0)") {
        if (details)
            details.attributeName = "onclick";

        script = a.getAttribute("onclick");

        if (script) {
            if (bKeepJavascriptPrefix) {
                if (script.indexOf("javascript:") != 0)
                    script = "javascript:" + script;
            } else {
                if (script.indexOf("javascript:") == 0)
                    script = script.substr(11);
            }
        }

        return script;
    }

    if (details)
        details.attributeName = "href";

    if (bKeepJavascriptPrefix)
        return a.href;

    return script;
};
LogiXML.getScriptInfo = LogiXML.getScriptInfo || function (src) {
    var scriptInfo;

    var srcOrig = src;
    src = LogiXML.resolveScriptSrc(src);

    for (var i = 0; i < LogiXML.scriptsLoading.length; i++) {
        scriptInfo = LogiXML.scriptsLoading[i];

        if (src == scriptInfo.src)
            return scriptInfo;
    }

    // script not tracked in this array - check document
    scriptInfo = {
        src: src,
        srcOrig: srcOrig,
        script: null,
        onAfterLoad: [],
        origArgs: [],
        onFail: [],
        loaded: false,
        failed: false,
        onAfterLoadAll: function () {
            if (this.onFailTimeout) {
                clearTimeout(this.onFailTimeout);
                this.onFailTimeout = null;
            }

            this.loaded = true;

            for (var i = 0; i < this.onAfterLoad.length; i++) {
                var fx = this.onAfterLoad[i];

                if (!fx)
                    continue;

                var oArgs = this.origArgs[i];
                var dependencies = oArgs[0];

                if (!Array.isArray(dependencies))
                    dependencies = [dependencies];

                // make sure all dependencies loaded
                var failed = 0;
                var notLoaded = 0;

                for (var j = 0; j < dependencies.length; j++) {
                    var depSrc = dependencies[j];
                    var depSrcInfo = LogiXML.getScriptInfo(depSrc);

                    if (depSrcInfo.failed)
                        failed++;

                    if (!depSrcInfo.loaded)
                        notLoaded++;
                }

                if (failed) {
                    var failFx = this.onFail[i];

                    if (failFx)
                        failFx(oArgs);

                    continue;
                }
                
                if (notLoaded)
                    continue;

                // all dependencies loaded
                this.onAfterLoad[i](oArgs);
            }
        },
        onFailAll: function () {
            if (this.loaded)
                return;

            this.failed = true;

            for (var i = 0; i < this.onFail.length; i++) {
                var onfail = this.onFail[i];

                if (onfail)
                    onfail();
            }
        },
        setEvents: function () {
            if (this.onFailTimeout) {
                clearTimeout(this.onFailTimeout);
                this.onFailTimeout = null;
            }

            var scriptInfo = this;
            var script = this.script;

            if (script.readyState) {
                script.onreadystatechange = function () {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        script.onreadystatechange = null;
                        setTimeout(scriptInfo.onAfterLoadAll.bind(scriptInfo), 10);
                    }
                };
            }
            else {
                script.onload = function () {
                    script.onload = null;
                    setTimeout(scriptInfo.onAfterLoadAll.bind(scriptInfo), 10);
                };
            }

            scriptInfo.onFailTimeout = setTimeout(scriptInfo.onFailAll.bind(scriptInfo), 4000);
        }
    };

    var list = document.getElementsByTagName("SCRIPT");
    var item, _src;

    for (var i = 0; i < list.length; i++) {
        item = list[i];
        _src = item.getAttribute("src");

        if (!_src)
            _src = item.getAttribute("SRC");

        if (src == _src) {
            scriptInfo.script = item;
            scriptInfo.loaded = true;

            break;
        }
    }

    LogiXML.scriptsLoading.push(scriptInfo);

    return scriptInfo;
};
LogiXML.getUrlParameters = LogiXML.getUrlParameters || function (url) {
    if (!url)
        return [];

    var params = [];

    if (url instanceof HTMLElement)
        url = LogiXML.getScriptFromLink(url, true);

    var i = url.indexOf("?");

    var sParams, idx;
    var startQuote = null;

    if (i < 0) {
        idx = 0;
        sParams = url;
    }
    else {
        idx = i + 1;
        sParams = url.substr(idx);

        if (i > 0) {
            var i1 = url.substr(0, idx).lastIndexOf("'");
            var i2 = url.substr(0, idx).lastIndexOf('"');
            i = Math.max(i1, i2);

            if (i >= 0)
                startQuote = url.substr(i, 1);
        }
    }

    var aParams = sParams.split("&");

    for (i = 0; i < aParams.length; i++) {
        var kvp = aParams[i].split("=");

        var length = 0;

        // for all params except the last one, include the trailing ampersand as part of this param's length property for ease of removal
        if (i + 1 < aParams.length)
            length++;

        var parm = {};
        var j;

        if (kvp[0]) { //RD20049
            if (startQuote) {
                j = kvp[0].indexOf(startQuote);

                if (j == 0)
                    break;

                if (j > 0) {
                    kvp[0] = kvp[0].substr(0, j);
                    aParams.length = i + 1;
                }
            }

            length += kvp[0].length;

            // REPDEV-24196
            // if this was extracted from a js string, then we should js string decode it
            if (startQuote)
                kvp[0] = eval(startQuote + kvp[0] + startQuote);

            kvp[0] = kvp[0].replace(/\+/g, "%20");
            parm.name = decodeURIComponent(kvp[0]);
        }

        if (kvp.length > 1) {
            if (startQuote) {
                j = kvp[1].indexOf(startQuote);

                if (j >= 0) {
                    if (j > 0)
                        kvp[1] = kvp[1].substr(0, j);
                    else
                        kvp[1] = "";

                    aParams.length = i + 1;
                }
            }

            length += 1; // "="

            if (kvp[1]) {
                length += kvp[1].length;

                // REPDEV-24196
                // if this was extracted from a js string, then we should js string decode it
                if (startQuote)
                    kvp[1] = eval(startQuote + kvp[1] + startQuote);

                kvp[1] = kvp[1].replace(/\+/g, "%20");

                parm.value = decodeURIComponent(kvp[1]);
            } else {
                parm.value = "";
            }
        }

        if (parm.name) {
            parm.length = length;
            parm.idx = idx;

            params.push(parm);
        }

        idx += length;
    }

    return params;
};
LogiXML.getUrlParameter = LogiXML.getUrlParameter || function (url, name) {
    var params = LogiXML.getUrlParameters(url);
    var param;

    for (var i = 0; i < params.length; i++) {
        param = params[i];

        if (param.name === name) {
            if ("value" in param)
                return param.value;

            return "";
        }
    }

    return null;
};
LogiXML.removeUrlParameter = LogiXML.removeUrlParameter || function (url, name) {
    var a;
    var attr;

    if (url instanceof HTMLElement) {
        a = url;

        var details = {};
        url = LogiXML.getScriptFromLink(a, true, details);
        attr = details.attributeName;
    } else {
        a = null;
        attr = null;
    }

    var params = LogiXML.getUrlParameters(url);

    for (i = 0; i < params.length; i++) {
        kvp = params[i];

        if (kvp.name == name) {
            var newUrl = "";

            if (kvp.idx > 0) {
                // keep everything up to the param to remove
                newUrl = url.substr(0, kvp.idx);
            }

            if (url.length > kvp.idx + kvp.length)
                newUrl += url.substr(kvp.idx + kvp.length);

            if (!a)
                return newUrl;

            a.setAttribute(attr, newUrl);

            return a;
        }
    }

    // not found

    if (a)
        return a;

    return url;
};
LogiXML.setUrlParameter = LogiXML.setUrlParameter || function (url, name, value) {
    var params = LogiXML.getUrlParameters(url);
    var kvp, i;
    var bFound = false;

    for (i = 0; i < params.length; i++) {
        kvp = params[i];

        if (kvp.name == name) {
            bFound = true;

            if (typeof value === "undefined") {
                if ("value" in kvp)
                    delete kvp.value;
            } else {
                kvp.value = value;
            }

            break;
        }
    }

    if (!bFound)
        params.push({
            name: name,
            value: value
        });

    i = url.indexOf("?");

    kvp = params[0];

    if (i > 0)
        url = url.substr(0, i) + "?";
    else if (url.indexOf("=") > 0)
        url = "";
    else if (url.length)
        url += "?";

    if ("value" in kvp)
        url += encodeURIComponent(kvp.name) + "=" + encodeURIComponent(kvp.value)
    else
        url += encodeURIComponent(kvp.name)

    for (i = 1; i < params.length; i++) {
        kvp = params[i];
        if ("value" in kvp)
            url += "&" + encodeURIComponent(kvp.name) + "=" + encodeURIComponent(kvp.value);
        else
            url += "&" + encodeURIComponent(kvp.name);
    }

    return url;
};
LogiXML.submitAsync = LogiXML.submitAsync || function (form, onSuccess, onFail, headers) {
    var data = "";
    var url = form.action;
    var files = [];
    var i, j;

    if (form.elements && form.elements.length) {
        for (i = 0; i < form.elements.length; i++) {
            var ele = form.elements[i];
            if (ele.name) {
                if (ele.type.toLowerCase() == "file" && ele.files && ele.files.length)
                    files.push(ele);
                else
                    data = data + rdGetInputValues(ele, true)
            }
        }
    }

    if (data.length)
        data = data.substr(1); // remove leading ampersand

    var contentType;

    if (files.length && window.FormData) {
        contentType = null;
        var dataArr = LogiXML.getUrlParameters("?" + data);
        data = new FormData();
        for (i = 0; i < dataArr.length; i++) {
            var d = dataArr[i];
            data.append(d.name, d.value);
        }
        for (i = 0; i < files.length; i++) {
            var eleFile = files[i];
            for (j = 0; j < eleFile.files.length; j++) {
                var f = eleFile.files[j];
                data.append(eleFile.name, f, f.name);
            }
        }
    }
    else
        contentType = "application/x-www-form-urlencoded";

    var req;

    if (window.XMLHttpRequest)
        req = new XMLHttpRequest();
    else
        req = new ActiveXObject("Microsoft.XMLHTTP");

    req.open("POST", url, true);
    if (onSuccess || onFail) {
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                var stat = String(req.status);

                if (stat.length == 3 && stat.indexOf("2") == 0) {
                    if (onSuccess)
                        onSuccess.apply(this, arguments);
                } else if (onFail)
                    onFail.apply(this, arguments);
            }
        }
    }

    if (contentType)
        req.setRequestHeader("Content-type", contentType);

    if (headers && headers.length) {
        for (var i = 0; i < headers.length; i++) {
            var header = headers[i];
            req.setRequestHeader(header.name, header.value);
        }
    }

    req.send(data);
};

LogiXML.eleOverlay = function (eleUnder, eleOver) {
    var op = eleUnder.parentNode;
    var offsetTop = 0;
    var offsetLeft = 0;
    var table = null;
    if (eleUnder.tagName.toLowerCase() == "tr") {
        while (op.tagName.toLowerCase() != "table") {
            op = op.parentNode;
        }

        table = op;
        op = op.parentNode;
    }

    while (op && op.tagName.toLowerCase().indexOf("rdcondelement") == 0) {
        op = op.parentNode;
    }

    var rect = eleUnder.getBoundingClientRect();

    eleOver.overlayCfg = {
        position: eleOver.style.position,
        width: eleOver.style.width,
        height: eleOver.style.height,
        top: eleOver.style.top,
        left: eleOver.style.left,
        parent: eleOver.parentNode,
        op: op,
        opPosition: op.style.position
    };

    op.style.position = "relative";

    // Get the offsets AFTER setting position relative
    offsetTop += eleUnder.offsetTop;
    offsetLeft += eleUnder.offsetLeft;

    if (table) {
        offsetTop += table.offsetTop;
        offsetLeft += table.offsetLeft;
    }

    op.appendChild(eleOver.parentNode.removeChild(eleOver));

    eleOver.style.position = "absolute";
    eleOver.style.width = rect.width + "px";
    eleOver.style.height = rect.height + "px";
    eleOver.style.top = offsetTop + "px";
    eleOver.style.left = offsetLeft + "px";
};
LogiXML.eleOverlayUndo = function (eleOver) {
    if (!eleOver || !eleOver.overlayCfg)
        return;

    eleOver.style.position = eleOver.overlayCfg.position;
    eleOver.style.width = eleOver.overlayCfg.width;
    eleOver.style.height = eleOver.overlayCfg.height;
    eleOver.style.top = eleOver.overlayCfg.top;
    eleOver.style.left = eleOver.overlayCfg.left;

    eleOver.overlayCfg.parent.appendChild(eleOver.parentNode.removeChild(eleOver));
    eleOver.overlayCfg.op.style.position = eleOver.overlayCfg.opPosition;

    eleOver.overlayCfg = null;
};

LogiXML.version = "1.0.0.0";

(function () {
    var currentScript = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    if (currentScript)
        LogiXML.version = LogiXML.getUrlParameter(currentScript.src, "v");
})();

LogiXML.addCssClass = LogiXML.addCssClass || function (ele, className) {
    if (!ele || !className)
        return;

    var classes = ele.className.split(" ");
    for (var i = 0; i < classes.length; i++) {
        var css = classes[i];
        if (css == className)
            return; // already set
    }

    classes.push(className);
    ele.className = classes.join(" ");
};
LogiXML.removeCssClass = LogiXML.removeCssClass || function (ele, className) {
    if (!ele || !className)
        return false;

    var classes = ele.className.split(" ");
    var newClasses = [];
    var bRemoved = false;
    for (var i = 0; i < classes.length; i++) {
        var css = classes[i];
        if (css != className)
            newClasses.push(css);
        else
            bRemoved = true;
    }

    ele.className = newClasses.join(" ");

    return bRemoved;
};

LogiXML.addScript = LogiXML.addScript || function (srcs, onAfterLoad, onFail) {
    var src;
    var addScript = [];

    if (!Array.isArray(srcs))
        srcs = srcs.split("|");

    var toAdd = srcs.length;
    var toWait = toAdd;
    var scriptInfo, version;

    for (var j = 0; j < srcs.length; j++) {
        src = srcs[j];

        scriptInfo = LogiXML.getScriptInfo(src);
        addScript[j] = scriptInfo;

        if (scriptInfo.script)
            toAdd--;

        if (scriptInfo.loaded)
            toWait--;
    }

    if (toAdd <= 0 && toWait <= 0)
        return false;

    var head = document.getElementsByTagName("HEAD");

    if (head && head.length)
        head = head[0];
    else
        head = document.body;

    for (i = 0; i < addScript.length; i++) {
        var scriptInfo = addScript[i];
        var doAppend = !scriptInfo.script;

        if (doAppend) {
            scriptInfo.script = document.createElement("SCRIPT");
            scriptInfo.script.type = "text/javascript";
            scriptInfo.script.src = srcs[i];
            scriptInfo.script.async = false;
        }

        scriptInfo.onAfterLoad.push(onAfterLoad);
        scriptInfo.onFail.push(onFail);
        scriptInfo.origArgs.push(arguments);

        scriptInfo.setEvents();

        if (doAppend)
            head.appendChild(scriptInfo.script);
    }

    return true;
};
// Merges all stylesheets from doc into document
LogiXML.mergeStylesheets = LogiXML.mergeStylesheets || function (doc) {
    if (!doc || !doc.getElementsByTagName || doc === document)
        return;

    var ssLinks = doc.getElementsByTagName("LINK");
    for (var i = 0; i < ssLinks.length; i++) {
        var ssLink = ssLinks[i];
        if (ssLink.getAttribute("rel") == "stylesheet" && ssLink.getAttribute("type") == "text/css")
            LogiXML.addStylesheet(ssLink.getAttribute("href"));
    }
};
LogiXML.addStylesheet = LogiXML.addStylesheet || function (href) {
    if (!href)
        return;

    var head = document.getElementsByTagName("HEAD");

    if (head && head.length)
        head = head[0];
    else
        head = document.body;

    var item;

    var list = head.getElementsByTagName("LINK");
    var _href;
    var gotIt = 0;
    var added = false;
    for (var i = 0; i < list.length; i++) {
        item = list[i];
        _href = item.getAttribute("href");
        if (!_href)
            _href = item.getAttribute("HREF");

        if (_href == href) {
            gotIt = 1;
            break;
        }
    }

    if (!gotIt) {
        item = document.createElement("LINK");
        item.setAttribute("rel", "stylesheet");
        item.setAttribute("type", "text/css");
        item.setAttribute("href", href);
        head.appendChild(item);
        added = true;
    }

    return added;
};

LogiXML.createElement = LogiXML.createElement || function (html) {
    var div = document.createElement("DIV");
    div.innerHTML = html;
    return div.removeChild(div.firstChild);
};

// Y.one("id$=somevalue") doesn't work when the id contains certain special characters
LogiXML.getElementByIdEnding = LogiXML.getElementByIdEnding || function (ele, ending, tagName) {
    var isYui;

    if (ele && !(ele instanceof HTMLElement)) {
        isYui = true;
        ele = ele._node;
    }
    else
        isYui = false;

    if (!ele || !ending)
        return null;

    var potentials;

    if (tagName)
        potentials = ele.getElementsByTagName(tagName);
    else
        potentials = ele.childNodes;

    var p = null;
    for (var i = 0; i < potentials.length; i++) {
        p = potentials[i];

        if (p.id && p.id.lastIndexOf(ending) === p.id.length - ending.length)
            break;

        if (!tagName) {
            p = LogiXML.getElementByIdEnding(p, ending);
            if (p)
                break;
        }

        p = null;
    }

    if (p && isYui)
        return Y.one(p);

    return p;
};

LogiXML.resolveScriptSrc = LogiXML.resolveScriptSrc || function (src) {
    if (src && (src.indexOf("rdTemplate/") == 0 || src.indexOf("/rdTemplate/") >= 0)) {
        version = LogiXML.getUrlParameter(src, "v");
        if (!version)
            return LogiXML.setUrlParameter(src, "v", LogiXML.version);
    }

    return src;
};

// When an ID contains a period, it messes up the YUI selectors.
// This changes all periods to backslash periods, and all other special characters to the unicode escape sequence.
// Always encodes first character.
// Use this when calling functions like addHandle("#" + LogiXML.escapeSelector(node.get('id')), ...)
LogiXML.escapeSelector = function (unescaped) {
    if (!unescaped)
        return unescaped;

    // REPDEV-24996 always encode first character even if it is not a special character
    var firstChar = unescaped.charCodeAt(0).toString(16).toLowerCase();
    while (firstChar.length < 6)
        firstChar = "0" + firstChar;
    firstChar = "\\" + firstChar;

    if (unescaped.length == 1)
        return firstChar;

    // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, `, {, |, }, and ~.
    return firstChar + unescaped.substr(1).replace(/\\/g, "\\00005c").replace(/\./g, "\\.")
        .replace(/ /g, "\\000020")
        .replace(/!/g, "\\000021")
        .replace(/"/g, "\\000022")
        .replace(/#/g, "\\000023")
        .replace(/\$/g, "\\000024")
        .replace(/%/g, "\\000025")
        .replace(/&/g, "\\000026")
        .replace(/'/g, "\\000027")
        .replace(/\(/g, "\\000028")
        .replace(/\)/g, "\\000029")
        .replace(/\*/g, "\\00002a")
        .replace(/\+/g, "\\00002b")
        .replace(/,/g, "\\00002c")
        .replace(/-/g, "\\00002d")
        .replace(/\//g, "\\00002f")
        .replace(/:/g, "\\00003a")
        .replace(/;/g, "\\00003b")
        .replace(/</g, "\\00003c")
        .replace(/=/g, "\\00003d")
        .replace(/>/g, "\\00003e")
        .replace(/\?/g, "\\00003f")
        .replace(/@/g, "\\000040")
        .replace(/\[/g, "\\00005b")
        .replace(/\]/g, "\\00005d")
        .replace(/\^/g, "\\00005e")
        .replace(/`/g, "\\000060")
        .replace(/\{/g, "\\00007b")
        .replace(/\|/g, "\\00007c")
        .replace(/\}/g, "\\00007d")
        .replace(/\~/g, "\\00007e")
        ;
};

LogiXML.fixYuiTest = LogiXML.fixYuiTest || function (node) {
    if (node.__rdOriginalYuiTest)
        return;

    node.__rdOriginalYuiTest = node.test;
    node.test = function (s) {
        if (s && typeof s === "string" && s[0] == "#") {
            if (Y.one(s) === this)
                return true;
        }

        return this.__rdOriginalYuiTest.apply(this, arguments);
    }.bind(node);
};

LogiXML.getAncestorByTagName = LogiXML.getAncestorByTagName || function (ele, tagName, includeSelf) {
    var isYui = false;

    if (ele && !(ele instanceof HTMLElement)) {
        isYui = true;
        ele = ele._node;
    }

    if (!ele || !tagName)
        return null;

    tagName = tagName.toLowerCase();

    if (includeSelf) {
        if (ele.tagName.toLowerCase() === tagName) {
            if (isYui)
                return Y.one(ele);

            return ele;
        }
    }

    ele = ele.parentNode;
    while (ele && ele.tagName.toLowerCase() != tagName) {
        ele = ele.parentNode;
    }

    if (!ele)
        return null;

    if (isYui)
        return Y.one(ele);

    return ele;
};

LogiXML.xmlStringToDoc = LogiXML.xmlStringToDoc || function (xmlString) {
    if (window.DOMParser) {
        parser = new DOMParser();
        return parser.parseFromString(xmlString, "text/xml");
    }

    // Internet Explorer
    var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = false;
    xmlDoc.loadXML(kml);
    return xmlDoc;
};

LogiXML.watchDownload = LogiXML.watchDownload || function (fileGuid) {
    if (!fileGuid || !!LogiXML._downloadForm)
        return; // already watching

    var url = window.location.href;
    var i = url.indexOf("?");
    if (i > 0)
        url = url.substr(0, i);

    var form = document.createElement("FORM");
    form.id = "rdExportFileForm";
    form.style.display = "none";
    form.action = url;
    form.method = "POST";
    document.body.appendChild(form);

    var hdnGuid = document.createElement("INPUT");
    hdnGuid.type = "hidden";
    hdnGuid.name = "rdExportFileGuid";
    hdnGuid.value = fileGuid;

    form.appendChild(hdnGuid);

    LogiXML._downloadForm = form;

    LogiXML._downloadFormSuccess = function () {
        if (!LogiXML._downloadForm)
            return;

        switch (this.status) {
            case 201: // Complete
                LogiXML.unwatchDownload();
                break;
            case 202: // Accepted - Check again
                setTimeout(function () {
                    if (LogiXML._downloadForm)
                        LogiXML.submitAsync(LogiXML._downloadForm, LogiXML._downloadFormSuccess);
                }, 1000);
                break;
        }
    };

    LogiXML.submitAsync(LogiXML._downloadForm, LogiXML._downloadFormSuccess);
};

LogiXML.unwatchDownload = LogiXML.unwatchDownload || function () {
    if (Y.Cookie && Y.Cookie.exists('rdFileDownloadComplete'))
        Y.Cookie.remove('rdFileDownloadComplete', { path: '/' });

    if (LogiXML._downloadForm) {
        LogiXML._downloadForm.parentNode.removeChild(LogiXML._downloadForm);
        LogiXML._downloadForm = null;
        LogiXML._downloadFormSuccess = null;
    }
};

LogiXML.isDownloadComplete = LogiXML.isDownloadComplete || function (checkForm) {
    if (Y.Cookie && Y.Cookie.exists('rdFileDownloadComplete'))
        return true;

    if (!checkForm)
        return false;

    return !LogiXML._downloadForm;
};

function rdGetCookie(varName) {
    var name = varName + "=";
    var cookieString = document.cookie.split(';');
    for (var i = 0; i < cookieString.length; i++) {
        var cookie = cookieString[i].trim();
        if (cookie.indexOf(name) == 0) return cookie.substring(name.length, cookie.length);
    }
    return "";
}


function rdSetUndoRedoVisibility() {

    document.onkeydown = UndoRedo;

    var bNoData = false;
    var eleUndoDisabled = document.getElementById('divUndoDisabled');
    var eleUndoEnabled = document.getElementById('divUndoEnabled');
    var eleRedoDisabled = document.getElementById('divRedoDisabled');
    var eleRedoEnabled = document.getElementById('divRedoEnabled');

    var rdAllowUndo =   rdGetCookie("rdAllowUndo")
   
    var rdAllowRedo = rdGetCookie("rdAllowRedo");

    if (Y.Lang.isValue(eleRedoDisabled)) {
        if (rdAllowRedo == "False" && rdAllowUndo == "False") {
            eleRedoEnabled.style.display = "none";
            eleRedoDisabled.style.display = "none";
        }
        else if (rdAllowRedo == "True") {
            eleRedoEnabled.style.display = "";
            eleRedoDisabled.style.display = "none";
        }
        else if (rdAllowRedo == "False") {
            eleRedoEnabled.style.display = "none";
            eleRedoDisabled.style.display = "";
        } 
    }

    if (Y.Lang.isValue(eleUndoDisabled)) {
        if (rdAllowUndo == "False" && rdAllowRedo == "False") {
            eleUndoEnabled.style.display = "none";
            eleUndoDisabled.style.display = "none";
        }
        else if (rdAllowUndo == "True") {
            eleUndoEnabled.style.display = "";
            eleUndoDisabled.style.display = "none";
        }
        else if (rdAllowUndo == "False") {
            eleUndoEnabled.style.display = "none";
            eleUndoDisabled.style.display = "";
        } 
    }

}

function rdSetCookie(name, value) {      
    var path = "/"
    //Has user set a path in settings ?
    try {        
        if (rdCookiePath && rdCookiePath.length > -1) {
            path = rdCookiePath;
        }
    } catch (e) {
        
    }
    document.cookie = name + "=" + value + "; path=" + path;
}

/*Undo/Redo code - should only attach the key listener event if the undo/redo divisions are present.
*/
function UndoRedo(e) {
    var evtobj = window.event ? event : e

    if (evtobj.keyCode == 90 && evtobj.ctrlKey) {

        var rdAllowUndo = rdGetCookie("rdAllowUndo")
        var divUndo = document.getElementById('divUndoEnabled');
        if (rdAllowUndo == "True" && divUndo)
            divUndo.click();
    }

    if (evtobj.keyCode == 89 && evtobj.ctrlKey) {

        var rdAllowRedo = rdGetCookie("rdAllowRedo");
        var divRedo = document.getElementById('divRedoEnabled');

        if (rdAllowRedo == "True" && divRedo)
            divRedo.click();
    }
}

var _nThrottleTimeout = 0;
function rdEventThrottle(fn, nInterval) {    
    if (_nThrottleTimeout)
        window.clearTimeout(_nThrottleTimeout);
    _nThrottleTimeout = window.setTimeout(fn, nInterval);
}

function getCustomCssProperty(style, propertyName) {    
    if (style) {
        var entries = style.split(";");

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i].split(":");
            if (entry[0] == propertyName) {
                return entry[1];
            }
        }
        return null;    
    }
    return null;
}

function encodeHtmlInput(value) {
    var div = document.createElement("DIV");
    div.textContent = value;
    return div.innerHTML;
}

// Metadata Builder and New Data Table Wizard from Studio
LogiXML.studioWizardFixup = LogiXML.studioWizardFixup || function () {
	if (LogiXML.getUrlParameter(location.href, "rdForWizard") === "True") {
		LogiXML.studioFx = LogiXML.studioFx || {};

		var anchors = document.getElementsByTagName("A");
		for (var i = 0; i < anchors.length; i++) {
			var a = anchors[i];
			var href = a.getAttribute("href");
			var onclick = a.getAttribute("onclick");

			if (href === "javascript:void(0);" && onclick) {
				a.setAttribute("onclick", "return true;");

				var fx = (new Function(onclick)).bind(a);
				var fxName = "rdStudio" + LogiXML.getGuid().replace(/-/g, "");
				LogiXML.studioFx[fxName] = fx;

				a.setAttribute("href", "javascript:(function(){LogiXML.studioFx." + fxName + "();return;})();");
			}
		}

		LogiXML.Ajax.AjaxTarget().on('reinitialize', LogiXML.studioWizardFixup);
	}
};

document.addEventListener("DOMContentLoaded", function () {
	LogiXML.studioWizardFixup();
	LogiXML.DOMContentLoaded = true;
});