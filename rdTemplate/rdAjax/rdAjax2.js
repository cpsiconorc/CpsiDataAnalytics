var req;

var sCurrentRequestParams = ""
var bSubmitFormAfterAjax = false
//20295
var sPrevRadioId

function rdAjaxRequest(commandParams, bValidate, sConfirm, bProcess, fnCallback, waitCfg, isUpload) {
	if (commandParams.search("rdRequestForwarding=Form") != -1) {
	    rdAjaxRequestWithFormVars(commandParams, bValidate, sConfirm, false, bProcess, fnCallback, waitCfg);
		return;
	}
	
	if (commandParams.search("rdCSRFKey") == -1 && document.getElementById('rdCSRFKey1') && document.getElementById('rdCSRFKey1').value) { // check for rdCSRFKey on every ajax request - 24188 
		commandParams = commandParams + '&rdCSRFKey=' + document.getElementById('rdCSRFKey1').value;
	}
	
	if(commandParams.indexOf('rdDataTablePaging') != -1){  //Ajax Paging. 20543
	    var aCommandParams = commandParams.split('&');
	    var sDataTableId='';
	    var sDivPagingWait = 'divPagingWait_';  //#18021.
	    for (i = 0; i < aCommandParams.length; i++) {
	        if (aCommandParams[i].indexOf('rdNewPageNr=True2') > -1) {
	            sDivPagingWait = 'divPagingWait2_'
	        }
	        if(aCommandParams[i].indexOf('rdRefreshElementID') > -1){
	            sDataTableId = aCommandParams[i].replace('rdRefreshElementID=', '');
	            sDivPagingWait += sDataTableId;
	            break;
	        }
	    }
	    if(!Y.Lang.isNull(Y.one('#'+ sDivPagingWait))){ //#18271.
	        Y.one('#'+ sDivPagingWait).show();  //#18080.
	    }
	}

	if (bValidate) {
		if (bValidate.length != 0) {
	        if (bValidate == "true") {
		        var sErrorMsg = rdValidateForm()
		        if (sErrorMsg) {
		            alert(sErrorMsg); //19817
		            return;
		        }
            }
        }
	}

   if (sConfirm) {
		if (sConfirm.length != 0) {
			if (!confirm(sConfirm)) {
				return;
			}
		}
   }

    try { //25197: ChartCanvas: WaitPage Not Showing with RefreshElement'RD20504 - set waitpage after validate and confirm.
        if (commandURL.indexOf("RefreshElement") > -1 && commandURL.indexOf("rdReportAuthorAction") < 0) {
            for (var k = 0; k < Highcharts.charts.length; k++) {
                var chart = Highcharts.charts[k];
                if (chart != null) {
                    var _node = chart.renderTo;
                    var _yNode = Y.one(_node);
                    var startIndex = commandURL.indexOf("rdRefreshElementID");
                    var endIndex;
                    if (startIndex != -1) {
                        startIndex += 19;
                        endIndex = commandURL.indexOf("&", startIndex);
                        var id = commandURL.substring(startIndex, endIndex);
                        var _ancestors = _yNode.ancestors("#" + id);
                        if (_ancestors != null && _ancestors.getDOMNodes().length) {
                            chart.showLoading('<img src="rdTemplate/rdWait.gif" alt="loading..."></img>');
                        }
                    }

                }
            }

        }
    } catch (e) {

    }
	
	var sUrl = "rdTemplate/rdAjax/rdAjax.aspx";
	if (window.location.href.indexOf("rdWidget") > -1) {
        if (window.location.href.indexOf("/rdTemplate")>-1) {
            sUrl = window.location.href.substring(0, window.location.href.indexOf("/rdTemplate")+1) + sUrl;
        } else {
            sUrl = "../../" + sUrl;
        }
	}
   
    if (bProcess) {
        if (bProcess === true || (bProcess == "true")) {
            if (waitCfg && waitCfg.async)
                sUrl = "rdProcessAsync.aspx";
            else
                sUrl = "rdProcess.aspx";
        }
    }
   
    if (sCurrentRequestParams.length > 0) {
        // We're still processing a request...
        if (sCurrentRequestParams == commandParams) {
            // ... the same request
            var rdCancelPreviousPagingRequests = LogiXML.getUrlParameter(commandParams, "rdCancelPreviousPagingRequests");

            if (rdCancelPreviousPagingRequests)
                return; // absorb extra clicks on links like "Next Page""

            var rdRET = LogiXML.getUrlParameter(commandParams, "rdRET");

            if (rdRET == "True")
                return; // no need to resend.
        }

        // 21216
        setTimeout(function () {
            rdAjaxRequest(commandParams, bValidate, null, bProcess, fnCallback, waitCfg, isUpload)
        }, Math.floor(Math.random() * 1000));  //Wait a random amount of time between 0 and 1 second.

        return;    
    }

    // If we are refreshing a Dashboard, call rdRefreshDashboard instead, after all other elements are refreshed
    if (LogiXML && LogiXML.Dashboard && LogiXML.Dashboard.pageDashboard) {
        var interceptObj = rdDashboardInterceptRefresh(commandParams, fnCallback);
        if (interceptObj) {
            if (!interceptObj.commandParams)
                return;

            commandParams = interceptObj.commandParams;
            fnCallback = interceptObj.fnCallback;
        }
    }

    sCurrentRequestParams = commandParams;
    rdShowAjaxFeedback(true,commandParams);
	
    //Show ajax wait panel
    var tTimeout;
    if (waitCfg != null) {
        //25599
        if (Y.Cookie && Y.Cookie.exists('rdFileDownloadComplete')) {
            Y.Cookie.remove('rdFileDownloadComplete', { path: '/' });
        }
        //22236
        if (Y.Lang.isValue(LogiXML.WaitPanel.pageWaitPanel)) {
            LogiXML.WaitPanel.pageWaitPanel.readyWait();
            tTimeout = new Timeout(function () { LogiXML.WaitPanel.pageWaitPanel.showWaitPanel(waitCfg) }, 500);
        }
	}

    var wrappedSuccess;
    if (Y.Lang.isFunction(fnCallback)) {
        wrappedSuccess = Y.rbind( handleSuccess, window, fnCallback );
    }
    else {
        wrappedSuccess = handleSuccess;
    }

    //Special for MetadataBuilder
    if (commandParams.indexOf("rdTemplate/rdMetadata/rdUiService.aspx?") == 0) {
        sUrl = commandParams.substring(0, commandParams.indexOf("?"))
        commandParams = commandParams.substring(commandParams.indexOf("?") + 1)
    }

    try {
	    /* Configuration object for POST transaction */
        var skipPageLoadScripts = commandParams.indexOf("rdSkipPageLoadScripts=True") >= 0;

		var cfg = {
			method: "POST",
			data: commandParams,			
			on: {
			    success: wrappedSuccess,
			    failure: handleFailure
			},
			arguments: {
                timeoutID: tTimeout,
                skipPageLoadScripts: skipPageLoadScripts
			}
		};
		if (isUpload) {
		    cfg = {
		        method: "POST",
		        data: commandParams,
		        form: {
		            id: document.rdForm,
		            upload: true
		        },
		        on: {

		            complete: wrappedSuccess,
		            failure: handleFailure
		        },
		        arguments: {
                    timeoutID: tTimeout,
                    skipPageLoadScripts: skipPageLoadScripts
		        }
		    };
	    }
	    req = Y.io(sUrl, cfg);
	}
	catch (e) {
	    commandParams = commandParams.replace('rdAjaxCommand', 'rdAjaxAbort')
	    if (Y.Lang.isValue(tTimeout)) {
	        tTimeout.clear();
	    }
		window.open(sUrl + "?" + commandParams,'_self')
	}
}

var handleSuccess = function(id, o, args){
    if(o.responseText !== undefined) {
        rdUpdatePage(o.responseXML, o.responseText, args.skipPageLoadScripts);
            var fnCallback = arguments[arguments.length - 1];
            if ( typeof fnCallback === 'function' ) {
                fnCallback(o);
            }
    }
    if (Y.Lang.isValue(args.timeoutID)) {
        args.timeoutID.clear();
    }
};

var handleFailure = function (id, o, args) {
    if (o.responseText != undefined) {
        if (o.responseText.length > 0) {  //18557
		document.write(o.responseText); //9390
	}
    } //Otherwise, the user likely left this page.15770
    if (Y.Lang.isValue(args.timeoutID)) {
        args.timeoutID.clear();
    }
}

var bCurrentIFrameResized = false;
function rdResizeCurrentIFrame(optionalParam) {
    //More special IFrame handling.  If this page is in a frame,
    //the frame needs to be resized from the parent window.
    try {
        if (frameElement && frameElement.contentWindow && parent && parent.iframeResize) {
            try {

                if (!detectIE()) {
                    if (optionalParam)
                        parent.iframeResize(frameElement, optionalParam)  //#12347.
                    else
                        parent.iframeResize(frameElement)
                } else {
                    if (window.iframeResizeId)
                        window.clearTimeout(window.iframeResizeId);

                    window.iframeResizeId = window.setTimeout(resizeCurrentIframe.bind({ optionalParam: optionalParam }), 500);                    
                }
            }
            catch (e) { }
        }    
    }
    catch (e) { }    
    bCurrentIFrameResized = true;
}

function resizeCurrentIframe() {
    if (this.optionalParam)
        parent.iframeResize(frameElement, this.optionalParam)  //#12347.
    else
        parent.iframeResize(frameElement)
}

function detectIE() {
    var sAgent = window.navigator.userAgent;
    var id = sAgent.indexOf("MSIE");

    if (id > 0)
        return true;
    else if (!!navigator.userAgent.match(/Trident\/7\./))
        return true;
    else
        return false;
}

//21896 & 22052 - Refresh with wait panel hangs forever
//Wrapped refresh and call the clear() on handleSuccess and handleFailure in order to clear it.
function Timeout(fn, nInterval) {
    var sTimeoutID = setTimeout(fn, nInterval);
    this.cleared = false;
    this.clear = function () {
        this.cleared = true;
        window.clearTimeout(sTimeoutID);
    };
}

function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function rdAjaxRequestWithFormVars(commandURL, bValidate, sConfirm, bFromOnClick, bProcess, fnCallback, waitCfg, copyQueryString) {
    //Build the request URL.
    if (commandURL.indexOf("RequestRealTimeAnimatedChartData") > 0)
        commandURL = commandURL + "&rdAnimatedChartRenderer=" + FusionCharts.getCurrentRenderer(); //19845.

    try {
        window.external.AutoCompleteSaveForm(document.rdForm);  //Works for IE only.
    } catch (e) {}  // Ignore  
    
    if (copyQueryString) {
        var refreshElementIDs = getParameterByName(commandURL, "rdRefreshElementID");
        if (refreshElementIDs) {
            var regex = new RegExp(/(\$Request\.)([^~]*)(~)/g);
            var match = regex.exec(refreshElementIDs);
            while (match != null) {
                var id = match[2];
                var value = getParameterByName(location.search, id);
                if (value)
                    commandURL += "&" + id + "=" + value;

                match = regex.exec(refreshElementIDs);
            }
        }
    }

    if (bFromOnClick) 
        commandURL = decodeURIComponent(commandURL)  //onClick and other events need decoding.#6549 and 	
	
	//Form vars:
    var sCheckboxName;
    var frm = document.rdForm
    var isUpload = false
    var uploadUrlParams = commandURL
	if (!frm) {
	    return  //The debug page is likely the current document.
	}

	var checkboxChildrenIndexes = [];
    
	for (var i = 0; i < frm.elements.length; i++) {	   
	    var ele = frm.elements[i]
	    
	    if (!ele.type) {
            continue;  //Not an input element.
	    }

	    if (ele.type == "checkbox" && (ele.id.indexOf("_check_all") != -1 || ele.id.indexOf("_rdList") != -1)) {
	        continue;
	    }
        
	    if (ele.type == "file" && ele.getAttribute("data-ajax-upload") == "True") {
	        if (ele.value != "") {
	            var ext = ele.value.split('.')[1];
	            if (!ele.value.match('(jpg|JPG|gif|GIF|png|PNG|bmp|BMP)$')) {
	                alert('Wrong filetype!');
	                return;
	            }
	            var sInputValue = rdGetInputValues(ele)
	            if (uploadUrlParams.indexOf(sInputValue) == -1)
	                uploadUrlParams += sInputValue;
	            isUpload = true;
	        }
	    } else {

	        //19345
	        /*if (commandURL.indexOf("rdAjaxCommand=RefreshElement") != -1) {
                if (ele.name.indexOf("_Row") != -1) {
                    continue;  //Don't forward elements in tables for RefreshElements.
                }
            }*/
	        if (ele.getAttribute("rdAjaxDontSubmit") == "True") {
	            continue;
	        }

	        if (ele.name.lastIndexOf("-PageNr") != -1)
	            if (ele.name.lastIndexOf("-PageNr") == ele.name.length - 7)
	                continue;  //Don't forward the interactive page nr.			

	        //This parameter will always be set server side, it causes issues if we add it. 22188
	        if (ele.name == "rdDataTablePaging")
	            continue;

	        //Don't forward security stuff - it's already in session vars.
	        if (ele.name == "rdUsername") continue;
	        if (ele.name == "rdPassword") continue;
	        if (ele.name == "rdFormLogon") continue;

	        //Don't forward a variable that's already in the list, perhaps from LinkParams.
	        if (commandURL.indexOf("&" + ele.name + "=") != -1) continue;

	        var sInputValue = rdGetInputValues(ele)

	        if (sInputValue.indexOf("rdICL-") != "-1") {
                sInputValue = sInputValue.replace("rdICL-","")	        
	        }

	        if (ele.type == "checkbox" && sInputValue.indexOf("rdNotSent") != -1) {
	            sInputValue = ""
	        }

	        //Sometimes there may be duplicate parameters in the command.  This prevents duplicates. 21117
	        //22591 - Refactored. rdGetInputValues cannot be run twice in a row without changes. The second run will return Null.
	        if (commandURL.indexOf(sInputValue) == -1)
	            commandURL += sInputValue;           
	    }
	}
    	
	if (isUpload) {
	    commandURL = uploadUrlParams;
	}
    //20295
	sPrevRadioId = "";

	commandURL = commandURL.replace("rdRequestForwarding=Form","")  //Don't come back here.

    rdAjaxRequest(commandURL, bValidate, sConfirm, bProcess, fnCallback, waitCfg,isUpload)
}

function rdAjaxRefreshElements(idArray, rdReport, callback) {
    if (!idArray || !idArray.length) {
        if (callback)
            callback();

        return;
    }
    
    var id = idArray.shift();

    var commandUrl = "rdAjaxCommand=RefreshElement"
        + "&rdRefreshElementID=" + encodeURIComponent(id)
        + "&rdReport=" + encodeURIComponent(rdReport);
    
    rdAjaxRequestWithFormVars(commandUrl, "false", "", null, null,
        function () {
            rdAjaxRefreshElements(idArray, rdReport, callback);
        },
        null, true);
}

function rdAjaxEncodeValue(sValue){
    sValue = encodeURI(sValue)
    sValue = sValue.replace(/&/g,"%26")  //replace &
    sValue = sValue.replace(/\+/g,"%2B") //replace +
    return sValue
}

function rdUpdatePage(xmlResponse, sResponse, skipPageLoadScripts) {
    bCurrentIFrameResized = false;

    var ret = __rdUpdatePage.apply(this, arguments);

    if (!bCurrentIFrameResized)
        rdResizeCurrentIFrame();

    return ret;
}

function __rdUpdatePage(xmlResponse, sResponse, skipPageLoadScripts) {

    if (sResponse.length != 0) {
	    if (sResponse.indexOf("rdDebugUrl=")!=-1) { 
	        rdReportResponseError(sResponse)
	        return
	    }		
	    if (sResponse.indexOf("rdSecureKeyFailure='True'") > 0 || sResponse.indexOf("rdAuthSessionFailure='True'") > 0 || sResponse.indexOf("rdErrorAjaxRedirect='True'") > 0) { // 14518, 21430
	            if (window.DOMParser)
	            {
	                parser = new DOMParser();
	                if (sResponse.indexOf('</html>') != -1)
	                    sResponse = sResponse.substring(0, sResponse.indexOf('</html>') + 7);
	                var xmlDoc = parser.parseFromString(sResponse, "text/xml");
	                var action = xmlDoc.getElementsByTagName("form")[0].getAttribute("Action");
	                window.location = action;
	            }
	            else // Internet Explorer
	            {
                    var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
	                xmlDoc.async = false;
	                xmlDoc.loadXML(sResponse);
	                var action = xmlDoc.getElementsByTagName("form")[0].getAttribute("Action");
	                window.location = action;
	            }
	        rdReportResponseError(sResponse)
	        return
	    }
	    if (sResponse.indexOf("rdErrorAjaxMissingRedirect='True'") > -1) { //21430
	        var sResp = sResponse.replace("rdErrorAjaxMissingRedirect='True'", "");
	        sResp = sResp.replace("True", "");
	        window.document.write(sResp);
	        return;
	    }

        //Special for Metadata Editor.
	    if (sResponse.substring(0, 15) == "JoinRelationID=") {
	        rdMetadataReturnedJoinRelationID = sResponse.substring(15)
	    } else if (sResponse.substring(0, 13) == "ConnectionID=") {
	        rdMetadataReturnedConnectionID = sResponse.substring(13)
	    } else if (sResponse.substring(0, 10) == "TableName=") {
	        rdMetadataReturnedTableName = sResponse.substring(10)
	    } else if (sResponse.substring(0, 11) == "MetadataID=") {
	        rdMetadataReturnedMetadataID = sResponse.substring(11)
	    }
	    
	    if (!xmlResponse) {
	        rdReportResponseError(sResponse)
            sCurrentRequestParams = "";
	        return
	    }		
	    if (!xmlResponse.documentElement) {
	        rdReportResponseError(sResponse)
	        return
	    }		
	    if (!xmlResponse.documentElement.getAttribute("rdAjaxCommand")){
	        rdReportResponseError(sResponse)
	        return
	    }

	    if (xmlResponse.documentElement.getAttribute("rdAjaxCommand") != 'RefreshElement') {
	        //18808 19450 put all & back in the string response
	        sResponse = sResponse.replace(/_rdamp_/g, "&");
	        sResponse = sResponse.replace(/_rdlt_/g, "<");
	        sResponse = sResponse.replace(/_rdgt_/g, ">");
	    }
	    else {
	        // REPDEV-20413
	        sResponse = rdEnsureSeparateClosingTags(sResponse);
	    }

	    window.status = ""

        //chartPartialUpdate (used in realtime ChartCanvas)
        if (skipPageLoadScripts || sResponse.indexOf("data-linked-object-type=") != -1)
            skipPageLoadScripts = true;
        else
            skipPageLoadScripts = false;

        var sElementIDs = [];
        var refreshIFrames = true;

	    switch (xmlResponse.documentElement.getAttribute("rdAjaxCommand")) {

		        case 'RefreshElement':
		            //AJAX Paging 20543
		            var isDataTablePaging = xmlResponse.documentElement.getAttribute('id')
		            var rdValidateFormText = sResponse.substring(sResponse.indexOf("function rdValidateForm()"), sResponse.indexOf("</SCRIPT>", sResponse.indexOf("function rdValidateForm()")));
		            if (window.rdValidateForm) {
		                var strrdValidateForm = rdValidateForm.toString();
		                strrdValidateForm = strrdValidateForm.substring(strrdValidateForm.indexOf("{") + 1, strrdValidateForm.length - 1);
		                strrdValidateForm += rdValidateFormText.substring(rdValidateFormText.indexOf("{") + 1, rdValidateFormText.length -1);
		                rdValidateForm = new Function(strrdValidateForm);
		            }

				    sElementIDs = xmlResponse.documentElement.getAttribute('rdRefreshElementID').split(",");
				    if (isDataTablePaging && isDataTablePaging.indexOf("rdDataTableDiv") > -1) {
				        //Find the HTML TABLE's DIV.
				        var sTableDivID = xmlResponse.documentElement.getAttribute('id')
				        var eleTableDiv = document.getElementById(sTableDivID)
				        if (eleTableDiv) {
				            //Write the response html to the page, replacing the original table.
				            replaceHTMLElement(eleTableDiv, sResponse, eleTableDiv.id);
				        }
				    }
                    else{
                        for (var i = 0; i < sElementIDs.length; i++) {
                            if (sElementIDs[i] == "rdStopAjaxReplace")
                                break;

					        var eleOld = document.getElementById(sElementIDs[i])
					        if (eleOld) {
					            //Write the response html to the page, replacing the original html
					            var sNewHtml = replaceHTMLElement(eleOld, sResponse, sElementIDs[i]);
					            // Did we replace the content's of Dashboard Panel?
                                var node = Y.one('#' + LogiXML.escapeSelector(sElementIDs[i]));

                                if (node.hasClass("rdDashboardTabs"))
                                    skipPageLoadScripts = false;

                                var panelContainer = node.ancestor('div.rdDashboardPanel');
                                if (panelContainer) {
                                    //In case this panel had the MissingData because of metadata changes, the viz is good now, remove the message.
                                    Y.each(panelContainer.all('tr#MissingDataMessage'), function (nodeMissingDataMessage) {
                                        nodeMissingDataMessage._node.style.display = "none"
                                    });

                                    if (node.hasClass('panelBody') || node.getAttribute('src').indexOf('rdChart2.aspx') != -1) {
                                        var nodeFreeformLayout = Y.one('#rdFreeformLayout');
                                        if (!Y.Lang.isNull(nodeFreeformLayout)) {
                                            node.setStyle('cursor', 'auto');
                                            if (node.getAttribute('src').indexOf('rdChart2.aspx') != -1) {
                                                node.setAttribute('className', 'dashboardChart');   //#18970.
                                            }
                                            LogiXML.Dashboard.FreeForm.initializePanel(panelContainer);
                                        }
                                    }
                                }

					            //if (sElementIDs[i].indexOf('rdDashboardParamsID-') > -1) {
					            //    var sPanelIdWithGuid = sElementIDs[i].replace('rdDashboardParamsID', '');
					            //    var eleElementsToHideOnParamsCancel = document.getElementById('rdElementsToHideOnParamsCancel' + sPanelIdWithGuid);
					            //    ShowElement(null, eleElementsToHideOnParamsCancel.value, 'Toggle');
					            //}
					            // Animated Charts.
					            if (eleOld.getAttribute('id').match('rdAnimatedChart')) {
					                if (xmlResponse.text) {   //IE.
					                    if (xmlResponse.text.toString().match('rdLoadAnimatedChart'))
					                        rdRerenderAnimatedChart(xmlResponse.text.substring(xmlResponse.text.indexOf('rdLoadAnimatedChart'), xmlResponse.text.length), eleOld);
					                }
					                else {   //FF, Chrome.
					                    if (xmlResponse.documentElement.textContent.toString().match('rdLoadAnimatedChart'))
					                        rdRerenderAnimatedChart(xmlResponse.documentElement.textContent.substring(xmlResponse.documentElement.textContent.indexOf('rdLoadAnimatedChart'), xmlResponse.documentElement.textContent.length), eleOld);
					                }
					            }
					            // Fusion Maps.
					            if (eleOld.getAttribute('id').match('rdFusionMap')) {
					                if (xmlResponse.text) {   //IE.
					                    if (xmlResponse.text.toString().match('rdLoadFusionMap'))
					                        rdRerenderAnimatedMap(xmlResponse.text.substring(xmlResponse.text.indexOf('rdLoadFusionMap'), xmlResponse.text.length), eleOld);
					                }
					                else {   //FF, Chrome.
					                    if (xmlResponse.documentElement.textContent.toString().match('rdLoadFusionMap'))
					                        rdRerenderAnimatedMap(xmlResponse.documentElement.textContent.substring(xmlResponse.documentElement.textContent.indexOf('rdLoadFusionMap'), xmlResponse.documentElement.textContent.length), eleOld);
					                }
					            }

					            if (eleOld.getAttribute("rdPopupPanel") == "True") {
					                //PopupPanel is getting re-hidden with Action.Refresh.  If it was modal, get rid of the shading.
					                var rdModalShade = rdGetModalShade(document.getElementById(sElementIDs[i]));
					                if (rdModalShade != null) {
					                    rdModalShade.style.display = "none"
					                }
					            }

					            //Tab panels need to get re-hidden and re-shown.
					            if (sElementIDs[i].indexOf("rdTabPanel_") == 0) {
					                var eleActiveTab = document.getElementById(sElementIDs[i])
					                var eleTabs = eleActiveTab.parentNode
					                for (var i = 0; i < eleTabs.childNodes.length; i++) {
					                    if (eleTabs.childNodes[i].id == eleActiveTab.id) {
					                        eleTabs.childNodes[i].style.display = ""
					                    } else {
					                        eleTabs.childNodes[i].style.display = "none"
					                    }
					                }
					            }
					        }
					    }
				    }

                    // add any new stylesheets
                    LogiXML.mergeStylesheets(xmlResponse);

                    // now that everything is refreshed, trigger the refreshed events
                    for (var i = 0; i < sElementIDs.length; i++) {
                        LogiXML.Ajax.AjaxTarget().fire('refreshed_' + sElementIDs[i]);
                    }
				  
		            //Checkbox List on Ajax call needs to be initialized 18993
					if (sResponse.indexOf("data-checkboxlist") > 0) {
					    var list = xmlResponse.getElementsByTagName("div");
					    for (var i = 0; i < list.length; i++) {
					        if (list[i].getAttribute('data-checkboxlist')) {
					            var id = list[i].getAttribute('id');
					            if (Y.Lang.isValue(Y.LogiXML)) {
					                Y.one('#' + LogiXML.escapeSelector(id)).plug(Y.LogiXML.rdInputCheckList);
					            }
					        }
					    }
					}

					break;
					
				case 'CalendarRefreshElement':  // Block added to support the Ajax refresh for the calendar element
					sElementIDs = xmlResponse.documentElement.getAttribute('rdCalendarRefreshElementID').split(",")
					for (var i=0; i <  sElementIDs.length; i++) { 						
						var sElementID = sElementIDs[i]; 
						eleOld = document.getElementById(sElementID)

						if (eleOld) {
						
							var sNewHtml;
							
							if ((eleOld.tagName.toUpperCase() != "INPUT"))
								sNewHtml = replaceHTMLElement(eleOld, sResponse, sElementID);
																			
							if(sNewHtml){
							    var eleNew = document.getElementById(sElementID)
								if (eleNew.getAttribute("rdElementIdentifier")=="Calendar"){
								    //20252
								    //	rdOnloadColoring(eleNew.getAttribute("id"));
									rdOnLoadJavascriptAddition(eleNew.getAttribute("id"));
								}
								if (eleNew.getAttribute("id").match("TableForInputTime")){
									rdResizeAMPMTable();
									rdNeedForSecondsDisplay();
									rdLoadInputTimeDefaultValue();
								}   
							}   
                        }
					}
					break;
					
				case 'UpdateMapImage':
				    //Used by AWS Map Images
					var sImageID = xmlResponse.documentElement.getAttribute('id')
					var eleImage = document.getElementById(sImageID)
					if (eleImage) {
					    //Update the image SRC.
		                var sImageSrc = xmlResponse.documentElement.getAttribute('rdSrc')
		                eleImage.setAttribute("src",sImageSrc)
                    }
                    break;



				case 'RequestRefreshElement':
                    refreshIFrames = false;
				    //Request back to the server so that just this element is refreshed.
					var sElementID = xmlResponse.documentElement.getAttribute('ElementID');
					var sReport = xmlResponse.documentElement.getAttribute('rdReport')
                    var sRefreshDashboard = Y.Lang.isNull(xmlResponse.documentElement.getAttribute("rdRefreshDashboard")) ? '' : xmlResponse.documentElement.getAttribute("rdRefreshDashboard");
                    // parse out wait page configuration.                
                    var waitCfg = ['', '', ''];
                    var eleWaitCfg = document.getElementById("rdWaitCfgBookOrg");
                    if (eleWaitCfg) {
                        try {
                            var sScript = eleWaitCfg.parentElement.href
                            sScript = sScript.substr(sScript.indexOf("["))
                            waitCfg = eval(sScript.substr(0, sScript.indexOf("]") + 1))
                        }
                        catch (e) { }
                    }                    
                    rdAjaxRequest('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + sElementID + '&rdReport=' + sReport + 'rdRequestForwarding=Form' + '&rdRefreshDashboard=' + sRefreshDashboard, false, null, false, null, waitCfg);
					break;
 
				case 'RequestRefreshPage':
				    window.location.href = window.location.href;
					break;

		        case 'RunJavascript':
		            var scriptString = xmlResponse.documentElement.getAttribute("Script");  //18808 19450
		            scriptString = scriptString.replace(/_rdamp/g, "&");
		            scriptString = scriptString.replace(/_rdlt_/g, "<");
		            scriptString = scriptString.replace(/_rdgt_/g, ">");
		            eval(scriptString);
					break;
					
				case 'ShowElement':
				    ShowElement(null,xmlResponse.documentElement.getAttribute("ElementID"),xmlResponse.documentElement.getAttribute("Action"));
				    break;

	        case 'ShowPopup':
	            var sPopupId = xmlResponse.documentElement.getAttribute("PopupID");
	            var sTitle = xmlResponse.documentElement.getAttribute("PopupTitle");
	            var sContent = xmlResponse.documentElement.getAttribute("PopupContent");
	            rdShowPopup(sPopupId, sTitle, sContent);
	            break;

            case 'ShowStatus':
                var sNotifyCommand = xmlResponse.documentElement.getAttribute("rdNotifyCommand");

                var sReloadPanelID = xmlResponse.documentElement.getAttribute("rdReloadPanelID");
                if (sReloadPanelID)
                    sElementIDs.push(sReloadPanelID);
                else if (sNotifyCommand == "SaveDashboardParams"
                || sNotifyCommand == "RenameDashboardTab"
                || sNotifyCommand == "UpdateDashboardPanelOrder")
                    refreshIFrames = false;

	            if (xmlResponse.documentElement.getAttribute("RdTsBookmarkID")) {
	                var bookmarkUrl = "rdPage.aspx?rdLoadBookmark=True&rdReport=" + xmlResponse.documentElement.getAttribute("RdReport") + "&rdBookmarkCollection=" + xmlResponse.documentElement.getAttribute("RdBookmarkCollection") + "&rdBookmarkUserName=" + xmlResponse.documentElement.getAttribute("RdBookmarkUserName") + "&rdBookmarkID=" + xmlResponse.documentElement.getAttribute("RdTsBookmarkID") + "&rdSharedBookmarkID=" + xmlResponse.documentElement.getAttribute("RdSharedBookmarkID");
	                //We need to suppress refreshing page when we're in the middle of thinkspace visualization editing
	                var isInThinkspaceEdit = (window.location.href.toLowerCase().indexOf("rdeditthinkspace=true") > 0 || (Y && Y.one('#rdEditThinkspace') && Y.one('#rdEditThinkspace').get('value').toString().toLowerCase() == 'true'))	                
                    if (xmlResponse.documentElement.getAttribute("IsNewSave") == "True" && !isInThinkspaceEdit) {
                        window.location.href = bookmarkUrl;
                    } else if (xmlResponse.documentElement.getAttribute("IsOverwrite") == "False") {
                        window.history.pushState("", "", bookmarkUrl);
                    }
	            }
	            
	            window.status = xmlResponse.documentElement.getAttribute("Status")

                if (xmlResponse.documentElement.getAttribute("Alert")) {
		            alert(xmlResponse.documentElement.getAttribute("Alert"));
		        }
				    
				//Hide the popup when status returns.
				if (typeof(rdEmailReportPopupId) != 'undefined') {  
				    if (rdEmailReportPopupId != null) {   
                        ShowElement(null,rdEmailReportPopupId,'Hide')
                        rdEmailReportPopupId = undefined
                    }
				}

		    case "RequestRealTimeAnimatedChartData":
		        //do nothing                   
				break;
					
		}

        //17343. Moved call to rdAjaxRunOnLoad() to come before the 'reinitialize' event is fired.
        //If the scripts evaluated by rdAjaxRunOnLoad() attach handlers for the 'reinitialize'
        //event the scripts need to be run before the event is fired.
        //
        //May need to run some script.
	    if (!skipPageLoadScripts) {
            rdAjaxRunOnLoad(xmlResponse);

            // If this was a refresh for specific elements, do not reinitialize unrelated iframes.
            var skippedIFrames = [];

            if (sElementIDs.length > 0 || !refreshIFrames) {
                Y.each(Y.all('iframe'), function (nodeFrame) {
                    var reinit = false;
                    var ifr = nodeFrame.getDOMNode();

                    if (refreshIFrames)
                    {
                        for (var x = 0; x < sElementIDs.length; x++) {
                            if (LogiXML.isAncestorID(ifr, sElementIDs[x])) {
                                reinit = true;
                                break;
                            }
                        }
                    }

                    if (!reinit) {
                        // this iframe is not related to the element(s) that was refreshed, so leave it alone.
                        ifr.setAttribute("rdSkipReinit", "true");
                        skippedIFrames.push(ifr);
                    }
                });
            }

            LogiXML.Ajax.AjaxTarget().fire('reinitialize');

            for (var x = 0; x < skippedIFrames.length; x++) {
                skippedIFrames[x].removeAttribute("rdSkipReinit");
            }

	        if (typeof window.rdRepositionSliders != 'undefined') {
	            //Move CellColorSliders, if there are any.
	            rdRepositionSliders()
	        }
	    }

        //REPDEV-19948
	    if (document.getElementById("rdKillPageCache")) {
	        var url = LogiXML.setUrlParameter(location.href, "rdKillPageCache", Math.floor(Math.random() * 100000));
	        history.replaceState({}, null, url);
	    }

    }

    //23492
    var bStopFeedback = true

    if (sCurrentRequestParams.indexOf("rdDontUndoFeedback=True") >= 0) {
        var bStopFeedback = false;
    }
        
	
	sCurrentRequestParams = ""
	bSubmitFormAfterAjax = false
	
    //Hide wait panel
	if (sResponse.indexOf('rdAjaxCommand="RequestRefreshElement"') == -1) {  //Don't hide with RequestRefreshElement
	    if (Y.Lang.isValue(LogiXML.WaitPanel.pageWaitPanel)) {
		    LogiXML.WaitPanel.pageWaitPanel.cancelWait();
		    LogiXML.WaitPanel.pageWaitPanel.hideWaitPanel();	
	    }
    }
	
    //Manage feedback.
	if (sResponse.length != 0) {
	    if (xmlResponse.documentElement.getAttribute("rdAjaxCommand")) {
	        if (xmlResponse.documentElement.getAttribute("rdAjaxCommand").indexOf("Request") != -1) {
	            //Keep feedback going if we're making another request with RequestRefreshElement or RequestRefreshPage.
	            bStopFeedback = false
	        }
	    }
	}

    if (bStopFeedback) 
	    rdShowAjaxFeedback(false);

    LogiXML.studioWizardFixup();
}

function replaceHTMLElement(eleOld, sResponse, newElementID) {
	var newYuiNode, placeHolder,
		oldYuiNode = Y.one(eleOld);

	var oldValues;
    
	if (oldYuiNode)
	    if (eleOld && eleOld.innerHTML && eleOld.innerHTML.indexOf('data-rdEnableEventsOnRefresh') > -1)
	        oldValues = rdGetInputValuesRecursive(oldYuiNode._node);
	    else
	        oldValues = [];	    
	else
	    oldValues = [];
	
	//Find the new element's text.
    var sNewHtml;
    var nIdStart = sResponse.indexOf(" id=\"" + newElementID + "\"");
    if (nIdStart === -1)
         nIdStart = sResponse.indexOf(" ID=\"" + newElementID + "\"");
    if (nIdStart === -1) 
        return null; //error.
    var nEleStart = sResponse.substring(0,nIdStart).lastIndexOf("<");
    sNewHtml = sResponse.substring(nEleStart)
    //We have the start of the element.  Find its end.
    var nNextStart;
    var nNextClose;
    var nNextEnd;
    var nPos = 1;
    var nDepth = 1;
    var bLookForEnds = true
    while (nDepth > 0) {
        nNextStart = sNewHtml.indexOf("<",nPos);
        nNextClose = sNewHtml.indexOf("</",nPos);
        if (bLookForEnds) {
            nNextEnd = sNewHtml.indexOf("/>",nPos);
            if (nNextEnd == -1){
                bLookForEnds = false  //Save time by not looking for these rare formats: <x ... />
            }
        }
        if (nNextEnd != -1 && nNextEnd < nNextStart) {
            // "/>" found.
            nDepth -= 1;
            nPos = nNextEnd + 2;
        }else if (nNextStart == nNextClose) {
            // "</" found.
            nDepth -= 1;
            nPos = nNextClose + 2;
        }else if(nNextStart != -1 && nNextStart < nNextClose) {
            // "<" found.
            nDepth += 1;
            nPos = nNextStart + 1;
        }else{
            alert('There was an error parsing the returned Ajax XML.') //todo, keep this?  Throw an error instead.
            return null; //error.
        }
    }
    var nEleEnd
    if (nNextEnd != -1 && nNextEnd < nNextStart) {
        //ending with "/>"
        nEleEnd = nNextEnd + 2;
    }else{
        //ending with "</ ... >"
        nEleEnd = sNewHtml.indexOf(">", nNextClose) + 1;
    }
    sNewHtml = sNewHtml.substring(0,nEleEnd)
    sNewHtml = sNewHtml.replace(/_rdamp_/g, "&");
    sNewHtml = sNewHtml.replace(/_rdlt_/g, "<");
    sNewHtml = sNewHtml.replace(/_rdgt_/g, ">");

	//Create a YUI node and insert into the DOM.
    newYuiNode = Y.Node.create(sNewHtml);	
    if (newYuiNode) {

        //it can be update of the js object instance linked with html element
        var linkedObjectCallback = newYuiNode.getAttribute('data-linked-object-callback');
        if (linkedObjectCallback) {
            var linkedObjectType = newYuiNode.getAttribute('data-linked-object-type'),
                linkedObject = oldYuiNode.getData(linkedObjectType);
            if (linkedObject && linkedObject[linkedObjectCallback]) {
                linkedObject[linkedObjectCallback](newYuiNode,sResponse);
                newYuiNode.remove(true);
                return;
            }
        }

		// Run destroy against YUI node to cleanup any attached classes and then
		// remove it from dom.
		// Use placeholder element to prevent duplicate IDs from being written to DOM
		placeHolder = Y.Node.create( '<div style="display: none;"></div>' );
		oldYuiNode.insert( placeHolder, 'before' );
		Y.each(oldYuiNode.get('children'), function(childNode) {	
			childNode.destroy(true);
		});
		oldYuiNode.remove(true);		
		
		placeHolder.replace( newYuiNode );
        // REPDEV-24115
        // Very specific - for automation on Windows Server 2019 in IE 11
        // IE 11 in AWS bug we need to reassociate the inline events with setAttribute
        var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
        if (isIE11) {
            var fxReApplyEvents = function (childNode) {
                var attrs = childNode._node.attributes;
                for (var i = 0; attrs != null && i < attrs.length; i++) { //REPDEV-25176, attrs is null.
                    var attr = attrs[i];

                    if (attr.name.toLowerCase().indexOf('on') == 0)
                        childNode._node.setAttribute(attr.name, attr.value);
                }
            };
            Y.each(newYuiNode.all('*'), fxReApplyEvents);
            fxReApplyEvents(newYuiNode);
        }

		placeHolder.remove(true);

        // trigger onchange event for all elements that changed
		for (var i = 0; i < oldValues.length; i++) {
		    var oldVal = oldValues[i];
		    var newEle = document.getElementById(oldVal.id);

		    if (rdEnableEventsOnRefresh(newEle)) {
		        var value = rdGetInputValues(newEle, false);

		        if (value != oldVal.value) {
                    // value changed - trigger onchange event
		            LogiXML.fireEvent(newEle, "onchange");
		        }
		    }
		}
	}

	return sNewHtml;
}

function rdAjaxRunOnLoad(xml) {
    var existingScripts = document.getElementsByTagName('SCRIPT');
    var scripts = xml.getElementsByTagName('SCRIPT')
    for (var i = 0; i < scripts.length; i++) {
        var scrpt = scripts[i];

        var attrRun = scrpt.attributes.getNamedItem('rdAjaxRunOnLoad')
        if (attrRun) {
            if (attrRun.value == 'True') {
                if (scripts[i].text) {
                    scripts[i].text = scripts[i].text.replace(/_rdamp_/g, "&");   //18808 19450
                    scripts[i].text = scripts[i].text.replace(/_rdlt_/g, "<");
                    scripts[i].text = scripts[i].text.replace(/_rdgt_/g, ">");
                    eval(scripts[i].text); //IE
                }
                else {
                    scripts[i].textContent = scripts[i].textContent.replace(/_rdamp_/g, "&");
                    scripts[i].textContent = scripts[i].textContent.replace(/_rdlt_/g, "<");
                    scripts[i].textContent = scripts[i].textContent.replace(/_rdgt_/g, ">");
                    eval(scripts[i].textContent);
                }
            }
        } else {
            var src = scrpt.getAttribute("src");
            if (src) {
                var gotIt = false;

                for (var j = 0; j < existingScripts.length; j++) {
                    var src2 = existingScripts[j].getAttribute("src");
                    if (src == src2) {
                        gotIt = true;
                        break;
                    }
                }

                if (!gotIt)
                    LogiXML.addScript(src);
            }
        }
    }
}

function rdGetFormFieldValue(fld) {
	
	var sValue
	if (fld == null) {
	    return;
	}
    if (fld.id.indexOf("rdRadioButtonGroup") == 0) {
		// Radio buttons
		sFieldId = fld.id.replace(/rdRadioButtonGroup/g, '')
		var cInputs = document.getElementsByTagName("INPUT")
		for (var i = 0; i < cInputs.length; i++) {
			if (cInputs[i].name == sFieldId) {
				if (cInputs[i].checked) {
					sValue = cInputs[i].value
					break
				}
			}
		}
		if (sValue == undefined) {
				sValue = ''
			}

	} else {
		// All other fields
		if (fld.value.length == 0) {
			sValue = ''
		} else {
			sValue = fld.value
		}
	}
	return sValue	
}

function rdReportResponseError(sResponse) {
    sCurrentRequestParams = "";
    try {
        var nPosDebugUrl = sResponse.indexOf("rdDebugUrl=")
        if (nPosDebugUrl != -1) { 
            //Normal path, redirect to the debug page.
            var sDebugUrl = sResponse.substring(nPosDebugUrl + 12)         
            sDebugUrl = sDebugUrl.substring(0,sDebugUrl.indexOf("\""))
            window.location = sDebugUrl
//        }else{
//            window.top.document.body.innerHTML = sResponse
        }
    }
    catch (e) {	
    }
}

var sFeedbackShowElementID  //#11292.
var sFeedbackHideElementID

function rdShowAjaxFeedback(bShow, sCommandParams) {
    var rdCurrFeedbackElementShow
    var rdCurrFeedbackElementHide
    
    //Undo the previous feedback.
    if (sFeedbackShowElementID) {
        for (i = 0; i < sFeedbackShowElementID.length; i++) {
            rdCurrFeedbackElementShow = document.getElementById(sFeedbackShowElementID[i].trim())
            if (rdCurrFeedbackElementShow) {
                ShowElement(null, sFeedbackShowElementID[i].trim(), 'Hide');//22558
                rdCurrFeedbackElementShow = null
            }
        }
        //19642
        sFeedbackShowElementID = undefined;
    }
    if (sFeedbackHideElementID) {
        for (i = 0; i < sFeedbackHideElementID.length; i++) {
            rdCurrFeedbackElementHide = document.getElementById(sFeedbackHideElementID[i].trim())
            if (rdCurrFeedbackElementHide) {
                ShowElement(null, sFeedbackHideElementID[i], 'Show');
                rdCurrFeedbackElementHide = null
            }
        }
        //19642
        sFeedbackHideElementID = undefined;
    }
    document.documentElement.style.cursor = "auto"

    if (bShow) {
        var sParams
        //Show an element
        sParams = sCommandParams.split("&rdFeedbackShowElementID=")
        if (sParams.length > 1) {
            sFeedbackShowElementID = sParams[1].split("&")[0].split(',')
            for(i=0;i<sFeedbackShowElementID.length;i++){           
                rdCurrFeedbackElementShow=document.getElementById(sFeedbackShowElementID[i].trim())
                if (rdCurrFeedbackElementShow) {
                    ShowElement(null, sFeedbackShowElementID[i].trim(), 'Show');
                }
            }
        }
        //Hide an element
        sParams = sCommandParams.split("&rdFeedbackHideElementID=")
        if (sParams.length > 1) {
            sFeedbackHideElementID = sParams[1].split("&")[0].split(',')
            for(i=0;i<sFeedbackHideElementID.length;i++){           
                rdCurrFeedbackElementHide=document.getElementById(sFeedbackHideElementID[i].trim())
                if (rdCurrFeedbackElementHide) {
                    ShowElement(null, sFeedbackHideElementID[i].trim(), 'Hide'); 
                }
            }
        }
    }
}
function rdGetCheckedValueFromRadioButtons(ele) {
    var sElementId = ele.id.replace(/rdRadioButtonGroup/g, "")
    var cInputs = ele.getElementsByTagName("INPUT")
    for (var i = 0; i < cInputs.length; i++) {
        if (cInputs[i].checked && cInputs[i].name == sElementId) {
            return cInputs[i].value;
        }
    }
    return '';
}
function rdGetSelectedValuesFromCheckboxList(inputName, asArray) {
    var eleList = Y.all('input[name="' + inputName + '"]'),
        uniqueValues = new Array(),
        nodeValue,
        sReturn = '';

    eleList.each(function (node) {
        if (node.get('checked') == true) {
            nodeValue = node.get("value");
            if (!nodeValue)
                nodeValue = node._node.parentNode.innerText;

            if (Y.Array.indexOf(uniqueValues, nodeValue) == -1) {
                uniqueValues.push(nodeValue);
            }
        } else {
            //unchecked
            nodeValue = node.getAttribute("rdUncheckedValue")
            if (node.hasAttribute("rdUncheckedValue") && Y.Array.indexOf(uniqueValues, nodeValue) == -1) {
                uniqueValues.push(nodeValue);
            }
        }
    });

    if (asArray === true)
        return uniqueValues;

    if (uniqueValues.length > 0) {
        if (typeof window.rdInputValueDelimiter == 'undefined') {
            window.rdInputValueDelimiter = ','
        }

        if (LogiXML.rdInputTextDelimiter)
            sReturn = LogiXML.rdInputTextDelimiter.delimit(uniqueValues, rdInputValueDelimiter, "\"", "\\");
        else
            sReturn = uniqueValues.join(rdInputValueDelimiter);
    }
    return sReturn;
}

function rdEnableEventsOnRefresh(ele) {
    return (ele && ele.getAttribute && ele.getAttribute("data-rdEnableEventsOnRefresh") == "True");
}

function rdGetInputValuesRecursive(ele, list) {
    if (!ele)
        return list;

    list = list || [];

    var value;
    
    if (ele.id) {
        value = rdGetInputValues(ele, false);

        list.push({
            "id": ele.id,
            "value": value
        });
    }

    for (var i = 0; i < ele.childNodes.length; i++) {
        rdGetInputValuesRecursive(ele.childNodes[i], list);
    }

    return list;
}

function rdGetInputValues(ele, urlRequest) {

    var sValue = "";
    //Default parameter value is true
    urlRequest = typeof urlRequest !== 'undefined' ? urlRequest : true;
    //CheckboxList has to be processed differently
    if (ele.getAttribute("data-checkboxlist")) {
        sValue = rdGetSelectedValuesFromCheckboxList(ele.id);
        if(urlRequest)
            return '&' + ele.id + "=" + rdAjaxEncodeValue(sValue);
        else
            return sValue;
    }
    //rdRadioButtonGroup 
    if (ele.getAttribute("type") == "rdRadioButtonGroup") {
        sValue = rdGetCheckedValueFromRadioButtons(ele);
        if (urlRequest)
            return '&' + ele.id + "=" + rdAjaxEncodeValue(sValue);
        else
            return sValue;
    }

    //19809
    else if (ele.getAttribute("rdelement") == "Tabs") {
        var Tabs = document.getElementById("rdActiveTabId_" + ele.id);
        if (Y.Lang.isValue(Tabs)) {
            sValue = Tabs.value;
            if (urlRequest)
                return '&' + ele.id + "=" + rdAjaxEncodeValue(sValue);
            else
                return sValue;
        }
    }
    else if (ele.nodeName == "SPAN")
    {
        return '&' + ele.id + "=" + rdAjaxEncodeValue(ele.innerText);
    }
    else {
        switch (ele.type) {
            case 'hidden':         
            case 'email':
            case 'number':
            case 'tel':
            case 'textarea':
            case 'password':
            case 'select-one':
            case 'file':
                sValue = rdGetFormFieldValue(ele);
                if (urlRequest)
                    return '&' + ele.name + "=" + rdAjaxEncodeValue(sValue);
                else
                    return sValue;
                break;
            case 'text':
                
                //23865 23862
                if (ele.autocomplete) {
                    var delimiter = ele.getAttribute('data-delimiter');

                    if (delimiter && delimiter.length > 0) {
                        //Get rid of extra spaces added by the autocomplete
                        ele.value = ele.value.split(delimiter + ' ').join(delimiter).trim();

                        //Get rid of the last delimiter added by the autocomplete
                        if (ele.value.lastIndexOf(delimiter) == ele.value.length - 1)
                            ele.value = ele.value.substring(ele.value, ele.value.length - delimiter.length);
                    }
                }

                sValue = rdGetFormFieldValue(ele);

                if (urlRequest)
                    return '&' + ele.name + "=" + rdAjaxEncodeValue(sValue);
                else
                    return sValue;
                break;
            case 'select-multiple':
                var selectedItems = new Array();
                var bBlankSelected = false;
                for (var k = 0; k < ele.options.length; k++) {
                    if (ele.options[k].selected) {
                        selectedItems[selectedItems.length] = ele.options[k].value;
                        if (ele.options[k].value == "") { //#18305
                            bBlankSelected = true; //#18305
                        } //#18305
                    }
                }
                if (typeof window.rdInputValueDelimiter == 'undefined') { window.rdInputValueDelimiter = ',' }
                var sValue = selectedItems.join(rdInputValueDelimiter);
                if ((sValue.length > 0) || (bBlankSelected == true)) { //#5846 //#18305
                    if (urlRequest)
                        return '&' + ele.name + "=" + rdAjaxEncodeValue(sValue);
                    else
                        return sValue;
                }
                break;
            case 'checkbox':
                //20388,23861
                if (Y.Lang.isValue(Y.one("#" + ele.id)) && (Y.Lang.isValue(Y.one("#" + ele.id).ancestor("div")) && Y.one("#" + ele.id).ancestor("div").getAttribute("data-checkboxlist"))) {
                    var parent = Y.one("#" + ele.id).ancestor("div");
                    sValue = rdGetSelectedValuesFromCheckboxList(parent.getAttribute("id"));
                    if (urlRequest)
                        return '&' + parent.getAttribute("id") + "=" + rdAjaxEncodeValue(sValue);
                    else
                        return sValue;
                }
                else {
                    sValue = rdGetSelectedValuesFromCheckboxList(ele.id);
                    if (urlRequest)
                        return '&' + ele.id + "=" + rdAjaxEncodeValue(sValue);
                    else
                        return sValue;
                }
                break;
            case 'radio':
                var sRadioId = 'rdRadioButtonGroup' + ele.name
                if (sPrevRadioId != sRadioId) {
                    sPrevRadioId = sRadioId;
                    var sValue = rdGetFormFieldValue(document.getElementById(sRadioId));
                    if (urlRequest)
                        return '&' + ele.name + "=" + rdAjaxEncodeValue(sValue);
                    else
                        return sValue;
                }
                break;
        }
    }
    return "";
}

var getElementsByClassName = function (className, tag, elm){
    if (document.getElementsByClassName) {
        getElementsByClassName = function (className, tag, elm) {
            elm = elm || document;
            var elements = elm.getElementsByClassName(className),
            nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null,
            returnElements = [],
            current;
            for(var i=0, il=elements.length; i<il; i+=1){
                14.
                current = elements[i];
                15.
                if(!nodeName || nodeName.test(current.nodeName)) {
                    returnElements.push(current);
                }
            }
            return returnElements;
        };
    }
else if (document.evaluate) {
    getElementsByClassName = function (className, tag, elm) {
        tag = tag || "*";
        elm = elm || document;
        var classes = className.split(" "),
        classesToCheck = "",
        xhtmlNamespace = "http://www.w3.org/1999/xhtml",
        namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace : null,
        returnElements = [],
        elements,
        node;
        for(var j=0, jl=classes.length; j<jl; j+=1){
            classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
        }
        try {
            elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
        }
    catch (e) {
        elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
    }
        while ((node = elements.iterateNext())) {
            returnElements.push(node);
        }
        return returnElements;
    };
}
else {
getElementsByClassName = function (className, tag, elm) {
    tag = tag || "*";
    elm = elm || document;
    var classes = className.split(" "),
    classesToCheck = [],
    elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag),
    current,
    returnElements = [],
    match;
    for(var k=0, kl=classes.length; k<kl; k+=1){
        classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
    }
    for(var l=0, ll=elements.length; l<ll; l+=1){
        current = elements[l];
        match = false;
        for(var m=0, ml=classesToCheck.length; m<ml; m+=1){
            match = classesToCheck[m].test(current.className);
            if (!match) {
                break;
            }
        }
        if (match) {
            returnElements.push(current);
        }
    }
    return returnElements;
};
}
return getElementsByClassName(className, tag, elm);
};
function isIE() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
}

// REPDEV-20413
// http://xahlee.info/js/html5_non-closing_tag.html
var selfClosingTags = ["br","img","input","hr","area","base","col","command","embed","keygen","link","param","source","track","wbr","meta"];
function rdEnsureSeparateClosingTags(sHtml) {
    if (!sHtml || !sHtml.length)
        return sHtml;

    var i = sHtml.indexOf("/>");

    if (i < 0)
        return sHtml;

    var s, j, sChunk;
    var sNewHtml = "";
    var sRemainingHtml = sHtml;

    while (i >= 0) {
        // everything up to the next self closing tag
        sChunk = sRemainingHtml.substr(0, i);

        // the contents of the self closing tag
        j = sChunk.lastIndexOf("<");
        s = sChunk.substr(j + 1).trim();

        if (!s.length)
            return sHtml; // invalid

        // find the first whitespace
        j = s.match(/\s/);

        if (j)
            s = s.substr(0, j.index);

        // s is now the lowercase tag name
        if (s.indexOf("rd") == 0 || selfClosingTags.indexOf(s.toLowerCase()) >= 0) {
            // allow self closing tag
            sNewHtml += sChunk + "/>";
        }
        else {
            // YUI will create this incorrectly
            // <SPAN attr=value />
            // Must change to <SPAN attr=value ></SPAN>
            sNewHtml += sChunk + "></" + s + ">";
        }

        sRemainingHtml = sRemainingHtml.substr(i + 2);

        i = sRemainingHtml.indexOf("/>");
    }

    return sNewHtml + sRemainingHtml;
}

function rdRemoveQueryStringParameter(sHref, sParam) {
    if (!sHref || !sParam)
        return sHref;

    // find the parameter
    var i = sHref.indexOf("&" + sParam + "=");

    if (i < 0) {
        i = sHref.indexOf("?" + sParam + "=");

        if (i < 0)
            return sHref;
    }

    // see if we need to save anything after this parameter
    var j = sHref.indexOf("&", i + 1);

    if (j >= 0)
        return sHref.substr(0, i) + sHref.substr(j);

    return sHref.substr(0, i);
}

function rdNestedConfirm(sConfirm) {
    var ele = document.getElementById('lblBookmarkCaption');
    
    if (ele) {
        if (!confirm('Duplicate "' + ele.innerHTML + '"?')) {
            return false;
        }
    }
    else {
        if (sConfirm) {
            if (sConfirm.length != 0) {
                if (!confirm(sConfirm)) {
                    return false;
                }
            }
        }
    }
  
    return true;
}
