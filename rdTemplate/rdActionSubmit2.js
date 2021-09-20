
function SubmitForm(sPage, sTarget, bValidate, sConfirm, bFromOnClick, waitCfg, form) {
    
    if (typeof bSubmitFormAfterAjax != 'undefined'){ //10041
        if (bSubmitFormAfterAjax){ 
            setTimeout(function(){SubmitForm(sPage, sTarget, bValidate, sConfirm, bFromOnClick, waitCfg, form)},1000)
            return
        }
    }

//    Commented out to address #14590.
//    if (document.getElementById("rdDashboardParams")){
//        if(sTarget == ''){  //#13727.
//            rdRemoveDashboardParams()
//        }
//    }

    // REPDEV-24135 No longer needed due to correct encoding to begin with
    //if (bFromOnClick) {
    //    sPage = decodeURIComponent(sPage)  //onClick and other eventes need decoding.#6549
    //}

	if (bValidate == "true") {
		var sErrorMsg = rdValidateForm()
		if (sErrorMsg) {
			alert(sErrorMsg)
			return
		}
	}
	
	if (sConfirm) {
		if (sConfirm.length != 0) {
			if (!confirm(sConfirm)) {
				return
			}
		}
    }

    if (!form)
        form = document.rdForm;
	
    sOldTarget = form.target;
    if (sTarget)
        form.target = sTarget;
    else
        form.target = '_self';

	if (!document.createHiddenInput) {
	    document.createHiddenInput = function (id, value, name) {
	        var input = document.createElement("INPUT");
	        input.type = "HIDDEN";
	        input.id = id;
	        input.name = name || id;
	        input.value = value;
	        return input;
	    };
	}

	var aCheckBoxIds = new Array(0);
	var aCheckBoxListIds = new Array(0);
	var iOrigCount = form.elements.length;
    //23862 23865
   for (var i = 0; i < form.elements.length; i++) {
	    var ele = form.elements[i]
        
	    if (!ele.type) {
	        continue;  //Not an input element.
	    }

	    else if ((ele.type == "hidden") && (ele.getAttribute("rdHiddenCreatedForUncheckedValue"))) { // RD19759
	        if ((i < iOrigCount) && (aCheckBoxIds.indexOf(ele.name) == -1 )) {
	            ele.parentNode.removeChild(ele);
	            aCheckBoxIds.push(ele.name);
	            i = i - 1;
	            iOrigCount = iOrigCount - 1;
	            continue;
	        }	       
	    }
            
	    else if ( (ele.type == 'checkbox') && (ele.getAttribute("rdUncheckedValue")) ) {
	        if ((ele.checked == false) && ele.getAttribute("rdUncheckedValue") != "rdNotSent") {
	            var hiddenCBV = document.createHiddenInput(ele.name, ele.getAttribute("rdUncheckedValue"));
	            hiddenCBV.setAttribute("rdHiddenCreatedForUncheckedValue","true");
	            form.appendChild(hiddenCBV);
	        }
	    }

	    else {
	         if(ele.type == 'text')
	            rdFixupInputs(ele);
	    }	    
	}
	
    var eleRemoved = new Array(0)
	
	if (sPage.search("rdRequestForwarding=Form") == -1) {
	    //No RequestForwarding, remove all RequestForwarding elements.
        for (var i = form.elements.length - 1; i >= 0; i--) {
            var eleForward = form.elements.item(i);
            if (eleForward.id == "rdHiddenRequestForwarding")
                eleRemoved.push(eleForward.parentNode.removeChild(eleForward));
            else if (eleForward.id == "rdRnd")
                eleForward.parentNode.removeChild(eleForward);
		}
	} else {
	    //RequestForwarding, remove elements that are in the request.

        //Remove hidden forwarding elements that have other input elements.
        var eleTextAreas = form.getElementsByTagName("TEXTAREA")

        var eleKeeped = new Map();
        var eleInputs = form.getElementsByTagName("INPUT")
        for (var i = eleInputs.length - 1; i > -1; i--) {
            var eleInput = eleInputs[i]
            if (eleInput.type == "hidden") {
                if (eleInput.id == "rdRnd")
                    eleInput.parentNode.removeChild(eleInput);
                else {
                    //Is the var in the request string?
                    if (sPage.indexOf("?" + eleInput.name + "=") != -1 || sPage.indexOf("&" + eleInput.name + "=") != -1) {
                        eleRemoved.push(eleInput.parentNode.removeChild(eleInput))
                    }
                }
            }
            if (eleInput.id == "rdHiddenRequestForwarding") {
                if (!eleKeeped.has(eleInput.name)) {
                    eleKeeped.set(eleInput.name, eleInput);
                } else {
                    try {
                        eleRemoved.push(eleInput.parentNode.removeChild(eleInput));
                    } catch (e) { }
                }
            }
        }

        for (var k = eleTextAreas.length - 1; k > -1; k--) {
            if (eleKeeped.has(eleTextAreas[k].name)) {
                eleRemoved.push(eleInput.parentNode.removeChild(eleKeeped.get(eleTextAreas[k].name)));  //Remove the hidden forwarding element.
                eleKeeped.set(eleTextAreas[k].name, eleTextAreas[k])
            }
        }

        //old code before resolving performace bottleneck

        /*for (var i=eleInputs.length-1; i > -1; i--) {
            var eleInput = eleInputs[i]
            if (eleInput.id=="rdHiddenRequestForwarding") {
                //Is there another input element with the same id?  (Can't use getElementById())
                for (var k=eleInputs.length-1; k > -1; k--) {
                    if (k != i) {
                        if (eleInputs[k].name == eleInput.name) {
                            try{
                                eleRemoved.push(eleInput.parentNode.removeChild(eleInput))  //Remove the hidden forwarding element.
                            }catch(e){}
                        }
                    }
                }
                for (var k=eleTextAreas.length-1; k > -1; k--) { 
                    if (eleTextAreas[k].name == eleInput.name) {
                        eleRemoved.push(eleInput.parentNode.removeChild(eleInput))  //Remove the hidden forwarding element.
                    }
                }
            }
        }*/

	}
	
	if (sPage.indexOf("rdSubmitScroll") != -1) {
		sPage=sPage.replace("rdSubmitScroll","rdScrollX=" + rdGetScroll('x') + "&rdScrollY=" + rdGetScroll('y') )
	}

	if (typeof rdSaveInputCookies != 'undefined'){rdSaveInputCookies()}
	if (typeof rdSaveInputsToLocalStorage != 'undefined'){rdSaveInputsToLocalStorage()}

    //if (!document.createHiddenInput) {
    //    document.createHiddenInput = function (id, value, name) {
    //        var input = document.createElement("INPUT");
    //        input.type = "HIDDEN";
    //        input.id = id;
    //        input.name = name || id;
    //        input.value = value;
    //        return input;
    //    };
    //}

    var hdnFileGuid = null;

    if (sPage.indexOf("javascript:")==0) {
	    sPage = sPage.replace("javascript:","") //11673
	    eval(sPage)
	} else {
        if (LogiXML.getUrlParameter(location.href, "rdForWizard") == "True")
            sPage = LogiXML.setUrlParameter(sPage, "rdForWizard", "True");

        form.action = sPage;

        var hiddenRnd = document.createHiddenInput("rdRnd", Math.floor(Math.random() * 100000));
        form.appendChild(hiddenRnd);

        if (Y && Y.LogiInfo && Y.LogiInfo.AnalysisGrid && Y.LogiInfo.AnalysisGrid.rdSaveColumnWidths)
            Y.LogiInfo.AnalysisGrid.rdSaveColumnWidths();

        var isSelf = LogiXML.isSelfTarget(form.target);

        // Show wait panel unless targetting a different window.
        if (waitCfg != null && isSelf) {
            //25599
            if (Y.Cookie && Y.Cookie.exists('rdFileDownloadComplete')) {
                Y.Cookie.remove('rdFileDownloadComplete', { path: '/' });
            }

            LogiXML.WaitPanel.pageWaitPanel.readyWait();

            var fileGuid = null;
            if (!document.cookie) {
                var rdExportFilename = LogiXML.getUrlParameter(form.action, "rdExportFilename");
                if (rdExportFilename) {
                    fileGuid = LogiXML.getGuid();
                    hdnFileGuid = document.createHiddenInput("rdExportFileGuid", fileGuid);
                    form.appendChild(hdnFileGuid);
                }
            }

            // if a wait panel is already showing, call this now instead of in a timeout in case the message needs to change
            if (document.getElementById("rdWait")) {
                LogiXML.WaitPanel.pageWaitPanel.showWaitPanel(waitCfg, fileGuid);
            } else {
                setTimeout(function () {
                    LogiXML.WaitPanel.pageWaitPanel.showWaitPanel(this.waitCfg, this.fileGuid);
                }.bind({
                    waitCfg: waitCfg,
                    fileGuid: fileGuid
                }), 500);
            }
        }

        form.submit();
	}
	
	//Put the form back, in case we went to another target window.
	form.target = sOldTarget

	//Replace the removed elements.
	while (eleRemoved.length!=0){
	   form.appendChild(eleRemoved.pop())
	}

    if (hdnFileGuid)
        form.removeChild(hdnFileGuid);
}

//23865 23862
function rdFixupInputs(ele) {

    switch (ele.type) {

        case 'text':
            if (ele.autocomplete) {
                var delimiter = ele.getAttribute('data-delimiter');

                if (delimiter && delimiter.length > 0) {
                    //Get rid of extra spaces added by the autocomplete
                    ele.value = ele.value.split(delimiter + ' ').join(delimiter);

                    //Get rid of the last delimiter added by the autocomplete
                    if (ele.value.lastIndexOf(delimiter) == ele.value.length - 1)
                        ele.value = ele.value.substring(ele.value, ele.value.length - delimiter.length);
                }
            }         
    }
}

function SubmitSort(sPage, RowCnt, SortRowLimit, SortRowLimitMsg) {
	if (SortRowLimit.length != 0) {
		nRowCnt = parseInt(RowCnt,10)
		nSortRowLimit = parseInt(SortRowLimit,10)
		if (nRowCnt > nSortRowLimit) {
			alert(SortRowLimitMsg)
			return
		}
	}

    SubmitForm(sPage, '');
}

function NavigateLink2(sUrl, sTarget, bValidate, sFeatures, sConfirm, waitCfg, bFromOnClick) {

    if (LogiXML.isFalseBlur())
        return false;

	if (bValidate == "true") {
		var sErrorMsg = rdValidateForm()
		if (sErrorMsg) {
			alert(sErrorMsg)
			return
		}
	}
	
	if (sConfirm) {
		if (sConfirm.length != 0) {
			if (!confirm(sConfirm)) {
				return
			}
		}
	}
	
    // REPDEV-24153 - support encoded links by decoding them prior to navigation
    if (sUrl.toLowerCase().match(/^[a-z]+%3a/)) {
        try {
            sUrl = decodeURIComponent(sUrl);
        } catch(e) {
        }
    }

	if (sUrl.toLowerCase().indexOf("javascript:") == 0) {
		//Not submitting the page, run javascript instead.  This works with Target.Link.
        
        var nUrl = sUrl.substr(11);
        //console.log(sUrl.substr(11));
        //console.log(nUrl);

        var runScript = new Function(nUrl);
        runScript();
        return;
	}
	
	//If the URL has a ? at the end, remove it.
	if (sUrl.substring(sUrl.length-1,sUrl.length) == "?") {
        sUrl = sUrl.substring(0, sUrl.length - 1);
    }

	//Replace + with %20. 20424
	//var pattern = /\+/ig;
	//sUrl = sUrl.replace(pattern,"%20");
	//Replace # with %23.
	sUrl = replacePoundPatten(sUrl);
    
	if (typeof rdSaveInputCookies != 'undefined'){rdSaveInputCookies()}
	if (typeof rdSaveInputsToLocalStorage != 'undefined'){rdSaveInputsToLocalStorage()}

	switch (sTarget) {
		case '_parent':
		    window.parent.location.href = sUrl;
			break;
		case '_top':
		    window.top.location.href = sUrl;
			break;
		case '_modal':
		    window.showModalDialog(sUrl, '', sFeatures);
			break;
		case '':
			// REPDEV-24799 Studio Browser does not like assigning here, but works in a timeout
			setTimeout(function () {
				window.location.assign(this.sUrl);
			}.bind({
				sUrl: sUrl
			}), 1);
			
			rdShowWaitPanel(waitCfg);

			break;
        default:
            if (sTarget == "Debugger Trace") {
                //Open the debugger trace in a special tab.
                //Close the that tab if it already exists, so that it always gets focus.
                //Otherwise the tab may stay in background, except for Chrome which works well without this.
                if (navigator.userAgent.toLowerCase().indexOf('chrome') == -1) {
                    //Not chrome
                    var tab = window.open("about:blank", "Debugger Trace");
                    tab.close();
                }
            }

            window.open(sUrl, sTarget, sFeatures);
			break;
	}
}

// the lone apostrophe is intentionally left escaped, and not unescaped, see REPDEV-21723 (to run the passed string as a function)
function LG_EscapeParamApostrophe(str) {
    if (str.indexOf('rdAcUpdateControls') > 1 || str.indexOf('LogiXML') >= 0 || str.indexOf("\\") >= 0) {
        txt1 = str;
    }
    else {
        var txt1 = str.replace(/','/g, "^")
            .replace(/',/g, "!!")
            .replace(/\('/g, "~S")
            .replace(/'\)/g, "~E")
            .replace(/\['/g, "~P")
            .replace(/'\]/g, "~Q")
            .replace(/'/g, "\\'")

            .replace(/\^/g, "','")
            .replace(/!!/g, "',")
            .replace(/~S/g, "('")
            .replace(/~E/g, "')")
            .replace(/~P/g, "['")
            .replace(/~Q/g, "']");
    }
   
    return txt1;
}

function rdShowWaitPanel(waitCfg) {
    //Show wait panel
    if (waitCfg != null) {
        //25599
        if (Y.Cookie && Y.Cookie.exists('rdFileDownloadComplete')) {
            Y.Cookie.remove('rdFileDownloadComplete', { path: '/' });
        }

        var timeOut = NaN;

        if (Array.isArray(waitCfg)) {
            if (waitCfg.length > 3) {
                timeOut = parseInt(waitCfg[3]);
            }
        } else {
            timeOut = parseInt(waitCfg.timeout);
        }

        if (isNaN(timeOut))
            timeOut = 350;

        if (timeOut < 0)
            timeOut = 0;

        LogiXML.WaitPanel.pageWaitPanel.readyWait();

        setTimeout(function () {
            LogiXML.WaitPanel.pageWaitPanel.showWaitPanel(waitCfg)
        }, timeOut);
    }
}

function rdHideWaitPanel() {
    LogiXML.WaitPanel.pageWaitPanel.hideWaitPanel();
}

function SubmitFormCrawlerFriendly(sPage, sTarget, bValidate, sConfirm) {
    sPage = unescape(sPage);
    SubmitForm(sPage, sTarget, bValidate, sConfirm);
}

function NavigateCrawlerFriendly(sUrl, sTarget, bValidate, sFeatures, sConfirm) {
    sUrl = unescape(sUrl);
    NavigateLink2(sUrl, sTarget, bValidate, sFeatures, sConfirm);
}


function rdBodyPressEnter(sID, e) {
	var ele = document.getElementById(sID);
    if (ele) { //RD24999 - non button elements like labels etc don't use href anymore.
        // was focus on the input with default action already, dont process it twice...RD19810
        if (!e) e = window.event; //RD20948
        var target = e.target || e.srcElement;
        var id,
            bclick = true;
        if (target) {
            id = target.id;
        }
        if (id && (id == sID)) {
            bclick = false;
        }
        if (bclick == true) {
            ele.click();
        }	       
	}
}

function replacePoundPatten(sUrl) {
    if (sUrl.indexOf('rdAllowAnchor=True') < 0) {
        var pattern = /\#/ig;
        sUrl = sUrl.replace(pattern, "%23");
    } else {
        sUrl = sUrl.replace('?rdAllowAnchor=True', '').replace('rdAllowAnchor=True', '');
    }

    return sUrl
}
