var rdParentPopupPanel;    // Variable to hold the parent PopUp object. Used in case of a Calendar and AddBookmark.

function ShowOrHideCustomButtons(sParentId, bShow) {
    if (sParentId) {
        var allButons = document.querySelectorAll('#' + LogiXML.escapeSelector(sParentId) + ' .highcharts-button');
        for (var i = 0; i < allButons.length; i++) {
            if (allButons[i].getAttribute('collapsed-button') != 'True') {
                ShowElement(sParentId, allButons[i], bShow ? 'Show' : 'Hide', '');
            }
        }
    }
    
}

function ShowElement(sParentId,sElementId,sAction,sEffect,sNoResize) {

    var rdSaveASNewHiddenInput = Y.one('#rdSaveASNew');

    if (rdSaveASNewHiddenInput) {
        rdSaveASNewHiddenInput.set('value', '');
    }

    if(sElementId == null) return;
    if(sElementId.tagName) {
        // sElementId is actually an element object.
        rdShowSingleElement(sElementId,sAction,sEffect)

    }else {
	    var sIds = sElementId.split(",")
	    for (k=0; k < sIds.length; k++) {

            var sId = Y.Lang.trim(sIds[k]);
            
            var sCurrAction = sAction
            if(sId.split(":").length==2){
                //The action is in the element ID.
                sCurrAction = sId.split(":")[1]
                sId = sId.split(":")[0]
            }
            
            //When in a data table, the sParentID will have a row number.
            //It gets appended to the ID of the element so that only that row is affected.
            //Adjust the indexOf value to look for the lastIndexOf in case the user has placed _Row
            //as part of the ID.
            if (sParentId) {
                if (sParentId.lastIndexOf("_CtCol") != -1) {
                    //For crosstab columns:
                    var idSuffix = sParentId.substr(sParentId.lastIndexOf("_CtCol"))
                    //idSuffix = idSuffix.substr(0,col.indexOf("_Row")) 
                    if (sId.indexOf(idSuffix) == -1) {
                        sId = sId + idSuffix
                    }
                }else if(sParentId.lastIndexOf("_Row") != -1) {
                    //For rows in tables"
                    var idSuffix = sParentId.substr(sParentId.lastIndexOf("_Row"))
                    if (sId.indexOf(idSuffix) == -1) {
                        sId = sId + idSuffix
                    }
                }
            }
            var c = document.getElementById(sId);
            if (c == null) {
                if (sId.indexOf("_Row") != -1) {
                    c = document.getElementById(sId.substr(0, sId.lastIndexOf("_Row")));
                    if (c == null) {    //#15227.
                        if (sId.indexOf("_CtCol") != -1) {
                            c = document.getElementById(sId.substr(0, sId.lastIndexOf("_CtCol")));
                        }
                    }
                }
            }
            if (c) {
                if (sElementId.indexOf('ppAddToDashboardPrompt_') == 0) {
                    //Get the suggested dashboard panel's caption from the AG or AC panel's heading.
                    if (sAction.toLowerCase() != 'hide') {
                        var eleAction = document.getElementById(sElementId.replace('ppAddToDashboardPrompt_', ''));
                        if (eleAction) {   //25650 - when under another popup panel.
                            var eleActionParent = eleAction.parentNode;
                            var sHeadingID = eleActionParent.id;
                            sHeadingID = sHeadingID.replace('colAnalChartAddDashboard_', 'lblHeadingAnalChart_');  //AG Chart
                            sHeadingID = sHeadingID.replace('colAnalCrosstabAddDashboard_', 'lblHeadingAnalCrosstab_');  //AG Crosstab
                            sHeadingID = sHeadingID.replace('colAddToDashboardDataTable', 'lblHeadingTable');  //AG Table
                            sHeadingID = sHeadingID.replace('divAddToDashboardPanel_', 'lblHeadingAnalChart_');  //Dashbboard
                            if (sHeadingID.indexOf("lblHeading") != -1) {  //Test for AG.
                                var eleHeading = document.getElementById(sHeadingID);
                                if (eleHeading) {
                                    var sTitle = eleHeading.innerHTML;
                                    var sInputTitleID = sElementId.replace('ppAddToDashboardPrompt_', 'rdPanelTitle_');
                                    var eleInputTitle = document.getElementById(sInputTitleID);
                                    eleInputTitle.value = sTitle;
                                }
                            }
                        }
                    }
                } else if (!sElementId.match('PPDatePickerForInputDate') && !sElementId.match('PPTimePickerForInputTime')) {
                    if (c.getAttribute('rdPopupPanel') == 'True')
                        rdParentPopupPanel = c;    //#11760.
                } else {   // Fix to make the new Calendar PopUp from a PopUpPanel, #11924.
                    if (rdParentPopupPanel) {
                        var rdCurrPopupPanelObj = c.parentNode;
                        if (rdCurrPopupPanelObj) {
                            while (rdCurrPopupPanelObj) {
                                if (rdCurrPopupPanelObj != rdParentPopupPanel) {
                                    rdCurrPopupPanelObj = rdCurrPopupPanelObj.parentNode;
                                }
                                else {
                                    if (rdCurrPopupPanelObj.firstChild.id.match('rdPopupPanelTable')) {
                                        if (rdCurrPopupPanelObj.parentNode)
                                            rdCurrPopupPanelObj.parentNode.appendChild(c);  // Add the new sibling as a child to the parent of the already popped out Div.                              
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if (sAction.toLowerCase() != 'hide') {    //#14844.
                        var eleHiddenParent = c.parentNode;
                        while (eleHiddenParent != null) {
                            if (eleHiddenParent.style) {
                                if (eleHiddenParent.style.display == 'none') {
                                    eleHiddenParent.parentNode.appendChild(c);
                                    break;
                                }
                            }
                            eleHiddenParent = eleHiddenParent.parentNode;
                        }
                    }
                }
            } else {//element not found in the current document, trying to search in parent docs
                try {
                    window.parent && window.parent !== window && window.parent.ShowElement(sParentId, sElementId, sAction, sEffect, sNoResize);//call the parent window show element, try to find target element there
                }
                catch (e) { }
            }
		    
            if (c != null ) {
			 if (rdParentPopupPanel != null){
                if (rdParentPopupPanel.getAttribute('id') == c.getAttribute('id') && sCurrAction.toLowerCase() == 'hide') {     //21889
                    for (g = 0; g < rdParentPopupPanel.parentNode.children.length; g++) {
                        var childElement = rdParentPopupPanel.parentNode.children[g];
                        if (childElement.id.match('PPDatePickerForInputDate') || childElement.id.match('PPTimePickerForInputTime')) {
                            rdShowSingleElement(childElement, sCurrAction, childElement.id, sEffect, sNoResize);
                        }
                    }
                }
				}
			 rdShowSingleElement(c, sCurrAction, sId, sEffect, sNoResize);
                if (Y.Lang.isValue(Y.LogiXML)) {
                    if (Y.Lang.isValue(Y.LogiXML.rdInputCheckList) && c.id.indexOf("checkboxToggle") > 0 && k == 1) {
                        rdSaveCheckboxListState(c);
                    }
                }
   		    }
    	
	    } //Next ID.
	}
	
	if (typeof window.rdRepositionSliders != 'undefined') {
		//Move CellColorSliders, if there are any.
		rdRepositionSliders()
	}
}

function rdShowPopup(sPopupId, sTitle, sContent) {
    var popup = document.getElementById(sPopupId);

    if (!popup)
        return;

    if (sTitle) {
        var titleSpans = popup.getElementsByClassName("rdPopupPanelTitleCaption");

        if (titleSpans && titleSpans.length) {
            titleSpans[0].innerText = sTitle;
        }
    }

    if (sContent) {
        var contentTrs = popup.getElementsByClassName("rdPopupContent");

        if (contentTrs && contentTrs.length) {
            var contentSpans = contentTrs[0].getElementsByTagName("SPAN");

            if (contentSpans && contentSpans.length) {
                contentSpans[0].innerText = sContent;
            }
        }
    }

    ShowElement(null, sPopupId, "Show", null);
}

function rdShowSingleElement(c, sAction, sId, sEffect, sNoResize) {
	if (Y.Lang.isValue(LogiXML)) {
		if (c.getAttribute("rdPopupPanel") == 'True' && !Y.Lang.isValue(LogiXML.PopupPanel.rdShowPopupPanel))
		    setTimeout(function () { rdShowSingleElement(c, sAction, sId, sEffect, sNoResize); }, 100);
		else		
		    _rdShowSingleElement(c, sAction, sId, sEffect, sNoResize);
	}
	else
	    setTimeout(function () { rdShowSingleElement(c, sAction, sId, sEffect, sNoResize); }, 100);
}

function _rdShowSingleElement(c, sAction, sId, sEffect, sNoResize) {
    //Show a single element.  "c" is the element itself.
	if(c.nodeName == "COL" && navigator.product == "Gecko" && navigator.productSub && navigator.productSub > "20041010" && (navigator.userAgent.indexOf("rv:1.8") != -1 || navigator.userAgent.indexOf("rv:1.9") != -1)) {
		//Allow table column hiding for Mozilla.
		c.style.display=""
		if (sAction=="Show"){
			c.style.visibility="";
		}else if (sAction=="Hide") {
			c.style.visibility="collapse";
		} else {
			c.style.visibility=(c.style.visibility=="" ? "collapse":"");  //Toggle.
		}
	} else {
		if (sAction=="Show"){
			c.style.display="";
		}else if (sAction=="Hide") {
		    c.style.display = "none";

		} else {
		    c.style.display = (c.style.display == "" ? "none" : "");

		}
	}
	
	if (sId) {
	    if (c.getAttribute("id")!="popupFilter" && c.getAttribute("rdNoElementShowHistory") != "True") { //Special case for this DG element and #14008.
	        var windowCurr = window
	        while (windowCurr) {
	            try {
	                var rdShowElementHistory = windowCurr.document.getElementById("rdShowElementHistory")
	                if (rdShowElementHistory) {
                        //20257
	                    var sOldState = sId + "=Hide,";
	                    rdShowElementHistory.value = rdShowElementHistory.value.replace(sOldState, "");
	                    sOldState = sId + "=Show,";
	                    rdShowElementHistory.value = rdShowElementHistory.value.replace(sOldState, "");

	                    rdShowElementHistory.value = rdShowElementHistory.value + sId + "=" + (c.style.display == "" ? "Show" : "Hide") + ","
    		        }
    		        try {
                        //If there's a parent, this is running as an IFRAME.  Add this shown element to the parent's ShowElementHistory. #6634
                        if (windowCurr.frameElement) {
                            windowCurr = windowCurr.parent
                        }else{
                            windowCurr = null
                        }
                    }
                    catch(e){
	                    windowCurr = null
	                    }
                    finally {}
	            }
                catch(e){
                    windowCurr = null
                    }
                finally {}
            }
        }
	}
	
	if (c.style.display != "none") {
       if (sEffect=="FadeIn" || typeof rdUseFadeIn != "undefined") {
	        rdFadeElementIn(c,250)
	    }
		
	    // Convert relevant RDIFRAMEs to IFRAMEs
       Y.each(Y.one(c).all('rdiframe'), function (nodeFrame) {
           if (LogiXML.isNodeVisible(nodeFrame)) {
               var sSrc = nodeFrame.getData("hiddensource");
               if (Y.Lang.isValue(sSrc))
                   rdConvertRdIFrame(nodeFrame.getDOMNode());
           }
       });

	    //Special handling for any IFrame subelements.
	    //Set the SRC attribute of all subordinate IFrames so that the requested pages are downloaded now.
       Y.each(Y.one(c).all('iframe'), function (nodeFrame) {
           if (LogiXML.isNodeVisible(nodeFrame)) {
               var sSrc = nodeFrame.getData("hiddensource");
               if (Y.Lang.isValue(sSrc)
                   && rdIFrameChanged(nodeFrame, sSrc)) {

                   try {   //In case there is an access-denied error.
                       nodeFrame._node.contentDocument.body.innerHTML = ""
                   } catch (e) { }

                   var postHandled = false;

                   if (Y.Lang.isValue(LogiXML.WaitPanel.pageWaitPanel))
                       postHandled = LogiXML.WaitPanel.pageWaitPanel.showFrameWait(nodeFrame);

                   if (!postHandled)
                       rdPostToIFrame(nodeFrame, sSrc);
               }
               if (iframeResize) {//frame content may be changed inside the iframe (like show/hide). We may reload it or just resize it.
                   iframeResize(nodeFrame._node);
               }
           }
       });

		if (c.getAttribute("rdPopupPanel")=="True") {            
            LogiXML.PopupPanel.rdShowPopupPanel(c)
            if(rdRepositionPopupPanel){ //#12931.
                rdRepositionPopupPanel(c, c.offsetHeight, c.offsetWidth, 1);
            }
		}

	    //Special for Bookmark renames and IE. 18917
		if (sId.indexOf("Bookmark") != -1) {
		    var nRowSuffixPos = sId.lastIndexOf("_Row")
		    if (nRowSuffixPos != -1) {
		        var sRowSuffix = sId.substr(nRowSuffixPos)
		        var eleBookmarkDesc = document.getElementById("txtEditBookmarkDescription" + sRowSuffix)
		        if (eleBookmarkDesc) {
                    try {
		                eleBookmarkDesc.focus(); eleBookmarkDesc.focus() //Set the focus twice to fix the input field.
                    }
		            catch (e) { }
		        }
		    }
		}

		if ( Y.Lang.isValue(Y.rdSlider) )
            rdShowHiddenInputSliders(c);        

    } else {  //Hiding    
        if (c.getAttribute("rdPopupPanel")=="True") {
            rdHidePopupPanelAndModalShade(c);
            Y.one('body').detach('keydown', rdHandlePopupKeyDown);
        }
	}

	//More special IFrame handling.  If this page is in a frame,
    //the frame needs to be resized from the parent window.

	var bNoResize = false;
	if (sNoResize && sNoResize == "true")
	    bNoResize = true;

	if (bNoResize == false) {
	    if (c.style.display == 'none')
	        rdResizeCurrentIFrame("OptionalParam");
	    else
	        rdResizeCurrentIFrame();
	}
        
	if (!(c.getAttribute("rdPopupPanel") == "True")) {
	    Y.each(Y.one(c).all(".rdChartCanvas"), function (chartNode) {
	        Y.LogiXML.ChartCanvas.reflowChart(chartNode);
	    });
	}	
}

function rdConvertRdIFrame(nodeFrame) {
    if (nodeFrame.tagName != "RDIFRAME")
        return;

    var iframe = document.createElement("IFRAME");
    var attr;
    for (var i = 0; i < nodeFrame.attributes.length; i++) {
        attr = nodeFrame.attributes[i];

        iframe.setAttribute(attr.name, attr.value);
    }

    // REPDEV-21552 iframe names need to be unique even in nested iframes or the form POST will hit the wrong one
    var origName = iframe.getAttribute("name");
    var newName = origName + "_" + Math.trunc(Math.random() * 100000);
    iframe.setAttribute("name", newName);

    nodeFrame.parentNode.insertBefore(iframe, nodeFrame);
    nodeFrame.parentNode.removeChild(nodeFrame);
}

function rdPostToIFrame(nodeFrame, sSrc) {
    var iFrameName = nodeFrame.getAttribute("name");

    var forms = document.getElementsByTagName("form");
    var form = null;

    for (var i = 0; i < forms.length; i++) {
        form = forms[i];

        if (form.target == iFrameName)
            break;

        form = null;
    }

    if (!form) {
        form = document.createElement("form");
        form.target = iFrameName;
        form.style.display = "none";
        document.body.appendChild(form);
    }
    else
        form.innerHTML = "";

    form.method = "post";

    var i = sSrc.indexOf("?");

    if (i > 0) {
        form.action = sSrc.substr(0, i);

        var qParams = LogiXML.getUrlParameters(sSrc);

        if (qParams && qParams.length) {
            for (i = 0; i < qParams.length; i++) {
                var kvp = qParams[i];

                var input = document.createElement("input");
                input.type = "hidden";
                input.name = kvp.name;

                if ("value" in kvp)
                    input.value = kvp.value;
                else
                    input.value = "";

                form.appendChild(input);
            }
        }
    }
    else
        form.action = sSrc;

    var nFrame = nodeFrame;

    setTimeout(function () {
        nFrame.removeAttribute("rdWaitingForSubmit");
        form.submit();
    }, 1);
}

function rdIFrameChanged(nodeFrame, sSrc) {

    //REPDEV-20467
    var docFrame = nodeFrame._node.contentDocument || nodeFrame._node.contentWindow.document;
    if (docFrame) {
        if (!docFrame.body || docFrame.body.innerHTML == "") {
            return true  //An IFrame ancestor has been RefreshElement'd, need to reload.
        }
    }

    var iFrameName = nodeFrame.getAttribute("name");

    var forms = document.getElementsByTagName("form");
    var form = null;

    for (var i = 0; i < forms.length; i++) {
        form = forms[i];

        if (form.target == iFrameName)
            break;

        form = null;
    }

    if (!form)
        return true;

    if (form.method != "post")
        return true;

    var i = sSrc.indexOf("?");
    var inputs = form.getElementsByTagName("input");

    if (i >= 0 && i < (sSrc.length - 1)) {
        var qsParms = sSrc.substr(i + 1).split("&");

        if (qsParms.length != inputs.length)
            return true;

        for (var j = 0; j < qsParms.length; j++) {
            var qsParm = qsParms[j];

            var kvp = qsParm.split("=");

            if (kvp[0]=='rdRnd') {
                return true; //frame with random numbers in url should be refreshed.
            }

            var found = false;

            for (var k = 0; k < inputs.length; k++) {
                var input = inputs[k];

                if (input.name == kvp[0]) {
                    if (input.value != decodeURIComponent(kvp[1]))
                        return true;

                    found = true;
                    break;
                }
            }

            if (!found)
                return true;
        }
    }
    else if (inputs.length)
        return true;

    return false;
}

function rdShowElementsFromHistory() {
    var hiddenShowElementHistory = document.getElementById("rdShowElementHistory");

	if (hiddenShowElementHistory) {
	    var sHistory = hiddenShowElementHistory.value;
	    var sEvents = sHistory.split(",");
	    var eleAction, sElementID, ele;

	    for (var i = 0; i < sEvents.length; i++) {
	        eleAction = sEvents[i].split("=");

	        sElementID = eleAction[0];

	        if (!sElementID)
	            continue;

	        ele = document.getElementById(sElementID);

			if (ele && ele.className.indexOf("rdDataCalendarPopUp") == -1)
			    ShowElement(null, sElementID, eleAction[1]);
	    }

		hiddenShowElementHistory.value = sHistory
	}
}

function rdColumnDisplayVisibility() {
	if(navigator.product == "Gecko" && navigator.productSub && navigator.productSub > "20041010" && (navigator.userAgent.indexOf("rv:1.8") != -1 || navigator.userAgent.indexOf("rv:1.9") != -1)) {
		var cCols = document.getElementsByTagName("COL")
		for (var i=0; i < cCols.length; i++) {
		    if (cCols[i].style.display == "none") {
			    cCols[i].style.display = null
			    cCols[i].style.visibility = "collapse"
		    }
		}
	}
}

function rdFadeElementIn(ele, nDuration){
    var node = Y.one(ele);
	node.setStyle('opacity', '0');		
	node.show();
	
	node.transition({
		duration: nDuration / 1000,
		opacity: {
					'value' : 1,
					'easing': 'ease-in'
		}
	});
}

function rdFadeElementOut(ele, nDuration){
   var node = Y.one(ele);
		
	node.transition({
		duration: nDuration / 1000,
		opacity: {
					'value' : 0,
					'easing': 'ease-in'
		}
	}, function() {
		this.hide();
	});		
}

function rdFindPosX(obj)
  {
    var curleft = 0;
    if (obj) {
        if(obj.offsetParent)
            while(1) 
            {
              curleft += obj.offsetLeft;
              if(!obj.offsetParent)
                break;
              obj = obj.offsetParent;
            }
        else if(obj.x)
            curleft += obj.x;
    }
    return curleft;
  }

function rdFindPosY(obj)
  {
    var curtop = 0;
    if (obj) {
        if(obj.offsetParent)
            while(1)
            {
              curtop += obj.offsetTop;
              if(!obj.offsetParent)
                break;
              obj = obj.offsetParent;
            }
        else if(obj.y)
            curtop += obj.y;
    }
    return curtop;
}

function rdSaveCheckboxListState(c) {
    var inputNode = c.parentNode.parentNode.nextSibling;
    var parentID = inputNode.id.split("_rdList")[0];

    var rdExpandCollapseHistory = document.getElementById(parentID + "_rdExpandedCollapsedHistory")
    var sOldState = "," + inputNode.id + ":expanded";
    rdExpandCollapseHistory.value = rdExpandCollapseHistory.value.replace(sOldState, "");
    sOldState = "," + inputNode.id + ":collapsed";
    rdExpandCollapseHistory.value = rdExpandCollapseHistory.value.replace(sOldState, "");

    if (inputNode.getAttribute("rdExpanded") == "true") {
        var parentID = inputNode.id.split("_")[0];
        rdExpandCollapseHistory.value = rdExpandCollapseHistory.value + "," + inputNode.id + ":collapsed";
        inputNode.setAttribute("rdExpanded", "false");
    }
    else {
        var parentID = inputNode.id.split("_")[0];
        rdExpandCollapseHistory.value = rdExpandCollapseHistory.value + "," + inputNode.id + ":expanded";
        inputNode.setAttribute("rdExpanded", "true");
    }
    Y.LogiXML.rdInputCheckList.prototype.expandCollapseChildren(inputNode);
}

function rdAddCssClass(ele, className) {
    if (!ele || !className)
        return false;

    var cssClasses = ele.className.split(" ");

    if (!cssClasses || !cssClasses.length)
        ele.className = className;
    else {
        var hasIt = false;
        var validCss = [];
        var cname;

        for (var i = 0; i < cssClasses.length; i++) {
            cname = cssClasses[i];

            if (cname) {
                validCss.push(cname);

                if (cname === className)
                    hasIt = true;
            }
        }

        if (!hasIt) {
            validCss.push(className);
            ele.className = validCss.join(" ");
        }
    }

    return true;
}

function rdRemoveCssClass(ele, className) {
    if (!ele || !className)
        return true;

    var cssClasses = ele.className.split(" ");

    if (!cssClasses || !cssClasses.length)
        return true;

    var validCss = [];
    var cname;

    for (var i = 0; i < cssClasses.length; i++) {
        cname = cssClasses[i];

        if (cname && cname !== className)
            validCss.push(cname);
    }

    ele.className = validCss.join(" ");

    return true;
}
