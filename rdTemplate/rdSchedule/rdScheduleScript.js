// Builds the ScheduleXml and ProcessParams documents stored in hidden input fields, based on the user's selections.
function rdSchSave(schId,eleId) {
    var sValidate = rdSchValidateForm(schId); // First validate the form.
    if (sValidate != null && sValidate != "") {
        // First, fetch the ScheduleXml document from its hidden field, which carries the same ID as the element itself.
        var sXml = htmlDecode(document.getElementById(schId).value);
        var sAttr = null; var iIndex = null; var tmpElement = null; var sOldValue = null; var sNewValue = null;
        // The eleId parameter is coded into the template for all of the input fields where reverting to the previous value is supported.
        switch(eleId) {
            case "StartDate":
            case "EndDate":
                // The date range inputs are reverted the same way.
                // First prepare the two variables the differ.
                switch (eleId) {
                    case "StartDate": sAttr = "StartDate=\""; tmpElement = document.getElementById("datSchStartDate_" + schId); break;
                    case "EndDate": sAttr = "EndDate=\""; tmpElement = document.getElementById("datSchEndDate_" + schId); break;
                }
                iIndex = sXml.indexOf(sAttr); // Locate the attribute name in the document.
                sNewValue = tmpElement.value; // Grab the value the user entered so we can display it to them.
                break;
            case "Minutes":
            case "Hourly":
            case "Days":
            case "Weeks":
            case "DayOfMonth":
                // Again, set variables specific to the element.
                switch (eleId) {
                    case "Minutes": sAttr = "RunEveryXMinutes=\""; tmpElement = document.getElementById("selSchMinutes_" + schId); break;
                    case "Hourly": sAttr = "RunEveryXHours=\""; tmpElement = document.getElementById("selSchHourly_" + schId); break;
                    case "Days": sAttr = "RunEveryXDays=\""; tmpElement = document.getElementById("txtSchDays_" + schId); break;
                    case "Weeks": sAttr = "RunEveryXWeeks=\""; tmpElement = document.getElementById("txtSchWeeks_" + schId); break;
                    case "DayOfMonth": sAttr = "DayOfMonth=\""; tmpElement = document.getElementById("txtSchMonths_" + schId); break;
                }
                iIndex = sXml.indexOf(sAttr) + sAttr.length; // Locate the attribute name in the document.
                sNewValue = tmpElement.value; // Grab the value the user entered so we can display it to them.
                break;
              
        }

        // Alert the user to the validation issue.
        if (sNewValue != null) { alert(sValidate + "\n\nValue: " + sNewValue); }
        else { alert(sValidate); }
        return "";
    }
    else {
        // The document passed validation, so it's time to rebuild the ScheduleXml document.
        var sInterval = document.getElementById('selSchInterval_' + schId).value;
        // First set the interval, and set to MonthlyDayOfWeek if Monthly is selected in the drop-down-list and the MonthlyDayOfWeek box is checked.
        var sXml = "<Schedule Type=\"" + (sInterval == "Monthly" && document.getElementById("chkSchMonthDayInterval_" + schId + "_1").checked ? "MonthlyDayOfWeek" : sInterval) + "\"";

        // Parse the start date using the format value specified on the node, and then re-format it for storage in ISO standard format.
        var tmpElement = document.getElementById("datSchStartDate_" + schId);
        var tmpDate = rdSchParseDate(tmpElement.attributes["rdFormatValue"].value, tmpElement.value);
        sXml += " StartDate=\"" + formatDate(tmpDate, "yyyy-MM-dd") + "\"";

        // If end date is checked and has a value,
        // Parse the end date using the format value specified on the node, and then re-format it for storage in ISO standard format.
        if (document.getElementById("chkSchEndDate_" + schId).checked &&
                document.getElementById("datSchEndDate_" + schId).value != "") {
            var tmpElement = document.getElementById("datSchEndDate_" + schId);
            var tmpDate = rdSchParseDate(tmpElement.attributes["rdFormatValue"].value, tmpElement.value);
            sXml += " EndDate=\"" + formatDate(tmpDate, "yyyy-MM-dd") + "\"";
            
            if (sInterval == "Minutes" || sInterval == "Hourly")
                sXml += " EndTime=\"" + document.getElementById("selSchEndTime_" + schId).value + "\"";
        }
        // Set the first run time.
        sXml += " FirstRunTime=\"" + document.getElementById("selSchFirstRunTime_" + schId).value + "\"";
        

        // For each interval, add in the appropriate attributes.
        switch (sInterval) {
            case "Once":
                break;
            case "Minutes":
                sXml += " RunEveryXMinutes=\"" + document.getElementById("selSchMinutes_" + schId).value + "\"";
                break;
            case "Hourly":
                sXml += " RunEveryXHours=\"" + document.getElementById("selSchHourly_" + schId).value + "\"";
                break;
            case "Daily":
                sXml += " RunEveryXDays=\"" + document.getElementById("txtSchDays_" + schId).value + "\"";
                break;
            case "Weekly":
                sXml += " RunEveryXWeeks=\"" + document.getElementById("txtSchWeeks_" + schId).value + "\"";
                sXml += " DaysOfWeek=\"" + rdSchDaysOfWeek(schId) + "\""; // DaysOfWeek's value is compiled in a separate method to keep this block of code clean.
                break;
            case "Monthly":
                if (document.getElementById("chkSchMonths_" + schId + "_1").checked) {
                    sXml += " DayOfMonth=\"" + document.getElementById("txtSchMonths_" + schId).value + "\"";
                } else {
                    sXml += " MonthlyNthOccurrence=\"" + document.getElementById("selSchMonthDayInterval_" + schId).value + "\"";
                    sXml += " MonthlyDayOfWeek=\"" + document.getElementById("selSchVariableMonthDay_" + schId).value + "\"";
                }
                sXml += " Months=\"" + rdSchMonths(schId) + "\""; // Months' value is compiled in a separate method to keep this block of code clean.
                break;
        }
        sXml += " />";

        // Store the new ScheduleXml document in the element's hidden field.
        document.getElementById(schId).value = htmlEncode(sXml);
        if (document.getElementById("lblSchXml_" + schId) != null) {
            // If debug mode is enabled (when disabled the element will not be in the HTML document), set the label to display the updated ScheduleXml.
            document.getElementById("lblSchXml_" + schId).innerText = sXml;
        }

        // Now update the hidden field that stores additional parameters.
        var sParamXml = "<LinkParams ";
        var tblParams = document.getElementById("rdSch_rowsAddtParams_" + schId);
        // If additional paramters are disabled, the table (Rows element) that holds them won't exist in the HTML document.
        if (tblParams != null) {
            var paramRows = tblParams.getElementsByTagName("TR");
            var paramInput = null; var paramName = null; var paramValue = null; var paramExists = false;
            var paramsArray = new Array(); var paramIndex = 0;
            // Loop through the table's rows.
            for (i = 0; i < paramRows.length; i++) {
                if (paramRows[i].getElementsByTagName("INPUT").length == 1) {
                    // Locate the input element (text box).
                    paramInput = paramRows[i].getElementsByTagName("INPUT")[0];
                    // The parameter name is stacked on the end of the element's ID.
                    paramName = paramInput.id.substr(paramInput.id.lastIndexOf("~") + 1);

                    paramExists = false;
                    // Weed out duplicate parameters; if more than one parameter exists with the same name, the first instance is used and the rest discarded.
                    for (iparam = 0; iparam < paramsArray.length; iparam++) {
                        if (paramsArray[iparam] == paramName) { paramExists = true; break; }
                    }

                    if (!paramExists) {
                        // Clean the value with a regular expression that eliminates all instances of &, ", < and >.
                        paramValue = paramInput.value.replace(/[&\"<>]/g, "");
                        // Add the attribute/value pair to the document.
                        sParamXml += paramName + "=\"" + paramValue + "\" ";
                        // Store the parameter name in the array so that it will be included in the duplicates check above.
                        paramsArray[paramIndex] = paramName;
                        paramIndex += 1;
                    }
                }
            }
        }

        sParamXml += "/>";
        // Store the additional parameters document in its hidden field.
        document.getElementById("rdProcessParams_" + schId).value = htmlEncode(sParamXml);

        // The schedule xml is being returned here as another debug opportunity;
        // For example, the developer can set up a Button on the report with an Action.Link that exercises: javascript:alert("rdSchSave('<ScheduleElementID>')");
        // and the generated xml will be displayed on-click.
        return sXml;
    }
}

// Validates the elements on the form.
function rdSchValidateForm(schId) {

    // It would be nice if rdValidateForm() could be called from a template javascript file with a 'group' name, much like ASP.Net's ValidationGroup concept.
    // This function could then be removed and replaced at the top of rdSchSave() with a call such as: rdValidateForm(schId),
    // where the Schedule UI Element's ID would be the value of a Group attribute on each of its child validation elements,
    // and the manual call to rdValidateForm would only test those specific elements.
    var element;

    element = document.getElementById('datSchStartDate_' + schId);
    sErrorMsg = rdValidateDate(element.id, element.attributes["rdFormatValue"].value, '', '', 'Start Date is not a valid date.', '');
    if (sErrorMsg) return sErrorMsg;
    sErrorMsg = rdValidateRequired(element.id, 'Start Date is required.', '');
    if (sErrorMsg) return sErrorMsg;

    element = document.getElementById('datSchEndDate_' + schId);
    sErrorMsg = rdValidateDate(element.id, element.attributes["rdFormatValue"].value, '', '', 'End Date is not a valid date.', '');
    if (sErrorMsg) return sErrorMsg;

    sErrorMsg = rdValidateNumeric('txtSchDays_' + schId, '.', 'Days must be a number.', '');
    if (sErrorMsg) return sErrorMsg;

    sErrorMsg = rdValidateNumeric('txtSchWeeks_' + schId, '.', 'Weeks must be a number.', '');
    if (sErrorMsg) return sErrorMsg;

    sErrorMsg = rdValidateNumeric('txtSchMonths_' + schId, '.', 'Day of the month(s) must be a number.', '');
    if (sErrorMsg) return sErrorMsg;

    //Check to see if the End Date is set prior to the Start Date - if it is - throw an error
	if (document.getElementById('chkSchEndDate_' + schId).checked == true) {
		if(compareDates(document.getElementById('datSchStartDate_' + schId).value, document.getElementById('datSchStartDate_' + schId).attributes["rdFormatValue"].value,
		document.getElementById('datSchEndDate_' + schId).value, document.getElementById('datSchEndDate_' + schId).attributes["rdFormatValue"].value) == 1) {
			sErrorMsg = 'End Date cannot be less than Start Date'
			return sErrorMsg;
		}
	}
     //Do not allow all the months to be deselected in a monthly report. 10446
    var sInterval = document.getElementById('selSchInterval_' + schId).value; 
    if (sInterval == 'Monthly') {
        var monthVal = rdSchMonths(schId);
        if (monthVal == 0) {
          sErrorMsg = 'At least one month has to be selected';
	      document.getElementById("chkSchMonth_" + schId + "_Row1").checked = 1;
	      return sErrorMsg;
        }
    }
    //Do not allow all the days to be deselected in a weekly report. 10446
    if (sInterval == 'Weekly') {
        var weekVal = rdSchDaysOfWeek(schId);
        if (weekVal == 0) {
          sErrorMsg = 'At least one day of the week has to be selected';
          document.getElementById("chkSchWeekDay_" + schId + "_Row2").checked = 2;
	      return sErrorMsg;
        }
    }
    if (sInterval == 'Hourly') {
        var hourlyVal = document.getElementById("selSchHourly_" + schId).value;
        if (hourlyVal == "00") {
          sErrorMsg = 'Hours value cannot be equal zero';
	      return sErrorMsg;
        }
    }
    if (sInterval == 'Minutes') {
        var minutesVal = document.getElementById("selSchMinutes_" + schId).value;
        if (minutesVal == "00") {
          sErrorMsg = 'Minutes value cannot be equal zero';
	      return sErrorMsg;
        }
    }
}

// Adds a row to the Additional Parameters builder.
function rdSchAddParam(schId) {
    // Prompt the user for a name for the new parameter.
    var paramName = prompt("Please enter a name for the parameter.", "");
    if (paramName != null && paramName != "") {
        // Run two regular expressions to clean the parameter name.
        // 1) Remove any character that is not a number, letter or underscore.
        paramName = paramName.replace(/[^a-zA-Z0-9]_/g, "");
        // 2) Start at the beginning of the string and continue removing numbers until something other than a number is hit.
        paramName = paramName.replace(/^[0-9]+/, "");

        // Locate the Additional Parameters table in the doucment.
        var tblAddt = document.getElementById("rdSch_rowsAddtParams_" + schId);
        // Check to see if there's a TBODY element, and if so use it for containing rows instead of the root TABLE element.
        if (tblAddt.getElementsByTagName("TBODY").length == 1) { tblAddt = tblAddt.getElementsByTagName("TBODY")[0]; }

        var tr; var td; var span; var input; var attr; var anchor;

        // Create a row.
        tr = document.createElement("TR");
        tr.id = "rdSch_rowParam_" + schId + "~" + paramName;

	    // Add a cell with a SPAN that contains the name of the parameter.  This serves as the label. 
	    td = document.createElement("TD");
	    span = document.createElement("Label");
	    span.id = "rdSch_lblParam_" + schId + "~" + paramName;
	    span.htmlFor = "rdSch_txtParam_" + schId + "~" + paramName;
	    span.appendChild(document.createTextNode(paramName));
	    td.appendChild(span);
	    tr.appendChild(td);

	    // Add a cell with the column gap class to create a fixed space between the labels and the textboxes.
	    td = document.createElement("TD");
	    attr = document.createAttribute("class"); attr.value = "rdScheduleColumnGap"; td.attributes.setNamedItem(attr);
	    tr.appendChild(td);

	    // Now create the input textbox.
	    td = document.createElement("TD");
	    span = document.createElement("SPAN");

	    // Set its onblur to result in the same setup that the LogiInfo engine prepares for DHTML events in text boxes.
	    input = document.createElement("INPUT");
	    input.id = "rdSch_txtParam_" + schId + "~" + paramName;
	    attr = document.createAttribute("name"); attr.value = input.id; input.attributes.setNamedItem(attr);
	    input.onblur = function() { NavigateLink2("javascript:rdSchSave('" + schId + "');", "", "false", "", ""); }
	    input.value = "";

        // Add the text box to the cell.
	    span.appendChild(input);
	    td.appendChild(span);

	    // Add a space after the text box.
	    span = document.createElement("SPAN");
	    span.appendChild(document.createTextNode(" "));
	    td.appendChild(span);

        // Add the remove link.
	    anchor = document.createElement("A");
	    anchor.id = "actProcessParamsRemove_" + schId + "~" + paramName;
	    attr = document.createAttribute("href"); attr.value = "javascript:NavigateLink2('javascript:rdSchRemoveParam(\"" + schId + "\",\"" + paramName + "\");','','false','','')"; anchor.attributes.setNamedItem(attr);
	    span = document.createElement("SPAN");
	    span.appendChild(document.createTextNode("-"));

	    // Tooltip for the link.
	    attr = document.createAttribute("title"); attr.value = "Remove this parameter."; span.attributes.setNamedItem(attr);
	    anchor.appendChild(span);
	    td.appendChild(anchor);
	    tr.appendChild(td);

	    tblAddt.appendChild(tr);

	    // Run the save method to update the hidden field for Additional Parameters with the new input.
	    // This ensures that if the user adds a parameter but does not set a value, it is still included in the saved XML.
	    rdSchSave(schId);
    }
}

// Removes a row from the Additional Parameters builder.
function rdSchRemoveParam(schId,paramName) {
    var removeRow = document.getElementById("rdSch_rowParam_" + schId + "~" + paramName);
    removeRow.parentNode.removeChild(removeRow);

    // Run the save method to update the hidden field for Additional Parameters.
    rdSchSave(schId);
}

// Helper-function to wrap around rdCalendar\CalendarPopup.js's date parsing functionality.
function rdSchParseDate(sFormat, sDate)
{
    // Return a configured Date() object for the given date string, parsing that string with the given format string.
    var d = new Date(sDate);
    d.setTime(getDateFromFormat(sDate, sFormat))
    return d;
}

// Calculates the total value of the checked weekdays in the template.
function rdSchDaysOfWeek(schId) {
    var iDay = 0;
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row1").checked ? 1 : 0); // Sunday
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row2").checked ? 2 : 0); // Monday
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row3").checked ? 4 : 0); // Tuesday
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row4").checked ? 8 : 0); // Wednesday
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row5").checked ? 16 : 0); // Thursday
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row6").checked ? 32 : 0); // Friday
    iDay += (document.getElementById("chkSchWeekDay_" + schId + "_Row7").checked ? 64 : 0); // Saturday
    return iDay.toString();
}

// Calculates the total value of the checked months in the template.
function rdSchMonths(schId) {
    var iMonth = 0;
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row1").checked ? 1 : 0); // January
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row2").checked ? 2 : 0); // February
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row3").checked ? 4 : 0); // March
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row4").checked ? 8 : 0); // April
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row5").checked ? 16 : 0); // May
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row6").checked ? 32 : 0); // June
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row7").checked ? 64 : 0); // July
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row8").checked ? 128 : 0); // August
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row9").checked ? 256 : 0); // September
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row10").checked ? 512 : 0); // October
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row11").checked ? 1024 : 0); // November
    iMonth += (document.getElementById("chkSchMonth_" + schId + "_Row12").checked ? 2048 : 0); // December
    return iMonth.toString();
}

// Toggles the display of HTML elements depending on the Interval selection.
function rdSchUpdateControls(schId) {
    var sInterval = document.getElementById('selSchInterval_' + schId).value;
    ShowElement(this.id, "rowSchEndDate_" + schId, (sInterval != "Once" ? "Show" : "Hide"));
	if(document.getElementById("rowSchRunEvery_" + schId))
	    ShowElement(this.id, "rowSchRunEvery_" + schId, (sInterval != "Once" ? "Show" : "Hide"));
    ShowElement(this.id, "rowSchHourly_" + schId, (sInterval == "Hourly" ? "Show" : "Hide"));
    ShowElement(this.id, "rowSchMinutes_" + schId, (sInterval == "Minutes" ? "Show" : "Hide"));
    ShowElement(this.id, "rowSchDays_" + schId, (sInterval == "Daily" ? "Show" : "Hide"));
    ShowElement(this.id, "rowSchWeeks_" + schId, (sInterval == "Weekly" ? "Show" : "Hide"));
	
    if (sInterval != "Weekly") {
        ShowElement(this.id, "rowSchWeekDays_" + schId, "Hide");
    } else {
        if (document.getElementById("rowSchWeekDays_" + schId).attributes["class"] == null ||
		    document.getElementById("rowSchWeekDays_" + schId).attributes["class"].value != "rdSchHidden") {
		    ShowElement(this.id, "rowSchWeekDays_" + schId, "Show");
		}
    }

    if (sInterval != "Monthly") {
        ShowElement(this.id, "rowSchMonths_" + schId, "Hide");
		ShowElement(this.id, "rowSchVariableMonthDay_" + schId, "Hide");
		ShowElement(this.id, "rowSchMonthsList_" + schId, "Hide");
    } else {
        if (document.getElementById("rowSchMonths_" + schId).attributes["class"] == null ||
		    document.getElementById("rowSchMonths_" + schId).attributes["class"].value != "rdSchHidden") {
		    ShowElement(this.id, "rowSchMonths_" + schId, "Show");
		}
		if (document.getElementById("rowSchVariableMonthDay_" + schId).attributes["class"] == null ||
		    document.getElementById("rowSchVariableMonthDay_" + schId).attributes["class"].value != "rdSchHidden") {
		    ShowElement(this.id, "rowSchVariableMonthDay_" + schId, "Show");
		}
		if (document.getElementById("rowSchMonthsList_" + schId).attributes["class"] == null ||
		    document.getElementById("rowSchMonthsList_" + schId).attributes["class"].value != "rdSchHidden") {
		    ShowElement(this.id, "rowSchMonthsList_" + schId, "Show");
		}
    }
    
    //20370 - Refactored due to change in scheduleTemplate file.
    var lblStart = document.getElementById("lblSchStartDate_" + schId)
    var lblRun = document.getElementById("lblSchRunOn_" + schId)
    if (sInterval != "Once") {
        rdSchShow(lblStart);
        rdSchHide(lblRun);
    } else {
        rdSchShow(lblRun);
        rdSchHide(lblStart);
    }

//    if (sInterval == "Minutes") {
//        var selMinutes = document.getElementById("selSchMinutes_" + schId)
//        if (selMinutes.value == "00")
//            selMinutes.selectedIndex = 1
//    } 
//    if (sInterval == "Hourly") {
//        var selHourly = document.getElementById("selSchHourly_" + schId)
//        if (selHourly.value == "00")
//            selHourly.selectedIndex = 1
//    }

	// Run the save method to update the element's hidden field with an updated ScheduleXml document.
	rdSchCheckEndTimeVisibility(schId);
	rdSchSave(schId);
}

function rdSchShow(lblToShow) {
    if (lblToShow.style.display != '') {
        lblToShow.style.display = '';
    }
}

function rdSchHide(lblToHide) {
    if (lblToHide.style.display != 'none') {
        lblToHide.style.display = 'none';
    }
}

// Toggles the display in Monthly interval mode to show/hide the "Day of Month" and "nth weekday of the Month" options.
// This is triggered by the Monthly and MonthlyDayOfWeek check-boxes.
function rdSchToggleMonthlyInterval(toggle, schId) {
    ShowElement(this.id, "divSchMonths_" + schId, (toggle == "day" ? "Show" : "Hide"));
    ShowElement(this.id, "divSchMonthDayIntervalPlaceHolder_" + schId, (toggle == "day" ? "Show" : "Hide"));

    ShowElement(this.id, "divSchMonthDayInterval_" + schId, (toggle == "day" ? "Hide" : "Show"));
    ShowElement(this.id, "divSchMonthsPlaceHolder_" + schId, (toggle == "day" ? "Hide" : "Show"));

    document.getElementById("chkSchMonths_" + schId+"_1").checked = (toggle == "day");
    document.getElementById("chkSchMonthDayInterval_" + schId + "_1").checked = !(toggle == "day");

    // Run the save method to update the element's hidden field with an updated ScheduleXml document.
    rdSchSave(schId);
}

// Toggle the end date input textbox's visibility.
function rdSchToggleEndDate(schId) {
    ShowElement(this.id, "divSchEndDate_" + schId, (document.getElementById("chkSchEndDate_" + schId).checked ? "Show" : "Hide"));
    rdSchCheckEndTimeVisibility(schId);
    // Run the save method to update the element's hidden field with an updated ScheduleXml document.
    rdSchSave(schId);
}

function rdSchCheckEndTimeVisibility(schId){
    var isShow = (document.getElementById("chkSchEndDate_" + schId).checked ? "Show" : "Hide");

    var sInterval = document.getElementById('selSchInterval_' + schId).value;
    if (isShow == "Show" && (sInterval == "Minutes" || sInterval == "Hourly")){
        ShowElement(this.id, "rowSchEndTime_" + schId, isShow);
    }
    else 
       ShowElement(this.id, "rowSchEndTime_" + schId, "Hide");
}
/*
HTMLEncode - Encode HTML special characters.
Copyright (c) 2006 Thomas Peri, http://www.tumuski.com/
http://www.tumuski.com/library/htmlEncode/htmlEncode.js?download
*/
function htmlEncode(source, display, tabs)
{
	function special(source)
	{
		var result = '';
		for (var i = 0; i < source.length; i++)
		{
			var c = source.charAt(i);
			if (c < ' ' || c > '~')
			{
				c = '&#' + c.charCodeAt() + ';';
			}
			result += c;
		}
		return result;
	}

	function format(source)
	{
		// Use only integer part of tabs, and default to 4
		tabs = (tabs >= 0) ? Math.floor(tabs) : 4;

		// split along line breaks
		var lines = source.split(/\r\n|\r|\n/);

		// expand tabs
		for (var i = 0; i < lines.length; i++)
		{
			var line = lines[i];
			var newLine = '';
			for (var p = 0; p < line.length; p++)
			{
				var c = line.charAt(p);
				if (c === '\t')
				{
					var spaces = tabs - (newLine.length % tabs);
					for (var s = 0; s < spaces; s++)
					{
						newLine += ' ';
					}
				}
				else
				{
					newLine += c;
				}
			}
			// If a line starts or ends with a space, it evaporates in html
			// unless it's an nbsp.
			newLine = newLine.replace(/(^ )|( $)/g, '&nbsp;');
			lines[i] = newLine;
		}

		// re-join lines
		var result = lines.join('<br />');

		// break up contiguous blocks of spaces with non-breaking spaces
		result = result.replace(/  /g, ' &nbsp;');

		// tada!
		return result;
	}

	var result = source;

	// ampersands (&)
	result = result.replace(/\&/g,'&amp;');

	// less-thans (<)
	result = result.replace(/\</g,'&lt;');

	// greater-thans (>)
	result = result.replace(/\>/g,'&gt;');

	if (display)
	{
		// format for display
		result = format(result);
	}
	else
	{
		// Replace quotes if it isn't for display,
		// since it's probably going in an html attribute.
		result = result.replace(new RegExp('"','g'), '&quot;');
	}

	// special characters
	result = special(result);

	// tada!
	return result;
}

function htmlDecode(source)
{
    var result = source;

	// ampersands (&)
	result = result.replace(new RegExp('&amp;','g'), '&');

	// less-thans (<)
	result = result.replace(new RegExp('&lt;','g'), '<');

	// greater-thans (>)
	result = result.replace(new RegExp('&gt;','g'), '>');

	// quotes (")
	result = result.replace(new RegExp('&quot;','g'), '"');

	// tada!
	return result;
}