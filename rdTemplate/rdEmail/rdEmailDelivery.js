var rdEmailDeliveryPopupId = null
function rdSendEmailDelivery(sActionId, nRowNr) {
    try{    // Added this as the validation gets called after this function and the input box never gets validated.
		var sErrorMsg = rdValidateForm()
		if (sErrorMsg) {
			return
		}
	}
	catch(e){}

    var elePopupPanel = document.getElementById('rdPopupEmail_' + sActionId) // PopupPanel with Modal shade.
    if(!elePopupPanel){
        elePopupPanel = document.getElementById('rdPopupEmail_' + sActionId + '_Row' + nRowNr) // If under a DataTable.
    }
        
    rdEmailDeliveryPopupId = elePopupPanel.id  //Hide the panel when Ajax returns.
    var rdModalShade = elePopupPanel.previousSibling;  //Setup shading.
    
    var sRequest = "rdProcess=rdTemplate/rdEmail/rdEmailDeliveryProc"
    sRequest += "&rdTaskID=rdEmailDelivery"
    sRequest += "&rdIgnoreMissingResponse=True"
    sRequest += "&rdFrom=" + rdAjaxEncodeValue(document.getElementById('rdFrom_' + sActionId).value)
    sRequest += "&rdTo=" + rdAjaxEncodeValue(document.getElementById('rdTo_' + sActionId).value)
    sRequest += "&rdCc=" + rdAjaxEncodeValue(document.getElementById('rdCc_' + sActionId).value)
    sRequest += "&rdBcc=" + rdAjaxEncodeValue(document.getElementById('rdBcc_' + sActionId).value)
    sRequest += "&rdSubject=" + rdAjaxEncodeValue(document.getElementById('rdSubject_' + sActionId).value)
    sRequest += "&rdBody=" + rdAjaxEncodeValue(document.getElementById('rdBody_' + sActionId).value)
    sRequest += "&rdFeedbackHideElementID=divSend_" + sActionId
    sRequest += "&rdFeedbackShowElementID=divWait_" + sActionId
    if (document.getElementById('rdShowElementHistory')){
        sRequest += "&rdKeepShowElements=True"
        sRequest += "&rdShowElementHistory=" + rdAjaxEncodeValue(document.getElementById('rdShowElementHistory').value)
    }

    //LinkParams and other values under the rdLinkParams SPAN.
    var eleLinkParams = document.getElementById('rdLinkParams_' + sActionId)
    if (eleLinkParams){
        for (var i=0; i < eleLinkParams.childNodes.length; i++) {
            if(eleLinkParams.childNodes[i].id != undefined ) {
                sRequest += "&" + eleLinkParams.childNodes[i].id + "=" + rdAjaxEncodeValue(eleLinkParams.childNodes[i].innerText)
            }
        } 
    }
    
    rdAjaxRequest(sRequest,null,null,"true")

}

