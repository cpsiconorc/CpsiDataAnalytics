//Define querySelectorAll if it's not defined (IE7)
if (!document.querySelectorAll) {
    (function (d, s) { d = document, s = d.createStyleSheet(); d.querySelectorAll = function (r, c, i, j, a) { a = d.all, c = [], r = r.split(','); for (i = r.length; i--;) { s.addRule(r[i], 'k:v'); for (j = a.length; j--;) a[j].currentStyle.k && c.push(a[j]); s.removeRule(0) } return c } })()
}

YUI.add('rd-embedded-plugin', function (Y) {
    //'use strict;

    //create namespaced plugin class
    Y.namespace('LogiXML').rdEmbedded = Y.Base.create("rdEmbedded", Y.Plugin.Base, [], {

        _handleLoad: null,
        _handleMessage: null,
        _frameId: null,

        //constructor
        initializer: function () {
            if (window.LogiXML === undefined) {
                window.LogiXML = {};
            }
            window.LogiXML.isRdEmbedded = true;
            /* Infogo always resizing. fix for 25633 */
            var infoGo = Y.one('link[href="_SupportFiles/InfoGo.GO.css"]');
            if (infoGo) {
                document.getElementsByTagName('html')[0].style.height = 'auto';
            }
            /* Infogo always resizing. fix for 25633 */
            this._handleLoad = this.get("host").on("load", function (e) {
                //var tgt = e.currentTarget;
                this._frameId = this.getUriParameter("rdframeid");
            }, this);
            this._handleMessage = this.get("host").on("message", function (e) {
                var origin = e._event.origin;
                var data = e._event.data;
                var message = null;

                var resetFrame = false;

                if (data != null && data.length > 0) {
                    message = Y.JSON.parse(e._event.data);
                }
                if (message == null || message.command == null) {
                    return;
                }
				if(this._frameId == null){
				    this._frameId = message.iframeId;

                    //23096 on load always remove any previously set width and make sure that it is set to the default 100%.
				    resetFrame = true;
				}
                var response = {
					id : message.id,
					iframeId : message.iframeId,
					command : message.command + "_response",
					prms : {}
				};
				var query, attributeName;
                switch (message.command) {
				case "rdGetWindowSize":
				    var body = Y.one("body");
				    if (Y.Lang.isNull(body)) {
				        body = Y.one(document.getElementsByTagName("body")[0]);
				    }
				    var docHeight = body.get('docHeight');
				    var docWidth = body.get('docWidth');
				    var winHeight = body.get('winHeight');
				    var winWidth = body.get('winWidth');
				    var region = body.get('region');

				    var height = 0;
				    if (document.querySelectorAll) {
				        var popupArray = document.querySelectorAll('[rdPopupPanel="True"]'); 
				        //Loop through and find the tallest popup (there can be more than one popup) 20343
				        //Popup height will either be in the modal in previous sibling of in the node itself
				        for (var i = 0; i < popupArray.length; i++) {

				            var node = Y.one(popupArray[i]);
				            if (node.getStyle('display') != "none") {
				                var popupHeight = node.get('offsetHeight');
				                if (parseInt(popupHeight, 10) > height) {
				                    height = parseInt(popupHeight, 10);
				                }
				                var popupOffsetTop = node.get('offsetTop');
				                if (parseInt(popupOffsetTop, 10) > 0) {
				                    height += parseInt(popupOffsetTop, 10);
				                }
				            }
				            node = node.previous();
				            if (node) {
				                if (node.getStyle('display') != "none") {
				                    var popupHeight = node.getStyle('height');
				                    if (parseInt(popupHeight, 10) > height) {
				                        height = parseInt(popupHeight, 10);
				                        //modal is same height as page,reduce the retreived height to avoid keep growing on every ping. RD19487
				                        if ( (node.get('id')) && (node.get('id').indexOf("_rdModalShade") > -1) ) {
				                            height = height - 10;
				                        }				                        
				                    }
				                }
				            }
				        }
				    }
					response.prms = { "resetFrame": resetFrame, "docHeight": docHeight, "docWidth": docWidth, "winHeight": winHeight, "winWidth": winWidth, "region": region, "modalHeight" : height };
					break;
	            case "rdExecEmbeddedFunction":
					var functionName = message.prms.functionName;
					var functionArgs = message.prms.functionArgs == null ? [] : message.prms.functionArgs;
					response.prms.execResult = this.executeFunctionByName(functionName, functionArgs);
					response.prms.callback = message.prms.callback == null ? null : message.prms.callback;
					break;
				case "rdGetElementAttribute":
					query = message.prms.query;
					attributeName = message.prms.attributeName;
					response.prms.execResult = this.getElementAttribute(query, attributeName);
					response.prms.callback = message.prms.callback == null ? null : message.prms.callback;
					break;
				case "rdSetElementAttribute":
					query = message.prms.query;
					attributeName = message.prms.attributeName;
					var attributeValue = message.prms.attributeValue;
					response.prms.execResult = this.setElementAttribute(query, attributeName, attributeValue);
					response.prms.callback = message.prms.callback == null ? null : message.prms.callback;
					break;
                }
                this.postMessage(response, e._event);
            }, this);

        },

        getUriParameter: function (name) {
			var prm = new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)').exec(location.search);
            if (prm != null) {
                return decodeURIComponent(prm[1]);
			}
        },

        postMessage: function (message, evt) {
            if (window.postMessage == null) {
                return false;
			}
            var sMessage = Y.JSON.stringify(message);
            evt.source.postMessage(sMessage, evt.origin!=="null"?evt.origin:"*");
            return true;
        },

        executeFunctionByName: function (functionName, args) {
            var namespaces = functionName.split(".");
            var func = namespaces.pop();
            var context = window;
			var i, arrLength = namespaces.length;
            for (i = 0; i < arrLength; i++) {
                context = context[namespaces[i]];
            }
            return context[func].apply(this, args);
        },

        getElementAttribute: function (query, attributeName) {
            var results = [];
            var queries = [];
            if (Y.Lang.isArray(query)) {
                queries = query;
            } else {
                queries.push(query);
            }
			var i, arrLength = queries.length;
            for (i = 0; i < arrLength; i++) {
                results.push(i);
                results[i] = {
					elements : [],
					values : []
				};
                var j = 0;
                Y.all(queries[i]).each(function (node) {
                    var nodeName = node.get('id') == null ? node.get('nodeName') + j : node.get('id');
                    results[i].elements.push(nodeName);
                    results[i].values.push(node.getAttribute(attributeName));
                    j++;
                });
            }
            if (results.length === 1) {
                return results[0];
            } else {
                return results;
            }
        },

        setElementAttribute: function (query, attributeName, attributeValue) {
            var queries = [];
            if (Y.Lang.isArray(query)) {
                queries = query;
            } else {
                queries.push(query);
            }
            var result = false;
			var i, arrLength = queries.length;
            for (i = 0; i < arrLength; i++) {
                Y.all(queries[i]).each(function (node) {
                    node.setAttribute(attributeName, attributeValue);
                    result = true;
                });
            }
            return result;
        },

        //clean up on destruction
        destructor: function () {
            this._handleLoad.detach();
            this._handleLoad = null;
            this._handleMessage.detach();
            this._handleMessage = null;
        }
    },
    {
		NAME: "RdEmbeddedPlugin",
        NS: "rdEmbeddedPlugin",
        ATTRS: {}
    });
}, "1.0.0", { requires: ["base", "plugin", "node", "json"] });

YUI().use("node", "rd-embedded-plugin", function (Y) {
    //'use strict;
    var wnd = Y.one(window);
    wnd.plug(Y.LogiXML.rdEmbedded);
});
