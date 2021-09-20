function rdAddBookmark(sActionId, sReport, sBookmarkReqIds, sBookmarkSessionIds, sCollection, sBookmarkName, sCust1, sCust2, sDescription, sDescriptionMessage, nRowNr, sBookmarkId, bIsNgpBookmark) {
    
    rdValidationRowNrFilter = nRowNr
	var sErrorMsg = rdValidateForm()
	if (sErrorMsg) {
        rdValidationRowNrFilter = undefined
		alert(sErrorMsg)
		return
	}
	
    var sDesc = sDescription
    if (sDescriptionMessage.length!=0){
        sDesc = rdParentPopupPanel.getElementsByTagName("Input")[0].value;
    } 
    
    //Get the list of request parameters.
    var sReqParams
    sReqParams = "&rdActionId=" + sActionId
    sReqParams += "&rdReport=" + sReport
    sReqParams += "&rdBookmarkReqIds=" + encodeURIComponent(sBookmarkReqIds)
    sReqParams += "&rdBookmarkSessionIds=" + encodeURIComponent(sBookmarkSessionIds)
    sReqParams += "&rdBookmarkCollection=" + encodeURIComponent(sCollection)
    sReqParams += "&rdBookmarkName=" + encodeURIComponent(sBookmarkName)
    sReqParams += "&rdBookmarkCustomColumn1=" + encodeURIComponent(sCust1)
    sReqParams += "&rdBookmarkCustomColumn2=" + encodeURIComponent(sCust2)
    sReqParams += "&rdBookmarkDescription=" + encodeURIComponent(sDesc)
    sReqParams += "&rdBookmarkID=" + encodeURIComponent(Y.Lang.isValue(sBookmarkId) ? sBookmarkId : '')
    if (bIsNgpBookmark) {
        var rdBookmarkUserName = document.getElementsByName("rdBookmarkUserName")[0];
        if(rdBookmarkUserName) {
            sReqParams += "&rdBookmarkUserName=" + rdBookmarkUserName.value;
        }
    }
	
	
	// This is added specifically for radio buttons. #23741
	var frm = document.rdForm
	if (sPrevRadioId) sPrevRadioId = "";
	for (var i=0; i < frm.elements.length; i++) {
		var ele = frm.elements[i]
	    
	    if (!ele.type) {
            continue;  //Not an input element.
	    }
		
		if (ele.type == "radio") {
			
			if (sReqParams.indexOf("&" + ele.name + "=") != -1) continue;
			
			var sInputValue =  rdGetInputValues(ele);
			if (sReqParams.indexOf(sInputValue) == -1)
	            sReqParams += sInputValue;	
		}
		else if (ele.type == "select-one" && ele.options[ele.selectedIndex]) {
		    sReqParams += "&" + ele.id + "=" + rdAjaxEncodeValue(ele.options[ele.selectedIndex].value); //RD21575		    
		}
	}

    if (sBookmarkReqIds) {
        var aIds = sBookmarkReqIds.split(",")
        for (var i = 0; i < aIds.length; i++) {
            var sId = aIds[i]
            if (sId && sId != "rdReport") {    //20783
                var ele = document.getElementById(sId);
                if (ele) {    //#12959.
                    //Changed to rdGetInputValues (defined in rdAjax2.js)
                    var sReqAdd = rdGetInputValues(ele); //RD19046, value might have already been added to the request, dont duplicate it.
                    if (sReqParams.indexOf(sReqAdd) == -1) {
                        sReqParams += rdGetInputValues(ele);
                    }
                }
                else if ((sReqParams.indexOf("&" + sId + "=") == -1) && document.getElementById("rdBookmarkReqId_" + sId)) {   //20099
                    sReqParams += "&" + sId + "=" + document.getElementById("rdBookmarkReqId_" + sId).innerHTML;
                }
            }
        }	
    }
	
    bSubmitFormAfterAjax = true
    rdValidationRowNrFilter = nRowNr  
    rdAjaxRequest("rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddBookmark" + sReqParams)
    rdValidationRowNrFilter = undefined
    //19809   
    if(typeof(rdParentPopupPanel) !== "undefined"){
        ShowElement(this.id,rdParentPopupPanel.id,'Hide')
    }
}

function rdEditBookmark(sActionId, sReport, BookmarkCollection, BookmarkID, sDescription, sDescriptionMessage, nRowNr, eleUpdateId) {
    rdValidationRowNrFilter = nRowNr
	var sErrorMsg = rdValidateForm()
	if (sErrorMsg) {
        rdValidationRowNrFilter = undefined
		alert(sErrorMsg)
		return
	}

    var sDesc = sDescription
    if (sDescriptionMessage.length!=0){
        sDesc = rdParentPopupPanel.getElementsByTagName("Input")[0].value;
    }
    
    var sReqParams
    sReqParams  = "&rdActionId=" + sActionId
    sReqParams += "&rdReport=" + sReport
    sReqParams += "&rdBookmarkCollection=" + BookmarkCollection
    sReqParams += "&rdBookmarkID=" + BookmarkID
    sReqParams += "&rdBookmarkDescription=" + rdAjaxEncodeValue(sDesc)
    bSubmitFormAfterAjax = true //#12541.
    rdValidationRowNrFilter = nRowNr
    rdAjaxRequest("rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=EditBookmark" + sReqParams)
    rdValidationRowNrFilter = undefined

   
   if(rdParentPopupPanel){        
        ShowElement(this.id,rdParentPopupPanel.id,'Hide')
    }
    
    if (eleUpdateId) {
        //Special for ReportCenter. Update the text.
        var eleUpdate = document.getElementById(eleUpdateId)
        if (eleUpdate) {
           if (eleUpdate.textContent != undefined) {
                eleUpdate.textContent = sDesc //Mozilla, Webkit
            } else {
                eleUpdate.innerText = sDesc //IE
            }
        }
    }

}

function rdCopyBookmark(sActionId, sReport, SourceBookmarkCollection, SourceBookmarkUsername, DestinationBookmarkCollection, BookmarkID, SharedBookmarkID, sAcknowledge, sCopiedDescription) {

    var sReqParams
    sReqParams = "&rdActionId=" + sActionId
    sReqParams += "&rdReport=" + sReport
    sReqParams += "&rdSourceBookmarkCollection=" + SourceBookmarkCollection
    sReqParams += "&rdSourceBookmarkUsername=" + SourceBookmarkUsername
    sReqParams += "&rdDestinationBookmarkCollection=" + DestinationBookmarkCollection
    sReqParams += "&rdBookmarkID=" + BookmarkID
    sReqParams += "&rdSharedBookmarkID=" + SharedBookmarkID
    sReqParams += "&rdCopiedBookmarkDescription=" + sCopiedDescription
    sReqParams += "&rdAcknowledgeMessage=" + rdAjaxEncodeValue(sAcknowledge)
    //bSubmitFormAfterAjax = true //#12541, #10184.

    rdAjaxRequest("rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=CopyBookmark" + sReqParams)

}

function rdSelectBookmark(sBookmarkID, bSelect) {
    if (!sBookmarkID)
        return;

    if (!bSelect || bSelect.toString().toUpperCase() === "FALSE")
        return rdDeselectBookmark(sBookmarkID);

    var selected = rdGetSelectedBookmarks();
    if (selected.indexOf(sBookmarkID) >= 0)
        return;

    selected.push(sBookmarkID);

    document.getElementById("rdBookmarkBatch").value = selected.join(',');
}

function rdGetSelectedBookmarks() {
    var hdnBatch = document.getElementById("rdBookmarkBatch");

    if (!hdnBatch.value)
        return [];

    return hdnBatch.value.split(',');
}

function rdDeselectBookmark(sBookmarkID) {
    if (!sBookmarkID)
        return;

    var selected = rdGetSelectedBookmarks();
    var i = selected.indexOf(sBookmarkID);
    if (i < 0)
        return;

    selected.splice(i, 1);

    document.getElementById("rdBookmarkBatch").value = selected.join(',');
}

function rdClearSelectedBookmarks() {
    var hdnBatch = document.getElementById("rdBookmarkBatch");
    if (!hdnBatch || !hdnBatch.value)
        return;

    hdnBatch.value = "";

    var bo = Y.one("#" + document.getElementById("rdBookmarkOrganizerID").value);
    if (bo)
        bo.fire("selectioncleared");
}

function rdRemoveBookmark(sActionId, sReport, BookmarkCollection, sBookmarkUserName, BookmarkID, sConfirm, eleRemoveId, sReportCenterID, nRowNr) {
    if (!(Y.Lang.isValue(BookmarkCollection) && BookmarkCollection != '')) {
        return; //Do not do anything when the bookmark collection is not provided, #19472.
    }

    var sReqParams
    sReqParams  = "&rdActionId=" + sActionId
    sReqParams += "&rdReport=" + sReport
    sReqParams += "&rdBookmarkCollection=" + BookmarkCollection
    sReqParams += "&rdBookmarkUserName=" + sBookmarkUserName

    var hdnBatch = document.getElementById("rdBookmarkBatch");
    var sNotifyCommand;
    if (hdnBatch && hdnBatch.value) {
        sNotifyCommand = "RemoveBookmarkBatch";
        sReqParams += "&rdBookmarkBatch=" + hdnBatch.value;
    } else {
        sNotifyCommand = "RemoveBookmark";
        sReqParams += "&rdBookmarkID=" + BookmarkID
    }

    rdClearSelectedBookmarks();

    bSubmitFormAfterAjax = true //#12541, #10184.

    var callback;
    
    if (!sReportCenterID)
        callback = null;
    else {
        callback = function () {
            rdAjaxRequest('rdAjaxCommand=RefreshElement&rdReport=' + this.sReport + '&rdRefreshElementID=' + this.sReportCenterID)
        }.bind({
            sReport: sReport,
            sReportCenterID: sReportCenterID
        });
    }

    rdAjaxRequest("rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=" + sNotifyCommand + sReqParams, null, null, null, callback);
}

function rdShareBookmarkOrFolder(sActionId, sReport, BookmarkCollection, BookmarkID, FolderID, sharedWith, refreshDTID, bFromInput, acknowledgeMessage, sharedWithDisp) {   

    var isSpanNode = false;
	var sRowId = "";
    
    var sReqParams = "rdAjaxCommand=rdAjaxNotify";

	//BookmarkID or FolderID ?
    if (BookmarkID)
        sReqParams += "&rdNotifyCommand=ShareBookmark";
    else
        sReqParams += "&rdNotifyCommand=ShareBookmarkFolder";

    sReqParams += "&rdActionId=" + sActionId
	    + "&rdReport=" + sReport
	    + "&rdBookmarkCollection=" + BookmarkCollection
	    + "&rdBookmarkID=" + BookmarkID
	    + "&rdFolderID=" + FolderID
	    + "&rdRefreshDTID=" + refreshDTID;

    if (bFromInput == "False") {
        sReqParams += "&rdSharedCollection=" + sharedWith;
        //feature/REPDEV-22683-SSM-Sharing-with-UserID-but-Searching-by-Name
        //Shared user display name
        if (sharedWithDisp) {
            sReqParams += "&rdSharedCollectionDispName=" + sharedWithDisp;
        }

	} else {

        var sSharedWith = "&rdSharedCollection=";
	    var sharedNode = Y.one("#" + sharedWith);
	    if (!Y.Lang.isNull(sharedNode)) {
	        sSharedWith  += sharedNode.get('value');
	        if (sharedNode._node.tagName == 'SPAN') {
	            sSharedWith += sharedNode._node.innerHTML;
	            isSpanNode = true;
	            var n = sharedWith.lastIndexOf("_");
	            sRowId = "actShareBookmarkFromDataLayer_" + sharedWith.substring(n + 1);
	        }
	    }

	    //exit if sharedWith is undefined or an empty string. 24839
	    if (sSharedWith == "&rdSharedCollection=")
            return;

	    sReqParams += sSharedWith;
    }

	sReqParams += "&rdSharedFromInput=" + bFromInput;
	
    var sRefreshParams = "rdAjaxCommand=RefreshElement"
        + "&rdRefreshElementID=rowBookmarkSharedWith"
        + "&rdReport=" + sReport
        + "&rdBookmarkCollection=" + BookmarkCollection
        + "&rdBookmarkID=" + BookmarkID
        + "&rdFolderID=" + FolderID;

    var callback = function (xhr) {
        if (!xhr || !xhr.responseXML || !xhr.responseXML.documentElement)
            return;

        var attrSuccess = xhr.responseXML.documentElement.getAttribute("ActionSuccess");

        if (!attrSuccess || attrSuccess.toLowerCase() != "true")
            return;

        // success! refresh the shared-with list

        if (this.isSpanNode == true) {
            var sharedTextNode = document.createElement("span");
            sharedTextNode.textContent = "Shared!"
            var sharedButton = document.getElementById(this.sRowId).parentNode;
            sharedButton.parentNode.replaceChild(sharedTextNode, sharedButton);
        }

        // go to last page to show the sharing was successful
        // 536868412 = magic number for last page when rows per page is 4 "(Integer.MaxValue - 10000) / nPageRowCount"
        this.sRefreshParams += "&dtBookmarkSharedWith-PageNr=536868412"
            + "&rdNewPageNr=True2"
            + "&rdCancelPreviousPagingRequests=dtBookmarkSharedWith";

        //Update sharing user list element
        rdAjaxRequestWithFormVars(this.sRefreshParams, null, null, null, null, null, ['', '', ''], null);
    }.bind({
        isSpanNode: isSpanNode,
        sRowId: sRowId,
        sRefreshParams: sRefreshParams
    });

    rdAjaxRequestWithFormVars(sReqParams, null, null, null, null, callback, ['', '', ''], null);

	//Clear out the input text box	
	document.getElementById("InpUser").value = "";
}

function rdUnShareBookmarkOrFolder(sActionId, sReport, BookmarkCollection, BookmarkID, FolderID, unSharedWith, refreshDTID) {   
		
    var sReqParams = "rdAjaxCommand=rdAjaxNotify";

	//BookmarkID or FolderID
    if (BookmarkID)
        sReqParams += "&rdNotifyCommand=UnShareBookmark";
    else
        sReqParams += "&rdNotifyCommand=UnShareBookmarkFolder";

    sReqParams += "&rdActionId=" + sActionId;
    sReqParams += "&rdReport=" + sReport;
    sReqParams += "&rdBookmarkCollection=" + BookmarkCollection;
    sReqParams += "&rdBookmarkID=" + BookmarkID;
    sReqParams += "&rdFolderID=" + FolderID;
    sReqParams += "&rdRefreshDTID=" + refreshDTID;
    sReqParams += "&rdRemoveCollections=";
	var sharedNode = Y.one("#" + unSharedWith);
	if (!Y.Lang.isNull(sharedNode)) {
		sReqParams += sharedNode.get('value');
		if (sharedNode._node.tagName == 'SPAN') {
			sReqParams += sharedNode._node.innerHTML;
		}
    }

    var sRefreshParams = "rdAjaxCommand=RefreshElement"
        + "&rdRefreshElementID=rowBookmarkSharedWith"
        + "&rdReport=" + sReport
        + "&rdBookmarkCollection=" + BookmarkCollection
        + "&rdBookmarkID=" + BookmarkID
        + "&rdFolderID=" + FolderID;

    // preserve current page
    var elePageNo = document.getElementById("dtBookmarkSharedWith-rdNumberedCurrPageNr");
    if (elePageNo) {
        var iPageNo = parseInt(elePageNo.innerText);
        if (!isNaN(iPageNo) && iPageNo > 0) {
            sRefreshParams += "&dtBookmarkSharedWith-PageNr=" + iPageNo
                + "&rdNewPageNr=True2"
                + "&rdCancelPreviousPagingRequests=dtBookmarkSharedWith";
        }
    }

    var callback = function (xhr) {
        // Unsharing complete - Update sharing user list element
        rdAjaxRequestWithFormVars(sRefreshParams, null, null, null, null, null, ['', '', ''], null);	
    }.bind({
        sRefreshParams: sRefreshParams
    });
	
    rdAjaxRequest(sReqParams, null, null, null, callback, ['', '', ''], null);	
}

function rdAddBookmarkNgpSave(sActionId, sReport, sBookmarkReqIds, sBookmarkSessionIds, sCollection, sBookmarkName, sCust1, sCust2, sDescription, sDescriptionMessage, nRowNr, sBookmarkId){
    var rdSaveASNewHiddenInput = Y.one('#rdSaveASNew');

    if (rdSaveASNewHiddenInput) {
        rdSaveASNewHiddenInput.set('value', 'saveAsNew');
    }
    
    rdAddBookmark(sActionId, sReport, sBookmarkReqIds, sBookmarkSessionIds, sCollection, sBookmarkName, sCust1, sCust2, sDescription, sDescriptionMessage, nRowNr, sBookmarkId, true);

}


function isInfoGo() {
    var ret;
    var goHome = Y.one('#rdBookmarkOrganizerReport');
    var infoTest = goHome.get("value");
    //console.log(goHome, infoTest);

    (infoTest == 'InfoGo.goHome') ? ret = true : ret = false;
   
    return ret;
}