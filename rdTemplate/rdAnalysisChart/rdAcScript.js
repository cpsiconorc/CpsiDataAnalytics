function rdAcUpdateLabelsForGaugeNumber(sAcId, bIsNumberGauge) {
    var eleColorPicker = document.getElementById('rowGaugeMax_' + sAcId).querySelector('#colorPicker_rdAcGaugeMaxColor_' + sAcId);
    if (bIsNumberGauge) {
        document.getElementById('rowGaugeMax_' + sAcId).querySelector('#lblMaxValue').innerText = "Goal-3";
        eleColorPicker.alt = "Pick a color for Goal-3.";
        eleColorPicker.title = "Pick a color for Goal-3.";
    } else {
        document.getElementById('rowGaugeMax_' + sAcId).querySelector('#lblMaxValue').innerText = "Max";
        eleColorPicker.alt = "Pick a color for Max";
        eleColorPicker.title = "Pick a color for Max";
    }
    
}
function rdAcUpdateControls(bRefresh, sReport, sAcId, bInit) {
    var eleBatchSelection = document.getElementById('rowBatchSelection_' + sAcId)
    if (!eleBatchSelection && !bInit) {  //When not batch selection, update the visualization with every control change.
        bRefresh = true
    }

    var sCurrChartType = document.getElementById('rdAcChartType_'+sAcId).value
    //var sElementIDs = sAcId + ",cellAcChart_" + sAcId
    var sElementIDs = sAcId + ",divAcControls_"  + sAcId + ",cellAcChart_" + sAcId

    var bForecast = false;
    if (document.getElementById('rdAcForecastType_' + sAcId) != null) bForecast = true;

    ShowElement(this.id, 'lblChartXLabelColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartXAxisColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartYDataColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartYAxisColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartSizeColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartSizeAggrLabel_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartXLabelColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartXDataColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartsLabelSortSequence_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartsLabelSortSequence_' + sAcId + '-Caption', 'Hide');
    ShowElement(this.id, 'rowChartExtraDataColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartRelevance_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeType_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeMin_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeGoal1_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeGoal2_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeMax_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartExtraAggrListCompare_' + sAcId, 'Hide');

    rdAcUpdateLabelsForGaugeNumber(sAcId, false);

    var eleCrosstab = document.getElementById('rdAcChartCrosstabColumn_' + sAcId)
    var sCrosstabColumn = ''
    if (eleCrosstab) {
        sCrosstabColumn = eleCrosstab.value
    }

	switch (sCurrChartType) {
			case 'Pie':
			case 'Bar':
			    ShowElement(this.id, 'lblChartXLabelColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'lblChartYDataColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartXLabelColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Show'); 
				ShowElement(this.id, 'rdAcChartYAggrLabel_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartYAggrList_'+sAcId,'Show');

				if (sCurrChartType == "Bar") {
				    ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Show');
				}

                //Date GroupBy controls.
                rdAcGetGroupByDateOperatorDiv(document.getElementById('rdAcChartXLabelColumn_' + sAcId).value, sAcId);
                if (sCurrChartType == 'Pie' || sCurrChartType == '') {
                    document.getElementById('rdAcChartsDateGroupBy_' + sAcId).style.display = 'none';
                    document.getElementById('rdAcChartsDateGroupBy_' + sAcId + '-Caption').style.display = 'none';
                    if (bForecast && document.getElementById('rowChartForecast_' + sAcId) != null) {
                        rdAcHideForecast(sAcId);
                    }
                } else {
                    if (bForecast) {
                        document.getElementById('rdAcForecastType_' + sAcId).style.display = '';
                        document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = ''
                        rdModifyTimeSeriesCycleLengthOptions(document.getElementById('rdAcChartsDateGroupBy_' + sAcId), sAcId);
                        rdSetForecastOptions(document.getElementById('rdAcChartXLabelColumn_' + sAcId).value, sAcId);
                        rdShowForecast(document.getElementById('rdAcChartXLabelColumn_' + sAcId).value, sAcId);
                    }
                }

            // Sort sequence control for Text axes for bar and Pie
		    var sLabelColumn = document.getElementById('rdAcChartXLabelColumn_' + sAcId).value
		    var sLabelColumnType = rdAcGetColumnDataType(sLabelColumn, sAcId);
            if (sLabelColumnType == "Text") {
                if (sCurrChartType == 'Bar' || sCurrChartType == 'Pie') {
                    ShowElement(this.id, 'rdAcChartsLabelSortSequence_' + sAcId, 'Show');
                    ShowElement(this.id, 'rdAcChartsLabelSortSequence_' + sAcId + '-Caption', 'Show');
                }
            }

		    //Relevance controls.
		    if (sLabelColumnType == "Text") {
		        if (sCrosstabColumn == '' || sCurrChartType == 'Pie') {  //No relevance filter with crosstabbed bar charts.
		            ShowElement(this.id, 'rowChartRelevance_' + sAcId, 'Show');
		            var sRelevanceType = document.getElementById('rdAcRelevanceType_' + sAcId).value
		            if (sRelevanceType == "None") {
		                ShowElement(this.id, 'rdAcRelevanceValue_' + sAcId, 'Hide');
		                ShowElement(this.id, 'lblShowOthers_' + sAcId, 'Hide');
		                ShowElement(this.id, 'rdAcRelevanceOther_' + sAcId, 'Hide');
                    } else {
		                ShowElement(this.id, 'rdAcRelevanceValue_' + sAcId, 'Show');
		                ShowElement(this.id, 'lblShowOthers_' + sAcId, 'Show');
		                ShowElement(this.id, 'rdAcRelevanceOther_' + sAcId, 'Show');
                    }
		        }
		    }

		    break;

	    case 'Line':
	    case 'Spline':
	        ShowElement(this.id, 'lblChartXAxisColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'lblChartYAxisColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rdAcChartXDataColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rdAcChartYColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Show');
	        rdAcShowLineAggrOptions(sAcId);

	        var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
	        var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);

	        if (sDataColumnType.toLowerCase().indexOf("number") != -1 || sDataColumnType.toLowerCase().indexOf("date") != -1) {
	            if (sDataColumnType.toLowerCase().indexOf("date") != -1) {
	                var sDateTimeAggregation = document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value
	                if (sDateTimeAggregation == '') {
	                    var eleYAggregationDropDown = document.getElementById('rdAcChartYAggrList_' + sAcId)
	                    var sYColumn = document.getElementById('rdAcChartYColumn_' + sAcId).value
	                    if (sYColumn != "") {
	                        var sYDataColumnType = rdAcGetColumnDataType(sYColumn, sAcId);
	                        if (eleYAggregationDropDown && sYDataColumnType.toLowerCase().indexOf("number") != -1) {
	                            eleYAggregationDropDown.value = "AVERAGE"
	                            ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Hide');
	                        }
	                    }
	                }
	            }
	        }
	        
	        ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Hide');

	        if (bForecast) {
	            if (document.getElementById('rdAcChartCrosstabColumn_' + sAcId) && document.getElementById('rdAcChartCrosstabColumn_' + sAcId).value != "") {
	                rdAcHideForecast(sAcId);
	            }
	            else
	            {
	                document.getElementById('rdAcForecastType_' + sAcId).style.display = '';
	                document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = ''
	                rdSetForecastOptions(document.getElementById('rdAcChartXDataColumn_' + sAcId).value, sAcId);
	                rdModifyTimeSeriesCycleLengthOptions(document.getElementById('rdAcChartsDateGroupBy_' + sAcId), sAcId);
	                rdShowForecast(sColumn, sAcId);
	            }	            
	        }
	        rdAcGetGroupByDateOperatorDiv(document.getElementById('rdAcChartXDataColumn_' + sAcId).value, sAcId);
	        break;


	    case 'Scatter':
				ShowElement(this.id, 'lblChartXAxisColumn_'+sAcId,'Show');
				ShowElement(this.id, 'lblChartYAxisColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartXDataColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartYColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Show');
				ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Show');
                
				var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
				var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);

				////if(bForecast) rdAcHideForecast(sAcId);
				document.getElementById('rdAcChartsDateGroupBy_'+sAcId).style.display = 'none';
				document.getElementById('rdAcChartsDateGroupBy_'+sAcId + '-Caption').style.display = 'none';

				if (bForecast) {
				    var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value;
				    rdSetForecastOptions(sColumn, sAcId);
				    rdShowForecast(sColumn, sAcId);
				}
				break;

			case 'Heatmap':
				ShowElement(this.id, 'lblChartXLabelColumn_'+sAcId,'Show');
				ShowElement(this.id, 'lblChartSizeColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartSizeAggrLabel_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartXLabelColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartYAggrList_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartExtraDataColumn_'+sAcId,'Show');

				document.getElementById('rdAcChartsDateGroupBy_'+sAcId).style.display = 'none';
				document.getElementById('rdAcChartsDateGroupBy_'+sAcId + '-Caption').style.display = 'none';
				
				break;

	        case 'Gauge':
	            ShowElement(this.id,'lblChartYDataColumn_' + sAcId, 'Show');
				ShowElement(this.id,'rdAcChartYColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Show');
				ShowElement(this.id, 'rowGaugeType_' + sAcId, 'Show');
				ShowElement(this.id, 'rowGaugeMin_' + sAcId, 'Show');
				ShowElement(this.id,'rowGaugeGoal1_' + sAcId, 'Show');
				ShowElement(this.id,'rowGaugeGoal2_' + sAcId, 'Show');
                ShowElement(this.id, 'rowGaugeMax_' + sAcId, 'Show');
                if (document.getElementById('rdAcGaugeType_' + sAcId).value == "Number") {
                    ShowElement(this.id, 'rowGaugeMin_' + sAcId, 'Hide');
                    rdAcUpdateLabelsForGaugeNumber(sAcId, true);
                }
				break;

    }

    //No forecast with Crosstab.
	if (sCrosstabColumn != '' && (sCurrChartType == 'Bar' || sCurrChartType == 'Line')) {
	    rdAcHideForecast(sAcId)
	}

    //ShowValues Percentage only for Pies.
	var eleShowValuesDropdown = document.getElementById("rdAcShowValues_" + sAcId)
	if (sCurrChartType == "Pie") {
	    if (eleShowValuesDropdown.length < 3) {
	        if (eleShowValuesDropdown.hasAttribute("rdPercentageCaption")) {
	            var eleOptionPercentage = document.createElement("option")
	            eleOptionPercentage.value = eleShowValuesDropdown.getAttribute("Percent")
	            eleOptionPercentage.text = eleShowValuesDropdown.getAttribute("rdPercentageCaption")
	            eleShowValuesDropdown.add(eleOptionPercentage)
            }
	    }
	} else {  //Remove "Percentage"
	    if (eleShowValuesDropdown.length == 3) {
	        eleShowValuesDropdown.setAttribute("rdPercentageCaption", eleShowValuesDropdown.options[2].text)
	        eleShowValuesDropdown.options.remove(2)
	    }
	}
	

	rdAcSetButtonStyle(sAcId,sCurrChartType,'Pie')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Bar')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Line')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Spline')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Scatter')
	rdAcSetButtonStyle(sAcId, sCurrChartType, 'Heatmap')
	rdAcSetButtonStyle(sAcId, sCurrChartType, 'Gauge')

    rdAcLoadDropdowns(sCurrChartType, sAcId);
    if (rdAcLoadDropdowns_changed)
        rdAcUpdateControls(bRefresh, sReport, sAcId, bInit);
	else if (bRefresh) {
	    //fix for extra aggregation and series
	    var extraAggrDD = document.getElementById("rdAcChartExtraAggrListCompare_" + sAcId);
	    if (extraAggrDD && extraAggrDD.style.display.toLowerCase() == "none") {
	        extraAggrDD.value = "";
	    }
	    var crosstabColumnRow = document.getElementById("rowChartCrosstabColumn_" + sAcId);
	    if (crosstabColumnRow && crosstabColumnRow.style.display.toLowerCase() == "none") {
	        var crosstabColumnDD = document.getElementById("rdAcChartCrosstabColumn_" + sAcId);
	        crosstabColumnDD.value = "";
	    }
	    var stackingDD = document.getElementById("rdAcStacking_" + sAcId);
	    if (stackingDD && stackingDD.style.display.toLowerCase() == "none") {	        
	        stackingDD.value = "";
	    }
	    var forecastRow = document.getElementById("rowChartForecast_" + sAcId);
	    if (forecastRow && forecastRow.style.display.toLowerCase() == "none") {
	        var forecastTypeDD = document.getElementById("rdAcForecastType_" + sAcId);
	        forecastTypeDD.value = "none";
	    }
        //Refresh the aggregation type lists.
        sElementIDs += ',lblHeadingAnalChart_' + sAcId;  //This is the AG's panel heading, when running AG.
	    var sAjaxUrl = "rdAjaxCommand=RefreshElement&rdAcRefresh=True&rdRefreshElementID=" + sElementIDs + '&rdReport=' + sReport + '&rdAcId=' + sAcId;
	    sAjaxUrl = sAjaxUrl + '&rdAcNewCommand=True';

        //Parse out WaitPage configuration
	    var waitCfg = ['', '', '']
	    var eleWaitCfg = document.getElementById("rdWaitCfg")
	    if (eleWaitCfg) {
	        try {
	            var sScript = eleWaitCfg.parentElement.href
	            sScript = sScript.substr(sScript.indexOf("["))
	            waitCfg = eval(sScript.substr(0, sScript.indexOf("]") + 1))
	        }
	        catch (e) { }
	    }

	    rdAjaxRequestWithFormVars(sAjaxUrl, 'false', '', true, null, null, waitCfg);
	}
}

function rdHideShowComboAggregationDropDown(bShow, sAcId, majorID)
{
    if (bShow) {
        var stackingType = document.getElementById('rdAcStacking_' + sAcId).value;
        if (stackingType == "") {
            rdAcSetAvailableStacking(sAcId, "rdAcChartCrosstabColumn", "rdAcStacking");
            stackingType = document.getElementById('rdAcStacking_' + sAcId).value;
        }
        /*if (stackingType.indexOf("Combo_") == -1) {
            bShow = false;
        }*/
        else
        {
            rdSetOrientationToVerticalIfLine(sAcId);
        }
        var extraStackingType = document.getElementById('rdAcChartYAggrList_' + sAcId);
        if (extraStackingType && extraStackingType.style.display == "none") {
            bShow = false;
        }
    }


    //Get the data type for the selected column
    var eleCrosstabColumn = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId)
    if (eleCrosstabColumn.value != "") {
        var sCrosstabColumn = eleCrosstabColumn.value
        var sCrosstabDataType = rdAcGetColumnDataType(eleCrosstabColumn.value, sAcId)
        if (sCrosstabDataType == "Text") {
            //If a Text column has NoAggregates, don't show the Aggregate options.
            var eleNoAggrColumns = document.getElementById("rdAcNoAggregatesColumns_" + sAcId)
            var eleNoAggrColumns = eleNoAggrColumns.value.split(",")
            if (eleNoAggrColumns.indexOf(sCrosstabColumn) != -1) {
                var eleCrosstabAggr = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId)
                eleCrosstabAggr.value = ""
                bShow = false
            }
        }
    }


    if (bShow) {
        ShowElement(majorID, 'rdAcChartExtraAggrListCompare_' + sAcId, 'Show');
    } else {
        ShowElement(majorID, 'rdAcChartExtraAggrListCompare_' + sAcId, 'Hide');
        document.getElementById('rdAcChartExtraAggrListCompare_' + sAcId).value = ""
    }
}

function rdAcShowAddToDashboard(sAcId) {
    if (typeof LogiXML.AnalysisGrid.rdAgToggleChartPanel === "function") {
        //Under the AnalysisGrid
        var eleAddToDashboard = document.getElementById("colAnalChartAddDashboard_" + sAcId)
        if (eleAddToDashboard) {
            eleAddToDashboard.style.display = ''
        }
    } else {
        //Under the AC.
        var eleAddToDashboard = document.getElementById("divAddToDashboardPanel_" + sAcId)
        if (eleAddToDashboard) {
            eleAddToDashboard.style.display = ''
        }
    }
}

var rdAcLoadDropdowns_changed;
function rdAcLoadDropdowns(sCurrChartType, sAcId) {
    rdAcLoadDropdowns_changed = false;

    //These column dropdowns are set dynamically, client-side, based on chart type and data type.
    if (sCurrChartType == 'Pie' || sCurrChartType == 'Heatmap') {
        rdAcSetDropdownColumns(sAcId, "rdAcChartXLabelColumn", "Text,Boolean", null , "NoGrouping")
    } else {
        rdAcSetDropdownColumns(sAcId, "rdAcChartXLabelColumn", "Text,Date,DateTime,Boolean", null , "NoGrouping")
    }

    if (sCurrChartType == 'Scatter') {
        rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Number")
    } else if (sCurrChartType == 'Line' || sCurrChartType == 'Spline') {
        var bHaveXAggregation = false;
        var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
        var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);
        var sDateTimeAggregation = document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value
        if (sDataColumnType.toLowerCase().indexOf("date") != -1 && sDateTimeAggregation != '')
            //There's date grouping, so text columns are allowed as long as don't have NoAggregates.  (Text columns act like numeric when aggregated with "count".)
            rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Text,Number", null, "NoAggregates")
        else
            rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Number")
    } else {
        rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Text,Boolean,Number", null, "NoAggregates")
    }

    //Crosstab Column
    var eleCrosstabColumn = document.getElementById('rdAcChartCrosstabColumn_' + sAcId)
    if (eleCrosstabColumn) {

        if (sCurrChartType == 'Bar' || sCurrChartType == 'Line' || sCurrChartType == 'Spline' || sCurrChartType == 'Scatter') {

            var bXAxisGrouping = false
            if (sCurrChartType == 'Bar') {
                bXAxisGrouping = true
            } else if (sCurrChartType == 'Line' || sCurrChartType == 'Spline') {
                var eleDateGroupByDropdown = document.getElementById('rdAcChartsDateGroupBy_' + sAcId);
                if (eleDateGroupByDropdown.style.display != "none") {
                    if (eleDateGroupByDropdown.value != "") {
                        bXAxisGrouping = true
                    }
                }
            }

            rdAcSetDropdownColumns(sAcId, "rdAcChartCrosstabColumn", "Number,Text,Boolean", true, "NoCompare")
            if (bXAxisGrouping) {
                //Remove some columns for bar charts and date-grouped line charts.
                var nlOptions = Y.all('#rdAcChartCrosstabColumn_' + sAcId + " OPTION")._nodes  
                for (var i = nlOptions.length - 1; i >= 0; i--) {
                    var eleOption = nlOptions[i]
                    if (eleOption.value != "") {
                        var sColumn = eleOption.value
                        var sDataType = rdAcGetColumnDataType(eleOption.value, sAcId)
                        if (sDataType=="Text" || sDataType=="Boolean") {
                            //Remove text columns with NoGrouping
                            var eleNoGroupingColumns = document.getElementById("rdAcNoGroupingColumns_"  + sAcId)
                            var aNoGroupingColumns = eleNoGroupingColumns.value.split(",")
                            if (aNoGroupingColumns.indexOf(sColumn) != -1) {
                                eleOption.parentNode.removeChild(eleOption)
                            }
                        } else if (sDataType == "Number") {
                            //Remove number columns with NoAggregates
                            var eleNoAggrColumns = document.getElementById("rdAcNoAggregatesColumns_" + sAcId)
                            var eleNoAggrColumns = eleNoAggrColumns.value.split(",")
                            if (eleNoAggrColumns.indexOf(sColumn) != -1) {
                                eleOption.parentNode.removeChild(eleOption)
                            }
                        }
                    }
                }

            }

        } else {
            //Show no columns in the dropdown, Crosstab not available.
            rdAcSetDropdownColumns(sAcId, "rdAcChartCrosstabColumn", "(none)")
        }

        //Show or Hide.
        if (eleCrosstabColumn.options.length > 1) {  //Hide when no column options.
            ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId, 'Show');
            if (eleCrosstabColumn.value == '') {
                ShowElement(this.id, 'rdAcStacking_' + sAcId, 'Hide');
                rdHideShowComboAggregationDropDown(false, sAcId, this.id);
                ShowElement(this.id, 'rdAcAxisType_' + sAcId, 'Hide');

            } else {
                ShowElement(this.id, 'rdAcStacking_' + sAcId, 'Show');
                rdHideShowComboAggregationDropDown(true, sAcId, this.id);
                var stackingTypeElem = document.getElementById('rdAcStacking_' + sAcId);
                ShowElement(this.id, 'rdAcAxisType_' + sAcId, (stackingTypeElem && stackingTypeElem.value && stackingTypeElem.value.indexOf("Combo_") != -1) ? 'Show' : 'Hide');
            }
        }

    }

    //Set the available aggregation types, depending on data types.
    rdAcSetDropdownAggrs(sAcId, "rdAcChartYAggrList", "rdAcChartYColumn", null, false)
    rdAcSetDropdownAggrs(sAcId, "rdAcChartExtraAggrList", "rdAcChartExtraDataColumn", null, false)
    rdAcSetDropdownAggrs(sAcId, "rdAcChartExtraAggrListCompare", "rdAcChartCrosstabColumn", sCurrChartType, true)

    //REPDEV-22549 overwrites the comment below. As a result, the entire block that was initially added has been commented out instead of deleted for future reference.
    //No Crosstab with Y-axis Min nor Max aggregations.  REPDEV-12923
    //var eleAggrSelect = document.getElementById("rdAcChartYAggrList_" + sAcId)
    //var sSelectedAggr = eleAggrSelect.value
    //if (eleAggrSelect.style.display == "none") {sSelectedAggr = ""}
    //if (sSelectedAggr == "MIN" || sSelectedAggr == "MAX") {
    //    var eleCrosstab = document.getElementById('rdAcChartCrosstabColumn_' + sAcId)
    //    eleCrosstab.value = ""
    //    ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId, 'Hide');
    //} else {
       rdAcSetAvailableStacking(sAcId, "rdAcChartCrosstabColumn", "rdAcStacking", sCurrChartType)
    //} 
}

function rdAcSetDropdownColumns(sAcId, sSelectID, sDataTypes, bAddEmptyValue, sExcludeAttribute) {
        //Remove all existing columns.
        var eleSelect = document.getElementById(sSelectID + '_' + sAcId)
        if (!eleSelect) {
            return;
        }
        //Save the selected value.
        var sSelectedValue = eleSelect.value

        //Strip out the exsiting options.  These may be OPTIONs or OPTGROUPs
        for (var i = eleSelect.childNodes.length - 1; i>=0; i--) {
            var eleColumn = eleSelect.childNodes[i]
            if (eleColumn.tagName == "OPTION" || eleColumn.tagName == "OPTGROUP") {
                if (bAddEmptyValue && eleColumn.tagName == "OPTION" && eleColumn.value == "") {
                    continue;  //Leave the empty/blank option.
                }
                eleSelect.removeChild(eleColumn)
            }
        }

        //Add all the columns.
        var eleAllColumns = document.getElementById('rdAcAllColumnsHidden_' + sAcId)
        for (var i = 0; i < eleAllColumns.childNodes.length; i++) {
            var eleColumn = eleAllColumns.childNodes[i]
            if (eleColumn.tagName == "OPTION" || eleColumn.tagName == "OPTGROUP") {
                eleSelect.appendChild(eleColumn.cloneNode(true))
            }
        }

        //Remove the OPTIONS that don't belong.
        var aExcludeColumns = "".split(",")
        if (sExcludeAttribute) {
            var eleExcludeColumns = document.getElementById("rdAc" + sExcludeAttribute + "Columns_" + sAcId)
            aExcludeColumns = eleExcludeColumns.value.split(",")
        }

        var nlOptions = Y.all('#' + sSelectID + '_' + sAcId + " OPTION")._nodes  
        for (var i = nlOptions.length - 1; i >= 0; i--) {
            var eleOption = nlOptions[i]
            if (eleOption.value != "") {
                var sDataType = rdAcGetColumnDataType(eleOption.value, sAcId)
                if (sDataTypes.indexOf(sDataType) == -1) {
                    eleOption.parentNode.removeChild(eleOption)
                } else if (aExcludeColumns.indexOf(eleOption.value) != -1) {
                    eleOption.parentNode.removeChild(eleOption)
                }
            }
        }

        //Remove any OPTGROUPS without children.
        var nlOptgroups = Y.all('#' + sSelectID + '_' + sAcId + " OPTGROUP")._nodes
        for (var i = nlOptgroups.length - 1; i >= 0; i--) {
            var eleOptgroup= nlOptgroups[i]
            if (eleOptgroup.getElementsByTagName("OPTION").length == 0) {
                eleOptgroup.parentNode.removeChild(eleOptgroup)
            }
        }
        
        //Reselect the previous value, or the first. (need to make sure there is at least one)
        eleSelect.value = sSelectedValue
        if (!bAddEmptyValue && eleSelect.value == "" && eleSelect.options[0]) {
            eleSelect.value = eleSelect.options[0].value 
            rdAcLoadDropdowns_changed = true;
        }
    }


function rdAcSetDropdownAggrs(sAcId, sAggrSelectID, sColumnSelectID, sCurrentChartType, allowBlank) {
    //Remove all existing aggrs.
    var eleAggrSelect = document.getElementById(sAggrSelectID + '_' + sAcId)
    if (!eleAggrSelect) {
        return;
    }
    var sSelectedAggr = eleAggrSelect.value
    for (var i = eleAggrSelect.childNodes.length - 1; i >= 0; i--) {
        var eleAggr = eleAggrSelect.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            eleAggrSelect.removeChild(eleAggr)
        }
    }

    //Get the data type for the selected column
    var eleDataColumn = document.getElementById(sColumnSelectID + '_' + sAcId)
    var sDataType = rdAcGetColumnDataType(eleDataColumn.value, sAcId)

    //Add the aggregations that belong.
    var eleAllAggrs = document.getElementById('rdAcAllAggrsHidden_' + sAcId)
    for (var i = 0; i < eleAllAggrs.childNodes.length; i++) {
        var eleAggr = eleAllAggrs.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            if (sDataType == "Number") {
                if (eleAggr.value != "") {
                    eleAggrSelect.appendChild(eleAggr.cloneNode(true));
                }
            } else {
                if (eleAggr.value.toLowerCase().indexOf("count") != -1 || (eleAggr.value == "" && sCurrentChartType != "Scatter" && allowBlank)) {
                    eleAggrSelect.appendChild(eleAggr.cloneNode(true));

                }
            }
            /*if ((sDataType == "Number" && eleAggr.value != "") || eleAggr.value.toLowerCase().indexOf("count") != -1 || (sDataType != "Number" && eleAggr.value == "")) {
                //All aggregates for Numbers.  Other data types get Count and DistinctCount.
                eleAggrSelect.appendChild(eleAggr.cloneNode(true))
            }*/
        }
    }


    //Reselect the previous value, or the first.
    eleAggrSelect.value = sSelectedAggr
    if (eleAggrSelect.value == "") {
        eleAggrSelect.value = eleAggrSelect.options[0].value
    }

}

function rdAcSetAvailableStacking(sAcId, sCompareColumnDDId, sStackingDDID, sChartType) {
    var eleAggrSelect = document.getElementById(sStackingDDID + '_' + sAcId)
    if (!eleAggrSelect) {
        return;
    }
    var sSelectedAggr = eleAggrSelect.value
    for (var i = eleAggrSelect.childNodes.length - 1; i >= 0; i--) {
        var eleAggr = eleAggrSelect.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            eleAggrSelect.removeChild(eleAggr)
        }
    }

    //Get the data type for the selected column
    var eleDataColumn = document.getElementById(sCompareColumnDDId + '_' + sAcId)
    if (eleDataColumn.value == "") {
        return;
    }
    var sDataType = rdAcGetColumnDataType(eleDataColumn.value, sAcId)
    var eleAggrDD = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId)
    //Add the columns that belong.
    var eleAllAggrs = document.getElementById('rdAcAllStackingHidden_' + sAcId)
    for (var i = 0; i < eleAllAggrs.childNodes.length; i++) {
        var eleAggr = eleAllAggrs.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            if (sDataType == "Number") {                
                if (eleAggr.value.toLowerCase().indexOf("combo") == -1) {
                    continue;
                }
                eleAggrSelect.appendChild(eleAggr.cloneNode(true))
            } else {
                if (eleAggrDD.value == "" && eleAggr.value.toLowerCase().indexOf("combo") != -1) {
                    continue;
                }
                if (eleAggrDD.value != "" && eleAggr.value.toLowerCase().indexOf("combo") == -1) {
                    continue;
                }
                eleAggrSelect.appendChild(eleAggr.cloneNode(true))
            }
            
        }
    }
    //Reselect the previous value, or the first.
    eleAggrSelect.value = sSelectedAggr
    if (eleAggrSelect.value == "") {
        eleAggrSelect.value = eleAggrSelect.options[0].value
    }
    if (sChartType && sChartType=="Scatter" && sDataType != "Number") { //go with hierarchical chart
        ShowElement(this.id, 'rdAcStacking_' + sAcId, 'Hide');
        ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Hide');
    }

    rdSetOrientationToVerticalIfLine(sAcId);
}


function rdAcSetButtonStyle(sAcId,sCurrChartType,sButtonType) {
    var eleButton = document.getElementById('lblChart' + sButtonType + '_' + sAcId)
    if (eleButton) {
        if (sButtonType==sCurrChartType) {
            eleButton.className='rdAcCommandHighlight'
        }else{
            eleButton.className='rdAcCommandIdle'
        }
                
        //Round the first and last buttons.
        var bStyleSet = false
        if (eleButton.parentNode.nextSibling.tagName=="A") {
            if (eleButton.parentNode.previousSibling.id.indexOf('actionShow')!=0) {
                //First button.
                eleButton.className = eleButton.className + " rdAcCommandLeft"
                bStyleSet = true
            }
       }
        if (eleButton.parentNode.previousSibling.tagName=="A") {
            if (eleButton.parentNode.nextSibling.id.indexOf('actionShow')!=0) {
                //Last button.
                eleButton.className = eleButton.className + " rdAcCommandRight"
                bStyleSet = true
            }
        }
        if (!bStyleSet) {  
            //Middle button
            eleButton.className = eleButton.className + " rdAcCommandMiddle"
        }
   
    }
}

function rdShowForecast(sColumn, sAcId){
    if(document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var sColumnDataType = rdAcGetColumnDataType(sColumn, sAcId) //#15892.
    if (!sColumnDataType) {
        rdAcHideForecast(sAcId);
        return;
    }
    if (sColumnDataType.toLowerCase() == "text" || sColumnDataType.toLowerCase() == "boolean") {
        rdAcHideForecast(sAcId);
        return;
    }

    var stackingType = document.getElementById('rdAcStacking_' + sAcId).value;
    if (stackingType && stackingType.indexOf("Combo_") != -1) {
        rdAcHideForecast(sAcId);
        return;
    }

    ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Show');

    var eleForecastType = document.getElementById('rdAcForecastType_' + sAcId);
    if(eleForecastType.value == 'TimeSeriesDecomposition'){       
        if (['FirstDayOfYear','FirstDayOfFiscalYear'].indexOf(document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value) > - 1) {
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        }else{
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = '';
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = '';
        }
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = 'none';
        return;
    }
    else if(eleForecastType.value == 'Regression'){
        var eleRegression = document.getElementById('rdAcRegressionType_' + sAcId);
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = '';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = '';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = 'none';
        return;
    }
    else if (eleForecastType.value == 'TrendLine') {
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = '';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = '';
    }
    else{
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = 'none';
    }
   
}


function rdAcHideForecast(sAcId) {
    if (document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    document.getElementById('rowChartForecast_' + sAcId).style.display = 'none';
    document.getElementById('rdAcForecastType_' + sAcId).style.display = 'none';
    document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = 'none'
    document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
    document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
    document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
    document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
}

function rdAcShowLineAggrOptions(sAcId) {
    //Called for line and spline charts only.
    // Function shows/Hides the Aggregation dropdown based on the X-axis column picked.
    var sXColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
    var sYColumn = document.getElementById('rdAcChartYColumn_' + sAcId).value

    if (sXColumn == '') {
        document.getElementById('rowChartYAggr_' + sAcId).style.display = 'none';   
        return;
    }
    ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Hide');

    var sXColumnType = rdAcGetColumnDataType(sXColumn, sAcId);
    if (sXColumnType.toLowerCase() == "text" || sXColumnType.toLowerCase() == "boolean" || (sXColumnType.toLowerCase().indexOf("date")!=-1 && document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value!='')) {  
        var eleExcludeColumns = document.getElementById("rdAcNoAggregatesColumns_" + sAcId)
        if (eleExcludeColumns.value.split(",").indexOf(sYColumn) == -1) {
            //Y-column is not allowed for aggregations unless the x-column is getting grouped.  Plus aggregations must be allowed.
            ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Show');
            ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Show');
        }
    }
}

 
function rdSetForecastOptions(sColumn, sAcId) {
    if (sColumn == '') return;

    var eleDataForecastDropdown = document.getElementById('rdAcForecastType_' + sAcId);
    if (!eleDataForecastDropdown) return;

    var sForecastValue = eleDataForecastDropdown.value;
    var eleDateGroupByDropdown = document.getElementById('rdAcChartsDateGroupBy_' + sAcId);
    var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);
    var sCurrChartType = document.getElementById('rdAcChartType_' + sAcId).value;
    
    if (sDataColumnType.toLowerCase() == "text" || sDataColumnType.toLowerCase() == "boolean") {
        rdAcHideForecast(sAcId);
        return;
    }

    var rdShadowForecastDropdown = document.getElementById("rdShadowForecastDropdown_" + sAcId);
    if (!rdShadowForecastDropdown) {
        //Save the forecast dropdown so that items can be removed and restored later.
        rdShadowForecastDropdown = eleDataForecastDropdown.parentNode.appendChild(eleDataForecastDropdown.cloneNode(true));
        rdShadowForecastDropdown.setAttribute("id", "rdShadowForecastDropdown_" + sAcId);
        rdShadowForecastDropdown.setAttribute("name", "rdShadowForecastDropdown_" + sAcId);
        rdShadowForecastDropdown.style.display = "none";
    } else {
        //Restore the forecast dropdown from the shadow options.  This will have all options, including those that may have been removed before.
        eleDataForecastDropdown.parentNode.removeChild(eleDataForecastDropdown)
        eleDataForecastDropdown = rdShadowForecastDropdown.parentNode.appendChild(rdShadowForecastDropdown.cloneNode(true))
        eleDataForecastDropdown.setAttribute("id", "rdAcForecastType_" + sAcId)
        eleDataForecastDropdown.setAttribute("name", "rdAcForecastType_" + sAcId)
        eleDataForecastDropdown.style.display = ""
        eleDataForecastDropdown.value = sForecastValue
    }
    
    if ((sDataColumnType.toLowerCase() != "date" && sDataColumnType.toLowerCase() != "datetime") || sCurrChartType.toLowerCase() == "scatter") {
        var eleRemove = Y.one("#rdAcForecastType_" + sAcId + " OPTION[value=TimeSeriesDecomposition")
        if (eleRemove) {
            eleDataForecastDropdown.removeChild(eleRemove._node)
        }
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
    }

    if (sCurrChartType.toLowerCase() == "scatter") {
        var eleRemove = Y.one("#rdAcForecastType_" + sAcId + " OPTION[value=Regression")
        if (eleRemove) {
            eleDataForecastDropdown.removeChild(eleRemove._node)
        }
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
    }

}

function rdResetOrientation(sAcId) {
    var eleOrientation = document.getElementById('rdAcOrientation_' + sAcId)
    if (eleOrientation == null) return;
    var eleLabelColumn = document.getElementById('rdAcChartXLabelColumn_' + sAcId)
    if (eleLabelColumn == null) return;
    var sLabelColumnType = rdAcGetColumnDataType(eleLabelColumn.value, sAcId);
    if (sLabelColumnType.toLowerCase() == "date" || sLabelColumnType.toLowerCase() == "datetime") {
        eleOrientation.value = "Vertical"
    }else{
        eleOrientation.value = "Horizontal"    
    }
}

function rdSetOrientationToVerticalIfLine(sAcId) {
    var eleStacking = document.getElementById('rdAcStacking_' + sAcId);
    if (!eleStacking)
        return;

    var value = eleStacking.value;
    if (value == "Combo_Line" || value == "Combo_Spline") {
        var eleOrientation = document.getElementById('rdAcOrientation_' + sAcId);
        if (eleOrientation == null)
            return;

        eleOrientation.value = "Vertical";
        
        ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Hide');
    }    
}

function rdSetStackingUserFlag(sAcId) {
    var eleUserValueIsSet = document.getElementById('rdExplicitlyUserSetComboChartType_' + sAcId)
    if (eleUserValueIsSet) {
        eleUserValueIsSet.value = "true";
    }
}

function rdSetAdditionalColumnAxisType(sAcId) {
    var eleAxisType = document.getElementById('rdAcAxisType_' + sAcId);
    ShowElement(this.id, 'rdAcAxisType_' + sAcId, 'Show');
}

function rdAcGetColumnDataType(sColumn, sAcId){
    var eleAcDataColumnDetails = document.getElementById('rdAcDataColumnDetails_' + sAcId);
    if(eleAcDataColumnDetails.value != ''){
        var sDataColumnDetails = eleAcDataColumnDetails.value;
        var aDataColumnDetails = sDataColumnDetails.split(',')
        if(aDataColumnDetails.length > 0){
            var i;
            for(i=0;i<aDataColumnDetails.length;i++){
                var sDataColumnDetail = aDataColumnDetails[i];
                if(sDataColumnDetail.length > 1 && sDataColumnDetail.indexOf(':') > -1){
                    var sDataColumn = sDataColumnDetail.split(':')[0];
                    if(sDataColumn == sColumn){
                        return sDataColumnDetail.split(':')[1];
                    }
                }
            }
        }
    }
}

function rdModifyTimeSeriesCycleLengthOptions(sColumnGroupByDropdown, sAcId){
    if(document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var eleTimeSeriesCycleLengthDropdown = document.getElementById('rdAcTimeSeriesCycle_' + sAcId);
    var sTimeSeriesCycleLength = eleTimeSeriesCycleLengthDropdown.value;
    var sColumnGroupByValue = sColumnGroupByDropdown.value
    var i; var j = 0;
    //var aColumnGroupByOptions = ['Year', 'Quarter', 'Month', 'Week', 'Day', 'Hour']; 
    
    rdResetTimeSeriesCycleLenthDropdown(sAcId, sColumnGroupByValue, sTimeSeriesCycleLength);

    if (sColumnGroupByValue == 'FirstDayOfYear') {
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
    } else if (document.getElementById('rdAcForecastType_' + sAcId).value == 'TimeSeriesDecomposition') {
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = '';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = '';
    }

    if (eleTimeSeriesCycleLengthDropdown.value == '') {
		if (eleTimeSeriesCycleLengthDropdown.options.length > 0) {
			var tempValue = eleTimeSeriesCycleLengthDropdown.options[eleTimeSeriesCycleLengthDropdown.options.length - 1].value;
			if (tempValue != 'Hour') eleTimeSeriesCycleLengthDropdown.value = tempValue;
		}
    }
}

function rdResetTimeSeriesCycleLenthDropdown(sAcId) {
    if (document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var eleTimeSeriesCycleLengthDropdown = document.getElementById('rdAcTimeSeriesCycle_' + sAcId);
    var i; var aColumnGroupByOptions = ['', 'Year', 'Quarter', 'Month', 'Week', 'Day'];
    if (eleTimeSeriesCycleLengthDropdown.options.length > 5) return;
    for (i = 0; i < 7; i++) {
        if (eleTimeSeriesCycleLengthDropdown.options.length > 0) {
            eleTimeSeriesCycleLengthDropdown.remove(0);
        } else {
            break;
        }
    }
    for (i = 0; i < aColumnGroupByOptions.length; i++) {
        var eleTimeSeriesOption = document.createElement('option');
        eleTimeSeriesOption.text = aColumnGroupByOptions[i];
        eleTimeSeriesOption.value = aColumnGroupByOptions[i];
        eleTimeSeriesCycleLengthDropdown.add(eleTimeSeriesOption);
    }
}
function rdResetTimeSeriesCycleLenthDropdown(sAcId, sColumnGroupByValue, sCurSelectedValue) {
    if (document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var eleTimeSeriesCycleLengthDropdown = document.getElementById('rdAcTimeSeriesCycle_' + sAcId);
    var aColumnGroupByOptions = ['', 'Year', 'Quarter', 'Month', 'Week', 'Day', 'Hour']; //HOUR IS FOR 24500

    while (eleTimeSeriesCycleLengthDropdown.options.length > 0)
        eleTimeSeriesCycleLengthDropdown.options.remove(0);

    var nNewOptCount = 0;
    switch (sColumnGroupByValue) {
        case 'FirstDayOfYear':
            nNewOptCount = 1;// ''
            break;
        case 'FirstDayOfQuarter':
        case 'FirstDayOfFiscalQuarter':
            nNewOptCount = 2;//'' & Year
            break;
        case 'FirstDayOfMonth':
            nNewOptCount = 3;//'' & Year & Quarter
            break;
        case 'FirstDayOfWeek':
            nNewOptCount = 4;//'' & Year & Quarter & Month
            break;
        case 'Date':
        case 'DateTime':
            nNewOptCount = 5;//'' & Year & Quarter & Month & Week
            break;
        case "FirstMinuteOfHour":
            nNewOptCount = 6;//'' & Year & Quarter & Month & Week & Day
            break;
        case "FirstSecondOfMinute":
            nNewOptCount = 7;//'' & Year & Quarter & Month & Week & Day & Hour
            break;
        default: //No By, SHOW ALL
            nNewOptCount = aColumnGroupByOptions.length;
    }
    for (var i = 0; i < nNewOptCount; i++) {
        var eleTimeSeriesOption = document.createElement('option');
        eleTimeSeriesOption.text = aColumnGroupByOptions[i];
        eleTimeSeriesOption.value = aColumnGroupByOptions[i];
        eleTimeSeriesCycleLengthDropdown.add(eleTimeSeriesOption);

        if (eleTimeSeriesOption.value == sCurSelectedValue)
            eleTimeSeriesCycleLengthDropdown.value = sCurSelectedValue;
    }
}

function rdAcGetGroupByDateOperatorDiv(sDataColumn,sAcId){
    if(typeof(sDataColumn) == 'undefined'){
        document.getElementById('rdAcChartsDateGroupBy_'+sAcId).style.display = 'none';
	    document.getElementById('rdAcChartsDateGroupBy_'+sAcId + '-Caption').style.display = 'none';
    }
    var eleDateColumnsForGrouping = document.getElementById('rdAcPickDateColumnsForGrouping_' + sAcId);
    if(eleDateColumnsForGrouping != null){
        if (eleDateColumnsForGrouping.value.length > 0) {
			var sEleDateColumnsForGrouping = eleDateColumnsForGrouping.value.replace(",","");
            sEleDateColumnsForGrouping = sEleDateColumnsForGrouping.replace(",,", ",");
            aDateColumns = sEleDateColumnsForGrouping.split(",");
            for (i = 0; i < aDateColumns.length; i++) {
                if ((aDateColumns[i] == sDataColumn)) {
                    document.getElementById('rdAcChartsDateGroupBy_' + sAcId).style.display = '';
                    document.getElementById('rdAcChartsDateGroupBy_' + sAcId + '-Caption').style.display = '';
                    break;
                }
                else {
                    document.getElementById('rdAcChartsDateGroupBy_' + sAcId).style.display = 'none';
                    document.getElementById('rdAcChartsDateGroupBy_' + sAcId + '-Caption').style.display = 'none';
                }
            }
        }
        else {
            document.getElementById('rdAcChartsDateGroupBy_' + sAcId).style.display = 'none';
            document.getElementById('rdAcChartsDateGroupBy_' + sAcId + '-Caption').style.display = 'none';
        }
    }
    else {
        document.getElementById('rdAcChartsDateGroupBy_'+sAcId).style.display = 'none';
	    document.getElementById('rdAcChartsDateGroupBy_'+sAcId + '-Caption').style.display = 'none';
    }
}
function rdAcSetComboType(sAcId) {
    var sCurrChartType = document.getElementById('rdAcChartType_' + sAcId).value
    var eleAggrDD = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId)
    var eleAggrSelect = document.getElementById("rdAcStacking" + '_' + sAcId)
    if (!eleAggrSelect || !eleAggrDD) 
        return;
    var userValue = eleAggrSelect.value;
    rdAcSetAvailableStacking(sAcId, "rdAcChartCrosstabColumn", "rdAcStacking", sCurrChartType)
    var bUserValueIsSet = false;
    var eleUserValueIsSet = document.getElementById('rdExplicitlyUserSetComboChartType_' + sAcId)
    if (eleUserValueIsSet) {
        bUserValueIsSet = eleUserValueIsSet.value.toLowerCase() == "true";
    }
    if (bUserValueIsSet && userValue != "") {
        eleAggrSelect.value = userValue;
    }
    else {
        if (eleAggrDD.value == "") {
            eleAggrSelect.value = "stacked";
        } else if (eleAggrDD.value.toLowerCase().indexOf("count") != -1) {
            eleAggrSelect.value = "Combo_" + sCurrChartType;
        }
    }
}

function rdAcSetStackingType(sAcId) {
    var eleExtraColumnDD = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId);
    var eleAggrSelect = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId);
    if (!eleAggrSelect || !eleExtraColumnDD || eleExtraColumnDD.value == "") {
        return;
    }
    var columnType = rdAcGetColumnDataType(eleExtraColumnDD.value, sAcId);
    if (columnType.toLowerCase() == "text") {
        eleAggrSelect.value = "";
    }
    rdAcSetComboType(sAcId);
}
