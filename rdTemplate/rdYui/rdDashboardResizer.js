YUI.add('relativeResizer', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdRelativeResizer';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.RelativeResizer.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').RelativeResizer = Y.Base.create('RelativeResizer', Y.Base, [], {
        handlers: null,
        configNode: null,
        row: null,
        columns: null,
        resizers: null,
        id: null,

        initializer: function (config) {
            var self = this;
            this.handlers = {},
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);
            this.createHandles();
        },

        createHandles: function () {
            var self = this;
            var resizers = this.resizers;
            var columns = this.columns;

            this.resizers.each(function (column, i) {
                var dd = new Y.DD.Drag({
                    node: column,
                    axis: "x"
                }).plug(Y.Plugin.DDConstrained, {
                    stickX: true,
                    constrain: column.ancestor()
                });
                Y.DD.DDM.set('dragCursor', 'auto');
                var columnStart;

                var isDragAllowed = true;
                dd.on('drag:start', function (e) {

                    var leftSibling = column.previous();
                    var rightSibling = column.next();

                    leftSibling.all('.rdChartCanvas').each(function (node) {
                        var domNode = node._node;
                        if (domNode.style.removeProperty) {
                            domNode.style.removeProperty('width');
                        } else {
                            domNode.style.removeAttribute('width');
                        }
                    });
                    rightSibling.all('.rdChartCanvas').each(function (node) {
                        var domNode = node._node;
                        if (domNode.style.removeProperty) {
                            domNode.style.removeProperty('width');
                        } else {
                            domNode.style.removeAttribute('width');
                        }
                    });

                }, self);

                dd.on('drag:drag', function (e) {
                    e.preventDefault();

                    var leftSibling = column.previous();
                    var rightSibling = column.next();
                    var tableWidth = this.configNode.get('offsetWidth');

                    //calculate delta manually
                    var colLeft = column.getXY()[0],
                    newWidthPx = e.pageX - colLeft;
                    newWidthPc = -(newWidthPx / tableWidth * 100);

                    var leftWidth = parseFloat(leftSibling.getStyle('width')) - newWidthPc;
                    var rightWidth = parseFloat(rightSibling.getStyle('width')) + newWidthPc;

                    //REPDEV-20500 fix pointer disconnecting due to IE width rounding
                    leftWidth = Number((leftWidth).toFixed(2));
                    rightWidth = Number((rightWidth).toFixed(2));

                    var leftPanelWidth = tableWidth * leftWidth / 100;
                    var rightPanelWidth = tableWidth * rightWidth / 100;

                    if(!isDragAllowed)
                        isDragAllowed = this.isSplitterDraggable(column, e);
                    // refactor? recalculate size limits
                    if (leftPanelWidth >= 150 && rightPanelWidth >= 150 && isDragAllowed) {
                        leftSibling.all('.rdChartCanvas').each(function (node) {
                            var highchartContainer = node.one('.highcharts-container');
                            if (highchartContainer)
                                highchartContainer.setStyle('width', ((tableWidth * leftWidth / 100) - 30) + 'px');
                        });
                        rightSibling.all('.rdChartCanvas').each(function (node) {
                            var highchartContainer = node.one('.highcharts-container');
                            if (highchartContainer)
                                highchartContainer.setStyle('width', ((tableWidth * rightWidth / 100) - 30) + 'px');
                        });


                        //resize NGP panels
                        var leftPanels = leftSibling.all('div.rdDashboardPanel');
                        leftPanels.each(function (panel) {
                            var panelBody = panel.one('div.panelBody');
                            var charts = panelBody.all("div.rdLogiVisualization");
                            if (charts.size() > 0) {
                                panelBody.setStyle('width', ((tableWidth * leftWidth / 100) - 20) + 'px');
                            }
                        });

                        var rightPanels = rightSibling.all('div.rdDashboardPanel');
                        rightPanels.each(function (panel) {
                            var panelBody = panel.one('div.panelBody');
                            var charts = panelBody.all("div.rdLogiVisualization");
                            if (charts.size() > 0) {
                                panelBody.setStyle('width', ((tableWidth * rightWidth / 100) - 20) + 'px');
                            }
                         });

                        leftSibling.setStyle('width', leftWidth + '%');
                        rightSibling.setStyle('width', rightWidth + '%');
                    }
                    else {
                        isDragAllowed = false;
                    }
                }, self);

                dd.on('drag:end', function (e) {
                    var leftSibling = column.previous();
                    var rightSibling = column.next();

                    leftSibling.all('.rdChartCanvas').each(Y.LogiXML.ChartCanvas.reflowChart);
                    rightSibling.all('.rdChartCanvas').each(Y.LogiXML.ChartCanvas.reflowChart);
                    //REPDEV-24538 New breadcrumb menu text ellipsis and resizing support
                    if (Y.LogiXML.ChartDrillToBreadcrumb && Y.LogiXML.ChartDrillToBreadcrumb.reflowItem) {
                        leftSibling.all('.rdChartDrillToBreadcrumb').each(Y.LogiXML.ChartDrillToBreadcrumb.reflowItem);
                        rightSibling.all('.rdChartDrillToBreadcrumb').each(Y.LogiXML.ChartDrillToBreadcrumb.reflowItem);
                    }
                    
                    var leftPanels = leftSibling.all('div.rdDashboardPanel');
                    leftPanels.each(function (panel) {
                        var panelBody = panel.one('div.panelBody');
                        var charts = panelBody.all("div.rdLogiVisualization");
                        if (charts.size() > 0) {
                            var ngpVisualization = panel.one('.rdLogiVisualization logi-visualization,.rdLogiVisualization logi-crosstab-table');
                                if (ngpVisualization) {
                                        LogiXML.Dashboard.FreeForm.resizeVisualizationToFitPanel(panel, ngpVisualization);
                            }
                        }
                    });

                    var rightPanels = rightSibling.all('div.rdDashboardPanel');
                    rightPanels.each(function (panel) {
                        var panelBody = panel.one('div.panelBody');
                        var charts = panelBody.all("div.rdLogiVisualization");
                            if (charts.size() > 0) {
                            var ngpVisualization = panel.one('.rdLogiVisualization logi-visualization,.rdLogiVisualization logi-crosstab-table');
                                if (ngpVisualization) {
                                        LogiXML.Dashboard.FreeForm.resizeVisualizationToFitPanel(panel, ngpVisualization);
                            }
                        }
                    });


                    var sizes = columns._nodes.map(function (node) { 
                        return parseFloat(node.style.width); 
                    });
                    var rdColumnSizes = sizes.join(',');

                    var rdPanelParams = '&rdReport=' + document.getElementById('rdDashboardDefinition').value;
                    rdPanelParams += '&ActiveTabId=' + document.getElementById('ActiveTabIdentifier').value;
                    rdPanelParams += '&rdColumnSizes=' + rdColumnSizes;

                    rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=UpdateColumnSize' + rdPanelParams);
                }, self);
            });
                

        },

        isSplitterDraggable: function(splitterNode, evt) {
            var splitterClientRect = splitterNode._node.getBoundingClientRect();
            var deviation = 10;
            return evt.pageX > splitterClientRect.left - deviation && evt.pageX < splitterClientRect.right + deviation;
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');

            this.row = this.configNode.one('.rdRelativeResizerRow');
            if (!this.row)
                this.row = this.configNode.one('tr');

            this.resizers = this.row.all('> td.rdResizerColumn');
            this.columns = this.row.all('> td:not(.rdResizerColumn)');
        },


        destructor: function () {
            var configNode = this.configNode;

            this._clearHandlers();
            configNode.setData(TRIGGER, null);
        },

        _clearHandlers: function () {
            var self = this;
            Y.each(this.handlers, function (item) {
                if (item) {
                    if (item.detach)
                        item.detach();
                    if (item.destroy)
                        item.destroy();

                    item = null;
                }
            });
        }

    }, {
        // Static Methods and properties
        NAME: 'RelativeResizer',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },

        createElements: function () {

            var element;

            Y.all('.' + TRIGGER).each(function (node) {
                element = node.getData(TRIGGER);
                if (!element) {
                    element = new Y.LogiXML.RelativeResizer({
                        configNode: node
                    });
                }
            });
        }

    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'stylesheet', 'event-custom', 'dd-drag', 'dd-ddm', 'dd-proxy', 'dd-constrain', 'dd-scroll'] });
