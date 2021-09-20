var rdEmailReportPopupId = null
function rdSendEmailReport(sActionId, nRowNr) {
    try{    // Added this as the validation gets called after this function and the input box never gets validated.
		var sErrorMsg = rdValidateForm()
		if (sErrorMsg) {
		    alert(sErrorMsg)
			return
		}
	}
	catch(e){}
	
    if (typeof rdSaveInputCookies != 'undefined'){rdSaveInputCookies()}
	if (typeof rdSaveInputsToLocalStorage != 'undefined'){rdSaveInputsToLocalStorage()}

    var sIdSuffix = sActionId
    var sRowSuffix = ""
    var elePopupPanel = document.getElementById('rdPopupEmail_' + sIdSuffix) // PopupPanel with Modal shade.
    if(!elePopupPanel){
        // If under a DataTable
        sRowSuffix = "_Row" + nRowNr
        sIdSuffix = sActionId + sRowSuffix
        elePopupPanel = document.getElementById('rdPopupEmail_' + sIdSuffix) 
    }
        
    rdEmailReportPopupId = elePopupPanel.id  //Hide the panel when Ajax returns.
    var rdModalShade = elePopupPanel.previousSibling;  //Setup shading.
    
    var sRequest = "rdProcess=rdTemplate/rdEmail/rdEmailReportProc"
    sRequest += "&rdTaskID=rdEmailReport"
    sRequest += "&rdIgnoreMissingResponse=True"
    sRequest += "&rdFrom=" + rdAjaxEncodeValue(document.getElementById('rdFrom_' + sIdSuffix).value)
    sRequest += "&rdTo=" + rdAjaxEncodeValue(document.getElementById('rdTo_' + sIdSuffix).value)
    sRequest += "&rdCc=" + rdAjaxEncodeValue(document.getElementById('rdCc_' + sIdSuffix).value)
    sRequest += "&rdBcc=" + rdAjaxEncodeValue(document.getElementById('rdBcc_' + sIdSuffix).value)
    sRequest += "&rdSubject=" + rdAjaxEncodeValue(document.getElementById('rdSubject_' + sIdSuffix).value)
    if (document.getElementById('rdBody_' + sIdSuffix)) {
        sRequest += "&rdBody=" + rdAjaxEncodeValue(document.getElementById('rdBody_' + sIdSuffix).value)
    }
    sRequest += "&rdFeedbackHideElementID=divSend_" + sIdSuffix
    sRequest += "&rdFeedbackShowElementID=divWait_" + sIdSuffix
    if (document.getElementById('rdShowElementHistory')){
        sRequest += "&rdKeepShowElements=True"
        sRequest += "&rdShowElementHistory=" + rdAjaxEncodeValue(document.getElementById('rdShowElementHistory').value)
    }

    //LinkParams and other values under the rdLinkParams SPAN.
    var eleLinkParams = document.getElementById('rdLinkParams_' + sIdSuffix)
    if (eleLinkParams){
        for (var i=0; i < eleLinkParams.childNodes.length; i++) {
            if(eleLinkParams.childNodes[i].id != undefined ) {
                var sValue
                if (eleLinkParams.childNodes[i].textContent != undefined) {
                    sValue = eleLinkParams.childNodes[i].textContent //Mozilla, Webkit
                } else {
                    sValue = eleLinkParams.childNodes[i].innerText //IE
                }
                sRequest += "&" + eleLinkParams.childNodes[i].id.replace(sRowSuffix,"") + "=" + rdAjaxEncodeValue(sValue)
            }
        } 
    }
    
    rdAjaxRequest(sRequest,null,null,"true")

}

