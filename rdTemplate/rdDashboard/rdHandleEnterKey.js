//Prevent submits when the Enter key is pressed while inside an INPUT.
function rdDashboardHandleEnterKey(evt) {
    var evt  = (evt) ? evt : ((event) ? event : null);
    if (evt.keyCode == 13 || evt.keyCode == 9) {
        var ele = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null)
        if (ele.id == "txtRenameTab") { //Tab Level
            LogiXML.Dashboard.pageDashboard.rdRenameDashboardTab('Save');
            return false
        } else if (ele.id.indexOf('rdDashboardPanelRename') > -1) { //Panel Level
            LogiXML.Dashboard.pageDashboard.rdSaveDashboardParams(ele.id.replace('rdDashboardPanelRename-', 'rdDashboardPanel-'), true, 'Save');
        }
    } else if (evt.keyCode == 27) {
        var ele = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null)
        if ((ele.id.indexOf('rdDashboardPanelRename') > -1) || (ele.id == "txtRenameTab")) {
            if (ele.id == "txtRenameTab") { //Tab Level
                Y.one("#rdRenameTabDiv").setStyle("display", "none");
                LogiXML.Dashboard.pageDashboard.rdPositiontabSettingsCog();
            } else {    //Panel Level
                //Hide the rename textbox div after editing.
                var nodeRenamePanelDiv = Y.one('#' + ele.id.replace('rdDashboardPanelRename-', 'rdDashboardPanelRenameDiv-'));
                nodeRenamePanelDiv.setStyle('display', 'none');
                //Show the Panel Caption Div after editing is done.
                var nodePanelRenameCaptionDiv = Y.one('#' + ele.id.replace('rdDashboardPanelRename-', 'rdDashboardPanelCaptionDiv-'));
                nodePanelRenameCaptionDiv.setStyle('display', '');
                //Show the panel settings cog.
                var nodePanelSettingsCog = Y.one('#' + ele.id.replace('rdDashboardPanelRename-', 'rdPanelSettingsCog_'));
                nodePanelSettingsCog.setStyle("display", "");
            }
        }
    }
}

document.onkeypress = rdDashboardHandleEnterKey;
