function RunProcess(sActionsXml, bValidate, sConfirm, sTarget, waitCfg) {

	if (bValidate == "true") {
		var sErrorMsg = rdValidateForm()
		if (sErrorMsg) {
			alert(sErrorMsg)
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
		
	if (typeof rdSaveInputCookies != 'undefined'){rdSaveInputCookies()}
	if (typeof rdSaveInputsToLocalStorage != 'undefined'){rdSaveInputsToLocalStorage()}
	
	if (sTarget) {
        sOldTarget = document.rdForm.target;
        document.rdForm.target = sTarget;
	} else {
        document.rdForm.target = '_self';
	}

	//Add the actions to a new Hidden form field.  First, make sure that the hidden element doesn't already exist.  (Happens with Opera Back button.)
	var hiddenProcessAction=document.getElementById("rdProcessAction")
	if (hiddenProcessAction) { 
        hiddenProcessAction.parentNode.removeChild(hiddenProcessAction);//#4217
	}
	
    //Remove hidden forwarding elements that have other input elements.
	var eleInputs = document.getElementsByTagName("INPUT")
    var eleTextAreas = document.getElementsByTagName("TEXTAREA")
    for (var i=eleInputs.length-1; i > -1; i--) {
        var eleInput = eleInputs[i]
        if (eleInput.id=="rdHiddenRequestForwarding") {
            //Is there another input element with the same id?  (Can't use getElementById())
            for (var k=eleInputs.length-1; k > -1; k--) {
                if (k != i) {
                    if (eleInputs[k].name == eleInput.name && eleInput.parentNode) {
                        eleInput.parentNode.removeChild(eleInput)  //Remove the hidden forwarding element.
                        break
                    }
                }
            }
            if (eleInput.parentNode) {
                for (var k = eleTextAreas.length - 1; k > -1; k--) {
                    if (eleTextAreas[k].name == eleInput.name && eleInput.parentNode) {
                        eleInput.parentNode.removeChild(eleInput)  //Remove the hidden forwarding element.
                        break;
                    }
                }
            }
        }

        // checkbox unchecked value ...
        rdPrepCheckbox(eleInput, false);

        if ((eleInput.type == 'text')) {
            rdFixupInputs(eleInput);
        }
    }

    // Already removed this element if already existed prior, so no need to check for dupes
    hiddenProcessAction = document.createElement("INPUT");
    hiddenProcessAction.type = "HIDDEN";
    hiddenProcessAction.id = "rdProcessAction";
    hiddenProcessAction.name = "rdProcessAction";
    hiddenProcessAction.value = encodeURIComponent(sActionsXml);
	document.rdForm.appendChild(hiddenProcessAction);

    // Get or create rdRnd
    var hiddenRnd = document.getElementById("rdRnd");
    if (!hiddenRnd) {
        hiddenRnd = document.createElement("INPUT");
        hiddenRnd.type = "HIDDEN"
        hiddenRnd.id = "rdRnd"
        hiddenRnd.name = "rdRnd"
        document.rdForm.appendChild(hiddenRnd);
    }
    hiddenRnd.value = Math.floor(Math.random() * 100000);

    // Get or create rdScrollX
    var hiddenScrollX = document.getElementById("rdScrollX");
    if (!hiddenScrollX) {
        hiddenScrollX = document.createElement("INPUT");
        hiddenScrollX.type = "HIDDEN";
        hiddenScrollX.id = "rdScrollX";
        hiddenScrollX.name = "rdScrollX";
        document.rdForm.appendChild(hiddenScrollX);
    }
    hiddenScrollX.value = rdGetScroll('x');

    // Get or create rdScrollY
    var hiddenScrollY = document.getElementById("rdScrollY");
    if (!hiddenScrollY) {
        hiddenScrollY = document.createElement("INPUT");
        hiddenScrollY.type = "HIDDEN";
        hiddenScrollY.id = "rdScrollY";
        hiddenScrollY.name = "rdScrollY";
        document.rdForm.appendChild(hiddenScrollY);
    }
    hiddenScrollY.value = rdGetScroll('y');
			
	//document.rdForm.action="rdProcess.aspx?&rdRnd=" + Math.floor(Math.random() * 100000)
    var showPanelTimeout = 0;
    var selfTarget = LogiXML.isSelfTarget(sTarget);

    if (selfTarget && waitCfg && waitCfg.async) {
        var headers = [];

        headers.push({
            name: "X-Requested-With", value: "XMLHttpRequest"
        });

        if (waitCfg.syncServer) {
            // async on client side, sync on server side
            // pro: session variables can be set
            // con: only one request will run at a time
            document.rdForm.action = "rdProcess.aspx?";
        } else {
            // async on client side and server side
            // pro: multiple requests can run at a time
            // con: session variables are readonly
            document.rdForm.action = "rdProcessAsync.aspx?";
        }

        waitCfg.target = document.rdForm.target;

        var onSuccess, onFail;

        if (waitCfg.onSuccess) {
            onSuccess = function (xhr) {
                waitCfg.onSuccess.apply(this, arguments)
                rdProcessResponse(xhr, waitCfg, showPanelTimeout);
            };
        }
        else {
            onSuccess = function (xhr) {
                rdProcessResponse(xhr, waitCfg, showPanelTimeout);
            };
        }

        if (waitCfg.onFail) {
            onFail = function (xhr) {
                waitCfg.onFail.apply(this, arguments)
                rdProcessResponse(xhr, waitCfg, showPanelTimeout);
            };
        }
        else {
            onFail = function (xhr) {
                rdProcessResponse(xhr, waitCfg, showPanelTimeout);
            };
        }

        LogiXML.submitAsync(document.rdForm, onSuccess, onFail, headers);

        rdUnPrepCheckboxes();
    }
    else {
        document.rdForm.action = "rdProcess.aspx?"
        document.rdForm.submit();
    }

	document.rdForm.action= ""; //#4434
	
	//Show wait panel
    if (selfTarget && waitCfg != null && waitCfg.waitMessage !== false && LogiXML.WaitPanel.pageWaitPanel) {
		LogiXML.WaitPanel.pageWaitPanel.readyWait();
        showPanelTimeout = setTimeout(function () {
            LogiXML.WaitPanel.pageWaitPanel.showWaitPanel(waitCfg);
        }, 500);
	}
	
	if (sTarget) {
		document.rdForm.target = sOldTarget
    }
}

function rdProcessResponse(xhr, waitCfg, showPanelTimeout) {
    if (!xhr || !xhr.target) {
        if (showPanelTimeout)
            clearTimeout(showPanelTimeout);

        return;
    }

    if (xhr.target.responseXML && xhr.target.responseXML.documentElement) {
        var redirect = xhr.target.responseXML.documentElement.getAttribute("RedirectLocation");
        if (!redirect) {
            if (showPanelTimeout)
                clearTimeout(showPanelTimeout);

            return;
        }

        var sTarget = waitCfg ? waitCfg.target : null;

        if (showPanelTimeout && !LogiXML.isSelfTarget(sTarget)) {
            clearTimeout(showPanelTimeout);
            showPanelTimeout = null;

            if (LogiXML.WaitPanel.pageWaitPanel) {
                LogiXML.WaitPanel.pageWaitPanel.cancelWait();
                LogiXML.WaitPanel.pageWaitPanel.hideWaitPanel();
            }
        }

        var newWaitCfg = xhr.target.responseXML.documentElement.getAttribute("WaitConfig");
        if (newWaitCfg) {
            newWaitCfg = eval("(" + newWaitCfg + ")");
            if (newWaitCfg) {
                // don't replace an existing wait page with the global wait page
                if (!waitCfg || !newWaitCfg.isGlobal) {
                    if (showPanelTimeout) {
                        clearTimeout(showPanelTimeout);
                        showPanelTimeout = null;
                    }

                    waitCfg = newWaitCfg;
                }
            }
        }

        var form = document.createElement("FORM");
        document.body.appendChild(form);

        form.method = xhr.target.responseXML.documentElement.getAttribute("RedirectMethod");

        var i = redirect.indexOf("?");

        if (i > 0) {
            var parms = LogiXML.getUrlParameters(redirect);
            redirect = redirect.substr(0, i);

            // REPDEV-25072 rdReport, rdScrollX, and rdScrollY are needed in the target url as request parameters in the query string.
            // Javascript running on the target page expects these values to be retrievable from the url.
            // If other params are needed specifically in the url, add them to this array.
            // Params not contained in this array will be sent as form data.
            var parsedLaterFromUrl = ["rdReport", "rdScrollX", "rdScrollY"];

            for (i = 0; i < parms.length; i++) {
                var parm = parms[i];
                if (parsedLaterFromUrl.indexOf(parm.name) >= 0) {
                    if (redirect.indexOf("?") >= 0)
                        redirect += "&";
                    else
                        redirect += "?";

                    redirect += parm.name + "=" + encodeURIComponent(parm.value);
                }
                else {
                    var inp = document.createElement("INPUT");
                    inp.type = "hidden";
                    inp.name = parm.name;
                    inp.value = parm.value;
                    form.appendChild(inp);
                }
            }
        }

        SubmitForm(redirect, sTarget, null, null, null, waitCfg, form);

        form.parentNode.removeChild(form);

        return;
    }

    if (xhr.target.responseText && xhr.target.responseText.indexOf("<!DOCTYPE html") == 0) {
        var htmlObj = rdParseHtml(xhr.target.responseText);

        if (!htmlObj) {
            if (showPanelTimeout)
                clearTimeout(showPanelTimeout);

            return console.error(xhr.target.responseText);
        }

        if (htmlObj.debugUrl && htmlObj.debugUrl != document.body.getAttribute("rdDebugUrl")) {
            window.location.href = htmlObj.debugUrl;
            return;
        }

        var oldPage = {
            head: document.head.innerHTML,
            body: document.body.innerHTML,
            bodyattrs: []
        };

        for (i = 0; i < document.body.attributes.length; i++) {
            oldPage.bodyattrs.push({
                name: document.body.attributes[i].name,
                value: document.body.attributes[i].value
            });
        }

        history.pushState(oldPage, null);

        window.addEventListener('popstate', function (e) {
            if (!e || !e.state || !e.state.hasOwnProperty("head") || !e.state.hasOwnProperty("body") || !e.state.hasOwnProperty("bodyattrs"))
                return;

            rdLoadHtml(e.state);
        });

        rdLoadHtml(htmlObj);
    }

    if (showPanelTimeout)
        clearTimeout(showPanelTimeout);
}

function rdParseHtml(html) {
    var htmlLower = html.toLowerCase();

    var head = "";
    var body = "";
    var bodyattrs = [];

    var i = htmlLower.indexOf("<head");
    if (i < 0)
        return null;

    var headStart = htmlLower.indexOf(">", i) + 1;
    if (headStart < 0)
        return null

    i = htmlLower.indexOf("</head>", headStart);
    head = html.substr(headStart, i - headStart);

    i = htmlLower.indexOf("<body", i);
    if (i < 0)
        return null;

    var bodyStart = htmlLower.indexOf(">", i) + 1;
    if (bodyStart < 0)
        return null;

    var bodyAttrLength = bodyStart - i - 6;
    var sDebugUrl = null;
    if (bodyAttrLength > 1) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = "<div " + html.substr(i + 5, bodyAttrLength) + "></div>";
        tmp = tmp.childNodes[0];
        for (var j = 0; j < tmp.attributes.length; j++) {
            var attrObj = {
                name: tmp.attributes[j].name,
                value: tmp.attributes[j].value
            };

            if (attrObj.value && attrObj.name.toLowerCase() == "rddebugurl") {
                i = window.location.href.toLowerCase().indexOf("/rdpage.aspx");
                if (i >= 0) {
                    sDebugUrl = window.location.href.substr(0, i);

                    if (attrObj.value.indexOf("/") != 0)
                        sDebugUrl += "/";

                    sDebugUrl += attrObj.value;
                }
            }

            bodyattrs.push(attrObj);
        }
    }

    i = htmlLower.indexOf("</body>", bodyStart);
    body = html.substr(bodyStart, i - bodyStart);

    return {
        head: head,
        body: body,
        bodyattrs: bodyattrs,
        debugUrl: sDebugUrl
    };
}

function rdLoadHtml(htmlObj) {
    var head = htmlObj.head;
    var body = htmlObj.body;
    var bodyattrs = htmlObj.bodyattrs;

    document.head.innerHTML = head;

    while (document.body.attributes.length) {
        document.body.removeAttribute(document.body.attributes[0].name);
    }

    for (i = 0; i < bodyattrs.length; i++) {
        document.body.setAttribute(bodyattrs[i].name, bodyattrs[i].value);
    }

    document.body.innerHTML = body;

    if (LogiXML && LogiXML.fireEvent) {
        LogiXML.fireEvent(window.document, "DOMContentLoaded");
        LogiXML.fireEvent(window.document.body, "load");
    }
}

function rdUnPrepCheckboxes() {
    var inputs = document.getElementsByTagName("INPUT");
    for (var i = 0; i < inputs.length; i++) {
        rdPrepCheckbox(inputs[i], true);
    }
}

function rdPrepCheckbox(eleInput, restore) {
    if (eleInput.type.toLowerCase() != "checkbox")
        return;

    // checkbox unchecked value ...
    var uncheckedValue = eleInput.getAttribute("rdUncheckedValue");
    if (uncheckedValue && uncheckedValue != "rdNotSent") {
        // when unchecked the checkbox value will be handled by a hidden input with the same name
        // remove the name from the checkbox to avoid duplicate request variables
        // conversely when checked restore the checkbox name and remove the hidden input

        var hiddenID = eleInput.id + "_rdHandleUnchecked";
        var hiddenCBV = document.getElementById(hiddenID);

        if (eleInput.checked || restore) {
            // restore checkbox name and remove hidden input
            if (hiddenCBV) {
                eleInput.name = hiddenCBV.name;
                hiddenCBV.parentNode.removeChild(hiddenCBV);
            }
        } else {
            // remove checkbox name and set hidden input
            if (!hiddenCBV) {
                hiddenCBV = document.createElement("INPUT");
                hiddenCBV.type = "HIDDEN";
                hiddenCBV.id = hiddenID;
                hiddenCBV.value = uncheckedValue;

                // move name from checkbox to hidden input
                hiddenCBV.name = eleInput.name;
                eleInput.name = "";

                document.rdForm.appendChild(hiddenCBV);
            }
        }
    }
}
