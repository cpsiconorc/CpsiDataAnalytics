var rdNewPanelCnt = 0
var rdVisibleTopPosition = 0;

YUI.add('dashboard', function (Y) {
    var FreeForm = Y.LogiXML.Dashboard.FreeForm;
    
    Y.namespace('LogiInfo').Dashboard = Y.Base.create('Dashboard', Y.Base, [], {

        /*
         * Initialization Code: Sets up privately used state
         * properties, and publishes the events Tooltip introduces
         */
        initializer: function (config) {

            //Is the dashboard adjustable?
            var eleAdjustable = document.getElementById("rdDashboardAdjustable")
            var eleFreeformLayout = document.getElementById('rdFreeformLayout');
            if (eleFreeformLayout != null)
                if (eleFreeformLayout.id.toLowerCase() == 'rdhiddenrequestforwarding')
                    eleFreeformLayout = null;   //#14758.
            this.set('bIsFreeformLayout', (eleFreeformLayout != null));
            if (!eleAdjustable) return;  //11475 - Does dashboard exist?

            //Setup global filter highlighting.
            rdDbEnableGlobalFilterHighlighting();

            var eleColCnt = document.getElementById("lstColumnCount");
            if (eleColCnt)
                this.columnLayout = eleColCnt.value;
            else
                this.columnLayout = "Free-form";

            this.refreshing = false;

            var reinitializing = config && config.reinitializing;

            if (!reinitializing && LogiXML.Ajax.AjaxTarget) {
                LogiXML.Ajax.AjaxTarget().on('reinitialize', function () {
                    if (this.refreshing)
                        return;

                    if (this.layoutChanged())
                        this.rdRefreshDashboard();
                }, this);
            }

            //Initilize free form locations one time since the user can't change it
            if (eleAdjustable.innerHTML == 'False') {
                this.set("bDashboardAdjustable", false);
                var sClassSelector = 'rdDashboardPanel';
                if (this.get('bIsFreeformLayout')) {
                    this.rdSizeUnAdjustablePanels(sClassSelector);
                    FreeForm.rdResizeDashboardContainer();
                }
            }

            if (eleAdjustable.innerHTML != 'False') {
                //Init interactivity.

                if (!reinitializing && LogiXML.Ajax.AjaxTarget) {
                    LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { rdSetUndoRedoVisibility(); }, this);
                }

                rdSetUndoRedoVisibility();

                var i;
                //Make the panels draggable.
                if (typeof (rdMobileReport) == 'undefined') { //Not for mobile. 13676

                    var elePanels = Y.all('div.rdDashboardPanel'),
					    numberOfPanels = elePanels.size();

                    if (numberOfPanels > 0) {
                        // Currently click event changes z-index of panels
                        FreeForm.addPanelClickEvents();
                    }

                    // initialize dashboard panels
                    for (i = 0; i < numberOfPanels; i++) {
                        this.initializeDashboardPanel(elePanels.item(i).get("id"), this, false);
                    }
                }

                //Make the columns droppable.
                var eleCols = document.getElementsByTagName("TD");
                for (i = 0; i < eleCols.length; i++) {
                    var eleCol = eleCols[i];
                    if (eleCol.id.indexOf("rdDashboardColumn") == 0) {
                        var drop = Y.one(eleCol).plug(Y.Plugin.Drop);
                        drop.drop.on('drop:hit', this.DashboardColumn_onDropHit, this);
                    }
                }

                //Make the Tabs droppable.
                var eleTabs = document.getElementsByTagName("LI");
                for (i = 0; i < eleTabs.length; i++) {
                    var eleTab = eleTabs[i];
                    if (eleTab.parentNode.parentNode.id.indexOf("rdTabs-") == 0) {

                        if (eleTab.className != "selected") {
                            if (eleTab.id != "rdTabAddNewTab") {
                                var drop = Y.one('li[id="' + eleTab.id + '"]').plug(Y.Plugin.Drop);
                                drop.drop.on('drop:hit', this.Tab_onDropHit, this);
                            }
                        }
                    }
                }

                this.rdAddRefreshEventForAddPanelsPopupCloseButton();

                FreeForm.rdResizeDashboardContainer();

                //Settings Cog (mobile reports resize the tab, so no need to do this twice)
                if (typeof (rdMobileReport) === 'undefined') {
                    this.rdPositiontabSettingsCog();
                }

                //Make the Add New Tab look like a button instead of a tab.
                var nodeNewTab = Y.one("#rdTabAddNewTab")
                if (Y.Lang.isValue(nodeNewTab)) {
                    if (typeof (rdMobileReport) == 'undefined') {
                        var nodeA = nodeNewTab.one('a');
                        nodeA.addClass('hide-tab');
                        var nodeSpan = nodeA.one('span')
                        nodeSpan.addClass('rdDashboardCommand');
                    } else {
                        // Shrink the Tab size to 50% of the screen size.
                        //eleNewTab.parentNode.style.whiteSpace=''; This needs to be set in VB.
                        var eleMobileDashboardTab = nodeNewTab.getDOMNode().previousSibling;
                        var nTabWidth = 175;
                        eleMobileDashboardTab.style.width = nTabWidth + 'px';
                        eleMobileDashboardTab.style.wordWrap = 'break-word';
                        eleMobileDashboardTab.firstChild.style.paddingLeft = 2 + 'px';  // anchor tag
                        eleMobileDashboardTab.firstChild.style.paddingRight = 2 + 'px';
                        eleMobileDashboardTab.firstChild.style.width = (nTabWidth - 4) + 'px';
                        eleMobileDashboardTab.firstChild.style.wordWrap = 'break-word';
                        eleMobileDashboardTab.firstChild.style.backgroundRepeat = 'repeat-x';
                        eleMobileDashboardTab.firstChild.firstChild.style.paddingLeft = 2 + 'px';  // em tag
                        eleMobileDashboardTab.firstChild.firstChild.style.paddingRight = 2 + 'px';
                        eleMobileDashboardTab.firstChild.firstChild.style.width = (nTabWidth - 8) + 'px';
                        eleMobileDashboardTab.firstChild.firstChild.style.wordWrap = 'break-word';
                        this.rdPositiontabSettingsCog(false);
                    }
                }

                this.subscribeToWindowResize();

                //REPDEV-23445-Add-Free-Form-Panels-to-Dashboard-without-overlapping-existing-content
                //initialize auto position panels
                if (this.get('bIsFreeformLayout')) {
                    var eleAutoPanels = Y.all('div.rdAutoPositionPanel');
                    if (eleAutoPanels.size() > 0) {
                        var self = this;
                        //settimeout to make sure the DataTable may get real height
                        setTimeout(function () {
                            self.initializeAutoPositionPanels(eleAutoPanels);
                        }, 100);
                    }
                }

                if (numberOfPanels < 1)
                    this.rdShowAddDashboardPanels();                
            }  //End init interactivity.
        },
        layoutChanged: function () {
            var db = LogiXML.Dashboard.pageDashboard;

            var isFreeForm = !!db.get("bIsFreeformLayout");
            var shouldBeFreeForm = !!document.getElementById('rdFreeformLayout');
            var eleColCnt = document.getElementById("lstColumnCount");
            var sColCnt;
            if (eleColCnt)
                sColCnt = eleColCnt.value;
            else
                sColCnt = "Free-form";

            return (isFreeForm != shouldBeFreeForm || db.columnLayout != sColCnt);
        },
        subscribeToWindowResize: function () {
            if (!window.LogiXML.visualizationWindowResize) {
                window.LogiXML.visualizationWindowResize = Y.on('windowresize', function () {
                    var panels = Y.all('div.rdDashboardPanel');
                    panels.each(function (panel) {
                        var panelBody = panel.one('div.panelBody');
                        var ngpVisualization = panel.one('logi-visualization,logi-crosstab-table');
                        if (ngpVisualization) {
                                FreeForm.resizeVisualizationToFitPanel(panel, ngpVisualization);
                        }
                        //REPDEV-24538 New breadcrumb menu text ellipsis and resizing support
                        if (Y.LogiXML.ChartDrillToBreadcrumb && Y.LogiXML.ChartDrillToBreadcrumb.reflowItem) {
                            panel.all('.rdChartDrillToBreadcrumb').each(Y.LogiXML.ChartDrillToBreadcrumb.reflowItem);
                        }
                    });
                });
            }
        },

        rdClientSideEnableUndo: function () {
            var eleAutoBookmark = document.getElementById("lblAutoBookmark");
            if (eleAutoBookmark) {
                if (eleAutoBookmark.value == "") {
                    rdSetUndoRedoVisibility();
                }
            }
        },

        initializeDashboardPanel: function (sPanelID, dashboard, refresh) {
            if (refresh)
                rdDbRefreshGlobalFilterHighlighting();

            if (!sPanelID)
                return;

            var elePanel = document.getElementById(sPanelID);
            if (!elePanel)
                return;

            //Destroy the registered drag/drop nodes if any.
            Y.DD.DDM.getNode(Y.one(elePanel)).destroy();
            var panelNode = Y.one(elePanel);

            //11516,11518,11524
            if (elePanel.className.indexOf('yui-resize') != -1 || sPanelID.indexOf('rdDashboardPanel-') != 0)
                return;

            if (!dashboard)
                dashboard = LogiXML.Dashboard.pageDashboard;

            // Don't unreg the YUI Resize handles.
            var dashTitleID = sPanelID.replace("rdDashboardPanel-", "rdDashboardPanelTitle-");
            var drag = new Y.DD.Drag({
                node: panelNode
            })
            //25557
            panelNode.addClass('dragHandleOnly');

            if (dashboard.get('bIsFreeformLayout')) {
                drag.plug(Y.Plugin.DDConstrained, {
                    tickX: 10,
                    tickY: 10,
                    constrain: []   //#21229.
                });

                FreeForm.initializePanelResizer(panelNode);
                FreeForm.rdResizeDashboardContainer();
                //Set the panel's position and size so it's snapped to the grid.
                panelNode.setStyle("left", FreeForm.rdRoundTo10(panelNode.getStyle("left")))
                panelNode.setStyle("top", FreeForm.rdRoundTo10(panelNode.getStyle("top")))
            }

            //Attach drag-drop events
            drag.on('drag:start', dashboard.DashboardPanel_onDragStart, dashboard);
            drag.on('drag:end', dashboard.DashboardPanel_onDragEnd, dashboard);
            drag.on('drag:over', dashboard.DashboardPanel_onDragOver, dashboard);

            //Now you can only drag it from the panel title
            var hndNode = panelNode.one('tr[id="' + dashTitleID + '"]');
            panelNode.dd.addHandle(hndNode).plug(Y.Plugin.DDWinScroll, { scrollDelay: 100, horizontal: false });
            //25556
            //if (this.get('bIsFreeformLayout')) panelNode.dd.plug(Y.Plugin.DDWinScroll, { scrollDelay: 100 });
            hndNode.setStyle('cursor', 'move');

            //25623
            if (dashboard.get('bIsFreeformLayout')) {
                panelNode.setStyle('opacity', '.92');
            }
            else {
                panelNode.setStyle('opacity', '1');
            }
        },

        initializeAutoPositionPanels: function (elePanels) {
            var nTop = this.rdCalculateBottomValue();
            var aIndex = [];
            var panelMap = {};
            var eleHidden, autoIndex;
            elePanels.each(function (ele) {
                eleHidden = ele.one('input[id^=rdAutoPositionIndex]');
                autoIndex = eleHidden.get('value');
                aIndex.push(parseInt(autoIndex));
                panelMap[autoIndex] = ele;
            });
            aIndex.sort();
            var panel, domNode;
            for (var i = 0, len = aIndex.length; i < len; i++) {
                panel = panelMap[aIndex[i]];
                panel.setStyle('top', FreeForm.rdRoundTo10(nTop + 10) + 'px');
                panel.removeClass('rdAutoPositionPanel');
                domNode = panel.getDOMNode();
                nTop = domNode.offsetTop + domNode.offsetHeight;
            }
            //If add multiple panels,scroll to the first one to make it visible
            if (rdVisibleTopPosition > 0) {
                var rdDivDashboardpanels = Y.one('#rdDivDashboardpanels');
                if (rdDivDashboardpanels) {
                    rdVisibleTopPosition += rdDivDashboardpanels.getDOMNode().offsetTop;
                }
                window.scrollTo(0, rdVisibleTopPosition);
                rdVisibleTopPosition = 0;
            }
        },

        /* ---Events--- */

        DashboardPanel_onDragStart: function (e) {
            var pnlDragged = e.target.get('dragNode');

            if (this.get('bIsFreeformLayout')) {
                FreeForm.freezeDashboardContainer();

                FreeForm.showPanelonTop(pnlDragged);
                pnlDragged.setStyle('opacity', '.75');
            } else {
                pnlDragged.setStyles({
                    zIndex: 1,
                    opacity: .75
                });
            }
            this.rdSetAppletVisibility("hidden");

            //REPDEV-19786
            var dashboardPanelContainer = Y.one(".rdDashboardPanelContainer");
            if (dashboardPanelContainer) {
                dashboardPanelContainer.simulate("mousedown");
            }
        },

        DashboardPanel_onDragEnd: function (e) {

            //endDrag occurs after DragDrop
            var pnlDragged = e.target.get('dragNode');

            if (this.get('bIsFreeformLayout')) {
                FreeForm.unFreezeDashboardContainer();

                var pnlTop = pnlDragged.getStyle('top').replace('px', '');
                var pnlLeft = pnlDragged.getStyle('left').replace('px', '');
                if (pnlTop < 0) pnlDragged.setStyle('top', '0px');
                if (pnlLeft < 0) pnlDragged.setStyle('left', '0px');
                pnlDragged.setStyle('opacity', '.92');
                FreeForm.rdSaveFreeformLayoutPanelPosition('rdDivDashboardpanels', false, true);
            } else {
                pnlDragged.setStyles({
                    zIndex: 0,
                    opacity: 1,
                    left: 0,
                    top: 0
                });
                // we need to resize charts when move the panel to larger/smaller column
                pnlDragged.all('.rdChartCanvas').each(Y.LogiXML.ChartCanvas.reflowChart);
                //REPDEV-24538 New breadcrumb menu text ellipsis and resizing support
                if (Y.LogiXML.ChartDrillToBreadcrumb && Y.LogiXML.ChartDrillToBreadcrumb.reflowItem) {
                    pnlDragged.all('.rdChartDrillToBreadcrumb').each(Y.LogiXML.ChartDrillToBreadcrumb.reflowItem);
                }
                if ((pnlDragged.get('id') || "").indexOf('NGPviz') >= 0) {
                    var panelBody = pnlDragged.one('div.panelBody');
                    panelBody.setStyle('width', Y.one('#lastHoveredDropZoneWidth').get('value'));
                    var charts = panelBody.all("div.rdLogiVisualization");
                    if (charts.size() > 0) {
                        var ngpVisualization = pnlDragged.one('.rdLogiVisualization logi-visualization,.rdLogiVisualization logi-crosstab-table');
                        if (ngpVisualization) {
                            LogiXML.Dashboard.FreeForm.resizeVisualizationToFitPanel(pnlDragged, ngpVisualization);
                        }
                    }
                }
            }
            var posDashboardPanelFinalCoOrds = pnlDragged.getXY();
            if (this.get('bIsTouchDevice'))
                setTimeout(function () {
                    Y.LogiInfo.Dashboard.rdResetDashboardPanelAfterDDScroll(pnlDragged.getDOMNode(), posDashboardPanelFinalCoOrds);
                }, 1000);  // Do this for the Tablet only, #15478.

            this.rdSetDropZone(null);
            this.rdSetAppletVisibility("");
        },

        DashboardPanel_onDragOver: function (e) {
            var x = 1;

            var target = e.drop.get('node');
            var dragNode = e.target.get('node');

            var eleTarget = target.getDOMNode();
            var pnlDragged = dragNode.getDOMNode();

            if (!this.get('bIsFreeformLayout') && target.get('id').indexOf("rdDashboardColumn") == 0) {
                //Find the closest DropZone that's above the current position in the same column.
                var eleDropZone, eleClosestDropZone, nClosestDistance, elePanelChild;

                for (var i = 0; i < eleTarget.childNodes.length; i++) {
                    if (eleTarget.childNodes[i].id.indexOf("rdDashboardDropZone") != -1) {
                        eleDropZone = eleTarget.childNodes[i];
                        var yDragged = this.rdGetDbPanelHeight(pnlDragged);
                        var yDropZone = this.rdGetDbPanelHeight(eleDropZone);

                        if (!eleClosestDropZone) {
                            eleClosestDropZone = eleDropZone;
                            nClosestDistance = Math.abs(yDragged - yDropZone);
                        } else if (Math.abs(yDragged - yDropZone) < nClosestDistance) {
                            eleClosestDropZone = eleDropZone;
                            nClosestDistance = Math.abs(yDragged - yDropZone);

                        }
                    }
                }

                if (eleClosestDropZone) {
                    this.rdSetDropZone(eleClosestDropZone);

                    //REPDEV-20012 chart resizing when moving between columns, remember width of last dropzone in hidden
                    var lastDropZoneWidthHidden = document.getElementById('lastHoveredDropZoneWidth');
                    if (!lastDropZoneWidthHidden) {
                        var newLastDropZoneWidthHidden = document.createElement('input');
                        newLastDropZoneWidthHidden.setAttribute('id', 'lastHoveredDropZoneWidth');
                        newLastDropZoneWidthHidden.setAttribute('type', 'hidden');
                        document.body.appendChild(newLastDropZoneWidthHidden);
                        lastDropZoneWidthHidden = newLastDropZoneWidthHidden;
                    }
                    lastDropZoneWidthHidden.setAttribute('value', Y.one(eleClosestDropZone).get('clientWidth'));
                }
            }
            else {
                //Dragging over a tab?
                if (eleTarget.tagName == "LI") {
                    if (eleTarget.parentNode.parentNode.id.indexOf('rdTabs-') == 0) {
                        this.rdSetDropZone(eleTarget);
                    }
                }
                else
                    this.rdSetDropZone(null);
            }
        },

        DashboardColumn_onDropHit: function (e) {
            if (!this.get('rdDropZoneId'))
                return;

            //Move the dragged panel
            var eleDropZone = document.getElementById(this.get('rdDropZoneId'))  //The drop zone where it was dropped.
            if (!eleDropZone)
                return;

            if (eleDropZone.tagName == "TABLE") {
                //Dropped in a drop zone.
                var pnlDragged = e.drag.get('node');
                pnlDragged.setStyles({
                    left: 0,
                    top: 0
                });
                if (pnlDragged.get('id').replace("rdDashboardPanel", "rdDashboardDropZone") == this.get('rdDropZoneId')) {
                    //Dropped on the current panel's drop zone.  Put the panel back.
                    this.rdSetDropZone(null);
                    //rdAnimateHome(pnlDragged.id)
                    return;
                }

                var eleDropZoneBelow = document.getElementById(pnlDragged.get('id').replace("rdDashboardPanel", "rdDashboardDropZone")) //The drop zone below the panel.
                var elePanelDragged = document.getElementById(pnlDragged.get('id'));
                //Move the panel and its sibling drop zone.
                if (eleDropZone.nextSibling) {
                    eleDropZone.parentNode.insertBefore(eleDropZoneBelow, eleDropZone.nextSibling);
                    eleDropZone.parentNode.insertBefore(elePanelDragged, eleDropZone.nextSibling);
                } else {
                    eleDropZone.parentNode.appendChild(elePanelDragged);
                    eleDropZone.parentNode.appendChild(eleDropZoneBelow);
                }

                this.rdSetDropZone(null);

                this.rdSaveDashboardOrder(elePanelDragged.id);

                //REPDEV-20012 chart resizing when moving between columns
                var ngpVisualization = pnlDragged.one('logi-visualization,logi-crosstab-table');
                var lastDropZoneWidthHidden = Y.one('#lastHoveredDropZoneWidth');
                if (ngpVisualization) {
                    if (lastDropZoneWidthHidden) {
                        var chartWrapper = pnlDragged.one('.chartfx-wrapper');
                        chartWrapper.setStyle('width', lastDropZoneWidthHidden.get('value'));
                    }
                    FreeForm.resizeVisualizationToFitPanel(pnlDragged, ngpVisualization);
                }

                var chartCanvas = pnlDragged.one('.rdChartCanvas');
                if (chartCanvas) {
                    chartCanvas.setStyle('width', null);
                    Y.LogiXML.ChartCanvas.reflowAllCharts();
                }
            }
        },

        Tab_onDropHit: function (e) {
            if (!this.get('rdDropZoneId'))
                return;

            //Move the dragged panel
            var eleDropZone = document.getElementById(this.get('rdDropZoneId'));  //The drop zone where it was dropped.
            if (!eleDropZone)
                return;

            //Dropped on a Tab
            var pnlDragged = e.drag.get('node');
            var sPanelId = pnlDragged.get('id');
            // Do not move the panel to a different Tab if the panel is a Single Instance panel.
            var eleSingleInstancePanels = Y.one('#rdDashboardSingleInstanceOnlyPanelsList');
            if (eleSingleInstancePanels != null) {
                var aSingleInstancePanels = eleSingleInstancePanels.getDOMNode().value.split(',');
                for (i = 0; i < aSingleInstancePanels.length; i++) {
                    var sSingleInstancePanelId = aSingleInstancePanels[i];
                    if (sSingleInstancePanelId == sPanelId.substring(sPanelId.indexOf('rdDashboardPanel-') + 'rdDashboardPanel-'.length, sPanelId.lastIndexOf('_'))) {
                        return;
                    }
                }
            }
            this.rdMovePanelToTab(sPanelId, e.target.get('node').get('id'), eleDropZone);
        },

        /* ---Methods--- */

        rdAddDashboardPanel: function (sPanelID, nRowNr, eleEventOriginationPopup) {
			if (sPanelID.indexOf('NGPviz') >= 0) {
				bIsNgpViz = true;
			}
            var rdFreeformLayout = document.getElementById('rdFreeformLayout');
            if (rdFreeformLayout != null) {
                if (rdFreeformLayout.id.toLowerCase() == 'rdhiddenrequestforwarding') {
                    rdFreeformLayout = null;   //#14758.
                }
            }

            var rdParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value;
            rdParams += "&PanelID=" + sPanelID;

            var dashboardTabs = document.getElementById("rdActiveTabId_rdDashboardTabs");
            if (Y.Lang.isValue(dashboardTabs)) {
                rdParams += "&TabID=" + dashboardTabs.value;
            }
            this.rdCalculatezIndexValue();
            if (rdFreeformLayout) {
                var nTop = this.rdCalculateBottomValue();
                rdParams += "&rdFreeformLayout=True";
                rdParams += "&rdNewFreeformLayoutPanel=True";
                //REPDEV-23445-Add-Free-Form-Panels-to-Dashboard-without-overlapping-existing-content
                //If there are more than one panels added in one time,we should calculate the position in client side.
                //So we will save some info to the extra bookmark.
                if (rdNewPanelCnt > 0) {
                    nTop += 400 * rdNewPanelCnt;
                } else {
                    rdVisibleTopPosition = nTop;
                }
                rdParams += "&rdAutoPosition=True";
                rdParams += "&rdFreeformLayoutStyle=Position:absolute;" + "Left:10px;Top:" + (nTop + 10) + "px;z-index:" + this.get('zIndex') + ';';

                if (bIsNgpViz) {
                    rdParams += "height:400px;";
                }
                rdParams += ("&rdDashboardTabStyle=Width:" + Y.DOM.winWidth() + "px;Height:" + (Y.DOM.winHeight() - Y.DOM.region(Y.DOM.byId('rdDashboardList')).top - 50) + 'px;');
            }
            else {
                // Always save size of the Tab, even if FreeForm is turned off.  This way when someone switches from Column based to FreeForm,
                // the dimensions are already saved and can be used.
                var panelContainer = Y.one('.rdDashboardPanelContainer');
                rdParams += "&rdDashboardTabStyle=Width:" + panelContainer.get('offsetWidth') + "px;";
            }
            rdNewPanelCnt += 1
            this.rdClientSideEnableUndo();
            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddDashboardPanel' + rdParams)
            //Update the count.
            if (typeof eleEventOriginationPopup === 'undefined') {
                var eleCount = document.getElementById("lblCount_Row" + nRowNr)
                eleCount.innerHTML = parseInt(eleCount.innerHTML) + 1
                var eleCountDiv = document.getElementById("divCount_Row" + nRowNr)
                eleCountDiv.className = eleCountDiv.className.replace("rdDashboardHidden", "")
                var eleAddedDiv = document.getElementById("divAdded_Row" + nRowNr)
                eleAddedDiv.className = eleAddedDiv.className.replace("rdDashboardHidden", "")
                //Hide the Add button?
                if (document.getElementById("hiddenMultiInstance_Row" + nRowNr).value == "False") {
                    var eleAddNowButton = document.getElementById("lblAddPanel_Row" + nRowNr)
                    eleAddNowButton.className = "rdDashboardHidden"
                    eleCountDiv.className = "rdDashboardHidden"
                    if (Y.Lang.isNull(Y.one('#rdUseGalleryFile'))) {
                        // Don't hide the DeleteThisPanel button for Report Author.
                        var eleDeletePanelButton = document.getElementById("lblDeletePanel_Row" + nRowNr)
                        eleDeletePanelButton.className = "rdDashboardHidden"
                    }
                }
            } else {
                //For Report Author
                var nodeOriginationPopup = Y.one('#' + eleEventOriginationPopup);
                var eleCount = nodeOriginationPopup.one('#lblCount_Row' + nRowNr).getDOMNode();
                eleCount.innerHTML = parseInt(eleCount.innerHTML) + 1
                var eleCountDiv = nodeOriginationPopup.one('#divCount_Row' + nRowNr).getDOMNode();
                eleCountDiv.className = eleCountDiv.className.replace("rdDashboardHidden", "")
                var eleAddedDiv = nodeOriginationPopup.one('#divAdded_Row' + nRowNr).getDOMNode();
                eleAddedDiv.className = eleAddedDiv.className.replace("rdDashboardHidden", "")
                //Hide the Add button?
                if (nodeOriginationPopup.one('#hiddenMultiInstance_Row' + nRowNr).getDOMNode().value == "False") {
                    var eleAddNowButton = nodeOriginationPopup.one('#lblAddPanel_Row' + nRowNr).getDOMNode();
                    eleAddNowButton.className = "rdDashboardHidden"
                    eleCountDiv.className = "rdDashboardHidden"
                    var eleDeletePanelButton = nodeOriginationPopup.one('#lblDeletePanel_Row' + nRowNr).getDOMNode();
                    eleDeletePanelButton.className = "rdDashboardHidden"
                }
            }
        },

        rdCalculateBottomValue: function () {
            var elePanelContainer = Y.one('#rdDivDashboardpanels') || Y.one('#rdDivDashboardPanelTable'),
                aDashboardPanels, i;
            if (Y.Lang.isNull(elePanelContainer)) {
                return 0;
            }
            aDashboardPanels = elePanelContainer.all('.rdDashboardPanel');
            var nBottom = 0, offsetTop, offsetHeight;
            var panel,domNode;
            for (i = 0; i < aDashboardPanels.size(); i++) {
                panel = aDashboardPanels.item(i);
                if (panel.hasClass('rdAutoPositionPanel')) {
                    continue;
                }
                domNode = panel.getDOMNode();
                offsetTop = domNode.offsetTop;
                offsetHeight = domNode.offsetHeight;
                if (i == 0) {
                    nBottom = offsetTop + offsetHeight;
                } else {
                    nBottom = Math.max((offsetTop + offsetHeight), nBottom);
                }
            }
            return nBottom;
        },

        rdCalculatezIndexValue: function () {
            var eleDashboardTab = Y.one('#rdDivDashboardPanelTable');
            var dashboardPanels = eleDashboardTab.all('.rdDashboardPanel'),
			numberofPanels = dashboardPanels.size(),
			i, panel;
            if (numberofPanels === 0) {
                this.set('zIndex', (this.get('zIndex') + 1));
                return;
            }
            for (i = 0; i < numberofPanels; i++) {
                panel = dashboardPanels.item(i);
                var nPanelzIndex = panel.getComputedStyle('zIndex');
                if (this.get('zIndex') <= nPanelzIndex) {
                    this.set('zIndex', parseInt(nPanelzIndex) + 1);
                }
            }
        },

        rdRemoveDashboardPanel: function (sPanelElementID, eEvent) {
            var rdFreeformLayout = document.getElementById('rdFreeformLayout');
            if (rdFreeformLayout != null)
                if (rdFreeformLayout.id.toLowerCase() == 'rdhiddenrequestforwarding')
                    rdFreeformLayout = null;   //#14758.
            //Remove the panel from the page.
            var elePanel = document.getElementById(sPanelElementID)
            if (elePanel) {  //If the user clicks a lot on the same button, this may not exist.
                var eleDropZoneBelow = document.getElementById(sPanelElementID.replace("rdDashboardPanel", "rdDashboardDropZone")) //The drop zone below the panel.
                elePanel.parentNode.removeChild(elePanel)
                if (eleDropZoneBelow) eleDropZoneBelow.parentNode.removeChild(eleDropZoneBelow)

                //Clear the checkbox.
                var sPanelID = sPanelElementID.replace("rdDashboardPanel-", "")
                var eleChecks = document.getElementsByTagName("INPUT")
                for (var i = 0; i < eleChecks.length; i++) {
                    var eleCheck = eleChecks[i]
                    if (eleCheck.parentNode.innerHTML.indexOf('&quot;,' + sPanelID + '&quot;') != -1) {
                        eleCheck.checked = false
                    }
                }

                var rdPanelParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value;
                rdPanelParams += '&PanelInstanceID=' + this.rdGetPanelInstanceId(elePanel)
                if (rdFreeformLayout) {
                    FreeForm.rdResizeDashboardContainer();
                    rdPanelParams += "&rdFreeformLayout=True";
                }
                rdPanelParams += '&DashboardID=' + document.getElementById("DashboardIdentifier").value;
                this.rdClientSideEnableUndo();
                rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=RemoveDashboardPanel' + rdPanelParams);
                rdResetGalleryPanels();
            }
        },

        rdDeleteCustomDashboardPanel: function (sPanelElementID, nRowNr, sBookmarksCollection, sBookmarkId) {
            var rdPanelParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value;
            rdPanelParams += '&sPanelID=' + sPanelElementID;

            var dashboardTabs = document.getElementById("rdActiveTabId_rdDashboardTabs");
            if (Y.Lang.isValue(dashboardTabs)) {
                rdPanelParams += "&TabID=" + dashboardTabs.value;
            }

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=DeleteCustomDashboardPanel' + rdPanelParams);
            var rdDashboardPanelList = document.getElementById('rdDashboardPanelList');   //#12552.

            // REPDEV-21788 - Only count the childNodes with IDs - there are empty tr tags that don't count
            var curIdx = -1;
            var targetIdx = Number(nRowNr) - 1;
            var rows = rdDashboardPanelList.rows;
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];

                if (!row.id)
                    continue;

                curIdx++;

                if (curIdx == targetIdx) {
                    row.style.display = 'none';
                    break;
                }
            }
        },

        rdSetDropZone: function (eleDropZone) {

            if (this.get('rdDropZoneId')) {
                var eleOldDropZone = document.getElementById(this.get('rdDropZoneId'))
                if (eleOldDropZone) {
                    if (eleOldDropZone.tagName == "TABLE") {
                        //Table cell.
                        eleOldDropZone.firstChild.firstChild.firstChild.className = "rdDashboardDropZone"  //All these children get to the table's cell.
                    } else {
                        //Tab
                        eleOldDropZone.firstChild.firstChild.firstChild.className = eleOldDropZone.firstChild.firstChild.firstChild.className.replace(" rdDashboardDropTabActive", "")
                    }
                }
            }

            if (eleDropZone) {
                this.set('rdDropZoneId', eleDropZone.id);
                if (eleDropZone.tagName == "TABLE") {
                    //Table cell.
                    eleDropZone.firstChild.firstChild.firstChild.className = "rdDashboardDropZoneActive"
                } else {
                    //Tab
                    eleDropZone.firstChild.firstChild.firstChild.className = eleDropZone.firstChild.firstChild.firstChild.className + " rdDashboardDropTabActive"
                }
            } else {
                this.set('rdDropZoneId', null);
            }
        },

        rdSaveDashboardOrder: function (reloadPanelID) {
            var eleHiddenPanelOrder = document.getElementById("rdDashboardPanelOrder")
            eleHiddenPanelOrder.value = ""
            var elePanels = document.getElementsByTagName("DIV")
            for (var i = 0; i < elePanels.length; i++) {
                var elePanel = elePanels[i]
                if (elePanel.id.indexOf("rdDashboardPanel") == 0) {
                    eleHiddenPanelOrder.value += "," + this.rdGetPanelInstanceId(elePanel)
                    //Add the column number
                    var nColNr = elePanel.parentNode.id.replace("rdDashboardColumn", "")
                    eleHiddenPanelOrder.value += ":" + nColNr
                }
            }

            var rdPanelParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value;
            if (reloadPanelID)
                rdPanelParams += "&rdReloadPanelID=" + reloadPanelID;

            window.status = "Saving dashboard panel positions."
            this.rdClientSideEnableUndo();
            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=UpdateDashboardPanelOrder' + rdPanelParams)
        },

        rdSaveDashboardParams: function (sPanelElementID, bPanelRename, bSaveOnEnterOptionalParam) {

            if (typeof bSaveOnEnterOptionalParam === 'undefined') {
                if (document.activeElement.id.indexOf('rdDashboardPanelRename-') != -1) return; //#21118.
            }
            var sErrorMsg = rdValidateForm();
            if (sErrorMsg) {
                alert(sErrorMsg);
                return;
            }

            //Hide the Save button.
            var sPanelID = sPanelElementID.replace("rdDashboardPanel-", "");
            var elePanel = document.getElementById(sPanelElementID);

            //Update the Panel Caption
            //Hide the rename textbox div after editing.
            var nodeRenamePanelDiv = Y.one('#rdDashboardPanelRenameDiv-' + sPanelID);
            if (!Y.Lang.isNull(nodeRenamePanelDiv)) {
                nodeRenamePanelDiv.setStyle('display', 'none');
            }
            //Show the Panel Caption Div after editing is done.
            var nodePanelRenameCaptionDiv = Y.one('#rdDashboardPanelCaptionDiv-' + sPanelID);
            nodePanelRenameCaptionDiv.setStyle('display', '');
            //Show the panel settings cog.
            var nodePanelSettingsCog = Y.one('#rdPanelSettingsCog_' + sPanelID);
            nodePanelSettingsCog.setStyle("display", "");
            //Set the changed caption.
            if (!Y.Lang.isNull(nodeRenamePanelDiv)) {
                var sRename = encodeHtmlInput(nodeRenamePanelDiv.one('#' + nodeRenamePanelDiv.get("id").replace("rdDashboardPanelRenameDiv-", "rdDashboardPanelRename-")).get("value"));
                if (nodePanelRenameCaptionDiv.one('#rdDashboardCaptionID').getHTML() != sRename) {
                    nodePanelRenameCaptionDiv.one('#rdDashboardCaptionID').setHTML(sRename);
                } else {
                    if (typeof bPanelRename != 'undefined') {
                        return;
                    }
                }
            }
            //Refresh the panel with updated parameters.
            var panelParameters = {
                parameters: "",
                ids: ""
            };

            panelParameters = this.rdGetRecursiveInputValues(elePanel, panelParameters);
            //Moved the params inputs to a popup which is not in the panel div, collect the values seperately.
            panelParameters = this.rdGetRecursiveInputValues(document.getElementById('ppPanelParams-' + sPanelID), panelParameters);
            panelParameters.parameters += "&rdReport=" + document.getElementById("rdDashboardDefinition").value;
            if (panelParameters.parameters.indexOf('&InstanceID') == -1) {
                panelParameters.parameters += '&InstanceID=' + this.rdGetPanelInstanceId(elePanel); //22945
            }
            if (typeof bPanelRename != 'undefined') {
                panelParameters.parameters += "&bPanelRename=true";
            }
            window.status = "Saving dashboard panel parameters.";

            //var dd = Y.DD.DDM.getDrag(elePanel);
            //dd.destroy();
            var panelNode = Y.one(elePanel),
				initPanelCallback = Y.bind(FreeForm.initializePanel, window, panelNode, panelNode.getData('resizer'));

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveDashboardParams&PanelID=' + sPanelID + panelParameters.parameters + "&ParamIDs=" + panelParameters.ids, null, null, null, null, initPanelCallback);
        },

        rdEditDashboardPanel: function (sDashboardPanelID) {
            var eleDashboardPanel = document.getElementById(sDashboardPanelID);
            var sId = sDashboardPanelID.substring(17)
            var rdDashboardPanelCaptionDiv = document.getElementById('rdDashboardPanelCaptionDiv-' + sId)
            var rdDashboardPanelEditCancelDiv = document.getElementById('rdDashboardCancel-' + sId)
            try {
                if (rdDashboardPanelCaptionDiv) { //#13683.
                    if (rdDashboardPanelEditCancelDiv) {
                        if (rdDashboardPanelEditCancelDiv.outerHTML) {
                            if (rdDashboardPanelEditCancelDiv.outerHTML.indexOf('rdIgnore') != -1)
                                ShowElement(this.id, rdDashboardPanelCaptionDiv, 'Show');
                        }
                        else if (new XMLSerializer()) {
                            if (new XMLSerializer().serializeToString(rdDashboardPanelEditCancelDiv).indexOf('rdIgnore') != -1)
                                ShowElement(this.id, rdDashboardPanelCaptionDiv, 'Show');
                        }
                    }
                }
            } catch (e) { }

            this.rdPreventDragFromRename('rdDashboardPanelRename-' + sId);
        },

        rdGetRecursiveInputValues: function (eleParent, panelParameters) {
            for (var i = 0; i < eleParent.childNodes.length; i++) {
                var eleCurr = eleParent.childNodes[i];

                if ((eleCurr.nodeName) && ((eleCurr.nodeName.toLowerCase() === "shape") || (eleCurr.nodeName.toLowerCase() === '#text'))) {  //#22614.
                    break;
                }

                //24159 - save hierarchical ICL values to the DB save file too.
                if ((eleCurr.getAttribute("data-checkboxlist"))) {
                    sValue = eleCurr.id + "=" + rdGetSelectedValuesFromCheckboxList(eleCurr.id);
                    if (panelParameters.parameters.indexOf(sValue) < 0)
                        panelParameters.parameters += '&' + sValue;
                    var aPanelParameterIds = panelParameters.ids.split(":");
                    var bIdInArray = false;
                    for (var i = 0; i < aPanelParameterIds.length; i++) {
                        if (aPanelParameterIds[i] === eleCurr.id)
                            bIdInArray = true;
                    }
                    if (!bIdInArray)
                        panelParameters.ids += ":" + eleCurr.id;
                    break;
                }

                //Duplicate Id's being sent back with a ProServ's setup.
                if (!Y.Lang.isNull(eleCurr.id)) {
                    if (panelParameters.ids.indexOf(eleCurr.id) > -1 && eleCurr.id.length > 0) {
                        var aParamIds = panelParameters.ids.split(":")
                        var bBreakLoop = false
                        for (var j = 0; j < aParamIds.length; j++) {
                            var sParamId = aParamIds[j];
                            if (sParamId === eleCurr.id) {
                                bBreakLoop = true;
                                break;
                            }
                        }
                        if (bBreakLoop) {
                            continue;
                        }
                    }
                }
                switch (eleCurr.type) {
                    case 'hidden':
                    case 'text':
                    case 'email':
                    case 'number':
                    case 'tel':
                    case 'textarea':
                    case 'password':
                    case 'select-one':
                    case 'rdRadioButtonGroup':
                    case 'file':
                        var sValue = rdGetFormFieldValue(eleCurr);
                        panelParameters.parameters += '&' + eleCurr.name + "=" + rdAjaxEncodeValue(sValue);
                        panelParameters.ids += ":" + eleCurr.name;
                        break;
                    case 'select-multiple':
                        var selectedItems = new Array();
                        for (var k = 0; k < eleCurr.length; k++) {
                            if (eleCurr.options[k].selected) {
                                selectedItems[selectedItems.length] = eleCurr.options[k].value;
                            }
                        }
                        if (typeof window.rdInputValueDelimiter == 'undefined') {
                            window.rdInputValueDelimiter = ',';
                        }
                        var sValue = selectedItems.join(rdInputValueDelimiter);
                        panelParameters.parameters += '&' + eleCurr.name + "=" + rdAjaxEncodeValue(sValue);
                        panelParameters.ids += ":" + eleCurr.name;
                        break;
                    case 'checkbox':
                        if (eleCurr.checked) {
                            var sValue = rdGetInputValues(eleCurr);
                            //21205

                            if (panelParameters.parameters.indexOf(sValue) < 0)
                                panelParameters.parameters += sValue;

                            var aPanelParameterIds = panelParameters.ids.split(":");
                            var bIdInArray = false;
                            for (var i = 0; i < aPanelParameterIds.length; i++) {
                                if (aPanelParameterIds[i] === eleCurr.name)
                                    bIdInArray = true;
                            }
                            if (!bIdInArray)
                                panelParameters.ids += ":" + eleCurr.name;
                        }
                        break;
                    default:
                        if (eleCurr.getAttribute) {   //#14917.
                            if (eleCurr.getAttribute("type") == 'rdRadioButtonGroup') {
                                var sValue = rdGetFormFieldValue(eleCurr);
                                //RD19598. dont add duplicated radio button values...
                                if (panelParameters.ids.indexOf(eleCurr.getAttribute("name")) < 0) {
                                    panelParameters.parameters += '&' + eleCurr.getAttribute("name") + "=" + rdAjaxEncodeValue(sValue);
                                    panelParameters.ids += ":" + eleCurr.getAttribute("name");
                                }
                                break;
                            } else {
                                panelParameters = this.rdGetRecursiveInputValues(eleCurr, panelParameters);
                                break;
                            }
                        } else {
                            //Not an input element.
                            panelParameters = this.rdGetRecursiveInputValues(eleCurr, panelParameters);
                            break;
                        }
                }
            }

            return panelParameters;
        },

        rdRenameDashboardTab: function (bSaveOnEnterOptionalParam) {
            if (typeof bSaveOnEnterOptionalParam === 'undefined') {
                if (document.activeElement.id.indexOf('txtRenameTab') != -1) return; //#21118.
            }
            //Show the cog after editing the Tab name.
            var nodeTabSettingsCog = Y.one('#rdSettingsCog');
            nodeTabSettingsCog.setStyle("display", "");
            //Hide the textbox after editing is done.
            Y.one("#rdRenameTabDiv").setStyle("display", "none");

            var sTabID = document.getElementById("rdActiveTabId_rdDashboardTabs").value
            var eleTab = document.getElementById(sTabID)
            var eleRenameTxt = Y.one("#txtRenameTab").getDOMNode();
            var sNewName = eleRenameTxt.value
            var sOldName
            if (eleTab.textContent) {
                sOldName = eleTab.textContent
            } else {
                sOldName = eleTab.innerText //IE
            }
            var eleTabNameLabel = Y.one(eleTab).one('#rdCaption_' + sTabID).getDOMNode();
            if (sNewName.replace(/ /g, '').length == 0) {
                document.getElementById("txtRenameTab").value = sOldName
                return
            }
            //22432 - IE does not have the textContent attribute. Need to use innerText.
            if (eleTabNameLabel.textContent) {
                eleTabNameLabel.textContent = sNewName;
            } else {
                eleTabNameLabel.innerText = sNewName;
            }
            //Report the new name back to the server.
            var rdParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value
            rdParams += "&TabID=" + sTabID
            rdParams += "&NewName=" + rdAjaxEncodeValue(sNewName)
            bSubmitFormAfterAjax = true //13690
            this.rdClientSideEnableUndo();
            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=RenameDashboardTab' + rdParams);
            LogiXML.Dashboard.pageDashboard.rdPositiontabSettingsCog();
        },

        rdShowRenameTab: function () {
            var sTabID = document.getElementById("rdActiveTabId_rdDashboardTabs").value
            var eleTab = document.getElementById(sTabID)

            //Hide the cog when editing the Tab name.
            var nodeTabSettingsCog = Y.one('#rdSettingsCog');
            nodeTabSettingsCog.setStyle("display", "none");
            //Move the Rename text div over hte Tab caption label and set the width of the Span holding the text box.
            var nodeTabCaptionLabel = Y.one(eleTab).one("#rdCaption_" + sTabID);
            var nodeTab = Y.one(eleTab);
            var nodeRenameTabDiv = Y.one("#rdRenameTabDiv");
            nodeRenameTabDiv.setStyles({
                left: nodeTab.getX() + 5,
                top: nodeTabCaptionLabel.getY(),
                display: '',
                position: 'absolute',
                width: nodeTab.get("scrollWidth") - 20
            });
            //Now set the width of the text box.
            var nodeRenameTabText = Y.one('#txtRenameTab');
            nodeRenameTabText.setStyle("width", '100%');
            nodeRenameTabText.focus();
        },

        rdShowRenamePanel: function (sPanelElementID, sPanelInstanceID) {
            var nodePanel = Y.one(sPanelElementID);
            //Show the rename textbox div for editing.
            var nodeRenamePanelDiv = Y.one('#rdDashboardPanelRenameDiv-' + sPanelInstanceID);
            nodeRenamePanelDiv.setStyle('display', '');
            //Hide the Panel Caption Div.
            var nodePanelRenameCaptionDiv = Y.one('#rdDashboardPanelCaptionDiv-' + sPanelInstanceID);
            nodePanelRenameCaptionDiv.setStyle('display', 'none');
            //Hide the panel settings cog.
            var nodePanelSettingsCog = Y.one('#rdPanelSettingsCog_' + sPanelInstanceID);
            nodePanelSettingsCog.setStyle("display", "none");
            //set the focus in the text box.
            var nodeRenamePanelTextbox = Y.one('#rdDashboardPanelRename-' + sPanelInstanceID);
            nodeRenamePanelTextbox.focus();

            var txtRenamePanel = nodeRenamePanelTextbox.getDOMNode();
            if (txtRenamePanel.createTextRange) {
                var range = txtRenamePanel.createTextRange();
                range.move('character', txtRenamePanel.value.length);
                range.select();
            }
            else {
                txtRenamePanel.focus();
                txtRenamePanel.setSelectionRange(txtRenamePanel.value.length, txtRenamePanel.value.length);
            }

            Y.one('body').on('keydown', this.rdHandleRenameKeyDown);
        },

        rdHandleRenameKeyDown: function (e) {
            if (e && e.keyCode == 13) { 
                if (e.target.get('id').indexOf('rdDashboardPanelRename') > -1) {
                    e.preventDefault();
                    e.target.blur();
                }
            }
        },

        rdMoveDashboardTab: function (sDirection) {
            var sTabID = document.getElementById("rdActiveTabId_rdDashboardTabs").value
            var eleTab = document.getElementById(sTabID)
            var eleTabContentDiv = document.getElementById('rdTabPanel_' + sTabID)
            var bMoveOK = false
            switch (sDirection) {
                case 'Left':
                    var eleTabSibling = eleTab.previousSibling
                    var eleTabContentDivSibling = eleTabContentDiv.previousSibling
                    if (eleTabSibling && eleTabContentDivSibling) {
                        eleTab.parentNode.insertBefore(eleTab.parentNode.removeChild(eleTab), eleTabSibling)
                        eleTabContentDiv.parentNode.insertBefore(eleTabContentDiv.parentNode.removeChild(eleTabContentDiv), eleTabContentDivSibling)
                        bMoveOK = true
                    }
                    break;
                case 'Right':
                    var eleTabSibling = eleTab.nextSibling
                    var eleTabContentDivSibling = eleTabContentDiv.nextSibling
                    if (eleTabSibling && eleTabContentDivSibling) {
                        if (eleTabSibling.getAttribute("id") != "rdTabAddNewTab") { //Don't move past the "Add Tab".
                            if (eleTabSibling.nextSibling) {
                                eleTab.parentNode.insertBefore(eleTab.parentNode.removeChild(eleTab), eleTabSibling.nextSibling)
                                eleTabContentDiv.parentNode.insertBefore(eleTabContentDiv.parentNode.removeChild(eleTabContentDiv), eleTabContentDivSibling.nextSibling)
                                bMoveOK = true
                            } else {
                                eleTab.parentNode.appendChild(eleTab.parentNode.removeChild(eleTab))
                                eleTabContentDiv.parentNode.appendChild(eleTabContentDiv.parentNode.removeChild(eleTabContentDiv))
                                bMoveOK = true
                            }
                        }
                    }
                    break;
            }

            //Report the new name back to the server.
            if (bMoveOK) {
                var rdParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value
                rdParams += "&TabID=" + sTabID
                rdParams += "&Direction=" + sDirection
                this.rdClientSideEnableUndo();
                rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=MoveDashboardTab' + rdParams)
            }

        },

        rdMovePanelToTab: function (sPanelElementID, sTabID, eleDropZone) {
            var elePanel = document.getElementById(sPanelElementID)
            if (elePanel) {
                //Remove the panel and its drop zone.
                var eleDropZoneBelow = document.getElementById(sPanelElementID.replace("rdDashboardPanel", "rdDashboardDropZone"))
                elePanel.parentNode.removeChild(elePanel)
                if (eleDropZoneBelow)
                    eleDropZoneBelow.parentNode.removeChild(eleDropZoneBelow)

                //Reset the tab's class.
                if (!Y.Lang.isNull(eleDropZone.firstChild)) { //Do not do this for a Mobile Dashboard, #18814.
                    eleDropZone.firstChild.firstChild.firstChild.className = eleDropZone.firstChild.firstChild.firstChild.className.replace(" rdDashboardDropTabActive", "")
                }

                //Report the new name back to the server.
                var rdParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value
                rdParams += '&PanelInstanceID=' + this.rdGetPanelInstanceId(elePanel)
                rdParams += "&TabID=" + sTabID
                this.rdClientSideEnableUndo();
                rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=MoveDashboardPanelToTab' + rdParams)
            }
        },

        rdPositiontabSettingsCog: function (bDelayPositioning) {
            if (typeof bDelayPositioning != 'undefined') {
                setTimeout(this.rdPositiontabSettingsCog, 500);
                return;
            }
            var nodeSettingsCog = Y.one('#rdSettingsCog');

            if (!nodeSettingsCog) {
                return;   //There is no settings cog because this is a shared dashboard.
            }
            
            //Tab Settings Cog.
            var nodeActiveTab = Y.one(".selected");
            if (Y.Lang.isNull(nodeActiveTab)) {
                nodeSettingsCog.setStyle("display", "");
                return;
            }
            //Make the panels draggable.
            if (typeof (rdMobileReport) === 'undefined') { //No draggable tabs in mobile.
                nodeActiveTab.get("firstChild").setStyle("cursor", "move");
            }

            //Get Add Tab element to define DashboardTabs mode
            var nodeAddNewTabCog = Y.one('#rdAddTabCog');

            //Set positions for the cog and add-tab icons.
            var nRegionTop
            if (!Y.Lang.isNull(nodeActiveTab)) {
                var regionActiveTab = Y.DOM.region(nodeActiveTab.getDOMNode());
                if (typeof (rdMobileReport) == 'undefined') {
                    nodeSettingsCog.setStyles({
                        display: ''
                    });
                    var eleImg = nodeSettingsCog.one('img').getDOMNode()
                    var nRegionTop = eleImg.getAttribute('rdRegionTop')
                    var nExtraMarginLeft = eleImg.getAttribute('rdExtraMarginLeft')
                    var nodeSettingsCogRegion = Y.DOM.region(nodeSettingsCog.one('img').getDOMNode());
                    var regionTab = Y.DOM.region(Y.one('#rdTabs ul').getDOMNode())
                    if (nRegionTop == null) {
                        nRegionTop = nodeSettingsCogRegion.top
                        nExtraMarginLeft = nodeSettingsCogRegion.left - regionTab.left
                        eleImg.setAttribute('rdRegionTop', nRegionTop)  //Must be saved because the value is wrong after a panel remove.
                        eleImg.setAttribute('rdExtraMarginLeft', nExtraMarginLeft)
                    }

                    //if DashboardTabs is disabled, set static position for node setting element
                    if (Y.Lang.isNull(nodeAddNewTabCog)) {
                        nodeSettingsCog.setStyles({
                            'margin-left': 5,
                            'margin-top': 0,
                            position: 'absolute',
                        });
                    } else {
                        nodeSettingsCog.setStyles({
                            'margin-left': regionActiveTab.left + regionActiveTab.width - regionTab.left - nExtraMarginLeft - nodeSettingsCogRegion.width - 4,
                            'margin-top': regionActiveTab.top - nRegionTop + 4,
                            position: 'absolute',
                        });
                    }

                }
                else {
                    nodeSettingsCog.setStyles({
                        left: (regionActiveTab.left + regionActiveTab.width - 24),
                        top: (regionActiveTab.top + 4),
                        position: 'absolute',
                        display: ''
                    });
                }
            }
            //Add Tab icon.
            var TabsUl = Y.one('#rdTabs ul');
            if (!Y.Lang.isNull(nodeAddNewTabCog)) {
                nodeAddNewTabCog.setStyles({
                    display: ''
                });
                var tabsRegion = Y.DOM.region(TabsUl.getDOMNode());
                nodeAddNewTabCog.setStyles({
                    'margin-left': TabsUl.get("scrollWidth") + 15,
                    'margin-top': tabsRegion.top - nRegionTop,
                    position: 'absolute'
                });
            }
        },

        rdAddNewTab: function () {
            var Tabs = Y.one('#rdTabs-rdDashboardTabs').getData('tabs');
            document.getElementById('rdActiveTabIndex_rdDashboardTabs').value = '0';
            document.getElementById('rdActiveTabId_rdDashboardTabs').value = 'rdTabAddNewTab';
            var aHiddenTabValues = Y.all(Y.one('input[name=rdDashboardTabs]')); //#21257.
            for (i = 0; i < aHiddenTabValues.size() ; i++) {
                var nodeHiddenTabValue = aHiddenTabValues.item(i);
                if (typeof nodeHiddenTabValue.get('value') != 'undefined') {
                    nodeHiddenTabValue.set('value', 'rdTabAddNewTab');
                }
            }
            Tabs.TabsTarget().fire('selectedTabChanged');
            this.rdRefreshDashboard();
        },

        rdRefreshDashboard: function (callback) {
            var nodeDashboardId = Y.one('#DashboardIdentifier');
            var dashboardTabs = document.getElementById("rdActiveTabId_rdDashboardTabs");
            var sAjaxUrl;
            if (!Y.Lang.isNull(dashboardTabs)) {
                sAjaxUrl = "rdAjaxCommand=RefreshElement&rdRefreshElementID=" + nodeDashboardId.get("value") + ",rdDashboardTabs" + "&rdRefreshDashboard=True&rdReport=" + document.getElementById("rdDashboardDefinition").value + "&rdRequestForwarding=Form";
            } else {  //When no tabs.
                sAjaxUrl = "rdAjaxCommand=RefreshElement&rdRefreshElementID=" + nodeDashboardId.get("value") + ",rdDivDashboardpanels" + "&rdRefreshDashboard=True&rdReport=" + document.getElementById("rdDashboardDefinition").value + "&rdRequestForwarding=Form";
            }

            //Parse out WaitPage configuration
            var waitCfg = ['', '', '']
            var eleWaitCfg = document.getElementById("rdWaitCfg")
            if (eleWaitCfg) {
                try {
                    var sScript = LogiXML.getScriptFromLink(eleWaitCfg.parentElement);
                    if (sScript) {
                        waitCfg = eval(sScript.substr(0, sScript.indexOf("]") + 1));
                        if (sScript.indexOf("SubmitForm(") == 0)
                            return;
                    }
                }
                catch (e) { }
            }

            var afterRefresh = function () {
                LogiXML.Dashboard.pageDashboard.initializer({ reinitializing: true });

                if (typeof this.callback === "function")
                    this.callback();
            }.bind({
                callback: callback
            });

            LogiXML.Dashboard.pageDashboard.refreshing = true;
            rdAjaxRequest(sAjaxUrl, false, null, false, afterRefresh, waitCfg);

            // should be revisited , if NGP platform, refresh after adding panel
		    //if (window.Logi !== undefined)
		    if ((bIsNgpViz !== undefined && bIsNgpViz == true) && !window.Logi) {
		        var href = window.location.href;
				if (href && href.indexOf && href.indexOf('&rdNewBookmark=True' != -1)) {
					href = href.replace('&rdNewBookmark=True', '');
					window.location.replace(href);
				} else {
					window.location = window.location;
				}
		    }
        },

        rdAddDashboardPanels: function () {
            if (rdNewPanelCnt > 0) {
                rdNewPanelCnt = 0
                LogiXML.Dashboard.pageDashboard.rdRefreshDashboard();
            }
            //Remove Undo and Redo parameters for NGP-5369
            if (window.location.href.indexOf("&rdCommand=Undo") > -1) {
                window.location.href = window.location.href.replace("&rdCommand=Undo", "")
            }
            if (window.location.href.indexOf("&rdCommand=Redo") > -1) {
                window.location.href = window.location.href.replace("&rdCommand=Redo", "")
            }

            ShowElement(null, 'ppChangeDashboard', 'Hide');
        },

        rdAddRefreshEventForAddPanelsPopupCloseButton: function () {
            var nodeChangeDashboardPopup = Y.one('#ppChangeDashboard');
            var nodeCloseButton = nodeChangeDashboardPopup.all('#rdPopupPanelX').get("node")[0];
            if (typeof this.rdAddDashboardPanels === 'undefined') {
                nodeCloseButton.on('click', LogiXML.Dashboard.pageDashboard.rdAddDashboardPanels);
            } else {
                nodeCloseButton.on('click', this.rdAddDashboardPanels);
            }
        },

        rdShowAddDashboardPanels: function () {
            rdShowAddGalleryPanels(Y.one("#DashboardIdentifier").get("value"), document.getElementById("rdDashboardDefinition").value);
        },

        rdRefreshDashboardPanel: function (e, sPanelId) {
            var afterRefresh = function () {
                // panel is refreshed, re-initialize it
                LogiXML.Dashboard.pageDashboard.initializeDashboardPanel(this.sPanelId, null, true);
            }.bind({
                sPanelId: sPanelId
            });

            // refresh the panel and the global filter
            var sRefreshCommand = "rdAjaxCommand=RefreshElement&rdRefreshElementID="
                + sPanelId
                + ",rdGlobalAfContainer" // ,rdStopAjaxReplace," + document.getElementById('DashboardIdentifier').value
                + "&rdReport=" + document.getElementById("rdDashboardDefinition").value
                + "&rdRequestForwarding=Form&rdRefreshDashboard=True";

            rdAjaxRequest(sRefreshCommand, false, null, false, afterRefresh, ['', '', '', '0']);
        },

        rdAddRefreshEventForPanelEditPopupCloseButton: function (sDashboardPanelId, bAddRefreshEvent) {
            if (typeof bAddRefreshEvent === 'undefined' || bAddRefreshEvent === "") return;
            var nodePanelParamsPopup = Y.one('#' + sDashboardPanelId.replace('rdDashboardPanel-', 'ppPanelParams-'))
            var nodeCloseButton = nodePanelParamsPopup.all('#rdPopupPanelX').get("node")[0];
            if (typeof this.rdRefreshDashboardPanel === 'undefined') {
                nodeCloseButton.on('click', LogiXML.Dashboard.pageDashboard.rdRefreshDashboardPanel, null, sDashboardPanelId);
            } else {
                nodeCloseButton.on('click', this.rdRefreshDashboardPanel, null, sDashboardPanelId);
            }
        },

        rdSetDashboardColumns: function (sOptionalChangeLayout) {
            var sTabID = document.getElementById("ActiveTabIdentifier").value
            var eleTab = document.getElementById(sTabID)
            var eleColCnt = document.getElementById("lstColumnCount");

            var nColumnCount;
            if (eleColCnt)
                nColumnCount = eleColCnt.value;
            else
                nColumnCount = "Free-form";

            var nWideColumn = rdGetFormFieldValue(document.getElementById('rdRadioButtonGroupradWideColumn'))

            if (typeof sOptionalChangeLayout === 'undefined') {
                //Report the new column count back to the server.
                var rdParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value
                rdParams += "&TabID=" + sTabID
                rdParams += "&NewColumnCount=" + nColumnCount;//(nColumnCount == 'Free-form' ? 0 : nColumnCount);
                rdParams += "&NewWideColumn=" + nWideColumn
                rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SetDashboardTabColumns' + rdParams)
            }

            if (nColumnCount == 'Free-form') {   // Freeform Layout.
                document.getElementById('divFreeformPanels').style.display = ''
                var eleFreeformLayout = document.getElementById('rdFreeformLayout');
                if (eleFreeformLayout != null)
                    if (eleFreeformLayout.id.toLowerCase() == 'rdhiddenrequestforwarding')
                        eleFreeformLayout = null;   //#14758.
                if (eleFreeformLayout == null) {
                    eleFreeformLayout = document.createElement("INPUT");
                    eleFreeformLayout.setAttribute("TYPE", "HIDDEN")
                    eleFreeformLayout.setAttribute("ID", "rdFreeformLayout")
                    eleFreeformLayout.setAttribute("NAME", "rdFreeformLayout")
                    eleFreeformLayout.style.display = 'none';   //#14663.
                    eleTab.appendChild(eleFreeformLayout);
                }
                return;
            } else {
                var eleDivFreeformPanels = document.getElementById('divFreeformPanels');
                if (eleDivFreeformPanels) eleDivFreeformPanels.style.display = 'none';
                var eleFreeformLayout = document.getElementById('rdFreeformLayout');
                if (eleFreeformLayout) eleFreeformLayout.parentNode.removeChild(eleFreeformLayout);
            }

        },

        rdGetPanelInstanceId: function (elePanel) {
            //The instance ID is the  string after the last "-" from the ID.
            return elePanel.id.substr(elePanel.id.lastIndexOf("_") + 1)
        },

        rdRemoveDashboardParams: function () {
            //Don't pass on values from the dashboard paramers. They are only needed when saving params.13456
            var elePanelParams = document.getElementById("rdDashboardParams")
            while (elePanelParams) {
                elePanelParams.parentNode.removeChild(elePanelParams)
                elePanelParams = document.getElementById("rdDashboardParams")
            }
        },

        rdMoveMobileDashboardPanel: function (sDashboardPanelId, sChangePanelAction, sPopupPanelID) {
            // function to move the Mobile Dashboard Panels around.
            ShowElement(this.id, sPopupPanelID, 'Toggle');

            var elePanel = document.getElementById(sDashboardPanelId);
            var elePanelResizerAttr = elePanel.nextSibling;
            var elePanelDropZone = elePanelResizerAttr.nextSibling;

            var elePrecedingPanel = null, eleSuccedingPanel = null, eleSuccedingPanelResizerAttr = null, eleSuccedingPanelDropZone = null;

            if (elePanel.previousSibling != null) {
                if (elePanel.previousSibling.previousSibling != null) {
                    if (elePanel.previousSibling.previousSibling.previousSibling != null) {
                        elePrecedingPanel = elePanel.previousSibling.previousSibling.previousSibling;
                    }
                }
            }

            if (elePanel.nextSibling != null) {
                if (elePanel.nextSibling.nextSibling != null) {
                    if (elePanel.nextSibling.nextSibling.nextSibling != null) {
                        eleSuccedingPanel = elePanel.nextSibling.nextSibling.nextSibling;
                        eleSuccedingPanelResizerAttr = eleSuccedingPanel.nextSibling;
                        eleSuccedingPanelDropZone = eleSuccedingPanelResizerAttr.nextSibling;
                    }
                }
            }

            switch (sChangePanelAction) {
                case "MoveUp":
                    if (elePrecedingPanel != null) {
                        elePanelDropZone.parentNode.insertBefore(elePanelDropZone, elePrecedingPanel);
                        elePanelResizerAttr.parentNode.insertBefore(elePanelResizerAttr, elePanelDropZone);
                        elePanel.parentNode.insertBefore(elePanel, elePanelResizerAttr);
                        this.rdSaveDashboardOrder();
                        break;
                    }
                case "MoveDown":
                    if (eleSuccedingPanel != null) {
                        eleSuccedingPanelDropZone.parentNode.insertBefore(eleSuccedingPanelDropZone, elePanel);
                        eleSuccedingPanelResizerAttr.parentNode.insertBefore(eleSuccedingPanelResizerAttr, eleSuccedingPanelDropZone);
                        eleSuccedingPanel.parentNode.insertBefore(eleSuccedingPanel, eleSuccedingPanelResizerAttr);
                        this.rdSaveDashboardOrder();
                        break;
                    }
                case "Edit":
                    this.rdEditDashboardPanel(sDashboardPanelId);
                    break;
                case "Remove":
                    if (confirm("Are you sure?"))
                        this.rdRemoveDashboardPanel(sDashboardPanelId);
                    break;
                default:
                    this.rdMovePanelToTab(sDashboardPanelId, sChangePanelAction, elePanelDropZone);
                    break;
            }
        },

        rdNavigateBetweenDashboardTabs: function (sTabIdentifier, sPopupPanelID) {
            // function runs on picking a Tab from the Tabs menu.
            ShowElement(this.id, sPopupPanelID, 'Hide');
            document.getElementById('rdActiveTabIndex_rdDashboardTabs').value = '0';
            document.getElementById('rdActiveTabId_rdDashboardTabs').value = sTabIdentifier;    // Set this Value to the New Tab Id.
            var sReportName = document.getElementById('rdDashboardDefinition').value;
            SubmitForm('rdPage.aspx?rdReport=' + sReportName + '&rdRequestForwarding=Form', '', 'false');
        },

        rdShowChangePanelMenu: function (sPopupPanelID, sDashboardPanelId) {
            ShowElement(this.id, sPopupPanelID, 'Toggle');
            try {
                var elePopupPanel = document.getElementById(sPopupPanelID);
                var elePanel = document.getElementById(sDashboardPanelId);
                var elePanelPreviousSibling = elePanel.previousSibling;
                var elePanelNextSibling = elePanel.nextSibling.nextSibling.nextSibling;
                if (elePanelPreviousSibling.id.match('rdDashboardDropZone-0-0')) {
                    var eleOptionsList = elePopupPanel.getElementsByTagName('td')
                    for (i = 0; i < eleOptionsList.length; i++) {
                        var eleTD = eleOptionsList[i]
                        if (eleTD.outerHTML.match('MoveUp')) {
                            if (eleTD.getAttribute('id')) {
                                if (eleTD.getAttribute('id').match('rdDataMenuTable_Row'))
                                    eleTD.parentNode.style.display = 'none';
                            }
                        }
                    }

                } else {
                    var eleOptionsList = elePopupPanel.getElementsByTagName('td')
                    for (i = 0; i < eleOptionsList.length; i++) {
                        var eleTD = eleOptionsList[i]
                        if (eleTD.outerHTML.match('MoveUp')) {
                            if (eleTD.getAttribute('id')) {
                                if (eleTD.getAttribute('id').match('rdDataMenuTable_Row'))
                                    eleTD.parentNode.style.display = '';
                            }
                        }
                    }
                }

                if (!elePanelNextSibling) {
                    var eleOptionsList = elePopupPanel.getElementsByTagName('td')
                    for (i = 0; i < eleOptionsList.length; i++) {
                        var eleTD = eleOptionsList[i]
                        if (eleTD.outerHTML.match('MoveDown')) {
                            if (eleTD.getAttribute('id')) {
                                if (eleTD.getAttribute('id').match('rdDataMenuTable_Row'))
                                    eleTD.parentNode.style.display = 'none';
                            }
                        }
                    }

                } else {
                    var eleOptionsList = elePopupPanel.getElementsByTagName('td')
                    for (i = 0; i < eleOptionsList.length; i++) {
                        var eleTD = eleOptionsList[i]
                        if (eleTD.outerHTML.match('MoveDown')) {
                            if (eleTD.getAttribute('id')) {
                                if (eleTD.getAttribute('id').match('rdDataMenuTable_Row'))
                                    eleTD.parentNode.style.display = '';
                            }
                        }
                    }
                }
            }
            catch (e) { }
        },

        rdSizeUnAdjustablePanels: function (sClassSelector) {

            var aDashboardPanels = Y.Selector.query('.' + sClassSelector, Y.DOM.byId('rdDivDashboardpanels'))
            for (var i = 0; i < aDashboardPanels.length; i++) {
                var eleDashboardPanel = aDashboardPanels[i];
                //var nHeight = (eleDashboardPanel.offsetHeight - 4) + 'px';    // Substracting 4px to compensate the panel growth on every page request.
                //var nWidth = (eleDashboardPanel.offsetWidth - 4) + 'px';

                //eleDashboardPanel.style.height = nHeight
                //eleDashboardPanel.style.width = nWidth

                FreeForm.initializePanel(Y.one(eleDashboardPanel), null)

                //var elePanelTable = eleDashboardPanel.firstChild;
                //var elePanelTitle = document.getElementById(eleDashboardPanel.id.replace('rdDashboardPanel', 'rdDashboardPanelTitle'))
                //elePanelTitle.parentNode.removeChild(elePanelTitle);
                //var nTitleHeight = elePanelTitle.offsetHeight;
                //var elePanelParams =  elePanelTitle.nextSibling;
                //var nParamsHeight
                //if(elePanelParams.style.display == 'none'){
                //	nParamsHeight = 0;
                //}else{
                //	nParamsHeight = elePanelParams.offsetHeight;
                //}

                var eleContent = Y.one('#' + eleDashboardPanel.id.replace('rdDashboardPanel-', 'rdDashboard2PanelContent_')).getDOMNode();;
                eleContent.style.overflow = 'visible';
                //22474 - 'auto' caused scrollbars to be shown
                //eleContent.style.overflow = 'auto';

                //eleContent.style.width = (eleDashboardPanel.offsetWidth-10) + 'px';
                //var nContentHeight = (eleDashboardPanel.offsetHeight - nTitleHeight - nParamsHeight -10)
                //eleContent.style.height = (nContentHeight < 20 ? 20 : nContentHeight) + 'px';

                eleDashboardPanel.style.overflow = 'hidden';
            }
        },

        rdSetDashboardPanelOpacity: function (eleDashboardPanel, nOpacity) {

            var aDashboardPanels = Y.all('.rdDashboardPanel');
            for (var i = 0; i < aDashboardPanels.size() ; i++) {
                var elePnl = aDashboardPanels.item(i);
                if (elePnl.get('id') == eleDashboardPanel.get('id')) continue  // Do not change the opacity of the panel being moved.
                elePnl.setStyle('opacity', nOpacity);
            }
        },

        rdResizePanelContentOnEditCancelSave: function (e, objIDs) {
            if (document.getElementById('rdFreeformLayout') == null) return;    //#19294.
            var context = this;
            var eleContent = document.getElementById(objIDs[0]);
            var eleDashboardPanel = document.getElementById(objIDs[1]);
            var sAction = objIDs[2];
            var elePanelTable = eleDashboardPanel.firstChild;
            var elePanelTitle = elePanelTable.firstChild.firstChild;
            var nTitleHeight = elePanelTitle.offsetHeight;
            var elePanelParams = elePanelTitle.nextSibling;
            var nParamsHeight = 0;

            if (elePanelParams.style.display == 'none') {
                if (sAction == "Edit") {
                    setTimeout(function () { context.rdResizePanelContentOnEditCancelSave(e, objIDs) }, 10);
                    return;
                }
            } else {
                if (sAction == "Save" || sAction == "Cancel") {
                    setTimeout(function () { context.rdResizePanelContentOnEditCancelSave(e, objIDs) }, 10);
                    return;
                }
            }
            nParamsHeight = (navigator.appVersion.match('MSIE 8.0') != null ? elePanelParams.clientHeight : elePanelParams.offsetHeight);
            var nContentHeight = (eleContent.offsetHeight + nTitleHeight + nParamsHeight + 12); //#19106 Reverting changes from 18978 to fix
            eleDashboardPanel.style.height = (nContentHeight < 20 ? 20 : nContentHeight) + 'px';
            eleDashboardPanel.style.width = elePanelTable.offsetWidth + 'px'; //#18978.
            FreeForm.rdResizeDashboardContainer();
        },

        rdPreventDragFromRename: function (sRenameElementId) {
            var eleRename = document.getElementById(sRenameElementId)
            if (eleRename) {
                eleRename.onmousedown =
					function (e) {
					    e = e || window.event //Get the event object for all browsers
					    e.cancelBubble = true;
					    return true;
					}
            }
        },

        rdGetDbPanelHeight: function (eleObject) {
            return (eleObject.offsetParent ? (this.rdGetDbPanelHeight(eleObject.offsetParent) + eleObject.offsetTop) : eleObject.offsetTop);
        },

        rdSetAppletVisibility: function (sVis) {
            //Hide objects that will intefere with DnD.
            //applets
            var eleApplets = document.getElementsByTagName("applet")
            for (var i = 0; i < eleApplets.length; i++) {
                var eleApplet = eleApplets[i]
                eleApplet.style.visibility = sVis
            }
            //Flash with IE
            eleApplets = document.getElementsByTagName("object")
            for (var i = 0; i < eleApplets.length; i++) {
                var eleApplet = eleApplets[i]
                eleApplet.style.visibility = sVis
            }
            //Flash with Mozilla.
            eleApplets = document.getElementsByTagName("embed")
            for (var i = 0; i < eleApplets.length; i++) {
                var eleApplet = eleApplets[i]
                eleApplet.style.visibility = sVis
            }
        }

    }, {
        // Y.Dashboard properties
        /**
		 * The identity of the widget.
		 *
		 * @property Dasbhoard.NAME
		 * @type String
		 * @default 'Dashboard'
		 * @readOnly
		 * @protected
		 * @static
		 */
        NAME: 'dashboard',

        /**
		 * Static property used to define the default attribute configuration of
		 * the Widget.
		 *
		 * @property Dasboard.ATTRS
		 * @type {Object}
		 * @protected
		 * @static
		 */
        ATTRS: {
            //Id of the current drop zone
            rdDropZoneId: {},

            //Is this a freeform dashboard
            bIsFreeformLayout: {
                value: false
            },
            //Is this dashboard running on a touch device
            bIsTouchDevice: {
                value: LogiXML.features['touch']
            },
            bDashboardAdjustable: {
                value: true
            },
            zIndex: {
                value: 0
            }
        },
        rdResetDashboardPanelAfterDDScroll: function (elePnlDragged, posDashboardPanelFinalCoOrds) {

            var pnlDragged = Y.one(elePnlDragged);
            pnlDragged.setXY(posDashboardPanelFinalCoOrds);
        }
    });

}, '1.0.0', { requires: ['dd-drop-plugin', 'dd-plugin', 'dd-scroll', 'dashboard-freeform'] });

// region KPI's

var sColorPicker = '1';
var sPanelInstanceId = '';
var elePanel = null;
var eleParamsPopup = null;
var bIsNgpViz = false;

function GetColorPicker(sColorPickerValue, objImg) {
    sColorPicker = sColorPickerValue;
    eleParamsPopup = Y.Selector.ancestor(objImg, '[rdpopuppanel=True]', false);
    elePanel = Y.one('#' + eleParamsPopup.id.replace('ppPanelParams-', 'rdDashboardPanel-'));
    sPanelInstanceId = elePanel.get('id').substring(elePanel.get('id').lastIndexOf('_') + 1);
}

function PickGaugeGoalColor(colColor) {
    var sColor = Y.Color.toHex(Y.one('#' + colColor.id).getComputedStyle('backgroundColor'));
    var eleColorHolder = document.getElementById('rdAgGaugeGoalsColor' + sColorPicker + '_' + sPanelInstanceId);
    eleColorHolder.value = sColor;
    var elePickedColorIndicator = Y.Selector.query('#rectColor' + sColorPicker, eleParamsPopup, true);
    elePickedColorIndicator.style.backgroundColor = sColor;
    ShowElement(this.id, 'ppColors', 'Hide');
}

//End region

function rdSaveEditedAgViz(sReport, sVizType, sPanelID, sInstanceID, sBookmarkID) {
    if (!sPanelID)
        sPanelID = sInstanceID;

    //Hide the popup panel.
    var sPopupPanelId = "popupEditAgViz_" + sPanelID;

    ShowElement(null, sPopupPanelId, 'Hide');

    //Save the viz and request a panel refersh.
    var rdPanelParams = "&rdDashboardEditVizType=" + sVizType;
    rdPanelParams += "&rdReport=" + rdAjaxEncodeValue(sReport);
    rdPanelParams += "&rdDefInDataCache=True";
    rdPanelParams += "&PanelID=" + sPanelID;
    rdPanelParams += '&PanelInstanceID=' + sInstanceID
    switch (sVizType) {
        case "AnalysisChart":
            rdPanelParams += '&rdPanelContentElementID=rdDashboardEditAc'
            break;
        case "AxTable":
            rdPanelParams += '&rdPanelContentElementID=rdDashboardEditAx'
            break;
        case "AgTable":
            rdPanelParams += '&rdPanelContentElementID=rdDashboardEditAgTable'
            break;
    }
    rdPanelParams += '&rdBookmarkID=' + sBookmarkID;

    var afterSave = function () {
        // changes are saved, refresh the panel
        if (LogiXML.Dashboard.pageDashboard)
            LogiXML.Dashboard.pageDashboard.rdRefreshDashboardPanel(null, "rdDashboardPanel-" + this.sPanelID);
        else {
            var repAuth = Y.one(".rdReportAuthor");
            if (repAuth) {
                repAuth = repAuth.getData("rdReportAuthor");
                if (repAuth)
                    repAuth.refreshPanel(this.sPanelID);
            }
        }
    }.bind({
        sPanelID: sPanelID,
        sReport: sReport
    });

    // save changes
    rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveEditedAgViz' + rdPanelParams, null, null, null, null, afterSave, ['', '', '', '0']);
}

function rdAfTrimQuotes(s) {
    if (!s)
        return s;

    if (s.indexOf('"') != 0)
        return s;

    if (s.lastIndexOf('"') != s.length - 1)
        return s;

    if (s.length <= 2)
        return "";

    return s.substr(1, s.length - 2);
}

function rdDbSetGlobalFilterFromChart(sPanelInstanceID, sSelectionType, sDataColumnID, sDataColumnYID) {
    var sGlobalAfId = 'rdGlobalAf_' + document.getElementById('ActiveTabIdentifier').value

    switch (sSelectionType) {
        case "Categorized":
            //Categorized list of values.
            var eleValue = document.getElementById("rdFilteredXAxis_" + sPanelInstanceID)
            var sValue = eleValue.value
            rdAfSetGlobalFilter(true, sGlobalAfId, sPanelInstanceID, sDataColumnID, sValue, "In List")
            break
        case "Date Range":
            var eleValue = document.getElementById("rdFilteredXAxis_" + sPanelInstanceID)
            var aValues = eleValue.value.split(",")  //There may be any number of entries. Just want the first and last.
            var sValueMin = rdAfTrimQuotes(aValues[0]);
            var sValueMax = rdAfTrimQuotes(aValues[aValues.length - 1]);

            rdAfSetGlobalFilter(true, sGlobalAfId, sPanelInstanceID, sDataColumnID, sValueMin + "|" + sValueMax, "Date Range")
            break
        case "LinearX":
        case "LinearDate":
            var eleValueMin = document.getElementById("rdFilteredXAxisMin_" + sPanelInstanceID)
            var eleValueMax = document.getElementById("rdFilteredXAxisMax_" + sPanelInstanceID)
            if (eleValueMin && eleValueMax) {
                var sValueMin = rdAfTrimQuotes(eleValueMin.value);
                var sValueMax = rdAfTrimQuotes(eleValueMax.value);
                var sOperator = "Range"
                if (sSelectionType == 'LinearDate') {
                    sOperator = "Date Range"
                }
                rdAfSetGlobalFilter(true, sGlobalAfId, sPanelInstanceID, sDataColumnID, sValueMin + "|" + sValueMax, sOperator)
            }
            break
        case "LinearXY":
            var eleValueMin = document.getElementById("rdFilteredXAxisMin_" + sPanelInstanceID)
            var eleValueMax = document.getElementById("rdFilteredXAxisMax_" + sPanelInstanceID)
            if (eleValueMin && eleValueMax) {
                var sValueMin = rdAfTrimQuotes(eleValueMin.value);
                var sValueMax = rdAfTrimQuotes(eleValueMax.value);
                var sFilterOperator = "Range"
                if (sValueMin.indexOf("T") == 10) {sFilterOperator = "Date Range"}
                rdAfSetGlobalFilter(true, sGlobalAfId, sPanelInstanceID, sDataColumnID, sValueMin + "|" + sValueMax, sFilterOperator)
            }
            eleValueMin = document.getElementById("rdFilteredYAxisMin_" + sPanelInstanceID)
            eleValueMax = document.getElementById("rdFilteredYAxisMax_" + sPanelInstanceID)
            if (eleValueMin && eleValueMax) {
                var sValueMin = rdAfTrimQuotes(eleValueMin.value);
                var sValueMax = rdAfTrimQuotes(eleValueMax.value);
                setTimeout(function () { rdAfSetGlobalFilter(true, sGlobalAfId, sPanelInstanceID, sDataColumnYID, sValueMin + "|" + sValueMax, "Range") }, 1)  //REPDEV-20056
            }
            break
    }
}

function rdDashboardInterceptRefresh(commandParams, fnCallback) {
    if (!LogiXML.Dashboard.pageDashboard || LogiXML.Dashboard.pageDashboard.refreshing
        || LogiXML.getUrlParameter(commandParams, "rdAjaxCommand") != "RefreshElement")
        return null;

    var eleDashboardID = document.getElementById("DashboardIdentifier");
    if (!eleDashboardID)
        return null;

    var sDashboardID = eleDashboardID.value;
    if (!sDashboardID)
        return null;

    var sRefreshIDs = LogiXML.getUrlParameter(commandParams, "rdRefreshElementID");
    if (!sRefreshIDs)
        return null;

    var aRefreshIDs = sRefreshIDs.split(",");
    var bRefreshDashboard = false;
    var iLast = aRefreshIDs.indexOf("rdStopAjaxReplace");
    if (iLast < 0)
        iLast = aRefreshIDs.length - 1;
    else
        iLast -= 1;

    for (var i = iLast; i >= 0; i--) {
        if (aRefreshIDs[i] == sDashboardID) {
            bRefreshDashboard = true;
            aRefreshIDs.splice(i, 1);
        }
    }

    if (!bRefreshDashboard)
        return null;

    if (aRefreshIDs.length == 0) {
        // no other elements to refresh, just refresh the dashboard
        LogiXML.Dashboard.pageDashboard.rdRefreshDashboard(fnCallback);
        commandParams = null;
        fnCallback = null;
    } else {
        // refresh everything else now, then refresh the dashboard in the callback
        commandParams = LogiXML.setUrlParameter(commandParams, "rdRefreshElementID", aRefreshIDs.join(","));

        if (typeof fnCallback === "function") {
            // we already have a callback, call it after the dashboard is refreshed
            var origCallback = fnCallback;
            fnCallback = function () {
                LogiXML.Dashboard.pageDashboard.rdRefreshDashboard(this.origCallback);
            }.bind({
                origCallback: origCallback
            });
        } else {
            fnCallback = LogiXML.Dashboard.pageDashboard.rdRefreshDashboard;
        }
    }

    return {
        commandParams: commandParams,
        fnCallback: fnCallback
    };
}

function rdDbRefreshGlobalFilterHighlighting() {
    var eleGlobalFilterCaption = document.getElementById("rdGlobalFilterCaption");
    if (eleGlobalFilterCaption) {
        // remove previous values so we can rebuild with the new data
        // everything after the rdGlobalFilterCaption span can safely go
        for (var i = eleGlobalFilterCaption.parentNode.childNodes.length - 1; i >= 0; i--) {
            var child = eleGlobalFilterCaption.parentNode.childNodes[i];
            if (child === eleGlobalFilterCaption)
                break;
            child.parentNode.removeChild(child);
        }
    }

    // Remove the previous global filters text on each panel.
    var listPanels = Y.all("div[id^='rdDashboardPanel-']");  //Get all the panels.
    for (var k = 0; k < listPanels.size(); k++) {
        var nodePanel = listPanels.item(k);
        var elePanel = nodePanel._node;
        var elePanelGlobalFilterCaption = document.getElementById("rdPanelGlobalFilterCaption_" + Y.LogiInfo.Dashboard.prototype.rdGetPanelInstanceId(elePanel));
        if (elePanelGlobalFilterCaption) {
            elePanelGlobalFilterCaption.innerText = "";
            elePanelGlobalFilterCaption.parentNode.parentNode.style.display = "none";
        }
    }

    rdDbEnableGlobalFilterHighlighting();
}

function rdDbEnableGlobalFilterHighlighting() {
    var eleGlobalFilterCaption = document.getElementById("rdGlobalFilterCaption")

    //Get the list of Filter columns 'span' elements already created, avoid replication.
    var listCurrentSpanNodes
    var aGlobalFilterCaptions
    if (eleGlobalFilterCaption) {
        listCurrentSpanNodes = eleGlobalFilterCaption.parentNode.getElementsByTagName("SPAN");        
        aGlobalFilterCaptions = eleGlobalFilterCaption.innerText.split(",")
    }    
    var bSpanAlreadyExists = false;

    var listGlobaFilterDataColumns = Y.all("span[id^='lblFilterDataColumn_rdGlobalAf']");
    var listGlobalFilterCaptions = Y.all("span[id^='lblFilterCaption_rdGlobalAf']");
    var listGlobalFilterCheckBoxes = Y.all("input[id^='rdAfFilterDisabled_rdGlobalAf']");
    var j = 0;
    //Each is the data column for a global filter.
    for (var i = 0; i < listGlobaFilterDataColumns.size() ; i++) {
        var eleFilterDataColumn = listGlobaFilterDataColumns.item(i)._node
        var sDataColumn = eleFilterDataColumn.innerText
        var eleFilterFromPanelID = document.getElementById(eleFilterDataColumn.id.replace("lblFilterDataColumn_", "lblFilterDashboardPanelID_"))
        var sFilterFromPanelID = eleFilterFromPanelID.innerText
        
        var eleFilterCaption = listGlobalFilterCaptions.item(i)._node
        eleFilterCaption.setAttribute('rdFilterColumn', sDataColumn)
        eleFilterCaption.setAttribute('rdFilterPanelID', sFilterFromPanelID)
        eleFilterCaption.onmouseover = function () { rdDbHighlightFilteredPanel(this) }
        eleFilterCaption.onmouseout = function () { rdDbUnHighlightFilteredPanels(this) }   

        bSpanAlreadyExists = rdDoesSpanExist(eleFilterCaption.innerText, listCurrentSpanNodes)

        // is a filter being removed? dont add the caption element
        var eleGlobalFilterCheckbox
        if (listGlobalFilterCheckBoxes && listGlobalFilterCheckBoxes.item(i)) {
            eleGlobalFilterCheckbox = listGlobalFilterCheckBoxes.item(i)._node
            if (eleGlobalFilterCheckbox && !(eleGlobalFilterCheckbox.checked)) {
                bSpanAlreadyExists = true;
            }
        }

        // dont add a span if the column already exists in the global filter. the filter list gets replicated everytime otherwise.
        if (bSpanAlreadyExists == false) {

            var sCondSeperator = ""

            //Rewrite the global filter caption so that each filter in the caption highlights panels.  Each part becomes a span.
            if (j > 0) {
                var eleSeperator = eleGlobalFilterCaption.parentNode.appendChild(document.createElement("SPAN"))
                eleSeperator.innerText = ", "
                // add the conditional seperator like 'or' if it exists.
                if (aGlobalFilterCaptions && aGlobalFilterCaptions[i]) {
                    sCondSeperator = aGlobalFilterCaptions[i].substring(0, aGlobalFilterCaptions[i].indexOf("["))
                    eleSeperator.innerText += sCondSeperator;
                }
            }

            var eleFilterCaption = eleGlobalFilterCaption.parentNode.appendChild(document.createElement("SPAN"))
            var sFilterCaption = listGlobaFilterDataColumns.item(i).get('parentNode').all("span[id^='lblFilterCaption_rdGlobalAf']").item(0)._node.innerText
            eleFilterCaption.innerText = sFilterCaption
            eleFilterCaption.setAttribute('rdFilterColumn', sDataColumn)
            eleFilterCaption.setAttribute('rdFilterPanelID', sFilterFromPanelID)
            eleFilterCaption.onmouseover = function () { rdDbHighlightFilteredPanel(this) }
            eleFilterCaption.onmouseout = function () { rdDbUnHighlightFilteredPanels(this) }

            //Add the global filters' text to each panel.
            var listPanels = Y.all("div[id^='rdDashboardPanel-']");  //Get all the panels.
            for (var k = 0; k < listPanels.size() ; k++) {
                var elePanel = listPanels.item(k)._node
                var elePanelFilterColumns = listPanels.item(k).one("span[class='rdGlobalFilterColumnIDsClass']")  //Get columns for the current panel.
                if (elePanelFilterColumns) {
                    elePanelFilterColumns = elePanelFilterColumns._node
                    var sPanelColumns = elePanelFilterColumns.innerText
                    var aPanelColumns = sPanelColumns.split(",")
                    if (aPanelColumns.indexOf(sDataColumn) != -1) {
                        if (sFilterFromPanelID == "" || elePanel.id.indexOf(sFilterFromPanelID) == -1) {
                            //Filtered.
                            var elePanelGlobalFilterCaption = document.getElementById("rdPanelGlobalFilterCaption_" + Y.LogiInfo.Dashboard.prototype.rdGetPanelInstanceId(elePanel))
                            var sSeperator = ""
                            if (elePanelGlobalFilterCaption.innerText.length > 0) {
                                sSeperator = ", "
                            }
                            elePanelGlobalFilterCaption.innerText += sSeperator + sCondSeperator + sFilterCaption
                            elePanelGlobalFilterCaption.parentNode.parentNode.style.display = ""
                        }
                    }
                }
            }
            //Done with setting global filter text.

            j += 1; // increment the FilterCaption count.
        }      

        //Reset the already exists tag
        bSpanAlreadyExists = false
    }

    if (eleGlobalFilterCaption) {
        setTimeout(function () { eleGlobalFilterCaption.innerText = "" }, 1);
    }       
}

function rdDoesSpanExist(sCurrentFilterCaption, listCurrentSpanNodes) {    
    for (var i = 0; i < listCurrentSpanNodes.length ; i++) {
        if (listCurrentSpanNodes[i].getAttribute('id') == "rdGlobalFilterCaption") {
            continue;
        }
        var eleSpanCaption = listCurrentSpanNodes[i].getAttribute('innerText')
        var sSpanInnerText = listCurrentSpanNodes[i].innerText
        if (eleSpanCaption == sCurrentFilterCaption) {
            return true;
        }
        //this is to account for panel filter interaction, keeps doubling the global filter caption every time the cog is clicked.
        if (sSpanInnerText && sSpanInnerText == sCurrentFilterCaption) {
            return true;
        }
    }
    return false;
}

function rdDbHighlightFilteredPanel(eleHovered) {
    eleHovered.style.transition = "border-color 0.2s"
    eleHovered.className = "rdDashboardCaptionGlobalFiltered"
    //Make unrelated filters semi-transparent.
    var sHoveredFilterColumn = eleHovered.getAttribute('rdFilterColumn')
    var sHoveredFilterPanelID = eleHovered.getAttribute('rdFilterPanelID')
    var listPanels = Y.all("div[id^='rdDashboardPanel-']");  //Get all the panels.
    for (var i = 0; i < listPanels.size() ; i++) {
        var elePanel = listPanels.item(i)._node
        var elePanelFilterColumns = listPanels.item(i).one("span[class='rdGlobalFilterColumnIDsClass']")  //Get columns for the current panel.
        if (elePanelFilterColumns) {
            elePanelFilterColumns = elePanelFilterColumns._node
            var sPanelColumns = elePanelFilterColumns.innerText
            var aPanelColumns = sPanelColumns.split(",")
            if (aPanelColumns.indexOf(sHoveredFilterColumn) != -1) {
                if (sHoveredFilterPanelID == "" || elePanel.id.indexOf(sHoveredFilterPanelID) == -1) {
                    //Filtered.
                    elePanel.style.transition = "border-color 0.2s"
                    elePanel.className += " rdDashboardPanelGlobalFiltered"
                }
            }
        }
    }
}

function rdDbUnHighlightFilteredPanels(eleHovered) {
    eleHovered.className = ""

    var listPanels = Y.all("div[id^='rdDashboardPanel-']");
    for (var i = 0; i < listPanels.size() ; i++) {
        var elePanel = listPanels.item(i)._node
        elePanel.className = elePanel.className.replace(" rdDashboardPanelGlobalFiltered","")
    }
}
 

YUI.add('dashboard-freeform', function (Y) {

    var FreeForm = Y.namespace('LogiXML.Dashboard.FreeForm'),
        DASHBOARD_CHART_MARKER = 'dashboardChart',

	getContentWidth = function (node) {
	    node = Y.one(node);

	    if (Y.Lang.isValue(node)) {
	        return getContentDimension(node, 'w');
	    }
	    else {
	        return NaN;
	    }
	},

	getContentHeight = function (node) {
	    node = Y.one(node);

	    if (Y.Lang.isValue(node)) {
	        return getContentDimension(node, 'h');
	    }
	    else {
	        return NaN;
	    }
	},

    isInlineElement = function (htmlElement) {
        var displayStyle;
        if (window.getComputedStyle) {
            displayStyle = window.getComputedStyle(htmlElement, null).getPropertyValue('display');
        } else {
            displayStyle = htmlElement.currentStyle.display;
        }

        return displayStyle == "inline";
    },

	getContentDimension = function (node, dimension) {
	    dimension = dimension.toLowerCase();
	    if (dimension === 'w' || dimension === 'width') {
	        return node.get('clientWidth') - parseInt(node.getComputedStyle('paddingLeft'), 10) - parseInt(node.getComputedStyle('paddingRight'), 10);
	    }
	    else if (dimension === 'h' || dimension === 'height') {
	        return node.get('clientHeight') - parseInt(node.getComputedStyle('paddingTop'), 10) - parseInt(node.getComputedStyle('paddingBottom'), 10);
	    }
	    return NaN;
	};

    FreeForm.initializePanelResizer = function (panel) {
        var panelNode = Y.one(panel),
			resizeAttributes = Y.one('#rdResizerAttrs_' + panelNode.get('id')),
			resizer, charts;

        // Ignore calls made with no Resize options
        if (!Y.Lang.isValue(resizeAttributes)) {
            return;
        }

        // How many charts are within the panel?
        charts = panelNode.all('img.dashboardChart,div.rdChartCanvas');

        // Initialize resizer
        resizer = Y.rdResize.AddYUIResizerHandles(panelNode.get('id'), resizeAttributes)

        // Store an instance of the Panel's resizer for use later if Panel is refreshed after changing Panel Parameters
        panelNode.setData('resizer', resizer);

        FreeForm.initializePanel(panelNode, resizer);
        // Multiple charts/No Charts = no chart resizing
        // One chart = chart resizing
        FreeForm.addResizeEventHandlers(resizer, panelNode, charts.size() === 1);
    };

    FreeForm.initializePanel = function (panelNode, resizerInstance) {
        // How many charts are within the panel?
        var charts = panelNode.all('img.dashboardChart,div.rdChartCanvas'),
			resizer = resizerInstance || panelNode.getData('resizer');

        // Multiple Charts
        if (charts.size() !== 1) {
            FreeForm._initializeMultiContentPanel(panelNode, charts);
        }
            // Single Chart
        else {
            FreeForm._initializeSingleChartPanel(panelNode, charts.item(0), resizer);
        }

        charts.each(function (chartNode) {
            //#18513 The chart needs to initialize after ajax refresh
            LogiXML.Ajax.AjaxTarget().on('reinitialize', Y.bind(FreeForm._reinitializeChart, this, '#' + chartNode.get('id'), '#' + panelNode.get('id')));
        }, this);

        var ngpVisualization = panelNode.one('.rdLogiVisualization logi-visualization,.rdLogiVisualization logi-crosstab-table');
        if (ngpVisualization) {
            FreeForm.resizeVisualizationToFitPanel(panelNode, ngpVisualization);
        }
    };

    FreeForm.bNeedsResizing = function (chartNode, panelNode) {
        if (!chartNode || !panelNode || !Y.one('#rdFreeformLayout'))
            return false;

        if (chartNode.hasClass("rdChartCanvas") && !Y.Lang.isValue(chartNode.getData('rdChartCanvas')))
            return true;

        var imgSrc = chartNode.get('src');
        if (imgSrc && imgSrc.indexOf("rd1x1Trans.gif") != -1)
            return true;

        return false;
    };

    FreeForm._reinitializeChart = function (chartPointer, panelPointer) {
        if (LogiXML.Dashboard.pageDashboard.refreshing || LogiXML.Dashboard.pageDashboard.get("bIsFreeformLayout") === false)
            return LogiXML.Ajax.AjaxTarget().detach('reinitialize', arguments.callee);

        // Load real chart image
        var chartNode = Y.one(chartPointer);
        var panelNode = Y.one(panelPointer);

        if (!FreeForm.bNeedsResizing(chartNode, panelNode))
            return;

        // Resize chart and load it
        FreeForm.resizeChartToFitPanel(panelNode, chartNode);

        // Add chart as target for resize event, otherwise things like InputChart and HoverHighlight won't work
        if (typeof panelNode.getData('resizer') != 'undefined') {
            panelNode.getData('resizer').addTarget(chartNode);
        }
    };

    FreeForm._initializeChartImage = function (chartNode, availableWidth, availableHeight) {
        // Request new chart with those dimensions
        var chartURL = chartNode.get('src');
        if (chartURL) {
            chartURL = chartURL.replace('rdTemplate/rd1x1Trans.gif', 'rdTemplate/rdChart2.aspx');
            if (Y.Lang.isValue(availableWidth) && Y.Lang.isValue(availableHeight)) {
                chartURL = chartURL + '&rdResizeWidth=' + availableWidth + '&rdResizeHeight=' + availableHeight;

            }
            chartNode.set('src', chartURL);
        }
    };

    FreeForm._isFirstPanelLoad = function (panelNode) {
        var domStyle = panelNode.getDOMNode().style;
        return domStyle.width === '' && domStyle.height === '';
    };

    FreeForm._initializeSingleChartPanel = function (panelNode, chartNode, resizer) {
        var firstLoad = FreeForm._isFirstPanelLoad(panelNode);

        // Is this first time panel was added to dashboard?
        if (firstLoad) {
            // After chart loads, save position and size of panel for next render
            chartNode.once('load', function () {
                // No resize needed, but this constrains the Panel Body in prep for resizing
                FreeForm.resizePanelBodytoFitPanel(panelNode);

                // PanelBody is properly sized now, but the Panel doesn't have dimensions set.
                // Set dimensions so layout is properly saved.
                var resizeAttributes = Y.one('#rdResizerAttrs_' + panelNode.get('id'))
                if (panelNode.get('offsetWidth') < resizeAttributes.getAttribute("rdMinWidth")) {
                    panelNode.setStyle("width", resizeAttributes.getAttribute('rdMinWidth'));
                } else {
                    panelNode.setStyle('width', panelNode.get('offsetWidth'));
                }
                if (panelNode.get('offsetHeight') < resizeAttributes.getAttribute("rdMinHeight")) {
                    panelNode.setStyle("height", resizeAttributes.getAttribute('rdMinHeight'));
                } else {
                    panelNode.setStyle('height', panelNode.get('offsetHeight'));
                }

                FreeForm.rdSaveFreeformLayoutPanelPosition('rdDivDashboardpanels');
            });

            // Load real chart image
            FreeForm._initializeChartImage(chartNode);

            // Remove the 100% width, use real width/height now
            chartNode.removeAttribute('width');
        }
            // Otherwise resize chart to panel
        else {
            // Constrain Panel Body to Panel
            FreeForm.resizePanelBodytoFitPanel(panelNode);

            // Resize chart and load it
            FreeForm.resizeChartToFitPanel(panelNode, chartNode);

            FreeForm.rdResizeDashboardContainer();
        }

        // Add chart as target for resize event, otherwise things like InputChart and HoverHighlight won't work
        if (typeof resizer != 'undefined') {
            resizer.addTarget(chartNode);
        }
    };

    FreeForm._initializeMultiContentPanel = function (panelNode, charts) {
        // We can only resize one Chart inside a Panel, so load charts like normal
        var firstLoad = FreeForm._isFirstPanelLoad(panelNode);
        // Constrain panel content to size dictated by saved dimensions
        if (!firstLoad) {
            // Constrain Panel Body to Panel
            FreeForm.resizePanelBodytoFitPanel(panelNode);
        }
        // Load the real charts
        charts.each(function (chartNode) {

            if (firstLoad) {
                // After each chart loads, adjust size of DashboardContainer
                chartNode.once('load', function () {
                    var resizeAttributes = Y.one('#rdResizerAttrs_' + panelNode.get('id'))
                    if (panelNode.get('offsetWidth') < resizeAttributes.getAttribute("rdMinWidth")) {
                        panelNode.setStyle("width", resizeAttributes.getAttribute('rdMinWidth'));
                    } else {
                        panelNode.setStyle('width', panelNode.get('offsetWidth'));
                    }
                    if (panelNode.get('offsetHeight') < resizeAttributes.getAttribute("rdMinHeight")) {
                        panelNode.setStyle("height", resizeAttributes.getAttribute('rdMinHeight'));
                    } else {
                        panelNode.setStyle('height', panelNode.get('offsetHeight'));
                    }
                    FreeForm.rdResizeDashboardContainer();
                });
            }

            FreeForm._initializeChartImage(chartNode);

            // Remove the 100% width, use real width/height now
            chartNode.removeAttribute('width');
        });

        if (charts.isEmpty()) {
            FreeForm.rdResizeDashboardContainer();
        }
    };

    FreeForm.addResizeEventHandlers = function (resizer, panelNode, resizeChart) {
        resizer.on('resize:start', FreeForm.onPanelResizeStart, this, panelNode, resizeChart, resizer);
        resizer.on('resize:resize', FreeForm.onPanelResize, this, panelNode, resizeChart, resizer);
        resizer.on('resize:end', FreeForm.onPanelResizeEnd, this, panelNode, resizeChart, resizer);
    };

    /**
	 * panel - id, YUI node, or DOM node
	 * chart - id, YUI node, or DOM node
	 */
    FreeForm.resizeChartToFitPanel = function (panel, chart) {
        var chartNode = Y.one(chart),
			panelNode = Y.one(panel),
            panelBody = panelNode.one('.panelBody'), childNodes, availableWidth, availableHeight;

        // Make sure chart is part of dashboard and it's an actual image
        if ((!chartNode.hasClass(DASHBOARD_CHART_MARKER) || chartNode.get('tagName') !== 'IMG') && !chartNode.hasClass("rdChartCanvas")) {
            return;
        }

        var charts = panelNode.all('img.dashboardChart,div.rdChartCanvas');
        childNodes = panelNode.get('children');

        //Get debug image node if there is one
        var debugNode = Y.one('#rdDebugChart');

        //Get chartfx wrapper from chartnode (should always be direct parent)
        var chartfx = chartNode.ancestor();

        //Check to make sure that we only have one chart -- if we don't we shouldn't be in this method
        if (charts.size() == 1) {

            //Make chart size of entire panel to start -- sets correctly if the chart is the only content in panel, but too big otherwise
            //This is to allow us to find out how much space the other content occupies in the panel
            availableHeight = panelBody.get('clientHeight');
            availableWidth = panelBody.get('clientWidth');

            //Have to manually adjust for debug image if it is present (due to its absolute positioning)
            if (Y.Lang.isValue(debugNode) && debugNode.get('tagName') === 'IMG')
                availableHeight = availableHeight - 30;

            var lstElementsToExclude = ['.rdBookmarkLinkbackContainer'],
                elementToExclude;
            for (var i = 0; i < lstElementsToExclude.length; i++) {
                elementToExclude = panel.one(lstElementsToExclude[i]);
                if (elementToExclude) {
                    var domExcludeElement = elementToExclude.getDOMNode();
                    if (isInlineElement(domExcludeElement)) {
                        var excludeElementRect = domExcludeElement.getBoundingClientRect();
                        availableHeight -= (excludeElementRect.top - excludeElementRect.bottom);
                    } else {
                        availableHeight -= elementToExclude.get('clientHeight');
                    }
                }
            }

            //Set chart minimums in case the area is very small
            if (availableHeight <= 5)
                availableHeight = 5;
            if (availableWidth <= 5)
                availableWidth = 5;

            //24513 - 1 hide highcharts tooltips before measuring (it may adds not necessary width for scrolls)
            FreeForm.hideOrShoeChartCanvasTooltips(panelBody, false);

            //Resize chart -- set width and height to match offset width/height (have to do both)
            chart.set('width', availableWidth);
            chart.set('height', availableHeight);
            chart.set('offsetWidth', availableWidth);
            chart.set('offsetHeight', availableHeight);

            //If chart has an fx wrapper, it has to be resized too
            if (chartfx.hasClass('chartfx-wrapper')) {
                chartfx.set('offsetWidth', availableWidth);
                chartfx.set('offsetHeight', availableHeight);
            }

            //Add scrollbars
            panelBody.setStyle('overflow', 'scroll');
            availableHeight = availableHeight - (panelBody.get('scrollHeight') - panelBody.get('clientHeight'));


            if (availableHeight <= 5)
                availableHeight = 5;

            chart.set('height', availableHeight);
            chart.set('offsetHeight', availableHeight);

            if (chartfx.hasClass('chartfx-wrapper'))
                chartfx.set('offsetHeight', availableHeight);
            availableWidth = availableWidth - (panelBody.get('scrollWidth') - panelBody.get('clientWidth'));

            if (availableWidth <= 5)
                availableWidth = 5;

            if (!chartNode.hasClass("rdChartCanvas")) {
                //Set dimensions - dimensions should be current height/width - any overflow that we have
                chart.set('width', availableWidth);
                chart.set('offsetWidth', availableWidth);

                if (chartfx.hasClass('chartfx-wrapper'))
                    chartfx.set('offsetWidth', availableWidth);

                //Draw a new chart with the correct dimensions
                var dashboardContainer = chart, chartUrl, urlPieces, urlParameters, urlParametersObject;
                chartUrl = chart.get('src');
                urlPieces = chartUrl.split('?');

                // Parse parameters from URL and turn into object
                urlParameters = urlPieces[1];
                urlParametersObject = Y.QueryString.parse(urlParameters);


                //If the URL already has the resize dimension, the image has already been initialized
                if (urlParametersObject.hasOwnProperty('rdResizeWidth')) {
                    urlParametersObject['rdResizeWidth'] = availableWidth;
                    urlParametersObject['rdResizeHeight'] = availableHeight;

                    // Rebuild URL with adjusted parameters
                    chartUrl = urlPieces[0] + '?' + Y.QueryString.stringify(urlParametersObject);

                    // Get new chart with adjusted width/height
                    chart.set('src', chartUrl);
                }

                else {
                    //We need to initialize the image
                    FreeForm._initializeChartImage(chart, availableWidth, availableHeight);
                }
            } else {
                //ChartCanvas
                if (Y.Lang.isValue(chart.getData('rdChartCanvas'))) {
                    chart.fire('setSize', { width: availableWidth, height: availableHeight, finished: true, notify: false });
                } else {
                    //object is not yet created. just set attributes
                    chart.setAttribute("data-width", availableWidth);
                    chart.setAttribute("data-height", availableHeight);
                }
            }
            //Get rid of the scroll bars
            panelBody.setStyle('overflow', 'hidden');
            //24513 - 2 show tooltips after measuring of panel body width;
            FreeForm.hideOrShoeChartCanvasTooltips(panelBody, true);
        }
    };

    FreeForm.resizeVisualizationToFitPanel = function (panel, chart) {
        var chartNode = Y.one(chart),
			panelNode = Y.one(panel),
            panelBody = panelNode.one('.panelBody'), availableWidth, availableHeight;

        var bIsNgpViz = (panel.get('id') || "").indexOf('NGPviz') >= 0;

        //Get debug image node if there is one
        var debugNode = panelNode.one('#rdDebugChart');

        //Make chart size of entire panel to start -- sets correctly if the chart is the only content in panel, but too big otherwise
        //This is to allow us to find out how much space the other content occupies in the panel
        availableHeight = panelBody.get('clientHeight');
        availableWidth = panelBody.get('clientWidth');

        //Have to manually adjust for debug image if it is present (due to its absolute positioning)
        if (Y.Lang.isValue(debugNode) && debugNode.get('tagName') === 'IMG')
            availableHeight = availableHeight - debugNode.get('offsetWidth');

        //REPDEV - 20040 recalculate available height without label captions
        var lstElements = ['.rdDashboardFilterCaption', '.rdDashboardGlobalFilterCaption', '.rdDrillFilterCaption'],
              elementToExclude;
        for (var i = 0; i < lstElements.length; i++) {
            elementToExclude = panel.one(lstElements[i]);
            if (elementToExclude && elementToExclude.one('span').get('innerHTML')) {
                availableHeight = availableHeight - elementToExclude.get('offsetHeight') - 2;
            }
        }

        //Set chart minimums in case the area is very small
        if (availableHeight <= 5)
            availableHeight = 5;
        if (availableWidth <= 5)
            availableWidth = 5;

        //24513 - 1 hide highcharts tooltips before measuring (it may adds not necessary width for scrolls)
        FreeForm.hideOrShoeChartCanvasTooltips(panelBody, false);

        //Resize chart -- set width and height to match offset width/height (have to do both)
        chart.set('width', availableWidth);
        chart.set('height', availableHeight);
        chart.set('offsetWidth', availableWidth);
        chart.set('offsetHeight', availableHeight);

        //Add scrollbars
        panelBody.setStyle('overflow', 'scroll');

        if (!bIsNgpViz)
            availableHeight = availableHeight - (panelBody.get('scrollHeight') - panelBody.get('clientHeight'));

        if (availableHeight <= 5)
            availableHeight = 5;

        chart.set('height', availableHeight);
        chart.set('offsetHeight', availableHeight);

        if (!bIsNgpViz)
            availableWidth = availableWidth - (panelBody.get('scrollWidth') - panelBody.get('clientWidth'));

        if (availableWidth <= 5)
            availableWidth = 5;
        if (chart.get('tagName') === 'LOGI-VISUALIZATION' || chart.get('tagName') === 'LOGI-CROSSTAB-TABLE') {

            Y.LogiXML.rdLogiVisualization.resize(chart, availableWidth, availableHeight, 'px', 'px');
            //set flag to parend node (avoid double resizing for panelFitToChart
            chart.get('parentNode').setAttribute('data-skip-initial-resizing', 'true');

            if (bIsNgpViz) {
                chart.get('parentNode').setStyle('width', availableWidth);
                chart.get('parentNode').setStyle('height', availableHeight);

                chart.get('parentNode').get('parentNode').setStyle('width', availableWidth);
                chart.get('parentNode').get('parentNode').setStyle('height', availableHeight);

                var visualizationId = chart.get("id");
                if (window.Logi && window.Logi.Platform && visualizationId) {
                    var visualization = window.Logi.Platform.select("#" + visualizationId);
                    if (visualization && visualization.setSize)
                        visualization.setSize(availableWidth, availableHeight);
                }
            }
        }
        //Get rid of the scroll bars
        panelBody.setStyle('overflow', 'hidden');
        FreeForm.hideOrShoeChartCanvasTooltips(panelBody, true);
    };

    FreeForm.hideOrShoeChartCanvasTooltips = function (panel, show) {
        if (!panel) {
            return;
        }
        var chartCanvasTooltips = panel.all('.highcharts-tooltip'),
            i = 0, length = chartCanvasTooltips.size();
        for (i = 0; i < length; i++) {
            if (show) {
                chartCanvasTooltips.item(i).show();
            } else {
                chartCanvasTooltips.item(i).hide();
            }
        }
    };

    /*
	 * Update size of PanelConent Div(body) to reflect changes in Panel container
	 * <DIV id="rdDashboardPanel-..." class="rdDashboardPanel">
	 * ...
	 *	<DIV id="rdDashboard2PanelContent_..." class="panelBody">
	 */
    FreeForm.resizePanelBodytoFitPanel = function (panel) {
        var panelNode = Y.one(panel),
			panelBody = panelNode.one('.panelBody'),
			tdBody = panelBody.ancestor('td'),
			trBody = panelBody.ancestor('tr'),
			innerTable = panelNode.one('.panelInnerTable'),
			panelTitle = innerTable.one('.panelTitle'),
            panelParameters = innerTable.one('.rdDashboardParams'),
            notAjustable = document.getElementById("rdDashboardAdjustable").innerHTML == 'False',
			availableWidth, availableHeight;

        // Set Width
        // Width of Panel - padding/margin all the containers take up
        // Resizer check is to restrict behavior to freeform layout mode.
        if (Y.Lang.isValue(panelNode.getData('resizer')) || notAjustable) {
            availableWidth = panelNode.get('clientWidth') - (innerTable.get('offsetWidth') - getContentWidth(tdBody));
            panelBody.set('offsetWidth', availableWidth);

            // Set Height
            // Height of Panel - margin of table - height of all other content - padding of panel Body containers - bottom margin of Panel Body
            availableHeight = panelNode.get('clientHeight') - parseInt(innerTable.getComputedStyle('marginTop'), 10) - parseInt(innerTable.getComputedStyle('marginBottom'), 10)
			    // Panel Title and Panel Parameters - ie7/8 being stupid, hence the display check
			    - (panelTitle.getStyle('display') === 'none' ? 0 : panelTitle.get('offsetHeight'))
			    - (panelParameters.getStyle('display') === 'none' ? 0 : panelParameters.get('offsetHeight'))
			    // Padding of TR and TD containers
			    - parseInt(trBody.getComputedStyle('paddingTop'), 10) - parseInt(trBody.getComputedStyle('paddingBottom'), 10)
			    - parseInt(tdBody.getComputedStyle('paddingTop'), 10) - parseInt(tdBody.getComputedStyle('paddingBottom'), 10)
			    // Margin of Panel Body
			    - parseInt(panelBody.getComputedStyle('marginBottom'), 10);

            var lstElements = ['.rdDashboardFilterCaption', '.rdDashboardGlobalFilterCaption', '.rdDrillFilterCaption'],
                elementToExclude;
            for (var i = 0; i < lstElements.length; i++) {
                elementToExclude = panel.one(lstElements[i]);
                if (elementToExclude) {
                    availableHeight = availableHeight - elementToExclude.get('clientHeight') - parseInt(elementToExclude.getComputedStyle('paddingTop'), 10) - parseInt(elementToExclude.getComputedStyle('paddingBottom'), 10)
                }
            }

            panelBody.set('offsetHeight', availableHeight);
        }
        else {
            //Remove any height that may have been set by paramter expand / collapse code
            panelNode.setStyle('height', '');
        }
    };

    FreeForm.addPanelClickEvents = function () {
        var dashboardContainer = Y.one('#rdDivDashboardpanels');
        if (Y.Lang.isValue(dashboardContainer)) {
            dashboardContainer.delegate('click', FreeForm.onPanelClick, '.rdDashboardPanel', this);
        }

        if (LogiXML.Ajax && LogiXML.Ajax.AjaxTarget)
            LogiXML.Ajax.AjaxTarget().on('refreshed_rdDivDashboardpanels', FreeForm.addPanelClickEvents);
    };

    FreeForm.onPanelResizeStart = function (e, panel, resizer) {

        var panelNode = Y.one(panel);
        var charts = panelNode.all('img.dashboardChart,div.rdChartCanvas');

        //Set panel level variable to let us know if there is more than one chart
        //This needs to be set here in case the number of charts on the panel is variable
        if (charts.size() == 1) {
            panelNode.setData("oneChart", true);
        }
        else
            panelNode.setData("oneChart", false);

        var dashboardContainer = panel.ancestor('#rdDivDashboardpanels');

        FreeForm.freezeDashboardContainer();
        FreeForm.showPanelonTop(panel);
        panel.setStyle('opacity', .75);

        // Save width/height of panel so we can calculate difference between original size and after resize
        panel.setData('resizeCurrentWidth', panel.get('offsetWidth'));
        panel.setData('resizeCurrentHeight', panel.get('offsetHeight'));

    };

    FreeForm.onPanelResize = function (e, panel, resizeChart, resizer) {
        var chart = panel.one('img.dashboardChart,div.rdChartCanvas'),
			panelBody = panel.one('.panelBody'),
			widthDiff = panel.get('offsetWidth') - panel.getData('resizeCurrentWidth'),
			heightDiff = panel.get('offsetHeight') - panel.getData('resizeCurrentHeight');

        var panelNode = Y.one(panel);

        //Make sure we only have one chart
        if (panelNode.getData("oneChart")) {

            //Make sure chart is a defined node
            if (chart) {
                var chartfx = chart.ancestor();
                var resizeWidth, resizeHeight;
                if (chart.hasClass("rdChartCanvas")) {
                    var chartContainer = chart.one('*')
                    if (chartContainer != null) {
                        resizeWidth = chartContainer.get('offsetWidth') + widthDiff;
                        resizeHeight = chartContainer.get('offsetHeight') + heightDiff;
                    } else {
                        resizeWidth = chart.get('offsetWidth') + widthDiff;
                        resizeHeight = chart.get('offsetHeight') + heightDiff;
                    }
                } else {
                    resizeWidth = chart.get('width') + widthDiff;
                    resizeHeight = chart.get('height') + heightDiff;
                }

                //Set minimum height and width if necessary
                if (resizeWidth <= 5) {
                    resizeWidth = 5;
                }
                if (resizeHeight <= 5) {
                    resizeHeight = 5;
                }

                //If the chart has a chartfx-wrapper, resize that along with the chart
                if (chartfx.hasClass('chartfx-wrapper')) {
                    chartfx.set('offsetWidth', resizeWidth);
                    chartfx.set('offsetHeight', resizeHeight);
                }

                //Adjust chart
                chart.set('offsetWidth', resizeWidth);
                chart.set('offsetHeight', resizeHeight);
                if (chart.hasClass("rdChartCanvas")) {
                    chart.fire('setSize', { width: resizeWidth, height: resizeHeight, finished: false, notify: false });
                }
            }
        }
        
        // We have to adjust panel and panel body, otherwise title text area gets clipped as well as the content.
        panelBody.set('offsetWidth', panelBody.get('offsetWidth') + widthDiff);
        panelBody.set('offsetHeight', FreeForm.getPanelBodyAvailableHeight(panel))

        panel.setData('resizeCurrentWidth', panel.get('offsetWidth'));
        panel.setData('resizeCurrentHeight', panel.get('offsetHeight'));
    };

    FreeForm.onPanelResizeEnd = function (e, panel, resizeChart, resizer) {
        var dashboardContainer = panel.ancestor('#rdDivDashboardpanels'),
			chart, chartUrl, urlPieces, urlParameters, urlParametersObject;

        var panelNode = Y.one(panel);

        FreeForm.unFreezeDashboardContainer();
        dashboardContainer.all('.rdDashboardPanel').setStyle('opacity', .92);
        FreeForm.rdSaveFreeformLayoutPanelPosition('rdDivDashboardpanels', true, null, Y.LogiInfo.Dashboard.prototype.rdGetPanelInstanceId(panel.getDOMNode()));

        //Only resize chart if there is only one chart in the panel
        if (panelNode.getData("oneChart")) {
            chart = panel.one('img.dashboardChart,div.rdChartCanvas');
            FreeForm.resizeChartToFitPanel(panel, chart);
        } else {
            var ngpVisualization = panelNode.one('logi-visualization,logi-crosstab-table');
            if (ngpVisualization) {
                FreeForm.resizeVisualizationToFitPanel(panel, ngpVisualization);
            }
        }
    };

    FreeForm.getPanelBodyAvailableHeight = function (panel) {
        //The panel caption and other content can shrink and grow. The main body content must adapt and fit into that. 
        var panelBody = panel.one('.panelBody')
        var panelRow = panelBody.ancestor("TR")

        var nUsedHeight = 0   //Everthing above the panel, like the panel caption.
        var prevRow = panelRow._node.previousSibling
        while (prevRow) {
            nUsedHeight += prevRow.offsetHeight
            prevRow = prevRow.previousSibling
        }

        var nHeightBufferConstant = 20
        nAvailableHeight = panel._node.offsetHeight - nUsedHeight - nHeightBufferConstant
        if (nAvailableHeight < 0) {nAvailableHeight = 0}
        return nAvailableHeight
    }

    /*
	 * Bring panel to top and save panel positions, sizes, and z-indices.
	 *
	 * This generates way too many AJAX calls.  Clicks from other buttons like
	 * Edit/Save/Cancel call this as well.  I could filter out calls here by
	 * ignoring Inputs, Button, and javascript actions triggered by <A>s but really
	 * the other actions should stop propogation of their events.
	 */
    FreeForm.onPanelClick = function (e) {
        var clickedPanel = e.currentTarget,
			dashboardContainer = Y.one('#rdDivDashboardpanels');

        FreeForm.showPanelonTop(clickedPanel);
        FreeForm.rdSaveFreeformLayoutPanelPosition(dashboardContainer.get('id'));
    };

    FreeForm.showPanelonTop = function (panel) {
        var dashboardContainer = panel.ancestor('.dashboardPanelContainer');
        var allDashboardPanels = dashboardContainer.all('.rdDashboardPanel');
        var nPanelZindex = parseInt(panel.getStyle('zIndex'), 10);
        var nTopZindex = 0
        var nPanelsOnTop = 0
        allDashboardPanels.each(function (panelNode) {
            var nCurrZindex = parseInt(panelNode.getStyle('zIndex'), 10);
            if (nTopZindex < nCurrZindex) {
                nTopZindex = nCurrZindex
            } else if (nTopZindex == nCurrZindex) {
                nPanelsOnTop += 1
            }
        }, this);
        if (nPanelsOnTop > 1) {
            nTopZindex += 1
        }
        if (nPanelZindex < nTopZindex) {
            nPanelZindex = nTopZindex + 1
            panel.setStyle('zIndex', nPanelZindex);
        }
    };

    FreeForm.rdResizeDashboardContainer = function () {
        var elePanelContainer = Y.one('#rdDivDashboardpanels'),
			aDashboardPanels, i;
        if (elePanelContainer == null) {
            elePanelContainer = Y.one('#rdDivDashboardPanelTable');
            if (Y.Lang.isNull(elePanelContainer)) {
                return;
            }
        }
        aDashboardPanels = elePanelContainer.all('.rdDashboardPanel');
        var nRight = 0; var nBottom = 0;

        for (i = 0; i < aDashboardPanels.size() ; i++) {
            var elePanelItem = aDashboardPanels.item(i);
            var regionPanelItem = Y.DOM.region(elePanelItem.getDOMNode());
            if (i == 0) {
                nRight = regionPanelItem.right;
                nBottom = regionPanelItem.bottom;
            } else {
                if (regionPanelItem.right > nRight) nRight = regionPanelItem.right;
                if (regionPanelItem.bottom > nBottom) nBottom = regionPanelItem.bottom;
            }
        }

        var regionPanelContainer = Y.DOM.region(elePanelContainer.getDOMNode());
        if (aDashboardPanels.size() > 0) {
            var eleTab = Y.Selector.ancestor(aDashboardPanels.item(0), '.rdTabPanel', false)
            if (Y.Lang.isValue(document.getElementById('rdFreeformLayout'))) {
                elePanelContainer.setStyle('height', (nBottom - regionPanelContainer.top + 20) + 'px');
                if (nRight < Y.DOM.viewportRegion().right) {
                    elePanelContainer.setStyle('width', (Y.DOM.viewportRegion().right - regionPanelContainer.left - 20 + 'px'));
                    if (eleTab) eleTab.setStyle('width', (Y.DOM.viewportRegion().right - regionPanelContainer.left - 20 + 'px'));
                    //Make the Main content div atleast the size of the Dashboard container.
                    if (!Y.Lang.isNull(Y.one('#divMainContent'))) {
                        Y.one('#divMainContent').setStyle('width', (Y.DOM.viewportRegion().right - regionPanelContainer.left - 20 + 'px'));
                    }
                } else {
                    elePanelContainer.setStyle('width', nRight + 'px');
                    if (eleTab) eleTab.setStyle('width', (nRight + 10) + 'px');
                    //Make the Main content div atleast the size of the Dashboard container.
                    if (!Y.Lang.isNull(Y.one('#divMainContent'))) {
                        Y.one('#divMainContent').setStyle('width', nRight + 'px');
                    }
                }
            }
        } else {
            elePanelContainer.setStyle('width', '100%');
            elePanelContainer.setStyle('height', '');
        }
    };


    FreeForm.rdSaveFreeformLayoutPanelPosition = function (sPanelContainerId, isResize, isMove, affectedPanelID) {
        FreeForm.rdResizeDashboardContainer();
        var eleDashboardTab = Y.one('#' + sPanelContainerId);

        if (!Y.Lang.isValue(eleDashboardTab)) {
            return;
        }

        // Go through each of the panels and save their CSS styling
        var eleHiddenPanelOrder = Y.one('#rdDashboardPanelOrder'),
			dashboardPanels = eleDashboardTab.all('.rdDashboardPanel'),
			numberofPanels = dashboardPanels.size(),
			i, panel, panelSettings = '';

        for (i = 0; i < numberofPanels; i++) {
            panel = dashboardPanels.item(i);
            var currentPanelID = Y.LogiInfo.Dashboard.prototype.rdGetPanelInstanceId(panel.getDOMNode());
            panelSettings += ',' + currentPanelID;
            panelSettings += ':0:STYLE=';
            // Instead of cssText property, manually grab the styles we want to save
            panelSettings += 'z-index:' + panel.getComputedStyle('zIndex') + ';';
            panelSettings += ' position: ' + panel.getComputedStyle('position') + ';';
            panelSettings += ' left: ' + FreeForm.rdRoundTo10(panel.getComputedStyle('left')) + ';';
            panelSettings += ' top: ' + FreeForm.rdRoundTo10(panel.getComputedStyle('top')) + ';';
            if (isResize && (affectedPanelID == null || affectedPanelID == currentPanelID)) {
              panelSettings += ' width: ' + FreeForm.rdRoundTo10(panel.getComputedStyle('width')) + ';';
              panelSettings += ' height: ' + FreeForm.rdRoundTo10((parseInt(panel.getComputedStyle('height'), 10))) + 'px' + ';';
            }
        }


        eleHiddenPanelOrder.set('value', panelSettings);

        var rdPanelParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value;
        rdPanelParams += "&rdFreeformLayout=True";
        var eleTab = Y.Selector.ancestor(eleDashboardTab, '.rdTabPanel');
        if (eleTab) {
            eleTab.parentNode.setStyle('overflow', 'hidden');
            rdPanelParams += ("&rdDashboardTabID=" + eleTab.get('id').substring(eleTab.get('id').lastIndexOf("_") + 1));
        }

        var regionTab = Y.DOM.region(eleDashboardTab.getDOMNode());
        var sTabStyle = "Width:" + (regionTab.right - regionTab.left) + 'px';
        sTabStyle += ";Height:" + (regionTab.bottom - regionTab.top) + 'px';
        rdPanelParams += ("&rdDashboardTabStyle=" + sTabStyle);
        //REPDEV-23445-Add-Free-Form-Panels-to-Dashboard-without-overlapping-existing-content
        //After moving or resizing,should remove the auto position ability.
        if (isMove || isResize) {
            rdPanelParams += "&rdClearAutoPosition=True";
        }

        window.status = "Saving dashboard panel positions.";
        rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=UpdateDashboardPanelOrder' + rdPanelParams);
    };

    FreeForm.rdRoundTo10 = function (value) {
        var bKeepPx = false
        if (typeof (value.replace) != 'undefined') {
            if (value.indexOf("px") != -1) {
                bKeepPx = true
                value = value.replace("px", "")
            }
        }
        value = parseInt(value / 10) * 10
        if (bKeepPx) {
            value = value + "px"
        }
        return value
    };

    FreeForm.freezeDashboardContainer = function () {
        var dashContainer = Y.one('#rdDivDashboardpanels');
        var containerWidth = dashContainer.getDOMNode().clientWidth,
			containerHeight = dashContainer.getDOMNode().clientHeight;

        dashContainer.setStyle('position', 'absolute');
        dashContainer.ancestor('div').setStyles({
            width: containerWidth,
            height: containerHeight
        });
    };

    FreeForm.unFreezeDashboardContainer = function () {
        var dashContainer = Y.one('#rdDivDashboardpanels');
        dashContainer.ancestor('div').setStyles({
            width: '',
            height: ''
        });
        dashContainer.setStyle('position', 'relative');
    }

    FreeForm.panelFitToChart = function () {
        var panels = Y.all('div.rdDashboardPanel');
        panels.each(function (panel) {
            var panelBody = panel.one('div.panelBody');
            var charts = panelBody.all("div.rdLogiVisualization");
            if (charts.size() !== 1) {
                var additionalHeight = 0;
                charts.each(function (chart) {
                    additionalHeight += parseInt(chart.get('clientHeight'));
                });
                if (additionalHeight > 0) {
                    panelBody.setStyle('height', additionalHeight);
                    FreeForm.resizePanelBodytoFitPanel(panel);
                }
            } else {
                var ngpVisualization = panel.one('logi-visualization,logi-crosstab-table');
                if (ngpVisualization) {
                    if (ngpVisualization.get('parentNode').getAttribute('data-skip-initial-resizing') != 'true') {
                        FreeForm.resizeVisualizationToFitPanel(panel, ngpVisualization);
                    }
                }
            }
        });
        FreeForm.rdResizeDashboardContainer();
		
    }

    LogiXML.Dashboard.FreeForm = FreeForm;

}, '1.0.0', { requires: ['node-base', 'rdResize', 'querystring', 'dd-constrain', 'dd-proxy', 'dd-drop-plugin', 'dd-plugin', 'dd-scroll'] });

function rdResetGalleryPanels() {
    var ppChangeDashboard = document.getElementById("ppChangeDashboard");
    if (!ppChangeDashboard)
        return;

    ppChangeDashboard.removeAttribute("data-rdLazyLoadComplete");
}

function rdEnableGalleryPanels(enable, parentId) {
    // Remove rdHiddenRequestForwarding rdGalleryEnabled
    var old = document.getElementsByName("rdGalleryEnabled");
    for (var i = 0; i < old.length; i++) {
        var o = old[i];
        if (o.id == "rdHiddenRequestForwarding")
            o.parentNode.removeChild(o);
    }

    var hdnEnabled = document.getElementById("rdGalleryEnabled");

    // Enable loading of gallery items - list is needed now
    if (!hdnEnabled) {
        hdnEnabled = document.createElement("INPUT");
        hdnEnabled.type = "hidden";
        hdnEnabled.id = "rdGalleryEnabled";
        hdnEnabled.name = hdnEnabled.id;
        document.rdForm.appendChild(hdnEnabled);
    }

    hdnEnabled.value = enable ? "True" : "False";

    // Remove rdHiddenRequestForwarding rdGalleryParentID
    old = document.getElementsByName("rdGalleryParentID");
    for (var i = 0; i < old.length; i++) {
        var o = old[i];
        if (o.id == "rdHiddenRequestForwarding")
            o.parentNode.removeChild(o);
    }

    // Set Gallery Parent ID
    var hdnParentID = document.getElementById("rdGalleryParentID");
    if (enable) {
        if (!hdnParentID) {
            hdnParentID = document.createElement("INPUT");
            hdnParentID.type = "hidden";
            hdnParentID.id = "rdGalleryParentID";
            hdnParentID.name = hdnParentID.id;
            document.rdForm.appendChild(hdnParentID);
        }

        hdnParentID.value = parentId;
    } else {
        hdnParentID.parentNode.removeChild(hdnParentID);
    }
}

function rdShowAddGalleryPanels(id, report) {
    rdEnableGalleryPanels(true, id);

    var ppChangeDashboard = document.getElementById("ppChangeDashboard");

    if (!ppChangeDashboard.getAttribute("data-rdLazyLoadComplete")) {
        var callback = function () {
            var ppChangeDashboard = document.getElementById("ppChangeDashboard");
            ppChangeDashboard.setAttribute("data-rdLazyLoadComplete", "True");

            // Disable loading of gallery items when then the list is not shown
            var onClose = function () {
                rdEnableGalleryPanels(false);
            };

            var nodeChangeDashboardPopup = Y.one(ppChangeDashboard);

            var btnDone = nodeChangeDashboardPopup.all('#rdPopupPanelX').get("node")[0];
            btnDone.on('click', onClose);

            btnDone = nodeChangeDashboardPopup.one("#ppDoneButton");
            if (btnDone)
                btnDone.on("click", onClose);

            rdShowAddGalleryPanels(this.id, this.report);
        }.bind({
            id: id,
            report: report
        });

        return rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=ppChangeDashboard,rdStopAjaxReplace,' + id
            + '&rdReport=' + report, 'false', '', null, null, callback, ['', '', '']);
    }

    var eleAddPanelsList = document.getElementById('rdAddPanelsList');
    if (eleAddPanelsList) {
        var nPanelHeight = (3 * (Y.one("body").get("winHeight") / 4)) > 400 ? (3 * (Y.one("body").get("winHeight") / 4)) : 400;
        eleAddPanelsList.style.height = nPanelHeight + 'px';
        eleAddPanelsList.style.overflow = 'auto';
    }

    ShowElement(id, 'ppChangeDashboard', 'Show');
}