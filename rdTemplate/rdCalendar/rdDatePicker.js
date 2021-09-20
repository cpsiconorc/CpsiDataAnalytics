    var rdCalendarClicks = 0;                 // Variable to keep track of the user clicks.
    var rdCalendarDisplayDateOne;             // Diplay Dates to deal with multiple cultures.
    var rdCalendarDisplayDateTwo;
    var rdCalendarStartDate;                  // variables used in the rdOnloadColoring function to check if the dates have been interchanged.
    var rdCalendarEndDate;   
    var rdCalendarDateArray = new Array();    // Array to handle dates when there are multiple calendar elements on the form.
    var rdCalendarRowIdentifier;              // Variable used to hold the row Number when the input date is under a DataTable.
    // Variables declared globally in this javascript block keep memory of the values.
    
    // Insert Dates, function used in the Date Range scenario.
	function rdInsertDates(sStartDateElementID, sEndDateElementID, sParamDate, nDay, sDisplayDate, nCalendarNo, sElementIdentifier){
	    var sStartDateElement;           // Variable to hold the Element ID's
        var sEndDateElement;
        var sHiddenDateHolderElement;    // Variable to hold the ID of the Hidded field.
    
	    if(sDisplayDate.match('%20'))    // Issue in mozilla, Adds %20 for every space character. Issue is specific to this format('MMM d, yyyy').
	        sDisplayDate = sDisplayDate.replace(/%20/g, ' ');
	    if(rdCalendarRowIdentifier == undefined){
	       rdCalendarRowIdentifier = ''; 
	    }
	    if(sElementIdentifier.match('rdDatePickerElement')){ // Make the RowIdentifier empty when the Element is a DatePicker.
	        rdCalendarRowIdentifier = ''; 
	    }
        sHiddenDateHolderElement = sStartDateElementID
        sStartDateElementID = sStartDateElementID + rdCalendarRowIdentifier;    sStartDateElement = sStartDateElementID;
        sEndDateElementID = sEndDateElementID + rdCalendarRowIdentifier;        sEndDateElement = sEndDateElementID;
	    var sElement = rdGetElement(nDay, nCalendarNo, sElementIdentifier); 
	    if(!(rdCalendarClicks % 2)){
	        if(document.getElementById(sStartDateElementID)== null){
                alert('Could not find the Start Date Element or the provided Element is not appropriate.');
                return;
            }
            document.getElementById(sStartDateElementID).value = sDisplayDate; 
            if(document.getElementById(sStartDateElementID).onchange)
                document.getElementById(sStartDateElementID).onchange(); //#10906
                
//            if(rdCalendarClicks == 0){  '# 10948
            document.getElementById(sEndDateElementID).value = sDisplayDate; 
            if(document.getElementById(sEndDateElementID).onchange)
                document.getElementById(sEndDateElementID).onchange(); //#10929
//            }
//            else{
//                if(document.getElementById(sEndDateElementID) != null)
//                    if(document.getElementById(sEndDateElementID).value != '')
//                        document.getElementById(sEndDateElementID).value = '';
//            }
                
            if(document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier))  //Check, incase of DatePicker Element as this Element will not be available.
                document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier).value = sParamDate; 
                                    
            rdCalendarDisplayDateOne = sDisplayDate;
            rdCalendarStartDate = new Date(sParamDate); 
            rdCalendarDateArray[sElementIdentifier + '_StartDate' + rdCalendarRowIdentifier] = rdCalendarStartDate;
            rdCalendarEndDate = undefined;rdCalendarDateArray[sElementIdentifier + '_EndDate'+ rdCalendarRowIdentifier] = undefined;
            rdApplyColor(rdGetElementDivForColoring(nDay, nCalendarNo, sElementIdentifier));
            var cl; var dl;
            for(cl=1; cl<=3; cl=cl+1){
                for(dl=1;dl<=31;dl=dl+1){
                    if(rdGetElement(dl, cl, sElementIdentifier)!= null ){
                        if(rdGetElement(dl, cl, sElementIdentifier) != rdGetElement(nDay, nCalendarNo, sElementIdentifier))
                            rdRemoveColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                    }
                }         
            }
            rdCalendarClicks += 1;
	    }
	    else{	       
	        if(document.getElementById(sEndDateElementID)== null){
                 alert('Could not find the End Date Element or the provided Element is not appropriate.');
                 return;
            }
             document.getElementById(sEndDateElementID).value = sDisplayDate;
             if(document.getElementById(sEndDateElementID).onchange)
                document.getElementById(sEndDateElementID).onchange(); //#10906
             rdCalendarDisplayDateTwo = sDisplayDate;
             rdCalendarEndDate = new Date(sParamDate);
             rdCalendarDateArray[sElementIdentifier + '_EndDate'+ rdCalendarRowIdentifier] = rdCalendarEndDate;
                if(rdCalendarStartDate.getFullYear() == rdCalendarEndDate.getFullYear()){
                    if((rdCalendarEndDate.getMonth() < rdCalendarStartDate.getMonth())|((rdCalendarEndDate.getMonth()== rdCalendarStartDate.getMonth())&(rdCalendarEndDate.getDate() < rdCalendarStartDate.getDate()))){
                        rdInterChangeDates(sElementIdentifier, sStartDateElement, sEndDateElement);
                        if(document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier))  //Check, incase of DatePicker Element
                            document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier).value = sParamDate;   // Hidden field date needs to be interchanged too !
                    }
                }
                else if(rdCalendarStartDate.getFullYear() > rdCalendarEndDate.getFullYear()){
                        rdInterChangeDates(sElementIdentifier, sStartDateElement, sEndDateElement);
                        if(document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier))  //Check, incase of DatePicker Element
                            document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier).value = sParamDate;
                        }
            rdApplyColor(rdGetElementDivForColoring(nDay, nCalendarNo, sElementIdentifier));
    	    rdColorDates(rdCalendarStartDate, rdCalendarEndDate, sElementIdentifier);
            rdCalendarClicks += 1;
	     }
	     rdReApplyClassForTodaysDate(sElementIdentifier);       //#11321.
	     rdResizeHTMLCalendarMonthTables(sElementIdentifier);   //#11578.
    }
    
    function rdColorDates(sBeginDate, sEndingDate, sElementIdentifier){
        var sd = rdDate2Julian(sBeginDate);
        var ed = rdDate2Julian(sEndingDate);
        var cl; var dl;
        for(cl=1; cl<=3; cl=cl+1){
            for(dl=1;dl<=31;dl=dl+1){
                if(rdGetElement(dl, cl, sElementIdentifier)!= null ){
                    if(rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') != ''){
                        if(rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') >= sd & rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') <= ed)
                            rdApplyColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                    }
                }
            }         
        }
    }
    
    // Insert Single Date, function used in the Single Date scenario.
    function rdInsertSingleDate(sStartDateElementID, sPopUpID, sParamDate, nDay, sDisplayDate, nCalendarNo, sElementIdentifier){
       var sHiddenDateHolderElement;    // Variable to hold the ID of the Hidded field.
     
       if(sDisplayDate.match('%20'))     // Issue in mozilla, Adds %20 for every space. Issue is specific to this format('MMM d, yyyy').
           sDisplayDate = sDisplayDate.replace(/%20/g, ' ');
       if(rdCalendarRowIdentifier == undefined){
	       rdCalendarRowIdentifier = ''; 
	    }
	    if(sElementIdentifier.match('rdDatePickerElement')){ // Make the Row Identifier empty when the Element is a DatePicker.
	        rdCalendarRowIdentifier = ''; 
	    }
	    sHiddenDateHolderElement = sStartDateElementID
	    sStartDateElementID = sStartDateElementID + rdCalendarRowIdentifier;
	    sPopUpID = sPopUpID + rdCalendarRowIdentifier;
        if(document.getElementById(sStartDateElementID)== null){
            alert('Could not find the Target Date Element or the provided Element is not appropriate.');
            return;
        }
        document.getElementById(sStartDateElementID).value = sDisplayDate;
        if(document.getElementById(sStartDateElementID).onchange)
            document.getElementById(sStartDateElementID).onchange(); //#10906
        if(document.getElementById(sStartDateElementID).onblur)
            document.getElementById(sStartDateElementID).onblur();   //#10908
        if(document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier))  //Check, incase of DatePicker Element
                document.getElementById(sHiddenDateHolderElement+'_Hidden'+rdCalendarRowIdentifier).value = sParamDate;
        rdCalendarDateArray[sElementIdentifier + '_StartDate'+ rdCalendarRowIdentifier] = new Date(sParamDate);
        rdApplyColor(rdGetElementDivForColoring(nDay, nCalendarNo, sElementIdentifier));
        var cl; var dl;
        for(cl=1; cl<=3; cl=cl+1){  //# 10766, to handle if the default date is set.
                for(dl=1;dl<=31;dl=dl+1){
                    if(rdGetElement(dl, cl, sElementIdentifier)!= null ){
                        if(rdGetElement(dl, cl, sElementIdentifier) != rdGetElement(nDay, nCalendarNo, sElementIdentifier))
                            rdRemoveColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                    }
                }         
            }
        rdCalendarStartDate = new Date(sParamDate);
        if (sPopUpID != ''){
            ShowElement(this.id, sPopUpID,'Hide')
        }
        rdReApplyClassForTodaysDate(sElementIdentifier);   //#11321.
        //rdResizeHTMLCalendarMonthTables(sElementIdentifier);        //#11578.
    }
    
    // function called on the calendar Load, to handle coloring between calendar refreshes.
    function rdOnloadColoring(sElementIdentifier){
        if(rdCalendarRowIdentifier == undefined)
               rdCalendarRowIdentifier == '';
        if((rdCalendarDateArray[sElementIdentifier + '_StartDate'+ rdCalendarRowIdentifier] != undefined) & (rdCalendarDateArray[sElementIdentifier + '_EndDate'+ rdCalendarRowIdentifier] == undefined)){
            var sd = rdDate2Julian(new Date(rdCalendarDateArray[sElementIdentifier + '_StartDate'+ rdCalendarRowIdentifier]));
            var cl; var dl;
            for(cl=1; cl<=3; cl=cl+1){
                for(dl=1;dl<=31;dl=dl+1){
                    if(rdGetElement(dl, cl, sElementIdentifier)!= null ){
                        if(rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') != ''){
                            if(rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') == sd)
                                rdApplyColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                            else
                                rdRemoveColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));                                        
                        }
                    }
                }
            }      
        }
        if((rdCalendarDateArray[sElementIdentifier + '_StartDate'+ rdCalendarRowIdentifier] != undefined)& (rdCalendarDateArray[sElementIdentifier + '_EndDate'+ rdCalendarRowIdentifier] != undefined)) {
            var sd = rdDate2Julian(new Date(rdCalendarDateArray[sElementIdentifier + '_StartDate'+ rdCalendarRowIdentifier]));
            var ed = rdDate2Julian(new Date(rdCalendarDateArray[sElementIdentifier + '_EndDate'+ rdCalendarRowIdentifier]));
            var cl; var dl;
            for(cl=1; cl<=3; cl=cl+1){
                for(dl=1;dl<=31;dl=dl+1){
                    if(rdGetElement(dl, cl, sElementIdentifier)!= null ){
                        if(rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') != ''){
                            if(rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') >= sd & rdGetElement(dl, cl, sElementIdentifier).getAttribute('Juliandate') <= ed)
                                rdApplyColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                            else
                                rdRemoveColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                        }
                    }
                }         
            }
        }
//        if(document.getElementById(sStartDateElement) != null){
//            if(document.getElementById(sStartDateElement).value == '')
//                rdColorCleanUp(sElementIdentifier);
//            else if(new Date(document.getElementById(sStartDateElement).value) != 'NaN') {
//                if(new Date(document.getElementById(sStartDateElement).value) != rdCalendarStartDate){              
//                }
//            }      
//        }    
        rdReApplyClassForTodaysDate(sElementIdentifier);    //#11321.  
    }
    
    // function used to add the onclick function for the div around the Day label of the calendar to make it clickable.
    function rdOnLoadJavascriptAddition(sElementIdentifier){
        if(rdCalendarRowIdentifier == undefined)
           rdCalendarRowIdentifier == '';
        var y;
        for (y=1; y<=3; y=y+1){
            var x;
            for(x=1; x<=31; x=x+1){
                (function(x)
                {
                    var sElementModifier = rdElementModifier(y, sElementIdentifier);
                    
                    var sElement = document.getElementById(sElementModifier + 'rdCalDay-Holder_' + x + '_DayTable');
                    
                    if(sElement != null){                     
                        var sScript = LogiXML.getScriptFromLink(sElement.lastChild);
                        sElement.lastChild.href = 'javascript:void(0);';
                        sElement.lastChild.onclick = function () { };
                        sElement.onclick = function () {
                            eval(this.sScript);
                        }.bind({
                            sScript: sScript
                        });  // Used unescape() to make it work for Safari #12103.
                    }
                })(x);
            }
        }
        rdOnLoadUserProvidedRangeColoring(sElementIdentifier) //#11206, #11653.        
        rdResizeHTMLCalendarMonthTables(sElementIdentifier)   //#11578.
    }
   
    // function used to add the string to find the Element that is being looked up for depending up on the calendar Number.
    function rdElementModifier(nCalendarNo, sElementIdentifier){
        var sElementModifier = parseInt(nCalendarNo);
        if(sElementModifier == 1)
            sElementModifier = sElementIdentifier + '_' + '';
        else if (sElementModifier == 2)
            sElementModifier = sElementIdentifier + '_' +'Cal2_';
        else
            sElementModifier = sElementIdentifier + '_' +'Cal3_';
            
        return sElementModifier;
    }
    
    // function used to calculate the Julian Date with the date provided.
    function rdDate2Julian(dDate){
        var M = dDate.getMonth()+ 1;
        var Y = dDate.getFullYear();
        var D = dDate.getDate();
        return (1461*(Y+4800+(M-14)/12))/4+(367*(M-2-12*((M-14)/12)))/12-(3*((Y+4900+(M-14)/12)/100))/4+D-32075;
    }
    
    // function gets the Element with the Day label and calendar Number as input parameters.
    function rdGetElement(sNumber, nCalendarNo, sElementIdentifier ){
        var sElementModifier = rdElementModifier(nCalendarNo, sElementIdentifier); 
        var ele = document.getElementById(sElementModifier + 'rdCalDay_' + sNumber + '_DayTable'+ rdCalendarRowIdentifier);
        if (ele == null)
            ele = document.getElementById(sElementModifier + 'rdCalDay_' + sNumber + '_DayTable');
        return ele;
    }
    
    // function gets the Div containing the Day label for coloring
    function rdGetElementDivForColoring(sNumber, nCalendarNo, sElementIdentifier){
        var sElementModifier = rdElementModifier(nCalendarNo, sElementIdentifier);      
        var ele = document.getElementById(sElementModifier + 'rdCalDay-Holder_' + sNumber + '_DayTable'+ rdCalendarRowIdentifier);
        if (ele == null)
            ele = document.getElementById(sElementModifier + 'rdCalDay-Holder_' + sNumber + '_DayTable');
        return ele;
    }
    
    // function called for applying color.
    function rdApplyColor(sElement){
        if(sElement.getAttribute('class'))
            sElement.setAttribute("class", "rdDataCalendarDayLabelHighlight");
        else 
            sElement.setAttribute("className", "rdDataCalendarDayLabelHighlight");
    }
    
    // function called for removing the color.
    function rdRemoveColor(sElement){
        if(sElement.getAttribute('class'))
            sElement.setAttribute("class", "rdDataCalendarDay");
        else 
            sElement.setAttribute("className", "rdDataCalendarDay");
    }  
    
    // function called for interchanging the dates when selected in the reverse order.
    function rdInterChangeDates(sElementIdentifier, sStartDateElement, sEndDateElement){
        var rdTemp;                      
        document.getElementById(sStartDateElement).value = rdCalendarDisplayDateTwo;   rdTemp = rdCalendarStartDate; rdCalendarStartDate = rdCalendarEndDate; rdCalendarDateArray[sElementIdentifier + '_StartDate' + rdCalendarRowIdentifier] = new Date(rdCalendarEndDate);
        document.getElementById(sEndDateElement).value = rdCalendarDisplayDateOne;  rdCalendarEndDate = rdTemp; rdCalendarDateArray[sElementIdentifier + '_EndDate' + rdCalendarRowIdentifier] = new Date(rdTemp);
    }
    
    // function called for removing the color of the entire calendar.
    function rdColorCleanUp(sElementIdentifier){
        var cl; var dl;
        for(cl=1; cl<=3; cl=cl+1){
            for(dl=1;dl<=31;dl=dl+1){
                if(rdGetElement(dl, cl, sElementIdentifier)!= null ){
                    rdRemoveColor(rdGetElementDivForColoring(dl, cl, sElementIdentifier));
                }
            }         
        }
    }
    // function called on the click for a calendar for InputDate.
    function rdInputDateAjaxRequest(sInputDateID, sDatePickerID, sElementID, sReportID){
         sElementID = sElementID+'_Hidden';   // Hidden field holds the Date value in the MM/dd/yyyy format
         if(rdCalendarRowIdentifier != undefined){
            if (document.getElementById(sElementID+ rdCalendarRowIdentifier) != null){
                sElementID = sElementID+ rdCalendarRowIdentifier;        
//                sDatePickerID = sDatePickerID + rdCalendarRowIdentifier; //#14844.           
            }
         }
         else{
           rdCalendarRowIdentifier = '';
           sElementID = sElementID;    
         }
         rdAjaxRequestWithFormVars('rdAjaxCommand=CalendarRefreshElement&rdCalendarRefreshElementID=' + sInputDateID + ',' + sDatePickerID+ '&rdInputDateValue=' + document.getElementById(sElementID).value  + '&rdReport=' + sReportID);        
    }
    
    // function called on click for a calendar for InputDate.
    function rdGetRowIdentifier(sRowIdentifiervalue){
        if(sRowIdentifiervalue == undefined) 
            rdCalendarRowIdentifier == '';
        else if (sRowIdentifiervalue == '')  // Make the Row Identifier empty when the Element is just a stand alone InputDate Element.
            rdCalendarRowIdentifier = '';
        else            
            rdCalendarRowIdentifier = '_Row' + sRowIdentifiervalue;
    }
    
    // function called to re-apply the base class for Today, when not selected.
    function rdReApplyClassForTodaysDate(sElementIdentifier){
        try{
            var x = 3;
            var y = 31;
            var eleDateCell;
            var dtToday = new Date();
            var nJulian = rdDate2Julian(dtToday);
            for(x=1;x<=3;x=x+1){
                for(y=1;y<=31;y=y+1){
                    if(rdGetElement(y, x, sElementIdentifier)){
                        eleDateCell = rdGetElement(y, x, sElementIdentifier)
                        if(parseFloat(eleDateCell.getAttribute("JulianDate")) == parseFloat(nJulian)){
                            if(rdGetElement(y, x, sElementIdentifier).parentNode){
                                eleDateCell = rdGetElement(y, x, sElementIdentifier).parentNode;
                                if(eleDateCell.getAttribute("Class")){
                                    if(eleDateCell.getAttribute("Class") != "rdDataCalendarDayLabelHighLight"){
                                        eleDateCell.setAttribute("Class", eleDateCell.getAttribute("Class") + " rdDataCalendarToday");
                                    }
                                }
                                else{
                                    if(eleDateCell.getAttribute("className") != "rdDataCalendarDayLabelHighlight"){
                                        eleDateCell.setAttribute("className", eleDateCell.getAttribute("className") + " rdDataCalendarToday");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch(e){return;}
    }
    
    // function called to re-apply the base class for user provided range selection, Start/EndDate Default values provided by the user. To address the issue when a Theme has been applied as the Theme overwrites these styles.
    function rdOnLoadUserProvidedRangeColoring(sElementIdentifier){
         try{
            var x = 3;
            var y = 31;
            var eleDateCell;
            for(x=1;x<=3;x=x+1){
                for(y=1;y<=31;y=y+1){
                    if(rdGetElement(y, x, sElementIdentifier)){
                        if(rdGetElement(y, x, sElementIdentifier).parentNode){
                            eleDateCell = rdGetElement(y, x, sElementIdentifier).parentNode;
                            if(eleDateCell.getAttribute("Class")){
                                if(eleDateCell.getAttribute("Class").match("rdDataCalendarDayLabelHighlight")){
                                    eleDateCell.setAttribute("Class", "rdDataCalendarDayLabelHighlight");
                                }
                            }
                            else{
                                if(eleDateCell.getAttribute("className").match("rdDataCalendarDayLabelHighlight")){
                                    eleDateCell.setAttribute("className", "rdDataCalendarDayLabelHighlight");
                                }
                            }
                        }
                    }
                }
            }
        }
        catch(e){return;}
    }
    
    // function specific to the DataCalendar, to re-color the DataCalendar Date provided by the user. To address the issue when a Theme has been applied as the Theme overwrites these styles.
    function rdOnLoadUserProvidedDataCalendarDateColoring(sElementIdentifier){
        try{
            var x = 1; 
            var y = 31;
            var eleDateCell;
             for(x=1;x<=3;x=x+1){
                for(y=1;y<=31;y=y+1){
                    if(rdGetElement(y, x, sElementIdentifier)){
                        if(rdGetElement(y, x, sElementIdentifier).parentNode){
                            eleDateCell = rdGetElement(y, x, sElementIdentifier).parentNode.parentNode;
                            if(eleDateCell.getAttribute("Class")){
                                if(eleDateCell.getAttribute("Class").match("rdDataCalendarDayLabelHighlight")){
                                    eleDateCell.setAttribute("Class", "rdDataCalendarDayLabelHighlight");
                                }
                            }
                            else{
                                if(eleDateCell.getAttribute("className").match("rdDataCalendarDayLabelHighlight")){
                                    eleDateCell.setAttribute("className", "rdDataCalendarDayLabelHighlight");
                                }
                            }
                        }
                    }
                }
            }
        }
        catch(e){return;}
    }
    
    // function called for resizing the HTML tables holding the calendar months. To handle issue with DocTypes.
    function rdResizeHTMLCalendarMonthTables(sElementIdentifier){
        var nHeight = 0;
        var nWidth = 0;
        try{
            var eleCalendarTable = document.getElementById(sElementIdentifier)
            if(eleCalendarTable){
                var eleFirstMonthTable = eleCalendarTable.firstChild.firstChild.childNodes[0].firstChild;
                nHeight = eleFirstMonthTable.offsetHeight;
                nWidth = eleFirstMonthTable.offsetWidth;
                if((nHeight == 0) || (nWidth == 0)){
                    setTimeout(function(){rdResizeHTMLCalendarMonthTables(sElementIdentifier)}, 15);
                    return;
                }
                if(eleCalendarTable.firstChild.firstChild.childNodes.length > 1){
                    var eleSecondMonthTable = eleCalendarTable.firstChild.firstChild.childNodes[1].firstChild;
                    if((nHeight != eleSecondMonthTable.offsetHeight) || (nWidth != eleSecondMonthTable.offsetWidth)){
                        nHeight = (eleSecondMonthTable.offsetHeight < nHeight ? nHeight : eleSecondMonthTable.offsetHeight);
                        nWidth = (eleSecondMonthTable.offsetWidth < nWidth ? nWidth : eleSecondMonthTable.offsetWidth);
                    }                    
                }
                if(eleCalendarTable.firstChild.firstChild.childNodes.length > 2){
                    var eleThirdMonthTable = eleCalendarTable.firstChild.firstChild.childNodes[2].firstChild;
                    if((nHeight != eleThirdMonthTable.offsetHeight) || (nWidth != eleThirdMonthTable.offsetWidth)){
                        nHeight = (eleThirdMonthTable.offsetHeight < nHeight ? nHeight : eleThirdMonthTable.offsetHeight);
                        nWidth = (eleThirdMonthTable.offsetWidth < nWidth ? nWidth : eleThirdMonthTable.offsetWidth);
                    }
                }
                if (eleFirstMonthTable){ eleFirstMonthTable.style.height = nHeight; eleFirstMonthTable.style.width = nWidth; }
                if (eleSecondMonthTable){ eleSecondMonthTable.style.height = nHeight; eleSecondMonthTable.style.width = nWidth; }
                if (eleThirdMonthTable){ eleThirdMonthTable.style.height = nHeight; eleThirdMonthTable.style.width = nWidth; }
            }
        }
        catch(e){return;}
    }
    
    
    
    
    
   