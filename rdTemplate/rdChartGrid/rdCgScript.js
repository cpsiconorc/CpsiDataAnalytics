function rdCgPopupZoom(sRowTitle, sColumnTitle, sDataFilename) {

    var framePopupZoom = document.getElementById("iframePopupZoom")
    var sSrc = framePopupZoom.getAttribute("data-hiddensource")
    var nPrevParmsIndex = sSrc.indexOf("&rdZoomParams")
    if (nPrevParmsIndex != -1) {
        sSrc = sSrc.substring(0,nPrevParmsIndex)
    }
    sSrc += "&rdZoomParams&rdRowTitle=" + sRowTitle + "&rdColumnTitle=" + sColumnTitle + "&rdDataFilename=" + sDataFilename
    framePopupZoom.setAttribute("data-hiddensource", sSrc)

    ShowElement(this.id,'rdChartGridPopupZoom','Show');
}

function rdInitFilterClicks() {
    if (location.href.indexOf("rdShowFilterPopup")==-1) {return}
    rdCgSetAllFilterState()
}

function rdCgClickedFilterValue(nRowNr) {
    var i
    var eleClicked = document.getElementById("chkFilter_Row" + nRowNr)
    
    //If "All" was checked, check or uncheck all others.
    if (nRowNr==1) {
        i = 2
        var eleChk = document.getElementById("chkFilter_Row" + i)
        while (eleChk) {
            eleChk.checked = eleClicked.checked
            i += 1
            eleChk = document.getElementById("chkFilter_Row" + i)
        }
    }
   
    rdCgSetAllFilterState()
    
    //Hide the Done button if the first row is un-checked.
    if (document.getElementById("chkFilter_Row1").checked==false){
        ShowElement(null,"lblFilterDone",'Hide');
    }else{
        ShowElement(null,"lblFilterDone",'Show');
    }
}

function rdCgSetAllFilterState() {
    //Set the state of the All checkbox.   
    var nChecked = 0
    var nUnchecked = 0
    var i = 2
    eleChk = document.getElementById("chkFilter_Row" + i)
    while (eleChk) {
        if (eleChk.checked) {
            nChecked += 1
        } else {
            nUnchecked += 1
        }
        i += 1
        eleChk = document.getElementById("chkFilter_Row" + i)
    }
    var eleAll = document.getElementById("chkFilter_Row1")
    if (nChecked==0) {
        eleAll.checked = false
        rdSetCheckboxOpacity(eleAll,1)
    } else if (nUnchecked==0) {
        eleAll.checked = true
        rdSetCheckboxOpacity(eleAll,1)
    } else {
        eleAll.checked = true
        rdSetCheckboxOpacity(eleAll,.3)
    }
}

function rdSetCheckboxOpacity(eleChk,alpha){
    if (eleChk.currentStyle) {
        //For IE, prevent too much transparency by setting a background color.
        var popupPanel = document.getElementById("rdPopupPanelTable_popupFilter")
        if (eleChk.offsetParent) {
            eleChk.offsetParent.style.backgroundColor = popupPanel.currentStyle.backgroundColor
            Y.one(eleChk.offsetParent).setStyle('opacity', 1);
        }
    }
    Y.one(eleChk).setStyle('opacity', alpha);
}
