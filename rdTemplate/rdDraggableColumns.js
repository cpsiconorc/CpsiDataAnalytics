YUI.add('draggable-columns', function (Y) {

    var DraggableColumns = Y.namespace('LogiXML.DraggableColumns');

    DraggableColumns.initialize = function () {
        //Initilize draggable columns
        DraggableColumns.rdInitDraggableColumns();

        //Wire up for re-init after refreshelement
        LogiXML.Ajax.AjaxTarget().on('reinitialize', this.rdInitDraggableColumns);
    };

    DraggableColumns.plug = function (j, headers,tableid) {
        setTimeout(function () {
        var header = headers[j];

        var node = Y.one(header);

        if (!node.hasClass('yui3-dd-draggable')) {

            //Only show handle when inside the cell. For touch always show.
            if (LogiXML.features['touch']) {
                LogiXML.getElementByIdEnding(node, "-DragHandle", "img").setStyle('visibility', 'visible');
            } else {
                node.on('mouseenter', function (e) {
                    LogiXML.getElementByIdEnding(e.currentTarget, "-DragHandle", "img").setStyle('visibility', 'visible');
                });
                node.on('mouseleave', function (e) {
                    LogiXML.getElementByIdEnding(e.currentTarget, "-DragHandle", "img").setStyle('visibility', 'hidden');
                });
            }

            node.plug(Y.Plugin.Drag);
            var dd = node.dd;
            dd.plug(Y.Plugin.DDProxy, {
                moveOnEnd: false
            }).plug(Y.Plugin.DDConstrained, {
                constrain2node: '#' + LogiXML.escapeSelector(tableid),
                stickX: true
            });

            var hndNode = LogiXML.getElementByIdEnding(node, "-DragHandle", "img");
            if (!LogiXML.features['touch'])
                hndNode.setStyle('visibility', 'hidden');
            dd.addHandle('#' + LogiXML.escapeSelector(hndNode.get('id'))).plug(Y.Plugin.DDWinScroll, { vertical: false, scrollDelay: 100 });;
            hndNode.setStyle('cursor', 'e-resize');

            LogiXML.fixYuiTest(hndNode);

            dd.on('drag:start', DraggableColumns._onDragStart);
            dd.on('drag:end', DraggableColumns._onDragEnd, node);
        }
    }, 5);
    };
    DraggableColumns.rdInitDraggableColumns = function () {

        var htmlTables = Y.all('table[rdDraggableColumnsID]');
        var table;
        var tablesSize = htmlTables.size();
        for (var i = 0; i < tablesSize; i++) {
            table = htmlTables.item(i).getDOMNode();

            // Safari doesn't support table.tHead, sigh
            if (table.tHead == null) {
                table.tHead = table.getElementsByTagName('thead')[0];
            }

            var headers = table.tHead.rows[0].cells;

            var headersLength = headers.length;
            for (var j = 0; j < headersLength ; j++) {
                DraggableColumns.plug(j, headers,table.id);
            }
        }
    };

    /* -----Events----- */

    DraggableColumns._onDragStart = function (e) {

        var drag = e.target;
        //load max 50 rows into the dragproxy
        var dragNode = drag.get('dragNode');
        var node = drag.get('node');
        if (!node) {
            e.halt();
            return;
        }
        //#15411 Make sure to set the root class for Analysis grid to keep font/font-size
        if (node.getAttribute('class').indexOf('rdAg') !== -1) dragNode.addClass('rdAg');
        var sourceTableNode = LogiXML.getAncestorByTagName(node, 'table', false);
        if (!sourceTableNode) {
            e.halt();
            return;
        }
        var sourceTable = sourceTableNode.getDOMNode();
        var psuedoTableHTML = '<table colindex="' + node.get('cellIndex') + '" cellspacing="' + sourceTable.cellSpacing + '" class="' + sourceTable.className + '" style="width:' + dragNode.getStyle('width') + ';" ><thead><tr><th class="'
		+ node.getAttribute('class') + '" >' + node.get('innerHTML') + '</th></tr></thead><tbody>';
        var tableRows = sourceTable.getElementsByTagName('TR');
        var currCell;
        for (var k = 1; k < tableRows.length; k++) {
            var sClass = '';
            if (tableRows[k].className == 'rdDragHeaderRow' || tableRows[k].getAttribute('row') == null) continue;
            currCell = tableRows[k].cells[node.get('cellIndex')];
            if (!currCell) continue;
            if (currCell.className) sClass = 'class="' + currCell.className + '"';
            psuedoTableHTML += '<tr><td ' + sClass + ' >' + currCell.innerHTML + '</td></tr>';
            if (k == 50)
                break;
        }
        psuedoTableHTML += '</tbody></table>';
        dragNode.set('innerHTML', psuedoTableHTML);
        dragNode.setStyles({
            opacity: '.90',
            borderColor: '#F1CA7F',
            backgroundColor: node.getStyle('backgroundColor')
        });
    };

    DraggableColumns._onDragEnd = function (e) {

        var drag = e.target;
        var dragNode = drag.get('dragNode');
        var dragTable = dragNode.one('table');
        if (!dragTable) {
            e.halt();
            return;
        }
        var startCol = dragTable.getAttribute('colindex');
        dragNode.set('innerHTML', '');
        var sourceTableNode = LogiXML.getAncestorByTagName(this, 'table', false);
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        var sourceTable = sourceTableNode.getDOMNode();
        var targetCol = DraggableColumns.findColumn(sourceTable, drag.mouseXY[0]);

        if (targetCol != -1 && targetCol != startCol) {
            var sDragColId = sourceTable.tHead.rows[0].cells[startCol].id.replace("-TH", "");
            var sTargetColId = sourceTable.tHead.rows[0].cells[targetCol].id.replace("-TH", "");
            DraggableColumns.moveColumn(sourceTable, startCol, targetCol);

            var sDraggableColumnsID = sourceTable.getAttribute("rdDraggableColumnsID");
            var sReportID = sourceTable.getAttribute("rdReportID");

            //For Logi: Save the new order back to the server
            if (sourceTable.id == "dtAnalysisGrid") {
                var hiddenNoCache = document.createElement("INPUT");
                hiddenNoCache.type = "HIDDEN";
                hiddenNoCache.id = "rdNoXslCache";
                hiddenNoCache.name = "rdNoXslCache";
                hiddenNoCache.value = "True";
                sourceTable.tHead.rows[0].cells[startCol].appendChild(hiddenNoCache);

                var sDrag = "," + sDragColId + ":" + sTargetColId + ":" + (targetCol - startCol);
                rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveDraggableColumns&rdReport=' + sReportID + '&rdDraggableColumnsID=' + sDraggableColumnsID + '&rdDrags=' + sDrag + '&rdIsAg=True&rdAgID=' + document.rdForm.rdAgId.value);
            } else {
                var sSuperElementParam = ""
                if (document.getElementById('rdDashboardPanelContainer')) { sSuperElementParam = '&rdIsDashboard=True'} 
                if (Y.one('.rd-report-author-element')) { sSuperElementParam = '&rdIsReportAuthor=True' }

                var dashboardPanelContainer = Y.one(".rdDashboardPanelContainer");


                var sDrag = "," + startCol + ":" + targetCol;
                rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveDraggableColumns&rdReport=' + sReportID + '&rdDraggableColumnsID=' + sDraggableColumnsID + '&rdDrags=' + sDrag + sSuperElementParam);
            }

            if (sourceTable.getAttribute("rdDraggableCtComp") != null) {
                //Special for CrosstabComparison.
                var sRefreshIDs = sourceTable.id;
                var eleParent = sourceTable.parentNode;
                var sModifyCrosstabIdForDashboard = '';
                while (eleParent.tagName != "BODY") {
                    if (eleParent.id.indexOf("rdDashboardPanel-") == 0) {
                        //Under a Dashboard.
                        sModifyCrosstabIdForDashboard = '&bModifyCrosstabIdForDashboard=True';  //#16166.						
                    }
                    eleParent = eleParent.parentNode;
                }
                var sReportId = document.getElementById("rdCtCompReportID").getAttribute("rdRequestedPage");
                var sDataCache = document.getElementById("rdCtCompCache").innerHTML;
                var sAGId = sourceTable.getAttribute("rdAnalysisGridID");
                var sRefreshAGCrosstabforComparison = '';   //#14164.
                if (sAGId != null && sAGId != '') { sRefreshAGCrosstabforComparison = "&rdAnalysisGridId=" + sAGId; }
                rdAjaxRequestWithFormVars("rdAjaxCommand=RefreshElement&rdRefreshElementID=" + sRefreshIDs + "&rdReport=" + sReportId + "&rdDataCache=" + sDataCache + "&rdCtCompDrags=True" + sRefreshAGCrosstabforComparison + sModifyCrosstabIdForDashboard, false, "");
            }
        }
    };

    // Which column does the x value fall inside of? x should include scrollLeft.
    DraggableColumns.findColumn = function (table, x) {
        var foundColIndex = -1;

        var header = table.tHead.rows[0].cells;
        for (var i = 0; i < header.length; i++) {
            //var left = header[i].offsetLeft;

            var headerNode = Y.one(header[i]);
            //if (left <= x && x <= left + header[i].offsetWidth) {
            if (headerNode.getX() <= x && x <= headerNode.getX() + header[i].offsetWidth) {
                foundColIndex = i;
                break;
            }
        }

        return foundColIndex;
    };

    // Move a column of table from start index to finish index.
    // Based on the "Swapping table columns" discussion on comp.lang.javascript.
    // Assumes there are columns at sIdx and fIdx
    DraggableColumns.moveColumn = function (table, sIdx, fIdx) {
        var row, cA;
        var i = table.rows.length;
        while (i--) {
            row = table.rows[i];
            if (row.cells[sIdx] != undefined) {
                var x = row.removeChild(row.cells[sIdx]);
                if (fIdx < row.cells.length) {
                    row.insertBefore(x, row.cells[fIdx]);
                } else {
                    row.appendChild(x);
                }
            }
        }
    };

    LogiXML.DraggableColumns = DraggableColumns;

}, '1.0.0', { requires: ['dd-constrain', 'dd-proxy', 'dd-drop-plugin', 'dd-plugin', 'dd-scroll'] });
