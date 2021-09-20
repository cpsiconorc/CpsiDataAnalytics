function rdDataMenuTreeInit(sID) {
    //Collapse items with plus sign.
    var bUseDefaultExpansion = true
    nRow = 1 
    var eleMenuImage = document.getElementById("rdExpando_" + sID + "_Row" + nRow)
    while (eleMenuImage){
        var eleStatus = document.getElementById("rdExpandoStatus_" + sID + "_Row" + nRow)
        if (rdDmtGetInnerText(eleStatus).length != 0) {
            if (!rdDisableRememberExpansion(sID) && rdHasLocalStorage()) {
                //Get the status from localStorage.
                var eleItemId = document.getElementById("rdExpandoItemID_" + sID + "_Row" + nRow)
                if (eleItemId) {
                    if (localStorage["rdExpandoStatus_" + sID + "_" + rdDmtGetInnerText(eleItemId)]) {
                        rdDmtSetInnerText(eleStatus, localStorage["rdExpandoStatus_" + sID + "_" + rdDmtGetInnerText(eleItemId)])
                        bUseDefaultExpansion = false
                    }
                }
            }
        }
        
        switch (rdDmtGetInnerText(eleStatus)) {
	        case "+":
	            eleMenuImage.src = document.getElementById("rdBranchCollapsedImage_" + sID).src
                rdCollapseChildren(sID, nRow)
		        break;
	        case "-":
	            eleMenuImage.src = document.getElementById("rdBranchExpandedImage_" + sID).src
	            break;
            default:                
                if (eleMenuImage.parentNode) { //24709
                    eleMenuImage.parentNode.tabIndex = "-1";
                }               
//	        default:
//	            eleMenuImage.src = eleMenuImage.src.replace("rdArrowBlank.png","rdBlank.gif")
        }

        var eleChildIndent = document.getElementById("rdIndent_" + sID + "_Row" + nRow)
        if (eleChildIndent.style.width == "0px") {
            eleChildIndent.style.display = "none"
        }

        nRow += 1
        eleMenuImage = document.getElementById("rdExpando_" + sID + "_Row" + nRow)
    }

    var eleMenuTable = document.getElementById(sID)  //Initially invisible until all collapses are done.
    eleMenuTable.style.display = ""

}

function rdDataMenuTreeExpandCollapse(sID, eleClicked) {
    var nRow = parseInt(eleClicked.id.substr(eleClicked.id.indexOf("_Row") + 4))
    var eleStatus = document.getElementById("rdExpandoStatus_" + sID + "_Row" + nRow)
    
    
    switch (rdDmtGetInnerText(eleStatus)) {
        case "+":
            //Expand
            eleClicked.src = document.getElementById("rdBranchExpandedImage_" + sID).src
            rdDmtSetInnerText(eleStatus,"-")
            rdExpandChildren(sID, nRow)
            break;
        case "-":
            eleClicked.src = document.getElementById("rdBranchCollapsedImage_" + sID).src
            rdDmtSetInnerText(eleStatus,"+")
            rdCollapseChildren(sID, nRow)
            break;
    }
   
    
    //Save the status in localStorage.
    if (!rdDisableRememberExpansion() && rdHasLocalStorage()) {
        var eleItemId = document.getElementById("rdExpandoItemID_" + sID + "_Row" + nRow)
        if (eleItemId) {
            localStorage["rdExpandoStatus_" + sID + "_" + rdDmtGetInnerText(eleItemId)] = rdDmtGetInnerText(eleStatus)
        }
    }
    
}

function rdExpandChildren(sID, nRow){
    //Expand all rows with same indent as clicked element's child.
    nRow += 1 
    var eleChildIndent = document.getElementById("rdIndent_" + sID + "_Row" + nRow)
    var nChildIndent = parseInt(eleChildIndent.style.width.replace("px",""))
    
    var eleRowTable = document.getElementById("rdMenuColumn_" + sID + "_Row" + nRow)
    while (eleRowTable){
        eleChildIndent = document.getElementById("rdIndent_" + sID + "_Row" + nRow)
        var nCurrIndent = parseInt(eleChildIndent.style.width.replace("px",""))
        if (nCurrIndent == nChildIndent) {
            var eleRow = eleRowTable.parentNode
            eleRow.style.display=""

            //Expand children too?
            var eleChildStatus = document.getElementById("rdExpandoStatus_" + sID + "_Row" + nRow)
            if (rdDmtGetInnerText(eleChildStatus) == "-") {
                rdExpandChildren(sID, nRow) //recursive call.
            }
            
        } else if(nCurrIndent < nChildIndent) {
            break
        }
        nRow += 1
        eleRowTable = document.getElementById("rdMenuColumn_" + sID + "_Row" + nRow)
    }
}

function rdCollapseChildren(sID, nRow){
    var eleIndent = document.getElementById("rdIndent_" + sID + "_Row" + nRow)
    var nClickIndent = parseInt(eleIndent.style.width.replace("px",""))
    
    nRow += 1
    var eleRowTable = document.getElementById("rdMenuColumn_" + sID + "_Row" + nRow)
    
    while (eleRowTable){
        eleIndent = document.getElementById("rdIndent_" + sID + "_Row" + nRow)
        var nCurrIndent = parseInt(eleIndent.style.width.replace("px",""))

        if (nCurrIndent <= nClickIndent) {
            break
        }
        
        var eleRow = eleRowTable.parentNode
        eleRow.style.display="none"
        
        nRow += 1
        eleRowTable = document.getElementById("rdMenuColumn_" + sID + "_Row" + nRow)
    }
}

function rdDmtGetInnerText(ele){
   if (ele.textContent != undefined) {
        return ele.textContent //Mozilla, Webkit
    } else {
        return ele.innerText //IE
    }
}
function rdDmtSetInnerText(ele,sValue){
   if (ele.textContent != undefined) {
        ele.textContent = sValue //Mozilla, Webkit
    } else {
        ele.innerText = sValue //IE
    }
}

function rdDisableRememberExpansion(sID) {
    var eleDisableRememberExpansion = document.getElementById("rdDisableRememberExpansion_" + sID)
    if (eleDisableRememberExpansion) {
        if (eleDisableRememberExpansion.value == "True") {
            return true
        }
    }
    return false
}
