var rdMetadataPopupParams;
var rdMetadataPopupEditRowId;
var rdMetadataWaitCnf = ['', '', ''];

function getRdDataCacheKey() {
    var hdn = document.getElementById('rdMetadataCache');

    if (hdn && hdn.value)
        return hdn.value;

    return "";
}

function rdMetadataCompact() {
    var sMetadataID = document.getElementById("hiddenMetadataID").value;
    var sParams = "MetadataID=" + encodeURIComponent(sMetadataID);

    rdMetadataSetValue(null, "CompactMetadata", sParams, true);
}

function rdMetadataRefresh() {
    var sHref = window.location.href

    if (document.getElementById("hiddenConnectionID")) {
        //For ConnectionEdit.lgx, change the ConnectionID to the new value, in case it was changed.
        sHref = rdRemoveQueryStringParameter(sHref, "OldConnID");
        sHref = sHref.replace("ConnectionID=", "ConnectionID=" + document.getElementById("hiddenConnectionID").value + "&OldConnID=")
    }

    if (document.getElementById("hiddenMetadataID")) {
        sHref = rdRemoveQueryStringParameter(sHref, "OldMetadataID");
        sHref = sHref.replace("MetadataID=", "MetadataID=" + document.getElementById("hiddenMetadataID").value + "&OldMetadataID=")
    }

    history.replaceState({}, null, sHref)  //Use replaceState so the history is not added, the back button will still work.
    window.location.href = sHref
}

function rdMetadataSetBackButtonRefresh(sDefinition) {
    rdSetCookie("rdMetadataRefreshOnBack_" + sDefinition, "True")
}
function rdMetadataCheckBackButtonRefresh(sDefinition) {
    var sRefresh = rdGetCookie("rdMetadataRefreshOnBack_" + sDefinition)
    if (sRefresh != "") {
        rdSetCookie("rdMetadataRefreshOnBack_" + sDefinition, "")
        rdMetadataRefresh()
    }
}

function rdMetadataShowUndoRedo() {
    //Get the cookies to show undo and redo controls depending on undo state.
    var bAllowUndo = rdGetCookie("rdMdAllowUndo") == "True"
    var bAllowRedo = rdGetCookie("rdMdAllowRedo") == "True"

    var eleUndoRedo = document.getElementById('divUndoRedo'); eleUndoRedo.style.display = (bAllowUndo || bAllowRedo ? "" : "none")

    var eleUndoEnabled = document.getElementById('divUndoEnabled'); eleUndoEnabled.style.display = (bAllowUndo ? "" : "none")
    var eleRedoEnabled = document.getElementById('divRedoEnabled'); eleRedoEnabled.style.display = (bAllowRedo ? "" : "none")

    var eleUndoDisabled = document.getElementById('divUndoDisabled'); eleUndoDisabled.style.display = (bAllowUndo ? "none" : "")
    var eleRedoDisabled = document.getElementById('divRedoDisabled'); eleRedoDisabled.style.display = (bAllowRedo ? "none" : "")
}

function rdMetadataSetValueShowUndo() {
    //There was a user-entered change, show Undo, disable redo.
    if (document.getElementById('divUndoRedo')) {
        var eleUndoRedo = document.getElementById('divUndoRedo'); eleUndoRedo.style.display = ""

        var eleUndoEnabled = document.getElementById('divUndoEnabled'); eleUndoEnabled.style.display = ""
        var eleUndoDisabled = document.getElementById('divUndoDisabled'); eleUndoDisabled.style.display = "none"

        var eleRedoEnabled = document.getElementById('divRedoEnabled'); eleRedoEnabled.style.display = "none"
        var eleRedoDisabled = document.getElementById('divRedoDisabled'); eleRedoDisabled.style.display = ""
    }
}

function rdUndo() {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?Command=Undo"
    if (document.getElementById('hiddenMetadataID')) {
        sUrl += "&MetadataID=" + document.getElementById('hiddenMetadataID').value
    }
    rdAjaxRequest(sUrl, true, null, false, rdMetadataRefresh)
}
function rdRedo() {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?Command=Redo"
    if (document.getElementById('hiddenMetadataID')) {
        sUrl += "&MetadataID=" + document.getElementById('hiddenMetadataID').value
    }
    rdAjaxRequest(sUrl, true, null, false, rdMetadataRefresh)
}

function rdMetadataConnectionSetValue(eleInput, sAttribute, bIncludeType, callback) {
    var sConnID = document.getElementById("hiddenConnectionID").value;

    rdMetadataSetBackButtonRefresh("Connections");

    var sCommand = "ConnectionSetValue";
    var sFullParams = "ConnectionID=" + encodeURIComponent(sConnID)
        + "&Attribute=" + encodeURIComponent(sAttribute);

    if (bIncludeType)
        sFullParams += rdGetInputValues(document.getElementById("ConnectionType"));

    if (sAttribute != "ID") {
        var divTest = document.getElementById("divTest");

        if (divTest)
            divTest.style.visibility = "hidden";
    }

    rdMetadataSetValue(eleInput, sCommand, sFullParams, false, callback);
}

/// password inputs are blank by default because the server does not send passwords to the client
/// so only update the password if something has been entered so that we don't accidentally blank
/// it out in the lgx file
function rdMetadataConnectionSetPassword(txtPwd) {
    if (txtPwd.value)
        rdMetadataConnectionSetValue(txtPwd, "Password", true);
}

function rdMetadataAfterConnectionTypeChange(res) {
    var idArray = ["divSettings"];
    var rdReport = "rdTemplate/rdMetadata/ConnectionEdit";

    rdAjaxRefreshElements(idArray, rdReport);
}

function rdMetadataGetRevertValue(res) {
    if (!res || !res.responseXML)
        return null;

    var htmls = res.responseXML.getElementsByTagName("HTML");

    if (!htmls || !htmls.length)
        return null;

    var attrs = htmls[0].attributes;

    if (!attrs || !attrs.length)
        return null;

    // We have the response attributes
    var attrRevertValue = attrs["RevertValue"];

    if (!attrRevertValue)
        return null;

    return attrRevertValue.value;
}

function rdMetadataAfterConnectionIdChange(res) {
    var txtConnID = document.getElementById("ConnectionID");
    var hdnConnID = document.getElementById("hiddenConnectionID");

    var sRevertValue = rdMetadataGetRevertValue(res);

    if (sRevertValue) {
        txtConnID.value = hdnConnID.value;
        return;
    }

    hdnConnID.value = txtConnID.value;
    rdMetadataRefresh();
}

function rdMetadataEditColumns(eleInput, sUrlTableName, sUrlTableType) {
    //var suffix = eleInput.id.substr(eleInput.id.lastIndexOf("_Row"));
    //var cbVisible = document.getElementById("inputHideTable" + suffix);
    //if (!cbVisible.checked)
    //    return rdShowPopup('pupLocalResponse', 'Table Hidden', 'Enable column editing by setting the table to "Visible"');

    var sConnectionID = document.getElementById('hiddenConnectionID').value;
    var sMetadataID = document.getElementById('hiddenMetadataID').value;

    var url = 'rdPage.aspx?rdReport=rdTemplate/rdMetadata/Columns'
        + '&ConnectionID=' + encodeURIComponent(sConnectionID)
        + '&MetadataID=' + encodeURIComponent(sMetadataID)
        + '&rdAfCommand=FilterSet'
        + '&rdAfFilterColumnID_afColumns=colTableName'
        + '&rdAfFilterOperator_afColumns=' + encodeURIComponent("=")
        + '&rdAfFilterValue_afColumns=' + sUrlTableName
        + '&rdAfMode_afColumns=Simple'
        + '&rdAnalysisFilterID=afColumns'
        + '&TableName=' + sUrlTableName
        + '&TableType=' + sUrlTableType;

    NavigateLink2(url, '', 'false', '', '', null);
}

function rdMetadataEditJoins(eleInput, sTableName) {
    //var suffix = eleInput.id.substr(eleInput.id.lastIndexOf("_Row"));
    //var cbVisible = document.getElementById("inputHideTable" + suffix);
    //if (!cbVisible.checked)
    //    return rdShowPopup('pupLocalResponse', 'Table Hidden', 'Enable join editing by setting the table to "Visible"');

    var sConnectionID = document.getElementById('hiddenConnectionID').value;
    var sMetadataID = document.getElementById('hiddenMetadataID').value;

    var url = 'rdPage.aspx?rdReport=rdTemplate/rdMetadata/Joins'
        + '&ConnectionID=' + encodeURIComponent(sConnectionID)
        + '&MetadataID=' + encodeURIComponent(sMetadataID)
        + '&rdAfCommand=FilterSet'
        + '&rdAfFilterColumnID_afJoins=colFromTableName'
        + '&rdAfFilterOperator_afJoins=' + encodeURIComponent("=")
        + '&rdAfFilterValue_afJoins=' + encodeURIComponent(sTableName)
        + '&rdAfMode_afJoins=Simple'
        + '&rdAnalysisFilterID=afJoins'
        + '&TableName=' + encodeURIComponent(sTableName);

    NavigateLink2(url, '', 'false', '', '', null);
}

var rdIdChanging = 0;
function rdMetadataSetTableName(eleInput) {
    rdIdChanging++;

    rdMetadataSetBackButtonRefresh("Tables");

    var hdnTableName = document.getElementById("hiddenTableName");
    var sCurrTableName = hdnTableName.value;
    var sNewTableName = eleInput.value;

    var sParams = "MetadataID=" + encodeURIComponent(document.getElementById("hiddenMetadataID").value)
        + "&TableName=" + encodeURIComponent(sCurrTableName)
        + "&Attribute=TableName";

    rdMetadataSetValue(eleInput, "TableSetValue", sParams, false, function (xhr) {
        if (xhr.responseXML)
            // Error
            eleInput.value = sCurrTableName;
        else {
            // Success
            hdnTableName.value = sNewTableName;

            var url = LogiXML.setUrlParameter(location.href, "TableName", sNewTableName);
            history.replaceState({}, document.title, url);
        }

        rdIdChanging--;
    });
}

function rdMetadataSetValue(eleInput, sCommand, sParams, bRefresh, callback) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
        + "Command=" + encodeURIComponent(sCommand)
        + "&rdDataCache=" + encodeURIComponent(getRdDataCacheKey());

    if (sParams)
        sUrl += "&" + sParams;

    if (eleInput) {
        var sValue = rdGetInputValues(eleInput, false);

        //Check for apostrophe in TableName, Do not allow
        if (sCommand == 'TableSetValue' && eleInput.id != 'inputSqlSource') {
            if (sValue.indexOf('\'') >= 0 || sValue.indexOf('"') >= 0) {
                alert("Table names cannot contain any quotes, single or double.  Please try again.");
                eleInput.value = eleInput.defaultValue;
                sValue = eleInput.defaultValue;
                return false;
            }
        }
        
        sUrl += "&Value=" + encodeURIComponent(sValue);
    }

    var functionCallback = null;
    if (bRefresh) {
        if (callback) {
            functionCallback = function () {
                callback();
                rdMetadataRefresh();
            };
        } else {
            functionCallback = rdMetadataRefresh;
        }
    } else {
        functionCallback = callback;
    }

    rdMetadataSetValueShowUndo()   //Show Undo

    rdAjaxRequest(sUrl, true, null, false, functionCallback)
}

function rdMetadataCheckAll(sCommand, sAttribute, cb, invertCondition, eleHiddenId) {
    rdShowWaitPanel(rdMetadataWaitCnf);

    var condition;
    if (invertCondition)
        condition = (!cb.checked);
    else
        condition = cb.checked;

    var sParams = "MetadataID=" + encodeURIComponent(document.getElementById("hiddenMetadataID").value)
        + "&Attribute=" + encodeURIComponent(sAttribute)
        + "&Value=" + (condition ? "True" : "False");

    switch (sCommand) {
        case "TableSetValue":
            sParams += "&TableNames=" + encodeURIComponent(document.getElementById("hiddenTableNames").value);
            break;
        case "ColumnSetValue":
            sParams += "&TableNames=" + encodeURIComponent(document.getElementById("hiddenTableNames").value)
                + "&ColumnNames=" + encodeURIComponent(document.getElementById("hiddenColumnNames").value);
            break;
        case "JoinRelationSetValue":
            sParams += "&JoinRelationIDs=" + encodeURIComponent(document.getElementById("hiddenJoinRelationIDs").value);
            break;
    }

    rdMetadataSetValue(null, sCommand, sParams, false, function () {
        if (cb.checked)
            document.getElementById(eleHiddenId).value = "0";
        else
            document.getElementById(eleHiddenId).value = document.getElementById("hiddenRowCount").value;

        var tableCheckboxId = "input" + cb.id.substr(10);
        var i = tableCheckboxId.lastIndexOf("_Row") + 4;
        var iFirstRowNum = Number(tableCheckboxId.substr(i));
        tableCheckboxId = tableCheckboxId.substr(0, i);
        var tableCheckbox;
        for (i = iFirstRowNum; true; i++) {
            tableCheckbox = document.getElementById(tableCheckboxId + i);

            if (!tableCheckbox)
                break;

            tableCheckbox.checked = cb.checked;
        }

        rdHideWaitPanel();
    });
}

function rdMetadataCheckAllCanceled(cb) {
    cb.checked = !cb.checked;
}

function rdMetadataCheckOne(sCommand, sAttribute, sParams, cb, invertCondition, eleHiddenId) {
    var condition;
    if (invertCondition)
        condition = (!cb.checked);
    else
        condition = cb.checked;

    var sNewParams = "MetadataID=" + encodeURIComponent(document.getElementById("hiddenMetadataID").value)
        + "&Attribute=" + encodeURIComponent(sAttribute)
        + "&Value=" + (condition ? "True" : "False");

    if (sParams)
        sNewParams += "&" + sParams;

    rdMetadataSetValue(null, sCommand, sNewParams, false, function () {
        var eleHidden = document.getElementById(eleHiddenId);

        var iCnt = Number(eleHidden.value);

        if (cb.checked)
            iCnt--;
        else
            iCnt++;

        eleHidden.value = iCnt;

        var headerCheckboxClass = "rdInputReset" + cb.id.substr(5);
        headerCheckboxClass = headerCheckboxClass.substr(0, headerCheckboxClass.lastIndexOf("_"));

        var headerCheckbox = document.getElementsByClassName(headerCheckboxClass)[0];

        headerCheckbox.checked = (iCnt === 0);
    });
}

function rdMetadataCheckSqlSourceTestError() {
    var divError = document.getElementById('divError');

    if (!divError)
        return false;

    var spanErrors = divError.getElementsByTagName("SPAN");

    if (!spanErrors.length)
        return false;

    return spanErrors[0].innerHTML.trim();
}

function rdMetadataGetColumnsFromSource(sPopupID, bTestFirst) {
    if (rdIdChanging)
        return setTimeout(function () {
            rdMetadataGetColumnsFromSource(sPopupID, bTestFirst);
        }, 300);
    // check for error
    if (bTestFirst)
        return rdMetadataTestCustomSql(function () {
            rdMetadataGetColumnsFromSource(sPopupID, false);
        });

    if (rdMetadataCheckSqlSourceTestError())
        return ShowElement('', 'pupLocalResponse', 'Hide', '');

    rdShowWaitPanel(['', '', '']);

    var sTableName = document.getElementById("hiddenTableName").value;

    var testParams = rdMetadataGetTestParameters();

    // commandURL, bValidate, sConfirm, bFromOnClick, bProcess, fnCallback, waitCfg, copyQueryString
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?Command=GetColumnsFromSource"
        + "&MetadataID=" + encodeURIComponent(document.getElementById("hiddenMetadataID").value)
        + "&ConnectionID=" + encodeURIComponent(document.getElementById("hiddenConnectionID").value)
        + "&TableName=" + encodeURIComponent(sTableName)
        + "&PopupID=" + encodeURIComponent(sPopupID)
        + "&DataLayerTestParameters=" + encodeURIComponent(JSON.stringify(testParams))
        + "&rdDataCache=" + encodeURIComponent(getRdDataCacheKey());

    rdAjaxRequest(sUrl, true, null, false, rdHideWaitPanel);
}

function rdMetadataGetTablesFromSource(sMetadataID, sConnectionID) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?Command=GetTablesFromSource"
        + "&MetadataID=" + encodeURIComponent(sMetadataID)
        + "&ConnectionID=" + encodeURIComponent(sConnectionID)
        + "&rdDataCache=" + encodeURIComponent(getRdDataCacheKey());

    var sWaitCfg = ['', '', '']
    rdAjaxRequest(sUrl, true, null, false, null, sWaitCfg);
}

//function rdMetadataGetTablesFromSource(sMetadataID, sConnectionID, sRefreshElementID) {
//    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?Command=GetTablesFromSource"
//    sUrl += "&MetadataID=" + encodeURIComponent(sMetadataID)
//    sUrl += "&ConnectionID=" + encodeURIComponent(sConnectionID)

//    rdAjaxRequest(sUrl, true, null, false, function () {
//        sUrl = "rdAjaxCommand=RefreshElement&rdRefreshElementID="
//            + encodeURIComponent(sRefreshElementID)
//            + '&rdReport=' + encodeURIComponent('rdTemplate/rdMetadata/Tables');

//        var sWaitCfg = ['', '', '']
//        rdAjaxRequestWithFormVars(sUrl, 'false', '', null, null, null, null, sWaitCfg);
//    });
//}

function rdMetadataValidateID(eleInput) {
    var sInvalidChars = " !@#$%^&*()+=[]\\\';,./{}|\":<>?";
    var sValue = eleInput.value

    if (eleInput.id == "inputTableName") {
        //allow spaces.
        sInvalidChars = sInvalidChars.replace(" ", "")
    }

    for (var i = 0; i < sValue.length; i++) {
        if (sInvalidChars.indexOf(sValue.charAt(i)) != -1) {
            throw ("Contains invalid characters.")
        }
    }
}

function rdMetadataPopupEditSingleValue(eleClicked, sPopupID, sTextValueID, sParams) {
    rdMetadataPopupEditRowId = eleClicked.id.substring(eleClicked.id.indexOf("_Row"))


    var sValue = eleClicked.innerText
    if (sValue == "---") { sValue = "" }
    var eleInput = document.getElementById(sTextValueID)
    eleInput.value = sValue

    var eleAutoCompleteFormat = Y.one('#' + sTextValueID);
    if (eleAutoCompleteFormat && eleAutoCompleteFormat.ac) {
        eleAutoCompleteFormat.ac.set("value", sValue)
    }

    rdMetadataPopupParams = sParams

    ShowElement(eleClicked.id, sPopupID, '', '')
}

function rdMetadataPopupSaveSingleValue(eleInput, sCommand, sAttribute, sTextElementID, bClose) {

    //Convert from a YUI node.  Used for <InputComboList>
    if (eleInput._node) { eleInput = eleInput._node }   //Textbox
    if (eleInput._inputNode) { eleInput = eleInput._inputNode._node }  //Drop-down list.

    rdMetadataPopupUpdateRowText(sTextElementID, rdGetInputValues(eleInput, false))

    var sParams = rdMetadataPopupParams + "&Attribute=" + sAttribute
    rdMetadataSetValue(eleInput, sCommand, sParams)

    if (bClose) {
        var popup = eleInput;

        while (popup && popup.getAttribute("rdpopuppanel") != "True") {
            popup = popup.parentNode;
        }

        if (popup)
            ShowElement('', popup.id, 'Hide', '');
    }
}

function rdMetadataPopupUpdateRowText(sTextElementID, sValue) {
    //Update the text value that was clicked.
    var eleTextElement = document.getElementById(sTextElementID + rdMetadataPopupEditRowId)

    if (sValue == "") { sValue = "---" }

    if (eleTextElement.textContent != undefined) {
        eleTextElement.textContent = sValue //Mozilla, Webkit
    } else {
        eleTextElement.innerText = sValue //Old IE
    }
}


function rdMetadataPopupEditLinkURL(eleClicked, sParams) {
    rdMetadataPopupEditRowId = eleClicked.id.substring(eleClicked.id.indexOf("_Row"))

    var sLinkUrl = eleClicked.innerText
    if (sLinkUrl == "---") { sLinkUrl = "" }

    var sFrameID = document.getElementById(eleClicked.id.replace("showEditPopup", "lblFrameID")).innerText
    if (sFrameID == "---") { sFrameID = "" }

    var eleLinkUrlInput = document.getElementById("inputLinkURL"); eleLinkUrlInput.value = sLinkUrl
    var eleFrameIDInput = document.getElementById("inputFrameID"); eleFrameIDInput.value = sFrameID

    rdMetadataPopupParams = sParams

    ShowElement(eleClicked.id, 'popupLinkURL', '', '')
}

//Connections

function rdMetadataAddNewConnection() {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=AddConnection"
    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataShowConnectionEdit() })
}
var rdMetadataReturnedConnectionID
function rdMetadataShowConnectionEdit() {
    var sUrl = "rdPage.aspx?rdReport=rdTemplate/rdMetadata/ConnectionEdit&ConnectionID=" + rdMetadataReturnedConnectionID
    NavigateLink2(sUrl, "_self")
}

function rdMetadataConnectionRemove(eleClicked, sParams) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=RemoveConnection"
    sUrl += "&" + sParams
    rdAjaxRequest(sUrl, true, null, false)
    var eleRow = document.getElementById(eleClicked.id.replace("jsRemoveConnection", "colActions")).parentNode
    eleRow.parentNode.removeChild(eleRow)
}

function rdMetadataConnectionTest(sConnectionID) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=ConnectionTest"
    sUrl += "&ConnectionID=" + encodeURIComponent(sConnectionID)
    sUrl += "&rdMetadataConnectionTesting=True"

    var sWaitCfg = ['', '', '']
    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataRefresh() }, sWaitCfg)

}

//Metadata element
function rdMetadataAddNewMetadata(sConnectionID) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=AddMetadata"
    sUrl += "&ConnectionID=" + encodeURIComponent(sConnectionID)
    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataShowNewMetadata(sConnectionID) })
}
var rdMetadataReturnedMetadataID
function rdMetadataShowNewMetadata(sConnectionID) {
    var sUrl = "rdPage.aspx?rdReport=rdTemplate/rdMetadata/Tables"
    sUrl += "&ConnectionID=" + encodeURIComponent(sConnectionID)
    sUrl += "&MetadataID=" + encodeURIComponent(rdMetadataReturnedMetadataID)
    if (window.location.href.indexOf("rdForWizard=True") > -1) {
        sUrl += "&rdForWizard=True"
    }
    NavigateLink2(sUrl, "_self")
}

function rdMetadataMetadataRemove(sConnectionID, sMetadataID) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=RemoveMetadata"
    sUrl += "&ConnectionID=" + encodeURIComponent(sConnectionID)
    sUrl += "&MetadataID=" + encodeURIComponent(sMetadataID)
    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataRefresh() })
}



//Tables
function rdMetadataAddNewTable(sMetadataID, ConnectionID) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
        + "Command=AddTable"
        + "&MetadataID=" + sMetadataID;

    var rdDataCache = document.getElementById("hiddenDataCacheKey");

    if (rdDataCache && rdDataCache.value)
        sUrl += "&DataCacheKey=" + encodeURIComponent(rdDataCache.value);

    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataShowTableEdit(sMetadataID, ConnectionID) })
}
var rdMetadataReturnedTableName
function rdMetadataShowTableEdit(sMetadataID, sConnectionID) {
    sMetadataID = encodeURIComponent(sMetadataID)
    var sUrl = "rdPage.aspx?rdReport=rdTemplate/rdMetadata/TableEdit"
    sUrl += "&MetadataID=" + encodeURIComponent(sMetadataID)
    sUrl += "&ConnectionID=" + encodeURIComponent(sConnectionID)
    sUrl += "&TableName=" + encodeURIComponent(rdMetadataReturnedTableName)
    NavigateLink2(sUrl, "_self")
}
function rdMetadataTableRemove(eleClicked, sTableName) {
    var sMetadataID = document.getElementById("hiddenMetadataID").value;
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
        + "Command=RemoveTable"
        + "&MetadataID=" + encodeURIComponent(sMetadataID)
        + "&TableName=" + encodeURIComponent(sTableName)
        + "&rdDataCache=" + encodeURIComponent(getRdDataCacheKey());

    rdAjaxRequest(sUrl, true, null, false);

    var eleRow = document.getElementById(eleClicked.id.replace("jsRemoveTable", "colTableName")).parentNode;
    eleRow.parentNode.removeChild(eleRow);
}


//Joins
function rdMetadataAddNewJoin() {
    var sMetadataID = document.getElementById("hiddenMetadataID").value;
    var sTableName = document.getElementById("hiddenTableName").value;

    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
        + "Command=AddJoin"
        + "&MetadataID=" + encodeURIComponent(sMetadataID)
        + "&TableName=" + encodeURIComponent(sTableName);

    var callback = function () {
        rdMetadataShowJoinEdit(this.sMetadataID, this.sTableName);
    }.bind({
        sMetadataID: sMetadataID,
        sTableName: sTableName
    });

    rdAjaxRequest(sUrl, true, null, false, callback);
}
var rdMetadataReturnedJoinRelationID;
function rdMetadataShowJoinEdit(sMetadataID, sTableName) {
    var sConnectionID = document.getElementById("hiddenConnectionID").value;
    var sMetadataUrl = document.getElementById("hiddenMetadataUrl").value;

    var sUrl = "rdPage.aspx?rdReport=rdTemplate/rdMetadata/JoinEdit"
        + "&ConnectionID=" + encodeURIComponent(sConnectionID)
        + "&MetadataID=" + encodeURIComponent(sMetadataID)
        + "&TableName=" + encodeURIComponent(sTableName)
        + "&MetadataUrl=" + encodeURIComponent(sMetadataUrl)
        + "&JoinRelationID=" + rdMetadataReturnedJoinRelationID;

    NavigateLink2(sUrl, "_self");
}
function rdMetadataJoinRemove(eleClicked, sParams) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=RemoveJoin"
    sUrl += "&" + sParams
    rdAjaxRequest(sUrl, true, null, false)
    var eleRow = document.getElementById(eleClicked.id.replace("jsRemoveJoin", "colActions")).parentNode
    eleRow.parentNode.removeChild(eleRow)
}

function rdMetadataAddNewJoinDetails(sParams) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=AddJoinDetails"
    sUrl += "&" + sParams

    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataRefresh() })
}

function rdMetadataRemoveJoinDetails(sParams) {
    var sUrl = "rdTemplate/rdMetadata/rdUiService.aspx?"
    sUrl += "Command=RemoveJoinDetails"
    sUrl += "&" + sParams

    rdAjaxRequest(sUrl, true, null, false, function () { rdMetadataRefresh() })
}

function rdMetadataAddTestParams(sTableID) {
    var dt = document.getElementById(sTableID); // 'dtTestParameters'
    var lastRow = dt.rows[dt.rows.length - 1];
    var newRow = lastRow.cloneNode(true);
    var inputs = newRow.getElementsByTagName("INPUT");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
    }

    lastRow.parentNode.appendChild(newRow);
    return rdResizeCurrentIFrame();
}

function rdMetadataRemoveTestParams(tr) {
    while (tr && tr.tagName != "TR")
        tr = tr.parentNode;

    if (!tr)
        return rdMetadataSaveTestParameters();

    var table = tr.parentNode;

    while (table && table.tagName != "TABLE")
        table = table.parentNode;

    if (!table || table.rows.length < 2)
        return rdMetadataSaveTestParameters();

    // 1st row is header, 2nd row is first parameter
    if (table.rows.length > 2) {
        tr.parentNode.removeChild(tr);
        rdResizeCurrentIFrame();
        return rdMetadataSaveTestParameters();
    }

    // else just clear out last one
    var inputs = tr.getElementsByTagName("INPUT");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
    }

    return rdMetadataSaveTestParameters();
}

function rdMetadataTestCustomSql(callback) {
    var sConnID = document.getElementById("hiddenConnectionID").value;

    var sMetadataID = document.getElementById("hiddenMetadataID").value;
    var sTableName = document.getElementById("hiddenTableName").value;

    var testParams = rdMetadataGetTestParameters();

    // commandURL, bValidate, sConfirm, bFromOnClick, bProcess, fnCallback, waitCfg, copyQueryString
    var commandURL = "rdAjaxCommand=RefreshElement"
        + "&rdRefreshElementID=divTest"
        + "&ConnectionID=" + encodeURIComponent(sConnID)
        + "&rdTesting=True"
        + "&rdReport=" + encodeURIComponent("rdTemplate/rdMetadata/TableEdit")
        + "&DataLayerTestParameters=" + encodeURIComponent(JSON.stringify(testParams))
		+ "&MetadataID=" +  encodeURIComponent(sMetadataID)
		+ '&TableName=' + sTableName;

    rdAjaxRequestWithFormVars(commandURL, 'false', '', null, null, callback, ['', '', ''], true)
}

function rdMetadataGetTestParameters() {
    var dt = document.getElementById('dtTestParameters');
    if (!dt) {
        return ""
    }

    var rows = dt.rows;
    var inputs;
    var testParams = [], name, value;
    for (var i = 0; i < rows.length; i++) {
        inputs = rows[i].getElementsByTagName("INPUT");

        if (inputs.length < 2)
            continue;

        name = inputs[inputs.length - 2].value.trim();

        if (!name)
            continue;

        testParams.push({
            name: name,
            value: inputs[inputs.length - 1].value
        });
    }

    return testParams;
}

function rdMetadataSaveTestParameters() {
    var sConnID = document.getElementById("hiddenConnectionID").value;

    var sMetadataID = document.getElementById("hiddenMetadataID").value;
    var sTableName = document.getElementById("hiddenTableName").value;

    var testParams = rdMetadataGetTestParameters();

    var sParams = "MetadataID=" + encodeURIComponent(sMetadataID)
        + "&TableName=" + encodeURIComponent(sTableName)
        + "&Attribute=CustomTableTestSessionParams"
        + "&Value=" + encodeURIComponent(JSON.stringify(testParams));

    rdMetadataSetValue(null, "TableSetValue", sParams);
}

function rdMetadataShowGetColumnsDialog() {

    var inputSqlSource = document.getElementById("inputSqlSource");

    if (inputSqlSource && inputSqlSource.getAttribute("rdinit") != "True") {
        inputSqlSource.innerText = inputSqlSource.innerText.replace(/--at--/g, "@"); // .replace(/@/g,'--at--')
        inputSqlSource.setAttribute("rdinit", "True");
    }

    ShowElement('', 'pupSqlSource', 'Show', '');
}

document.addEventListener("DOMContentLoaded", function () {
    var disable = function () {
        var disableds = document.getElementsByClassName("rdDisabled");
        for (var i = 0; i < disableds.length; i++) {
            var ele = disableds[i];
            ele.disabled = true;
            ele.title = "Read only";
        }
    };

    disable();

    LogiXML.Ajax.AjaxTarget().on('refreshed_dt', disable);
});
