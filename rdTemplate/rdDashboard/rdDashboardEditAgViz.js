
function rdShowEditAgVizControls() {
    var hasChartOrCrosstab = false;

    //AnalysisChart area adjustments.
    if (document.getElementById("divAcChartTypes_rdDashboardEditAc")) {
        hasChartOrCrosstab = true;

        //Open the edit area.
        document.getElementById("divAcChartTypes_rdDashboardEditAc").style.display = ""
        document.getElementById("divChartLists_rdDashboardEditAc").style.display = ""
        document.getElementById("divAcControls_rdDashboardEditAc").style.display = ""
        //Hide the +/- icon.
        document.getElementById("divPanelOpen_rdDashboardEditAc").style.display = "none"
        //Hide the cog and trash.
        document.getElementById("colAcEdit_rdDashboardEditAc").style.display = "none"
        document.getElementById("divChartRemove_rdDashboardEditAc").style.display = "none"
    }

    //AnalysisCrosstab adjustments.
    if (document.getElementById("divAxControls_rdDashboardEditAx")) {
        hasChartOrCrosstab = true;

        //Open the edit area.
        document.getElementById("divAxControls_rdDashboardEditAx").style.display = ""
        //Hide the +/- icon.
        document.getElementById("divPanelOpen_rdDashboardEditAx").style.display = "none"
        //Hide the cog and trash and export.
        document.getElementById("colAxEdit_rdDashboardEditAx").style.display = "none"
        document.getElementById("divCrosstabRemove_rdDashboardEditAx").style.display = "none"
        document.getElementById("colCrosstabExportControls_rdDashboardEditAx").style.display = "none"
        
    }

    //DataTable adjustments.
    //AnalysisGrid Table adjustments.
    document.getElementById("rowTableMenu").style.display = ""
    document.getElementById("rowsTable").style.padding = "0px"
    document.getElementById("rowsTable").style.border = "0px"

    if (hasChartOrCrosstab) {
        document.getElementById("rowContentTableHeading").style.display = "none"
    } else {
        // No chart or crosstab, this is just the table - show the Heading
        //Open the edit area.
        document.getElementById("rowContentTableHeading").style.display = ""

        //Hide the +/- icon.
        document.getElementById("divPanelOpen_Table").style.display = "none"

        //Hide the cog and trash and export.
        document.getElementById("colTableMenu").style.display = "none"
        document.getElementById("colTableExportControls").style.display = "none"
    }
}

function rdSaveStandaloneEditedAgVis(sReport, sDashReport, sVizContainerID, sBookmarkID, sBookmarkCollection, sVizType) {
    //Hide the popup panel.
    var sPopupPanelId = "popupEditAgViz_" + sBookmarkID;
    var sHideScript = "ShowElement(this.id, '" + sPopupPanelId + "', 'Hide', '')";
    window.parent.eval(sHideScript);

    //add to dashboard panel
    var adjReqString = "rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement";
    adjReqString += "&rdDashboardEditVizType=" + sVizType;
    adjReqString += "&rdRefreshElementID=";
    adjReqString += sVizContainerID;
    adjReqString += "&rdCommand=AddDashboardPanel";
    switch (sVizType) {
        case "AnalysisChart":
            adjReqString += '&rdPanelContentElementID=rdDashboardEditAc';
            break;
        case "AxTable":
            adjReqString += '&rdPanelContentElementID=rdDashboardEditAx';
            break;
        case "AgTable":
            adjReqString += '&rdPanelContentElementID=dtAnalysisGrid';
            break;
    }
    adjReqString += "&rdBookmarkCollection=";
    adjReqString += sBookmarkCollection;
    adjReqString += "&rdBookmarkID=";
    adjReqString += sBookmarkID;
    adjReqString += "&rdDefInDataCache=True&rdEditing=True&rdAgAddToDashboard=True";
    adjReqString += "&rdReport=";
    adjReqString += sDashReport;
    adjReqString += "&rdRequestForwarding=Form";
    adjReqString += "' , 'false', '', null, null, null, ['', '', ''], true)";

    eval(adjReqString); //updating panel
    adjReqString = adjReqString.replace(sDashReport, sReport);
    adjReqString = adjReqString.replace("&rdCommand=AddDashboardPanel", "");
    adjReqString = adjReqString.replace("&rdAgAddToDashboard=True", "");
    window.parent.eval(adjReqString);//updating original report
    window.parent.eval("rdShowWaitPanel(['', '', '', '0'])");  //0=now.
}