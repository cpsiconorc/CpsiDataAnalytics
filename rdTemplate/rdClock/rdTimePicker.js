var aHours = new Array();
var aMinutes = new Array();
var aSeconds = new Array();
var sInputTimeId;
var sInputTimeIdWithoutDashboardId;
var sInputTimeTableId;
var rdInputTimeRowIdentifier;
var bInputTimeSecondsDisplay;

function rdClockPickHours(sHourCell){
    var eleHourCellAnchor = document.getElementById(sHourCell);
    rdRemoveHighlight('HourCell');
    rdHighlightCell(eleHourCellAnchor);
    var eleHourCell = eleHourCellAnchor.getElementsByTagName('Input')[0]
    aHours[sInputTimeId + rdInputTimeRowIdentifier] = eleHourCell.value.split(':')[0];
    var sAMPM;
    if(eleHourCell.value.match('AM')) sAMPM = ' AM';
    if(eleHourCell.value.match('PM')) sAMPM = ' PM';
    rdFormatTimeString(sAMPM);
}

function rdClockPickMinutes(sMinuteCell){
    var eleMinuteCellAnchor = document.getElementById(sMinuteCell);
    rdRemoveHighlight('MinutesCell');
    rdHighlightCell(eleMinuteCellAnchor);
    var eleMinuteCell = eleMinuteCellAnchor.firstChild;
    aMinutes [sInputTimeId + rdInputTimeRowIdentifier] = eleMinuteCell.innerHTML;
    rdFormatTimeString();
}

function rdClockPickSeconds(sSecondCell){
    var eleSecondCellAnchor = document.getElementById(sSecondCell);
    rdRemoveHighlight('SecondsCell');
    bInputTimeSecondsDisplay = true;
    rdHighlightCell(eleSecondCellAnchor);
    var eleSecondCell = eleSecondCellAnchor.firstChild;
    aSeconds [sInputTimeId + rdInputTimeRowIdentifier] = eleSecondCell.innerHTML;
    rdFormatTimeString();
}
 

function rdGetInputTimeRowIdentifier(sRowIdentifiervalue){
    if(sRowIdentifiervalue == undefined) 
        rdInputTimeRowIdentifier == '';
    else if (sRowIdentifiervalue == '') 
        rdInputTimeRowIdentifier = '';
    else            
        rdInputTimeRowIdentifier = '_Row' + sRowIdentifiervalue;
}

 function rdInputTimeAjaxRequest(sInputTimeID, sInputTimeIDWithoutDashID, sTimePickerTableID, sReportID){
    sInputTimeId = sInputTimeID;
    sInputTimeIdWithoutDashboardId = sInputTimeIDWithoutDashID;
    sInputTimeTableId = sTimePickerTableID;
    rdAjaxRequestWithFormVars('rdAjaxCommand=CalendarRefreshElement&rdCalendarRefreshElementID=' + sInputTimeId + ',' 
                                                                                                 + sTimePickerTableID 
                                                                                                 + '&rdReport=' + sReportID 
                                                                                                 + '&rdInputTime=' + document.getElementById(sInputTimeId  + rdInputTimeRowIdentifier).value);        
}

function rdHighlightCell(eleCell){
    eleCell.className = eleCell.className = "rdTimePickerLabelHighlight"
}

function rdRemoveHighlight(sCellType) {
    var eleTimeTable = Y.one('#' + sInputTimeTableId)
    var aTimeCells = eleTimeTable.all(".rdTimePickerLabelHighlight")._nodes
    for (var i = 0; i < aTimeCells.length; i++) {
        var eleCell = aTimeCells[i];
        if (eleCell.id.indexOf(sCellType) != -1) {
            eleCell.className = eleCell.className.replace('rdTimePickerLabelHighlight', 'rdTimePickerCell')
        }
    }
}

function rdFormatTimeString(sOptional){
    var sTimeString = document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).value    
    var sAMPM = (typeof sOptional != 'undefined' ? sOptional : '')
    if(sAMPM == ''){
        if(!(sTimeString.match('AM') || sTimeString.match('PM'))){
            var eleHiddenInputTimeFormat = document.getElementById(sInputTimeId + '_Hidden' + rdInputTimeRowIdentifier);
            if(eleHiddenInputTimeFormat.value.match('AM')) sAMPM = ' AM';
            if(eleHiddenInputTimeFormat.value.match('PM')) sAMPM = ' PM';
        }else{
            if(sTimeString.match('AM')) sAMPM = ' AM';
            if(sTimeString.match('PM')) sAMPM = ' PM';
        }
    }

    var eleHourCell00 = document.getElementById(sInputTimeIdWithoutDashboardId + '_rdTimePicker_HourCell_00')
    if (!eleHourCell00) {
        eleHourCell00 = document.getElementById(sInputTimeId + '_rdTimePicker_HourCell_00')
    }
    var sDefaultHours = eleHourCell00.firstChild.innerHTML == '12' ? '12' : '00';

    document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).value = (typeof aHours[sInputTimeId + rdInputTimeRowIdentifier] == 'undefined' ? sDefaultHours : aHours[sInputTimeId + rdInputTimeRowIdentifier]) +
                                                                              (typeof aMinutes[sInputTimeId + rdInputTimeRowIdentifier] == 'undefined' ? ':00' : (':'+ aMinutes[sInputTimeId + rdInputTimeRowIdentifier])) + 
                                                                              ((bInputTimeSecondsDisplay) ? (typeof aSeconds[sInputTimeId + rdInputTimeRowIdentifier] == 'undefined' ? ':00' : (':' + aSeconds[sInputTimeId + rdInputTimeRowIdentifier])): '') + 
                                                                               sAMPM;

    if(document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).onchange)
        document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).onchange(); //#14348.
    if(document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).onblur)
        document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).onblur(); //15703
}

function rdNeedForSecondsDisplay(){
    var eleHiddenInputTime = document.getElementById(sInputTimeId + '_Hidden' + rdInputTimeRowIdentifier);
    var aTime = eleHiddenInputTime.value.split(':')
    if(aTime.length < 3){
        bInputTimeSecondsDisplay = false;
    }else{
        bInputTimeSecondsDisplay = true;
    }
}

function rdResizeAMPMTable(){
    var eleAMPMTable = document.getElementById(sInputTimeId + '_rdTimePicker_AmPmTable')
    if(eleAMPMTable){
        //eleAMPMTable.style.width = parseInt(eleAMPMTable.parentNode.offsetWidth) + 'px';
        eleAMPMTable.style.height = parseInt(eleAMPMTable.parentNode.offsetHeight) + 'px';
    }
}

function rdLoadInputTimeDefaultValue(){
    var sTimeString = document.getElementById(sInputTimeId + rdInputTimeRowIdentifier).value 
    if(sTimeString != '' || typeof sTimeString == 'undefined'){
        if(sTimeString.split(':').length < 2) return;
        aHours[sInputTimeId + rdInputTimeRowIdentifier] = sTimeString.split(':')[0];
        aMinutes[sInputTimeId + rdInputTimeRowIdentifier] = sTimeString.split(':')[1].replace(/[a-zA-Z]/g, '').replace(/^\s+|\s+$/g, '');
        if(bInputTimeSecondsDisplay){
            aSeconds[sInputTimeId + rdInputTimeRowIdentifier] = (sTimeString.split(':')[2] == null ? '00' : sTimeString.split(':')[2].replace(/[a-zA-Z]/g, '').replace(/^\s+|\s+$/g, ''));
        }
    }
}