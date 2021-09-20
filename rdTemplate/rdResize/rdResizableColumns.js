YUI.add('resizable-columns', function (Y) {
    
    var ResizableColumns = Y.namespace('LogiXML.ResizableColumns');

    ResizableColumns.initialize = function () {
        //Initilize Resizable columns
        ResizableColumns.rdInitResizableColumns();

        //Wire up for re-init after refreshelement
        LogiXML.Ajax.AjaxTarget().on('reinitialize', this.rdInitResizableColumns);
    };

    ResizableColumns.plug = function(j, headers) {
      
            var header = Y.one(headers[j]);

            //Get the resize handle
            var node = Y.one(header.one('td.rdResizeHeaderRow'));

            var yFail = null;
        
            if (!Y.Lang.isValue(node)) {
                var yuiFail = header._node.getElementsByClassName("rdResizeHeaderRow");
                for (var i = 0; i < yuiFail.length; i++) {
                    yFail = yuiFail[i];
                    if (yFail.tagName.toLowerCase() === "td") {
                        node = Y.one(yFail);
                        break;
                    }
                }
            }

            if (Y.Lang.isValue(node)) {

                var headerHTML = header._stateProxy.outerHTML;

                if (Y.Lang.isValue(header.getDOMNode().style.width) && header.getDOMNode().style.width != "" && parseInt(header.getStyle('width'), 10) > 0) {
                    //19263
                    if (headerHTML.indexOf("rdcondelement") > 0 && header.getAttribute('conditionalProcessed') == "") {
                        header.setAttribute('conditionalProcessed', 'true');
                    }
                } else if (parseInt(header.getStyle('width'), 10) > 0) {
                    //19263
                    if (headerHTML.indexOf("rdcondelement") > 0) {
                        header.setAttribute('conditionalProcessed', 'true');
                        header.getDOMNode().style.width = (header.get('offsetWidth') + 4) + 'px';
                    } else
                        header.getDOMNode().style.width = (header.get('offsetWidth') - 8) + 'px';
                } else { //19600 20413
                    header.getDOMNode().style.width = '100px';
                }

                //Only show handle when inside the cell. For touch always show.
                if (LogiXML.features['touch']) {
                    LogiXML.getElementByIdEnding(node, "-ResizeHandle", "img").setStyle('visibility', 'visible');
                } else {
                    var th = LogiXML.getAncestorByTagName(node, "TH", true);
                    th.on('mouseover', function(e) {
                        LogiXML.getElementByIdEnding(e.currentTarget, "-ResizeHandle", "img").setStyle('visibility', 'visible');
                    });
                    th.on('mouseout', function(e) {
                        LogiXML.getElementByIdEnding(e.currentTarget, "-ResizeHandle", "img").setStyle('visibility', 'hidden');
                    });
                }

                //In case of AJAX refresh, we don't want to create an extra drag node
                if (!Y.Lang.isValue(node.dd)) {
                    //Plug drag node to allow us to drag resize handle
                    node.plug(Y.Plugin.Drag);
                    var dd = node.dd;
                    //Plug proxy node to maintain position of resize handle
                    dd.plug(Y.Plugin.DDProxy, {
                        positionProxy: true,
                        resizeFrame: false,
                        moveOnEnd: false
                    });

                    var hndNode = LogiXML.getElementByIdEnding(node, "-ResizeHandle", "img");
                    if (!LogiXML.features['touch'])
                        hndNode.setStyle('visibility', 'hidden');

                    dd.addHandle('#' + LogiXML.escapeSelector(hndNode.get('id'))).plug(Y.Plugin.DDWinScroll, { vertical: false, scrollDelay: 5 });;
                    hndNode.setStyle('cursor', 'col-resize');

                    LogiXML.fixYuiTest(hndNode);

                    dd.on('drag:start', ResizableColumns._onResizeStart);
                    //This event occurs on all drag events, needed to make sure that we don't make the column too small or go in the wrong direction
                    dd.on('drag:drag', ResizableColumns._onResize, node);
                    dd.on('drag:end', ResizableColumns._onResizeEnd, node);
                }
            }
    };

    ResizableColumns.rdFixTableWidth = function (tableDOM) {
        if (!tableDOM)
            return;

        var tableNode = Y.one(tableDOM);
        tableDOM = tableNode.getDOMNode();

        var tableWidth = 0;
        var iCellSpacing = 0;

        iCellSpacing = parseInt(tableDOM.cellSpacing, 10);
        if (!iCellSpacing || isNaN(iCellSpacing))
            iCellSpacing = 0;

        var i = -1;
        var handlesAreVisible = LogiXML.features["touch"];
        //19277
        tableNode.all('TH').each(function (thNode) {
            i++;

            thDOM = thNode.getDOMNode();

            ResizableColumns._enforceMinimumWidth(thNode);

            if (!handlesAreVisible) {
                var moreWidth = iCellSpacing; // add the space between this cell and the right edge of the table, or the right edge of the next cell

                if (tableWidth == 0)
                    moreWidth += iCellSpacing; // first cell, add the space between this cell and the left edge of the table

                var compStyle = window.getComputedStyle(thDOM, null);
                var border = 0;
                if (compStyle) {
                    // border is not included in clientWidth
                    var iAdd = parseInt(compStyle.getPropertyValue('border-left-width'), 10);
                    if (iAdd && !isNaN(iAdd))
                        border += iAdd;

                    iAdd = parseInt(compStyle.getPropertyValue('border-right-width'), 10);
                    if (iAdd && !isNaN(iAdd))
                        border += iAdd;
                }

                //20275 22405 22495
                var draggable = thNode.hasClass('yui3-dd-draggable');
                if (!draggable && !(Y.LogiXML && (Y.LogiXML.ReportAuthor || Y.LogiXML.Dashboard)))
                    draggable = (thDOM.getElementsByClassName("yui3-dd-draggable").length > 0);

                if (draggable && !thNode.ancestor().hasClass('rdAgHeaderRow') && thDOM.getAttribute("id").indexOf("-TH") > -1) {
                    var colWidth = thDOM.clientWidth; // includes padding

                    // include border
                    colWidth += border;

                    // include right cell space
                    colWidth += iCellSpacing

                    // include left cell space for first column only
                    if (i == 0)
                        colWidth += iCellSpacing;

                    tableWidth += colWidth;
                }
            }
        });

        //Set table style to fixed so that table will leave viewport if necessary
        if (typeof tableWidth === 'number' && !isNaN(tableWidth) && tableWidth != 0) { //21231
            if (handlesAreVisible)
                tableDOM.style.width = tableWidth - 40 + 'px';
            else
                tableDOM.style.width = '1px'; // so the table width won't compete with the specified column widths when dragging.

            //23183 24337
            tableDOM.style.tableLayout = "fixed";
        }
    };

    ResizableColumns.rdInitResizableColumns = function () {
        var htmlTables = Y.all('table[rdResizableColumnsID]');
        var tablesSize = htmlTables.size();
        for (var i = 0; i < tablesSize; i++) {
            var tableDOM = htmlTables.item(i).getDOMNode();

            if (!tableDOM.tHead)
                tableDOM.tHead = tableDOM.getElementsByTagName("THEAD")[0];

            var headers = tableDOM.tHead.rows[0].cells;
            for (var j = 0; j < headers.length; j++) {
                ResizableColumns.plug(j, headers);
            }

            ResizableColumns.rdFixTableWidth(tableDOM);
        }
    };

    ResizableColumns.getWidths = function () {
        var htmlTables = Y.all("table[rdResizableColumnsID]");
        var tableSize = htmlTables.size();
        var table, headers, header;
        var widths = {};

        for (var i = 0; i < tableSize; i++) {
            table = htmlTables.item(i).getDOMNode();

            if (table.tHead == null)
                table.tHead = table.getElementById("thead")[0];

            headers = table.tHead.rows[0].cells;

            for (var j = 0; j < headers.length; j++) {
                header = headers[j];

                if (header && header.id && header.style && header.style.width)
                    widths[header.id] = header.style.width;
            }
        }

        return widths;
    };

    /* -----Events----- */

    ResizableColumns._onResizeStart = function (e) {

        var drag = e.target;
        var dragNode = drag.get('dragNode');
        var node = drag.get('node');

        //Make sure node and source table exist
        if (!node) {
            e.halt();
            return;
        }  

        var sourceTableNode = LogiXML.getAncestorByTagName(node, 'table', false);
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        //Set style of dragnode --  column resize cursor as the mouse and make sure nothing else is visible
        dragNode.setStyles({
            opacity: '.00',
            borderLeft: '0px solid',
            borderTop: '0px',
            borderBottom: '0px',
            cursor: 'col-resize',
            backgroundColor: 'transparent'
        });
    };

    ResizableColumns._enforceMinimumWidth = function (thNode) {
        if (!thNode)
            return;

        // Ensure width is not too small to display the content
        var innerTable = thNode.one('table');
        var visibleWidth = thNode.get('clientWidth'); // clientWidth = visible width of content + padding

        // subtract padding
        var thDOM = thNode.getDOMNode();
        var compStyle = window.getComputedStyle(thDOM, null);
        var padding = 0;
        var border = 0;
        var boxSizing = ""; // If you set box-sizing: border-box; on an element, padding and border are included in the width and height:

        if (compStyle) {
            boxSizing = compStyle.getPropertyValue("box-sizing");

            var iPadding = parseInt(compStyle.getPropertyValue("border-left-width"), 10);
            if (iPadding && !isNaN(iPadding))
                border += iPadding;

            iPadding = parseInt(compStyle.getPropertyValue("border-right-width"), 10);
            if (iPadding && !isNaN(iPadding))
                border += iPadding;

            iPadding = parseInt(compStyle.getPropertyValue("padding-left"), 10);
            if (iPadding && !isNaN(iPadding))
                padding += iPadding;

            iPadding = parseInt(compStyle.getPropertyValue("padding-right"), 10);
            if (iPadding && !isNaN(iPadding))
                padding += iPadding;
        }

        visibleWidth -= padding;

        var hiddenWidth = 0;

        if (innerTable) {
            var tableScroll = innerTable.get('scrollWidth'); // width needed
            if (tableScroll > visibleWidth)
                hiddenWidth = tableScroll - visibleWidth; // width of hidden portion
        }

        var minWidth;
        
        if (boxSizing == "border-box") {
            // including padding and border in width specification
            minWidth = visibleWidth + hiddenWidth + padding + border;
        } else {
            minWidth = visibleWidth + hiddenWidth;
        }

        thNode.setStyle('width', minWidth + "px");
    };

    ResizableColumns._onResize = function (e) {

        var drag = e.target;
        var dragNode = drag.get('dragNode');
        var dragTable = dragNode.one('table');
        var tdNode = drag.get('node');
        var node = LogiXML.getAncestorByTagName(tdNode, "TH", true);

        //node.setStyle("borderRight", "3px solid gray");

        //20 px is the minimum
        if (drag.mouseXY[0] <= (node.getX() + 20) ) {
            e.halt();
            return;
        }

        var originalWidth = node.get('offsetWidth');
        var finishPoint = node.getX() + node.get('clientWidth');
        var resizeDifference = drag.mouseXY[0] - finishPoint;
        var widthDifference = originalWidth + resizeDifference ; // current width + the difference of the resize + 4 for padding of the td

        var sourceTableNode = LogiXML.getAncestorByTagName(node, 'table', true);
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        //Set node width
        node.setStyle('width', widthDifference + "px");

        //Adjust width if we made it to small
        ResizableColumns._enforceMinimumWidth(node);

        var sourceTableDOM = sourceTableNode.getDOMNode();
        ResizableColumns.rdFixTableWidth(sourceTableDOM);
    };

    ResizableColumns._onResizeEnd = function (e) {

        var drag = e.target;
        var dragNode = drag.get('dragNode');
        var tdNode = drag.get('node');
        var thNode = LogiXML.getAncestorByTagName(tdNode, "TH", true);

        var originalWidth = thNode.get('offsetWidth');
        var finishPoint = thNode.getX() + thNode.get('offsetWidth');
        var resizeDifference = drag.mouseXY[0] - finishPoint;
        var widthDifference = originalWidth + resizeDifference;

        var sourceTableNode = LogiXML.getAncestorByTagName(thNode, 'table', true);
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        //Set node width
        thNode.setStyle('width', widthDifference + "px");

        //Adjust width if we made it too small
        ResizableColumns._enforceMinimumWidth(thNode);

        //Set table style and width
        var sourceTableDOM = sourceTableNode.getDOMNode();
        ResizableColumns.rdFixTableWidth(sourceTableDOM);

        //Build AJAX post string
        var sResize = "";

        var headers = sourceTableDOM.tHead.rows[0].cells;
        var header, headerNode;
        for (var j = 0; j < headers.length; j++) {
            header = headers[j];
            headerNode = Y.one(header);
            var sResizeColId = sourceTableDOM.tHead.rows[0].cells[j].id.replace("-TH", "");
            if (Y.Lang.isValue(headerNode.getAttribute('rdctcolnr')) && parseInt(headerNode.getAttribute('rdctcolnr'),10) >= 0)
                sResize += "," + sResizeColId + "_rdctcolnr" + ":" + parseInt(headerNode.getDOMNode().style.width, 10) + "_" + headerNode.getAttribute('rdctcolnr');
            else
                sResize += "," + sResizeColId + ":" + parseInt(headerNode.getDOMNode().style.width,10);
        }

        var tableWidth = parseInt(sourceTableDOM.style.width, 10);
        sResize += "," + sourceTableNode.getAttribute('ID') + ":" + tableWidth;
        var sResizableColumnsID = sourceTableDOM.getAttribute("rdResizableColumnsID");
        var sReportID = sourceTableDOM.getAttribute("rdReportID");

        // REPDEV-23732
        sResize = encodeURIComponent(sResize);

        //For Logi: Save the new column sizes back to the server
        if (sourceTableDOM.id == "dtAnalysisGrid") {
            var hiddenNoCache = document.createElement("INPUT"); 
            hiddenNoCache.type = "HIDDEN";
            hiddenNoCache.id = "rdNoXslCache";
            hiddenNoCache.name = "rdNoXslCache";
            hiddenNoCache.value = "True";
            sourceTableDOM.tHead.rows[0].cells[0].appendChild(hiddenNoCache);
            rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveResizableColumns&rdReport=' + sReportID + 's&rdResizableColumnsID=' + sResizableColumnsID + '&rdResize=' + sResize + '&rdIsAg=True&rdAgID=' + document.rdForm.rdAgId.value);
        } else {
            var sSuperElementParam = ""
            if (document.getElementById('rdDashboardPanelContainer')) { sSuperElementParam = '&rdIsDashboard=True' }
            if (Y.one('.rd-report-author-element')) { sSuperElementParam = '&rdIsReportAuthor=True' }

            rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveResizableColumns&rdReport=' + sReportID + '&rdResizableColumnsID=' + sResizableColumnsID + '&rdResize=' + sResize + sSuperElementParam);
        }
        
    };

    LogiXML.ResizableColumns = ResizableColumns;

}, '1.0.0', { requires: ['dd-constrain', 'dd-proxy', 'dd-drop-plugin', 'dd-plugin', 'dd-scroll'] });

