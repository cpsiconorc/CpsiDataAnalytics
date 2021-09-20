var rdCurrPopupPanel
var rdMouseX
var rdMouseY

Y.use('dd-constrain', 'dd-plugin', 'dd-scroll', 'escape', function(Y){

    LogiXML.PopupPanel.rdShowPopupPanel = function(elePopupPanel) {
        var rdModalShade;

        if (elePopupPanel.id.match('rdCtCompTooltip_')){ //Special, no popup for 1st column. It will be empty.
            var sText
            if (elePopupPanel.textContent != undefined) {
                sText = elePopupPanel.textContent //Mozilla, Webkit
            } else {
                sText = elePopupPanel.innerText //IE
            }
            if (sText.replace(/^\s+/g, "").length==0){ //Any content?
                elePopupPanel.style.display="none"
                return
            }
        }

        if (rdCurrPopupPanel && (elePopupPanel.getAttribute("rdKeepOtherPopups") !== "True")) {
            if(elePopupPanel.id.match('PPDatePickerForInputDate') || elePopupPanel.id.match('PPTimePickerForInputTime')){   //#14344.
                if(rdCurrPopupPanel.id.match('PPDatePickerForInputDate') || rdCurrPopupPanel.id.match('PPTimePickerForInputTime')){
                    rdClosePreviousPopupPanel(elePopupPanel);
                }
            }
            if (!elePopupPanel.id.match('PPDatePickerForInputDate') && !elePopupPanel.id.match("PPTimePickerForInputTime")){
                //Only one panel at a time.
                rdClosePreviousPopupPanel(elePopupPanel);
            }
        }

        //hotfix 24678
        var bMovePanelInDashboard = true;
        if (elePopupPanel.id.match('ppColors_')) {
            bMovePanelInDashboard = false;
        }

        var eleDashboardPanel = Y.Selector.ancestor(elePopupPanel, '.rdDashboardPanel');
        if (eleDashboardPanel != null) {  //#15153, #15135.
            var eleDashboardPanelTable = document.getElementById("rdDivDashboardPanelTable")
            // Get the Dashboard Panel Table(Div) and add the Modal and the Popup Panel to the Table.
            if (eleDashboardPanelTable != null && bMovePanelInDashboard) {
                var eleModalPanel = elePopupPanel.previousSibling;
                if (eleModalPanel) {
                    if (eleModalPanel.id) {
                        if (eleModalPanel.id.indexOf(elePopupPanel.id + "_rdModalShade") > -1) {
                            eleModalPanel.parentNode.removeChild(eleModalPanel);
                            eleDashboardPanelTable.appendChild(eleModalPanel);
                        }
                    }
                }
                elePopupPanel.parentNode.removeChild(elePopupPanel)
                var elePopupPanelDuplicate = document.getElementById(elePopupPanel.id)
                while (elePopupPanelDuplicate != null) {  //#16624.
                    elePopupPanelDuplicate.parentNode.removeChild(elePopupPanelDuplicate);
                    elePopupPanelDuplicate = document.getElementById(elePopupPanel.id);
                }
                eleDashboardPanelTable.appendChild(elePopupPanel);
            }
        }
        ////Report Center/Info Go bookmark list scheduler Popup is nested in a table. Positioning a Div nested in a table is a problem.
        ////Remove this Popup and the Modal from under the table and append it under the body.
        //if (elePopupPanel.id.match('popupSchedule')) {  //#22513.
        //    if (elePopupPanel.parentNode.tagName.toLowerCase() !== 'body') {
        //        var eleBody = Y.one("body").getDOMNode();
        //        var eleModalPanel = elePopupPanel.previousSibling;
        //        if (Y.Lang.isValue(eleModalPanel)) {
        //            eleModalPanel.parentNode.removeChild(eleModalPanel);
        //            eleBody.appendChild(eleModalPanel);
        //        }
        //        elePopupPanel.parentNode.removeChild(elePopupPanel);
        //        eleBody.appendChild(elePopupPanel);
        //    }
        //}

        rdCurrPopupPanel=elePopupPanel;
        rdMouseX = rdMouse.x    // Save the Mouse co-ordinates in memory so that when the panel re-position code runs,
        rdMouseY = rdMouse.y    // we can use the same mouse position and not chase the new mouse position, #13375.
        rdPositionPopupPanel(elePopupPanel) // Set the location of the Panel.
       
        if(elePopupPanel.id.match('PPDatePickerForInputDate')){     //#10957.
            rdCurrPopupPanel.style.whiteSpace='nowrap';
        } 
           
        try{  //#11804.  
            if(!elePopupPanel.id.match('PPDatePickerForInputDate')){
                if(navigator.appName.match('Microsoft') && navigator.appVersion.match('MSIE 7.0')){ 
                    if(document.firstChild.text){
                        if(document.firstChild.text.match('DOCTYPE')){       
                            var aStyleSheets = document.styleSheets;
                            for(i=0;i<aStyleSheets.length;i++){
                                var eleStyleSheet = aStyleSheets[i];
                                if(eleStyleSheet.href.match('rdTemplate/rdPopup/rdPopupPanel.css')){
                                    eleStyleSheet.addRule(".rdPopupContent", "Height : 85%");
                                }
                            }
                        }
                    }
                }
            }
        }
        catch(e){}
        
        // Close the Popup with the Esc Key.
        Y.one('body').on('keydown', rdHandlePopupKeyDown);

        //Set focus on the popup to the first input, textarea or select list 22603 22549
        var popupChildren = Y.one(elePopupPanel).all('input, select, textarea')._nodes;
        if(popupChildren.length > 0 ){
			// 23517 - not supported in older browsers.
			try {
				popupChildren[0].focus();
				}catch(e){

				}
		}
                
        if (elePopupPanel.getAttribute("rdModal") == "True") {

            var yuiPopupPanel = Y.one(elePopupPanel);
            var dashboardPanel = yuiPopupPanel.ancestor('.rdDashboardPanel');

            if (dashboardPanel && dashboardPanel.getDOMNode()) {
                dashboardPanel.getDOMNode().setAttribute('oldOpacity', dashboardPanel.getDOMNode().style['opacity']);
                dashboardPanel.getDOMNode().style['opacity'] = null;
            }

            //Set tab index of everything to a value we can look up later, so it is not tab-able 22585
            var popupChildren = Y.one(document).all('a, BODY, button, frame, iframe, img, input, object, select, textarea, span[onclick]')._nodes;
            for (var i = 0; i < popupChildren.length; i++) {
                popupChildren[i].setAttribute('oldTabindex', popupChildren[i].tabIndex);
                popupChildren[i].tabIndex = -13579;
            }

            //Make sure that the popup children ARE tab-able 22585
            popupChildren = Y.one(elePopupPanel).all('a, BODY, button, frame, iframe, img, input, object, select, textarea, span[onclick]')._nodes;
            for (var i = 0; i < popupChildren.length; i++) {
                popupChildren[i].tabIndex = 0;
            }

            rdPutAShimOnTopOfObjects();
            rdModalShade = rdGetModalShade(elePopupPanel);
            if (rdModalShade) {
                rdPopupModalWindowResize()
                if (location.href.indexOf("rdFade")==-1){
                    rdSetPanelOpacity(rdModalShade,.5)
                } else {
                    rdFadePanel(rdModalShade,0,.5,125)
                }
                rdModalShade.style.display = '';
                
                // Adjust the shading when there's a resize or scroll.
                if (window.attachEvent) { //IE
                    window.attachEvent("onresize", rdPopupModalWindowResize);
                    window.attachEvent("onscroll", rdPopupModalWindowResize);
                    //rdModalShade.attachEvent("onkeypress", rdHandlePopupKeyDown);
                } else { //Mozilla                
                    window.addEventListener("resize", rdPopupModalWindowResize, false);
                    window.addEventListener("scroll", rdPopupModalWindowResize, false);  
                    //rdModalShade.onkeydown = rdHandlePopupKeyDown;      
                }
            }
            //set modal shade zIndex to be on top of the most top popup panel
            var otherPopups = Y.one(document).all(".popupPanelContainer")._nodes;
            var maxZIndex = -1;
            for (var i = 0; i < otherPopups.length; i++) {
                if ((window.getComputedStyle(otherPopups[i]).display !== "none") && (otherPopups[i].id !== elePopupPanel.id) && (parseInt(window.getComputedStyle(otherPopups[i]).zIndex) > maxZIndex)) {
                    maxZIndex = parseInt(window.getComputedStyle(otherPopups[i]).zIndex);
                }
            }
            if (maxZIndex > -1) {
                if (rdModalShade) {
                    rdModalShade.style.zIndex = maxZIndex + 1;
                }
                elePopupPanel.style.zIndex = maxZIndex + 2;
            }
        }
        
        if (location.href.indexOf("rdFade")!=-1){
            rdFadePanel(rdCurrPopupPanel,0,1,250)
        }
        if (location.href.indexOf("rdExpand")!=-1){
            rdExpandPanel(rdCurrPopupPanel,250)
        }
        
        if (elePopupPanel.getAttribute("rdDraggable")=="True") {
            var sTitleBarId = '';
            if (typeof Y.Escape != 'undefined' && typeof Y.Escape.regex != 'undefined') {
                sTitleBarId = Y.Escape.regex("rdPopupPanelTitle_" + elePopupPanel.id);  //#16474.               
            }else{
                sTitleBarId = "rdPopupPanelTitle_" + elePopupPanel.id;  //#16474.
        }
		    var node = Y.one(elePopupPanel);
		    
		    if(!node.hasClass('yui3-dd-draggable')) {
		        var drag = node.plug(Y.Plugin.Drag);
			
		        //Attach drag-drop events
		        drag.dd.on('drag:start', function(e) {
			        var pnlDragged = this.get('dragNode');
			        pnlDragged.setStyles({								
				        opacity: .75
			        });				
		        });
		        drag.dd.on('drag:end', function(e) {
			        //endDrag occurs after DragDrop
			        var pnlDragged = this.get('dragNode');
			        //pnlDragged.style.cursor = "auto";
			        pnlDragged.setStyles({
				        opacity: 1					
			        });
			        rdMouseX = elePopupPanel.style.posLeft; //#15457.
			        rdMouseY = elePopupPanel.style.posTop;				
		        });
    			
                if (rdModalShade) {
                    drag.dd.plug(Y.Plugin.DDConstrained, {
                        constrain2node: rdModalShade
                    });
                } else {
                    drag.dd.plug(Y.Plugin.DDConstrained, {
                        constrain2node: Y.one(document.body)
                    });
                }


		        //Now you can only drag it from the panel title
		        var hndNode = Y.one('#' + sTitleBarId);
		        if (Y.Lang.isNull(hndNode)) {
		            hndNode = Y.one('#rdPopupPanelTitle_' + elePopupPanel.id);  //#21193.
		        }
		        node.dd.addHandle('#' + sTitleBarId ).plug(Y.Plugin.DDWinScroll);						
		        hndNode.setStyle('cursor', 'move');	
		    }  
		        		
        }
        rdPutAShimBelowPopupPanel(elePopupPanel);
        //if we are under responsive column
        var rdYUIPopuppanel = Y.one(elePopupPanel);
        var ancestorRespColumn = rdYUIPopuppanel.ancestor('.rdResponsiveColumn');
        if (ancestorRespColumn != undefined) {
            if (ancestorRespColumn.ancestor('.rd-gridsystem-scrollbar-horizontalScrollbar') == undefined)
                return;
            ancestorRespColumn.setStyle('overflow-x', 'visible');
        }    
    }
});

function rdClosePreviousPopupPanel(elePopupPanel){

    //Don't close the parent if it's another popup. 15075
    var eleParent = elePopupPanel.parentNode;
    while(eleParent != null){                        
        if(eleParent.getAttribute){
            if(eleParent.getAttribute("rdPopupPanel")=="True"){
                return
            }
        }
        eleParent = eleParent.parentNode;
    }

    //If this popup is under another, don't close the parent.
    var eleParent = elePopupPanel.parentNode;
    while(eleParent != null){ 
        if(eleParent.getAttribute){
            if(eleParent.getAttribute("rdPopupPanel")=="True"){
                return
            }
        }
        eleParent = eleParent.parentNode;
    }
   
    //Hide the other panel.
    var rdModalShade = rdGetModalShade(rdCurrPopupPanel);
    if (rdCurrPopupPanel!= elePopupPanel) {
        rdCurrPopupPanel.style.display="none"
        if (rdModalShade) {
            rdModalShade.style.display="none"
        }
    }
}

function rdPositionPopupPanel(elePopupPanel){

    var nLeft=0
    var nTop=0
    var sLocation = elePopupPanel.getAttribute("rdLocation")
    var nScrollLeft = (document.body.scrollLeft == 0 ? document.documentElement.scrollLeft : document.body.scrollLeft);
    var nScrollTop = (document.body.scrollTop == 0 ? document.documentElement.scrollTop : document.body.scrollTop);

    var nClientWidth = (document.body.clientWidth < document.documentElement.offsetWidth ? document.documentElement.offsetWidth : document.body.clientWidth)
    var nClientHeight = (document.body.clientHeight < document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight)

    var nParentOffsetLeft = rdFindPosX(elePopupPanel.offsetParent);
    var nParentOffsetTop = rdFindPosY(elePopupPanel.offsetParent);

    switch (sLocation.toLowerCase()) {
        case 'center':
            nLeft = (nClientWidth / 2) - (elePopupPanel.offsetWidth / 2) + nScrollLeft
            if (window.LogiXML.isRdEmbedded && elePopupPanel.getAttribute("rdModal") == "True") {
                nTop = 100;
                elePopupPanel.style.position = "fixed";
            } else {
                if (navigator.appName.indexOf("Microsoft Internet") == -1) {  //Mozilla.
                    if (!document.doctype) {  // Without DocType
                        nTop = (document.body.clientHeight / 2) - (elePopupPanel.offsetHeight / 2) + nScrollTop
                    } else {
                        nTop = (document.documentElement.clientHeight / 2) - (elePopupPanel.offsetHeight / 2) + nScrollTop
                    }
                } else {  //IE.
                    nTop = (document.documentElement.offsetHeight / 2) - (elePopupPanel.offsetHeight / 2) + nScrollTop
                }
            }
            break;
        case 'mouse':
            nLeft = rdMouseX - nParentOffsetLeft;
            nTop = rdMouseY - nParentOffsetTop;
            nClientWidth = nClientWidth - nParentOffsetLeft;
            nClientHeight = nClientHeight - nParentOffsetTop;
            var regionPopupPanel = Y.DOM.region(elePopupPanel);
            var regionViewport = Y.DOM.viewportRegion();

            //Don't position off the screen.
            if (typeof (rdMobileReport) != 'undefined' && navigator.appName.indexOf("Microsoft Internet") == -1) {   // Mobile devices.
                // Cannot run this code path for Mobile in studio as the browser is IE at this time.
                if ((nTop + elePopupPanel.offsetHeight) >= (window.scrollY + window.innerHeight)) {
                    nTop = nTop - elePopupPanel.offsetHeight;
                }
                if ((nLeft + elePopupPanel.offsetWidth) >= (window.scrollX + window.innerWidth)) {
                    nLeft = nLeft - elePopupPanel.offsetWidth;
                }
            }
            else {
                if ((nParentOffsetTop + nTop + regionPopupPanel.height + 10) > regionViewport.bottom) {
                    nTop = regionViewport.bottom - regionPopupPanel.height - nParentOffsetTop - 10;
                    if ((nParentOffsetTop + nTop) < regionViewport.top) {
                        nTop = regionViewport.top - nParentOffsetTop;
                    }
                }
                else
                    nTop += 4;

                if ((nParentOffsetLeft + nLeft + regionPopupPanel.width + 10) > regionViewport.right) {
                    nLeft = regionViewport.right - regionPopupPanel.width - nParentOffsetLeft - 10;
                }
                else
                    nLeft += 4;
            }

            if ((nLeft + nParentOffsetLeft) < 0)
                nLeft = nParentOffsetLeft * -1.0;

            if ((nTop + nParentOffsetTop) < 0)
                nTop = nParentOffsetLeft * -1.0;

            break;
        default:  
            var sPos = sLocation.split(",")
            if (sPos.length == 2) {
                switch(sPos[0].toLowerCase()){

                    case 'left':
                         if (typeof window.pageYOffset != 'undefined') {
                            //For mobile:
                            nLeft = window.pageXOffset
                        }else{
                            nLeft = nScrollLeft
                        }
                        nLeft = nLeft + 4
                        break
                    case 'right':
                        if (elePopupPanel.getAttribute("rdOrigWidth")==null) {
                            elePopupPanel.setAttribute("rdOrigWidth",elePopupPanel.offsetWidth)
                        }
                            elePopupPanel.style.width = elePopupPanel.getAttribute("rdOrigWidth") + 'px'
                         if (typeof window.pageYOffset != 'undefined') {
                            //For mobile:
                            nLeft = window.pageXOffset + window.innerWidth - elePopupPanel.getAttribute("rdOrigWidth")
                        }else{
                            nLeft = nClientWidth - elePopupPanel.offsetWidth - nScrollLeft
                        }
                        nLeft = nLeft - 4
                        break                    
                    case 'center':
                        if(navigator.appName.indexOf("Microsoft Internet") == -1){  //Mozilla.
                            if(!document.doctype){  // Without DocType
                                nLeft = (document.body.clientWidth / 2) - (elePopupPanel.offsetWidth / 2) + nScrollLeft
                            }else{ 
                                nLeft = (document.documentElement.clientWidth / 2) - (elePopupPanel.offsetWidth / 2) + nScrollLeft
                            }
                        }else{  //IE.
                            nLeft = (document.documentElement.offsetWidth / 2) - (elePopupPanel.offsetWidth / 2) + nScrollLeft
                        }
                        break
                    default:
                        nLeft = parseInt(sPos[0]); 
                        if(isNaN(nLeft)){nLeft = 0 + nScrollLeft};
                        break
                }
                switch(sPos[1].toLowerCase()){
                    case 'top':
                        if (typeof window.pageYOffset != 'undefined') {
                           //For mobile:
                            nTop = window.pageYOffset
                        }else{
                            nTop = nScrollTop
                        }
                        nTop = nTop + 4
                        break
                    case 'bottom':
                        if (typeof window.pageYOffset != 'undefined') {
                           //For mobile:
                            elePopupPanel.height = elePopupPanel.offsetHeight + 'px' //Fix the height in the style.
                            nTop = (window.pageYOffset + window.innerHeight - elePopupPanel.offsetHeight) 
                        }else{
                            nTop = (document.documentElement.clientHeight - elePopupPanel.offsetHeight + nScrollTop)
                        }
                        nTop = nTop - 4
                        break
                    case 'center':
                        if(navigator.appName.indexOf("Microsoft Internet") == -1){  //Mozilla.
                            if(!document.doctype){  // Without DocType
                                nTop = (document.body.clientHeight / 2) - (elePopupPanel.offsetHeight / 2) + nScrollTop
                            }else{ 
                                nTop = (document.documentElement.clientHeight / 2) - (elePopupPanel.offsetHeight / 2) + nScrollTop
                            }
                        }else{  //IE.
                            nTop = (document.documentElement.offsetHeight / 2) - (elePopupPanel.offsetHeight / 2) + nScrollTop
                        }
                        break
                    default:
                        nTop = parseInt(sPos[1]); 
                        if(isNaN(nTop)){nTop = 0 + nScrollTop};
                        break
                }
            }
            break
    }
    
    if (document.getElementById('rdFreeformLayout')){
        //RD21229 - position needs to be 'fixed' for RA popup panels.
        if (document.getElementById('rdFreeformLayout').parentElement.id == 'colReportAuthorWorkingArea') {
            elePopupPanel.style.position = 'fixed';
            nLeft = nLeft - nScrollLeft;
            nTop = nTop - nScrollTop;
        }
        if(rdGetModalShade(elePopupPanel) != null)  //#15131.
            rdGetModalShade(elePopupPanel).style.position = 'fixed';
    }

    if ((nParentOffsetTop + nTop) <= 0)
        nTop = nParentOffsetTop * -1.0;

    if ((nParentOffsetLeft + nLeft) <= 0)
        nLeft = nParentOffsetLeft * -1.0;

    elePopupPanel.style.left = nLeft + "px";
    elePopupPanel.style.top = nTop + "px";   
}

function rdHidePopupPanelAndModalShade(elePanelElement) {
    var rdModalShade = rdGetModalShade(elePanelElement);

    elePanelElement.style.display = 'none';
    if (rdModalShade) {
        //22585
        var yuiPopupPanel = Y.one(elePanelElement);
        var dashboardPanel = yuiPopupPanel.ancestor('.rdDashboardPanel');

        if (dashboardPanel && dashboardPanel.getDOMNode()) {
            dashboardPanel.getDOMNode().style['opacity'] = dashboardPanel.getDOMNode().getAttribute('oldOpacity');
        }

        var popupChildren = Y.one(document).all('*[tabindex=-13579]')._nodes;
        for (var i = 0; i < popupChildren.length; i++) {
            if (popupChildren[i].getAttribute('oldTabindex') !== '') {
                popupChildren[i].tabIndex = popupChildren[i].getAttribute('oldTabindex');
            } else {
                popupChildren[i].tabIndex = 0;
            }
        }

        var hideShade = function () {
            this.style.display = "none";
        }.bind(rdModalShade);
        setTimeout(hideShade, 1);
    }
    rdRemoveTheShim();

    //if we are under responsive column
    var rdYUIPopuppanel = Y.one(elePanelElement);
    var ancestorRespColumn = rdYUIPopuppanel.ancestor('.rdResponsiveColumn');
    if (ancestorRespColumn != undefined) {
        if (ancestorRespColumn.ancestor('.rd-gridsystem-scrollbar-horizontalScrollbar') == undefined)
            return;
        ancestorRespColumn.setStyle('overflow-x', 'auto');
    }
}

function rdHandlePopupKeyDown(e){
    if(e && e.keyCode == 27){
        rdHidePopupPanelAndModalShade(rdCurrPopupPanel);
        if (rdCurrPopupPanel.id.indexOf('ppChangeDashboard') > -1 || rdCurrPopupPanel.id.indexOf('ppEditBookmarks_actionEditBookmark') > -1
            || rdCurrPopupPanel.id.indexOf('ppTableCustomization') > -1) {

            if (LogiXML && LogiXML.Dashboard && LogiXML.Dashboard.pageDashboard)
                LogiXML.Dashboard.pageDashboard.rdShowAddDashboardPanels();
            else {
                var repAuth = Y.one('.rdReportAuthor');
                if (repAuth) {
                    repAuth = repAuth.getData('rdReportAuthor');
                    if (repAuth)
                        repAuth.showAddPanels();
                }
            }
        }
        Y.one('body').detach('keydown', rdHandlePopupKeyDown); 
    } else if (e && e.keyCode == 13) {  //NGP-5997 prevent showing of Visualization Settings when rename or add new panels to dashboard
        if (rdCurrPopupPanel.id.indexOf('ppChangeDashboard') > -1 || rdCurrPopupPanel.id.indexOf('ppEditBookmarks_actionEditBookmark') > -1
            || rdCurrPopupPanel.id.indexOf('ppAddBookmarks_') > -1) { //24446, prevent submitting form and page reload after hit enter
			e.preventDefault();
		}
	}
}

function rdGetModalShade(elePanelElement){
    var rdModalShade;
    try {
        if (elePanelElement.previousSibling) {
            //14909,19075
            if (elePanelElement.previousSibling.id.indexOf("_rdModalShade") > 0) {
                rdModalShade = elePanelElement.previousSibling
            }
        }
    }
    catch (e) { }
    try {
        var xsltShade = Y.one(elePanelElement).ancestor().previous('.popupPanelModal');//if caller is wrapped
        if (!rdModalShade && xsltShade) {
            rdModalShade = xsltShade.getDOMNode();
        }
    }
    catch (e) { }
    if (!rdModalShade) {
        rdModalShade = document.getElementById(elePanelElement.id + "_rdModalShade")
    }
    return rdModalShade;
}

function rdPopupModalWindowResize(e){
    var rdModalShade = rdGetModalShade(rdCurrPopupPanel); 
    if (rdModalShade) {            
        var cWidth = document.documentElement.clientWidth;
        if (cWidth == 0) {
        cWidth = document.body.clientWidth
        }
        var cHeight = document.documentElement.clientHeight;
        if (cHeight == 0) {
        cHeight = document.body.clientHeight
        }
        if (cWidth > document.body.scrollWidth) { //'11149.
	        rdModalShade.style.width=cWidth + 'px'
	    } else {
	        rdModalShade.style.width=document.body.scrollWidth + 'px'
	    }
        if (cHeight > document.body.scrollHeight) {
	        rdModalShade.style.height=cHeight + 'px'
	    } else {
	        rdModalShade.style.height=document.body.scrollHeight + 'px'
	    }
    }
}

function rdFadePanel(ele, nOpNext, nOpLast, nDuration, nOpIncrement) {
    if (nOpNext > nOpLast) {
        nOpNext = nOpLast
    }

    rdSetPanelOpacity(ele, nOpNext)
    
    var nFrameRate = 50
    if(!nOpIncrement){
        nOpIncrement = (nOpLast - nOpNext) / (nDuration / nFrameRate) 
    }
    
    nOpNext = nOpNext + nOpIncrement
        
    if (nOpNext <= nOpLast) {
        setTimeout(function(){rdFadePanel(ele, nOpNext, nOpLast, nDuration, nOpIncrement)},nFrameRate)
    }

}

function rdSetPanelOpacity(ele, alpha) {
	var yuiNode = Y.one( ele );
	yuiNode.setStyle('opacity', alpha);
}

function rdExpandPanel(ele, nDuration, nLoopCnt, nLoopCurr, nLastHeight) {
    var nFrameRate = 50
    if(!nLoopCurr){
        nLoopCurr = 0
        nLoopCnt = Math.round(nDuration / nFrameRate)
        nLastHeight = ele.offsetHeight
    }
    nLoopCurr++
    ele.style.height = nLastHeight / nLoopCnt * nLoopCurr + "px"
    
    eleTable = ele.firstChild
    eleTable.style.position = 'absolute'
    eleTable.style.height = ele.style.height
    
    if (nLoopCurr < nLoopCnt) {
        setTimeout(function(){rdExpandPanel(ele, nDuration, nLoopCnt, nLoopCurr, nLastHeight)},nFrameRate)
    } else {
        ele.style.height = nLastHeight + "px"
        eleTable.style.height = ele.style.height
        eleTable.style.position = ''
    }

}

function rdRepositionPopupPanel(elePopupPanel, nPanelHeight, nPanelWidth, nParamLoop){
    if (nParamLoop > 100){ //25 seconds total maximum
        return;
    }
    if((elePopupPanel.offsetWidth > nPanelWidth) || (elePopupPanel.offsetHeight > nPanelHeight)){
        rdPositionPopupPanel(elePopupPanel);
        nPanelHeight = elePopupPanel.offsetHeight;
        nPanelWidth = elePopupPanel.offsetWidth;
    }
    var nLoop = parseInt(nParamLoop) + 1
    setTimeout(function(){rdRepositionPopupPanel(elePopupPanel, nPanelHeight, nPanelWidth, nLoop)}, 250);
}

function rdRemoveTheShim(){

    var aPopupShim = Y.Selector.query('iframe#rdiFrameShim', document);
    if(aPopupShim.length > 0){
        for(i=0;i<aPopupShim.length;i++){
            var eleShim = aPopupShim[i];
            eleShim.parentNode.removeChild(eleShim);
        }
    }    
}
    
function rdPutAShimOnTopOfObjects(aObjects){
    // Function is only ran for a Modal Popup Panel when there are any Applets/Objects on the Page.    
	var aObjects = Y.Selector.query('OBJECT, APPLET, EMBED', document);
	for(var i=0; i<aObjects.length; i++){
		var eleObject = aObjects[i];
		// #16698 Don't shim the object if it's not visible - shim is a white box on old IE versions.
		var objNode = Y.one(eleObject);
		if (objNode.get('visible')){
		    var eleShim = document.createElement('iframe');
		    eleShim.id='rdiFrameShim';
		    eleShim.style.position='absolute';
		    eleShim.style.width = (parseInt(eleObject.width) + 4) + 'px';
		    eleShim.style.height = (parseInt(eleObject.height) + 4) + 'px';
		    eleShim.style.left = (parseInt(rdFindPosX(eleObject))-2) + 'px';
		    eleShim.style.top = (parseInt(rdFindPosY(eleObject))-2) + 'px';
		    eleShim.style.zIndex = '99';
		    if(navigator.userAgent.match('Firefox'))
			    eleShim.style.backgroundColor = '#E5E4E4';
		    eleShim.setAttribute('frameborder','0');
		    document.body.appendChild(eleShim); 
		}
	}    
}

function rdPutAShimBelowPopupPanel(elePopupPanel){
    // function puts an iFrame below the Popup Panel with the an ID specific to the Popup Panel, #13012.
    var aObjects = Y.Selector.query('OBJECT, APPLET, EMBED', document)
    if(aObjects.length == 0) return;
    for(i=0;i<aObjects.length;i++){
        var eleObject = aObjects[i]
        var nodeObject = Y.one(eleObject);
        var nodePopupPanel = Y.one(elePopupPanel);
        if(nodeObject.intersect(nodePopupPanel) != null)
            return;
        else
            break;            
    }
    
    var eleShim = document.getElementById('rdiFrameShim_' + elePopupPanel.id);
    if(eleShim == null){
        var eleShim = document.createElement('iframe');
        eleShim.id='rdiFrameShim_' + elePopupPanel.id;
        elePopupPanel.parentNode.appendChild(eleShim); 
    }
    eleShim.style.position='fixed';
    eleShim.style.width = (parseInt(elePopupPanel.offsetWidth) + 1) + 'px';
    eleShim.style.height = (parseInt(elePopupPanel.offsetHeight) + 1) + 'px';
    if(navigator.userAgent.indexOf("MSIE 7.0") > -1){
        if(elePopupPanel.offsetHeight < elePopupPanel.firstChild.offsetHeight)
            eleShim.style.height = (parseInt(elePopupPanel.firstChild.offsetHeight) + 1) + 'px';
    }                
    eleShim.style.left = (elePopupPanel.offsetLeft -2) + 'px';
    eleShim.style.top = (elePopupPanel.offsetTop -2) + 'px';
    eleShim.style.zIndex = '99';
    if(navigator.userAgent.match('Firefox'))
        eleShim.style.backgroundColor = '#E5E4E4';
    eleShim.setAttribute('frameborder','0');    
   
}

Y.use('event-base', function (Y) {
    // rdMouse.js code moved in to this file.
    window.rdMouse = new Object();
    rdMouse.x = 0;
    rdMouse.y = 0;
    rdMouse.currentTarget = null;
    Y.on('domready', function () {
        Y.one('body').on('mousemove', function (ev) {
            rdMouse.x = ev.pageX;
            rdMouse.y = ev.pageY;
            rdMouse.currentTarget = ev.currentTarget;
        });
    });
});