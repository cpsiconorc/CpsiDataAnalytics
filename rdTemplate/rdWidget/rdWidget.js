/*!
* $script.js Async loader & dependency manager
* https://github.com/ded/script.js
* (c) Dustin Diaz, Jacob Thornton 2011
* License: MIT
*
*
*
*
*Warning: this script is modified by vbalabanov appropriate to our products goals. Change it wisely.
*/
(function (name, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else this[name] = definition();
})('$script', function () {
  var doc = document
    , head = doc.getElementsByTagName('head')[0]
    , s = 'string'
    , f = false
    , push = 'push'
    , readyState = 'readyState'
    , onreadystatechange = 'onreadystatechange'
    , list = {}
    , ids = {}
    , delay = {}
    , scripts = {}
    , scriptpath;

    function every(ar, fn) {
    for (var i = 0, j = ar.length; i < j; ++i) if (!fn(ar[i])) return f;
        return 1;
    }
  function each(ar, fn) {
    every(ar, function (el) {
      return !fn(el);
    });
  }


  function $script(paths, idOrDone, optDone) {
    paths = paths[push] ? paths : [paths];
      var idOrDoneIsDone = idOrDone && idOrDone.call
      , done = idOrDoneIsDone ? idOrDone : optDone
      , id = idOrDoneIsDone ? paths.join('') : idOrDone
      , queue = paths.length;

      function loopFn(item) {
      return item.call ? item() : list[item];
      }
    function callback() {
      if (!--queue) {
        list[id] = 1;
          done && done();
          for (var dset in delay) {
          every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = []);
          }
      }
    }

      setTimeout(function() {
              
          create(paths, callback);
          }
      );
      return $script;
  }
  function create(paths, fn) {
      var el = doc.createElement('script'), loaded;
      var currentPath = paths[0];
    el.onload = el.onerror = el[onreadystatechange] = function () {
      
        fn();
        if (paths.length>1) {
            create(paths.slice(1), fn);
            el.onload = el[onreadystatechange] = null;
        }

    };
    el.src = currentPath;
      head.insertBefore(el, head.lastChild);
  }


  $script.get = create;
    $script.order = function (scripts, id, done) {
    (function callback(s) {
      s = scripts.shift();
        !scripts.length ? $script(s, id, done) : $script(s, callback);
    }());
    };
    $script.path = function (p) {
    scriptpath = p;
    };
    $script.ready = function (deps, ready, req) {
    deps = deps[push] ? deps : [deps];
        var missing = [];
    !each(deps, function (dep) {
      list[dep] || missing[push](dep);
    }) && every(deps, function (dep) {return list[dep]; }) ?
      ready() : !function (key) {
      delay[key] = delay[key] || [];
        delay[key][push](ready);
        req && req(missing);
    }(deps.join('|'));
        return $script;
    };
    $script.done = function (idOrDone) {
    $script([null], idOrDone);
    };
    return $script;
});

/* end of $script.js */

var rdAllWidgets;

function rdLogiWidget() {
	this.serverUrl = "";
	this.definition = "";
	//this.containerID = "";
	this.UID = Math.random() * 100000;
	this.parameters = new Array();

	//Get the server URL, in case the user doesn't set it.
	var cScripts = document.getElementsByTagName("SCRIPT");
    for (var i = 0; i < cScripts.length; i++) {
        if (cScripts[i].src) {
            if (cScripts[i].src.indexOf("rdWidget.js")!=-1) {
                this.serverUrl = cScripts[i].src.substr(0,cScripts[i].src.indexOf("/rdTemplate/rdWidget"));
                break;
            }
        }
    }

    //this.setParameter('rdWidgetUID',this.UID)

    //Add this widget to the collection.
    if (typeof rdAllWidgets=='undefined'){
        rdAllWidgets=new Array();
    }
    rdAllWidgets[rdAllWidgets.length] = this;
}

rdLogiWidget.yuiLoaded = false;

rdLogiWidget.prototype.load = function () {
	//does the page have a 'head' tag? - if not add it.
	if (document.getElementsByTagName("head").length < 1) {
		var eleHead = document.createElement('head');
		var eleBody = document.getElementsByTagName("body")[0];
		document.documentElement.insertBefore(eleHead,eleBody);
	}

    var sScriptSrc = this.serverUrl +  "/rdTemplate/rdWidget/rdWidget.aspx?";
    sScriptSrc += "&rdWidgetContainerId=" + encodeURIComponent(this.containerID);
    sScriptSrc += "&rdReport=" + encodeURIComponent(this.definition);
    sScriptSrc += "&rdServerUrl=" + encodeURIComponent(this.serverUrl);
    sScriptSrc += "&rdRnd=" + Math.floor(Math.random() * 100000);
    if (!rdLogiWidget.yuiLoaded) {
        rdLogiWidget.yuiLoaded = true;
    }
    else {
        sScriptSrc += "&skipYUI=True";
    }
    for (i=0; i < this.parameters.length; i++) {
        sScriptSrc += this.parameters[i];
    }

   oldScript = document.getElementById("rdWidget_" + this.containerID);
    if (oldScript) {
         //This is a reload, remove the original script element.
        oldScript.parentNode.removeChild(oldScript);
    }
	
    script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "rdWidget_" + this.containerID;
    script.src = sScriptSrc;

	document.getElementsByTagName("head")[0].appendChild(script);

};
rdLogiWidget.prototype.setParameter = function(sName,sValue) {
    //Add or update the parameters array.
    switch (sName) {
        case 'rdReport':
            this.definition = sValue;
            break;
        default:
            for (i=0; i < this.parameters.length; i++) {
                if(this.parameters[i].indexOf("&" + sName + "=") != -1){
                    this.parameters[i] = "&" + sName + "=" + encodeURIComponent(sValue); //replace
                    return;
                }
            }
            this.parameters[this.parameters.length] = "&" + sName + "=" + encodeURIComponent(sValue);
            break;
    }
};
rdLogiWidget.prototype.removeParameter = function(sName) {
    for (i=0; i < this.parameters.length; i++) {
        if(this.parameters[i].indexOf("&" + sName + "=") != -1){
            this.parameters[i] = "";
            return;
        }
    }
};

function rdLoadRemoteStyle(sUrl)
{
    var eleScript = document.createElement("LINK");
    eleScript.href = sUrl;
    eleScript.rel = "stylesheet";
    eleScript.type="text/css";
    document.getElementsByTagName("head")[0].appendChild(eleScript);
}


function rdSubmitWidgetSort(sWidgetContainerID, sPage) {
	rdSubmitWidget(sWidgetContainerID, sPage,'');
}

function rdSubmitWidget(sWidgetContainerID, sPage, sTarget, bValidate, sConfirm) {
		if (bValidate == "true") {
			var sErrorMsg = rdValidateForm();
		    if (sErrorMsg) {
				alert(sErrorMsg);
		        return;
		    }
		}
		if (sConfirm) {
			if (sConfirm.length != 0) {
				if (!confirm(sConfirm)) {
					return;
				}
			}
		}

	if (typeof rdSaveInputCookies != 'undefined'){rdSaveInputCookies();
	}

	//Build the request URL.
    var sFormParamNames = new Array(); //For refreshing Widgets.
    var sFormParamValues = new Array(); //For refreshing Widgets.
    var sLinkUrl = ""; //For outside links.
	var sPrevRadioId;
    for (var iForm=0; iForm < document.forms.length; iForm++){
	    var frm = document.forms[iForm];
        for (var i=0; i < frm.elements.length; i++) {
		    if (frm.elements[i].name.lastIndexOf("-PageNr") != -1) {
//			    if (frm.elements[i].name.lastIndexOf("-PageNr") == frm.elements[i].name.length-7) {
//				    continue  //Don't forward the interactive page nr.
//			    }
		    }

		    //Don't forward a variable that's already in the list, perhaps from LinkParams.
		    if (sLinkUrl.indexOf("&" + frm.elements[i].name + "=")!=-1) {continue;
		    }
		    //Don't forward .NET's ViewState element.
		    if (frm.elements[i].name=="__VIEWSTATE") {continue;
		    }

		    switch (frm.elements[i].type) {
			    case 'hidden':
			    case 'text':
			    case 'email':
			    case 'number':  
			    case 'tel':  
			    case 'textarea':
			    case 'password':
			    case 'select-one':
			    case 'file':
				    var sValue = rdGetFormFieldValue(frm.elements[i]);
			        sFormParamNames[sFormParamNames.length] = frm.elements[i].name;
			        sFormParamValues[sFormParamValues.length] = sValue;
			        sLinkUrl += '&' + frm.elements[i].name + "=" + encodeURI(sValue);
			        break;
			    case 'select-multiple':
				    var selectedItems = new Array();
				    for (var k = 0; k < frm.elements[i].length; k++) {
					    if (frm.elements[i].options[k].selected) {
						    selectedItems[selectedItems.length] = frm.elements[i].options[k].value;
					    }
				    }
				    var sValue = selectedItems.join(',');
			        sFormParamNames[sFormParamNames.length] = frm.elements[i].name;
			        sFormParamValues[sFormParamValues.length] = sValue;
			        sLinkUrl += '&' + frm.elements[i].name + "=" + encodeURI(sValue);
			        break;
			    case 'checkbox':
			        var sValue;
			        if (frm.elements[i].checked==true) {
					    sValue = rdGetFormFieldValue(frm.elements[i]);
			        } else {
					    sValue = '';
			        }
			        sFormParamNames[sFormParamNames.length] = frm.elements[i].name;
			        sFormParamValues[sFormParamValues.length] = sValue;
			        sLinkUrl += '&' + frm.elements[i].name + "=" + encodeURI(sValue);
			        break;
			    case 'radio':
				    var sRadioId = 'rdRadioButtonGroup' + frm.elements[i].name;
			        if (sPrevRadioId != sRadioId) {
					    sPrevRadioId = sRadioId;
			            var sValue = rdGetFormFieldValue(document.getElementById(sRadioId));
			            sFormParamNames[sFormParamNames.length] = frm.elements[i].name;
			            sFormParamValues[sFormParamValues.length] = sValue;
			            sLinkUrl += '&' + frm.elements[i].name + "=" + encodeURI(sValue);
			        }
				    break;
		    }
		}
	}

    //Find the current widget.
    for (var iWidget in rdAllWidgets) {
        if (rdAllWidgets[iWidget].containerID==sWidgetContainerID) {

             if (sTarget.length!=0 && sTarget!="_self") {
                //Not a link to refresh the Widget container.
                //sLinkUrl = rdAllWidgets[iWidget].serverUrl + "/" + sPage + sLinkUrl
                sLinkUrl = sPage + sLinkUrl;
                 NavigateLink2(sLinkUrl, sTarget, bValidate, sConfirm);
                 return;
             } else {

               //Reload/refresh the Widget.

                //Set form parameters.
                for (var i = 0; i < sFormParamNames.length; i++) {
                    rdAllWidgets[iWidget].setParameter(sFormParamNames[i],sFormParamValues[i]);
                }

                //Set Url parameters
                sPage = sPage.substring(sPage.indexOf("?") + 1); //sPage = sPage.replace("rdPage.aspx?","")
                sUrlParams = sPage.split("&");
                 for (var i = 0; i < sUrlParams.length; i++) {
                    var sParamPair = sUrlParams[i].split("=");
                     if (sParamPair.length > 1) {
                        rdAllWidgets[iWidget].setParameter(sParamPair[0],sParamPair[1]);
                     }
                }
                rdAllWidgets[iWidget].load();
                rdAllWidgets[iWidget].removeParameter('rdNewPageNr'); //Don't resend this parameter, will break table sorting.
            }
        }
    }
}

//Calling process definitions is currently unsupported.
//function rdSubmitWidgetRunProcess(sWidgetContainerID, sPage, sActionsXml, bValidate, sConfirm, sTarget) {
//    var sProcUrl = sPage
//    sProcUrl += "&rdProcessAction=" + sActionsXml
//    sProcUrl += "&rdRnd=" + Math.floor(Math.random() * 100000)
//    rdSubmitWidget(sWidgetContainerID, sProcUrl, sTarget, bValidate, sConfirm)
//}

function rdGetFormFieldValue(fld) {
	var sValue;
    if (fld.id.indexOf("rdRadioButtonGroup") == 0) {
		// Radio buttons
		sFieldId = fld.id.replace(/rdRadioButtonGroup/g, '');
        var cInputs = document.getElementsByTagName("INPUT");
        for (var i = 0; i < cInputs.length; i++) {
			if (cInputs[i].name == sFieldId) {
				if (cInputs[i].checked) {
					sValue = cInputs[i].value;
				    break;
				}
			}
		}
		if (sValue == undefined) {
				sValue = '';
		}
	} else {
		// All other fields
		if (fld.value.length == 0) {
			sValue = '';
		} else {
			sValue = fld.value;
		}
	}
	return sValue;
}
