
function rdOgShowTabsState(sPanelIdentifier) {
	rdOgShowTabState("Dimension", sPanelIdentifier)
	rdOgShowTabState("Measure", sPanelIdentifier)
	rdOgShowTabState("CalculatedMeasure", sPanelIdentifier)
	rdOgShowTabState("Filter", sPanelIdentifier)
	rdOgShowTabState("Chart", sPanelIdentifier)
	rdOgShowTabState("Heatmap", sPanelIdentifier)
}

function rdOgShowTabState(sTabName, sPanelName) {
	var elePanel = document.getElementById("row" + sTabName)
	if (elePanel) {
		var eleTab = document.getElementById("col" + sTabName)
		if (eleTab) {
			if (elePanel.style.display == "none") {
				eleTab.setAttribute("CLASS","rdOgUnselectedTab")
				eleTab.setAttribute("className","rdOgUnselectedTab")//for IE7

			} else {
				eleTab.setAttribute("CLASS","rdOgSelectedTab")
				eleTab.setAttribute("className","rdOgSelectedTab")  //for IE7

				elePanel.style.display = '';
				if(sPanelName == sTabName)  //#11734.
					rdFadeElementIn(elePanel.firstChild,400);
			}
		}
	}
}

function rdOgHideRemainingTabs(sPanelId){
	var aPanels = new Array("Dimension", "Measure", "CalculatedMeasure", "Filter");
	for(i=0;i<aPanels.length;i++){
		var elePanel = document.getElementById("row" + aPanels[i]);
		if(elePanel)
			if(elePanel.id != sPanelId)
				if(elePanel.style.display != "none")
					ShowElement(elePanel.parentNode.id, elePanel.id, 'Hide');

	}
}

// javascript:rdOgBatchCommand("DimAddLeft","otOlapGrid", 1, "@Data.rdUNIQUE_NAME~")
//Handle the UI.
function rdOgBatchCommand(sCommand, sOgTableID, sDimension, sGUID) {

	document.rdForm.rdOgBatchCommands.value += sCommand + "," + sDimension + ";"

	var eleClickedLink = rdFindLink(sGUID)
	var eleClickedImage = eleClickedLink.firstChild

	switch (sCommand) {
		case 'DimAddLeft':
		    eleClickedLink.href = eleClickedLink.href.replace("DimAddLeft", "DimDelLeft")
		    eleClickedImage.src = eleClickedImage.src.replace("AddLeft", "DelDim").replace("AddTop", "DelDim")
			eleClickedImage.title = "Remove this Dimension from the table."
			break;
		case 'DimAddTop':
			eleClickedLink.href = eleClickedLink.href.replace("DimAddTop","DimDelTop")
			eleClickedImage.src = eleClickedImage.src.replace("AddLeft", "DelDim").replace("AddTop", "DelDim")
			eleClickedImage.title = "Remove this Dimension from the table."
			break;
		case 'DimDelLeft':
			eleClickedLink.href = eleClickedLink.href.replace("DimDelLeft","DimAddLeft")
			eleClickedImage.src = eleClickedImage.src.replace("DelDim", "AddLeft").replace("AddTop", "AddLeft")
			eleClickedImage.title = "Move this Dimension to the Left axis."
			break;
		case 'DimDelTop':
			eleClickedLink.href = eleClickedLink.href.replace("DimDelTop","DimAddTop")
			eleClickedImage.src = eleClickedImage.src.replace("DelDim", "AddTop").replace("AddLeft", "AddTop")
			eleClickedImage.title = "Move this Dimension to the Top axis."
			break;
		case 'MeasureAdd':
			eleClickedLink.href = eleClickedLink.href.replace("Add","Del")
			eleClickedImage.src = eleClickedImage.src.replace("AddMeasure", "DelDim")
			eleClickedImage.title = "Remove this Measure from the table."
			break;
		case 'MeasureDel':
			eleClickedLink.href = eleClickedLink.href.replace("Del","Add")
			eleClickedImage.src = eleClickedImage.src.replace("DelDim", "AddMeasure")
			eleClickedImage.title = "Add this Measure to the table."
			break;
	}

	//Dimension links
	if (sCommand.indexOf("Dim")!=-1){
		var elePartnerLink
		var elePartnerImage
		if (sCommand.indexOf("DimAdd")==0){
			//Clicked a Dimension.  May have to change the "partner" link too.
			if (sCommand.indexOf("Left")!=-1){
				//Get the "Top" link.
				elePartnerLink = eleClickedLink.nextSibling.nextSibling
			} else {
				//Get the "Left" link.
				elePartnerLink = eleClickedLink.previousSibling.previousSibling
			}
			elePartnerImage = elePartnerLink.firstChild

			elePartnerLink.href = elePartnerLink.href.replace("DimDel","DimAdd")
			switch (sCommand) {
				case 'DimAddLeft':
					elePartnerImage.src = elePartnerImage.src.replace("DelDim","AddTop")
					elePartnerImage.title = "Move this Dimension to the Top axis."
					break;
				case 'DimAddTop':
					elePartnerImage.src = elePartnerImage.src.replace("DelDim","AddLeft")
					elePartnerImage.title = "Move this Dimension to the Left axis."
					break;
			}
		}

		//Hide the message about adding a left dimension.
		if (sCommand=="DimAddLeft"){
			var eleLeftError = document.getElementById("divDimensionError-NoLeft")
			if (eleLeftError) {eleLeftError.style.display="none"}
		}
	}

	//Show the Update Table button.
	if (sCommand.indexOf("Dim")!=-1){
		var eleUpdateDimensions = document.getElementById("divBatchUpdateTableDims")
		eleUpdateDimensions.style.display=""
	} else {
		var eleUpdateDimensions = document.getElementById("divBatchUpdateTableMeasures")
		eleUpdateDimensions.style.display=""
	}
}

function rdFindLink(sGUID) {
    var cA = document.getElementsByTagName("A");
    for (var i = 0; i < cA.length; i++) {
        var sClick = cA[i].getAttribute("onclick"); //REPDEV-24322
        if (sClick != undefined) {
            sClick = sClick.replace("\x22", /"/g);
            if (sClick.indexOf(sGUID) != -1) {
                return cA[i];
            }
        }
	}
}

function rdOgBatchDrilldownAll(sDrilldownDimension) {
    if(document.rdForm.rdOgBatchCommands != null){
        document.rdForm.rdOgBatchCommands.value = ""
    }

	var cA = document.getElementsByTagName("A")
    var sUrl = null;
	var sDrilldownPositions = ""
    for (var i = 0; i < cA.length; i++) {
        var url = LogiXML.getScriptFromLink(cA[i], true);
        if (LogiXML.getUrlParameter(url, "rdOgCommand") == "Drill") {
            if (LogiXML.getUrlParameter(url, "rdOlapTableID") == "otOlapGrid") { //11670
                if (LogiXML.getUrlParameter(url, "rdDrilldownDimension") == sDrilldownDimension) { //11673, 15289
					if (LogiXML.getUrlParameter(url, "rdDrilledDown") == "False") {
						if (url.indexOf("rdOgBlank.gif") == -1) {  //12247
							//This is a drilldown link under the particular dimension.
							var sDrilldownPos = LogiXML.getUrlParameter(url, "rdDrilldownPosition") //Get just the drilldown value.

							if (!sUrl) {  //Do this just on the first loop.
								//Remove from the link.  Gets added as a form var below because it's too big.
                                sUrl = LogiXML.removeUrlParameter(url, "rdDrilldownPosition");
							}

                            //// %5b = "[" open square bracket, %5d = "]" close square bracket, %25 = "%" percent sign
							//if (sDrilldownPos.indexOf("%5b")==0) {
							//	//IE6 does a different encoding when it returns the HREF.  4508
							//	sDrilldownPos = sDrilldownPos.replace(/%5b/g,"%255b").replace(/%5d/g,"%255d")
							//}
							//sDrilldownPos = sDrilldownPos.replace(/%20/g," ") //11673

							sDrilldownPositions += sDrilldownPos + ","
						}
					}
				}
			}
		}
	}

	if (sDrilldownPositions.length!=0) {
		hiddenDrilldownPosition=document.createElement("INPUT");
		hiddenDrilldownPosition.type="HIDDEN"
		hiddenDrilldownPosition.id="rdDrilldownPosition"
		hiddenDrilldownPosition.name="rdDrilldownPosition"
		hiddenDrilldownPosition.value=sDrilldownPositions
		document.rdForm.appendChild(hiddenDrilldownPosition);
		SubmitForm(sUrl, '', 'false', '', false); // 15289 - REPDEV-24135
	}
}

var rdFiltersHandler;

// Handle events for the Filter PopupPanel. Run when the page is loaded.
// Look in this element to re-click previously-clicked positions.
// Load previous clicks into the collection.
function rdInitFilterClicks() {
	if (location.href.indexOf("rdShowFilterPopup")==-1) {
		return;
	}

	rdFiltersHandler = new rdOgFilterPanelHandler();
	rdFiltersHandler.initFilterHandler();
}

// One of the filter checkboxes has been clicked.
// Save the checked state in an element passed back and forth from the server.
// Set the element that will be used by script to reset checks, and also used
// on the server side to set the filters.
function rdOgFilterMember(nRowNr, sFilterDimension) {
	rdFiltersHandler.filterMemberClicked(nRowNr, sFilterDimension);
}

function rdOgFilterPanelHandler() {

	this.rdFiltersDict = null;

	// Handle events for the Filter PopupPanel. Run when the page is loaded.
	// Look in this element to re-click previously-clicked positions.
	// Load previous clicks into the collection.
	this.initFilterHandler = function() {
		if (location.href.indexOf("rdShowFilterPopup")==-1) {
			return;
		}

		var eleHiddenFilterDimension = document.getElementById("hiddenFilterDimension") ;

		//Load up the click history.
		var eleFilterClicks = document.getElementById("rdFilterClickHistory");
		this.rdFiltersDict = this.clicksStringToDictionary(eleFilterClicks.value);

		//Set clicked state based on previous clicks.
		var i = 1;
		eleChk = document.getElementById("chkFilter_Row" + i);
		while (eleChk) {
			var sPosition = this.getOgFilterPosFromRow(i);
			var state = this.rdFiltersDict.lookupEnc(sPosition);
			switch(state) {
				case "some":
					eleChk.setAttribute("rdCheckState","some");
					break;
				case "true":
					eleChk.setAttribute("rdCheckState","true");
					break;
				case "false":
					eleChk.setAttribute("rdCheckState","false");
					break;
				default: //Not set, get the checked state from the parent.
					if (i==1) {
						eleChk.setAttribute("rdCheckState","true");
					}
					else {
						eleChk.setAttribute("rdCheckState",this.getParentCheckedState(sPosition,i));  //Always true or false.
					}
			}
			i += 1;
			eleChk = document.getElementById("chkFilter_Row" + i);
		}
		var nRowCnt = i - 1;

		this.updateParentStates(nRowCnt);
		this.updateCheckboxAppearance();
	}

	// One of the filter checkboxes has been clicked.
	// Save the checked state in an element passed back and forth from the server.
	// Set this element that will be used by script to reset checks,
	// and also used on the server side to set the filters.
	this.filterMemberClicked = function(nRowNr, sFilterDimension) {
		var eleClicked = document.getElementById("chkFilter_Row" + nRowNr);
		var sClickedPosition = this.getOgFilterPosFromRow(nRowNr);

		if (eleClicked.checked == false && eleClicked.getAttribute("rdCheckState") == "some") {
			eleClicked.checked = true;   //Reset it from "some" to checked.
		}

		//Handle auto-checking of child nodes and dimming of parent nodes.
		var i = 1;
		var eleChk = document.getElementById("chkFilter_Row" + i);
		while (eleChk) {
			if(eleChk.id != "chkFilter_Row" + i)
				break; //#12925.
			var sPosition = this.getOgFilterPosFromRow(i);
			if (sPosition == sClickedPosition) {
				 //This checkbox was the one clicked.
				eleChk.setAttribute("rdCheckState", eleChk.checked.toString());
			}
			else if (sPosition.indexOf(sClickedPosition) == 0) {
				//This checkbox is a child of the clicked one.
				eleChk.setAttribute("rdCheckState",eleClicked.checked.toString());
			}
			i += 1;
			eleChk = document.getElementById("chkFilter_Row" + i);
		}
		var nRowCnt = i - 1;

		//Loop back through backwards
		for (i=i-1; i>0; i--) {
			var eleChk = document.getElementById("chkFilter_Row" + i);
			var sPosition = this.getOgFilterPosFromRow(i);

			if (this.rdFiltersDict.lookupEnc(sPosition)) {
				this.rdFiltersDict.deleteEnc(sPosition);  //Remove the old click record for this position.
			}
			this.rdFiltersDict.deleteEnc(sPosition);
			var sClicked = eleChk.getAttribute("rdCheckState");
			var posEntry = new rdOgPosEntry(sPosition, sClicked);
			this.rdFiltersDict.addPos(posEntry);
		}

		this.updateParentStates(nRowCnt);
		this.updateCheckboxAppearance();

		// Remove the save state of all child positions of the clicked one. Only need history for Positions with "some".
		this.rdFiltersDict.deleteChildPos(sClickedPosition);

		var eleFilterClicks = document.getElementById("rdFilterClickHistory");
		eleFilterClicks.value = this.clicksDictionaryToString(this.rdFiltersDict);

		// Hide the Done button if the first row is un-checked.
		if (document.getElementById("chkFilter_Row1").getAttribute("rdCheckState")=="false"){
			ShowElement(null,"lblFilterDone",'Hide');
		}
		else {
			ShowElement(null,"lblFilterDone",'Show');
		}
	}

	this.updateParentStates = function(nRowCnt) {
		//Loop back through backwards
		for (i=nRowCnt-1; i>0; i--) {
			// set the state for parent positions
			var eleChk = document.getElementById("chkFilter_Row" + i);
			var sPosition = this.getOgFilterPosFromRow(i);
			var sCurrState = this.getDescendantCheckedState(eleChk,sPosition);
			switch (sCurrState) {
				case "?":  //No open descendants
					break;
				default: // some, true or false
					if (eleChk.getAttribute("rdCheckState") != sCurrState) {
						eleChk.setAttribute("rdCheckState",sCurrState);
						this.rdFiltersDict.deleteEnc(sPosition);
						var sChecked = eleChk.getAttribute("rdCheckState");
						var posEntry = new rdOgPosEntry(sPosition, sChecked);
						this.rdFiltersDict.addPos(posEntry);
					}
					break;
			}
		}
	}

	this.updateCheckboxAppearance = function() {
		var i = 1;
		var eleChk = document.getElementById("chkFilter_Row" + i);
		while (eleChk) {
			//Set the state of each checkbox from the rdCheckState attribute.
			switch (eleChk.getAttribute("rdCheckState")) {
				case "some":
					this.setCheckboxOpacity(eleChk,.3);
					eleChk.checked=true;
					break;
				case "true":
					this.setCheckboxOpacity(eleChk,1);
					eleChk.checked=true;
					break;
				case "false":
					this.setCheckboxOpacity(eleChk,1);
					eleChk.checked=false;
					break;
			}
			i += 1;
			eleChk = document.getElementById("chkFilter_Row" + i);
		}
	}

	// Return "true", "false" or "some" depending on the checked state of descendants.
	this.getDescendantCheckedState = function(eleAncestorChk, sAncestorPosition) {
		var sReturn = "?";
		var i = 1;
		var eleChk = document.getElementById("chkFilter_Row" + i);
		while (eleChk) {
			if(eleChk.id != "chkFilter_Row" + i) break; //#12925.
			var sPosition = this.getOgFilterPosFromRow(i);
			if (sPosition != sAncestorPosition  && sPosition.indexOf(sAncestorPosition) == 0) {
				// This checkbox is a descendant.
				if (sReturn == "?") {
					sReturn = eleChk.getAttribute("rdCheckState");
				}
				else if(sReturn != eleChk.getAttribute("rdCheckState")) {
					return "some";
				}
			}
			i += 1;
			eleChk = document.getElementById("chkFilter_Row" + i);
		}
		return sReturn;
	}

	// Return "true", "false" or "some" depending on the checked state of the parent position.
	this.getParentCheckedState = function(sChildPosition, i) {
		// Loop back through backwards
		for (i=i-1; i>0; i--) {
			var sPosition = this.getOgFilterPosFromRow(i);
			if (sChildPosition.indexOf(sPosition) == 0) {
				//This is the parent.
				var eleChk = document.getElementById("chkFilter_Row" + i);
				return eleChk.getAttribute("rdCheckState");
			}
		}
		return "true";  //Should never get this far.
	}

	this.setCheckboxOpacity = function(eleChk,alpha){
		Y.one(eleChk).setStyle('opacity', alpha); //21668
	}

	this.getOgFilterPosFromRow = function(rowNum) {
		var rowEl = document.getElementById("lblFilterPosition_Row" + rowNum);
		var pos = rowEl.innerHTML;
		return pos;
	}

	// Gather the current state of the filters by position string.
	this.clicksDictionaryToString = function(dictClicks) {
		var sClicks = "";
		for(i=0; i < dictClicks.rdKeys.length; i++) {
			var sDecPos = dictClicks.rdKeys[i];
			var posEntry = dictClicks[sDecPos];
			sClicks += posEntry.enc + "_rdClk_" + posEntry.state + "_rdEnd_";
		}
		return sClicks;
	}

	// Extract the current state of the filters from the incoming hidden input value.
	this.clicksStringToDictionary = function(sClicks) {
		var dict = new rdOgPosDictionary();
		var clicks = sClicks.split(/_rdEnd_/);
		for (var i=0; i<clicks.length; i++) {
			if(clicks[i].length > 0) {
				var posAndState = clicks[i].split(/_rdClk_/);
				var sPosition = posAndState[0];
				var sClicked = posAndState[1];
				var posEntry = new rdOgPosEntry(sPosition, sClicked);
				dict.addPos(posEntry);
			}
		}
		return dict;
	}
}

function rdOgRemoveSpecChars(html) {
	var dec = html;
	// Replace ampersand first in case of doubly escaped
	// characters (&amp;gt;)
	dec = dec.replace(/&amp;/g, "&");
	dec = dec.replace(/&lt;/g, "<");
	dec = dec.replace(/&gt;/g, ">");
	dec = dec.replace(/&quot;/g, '"');
	dec = dec.replace(/&apos;/g, "'");
	dec = dec.replace(/&copy;/g, "\xa9");
	dec = dec.replace(/&reg;/g, "\xae");
	return dec;
}

// Store the (possibly) HTML encoded position string and a
// decoded version to avoid missing a position due to changes
// in the encoding by rdState.
function rdOgPosEntry(html, st) {
	this.enc = html;
	this.dec = rdOgRemoveSpecChars(html);
	this.state = st;
}

// Keep track of the state of the filters by position string.
function rdOgPosDictionary() {
	this.rdKeys = new Array();

	// Find state by decoded position string.
	this.lookupDec = function(dec) {
		var state = "";
		try {
			var thePos = this[dec];
			if (thePos) {
				state = thePos.state;
			}
		}
		catch (e) {
		}
		return state;
	}

	// Find state by (possibly) HTML encoded position.
	this.lookupEnc = function(enc) {
		var dec = rdOgRemoveSpecChars(enc);
		return this.lookupDec(dec);
	}

	// Delete position entry by decoded position string.
	this.deleteDec = function(dec) {
		this[dec] = null;
		this.adjustKeys();
	}

	// Delete position entry by (possibly) HTML encoded position.
	this.deleteEnc = function(enc) {
		var dec = rdOgRemoveSpecChars(enc);
		var thisPos = this[dec];
		if (thisPos)
		{
			var dec = thisPos.dec;
			this.deleteDec(dec);
		}
	}

	// Delete child position entries for the given position string.
	this.deleteChildPos = function(encParentPos) {
		var i = 0;
		for(i=this.rdKeys.length-1; i > -1; i--) {
			var dec = this.rdKeys[i];
			var posEntry = this[dec];
			sPosition = posEntry.enc;
			if (sPosition != encParentPos && sPosition.indexOf(encParentPos)!=-1) {
				this.deleteEnc(sPosition);
			}
		}
	}

	this.adjustKeys = function() {
		var keys = new Array();
		for (var i=0; i<this.rdKeys.length; i++)
		{
			if(this[this.rdKeys[i]] != null)
				keys[keys.length] = this.rdKeys[i];
		}
		this.rdKeys = keys;
	}

	// Add a position entry to the dictionary.
	this.addPos = function(posEntry) {
		this[posEntry.dec] = posEntry;
		this.rdKeys[this.rdKeys.length] = posEntry.dec;
	}
}
