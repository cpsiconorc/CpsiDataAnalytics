function rdSaveInputCookie(sElementId, sExpiration, sPath)
{
	//Get a date a month from now.
	var expire,expireString;
	var month,year;
	if(sExpiration){
	    try{
	        var expire = new Date();
	        expire.setDate(expire.getDate()+ parseInt(sExpiration));
	    }
	    catch(e){expire = AddAMonthToCurrentDate();}	    
	}else{
	    expire = AddAMonthToCurrentDate()
	}
	expireString = expire.toGMTString();

	//Set the cookie.
	var sValue = ""
	var ele = document.getElementById(sElementId)
	if (!ele) { return false }
    //rdGetInputValues defined in rdAjax2.js
	sValue = rdGetInputValues(ele, false);
    // radio button group? special case.26249
	if (ele.id.indexOf("rdRadioButtonGroup") == 0) {
	    sValue = rdGetFormFieldValue(ele);
	    sElementId = sElementId.substring(18);
	}
	if(sPath == '') sPath = '/';    // This makes the cookie available on a Server level rather than Application level if left empty.
	SetCookie(sElementId,sValue,expireString,sPath)
}

function SetCookie(sName, sValue, sExpires, sPath)
{
	document.cookie = sName + "=" + encodeURI(sValue) + ((sExpires) ? "; expires=" + sExpires : "") + ((sPath) ? "; path=" + sPath : "") +";"
}


function setCookie2(name, value, expires, path, domain, secure)
{
    if(path == '') path = '/';
    document.cookie= name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires.toGMTString() : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure" : "");
}

function getCookie2(name)
{
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1)
    {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    }
    else
    {
        begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1)
    {
        end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
}

function deleteCookie2(name, path, domain)
{
    if (getCookie(name))
    {
        document.cookie = name + "=" + 
            ((path) ? "; path=" + path : "") +
            ((domain) ? "; domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}

function AddAMonthToCurrentDate(){
    var expire=new Date();
    month = expire.getMonth();
    year  = expire.getFullYear();
    if(month == 11)
    {
	    month = 0;
	    year ++;
    }else{     month++;
    }
    expire.setMonth(month);
    expire.setFullYear(year);
    return expire;
}

///LocalStorage///

function rdSaveInputToLocalStorage(sElementId)
{
	//Set the cookie.
	var sValue = ""
	var ele = document.getElementById(sElementId)
	if (!ele) { return false }
    //rdGetInputValues defined in rdAjax2.js
	sValue = rdGetInputValues(ele, false);
	rdSetLocalStorage("rdDefaultValue_" + sElementId, sValue)
}

function rdGetInputFromLocalStorage(sID){
    if (rdHasLocalStorage()) {
       var sStoreID = "rdDefaultValue_" + sID
       //sStoreID = sStoreID.replace(/rdRadioButtonGroup/g, "")
        if (localStorage[sStoreID]) {
            var sValue = localStorage[sStoreID]
		    var ele = document.getElementById(sID)
		    if (ele) {
	            if (ele.type == "checkbox") {
                    if (ele.value == sValue || ele.parentNode.innerText == sValue) { //fix for single checkbox
	                    ele.checked = true
	                }
	            }else if (ele.id.indexOf("rdRadioButtonGroup") == 0) {
		            var sElementId = ele.id.replace(/rdRadioButtonGroup/g, "")
		            var cInputs = ele.getElementsByTagName("INPUT")
		            for (var i = 0; i < cInputs.length; i++) {
			            if (cInputs[i].name == sElementId) {
				            if (cInputs[i].value==sValue) {
					            cInputs[i].checked = true
					            break
				            }
			            }
		            }
                }else if(ele.tagName == "SELECT"/* && ele.multiple*/) {
                    if(ele.multiple){
                        var sValueDelimiter = ele.getAttribute("rdInputValueDelimiter");
                        var aValues = sValue.split(sValueDelimiter)
                        var eleOptions = ele.getElementsByTagName("OPTION")
                        for (var i = 0; i < eleOptions.length; i++) {
                            if (aValues.indexOf(eleOptions[i].value) != -1) {
                                eleOptions[i].selected = true
                            }
                        }
                        if (sValue.length > 1) {
                            sValue = sValue.substring(0, sValue.length - 1)
                        }
                    }else{
                        var eleOptions = ele.getElementsByTagName("OPTION")
                        for (var i = 0; i < eleOptions.length; i++) {
                            if (eleOptions[i].value == sValue) {
                                eleOptions[i].selected = true
                                break;
                            }
                        }
                    }
	            } else if(ele.tagName == "DIV" && LogiXML.String.isNotBlank(ele.getAttribute("data-checkboxlist"))) {
					LogiXML.rd.setInputElementListValue(sID, sValue);
                } else { 
                    // REPDEV - 24192, SUPPORT slider
                    if (ele.getAttribute("rdinputslider") == "True") {
                        ele.value = sValue
                        var s2ID = ele.getAttribute("rdSliderID");
                        if (s2ID) {
                            var eleSlider = Y.one('#' + s2ID);
                            if (Y.Lang.isValue(eleSlider)) {
                                var sliderInstance = eleSlider.getData('sliderInstance');
                                sliderInstance.setValue2(sValue * sliderInstance.get('decimalfactor'));
                            }
                        } else {
                            var eleSlider = Y.one('#' + sID);
                            if (Y.Lang.isValue(eleSlider)) {
                                var sliderInstance = eleSlider.getData('sliderInstance');
                                sliderInstance.setValue(sValue * sliderInstance.get('decimalfactor'));
                            }
                        }
                    } else
		            if (ele.value.length==0) { //Only set when no other default value.
			            ele.value = sValue
			        }
			    }
		    }
        }
    }
}

//Lower-level functions.
function rdHasLocalStorage() {
    /* Use Modernizer test -- Try/Catch only needed for FF4 */
	try {
		return !!localStorage.getItem;
	} catch(e) {
		return false;
	}
}

/* rdWait.htm references rdCookie.js, no clue why.  More importantly users are told to create their
 * own wait pages from it. Which means they won't get the JS updates I put in.
 * Thus, establish global namespace if it doesn't exist.
 */
if ( this.LogiXML === undefined ) {
    this.LogiXML = {};
    this.LogiXML.rd = {};
}
else if ( this.LogiXML.rd === undefined ) {
    this.LogiXML.rd = {};
}

LogiXML.rd.getLocalStorage = function( key, json ) {
	if ( rdHasLocalStorage() ) {
		var value = localStorage.getItem( key );
		return json ? Y.JSON.parse( value ) : value;
	}
	return null;
};

LogiXML.rd.setLocalStorage = function( key, value, json ) {
	if ( rdHasLocalStorage() ) {
		// By storing values as JSON, we can store objects instead of just strings
	    var convertedValue = json ? Y.JSON.stringify( value ) : value;
		
		// 15500 - IE8 crashes when you try adding a blank value
        if ( convertedValue === '' ) { 
            localStorage.removeItem( key );
        } else {
            localStorage.setItem( key, convertedValue );
        }
	}
};

// Map new call to legacy call for now, remove later
window.rdSetLocalStorage = LogiXML.rd.setLocalStorage;

// Use new call but keep old behavior
function rdGetLocalStorage( sKey ) {
    var value = LogiXML.rd.getLocalStorage( sKey );
    return value != null ? value : "";
}