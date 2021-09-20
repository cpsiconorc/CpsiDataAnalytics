function canAccessIFrame(iframe) {
    var html = null;
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      html = doc.body.innerHTML;
    } catch(err){}

    return(html !== null);
}

function iframeResize(o, sOptionalParam) {

    if (o) {
    if (o.src != "") {
        // Normally contentDocument is all you need, but IE7 doesn't have that property 
        if (o.contentWindow === null) //21313
            return;

        var canAccess = canAccessIFrame(o);
            
        var iframeNode = Y.one(o);
        
        if (canAccess) {
            var documentNode = Y.one(o.contentWindow.document),
                bodyNode = documentNode.one('body'),
                htmlNode = documentNode.one('html'),
                width, height, fixedWidth, fixedHeight;
        }

        //resize dashboard INSIDE iframe

        var freeForm = o.contentWindow.Y && o.contentWindow.Y.namespace('LogiXML.Dashboard.FreeForm');
        if (freeForm && Y.Lang.isFunction(freeForm.rdResizeDashboardContainer)) {
            freeForm.rdResizeDashboardContainer();
        }

        //iframe MUST have display set for the size settings to take effect
        var savedIframeDisplay = iframeNode.getStyle('display');
        iframeNode.setStyle('display', '');

        iframeNode.setStyle('overflow', 'hidden');
        if (canAccess) {

            // An onload will fire with the initial page load even though the iframes are essentially empty.
            if (bodyNode.get('scrollWidth') == 0 && bodyNode.get('scrollHeight') == 0) {
                iframeNode.setStyle('display', savedIframeDisplay);
                return;
            }

            htmlNode.setStyles({
                'margin': 0,
                'width': '100%',
                'height': '100%'
            });
            bodyNode.setStyles({
                'margin': 0,
                'width': '100%',
                'height': '100%'
            });
        }

        //19377 - Save current position on page
        var currentHeight = document.documentElement.scrollTop > document.body.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;
        var currentWidth = document.documentElement.scrollLeft > document.body.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft;

        fixedWidth = iframeNode.getAttribute('rdIFrameFixedWidth');
        fixedHeight = iframeNode.getAttribute('rdIFrameFixedHeight');
        // Convert from string boolean to real boolean
        fixedWidth = Y.Lang.isString(fixedWidth) ? (fixedWidth.toLowerCase() === 'true' ? true : false) : false;
        fixedHeight = Y.Lang.isString(fixedHeight) ? (fixedHeight.toLowerCase() === 'true' ? true : false) : false;

        // User defined Width, px or % based
        if (fixedWidth) {
            o.style.width = o.width;

            switch (iframeNode.getAttribute("Scrolling")) {
                case 'yes':
                    iframeNode.setStyles({ 'overflowX': 'visible' });
                    break;
                case 'no':
                    iframeNode.setStyles({ 'overflowX': 'hidden' });
                    break;
                default:
                    iframeNode.setStyles({ 'overflowX': 'auto' });
                    break;
            }
        }
        else {
            o.style.width = '';
            o.width = '';
            width = canAccess ? htmlNode.get('scrollWidth') : 400;
            width += 20  //Represents the scrollbar width.
            o.style.width = width + 'px';
            o.width = width + 'px';
        }

        var parentContainerHeight = 0;
        var parentContainer = iframeNode.ancestor(".popupPanelContainer");

        // User defined Height, px or % based
        if (fixedHeight) {
            o.style.height = o.height;

            // If user didn't set a fixedWidth we need to enable scroll bars, works great except for IE7
            if (!fixedWidth && htmlNode.get('scrollHeight') > htmlNode.get('offsetHeight')) {
                iframeNode.setStyles({
                    'overflowY': 'scroll',
                    'overflowX': 'hidden'
                });
                var scrollbarWidth = htmlNode.get('scrollWidth') - htmlNode.get('clientWidth') + iframeNode.get('scrollWidth');
                o.style.width = scrollbarWidth + 'px';
                o.width = scrollbarWidth + 'px';
            }
        }
        else if (canAccess) {
            //reset the iframe so that it can determine the appropriate height if the content has shrunk
            o.style.height = '1px';
            o.height = '1px';

            parentContainerHeight = parentContainer ? parentContainer._node.getBoundingClientRect().height : 0;//save panel dimensions without content

            //now get the iframe height based on the scrollable area
            height = htmlNode.get('scrollHeight');
            height += 20  //Represents the scrollbar width.

            if (bodyNode.get('scrollHeight') >= htmlNode.get('scrollHeight') && height == 21) {
                height = bodyNode.get('scrollHeight');
            }

            if ((navigator.userAgent.indexOf('Trident') > 0) && (height == 42)) {
                height = 400;
            }

			//AH-730 fix unnecessarily  scrolls for crosstab drilldowns
			o.style.height = "";
			o.height="";
			
            o.style.height = height + 'px';
            o.height = height + 'px';
        }
        else {
            //reset the iframe so that it can determine the appropriate height if the content has shrunk
            o.style.height = '1px';
            o.height = '1px';

            //now get the iframe height based on the scrollable area
            height = 400;

            o.style.height = height + 'px';
            o.height = height + 'px';
        }

        //ajust IFrame size (visualization editing popup case)
        if (savedIframeDisplay == "inline" && parentContainer && parentContainer.getStyle("position") == "fixed") {
            var newHeight = Math.min(height, window.innerHeight - parentContainerHeight);
            o.style.height = newHeight + 'px';
            o.height = newHeight + 'px';
        }

        // restore original display
        iframeNode.setStyle('display', savedIframeDisplay);

        //Return to position on page
        window.scrollTo(currentWidth, currentHeight); //19377
    }
    rdCheckForAPopupPanelParent(o)  //#12818.
    }

    // Does this frame have a parent that needs to be resized?
    try { // IE throws an error cross domain.RD20730
        if (Y.Lang.isValue(frameElement) && Y.Lang.isFunction(window.parent.iframeResize)) {
            window.parent.iframeResize(frameElement);
        }
    }
    catch (e) { }    

    //resize dashboard OUTSIDE iframe

    var freeForm = Y.namespace('LogiXML.Dashboard.FreeForm');
    if (freeForm && Y.Lang.isFunction(freeForm.rdResizeDashboardContainer)) {
        freeForm.rdResizeDashboardContainer();
    }
}

function rdCheckForAPopupPanelParent(eleHTMLIFrameElement) {
    try {
        if (!eleHTMLIFrameElement) return;
        var eleParentObj = eleHTMLIFrameElement.parentNode;
        while (eleParentObj) {
            if (Y.Lang.isValue(eleParentObj.attributes) && eleParentObj.attributes["rdPopupPanel"] && eleParentObj.attributes["rdLocation"] && eleParentObj.attributes["rdLocation"].value == "Center") {
                rdPositionPopupPanel(eleParentObj)
                return;
            } else {
                eleParentObj = eleParentObj.parentNode;
            }
        }
    }
    catch (e) { }
}
