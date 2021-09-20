
var rdValidationRowNrFilter = undefined  //For Bookmark <InputText>.

function rdValidateDate(sFieldId, sDateFormat, sDateRangeStart, sDateRangeEnd, sErrorMsg, sErrorClass) {
	var eleInput = document.getElementById(sFieldId)
	if (eleInput) {
		if (rdIsInputVisible(sFieldId)) {
			rdRestoreNonErrorClass(eleInput)
			if (eleInput.value.length != 0) {
				if (isDate(eleInput.value, sDateFormat) == false) {
					rdSetErrorClass(eleInput,sErrorClass)
					return sErrorMsg
				}
		        if (isDateInRange(eleInput.value, sDateRangeStart, sDateRangeEnd, sDateFormat) == false) {
			        rdSetErrorClass(eleInput,sErrorClass)
			        return sErrorMsg
			    }
			}
		}
	} else {
		//Element not found.  Look to see if it's in a DataTable.
		if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
			for (var i = 1; i < 10000; i++) {
				eleInput = document.getElementById(sFieldId + "_Row" + i)
				if (!eleInput) {
					break
				}
				var sRowErrorMsg = rdValidateDate(sFieldId + "_Row" + i, sDateFormat, sDateRangeStart, sDateRangeEnd, sErrorMsg, sErrorClass)   // #10866
				if (sRowErrorMsg) {
					return sErrorMsg
				}
			}  
		}
	}
}

function rdValidateNumeric(sFieldId, sLocaleDecimalChar, sErrorMsg, sErrorClass) {
	var eleInput = document.getElementById(sFieldId)
	if (eleInput) {
		if (rdIsInputVisible(sFieldId)) {
			rdRestoreNonErrorClass(eleInput)
			var sValue = rdGetInputValue(sFieldId)
			if (sValue.length != 0) {
				//Get the value into the invariant style that JScript understands.
				if (sLocaleDecimalChar == ",") {    
					sValue = sValue.replace(/\./g, '')  //Remove periods.
					sValue = sValue.replace(/,/g, '.')  //Replace comma decimal points with periods.
				} else {						
					sValue = sValue.replace(/,/g, '')   //Remove commas.
				}
				if (parseFloat(sValue) != sValue) {
					rdSetErrorClass(eleInput,sErrorClass)
					return sErrorMsg
				}
			}
		}
	} else {
		//Element not found.  Look to see if it's in a DataTable.
		if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
			for (var i = 1; i < 10000; i++) {
				eleInput = document.getElementById(sFieldId + "_Row" + i)
				if (!eleInput) {
					break
				}
				var sRowErrorMsg = rdValidateNumeric(sFieldId + "_Row" + i, sLocaleDecimalChar, sErrorMsg, sErrorClass)
				if (sRowErrorMsg) {
					return sErrorMsg
				}
			}  
		}
	}
}


function rdValidateRequired(sFieldId, sErrorMsg, sErrorClass) {
	var eleInput = document.getElementById(sFieldId)
	if (eleInput) {
	    if (eleInput.id == 'rdHiddenRequestForwarding') {   //#14412.
	        eleInput=null;
	    }
	}
	if (eleInput) {
		if (eleInput.nodeName === "DIV" && eleInput.getAttribute("data-checkboxlist")){
			//list type elements
			var listContainer = Y.one(eleInput);
			// is visible?
			var listHandler = Y.one("#" + sFieldId + "_handler")
			if ((listHandler && !rdIsInputVisible(listHandler.getAttribute("id"))) || (!listHandler && !rdIsInputVisible(sFieldId))){
				return;
			}
			var listItems = listContainer.all('[id^=' + sFieldId + '_rdList]');
			var isValue = false, listItemId = "", listLength = listItems.size(), listItemType="";
			for (var i = 0; i < listLength; i++) {
				listItemId = listItems.item(i).getAttribute('id');
				listItemType = listItems.item(i).getAttribute('type');
				switch(listItemType){
					case "checkbox":
						if(listItems.item(i).get('checked') == true) {
							isValue = true;
						}
						break;
					default:
						if(rdGetInputValue(listItemId).length > 0){
							isValue = true;
						}
					break;
				}
				if(isValue) {
					break;
				}
			}
			if(listLength > 0 && isValue === false){
				if(listHandler) {
					rdSetErrorClass(listHandler.getDOMNode(),sErrorClass);
				} else if(listContainer){
					rdSetErrorClass(listContainer.getDOMNode(),sErrorClass);
				} 
				return sErrorMsg;
			}
		} else if (rdIsInputVisible(sFieldId)) {
			rdRestoreNonErrorClass(eleInput)
			var sValue = rdGetInputValue(sFieldId)
			if (sValue.length == 0) {
				rdSetErrorClass(eleInput,sErrorClass)
				return sErrorMsg
			}
		}
	} else if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
		var nodelistFields
        if (typeof rdValidationRowNrFilter != 'undefined') {
            var nodelistFields = Y.all('[id^=' + sFieldId + '_Row' + rdValidationRowNrFilter + ']')  //Validate just one _Row.
        }else{
            var nodelistFields = Y.all('[id^=' + sFieldId + '_Row]') //Validate all elements with field ID plus "_Row".
        }

		for (var i = 0; i < nodelistFields.size(); i++) {
			var sFieldId = nodelistFields.item(i).getAttribute('id')
			var sRowErrorMsg = rdValidateRequired(sFieldId, sErrorMsg, sErrorClass)
			if (sRowErrorMsg) {
				return sErrorMsg
			}
		}
	}
}

function rdValidateLength(sFieldId, MinLength, MaxLength, sErrorMsg, sErrorClass) {
    var eleInput = document.getElementById(sFieldId)
    if (eleInput) {
        if (rdIsInputVisible(sFieldId)) {
            rdRestoreNonErrorClass(eleInput)
            var sValue = rdGetInputValue(sFieldId)
            if (sValue.length < MinLength || sValue.length > MaxLength) {
                rdSetErrorClass(eleInput, sErrorClass)
                return sErrorMsg
            }
        }
    } else {
        //Element not found.  Look to see if it's in a DataTable.
        if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
            for (var i = 1; i < 10000; i++) {
                eleInput = document.getElementById(sFieldId + "_Row" + i)
                if (!eleInput) {
                    break
                }
                var sRowErrorMsg = rdValidateLength(sFieldId + "_Row" + i, MinLength, MaxLength, sErrorMsg, sErrorClass)
                if (sRowErrorMsg) {
                    return sErrorMsg
                }
            }
        }
    }
}

function rdValidateJavascript(sFieldId, funcValidate, sErrorMsg, sErrorClass) {
    var eleInput = document.getElementById(sFieldId);
    try {
        if (rdIsInputVisible(sFieldId) && eleInput) {
            rdRestoreNonErrorClass(eleInput)
        }
        eval(funcValidate)
    }
    catch (e) {
        sErrorMsg = sErrorMsg.replace("{error}", e)        
        if (eleInput) {
            rdSetErrorClass(eleInput, sErrorClass);
        }
        return sErrorMsg
    }
}

function rdValidateTelePhoneNumber(sFieldId, sAllowedChar, sErrorMsg, sErrorClass) {
	var eleInput = document.getElementById(sFieldId)
	if (eleInput) {
		if (rdIsInputVisible(sFieldId)) {
			rdRestoreNonErrorClass(eleInput)
			var sValue = rdGetInputValue(sFieldId)
			if(typeof(sAllowedChar)!="undefined"){
			    var aSpecialChar = sAllowedChar.split('')
			    var sSpecialChars = "!@#$%^&*()+=-[]\\\';,./{}|\":<>?~_";  
			    for(var i in aSpecialChar){
			       sSpecialChars = sSpecialChars.replace(aSpecialChar[i], '')
			    }
                for (var i = 0; i < sValue.length; i++) {
                    if (sSpecialChars.indexOf(sValue.charAt(i)) != -1) {
                        rdSetErrorClass(eleInput,sErrorClass)
	                    return sErrorMsg
                    }
                }
            var regSpecialChars = /\$|,|@|#|~|`|\%|\*|\^|\&|\(|\)|\+|\=|\[|\-|\_|\]|\[|\}|\{|\;|\:|\'|\"|\<|\>|\?|\||\\|\!|\$|\./g;
            sValue =  sValue.replace(regSpecialChars, "")                    
            }			
            if (parseFloat(sValue) != sValue) {
	            rdSetErrorClass(eleInput,sErrorClass)
	            return sErrorMsg
            }
        }
	} else {
		//Element not found.  Look to see if it's in a DataTable.
		if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
			for (var i = 1; i < 10000; i++) {
				eleInput = document.getElementById(sFieldId + "_Row" + i)
				if (!eleInput) {
					break
				}
				var sRowErrorMsg = rdValidateTelePhoneNumber(sFieldId + "_Row" + i, MinLength, MaxLength, sErrorMsg, sErrorClass)   // #10866
				if (sRowErrorMsg) {
					return sErrorMsg
				}
			}  
		}
	}
}

function rdValidateEmailAddress(sFieldId, sErrorMsg, sErrorClass) {
	var eleInput = document.getElementById(sFieldId);
	if (eleInput) {
		if (rdIsInputVisible(sFieldId)) {
		    var multipleAttr = eleInput.getAttribute("multiple");
		    var isMultiple = multipleAttr ? multipleAttr == "true" : false;
			rdRestoreNonErrorClass(eleInput);
			var txtValue = eleInput.value;
			//trim
			txtValue = txtValue.replace(/^([\s,;,/,]+)|([\s,;,/,])+$/g,"");
			var sText = [];
			if(isMultiple == true){
			    //support space, comma, semicolon as email separator
			    sText = txtValue.replace(/[\s,]/g,';').split(";");
			}
			else{
			    sText[0] = txtValue;
			}
		    var regEmailAddress = (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,20})+$/);
			var isValid = true;
			if(isMultiple === false && sText.length > 1)
			     isValid = false;
  		    else
			    for (var i = 0; i < sText.length; i++){
				    var txt = sText[i];
					if(txt.length === 0)
					    continue;
				    if(!regEmailAddress.test(txt)){
					    isValid = false; 
					    break;
				    }
				    sText[i] = txt;
			    }
            if(isValid === false){
                rdSetErrorClass(eleInput,sErrorClass);
				return sErrorMsg;
            }   
            txtValue = "";
           	for (var i = 0; i < sText.length; i++){
           	    if (sText[i].length > 0)
			        txtValue = txtValue + (i == 0 ? "" : "; ") + sText[i];
		    }
		    eleInput.value = txtValue;
              
		}
	} else {
		//Element not found.  Look to see if it's in a DataTable.
		if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
			for (var i = 1; i < 10000; i++) {
				eleInput = document.getElementById(sFieldId + "_Row" + i)
				if (!eleInput) {
					break
				}
				var sRowErrorMsg = rdValidateEmailAddress(sFieldId + "_Row" + i, sErrorMsg, sErrorClass)   // #10866
				if (sRowErrorMsg) {
					return sErrorMsg
				}
			}  
		}
	}
}

function rdValidateTimeString(sFieldId, sStartTime, sEndTime, sErrorMsg, sErrorClass){
    var eleInput = document.getElementById(sFieldId)
	if (eleInput) {
		if (rdIsInputVisible(sFieldId)) {
			rdRestoreNonErrorClass(eleInput)
            if(!rdIsValidTime(eleInput.value)){
                rdSetErrorClass(eleInput,sErrorClass)
				return sErrorMsg
            }
            if(!rdIsTimeInRange(eleInput.value, sStartTime, sEndTime)){
                rdSetErrorClass(eleInput,sErrorClass)
				return sErrorMsg
            }                 
		}
	} else {
		//Element not found.  Look to see if it's in a DataTable.
		if (sFieldId.indexOf("_Row") == -1) {  //Be sure not already checking a Row.
			for (var i = 1; i < 10000; i++) {
				eleInput = document.getElementById(sFieldId + "_Row" + i)
				if (!eleInput) {
					break
				}
				var sRowErrorMsg = rdValidateTimeString(sFieldId + "_Row" + i, sErrorMsg, sErrorClass)   // #10866
				if (sRowErrorMsg) {
					return sErrorMsg
				}
			}  
		}
	}
}

function rdIsValidTime(sTimeString) {
    if(sTimeString == '' || sTimeString == null) return true;
    var regTimeValidation = /^(\d{1,2}):(\d{2})(:(\d{2}))?(\s?(AM|am|PM|pm))?$/;
    var aTimeArray = sTimeString.match(regTimeValidation);
    if (aTimeArray == null) {
        return false;
    }
    var nHours = aTimeArray[1];
    var nMinutes = aTimeArray[2];
    var nSeconds = aTimeArray[4];
    var sAMPM = aTimeArray[6];

    if (nSeconds == '') nSeconds = null; if (sAMPM == '') sAMPM = null;

    if (nHours < 0  || nHours > 23) return false;
    if (nMinutes < 0 || nMinutes > 59) return false;

    if (nSeconds != null && (nSeconds < 0 || nSeconds > 59)) return false;
//    You have to specify AM or PM.
//    if (nHours <= 12 && sAMPM == null) return false;
//    You can't specify AM or PM for 24 hour time format.
    if (nHours > 12 && sAMPM != null) return false;
    return true;
}

function rdIsTimeInRange(sTimeString, sStartTime, sEndTime){
    if(sStartTime == '' || sEndTime == '')  return true;
    if(!rdIsValidTime(sStartTime)) return true;
    if(!rdIsValidTime(sEndTime)) return true;

    var regTimeValidation = /^(\d{1,2}):(\d{2})(:(\d{2}))?(\s?(AM|am|PM|pm))?$/;
    var aTimeArray = sTimeString.match(regTimeValidation);
    var aStartTimeArray = sStartTime.match(regTimeValidation);
    var aEndTimeArray = sEndTime.match(regTimeValidation);

    if (aTimeArray == null) return false;
    var nHours = parseFloat(aTimeArray[1]);
    var nMinutes = parseFloat(aTimeArray[2]);
    var nSeconds = parseFloat((aTimeArray[4] == '' ? 0 : aTimeArray[4]));
	var sAMPM = aTimeArray[6];
	var bAMPM = true;
    if (sAMPM == undefined) {
	   bAMPM = false;
    }		
    
    if (aStartTimeArray == null) return true;
    var nStartTimeHours = parseFloat(aStartTimeArray[1]);
    var nStartTimeMinutes = parseFloat(aStartTimeArray[2]);
    var nStartTimeSeconds = parseFloat((aStartTimeArray[4] == ''? 0 : aStartTimeArray[4]));
    var sStartTimeAMPM = aStartTimeArray[6];    
	if (bAMPM == true && sStartTimeAMPM == undefined) {
		if (nEndTimeHours > 12) {
			nStartTimeHours = nStartTimeHours -12;
			sStartTimeAMPM = "pm";
		}
		else {
			sStartTimeAMPM = "am";
		}	
	}

    if (aEndTimeArray == null) return true;
    var nEndTimeHours = parseFloat(aEndTimeArray[1]);
    var nEndTimeMinutes = parseFloat(aEndTimeArray[2]);
    var nEndTimeSeconds = parseFloat((aEndTimeArray[4] == '' ? 0 : aEndTimeArray[4]));
    var sEndTimeAMPM = aEndTimeArray[6];    
	if (bAMPM == true && sEndTimeAMPM == undefined) {
		if (nEndTimeHours > 12) {
			nEndTimeHours = nEndTimeHours -12;
			sEndTimeAMPM = "pm";
		}
		else {
			sEndTimeAMPM = "am";
		}	
	}

	if (bAMPM == true) {
		if (sAMPM.toLowerCase() == 'am' || sAMPM.toLowerCase() == 'pm') {
			if(sAMPM.toLowerCase() == 'am'  && (sStartTimeAMPM.toLowerCase() == 'pm')) return false;
			if(sAMPM.toLowerCase() == 'pm' && sEndTimeAMPM.toLowerCase() == 'am') return false;
			if(nStartTimeHours == 12) nStartTimeHours = 0; if(nEndTimeHours == 12) nEndTimeHours = 0; if(nHours == 12) nHours = 0;
			if(sAMPM.toLowerCase() == 'am'){
				if(nHours < nStartTimeHours) return false;
				if(nHours == nStartTimeHours){
					if(nMinutes < nStartTimeMinutes) return false;
						if(nMinutes == nStartTimeMinutes){
							if(nSeconds < nStartTimeSeconds) return false;
						}
					}
				if(sEndTimeAMPM.toLowerCase() == 'am'){
					if(nHours > nEndTimeHours) return false;
					if(nHours == nEndTimeHours){
						if(nMinutes > nEndTimeMinutes) return false;
						if(nMinutes == nEndTimeMinutes){
							if(nSeconds > nEndTimeSeconds) return false;
						}
					}
				}   
			} 
			if(sAMPM.toLowerCase() == 'pm'){
			if(nHours > nEndTimeHours) return false;
				if(nHours == nEndTimeHours){
					if(nMinutes > nEndTimeMinutes) return false;
						if(nMinutes == nEndTimeMinutes){
							if(nSeconds > nEndTimeSeconds) return false;
						}
					} 
				//}	
				if(sStartTimeAMPM.toLowerCase() == 'pm'){
					if(nHours < nStartTimeHours) return false;
					if(nHours == nStartTimeHours){
					if(nMinutes < nStartTimeMinutes) return false;
						if(nMinutes == nStartTimeMinutes){
							if(nSeconds < nStartTimeSeconds) return false;
						}
					}
				} 
			} 
		}
	}	
	if (bAMPM == false) { //24hr format.
        if(nHours > nEndTimeHours || nHours < nStartTimeHours) return false;
        if(nHours == nEndTimeHours){
            if(nMinutes > nEndTimeMinutes) return false;
            if(nMinutes == nEndTimeMinutes){
                 if(nSeconds > nEndTimeSeconds) return false;
            }
        }   
        if(nHours == nStartTimeHours){
            if(nMinutes < nStartTimeMinutes) return false;
            if(nMinutes == nStartTimeMinutes){
                 if(nSeconds < nStartTimeSeconds) return false;
            }
        }   
    }
    return true;
}

function rdGetInputValue(sFieldId) {
	var fld = document.getElementById(sFieldId)
	if (!fld) {
		fld = document.getElementsByName(sFieldId)[0]
	}
	
	var sValue

	if (fld.id.indexOf("rdRadioButtonGroup") == 0) {
		// Radio buttons
		sFieldId = sFieldId.replace(/rdRadioButtonGroup/g, '')
		var cInputs = document.getElementsByTagName("INPUT")
		for (var i = 0; i < cInputs.length; i++) {
			if (cInputs[i].name == sFieldId) {
				if (cInputs[i].checked) {
					sValue = cInputs[i].value
					break
				}
			}
		}
		if (sValue == undefined) {
				sValue = ''
			}

	} else {
		// All other fields
		if (fld.value.length == 0) {
			sValue = ''
		} else {
			sValue = fld.value
		}
	}
	return sValue	
}

function rdIsInputVisible(sFieldId) {
	var fld = document.getElementById(sFieldId)
	if (!fld) {
		fld = document.getElementsByName(sFieldId)[0]
	}
	if (!fld) {
		return false
	}
		
	var par = fld.parentNode
	while (par) {
		if (par.style) {
			if (par.style.display=="none") {
				return false
			}
		}
		par = par.parentNode
	} 
	
	return true	
}

function rdChangeFlag(sChangeFlagId) {
	if (document.getElementById(sChangeFlagId)) {
		document.getElementById(sChangeFlagId).value = "True"
	}
}

function rdSetErrorClass(eleInput,sErrorClass) {
	if (sErrorClass.length > 0) {
		//May ErrorClass be different for elements?
		eleInput.setAttribute("data-rd-error-class", sErrorClass);
		if (eleInput.id.indexOf("rdRadioButtonGroup") == 0) {
				eleInput = eleInput.parentNode;
		} 
		var yuiNode = Y.one(eleInput);
		if(!yuiNode.hasClass(sErrorClass)){
			yuiNode.addClass(sErrorClass);
		}
	}
}
function rdRestoreNonErrorClass(eleInput) {
	if (eleInput.id.indexOf("rdRadioButtonGroup") == 0) {
		eleInput = eleInput.parentNode;
	} 
	var yuiNode = Y.one(eleInput);
	var sErrorClass = yuiNode.getAttribute("data-rd-error-class");
	if(LogiXML.String.isNotBlank(sErrorClass)){
		yuiNode.removeClass(sErrorClass);
	}
}

function rdConfirmAndValidateActionJavascript(e, sConfirmationMsg, bValidate, onSuccess, onCancel) {
    var rdCancelEvent = function (e) {
        if (!e)
            return;

        e.cancelBubble = true;

        if (e.stopPropagation)
            e.stopPropagation();

        if (e.preventDefault)
            e.preventDefault();
    }

    if (typeof (bValidate) != 'undefined') {
        if (bValidate) {
            var sErrorMsg = rdValidateForm();
            if (sErrorMsg) {
                alert(sErrorMsg);

                if (onCancel)
                    onCancel.bind(this)();

                rdCancelEvent(e);

                return false;
            }
        }
    }

    if(sConfirmationMsg != null){
        if (!confirm(sConfirmationMsg)) {
            if (onCancel)
                onCancel.bind(this)();

            rdCancelEvent(e);

            return false;
        }
    }

    if (onSuccess)
        onSuccess.bind(this)();

    return;
}

