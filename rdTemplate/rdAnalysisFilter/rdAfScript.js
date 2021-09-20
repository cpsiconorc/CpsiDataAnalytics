var rdAfOperatorListClone

function rdAfUpdateUi(bRefresh, sAfId, sCommand, sFilterID, sAddFilterColumnID, sAddFilterValue, sAddFilterOperator, sPanelInstanceID) {
    if (!LogiXML || !LogiXML.DOMContentLoaded)
        return setTimeout(function () {
            rdAfUpdateUi(bRefresh, sAfId, sCommand, sFilterID, sAddFilterColumnID, sAddFilterValue, sAddFilterOperator, sPanelInstanceID);
        }, 10);

    if (!rdAfOperatorListClone) {
        //Load all the comparison operators.
        var eleFullOperatorList = document.getElementById("rdAfFilterOperator_" + sAfId)
        if (eleFullOperatorList) {
            rdAfOperatorListClone = eleFullOperatorList.cloneNode(true)
        }
    }
         	
    if (bRefresh) {
        //Refresh the filter element and it's linked elements.
        if (sFilterID == "rdFromSimpleFilterID") {
            var eleSimpleFilterID = document.getElementById("lblSimpleFilterID_" + sAfId)
            sFilterID = eleSimpleFilterID.textContent
        }
        
        var eleUpdateAction = document.getElementById("actAfDesignSave_" + sAfId)
        if (!eleUpdateAction) {
            //Not full-page refresh, get the Ajax RefreshElement href.
            eleUpdateAction = document.getElementById("actAfDesignSaveAjax_" + sAfId)
        }

        var sRefreshScript = LogiXML.getScriptFromLink(eleUpdateAction, false);
        sRefreshScript = sRefreshScript.replace("rdAfCommand=&", "rdAfCommand=" + sCommand + "&")

        //For adding dashboard global filters.
        if (sCommand == "FilterAdd" || sCommand == "FilterSet") {
            if (sAddFilterColumnID) {
                var sAddParams = "&rdAfFilterColumnID_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterColumnID)
                sAddParams += "&rdAfFilterOperator_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterOperator)
                if (sAddFilterOperator == "Range" && sAddFilterValue.indexOf("|") != -1) {
                    sAddParams += "&rdAfFilterValue_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[0])
                    sAddParams += "&rdAfFilterValueMax_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[1])
                } else if (sAddFilterOperator == "Date Range" && sAddFilterValue.indexOf("|") != -1) {
                    sAddParams += "&rdAfFilterValue_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[0])
                    sAddParams += "&rdAfFilterValueMax_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[1])
                } else if (sAddFilterOperator == "In List" || sAddFilterOperator == "Not In List") {
                    sAddParams += "&rdAfFilterValueDelimited_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue)
                } else {
                    sAddParams += "&rdAfFilterValue_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue)
                }

                if (sPanelInstanceID) {
                    sAddParams += "&rdAfPanelInstanceID_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sPanelInstanceID)

                    if (document.getElementById("rdFilteredXAxisTimePeriod_" + sPanelInstanceID)) {
                        sAddParams += "&rdFilteredXAxisTimePeriod_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(document.getElementById("rdFilteredXAxisTimePeriod_" + sPanelInstanceID).value)
                    }
                }

            sRefreshScript = sRefreshScript.replace("&rdAfCommand", sAddParams + "&rdAfCommand")
            }
        }

        if (sFilterID)
            sRefreshScript = sRefreshScript.replace("rdAfFilterID=&", "rdAfFilterID=" + sFilterID + "&")

        if (sCommand == "Design" || sCommand == "Simple") {
            //Refresh just the filter controls.
            if (!document.getElementById("rdDashboardPanels")) {
                //Don't do this for Dashboards, when it needs to refresh the entire panel every time.
                sRefreshScript = sRefreshScript.replace("rdRefreshElementID=", "rdRefreshElementID=" + sAfId + "&rdRefreshElementIDnot=")
            }
        }

        var refreshFunction = new Function (sRefreshScript);
        window.setTimeout(refreshFunction, 100);
        return;
    } else {
        var eleAfMode = document.getElementById('rdAfMode_' + sAfId)
        if (!eleAfMode) {
            return
        }

        //Update the UI.
        rdAfUpdateEditControls(sAfId)

        if (document.getElementById('rdAfMode_' + sAfId).value == "Simple") {
            rdAfShowSimpleList(sAfId)
        }
    }

    var bFiltersDefined = (document.getElementById("actShowFilter_" + sAfId + "_Row1") || document.getElementById("colSimpleName_" + sAfId + "_Row1")) != null

    //Update the AG's filter tab. If there are filters, it should be bold.
    var eleFilterTab =  document.getElementById("colFilter")
    if (eleFilterTab){
        if (bFiltersDefined) {
            //There is at least one filter.
            eleFilterTab.style.fontWeight = "bold"
        }
    }
   
    //Update the Dashboard panel's filter caption.
    var sCaptionElementID = document.getElementById("rdAfCaptionElementID_" + sAfId).textContent
    if (sCaptionElementID!="") {
        if (sCaptionElementID == "rdPanelFilterCaption" || sAfId.lastIndexOf("_") > 0 ) {
            //Add the panel's InstanceID
            sCaptionElementID += sAfId.substring(sAfId.lastIndexOf("_"))
        }

        rdAfUpdateCaptionElement(sAfId);

        var eleCaptionContainer = document.getElementById(sCaptionElementID + "_Container")
        if (eleCaptionContainer) {
            if (bFiltersDefined) {
                ShowElement(null, eleCaptionContainer.id, "Show")
            }else{
                ShowElement(null, eleCaptionContainer.id, "Hide")
            }
        }
    }

}

function rdAfEncodeAjaxScriptValue(sValue) {
    sValue = rdAjaxEncodeValue(sValue);
    sValue = sValue.replace(/'/g, "%27"); //encode single quotes for javascript.
    return sValue;
}

function rdAfUpdateCaptionElement(sAfId, bCalledOnLoad) {
    // Function gets called to update the AF caption element (if specified)
    var sCaptionElementID = document.getElementById("rdAfCaptionElementID_" + sAfId).textContent
    if (sCaptionElementID != "") {
        if (sCaptionElementID == "rdPanelFilterCaption" || sAfId.lastIndexOf("_") > 0 ) {
            //Add the panel's InstanceID
            sCaptionElementID += sAfId.substring(sAfId.lastIndexOf("_"))
        }

        // Dboard globalfilter caption gets updated momentarily with the ajaxonload, giving a flicker effect - this prevents it.
        if (sCaptionElementID == "rdGlobalFilterCaption" && (!bCalledOnLoad)) {
            return;
        }

        eleFilterCaption = document.getElementById(sCaptionElementID)
        if (eleFilterCaption) {
            eleFilterCaption.textContent = document.getElementById("rdAfCaptionLine_" + sAfId).textContent
            eleFilterCaption.title = document.getElementById("rdAfCaptionList_" + sAfId).textContent
        }
    }
}

function rdAfSetMode(sAfId, sMode) {
    document.getElementById("rdAfMode_" + sAfId).value = sMode
    rdAfUpdateUi(true, sAfId, sMode);
}

function rdAfSetGlobalFilter(bRefresh, sAfId, sPanelInstanceID, sColumnID, sValue, sOperator) {
    rdAfUpdateUi(bRefresh, sAfId, "FilterSet", null, sColumnID, sValue, sOperator, sPanelInstanceID)
}

function rdAfSetPickedFilterCompareColumn(sAfId, ele) {
    var td = ele;

    while (td && td.tagName.toLowerCase() != "td") {
        td = td.parentNode;
    }

    if (!td)
        return;

    var sBracketedColumn = null;
    var inputs = td.getElementsByTagName("INPUT");
    for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        if (!inp.id)
            continue;

        if (inp.id.indexOf("rdAfFilterCompareColumnBracketed_" + sAfId + "_Row") == 0) {
            sBracketedColumn = inp.value;
            break;
        }
    }

    if (!sBracketedColumn)
        return;

    var txt = null;
    
    if (!LogiXML.rdAfColumnTarget)
        txt = document.getElementById("rdAfFilterValue_" + sAfId);
    else if (LogiXML.rdAfColumnTarget == "Start")
        txt = document.getElementById("rdAfFilterStartDateColumn_" + sAfId);
    else if (LogiXML.rdAfColumnTarget == "End")
        txt = document.getElementById("rdAfFilterEndDateColumn_" + sAfId);
    else if (LogiXML.rdAfColumnTarget == "Max")
        txt = document.getElementById("rdAfFilterValueMax_" + sAfId);

    if (!txt)
        return;

    txt.value = sBracketedColumn;
}

function rdAfCompareColumnCount(sAfId) {
    var table = document.getElementById("dtPickCompareColumn_" + sAfId);
    if (!table)
        return -1;

    var cnt = 0;

    for (var i = 0; i < table.rows.length; i++) {
        if (table.rows[i].style.display != "none")
            cnt++;
    }

    return cnt;
}

function rdAfShowCompareColumnButton(sAfId, sColumnID, sColumnDataType) {
    var atLeastOne = false;
    var hideBtn = false;

    if (sColumnDataType == "Boolean") {
        // only show if Compare Column is selected
        if (document.getElementById("rdAfFilterValueBoolean_" + sAfId).value != "Compare Column")
            hideBtn = true;
    }

    var table = document.getElementById("dtPickCompareColumn_" + sAfId);
    if (!table)
        return false;

    for (var i = 0; i < table.rows.length; i++) {
        var row = table.rows[i];

        row.style.display = "";

        var inputs = row.getElementsByTagName("INPUT");
        var show = !hideBtn;
        for (var j = 0; j < inputs.length; j++) {
            var inp = inputs[j];
            if (!inp.id)
                continue;

            if (inp.id.indexOf("rdAfFilterCompareColumnDataType_" + sAfId + "_Row") == 0) {
                var sDataType = inp.value;
                if (sDataType != sColumnDataType) {
                    row.style.display = "none";
                    show = false;
                    continue;
                }
            }

            if (inp.id.indexOf("rdAfFilterCompareColumnID_" + sAfId + "_Row") == 0) {
                if (sColumnID == inp.value) {
                    row.style.display = "none";
                    show = false;
                }
            }
        }

        if (show)
            atLeastOne = true;
    }

    if (atLeastOne) {
        if (sColumnDataType.indexOf("Date") != 0) {
            ShowElement(null, "divPickCompareColumnPopUpButton_" + sAfId, "Show");
            ShowElement(null, "divPickCompareColumnPopUpButtonMax_" + sAfId, "Show");
        }
        
        return true;
    }

    return false;
}

function rdAfUpdateEditControls(sAfId) {
    // Function gets called on the onchange event of the Filter column dropdown.   
    this.rdAfRemoveAllWhiteSpaceNodesFromFilterOperatorDropdown(sAfId);        // Do this to clear the FilterOparator dropdown of all whitespace/text nodes.

    rdAfInitControlVisibility(sAfId);

    var eleFilterColumn = document.getElementById("rdAfFilterColumnID_" + sAfId)
    var sColumnDataType = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Types")

    if (rdAfOperatorListClone) {
        //Some operators may have been removed.  Restore them all into the select list by restoring from rdAfOperatorListClone.
        var eleFilterOperator = document.getElementById("rdAfFilterOperator_" + sAfId)
        var sFilterOperator = eleFilterOperator.value
        //Remove all existing operator options.
        while (eleFilterOperator.hasChildNodes()) {
            eleFilterOperator.removeChild(eleFilterOperator.lastChild);
        }
        //Copy all operator options from the saved clone.
        for (var i = 0; i < rdAfOperatorListClone.options.length; i++) {
            eleFilterOperator.appendChild(rdAfOperatorListClone.options[i].cloneNode(true))
        }
    }

    
    if (eleFilterColumn.value == "") {
        //No column is selected.
        ShowElement(this.id, 'divFilterValue_' + sAfId, 'Show')         //Show the Value field even though no filter column is selected yet.

    } else {
        var btnCompColShown = rdAfShowCompareColumnButton(sAfId, eleFilterColumn.value, sColumnDataType);

        var ddlDate1;
        var ddlDate2;

        // Should we show the Compare Column option?
        if (sColumnDataType == "Boolean") {
            var ddlBoolean = document.getElementById("rdAfFilterValueBoolean_" + sAfId);
            if (rdAfCompareColumnCount(sAfId) > 0) {
                // Include the Compare Column option
                if (ddlBoolean.options.length == 2) {
                    var opt = document.createElement("OPTION");
                    opt.value = "Compare Column";
                    opt.text = "Compare Column";
                    ddlBoolean.add(opt);
                }
            } else {
                // Do not include the Compare Column option
                if (ddlBoolean.options.length == 3) {
                    ddlBoolean.remove(2);
                }
            }

            // Update True/False to match Format
            var sFormat = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Formats");
            var sTrue = "True";
            var sFalse = "False";

            if (sFormat && sFormat.length >= 3) {
                var i = sFormat.indexOf("/");
                if (i > 0 && i < sFormat.length - 1) {
                    sTrue = sFormat.substr(0, i);
                    sFalse = sFormat.substr(i + 1);
                }
            }

            for (i = 0; i < ddlBoolean.options.length; i++) {
                var opt = ddlBoolean.options[i];
                if (opt.value == "True")
                    opt.text = sTrue;
                else if (opt.value == "False")
                    opt.text = sFalse;
            }
        } else if (sColumnDataType == "Date" || sColumnDataType == "DateTime") {
            ddlDate1 = document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId);
            ddlDate2 = document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId);

            if (rdAfCompareColumnCount(sAfId) > 0) {
                // Include the Compare Column option
                if (ddlDate1.options.length == 2) {
                    var opt = document.createElement("OPTION");
                    opt.value = "Compare Column";
                    opt.text = "Compare Column";
                    ddlDate1.add(opt);
                }
                if (ddlDate2.options.length == 2) {
                    var opt = document.createElement("OPTION");
                    opt.value = "Compare Column";
                    opt.text = "Compare Column";
                    ddlDate2.add(opt);
                }
            } else {
                // Do not include the Compare Column option
                if (ddlDate1.options.length == 3) {
                    ddlDate1.remove(2);
                }
                if (ddlDate2.options.length == 3) {
                    ddlDate2.remove(2);
                }
            }
        }

        if (sColumnDataType == "Boolean" && !btnCompColShown) {
            // Boolean type selected, and not comparing column.
            // For Boolean DataTypes, hide the FilterOperator dropdown.It's "=" only, so hide the operator control.
            ShowElement(this.id, "rowFilterOperator_" + sAfId, "Hide")
            ShowElement(this.id, "divPickBoolean_" + sAfId, "Show")
            eleFilterOperator.value = "="
        } else {  //Not Boolean - or Boolean and Compare Column
            ShowElement(this.id, "rowFilterOperator_" + sAfId, "Show")

            //Remove operators not approprate for the data type.
            var aAllowedOperators;
            if (sColumnDataType == "Date" || sColumnDataType == "DateTime") {
                if (document.getElementById("rdAfPickDistinctColumns_" + sAfId).textContent.indexOf(eleFilterColumn.value + ",") != -1) {
                    aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "In List", "Not In List"]   //Don't allow DateRange for Dates selected by list instead of calendar.
                } else {
                    aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "Date Range"]
                }
            } else if (sColumnDataType == "Number") {
                aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "In List", "Not In List", "Range"]
            } else if (sColumnDataType == "Boolean") {
                aAllowedOperators = ["=", "<>"];
                ShowElement(null, "divPickBoolean_" + sAfId, "Show");
            } else {  //Text
                aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "In List", "Not In List", "Starts With", "Contains", "Not Starts With", "Not Contains"]
                //REPDEV-24492 Add support for LIKE and NOT LIKE Filters in Analysis Filter
                var eleSqlSyntax = document.getElementById("rdAfDataSourceSyntax_" + sAfId)
                var sqlSyntax = eleSqlSyntax.value
                //only SqlServer, MySql, Oracle, PostgreSQL support "[not] like" operation.
                if (sqlSyntax == "SqlServer" || sqlSyntax == "MySql" || sqlSyntax == "Oracle" || sqlSyntax == "PostgreSQL") {
                    aAllowedOperators.push("Like")
                    aAllowedOperators.push("Not Like")
                }
            }

            for (var i = eleFilterOperator.options.length - 1; i > -1; i--) {
                if (aAllowedOperators.indexOf(eleFilterOperator.options[i].value) == -1) {
                    eleFilterOperator.remove(i)
                }
            }

            eleFilterOperator.value = sFilterOperator
            if (eleFilterOperator.options.selectedIndex == -1) {
                eleFilterOperator.options.selectedIndex = 0
                sFilterOperator = eleFilterOperator.value
            }
            
            //For number range, show the max range value.
            if (sFilterOperator == 'Range') {
                ShowElement(this.id, 'divFilterValueMax_' + sAfId, 'Show')
            }

            var divFilterValueId;
            if (sFilterOperator == "In List" || sFilterOperator == "Not In List") {
                divFilterValueId = "divFilterValueDelimited_";
                LogiXML.rdInputTextDelimiter.init();
            }
            else
                divFilterValueId = "divFilterValue_";

            ////Show the Distinct pick/selection list.
            if (document.getElementById("rdAfPickDateColumns_" + sAfId).textContent.indexOf(eleFilterColumn.value + ",") != -1) {
                ShowElement(this.id, 'divSlidingTimeStartDateFilterOperator_' + sAfId, 'Show');

                switch (ddlDate1.value) {
                    case "Compare Column":
                        ShowElement(this.id, 'divFilterStartDateColumn_' + sAfId, 'Show');
                        break;
                    case "Specific Date":
                        ShowElement(this.id, 'divFilterStartDateCalendar_' + sAfId, 'Show');
                        break;
                    case "Sliding Date":
                        ShowElement(this.id, 'divSlidingTimeStartDateFilterOperatorValues_' + sAfId, 'Show');
                        break;
                }

                if (sFilterOperator == 'Date Range') {
                    ShowElement(this.id, 'divSlidingTimeEndDateFilterOperator_' + sAfId, 'Show');

                    switch (ddlDate2.value) {
                        case "Compare Column":
                            ShowElement(this.id, 'divFilterEndDateColumn_' + sAfId, 'Show');
                            break;
                        case "Specific Date":
                            ShowElement(this.id, 'divFilterEndDateCalendar_' + sAfId, 'Show');
                            break;
                        case "Sliding Date":
                            ShowElement(this.id, 'divSlidingTimeEndDateFilterOperatorValues_' + sAfId, 'Show');
                            break;
                    }
                }

                //Add Time controls
                if (sColumnDataType == "DateTime") {
                    ShowElement(this.id, 'divFilterStartTime_' + sAfId, 'Show')
                    ShowElement(this.id, 'divFilterEndTime_' + sAfId, 'Show')
                }

                // Distinct values popup.
            } else if (document.getElementById("rdAfPickDistinctColumns_" + sAfId).textContent.indexOf(eleFilterColumn.value + ",") != -1 && sFilterOperator != "Range") {
                ShowElement(this.id, 'divPickDistinctPopUpButton_' + sAfId, 'Show')
                ShowElement(this.id, divFilterValueId + sAfId, 'Show')

            }
            else {
                ShowElement(this.id, divFilterValueId + sAfId, 'Show')
            }

        }
    }
}

function rdSetPickDistinctUrl(sAfId) {

    //Put the picked column details into the URL.
    var eleFilterValues = document.getElementById("rdAfFilterValue_" + sAfId)
    var eleFilterValuesDelimited = document.getElementById("rdAfFilterValueDelimited_" + sAfId)
    var eleFilterColumn = document.getElementById("rdAfFilterColumnID_" + sAfId)
    var sDataColumn = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "DataColumns")
    var sColumnDataType = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Types")
    var eleFilterOperator = document.getElementById("rdAfFilterOperator_" + sAfId)
    var elePopupIFrame = document.getElementById("subPickDistinct_" + sAfId)
    var sSrc = elePopupIFrame.getAttribute("data-hiddensourceOriginal");
    if (!sSrc) {
        sSrc = elePopupIFrame.getAttribute("data-hiddensource")
    }
    elePopupIFrame.setAttribute("data-hiddensourceOriginal", sSrc);  //Preserve this in case it's called again.
    sSrc += "&rdAnalysisFilterID=" + encodeURIComponent(sAfId)

    if (eleFilterOperator.value == "In List" || eleFilterOperator.value == "Not In List")
        sSrc += "&rdAfValues=" + encodeURIComponent(eleFilterValuesDelimited.value);
    else
        sSrc += "&rdAfValues=" + encodeURIComponent(eleFilterValues.value);

    sSrc += "&rdAfDataColumn=" + encodeURIComponent(sDataColumn)
    sSrc += "&rdAfColumnDataType=" + encodeURIComponent(sColumnDataType)
    sSrc += "&rdAfFilterOperator=" + encodeURIComponent(eleFilterOperator.value)
    sSrc += "&rdAfColumnFormat=" + encodeURIComponent(rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Formats"))
    elePopupIFrame.setAttribute("data-hiddensource", sSrc);
}

function rdAfGetColumnDetails(sColumnID, sAfId, sDetailType) {
    //sDetailType must be "Types" or "Formats".
    //These are spans inside a hidden div now...    
    var eleAfDataColumnDetails = document.getElementById('rdAfDataColumn' + sDetailType + '_' + sAfId);
    if (eleAfDataColumnDetails.textContent != '') {
        var sDataColumnDetails = eleAfDataColumnDetails.textContent;
        var aDataColumnDetails = sDataColumnDetails.split(',')
        if (aDataColumnDetails.length > 0) {
            var i;
            for (i = 0; i < aDataColumnDetails.length; i++) {
                var sDataColumnDetail = aDataColumnDetails[i];
                if (sDataColumnDetail.length > 1 && sDataColumnDetail.indexOf(':') > -1) {
                    var sID = sDataColumnDetail.split(':')[0];
                    if (sID == sColumnID) {
                        return sDataColumnDetail.split(':')[1];
                    }
                }
            }
        }
    }
}

function rdAfRemoveAllWhiteSpaceNodesFromFilterOperatorDropdown(sAfId) {
    // Function removes all the unnecessary text/WhiteSpace nodes from the dropdown which cause issues with different browsers.
    var elerdAfFilterOperator = document.getElementById("rdAfFilterOperator_" + sAfId);
    if(elerdAfFilterOperator){
        for(i=0; i<= elerdAfFilterOperator.childNodes.length; i++){
            if(elerdAfFilterOperator.childNodes[i]) 
                if(elerdAfFilterOperator.childNodes[i].nodeName == '#text')
                    elerdAfFilterOperator.removeChild(elerdAfFilterOperator.childNodes[i]);
        }
    }
}

function rdAfMovePopup(popup) {
    if (!popup || !popup.tagName || !popup.parentNode || popup.parentNode.id == "rdMainBody")
        return;

    var main = popup;

    while (main.id != "rdMainBody") {
        main = main.parentNode;
        if (!main)
            return;
    }

    if (main.id == "rdMainBody") {
        main.appendChild(popup);
    }
}

function rdAfShowColumnPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = null;
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfShowColumnMaxPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = "Max";
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfShowColumnStartPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = "Start";
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfShowColumnEndPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = "End";
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfInitControlVisibility(sAfId) {
    // Function hides all the Divs mentioned below used to seperate elements that are used in specific conditions under the Filters section.
    ShowElement(this.id, "divFilterValue_" + sAfId, "Hide", null, "true")
    ShowElement(this.id, "divFilterValueDelimited_" + sAfId, "Hide", null, "true")
    ShowElement(this.id, "divPickDistinctPopUpButton_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divPickCompareColumnPopUpButton_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divPickCompareColumnPopUpButtonMax_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeStartDateFilterOperator_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeEndDateFilterOperator_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeStartDateFilterOperatorValues_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeEndDateFilterOperatorValues_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterStartDateCalendar_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterEndDateCalendar_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterStartDateColumn_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterEndDateColumn_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, 'divFilterStartTime_' + sAfId, 'Hide', null, "true");
    ShowElement(this.id, 'divFilterEndTime_' + sAfId, 'Hide', null, "true");
    ShowElement(this.id, "divPickBoolean_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, 'divFilterValueMax_' + sAfId, 'Hide');
}

function rdAfShowSimpleList(sAfId) {
    ShowElement(this.id, "divFilterValue_" + sAfId, "Hide")
    ShowElement(this.id, "divFilterValueDelimited_" + sAfId, "Hide")
    ShowElement(this.id, "divAfSimpleEditControls_" + sAfId, "Hide")
    ShowElement(this.id, "rowFilterColumn_" + sAfId, "Hide")
    ShowElement(this.id, "rowAddFilter_" + sAfId, "Hide")
    ShowElement(this.id, "rdAfSlidingTimeStartDateFilterOperator_" + sAfId, "Hide")
    ShowElement(this.id, "rdAfSlidingTimeEndDateFilterOperator_" + sAfId, "Hide")
}
		
function rdAfSetPickedFilterValueByRow(sAfId, nPickListRowNr) {
    var fraPopup = document.getElementById("subPickDistinct_" + sAfId);
    var eleValue = fraPopup.contentWindow.document.getElementById("lblFilter_Row" + nPickListRowNr);
    var sValue;
    if (eleValue.textContent) {
        sValue = eleValue.textContent; //Mozilla
    } else {
        sValue = eleValue.innerText;  //IE
    }
    document.getElementById("rdAfFilterValue_" + sAfId).value = sValue;
}

function rdAfSetPickedFilterValues(sAfId, aValues) {
    var input = document.getElementById("rdAfFilterValueDelimited_" + sAfId);
    LogiXML.rdInputTextDelimiter.setEntries(input, aValues);
}

function rdAfRestoreClickedFilter(sAfId, sFilterColumnID, sFilterOperator, sFilterValue, sDateType, sSlidingDateName, sFormat) {
    // Function gets called when a filter link (with the filter info displayed the table) is clicked. 

   //Set the column name.
    document.getElementById("rdAfFilterColumnID_" + sAfId).value = sFilterColumnID;
    rdAfUpdateEditControls(sAfId)  //Update the Operator dropdown list.

    //Set the comparison operator.
    sFilterOperator = sFilterOperator.replace('&lt;', '<');
    document.getElementById("rdAfFilterOperator_" + sAfId).value = sFilterOperator;

    //Set the value(s)
    var sColumnDataType = rdAfGetColumnDetails(sFilterColumnID, sAfId, "Types")

    sFilterValue = LogiXML.decodeHtml(sFilterValue, true);

     //Text and number columns.
    if (sColumnDataType == "Text" || sColumnDataType == "Number") {
        if (sFilterOperator == "Range" && sFilterValue.indexOf("|") != -1) {
            document.getElementById("rdAfFilterValue_" + sAfId).value = sFilterValue.split("|")[0]
            document.getElementById("rdAfFilterValueMax_" + sAfId).value = sFilterValue.split("|")[1]
        } else if (sFilterOperator == "In List" || sFilterOperator == "Not In List") {
            var input = document.getElementById("rdAfFilterValueDelimited_" + sAfId);
            var delimiter = input.getAttribute("data-delimiter");
            var qualifier = input.getAttribute("data-qualifier");
            var escape = input.getAttribute("data-escape");
            var entries = LogiXML.rdInputTextDelimiter.getEntries(sFilterValue, delimiter, qualifier, escape, false);
            setTimeout(function () {
                var input = document.getElementById(this.inputID);
                LogiXML.rdInputTextDelimiter.setEntries(input, this.entries);
            }.bind({
                inputID: input.id,
                entries: entries.slice()
            }), 100);
        } else {
            document.getElementById("rdAfFilterValue_" + sAfId).value = sFilterValue
        }
    }
    //Boolean columns with checkbox.
    if (sColumnDataType == "Boolean") {
        var sFilterValueLower = sFilterValue.toLowerCase()
        if (sFilterValueLower == "false" || sFilterValueLower == "off" || sFilterValueLower == "no" || sFilterValueLower == "0") {
            document.getElementById("rdAfFilterValueBoolean_" + sAfId).checked = false
        } else if (sFilterValueLower == "true" || sFilterValueLower == "on" || sFilterValueLower == "yes" || sFilterValueLower == "1") {
            document.getElementById("rdAfFilterValueBoolean_" + sAfId).checked = true
        }
    }

    //Dates
    if (sColumnDataType.indexOf("Date")!=-1) {
        if (sFilterOperator == "In List" || sFilterOperator == "Not In List") {
            var input = document.getElementById("rdAfFilterValueDelimited_" + sAfId);
            var delimiter = input.getAttribute("data-delimiter");
            var qualifier = input.getAttribute("data-qualifier");
            var escape = input.getAttribute("data-escape");
            var entries = LogiXML.rdInputTextDelimiter.getEntries(sFilterValue, delimiter, qualifier, escape, false);

            setTimeout(function () {
                var input = document.getElementById(this.inputID);
                LogiXML.rdInputTextDelimiter.setEntries(input, this.entries);
            }.bind({
                inputID: input.id,
                entries: entries.slice()
            }), 100);
        } else {
            var sInputElementValue = sFilterValue.split('|')[0];
            var bCompCol = (sInputElementValue.indexOf('[') >= 0);

            if (bCompCol) {
                document.getElementById("rdAfFilterStartDate_" + sAfId).value = '';
                document.getElementById("rdAfFilterStartDateColumn_" + sAfId).value = sInputElementValue;
            } else {
                //Format ?
                if (sFormat) {
                    var dInputElementValue = new Date(sInputElementValue)
                    sInputElementValue = LogiXML.HighchartsFormatters.format(dInputElementValue, sFormat)
                }
                document.getElementById("rdAfFilterStartDate_" + sAfId).value = sInputElementValue;
            }

            document.getElementById("rdAfFilterValue_" + sAfId).value = sInputElementValue;
            document.getElementById("rdAfFilterEndDate_" + sAfId).value = '';
            document.getElementById("rdAfFilterEndDateColumn_" + sAfId).value = '';

            if (sDateType) {
                var sDateTypeOperator = sDateType.split(',')[0];
                if (sDateTypeOperator)
                    document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId).value = sDateTypeOperator;
            }
            else {
                document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId).value = "Specific Date";
            }


            if (sSlidingDateName) {
                var sSlidingDateValue = sSlidingDateName.split(',')[0];
                if (sSlidingDateValue)
                    document.getElementById("rdAfSlidingTimeStartDateFilterOperatorOptions_" + sAfId).value = sSlidingDateValue;
            }
            if (sFilterValue.split('|')[1]) {
                sInputElementValue = sFilterValue.split('|')[1];

                var bCompCol = sInputElementValue.indexOf('[') >= 0;

                if (bCompCol) {
                    document.getElementById("rdAfFilterEndDateColumn_" + sAfId).value = sInputElementValue;
                    document.getElementById("rdAfFilterEndDate_" + sAfId).value = "";
                } else {
                    //Format ?
                    if (sFormat) {
                        var dInputElementValue = new Date(sInputElementValue)
                        sInputElementValue = LogiXML.HighchartsFormatters.format(dInputElementValue, sFormat)
                    }
                    document.getElementById("rdAfFilterEndDate_" + sAfId).value = sInputElementValue;
                    document.getElementById("rdAfFilterEndDateColumn_" + sAfId).value = "";
                }

                if (sDateType) {
                    var sDateTypeOperator = sDateType.split(',')[1];
                    if (sDateTypeOperator)
                        document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId).value = sDateTypeOperator;
                }
                else {
                    document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId).value = "Specific Date";
                }

                if (sSlidingDateName) {
                    var sSlidingDateValue = sSlidingDateName.split(',')[1];
                    if (sSlidingDateValue)
                        document.getElementById("rdAfSlidingTimeEndDateFilterOperatorOptions_" + sAfId).value = sSlidingDateValue;
                }
            }

            //Split the start time from the date.
            if (document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId).value == "Specific Date") {
                var aDateAndTime = sFilterValue.split(' ');
                if (aDateAndTime.length == 1) {
                    aDateAndTime = sFilterValue.split('T')
                }

                var clearTime = false;

                if (aDateAndTime.length > 1) {
                    var sTime = aDateAndTime[aDateAndTime.length - 1]
                    if (sTime == "00:00:00") {
                        sTime = ""
                    }
                    if (sTime.indexOf(":") != 0) {
                        document.getElementById("rdAfFilterStartDate_" + sAfId).value = aDateAndTime[0]
                        document.getElementById("rdAfFilterStartTime_" + sAfId).value = sTime
                    } else {
                        clearTime = true;
                    }
                } else {
                    clearTime = true;
                }

                if (clearTime)
                    document.getElementById("rdAfFilterStartTime_" + sAfId).value = "";
            }
            //Split the end time from the date.
            if (document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId).value == "Specific Date") {
                var aDateAndTime = document.getElementById("rdAfFilterEndDate_" + sAfId).value.split(' ')
                if (aDateAndTime.length == 1) {
                    aDateAndTime = document.getElementById("rdAfFilterEndDate_" + sAfId).value.split('T')
                }
                if (aDateAndTime.length > 1) {
                    var sTime = aDateAndTime[aDateAndTime.length - 1]
                    if (sTime == "00:00:00") {
                        sTime = ""
                    }
                    if (sTime.indexOf(":") != 0) {
                        document.getElementById("rdAfFilterEndDate_" + sAfId).value = aDateAndTime[0]
                        document.getElementById("rdAfFilterEndTime_" + sAfId).value = sTime
                    }
                }
            }
        }
    }
    
    rdAfUpdateEditControls(sAfId)

    //Set focus to the first input element.
    if (document.getElementById('rdAfMode_' + sAfId).value=="Design") {  
        //Focus for Simple mode is in rdAfEditSimple.
       document.getElementById("rdAfFilterColumnID_" + sAfId).focus()
    }
}


function rdAfEditSimple(sAfId, sFilterID, nRowNumber, sFilterColumnID, sFilterOperator, sFilterValue, sDateType, sSlidingDateName) {
    
    var eleSimpleFilterID = document.getElementById("lblSimpleFilterID_" + sAfId)
    eleSimpleFilterID.textContent = sFilterID

    rdAfRestoreClickedFilter(sAfId, sFilterColumnID, sFilterOperator, sFilterValue, sDateType, sSlidingDateName)


    ShowElement(this.id, "rowFilterOperator_" + sAfId, "Hide")
    ShowElement(this.id, "divAfSimpleEditControls_" + sAfId, "Show", "FadeIn")

    //OK button
    ShowElement(this.id, "divSimpleOkCancel_" + sAfId, "Show", "FadeIn")

    //Move the input controls into the table.
    var eleSimpleControls = document.getElementById("divAfSimpleEditControls_" + sAfId)
    var colSimpleName = document.getElementById("colSimpleName_" + sAfId + "_Row" + nRowNumber)
    colSimpleName.parentNode.appendChild(eleSimpleControls)

    //Ensure all filter captions/names are visible, hide this one.
    for (var i = 1; i < 10000; i++) {
        var eleSimpleName = document.getElementById("colSimpleName_" + sAfId + "_Row" + i)
        if (!eleSimpleName) { break }
        ShowElement(this.id, eleSimpleName.id, "Show", "FadeIn")
    }

    ShowElement(this.id, colSimpleName.id, "Hide")

    //Set the column name as the caption for the input controls.
    var sColumnName = colSimpleName.textContent  //Example: "or [Already Shipped] = True"
    var nColNameStart = sColumnName.indexOf("[")
    sColumnName = sColumnName.substring(nColNameStart + 1)            //Example: "Already Shipped] = True"
    sColumnName = sColumnName.substring(0, sColumnName.indexOf("]"))  //Example: "Already Shipped"
    var eleSimpleControls = document.getElementById("lblFilterValue_" + sAfId)
    eleSimpleControls.textContent = sColumnName + ": "
            

    //Set focus to the first input element.
    if (document.getElementById("divFilterValue_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterValue_" + sAfId).select()
    } else if (document.getElementById("divFilterValueDelimited_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterValueDelimited_" + sAfId).select()
    }else if (document.getElementById("divPickBoolean_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterValueBoolean_" + sAfId).focus()
    }else if (document.getElementById("divFilterStartDateCalendar_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterStartDate_" + sAfId).select()
    }else if (document.getElementById("divSlidingTimeStartDateFilterOperatorValues_" + sAfId).style.display == "") {
        document.getElementById("rdAfSlidingTimeStartDateFilterOperatorOptions_" + sAfId).focus()
    }


}

function rdAfCancelEditSimple(sAfId) {
    ShowElement(this.id, "divAfSimpleEditControls_" + sAfId, "Hide")
    ShowElement(this.id, "divSimpleOkCancel_" + sAfId, "Hide")
    
    //Ensure all filter captions/names are visible.
    for (var i = 1; i < 10000; i++) {
        var eleSimpleName = document.getElementById("colSimpleName_" + sAfId + "_Row" + i)
        if (!eleSimpleName) { break }
        ShowElement(this.id, eleSimpleName.id, "Show")
    }

    //Hack to make Chrome not show in inserted column before the filter caption.
    document.getElementById("dtFilters_" + sAfId).style.display = "none"
    setTimeout(function () {
        document.getElementById("dtFilters_" + sAfId).style.display = ""
    }, 1);

}

