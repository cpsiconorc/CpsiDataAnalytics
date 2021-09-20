//REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
YUI.add('chartDrillToBreadcrumb', function (Y) {
    //"use strict";
    var TRIGGER = 'rdChartDrillToBreadcrumb';

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').ChartDrillToBreadcrumb = Y.Base.create('ChartDrillToBreadcrumb', Y.Base, [], {
        _handlers: null,
        reportName: null,
        drillTo: null,
        rdChartCanvasId: null,
        rdDashPanelId: null,
        initializer: function (config) {
            this.drillTo = config.drillTo;
            this.rdChartCanvasId = config.rdChartCanvasId;
            this.reportName = config.reportName;
            this.rdDashPanelId = this.rdChartCanvasId.substring(this.rdChartCanvasId.lastIndexOf("_"));
            this._handlers = {};
            this.render();
        },
        render: function () {
            var drillFilterCaptionId = 'rdDrillFilterCaption';
            drillFilterCaptionId += this.rdDashPanelId;
            var containerId = drillFilterCaptionId + '_Container';
            this.drillFilterCaptionContainer = Y.one('#' + containerId);
            if (this.drillFilterCaptionContainer) {
                this.drillFilterCaptionContainer.setData(TRIGGER, this);
                var drilledToStates = this.drillTo.drilledToStates;
                if (drilledToStates && drilledToStates.length > 0) {
                    var menuPanel = Y.one('#rdDrillFilterMenu' + this.rdDashPanelId + '_rdPopup');
                    if (menuPanel) {
                        var bd = menuPanel.one('div.bd');
                        this.drillPopupMenu = bd.one('ul.rdThemePopupMenu');
                        if (!this.drillPopupMenu) {
                            this.drillPopupMenu = Y.Node.create('<ul class="rdThemePopupMenu"></ul>');
                            bd.append(this.drillPopupMenu);
                        }
                        this.drillPopupMenu.setHTML('');
                    }
                    if (!this.drillToColumnMap) {
                        this.initColumnNameMap();
                    }
                    this.drillFilterCaption = Y.one('#' + drillFilterCaptionId);
                    this.drillFilterCaptionContainer.show();
                    this.rdChartDrillPanel = this.drillFilterCaption.one('ul.rdChartDrillPanel');
                    if (!this.rdChartDrillPanel) {
                        this.rdChartDrillPanel = Y.Node.create('<ul class="rdChartDrillPanel"></ul>');
                        this.drillFilterCaption.append(this.rdChartDrillPanel);
                    }
                    var drillItem, li, columnName;
                    for (var i = 0, len = drilledToStates.length; i < len; i++) {
                        drillItem = drilledToStates[i];
                        li = Y.Node.create('<li class="rdChartDrillItem"></li>');
                        var _colName = this.drillToColumnMap[drillItem.DrilledFilterColumn] || drillItem.DrilledFilterColumn;
                        columnName = this.replaceFriendlyName(_colName);
                        li.setHTML('<a drillIndex="' + i + '" class="active">[' + columnName + '] = ' + drillItem.DrilledFilterValueDisp + '</a>');
                        li.set('drillIndex', i);
                        if (this.drillPopupMenu) {
                            this.drillPopupMenu.append(li.cloneNode(true));
                        }
                        li.append('>');
                        this.rdChartDrillPanel.append(li);
                    }
                    var usedColumnIndexes = this.drillTo.usedColumnIndexes;
                    if (usedColumnIndexes && usedColumnIndexes.length > 0) {
                        var index = usedColumnIndexes[0];
                        if (index < this.drillTo.drillToColumns.length) {
                            columnName = this.drillTo.drillToColumns[index].ColumnName;
                            if (this.drillTo.drillToColumns[index].Header || this.drillTo.drillToColumns[index].Header == 0) {
                                columnName = this.drillTo.drillToColumns[index].Header;
                            }
                            li = Y.Node.create('<li class="rdChartDrillItem" disabled="disabled"></li>');
                            li.setHTML('<label class="disabled">' + columnName + '</label>');
                            this.rdChartDrillPanel.append(li);
                            if (this.drillPopupMenu) {
                                this.drillPopupMenu.append(li.cloneNode(true));
                            }
                        }
                    }
                    var self = this;
                    if (this.drillPopupMenu) {
                        li = Y.Node.create('<li class="rdChartDrillMenuTip"></li>');
                        var label = Y.Node.create('<a>...</a>');
                        label.set('id', 'rdDrillFilterMenu' + this.rdDashPanelId);
                        li.append(label);
                        this.rdChartDrillPanel.prepend(li);
                        this._handlers['showDrillFilterMenu'] = li.on('click', function () {
                            if (Y.Lang.isValue(self.menu)) {
                                self.menu.hide(self.menu);
                                Y.YUI2.widget.MenuManager.removeMenu(self.menu);
                            }
                            self.buildMenu();
                            self.menu.show(self.menu);
                            document.getElementById(self.menu.id).style.zIndex = '9999';
                        });
                    }
                    this._handlers['removeDrill'] = Y.delegate("click", function () {
                        self.removeDrillTo(this.getAttribute('drillIndex'));
                    }, this.rdChartDrillPanel, "a.active");

                    if (this.drillPopupMenu) {
                        this._handlers['menuRemoveDrill'] = Y.delegate("click", function () {
                            self.removeDrillTo(this.getAttribute('drillIndex'));
                        }, this.drillPopupMenu, "a.active");
                    }
                    var rdDrillFilterClearButton = Y.one('#rdDrillFilterClearButton' + this.rdDashPanelId);
                    if (rdDrillFilterClearButton) {
                        this._handlers['cleartDrill'] = rdDrillFilterClearButton.on('click', function () {
                            self.clearDrillTo();
                        });
                    }
                    this.reflow();
                }
            }
        },
        replaceFriendlyName: function (columnName) {
            var drillToColumns = this.drillTo.drillToColumns
            if (drillToColumns && drillToColumns.length > 0) {
                for (var i = 0, len = drillToColumns.length; i < len; i++) {
                    if (columnName == drillToColumns[i].ColumnName) {
                        if (drillToColumns[i].Header || drillToColumns[i].Header == 0) {
                            return drillToColumns[i].Header
                        }
                        break;
                    }
                }
            }
            return columnName;
        },
        buildMenu: function () {
            var sMenuId = 'rdDrillFilterMenu' + this.rdDashPanelId;
            var sPopupId = sMenuId + '_rdPopup';
            this.menu = new Y.YUI2.widget.Menu(sPopupId, { context: [sMenuId, "tl", 'bl'] }); //tl:top left  bl:bottom left
            var nodes = this.menu.getItems();
            this.menu.getItem(nodes.length - 1).cfg.setProperty('disabled', true)
            this.menu.render();
            Y.one('#' + sPopupId).show();
        },
        reflow: function () {
            if (!this.drillFilterCaptionContainer || !this.drillFilterCaption) {
                return;
            }
            var dashPanel = this.drillFilterCaptionContainer.ancestor('div.rdDashboardPanel');
            if (dashPanel) {
                var bodyPanel = dashPanel.one('div.panelBody');
                var menuTip = this.drillFilterCaption.one('li.rdChartDrillMenuTip');
                menuTip.hide();
                this.drillFilterCaption.all('li.rdChartDrillItem').show();

                var clearBtn = this.drillFilterCaptionContainer.one('span.rdDrillFilterClearButton');
                var containerWidth = bodyPanel.getDOMNode().offsetWidth - clearBtn.getDOMNode().offsetWidth;
                var cotentWidth = this.drillFilterCaption.getDOMNode().offsetWidth;
                if (cotentWidth > containerWidth) {
                    menuTip.show();
                    containerWidth -= menuTip.getDOMNode().offsetWidth;
                    var drillItems = this.drillFilterCaption.all('li.rdChartDrillItem');
                    var node, nodeWidth;
                    for (var i = drillItems.size() - 1; i >= 0; i--) {
                        node = drillItems.item(i);
                        nodeWidth = node.getDOMNode().offsetWidth;
                        containerWidth -= nodeWidth;
                        if (containerWidth >= 0) {
                            node.show();
                        } else {
                            node.hide();
                        }
                    }
                }
            }
        },
        removeDrillTo: function (index) {
            if (index > 0) {
                var drilledToStates = this.drillTo.drilledToStates;
                this.doDrillTo(drilledToStates.splice(0, index));
            } else {
                this.clearDrillTo();
            }
        },
        clearDrillTo: function () {
            this.doDrillTo([]);
        },
        doDrillTo: function (drilledToStates) {
            var inpName = this.rdChartCanvasId + '_' + "drillTo";
            var inp = this.getOrCreateInputElement(inpName);
            inp.set('value', JSON.stringify(drilledToStates));
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdAction=ChartDrillTo&rdRefreshElementID=' + this.rdChartCanvasId + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            if (this.drillTo.sGlobalFilterPopupId) {
                requestUrl += '&rdPopupId=' + this.drillTo.sGlobalFilterPopupId;
            }
            rdAjaxRequest(requestUrl);
        },
        getOrCreateInputElement: function (id) {
            var inputElement = Y.one("input[name='" + id + "'],select[name='" + id + "']");
            if (inputElement === null) {
                inputElement = Y.Node.create('<input type="hidden" name="' + id + '" id="' + id + '" />');
                this.drillFilterCaptionContainer.ancestor().appendChild(inputElement);
            }
            return inputElement;
        },
        initColumnNameMap: function () {
            var self = this;
            self.drillToColumnMap = {};
            var drillToColumns = this.drillTo.drillToColumns;
            Y.each(drillToColumns, function (item) {
                self.drillToColumnMap[item.ID] = item.ColumnName;
            });
        },
        destroy: function () {
            this._clearHandlers();
            if (this.drillFilterCaptionContainer) {
                this.drillFilterCaptionContainer.hide();
                this.drillFilterCaptionContainer.setData(TRIGGER, null);
                this.drillFilterCaptionContainer = null;
            }
            if (this.rdChartDrillPanel) {
                this.rdChartDrillPanel.setHTML('');
                this.rdChartDrillPanel = null;
            }

            if (Y.Lang.isValue(this.menu)) {
                this.menu.hide(this.menu);
                Y.YUI2.widget.MenuManager.removeMenu(this.menu);
                this.menu = null;
            }
        },
        _clearHandlers: function () {
            var self = this;
            Y.each(this._handlers, function (item) {
                if (item) {
                    item.detach();
                    item = null;
                }
            });
        }
    }, {
        // Static Methods and properties
        NAME: 'ChartCanvas',
        reflowItem: function (node) {
            if (!node) {
                return;
            }

            var item = node.getData(TRIGGER);
            if (item) {
                item.reflow();
            }
        }
    }
    );

}, '1.0.0', { requires: ['base', 'node', 'event', 'yui2-menu'] });