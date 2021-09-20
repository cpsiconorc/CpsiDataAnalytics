YUI.add('colorpicker', function(Y) {

	


}, '1.0.0', { requires: [] });

var sColorPicker = '1';
var sPanelInstanceId = '';
var elePanel = null;

/* ---Dashboard Version--- */
function GetColorPicker(sColorPickerValue, objImg){
    sColorPicker = sColorPickerValue;
    elePanel = Y.Selector.ancestor(objImg, '.rdDashboardPanel', false);
    sPanelInstanceId = elePanel.id.substring(elePanel.id.lastIndexOf('_')+1);
}

function PickGaugeGoalColor(colColor){
    var sColor = Y.Color.toHex(Y.one('#' + colColor.id).getComputedStyle('backgroundColor'));
    var eleColorHolder = document.getElementById('rdAgGaugeGoalsColor' + sColorPicker + '_' + sPanelInstanceId);
    eleColorHolder.value = sColor;
    var elePickedColorIndicator = Y.Selector.query('#rectColor' + sColorPicker, elePanel, true);
    elePickedColorIndicator.style.backgroundColor = sColor;
    ShowElement(this.id,'ppColors','Hide');
}

/* ---Analysis Grid Version--- */
function GetColorPicker(sColorPickerValue, obj){
    sColorPicker = sColorPickerValue;    
}

function PickGaugeGoalColor(colColor){
    var sColor = Y.Color.toHex(Y.one('#' + colColor.id).getComputedStyle('backgroundColor'));
    var eleColorHolder = document.getElementById('rdAgGaugeGoalsColor' + sColorPicker);
    eleColorHolder.value = sColor;
    var elePickedColorIndicator = document.getElementById('rectColor' + sColorPicker);
    elePickedColorIndicator.style.backgroundColor = sColor;
    ShowElement(this.id,'ppColors','Hide');
}