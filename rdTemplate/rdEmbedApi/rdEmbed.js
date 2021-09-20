/* json2.js 
* 2008-01-17
* Public Domain
* No warranty expressed or implied. Use at your own risk.
* See http://www.JSON.org/js.html
*/
if (!this.JSON) {
    JSON = function () {
        function f(n) { return n < 10 ? '0' + n : n; }
        Date.prototype.toJSON = function () {
            return this.getUTCFullYear() + '-' +
f(this.getUTCMonth() + 1) + '-' +
f(this.getUTCDate()) + 'T' +
f(this.getUTCHours()) + ':' +
f(this.getUTCMinutes()) + ':' +
f(this.getUTCSeconds()) + 'Z';
        }; var m = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\' }; function stringify(value, whitelist) {
            var a, i, k, l, r = /["\\\x00-\x1f\x7f-\x9f]/g, v; switch (typeof value) {
                case 'string': return r.test(value) ? '"' + value.replace(r, function (a) {
                    var c = m[a]; if (c) { return c; }
                    c = a.charCodeAt(); return '\\u00' + Math.floor(c / 16).toString(16) +
(c % 16).toString(16);
                }) + '"' : '"' + value + '"'; case 'number': return isFinite(value) ? String(value) : 'null'; case 'boolean': case 'null': return String(value); case 'object': if (!value) { return 'null'; }
                    if (typeof value.toJSON === 'function') { return stringify(value.toJSON()); }
                    a = []; if (typeof value.length === 'number' && !(value.propertyIsEnumerable('length'))) {
                        l = value.length; for (i = 0; i < l; i += 1) { a.push(stringify(value[i], whitelist) || 'null'); }
                        return '[' + a.join(',') + ']';
                    }
                    if (whitelist) { l = whitelist.length; for (i = 0; i < l; i += 1) { k = whitelist[i]; if (typeof k === 'string') { v = stringify(value[k], whitelist); if (v) { a.push(stringify(k) + ':' + v); } } } } else { for (k in value) { if (typeof k === 'string') { v = stringify(value[k], whitelist); if (v) { a.push(stringify(k) + ':' + v); } } } }
                    return '{' + a.join(',') + '}';
            } 
        }
        return { stringify: stringify, parse: function (text, filter) {
            var j; function walk(k, v) {
                var i, n; if (v && typeof v === 'object') { for (i in v) { if (Object.prototype.hasOwnProperty.apply(v, [i])) { n = walk(i, v[i]); if (n !== undefined) { v[i] = n; } } } }
                return filter(k, v);
            }
            if (/^[\],:{}\s]*$/.test(text.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) { j = eval('(' + text + ')'); return typeof filter === 'function' ? walk('', j) : j; }
            throw new SyntaxError('parseJSON');
        } 
        };
    } ();
}

if (!Array.indexOf) {
  Array.prototype.indexOf = function (obj, start) {
    for (var i = (start || 0); i < this.length; i++) {
      if (this[i] == obj) {
        return i;
      }
    }
    return -1;
  }
}

var EmbeddedReport = function (container, options) {
    'use strict';
    if (container == null) {
        return;
    }
    this.container = container;
    this.containerId = container.getAttribute("id");
    this.guid = EmbeddedReporting.getGuid();
    this.container.setAttribute('data-rdguid', this.guid);
    this.iframeId = "rdFrame" + this.guid;
    this.iframe = null;

    if (options == null) {
        options = this.parseContainerParams();
    }    
    this.applicationUrl = options.applicationUrl == null ? null : options.applicationUrl;
    this.report = options.report == null ? null : options.report;
    this.secureKey = options.secureKey == null ? null : options.secureKey;
    this.autoSizing = options.autoSizing == null ? 'none' : options.autoSizing.toLowerCase();
    this.linkParams = options.linkParams == null ? {} : options.linkParams;
    this.requestMethod = options.requestMethod == null ? 'post' : options.requestMethod;
    this.heightOffsetPadding = options.heightOffset == null ? 20 : parseInt(options.heightOffset);
    this.widthOffsetPadding = options.widthOffset == null ? 20 : parseInt(options.widthOffset);
    this.heightOffset = null;  
    this.widthOffset = null;
	//if(EmbeddedReporting.pingIsEstablished) {
	//	this.show();
	//}
};
EmbeddedReport.prototype.parseContainerParams = function () {
	//'use strict;
    var options = {
		applicationUrl : this.container.getAttribute('data-applicationUrl'),
		report : this.container.getAttribute('data-report'),
		secureKey : this.container.getAttribute('data-secureKey'),
		autoSizing: this.container.getAttribute('data-autoSizing'),
		linkParams: this.parseInitParams(),
		requestMethod: this.container.getAttribute('data-requestMethod'),
		widthOffset: this.container.getAttribute('data-widthOffset'),
		heightOffset: this.container.getAttribute('data-heightOffset')
    };
	options.autoSizing = options.autoSizing == null ? 'none' : options.autoSizing.toLowerCase();
    return options;
};
EmbeddedReport.prototype.show = function () {
	//'use strict;
	if(this.applicationUrl == null) {
		throw ("Application URL is not specified.");
	}
	if(this.report == null) {
		throw ("Report name is not specified.");
	}
    if (this.iframe != null) {
        return;
    }
    this.genFrame();
};
EmbeddedReport.prototype.hide = function () {
	//'use strict;
    if (this.iframe == null) {
        return;
    }
    if (this.resizeInterval !== undefined && this.resizeInterval != null) {
        clearInterval(this.resizeInterval);
        this.resizeInterval = null;
    }
    this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
};
EmbeddedReport.prototype.loadReport = function () {
    //'use strict;
    this.hide();
    this.show();
};
EmbeddedReport.prototype.parseInitParams = function () {
    //'use strict;
    var linkParams = null;
    var initParams = this.container.getAttribute('data-linkParams');
    if (initParams != null && typeof initParams == 'string' && initParams.length > 0) {
        try {
            linkParams = JSON.parse(initParams.replace(/'/gi, "\""), null, 2);
        }
        catch (e) {
            linkParams = {};
        }
    }
    return linkParams;
};

EmbeddedReport.prototype.genFrame = function () {
    //'use strict;

    //Determine height.
    var height = "";
    if (this.autoSizing == "none") {
        height = this.container.style.height;
        //clientHeight? padding / border will be not calculated 
        if (height == "") {
            height = this.container.clientHeight.toString() + "px";
        }
    }

    //Make the iframe.
    var sFrameDef = "<iframe id=\"" + this.iframeId + "\" width=\"100%\" frameborder=\"0\" ";
    if (height != null && height.length > 0) {
        sFrameDef += " height=\"" + height + "\" ";
    }
    sFrameDef += " onload=\"EmbeddedReporting.get('" + this.containerId + "').frameLoaded();\" ";
    //19372
    //sFrameDef += " sandbox=\"allow-forms allow-same-origin allow-scripts\" ";
    sFrameDef += "></iframe>";
    this.container.innerHTML = sFrameDef;
    this.iframe = document.getElementById(this.iframeId);

    //Write a basic document into the IFrame.
    var docFrame = this.iframe.contentDocument || this.iframe.contentWindow.document;
    docFrame.write("<html><body></body></html>")

    //Make a form that will POST the request parameters for the iframe.
    var sAction = this.applicationUrl + (this.applicationUrl.substr(-1) === "/" ? "" : "/");
    sAction += "rdPage.aspx?";
    sAction += "&rdframeid=" + this.iframeId;

    var frmPost = docFrame.createElement("form");
    frmPost.id = "rdEmbeddedPost"
    frmPost.method = this.requestMethod;
    frmPost.action = sAction

    var hiddenParam = docFrame.createElement("INPUT")
    hiddenParam.type = "HIDDEN";
    hiddenParam.name = "rdReport";
    hiddenParam.value = this.report;
    frmPost.appendChild(hiddenParam);

    hiddenParam = docFrame.createElement("INPUT")
    hiddenParam.type = "HIDDEN";
    hiddenParam.name = "rdembedded";
    hiddenParam.value = "true";
    frmPost.appendChild(hiddenParam);

    if (this.secureKey != null && this.secureKey.length > 0) {
        hiddenParam = docFrame.createElement("INPUT");
        hiddenParam.type = "HIDDEN";
        hiddenParam.name = "rdSecureKey";
        hiddenParam.value = this.secureKey;
        frmPost.appendChild(hiddenParam);
        //24845
        if (this.requestMethod == "post") {
            frmPost.action = frmPost.action + "&rdSecureKey=" + this.secureKey;
        }
    }

    //Add the LinkParams into hidden form vars.
    if (this.linkParams != null) {
        //19609
        for (var name in this.linkParams) {
            if (this.linkParams.hasOwnProperty(name) && this.linkParams[name] != null) {
				//24657
				if (name == "rdShowWait") { 
				    frmPost.action = frmPost.action + "&rdShowWait=" + this.linkParams[name];
				} else {
					var hiddenLinkParam = docFrame.createElement("INPUT");
					hiddenLinkParam.type = "HIDDEN";
					hiddenLinkParam.name = name;
					hiddenLinkParam.value = this.linkParams[name];
					frmPost.appendChild(hiddenLinkParam);
				}                
            }			
        }
    }

    //Add the completed form the the <body>.
    docFrame.body.appendChild(frmPost);

    //Submit the form by adding script.
    var eleScript = docFrame.createElement("script");
    eleScript.text = "document.getElementById('rdEmbeddedPost').submit()";
    docFrame.body.appendChild(eleScript);


};

EmbeddedReport.prototype.processMessage = function (evt) {
	//'use strict;
	if (evt == null || evt.data == null) {
        return;
	}
	var message =null;
    try {
        message = JSON.parse(evt.data, null, 2);
    } catch (e) {
    }
    if (message == null || message.command == null) {
        return;
	}
    if (this.iframeId == null || message.iframeId !== this.iframeId) {
        return;
    }

    //23096
    if (message.prms != null && message.prms.resetFrame) {
        this.iframe.setAttribute("width", "100%");
    }

    var callback, args;
    switch (message.command) {
        case "rdGetWindowSize_response":
		if (this.heightOffset == null) {
		    var heightOffset = message.prms.docHeight - message.prms.region.height;
		    this.heightOffset = heightOffset > 0 ? heightOffset + this.heightOffsetPadding : this.heightOffsetPadding;
		}
		if (this.widthOffset == null) {
			var widthOffset = message.prms.docWidth - message.prms.region.width;
		    this.widthOffset = widthOffset > 0 ? widthOffset + this.widthOffsetPadding : this.widthOffsetPadding;
		}

		if (this.autoSizing === "all" || this.autoSizing === "width") {
			if (message.prms.docWidth !== message.prms.winWidth) {
				this.iframe.setAttribute("width", message.prms.docWidth + "px");
			} else if (message.prms.docWidth > (message.prms.region.width + this.widthOffset)) {
				this.iframe.setAttribute("width",(message.prms.region.width + this.widthOffset) + "px");
			}
		}

		if (this.autoSizing === "all" || this.autoSizing === "height") {
		    if (message.prms.docHeight !== message.prms.winHeight && message.prms.docHeight !== (message.prms.winHeight + 1) && (message.prms.docHeight + 1) !== message.prms.winHeight) {
				this.iframe.setAttribute("height", message.prms.docHeight + "px");
			}
		    else if (message.prms.region && (message.prms.docHeight > (message.prms.region.height + this.heightOffset) || message.prms.modalHeight > 0)) {

		        if (message.prms.modalHeight > (message.prms.region.height + this.heightOffset)) { //20343 Modal heights are not included in body height, so must be considered after the fact
		            if (message.prms.modalHeight > message.prms.docHeight)
		                this.iframe.setAttribute("height", (message.prms.modalHeight) + "px");
		        }
		        else
		            this.iframe.setAttribute("height", (message.prms.region.height + this.heightOffset) + "px");

		    }
		    else //25717,25682 - chrome specific. for scrollbars.
		        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 )
		            this.iframe.setAttribute("height", (message.prms.region.height + this.heightOffset) + "px");		        
		}
		break;
    case "rdExecEmbeddedFunction_response":
		if (message.prms != null && message.prms.execResult != null) {
			callback = message.prms.callback;
			args = [];
			args.push(message.prms.execResult);
			if (callback != null) {
				this.executeFunctionByName(callback, args);
			}
		}
		break;
	case "rdGetElementAttribute_response":
		if (message.prms != null && message.prms.execResult != null) {
			callback = message.prms.callback;
			args = [];
			args.push(message.prms.execResult);
			if (callback != null) {
				this.executeFunctionByName(callback, args);
			}
		}
		break;
	case "rdSetElementAttribute_response":
		if (message.prms != null && message.prms.execResult != null) {
			callback = message.prms.callback;
			args = [];
			args.push(message.prms.execResult);
			if (callback != null) {
				this.executeFunctionByName(callback, args);
			}
		}
		break;
    }
};

EmbeddedReport.prototype.setParam = function (name, value) {
	//'use strict;
    this.linkParams[name] = value;
};

EmbeddedReport.prototype.getParam = function (name) {
	//'use strict;
    return this.linkParams[name];
};

EmbeddedReport.prototype.removeParam = function (name) {
	//'use strict;
    if (this.linkParams.hasOwnProperty(name)) {
        delete this.linkParams[name];
    }
};

EmbeddedReport.prototype.removeAllParams = function () {
	//'use strict;
    this.linkParams = {};
};

EmbeddedReport.prototype.execEmbeddedFunction = function (functionName) {
	//'use strict;
    if (arguments.length === 0) {
        return false;
    }
    var prms = {};
    prms.functionName = functionName;
    if (arguments.length > 1) {
        prms.callback = arguments[arguments.length - 1];
    }
    prms.functionArgs = [];
    if (arguments.length > 2) {
		var i, arrLength = arguments.length - 1;
        for (i = 1; i < arrLength; i++) {
            prms.functionArgs.push(arguments[i]);
        }
    }
    this.postMessage("rdExecEmbeddedFunction", prms);
};

EmbeddedReport.prototype.getElementAttribute = function (elementName, attributeName, callback) {
	//'use strict;
    var prms = {};
    prms.query = elementName;
    prms.attributeName = attributeName;
    prms.callback = callback;
    this.postMessage("rdGetElementAttribute", prms);
};

EmbeddedReport.prototype.setElementAttribute = function (elementName, attributeName, attributeValue, callback) {
	//'use strict;
    var prms = {};
    prms.query = elementName;
    prms.attributeName = attributeName;
    prms.attributeValue = attributeValue;
    prms.callback = callback;
    this.postMessage("rdSetElementAttribute", prms);
};

EmbeddedReport.prototype.frameLoaded = function () {
    //'use strict;
    if (this.iframe && this.iframe.contentWindow != null) {
        EmbeddedReporting.frameLoaded(this.guid);
        if (this.autoSizing !== undefined && this.autoSizing !== "none") {
            this.postMessage("rdGetWindowSize", []);
            //20343
            this.resizeInterval = setInterval("EmbeddedReporting.get('" + this.containerId + "').postMessage('rdGetWindowSize', []);", 500);
        }
    }
};

EmbeddedReport.prototype.getOuterHtml = function (node) {
	//'use strict;
    var wrap = document.createElement('div');
    wrap.appendChild(node.cloneNode(true));
    var outerHtml = wrap.innerHTML;
    return outerHtml;
};

EmbeddedReport.prototype.executeFunctionByName = function (functionName, args) {
	//'use strict;
    //var args = Array.prototype.slice.call(arguments).splice(1);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    var context = window;
	var i, arrLength = namespaces.length;
    for (i = 0; i < arrLength; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(this, args);
};

EmbeddedReport.prototype.postMessage = function (commandName, prms) {
	//'use strict;
    var message = {};
    message.id = EmbeddedReporting.getGuid();
    message.iframeId = this.iframeId;
    message.command = commandName;
    message.prms = prms;
    var sMessage = JSON.stringify(message, null, 2);
    if (this.iframe.contentWindow && this.iframe.contentWindow.postMessage !== undefined) {
        this.iframe.contentWindow.postMessage(sMessage, this.applicationUrl);
        return message.id;
    }
    return false;
};

/*------------------------------------------------*/

var EmbeddedReporting = {
    reports: [],
    pingUrlParent: "",
    pingUrlEmbedded: "",
    pingIntervalHandle: null,
    pingIsEstablished: false,
    queue: [],
    firstFrameWasLoaded: false,

    rdGetDomElement: function (element) {
        //'use strict;
        if (typeof element == 'string') {
            element = document.getElementById(element);
        }
        if (element == null || element.getAttribute == undefined) {
            return null;
        }
        return element;
    },
    get: function (container) {
        //'use strict;
        container = this.rdGetDomElement(container);
        if (container == null) {
            return null;
        }
        var reportGuid = container.getAttribute('data-rdguid');
        if (reportGuid == null) {
            return null;
        }
        return this.reports[reportGuid];
    },
    create: function (container, options) {
        //'use strict;
        var report = this.get(container);
        if (report != null) {
            return report;
        }
        container = this.rdGetDomElement(container);
        if (container == null) {
            return null;
        }
        if (options == null) {
            report = new EmbeddedReport(container);
        } else {
            report = new EmbeddedReport(container, options);
        }
        this.reports.push(report.guid);
        this.reports[report.guid] = report;
        this.queue.push(report.guid);
        if (this.firstFrameWasLoaded === true) {
            report.show();
        }
        else if (this.queue.length == 1) {
            this.processQueue();
        }
        return report;
    },
    frameLoaded: function (reportGuid) {
        this.firstFrameWasLoaded = true;
        if (this.queue.length > 0 && this.queue[0] == reportGuid) {
            this.queue.shift();
        }
        this.processQueue();
    },
    processQueue: function () {
        if (this.firstFrameWasLoaded === true) {
            var i = 0,
                length = this.queue.length,
                report = null;
            for (; i < length; i++) {
                var report = this.reports[this.queue[i]];
                report.show();
            }
            this.queue = [];
        }
        else if (this.queue.length > 0) {
            var report = this.reports[this.queue[0]];
            report.show();
        }
    },
    remove: function (container) {
        //'use strict;
        var report = this.get(container);
        if (report == null) {
            return false;
        }
        report.hide();
        var idx = this.reports.indexOf(report.guid);
        if (idx != -1) {
            this.reports.splice(idx, 1);
            delete this.reports[report.guid];
        }
        return true;
    },
    transferMessage: function (evt) {
        //'use strict;
        var i, arrLength = EmbeddedReporting.reports.length;
        for (i = 0; i < arrLength; i++) {
            EmbeddedReporting.reports[EmbeddedReporting.reports[i]].processMessage(evt);
        }
    },
    init: function () {
        //'use strict;
		if (window.addEventListener) {
			window.addEventListener("message", EmbeddedReporting.transferMessage, false);
		} else {
			window.attachEvent("onmessage", EmbeddedReporting.transferMessage);
        }
        var elements = document.getElementsByTagName('div');
        var i, arrLength = elements.length, container;
        for (i = 0; i < arrLength; i++) {
            container = elements[i];
            if (container != null && container.getAttribute('data-applicationUrl') != null) {
                this.create(container);
            }
        }
    },
    ajaxPing: function (url, callback) {
        //'use strict;
        try {
            var req;
            if (window.XMLHttpRequest) {
                req = new XMLHttpRequest();
                req.open("GET", url, true);
                req.send(null);
            } else if (window.ActiveXObject) {
                req = new ActiveXObject("Microsoft.XMLHTTP");
                if (req) {
                    req.open("GET", url, true);
                    req.send("nocache");
                }
            }
			if(callback) {
				req.onreadystatechange=function()
				{
				   if (req.readyState==4 && req.status==200)
					{
					    callback();
					}
				}
			}
        } catch (e) {
        }
    },
    keepSessionsAlive: function (pingUrl, timeout) {
        if (timeout == null) {
            timeout = 60000; //1 minute
        }
        if (pingUrl == null || typeof pingUrl != 'string' || pingUrl.length == 0) {
            throw "\"pingUrl\" argument is not valid.";
        }
        this.pingUrlParent = pingUrl;
        if (this.pingIntervalHandle != null) {
            clearInterval(this.pingIntervalHandle);
            this.pingIntervalHandle = null;
        }
        if (this.reports.length > 0 && !this.pingUrlEmbedded) {
            var report = this.reports[this.reports[0]];
            this.pingUrlEmbedded = this.getInfoPingUrl(report.applicationUrl);
        }
        this.pingIntervalHandle = setInterval("EmbeddedReporting.ping();", timeout);
    },
	getInfoPingUrl: function(appUrl){
	    return appUrl + (appUrl.substr(-1) === "/" ? "" : "/") + "rdPage.aspx?rdReport=rdPingEmbedded&pingsession=true"
	},
    ping: function () {
        EmbeddedReporting.ajaxPing(EmbeddedReporting.pingUrlParent + "?guid=" + EmbeddedReporting.getGuid());
        EmbeddedReporting.ajaxPing(EmbeddedReporting.pingUrlEmbedded + "&guid=" + EmbeddedReporting.getGuid());
    },
    getGuid: function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
};

EmbeddedReporting.init();


