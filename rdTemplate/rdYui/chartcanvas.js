YUI.add('chartCanvas', function (Y) {
    //"use strict";
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        }
    }

    var Lang = Y.Lang,
        TRIGGER = 'rdChartCanvas';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () {
            if (LogiXML && LogiXML.Dashboard && LogiXML.Dashboard.pageDashboard && LogiXML.Dashboard.pageDashboard.refreshing)
                return;

            Y.LogiXML.ChartCanvas.createElements(true);
        });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').ChartCanvas = Y.Base.create('ChartCanvas', Y.Base, [], {
        _handlers: {},

        configNode: null,
        id: null,
        chart: null,
        reportName: null,
        renderMode: null,
        jsonUrl: null,
        chartPointer: null,
        refreshAfterResize: false,
        debugUrl: null,
        isUnderSE: null,
        inputElement: null,
        changeFlagElement: null,
        mask: null,
        restoreSelectionForSeriesIndex: null,
        maxVisiblePoints: null,
        refreshTimers: [],
        drillTo: null,
        currentDrillTo: null,

        initializer: function(config) {
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);

            var chartOptions = this.extractOptionsFromHtmlNode(this.configNode);

            this._handlers.chartError = Highcharts.addEvent(this.configNode.getDOMNode(), 'error', Y.LogiXML.ChartCanvas.handleError);
            this._handlers.setSize = this.configNode.on('setSize', this.resized, this);
            this.initChart(chartOptions);
            if (this.isResponsive()) {
                this.subscribeToWindowResize();
            }
        },

        isResponsive: function () {
            var styleAttribute = this.configNode.getAttribute('style'),
                actualWidth = this.configNode.getStyle('width');
            if (styleAttribute.indexOf('width') > -1) {
                if (actualWidth.indexOf('%') > -1) {
                    return true;
                }
                return false;
            }
            return true;
        },

        subscribeToWindowResize: function () {
            if (!window.LogiXML.chartCanvasWindowResize) {
                window.LogiXML.chartCanvasWindowResize = Y.on('windowresize', function () { Y.LogiXML.ChartCanvas.reflowAllCharts(); });
            }
        },

        responsiveResize: function (self, bForce) {
            if (self.chart && self.chart.container && self.chart.options && self.chart.options.chart) {
                var container = Y.one(self.chart.container);
                container.hide();
                var width = self.configNode.get('offsetWidth');
                container.show();
                self.chart.options.chart.width = width;
                self.chart.reflow();
            }
        },

        extractOptionsFromHtmlNode: function (chartNode) {
            var options = chartNode.getAttribute('data-options'),
                chartOptions = this.parseJson(options);
            return chartOptions;
        },

        rdUpdateChartData: function (requestParams) {
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            requestUrl += "&rdChartRefreshType=UpdateData";
            requestUrl = this.attachRequestParams(requestUrl, requestParams);
            rdAjaxRequest(requestUrl);
        },

        rdAppendChartData: function (requestParams, maxVisiblePoints) {
            this.maxVisiblePoints = maxVisiblePoints;
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            requestUrl += "&rdChartRefreshType=AppendData";
            requestUrl = this.attachRequestParams(requestUrl, requestParams);
            rdAjaxRequest(requestUrl);
        },

        attachRequestParams: function (url, requestParams) {
            if (requestParams) {
                for (var key in requestParams) {
                    url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(requestParams[key]);
                }
            }
            return url;
        },

        setChartDataFromRefreshElement: function (chartNode) {
            var chartOptions = this.extractOptionsFromHtmlNode(chartNode),
               refreshType = chartNode.getAttribute('data-refresh-type');
            if (!refreshType || refreshType == '') {
                refreshType = "UpdateData";
            }
            if (chartNode.getAttribute('bookmark-migration-finished')) {
                this.chart.renderTo.setAttribute('bookmark-migration-finished', chartNode.getAttribute('bookmark-migration-finished'));
            }
            this.rdSetChartData(chartOptions, refreshType);
        },

        rdSetChartData: function (chartOptions, updateType, maxVisiblePoints) {
            this.preProcessChartOptions(chartOptions);
            if (!updateType || updateType == '') {
                updateType = "UpdateData";
            }
            if (!maxVisiblePoints && this.maxVisiblePoints) {
                maxVisiblePoints = this.maxVisiblePoints;
            }
            switch (updateType) {
                case "UpdateData":
                    {
                        var i = 0, length = chartOptions.series.length,
                            j = 0, jLength = this.chart.series.length,
                            seriesId;
                        for (; i < length; i++) {
                            seriesId = chartOptions.series[i].id;
                            for (j = 0; j < jLength; j++) {
                                if (this.chart.series[j].options.id == seriesId) {
                                    if (chartOptions.series[i].data && chartOptions.series[i].data.length) {
                                        this.chart.series[j].setData(chartOptions.series[i].data);
                                    }
                                }
                            }
                        }
                        this.chart.setTitle(chartOptions.title, true)
                        
                    }
                    break;
                case "AppendData":
                    {
                        var i = 0, length = chartOptions.series.length,
                            j = 0, jLength = this.chart.series.length,
                            seriesId;
                        for (; i < length; i++) {
                            seriesId = chartOptions.series[i].id;
                            for (j = 0; j < jLength; j++) {
                                if (this.chart.series[j].options.id == seriesId) {
                                    var timespan = chartOptions.series[i].visibleTimespan,
                                        shiftCount = 0;
                                    if (timespan) {
                                        var timeArr = timespan.split(':'),
                                            dateIndent = timeArr[0] * 3600000 + timeArr[1] * 60000 + timeArr[2] * 1000, //in milliseconds
                                            maxDate = LogiXML.getTimestampWithoutClientOffset(new Date()),
                                            minDate = new Date(maxDate - dateIndent);
                                        for (var k = this.chart.series[j].data.length; k >= 0; k--) {
                                            if (this.chart.series[j].data[k] && new Date(this.chart.series[j].data[k].x) < minDate) {
                                                shiftCount++;
                                            }
                                        }
                                        if (chartOptions.series[i].data) {
                                            for (var index = 0; index < chartOptions.series[i].data.length; index++) {
                                                var dataPoint = chartOptions.series[i].data[index];
                                                if (shiftCount > 0) {
                                                    this.chart.series[j].addPoint(dataPoint, false, true);
                                                    shiftCount--;
                                                } else {
                                                    this.chart.series[j].addPoint(dataPoint, false, false);
                                                }
                                            }
                                        }
                                        this.setRefreshTimerPreviousValue();
                                        this.chart.xAxis[0].setExtremes(minDate, maxDate);
                                    } else {

                                        if (maxVisiblePoints && maxVisiblePoints > 0) {
                                            var pointsLength = this.chart.series[j].data.length,
                                                pointsToDeleteCnt = pointsLength - maxVisiblePoints;
                                            if (pointsToDeleteCnt > 0) {
                                                for (var k = 0; k < pointsToDeleteCnt; k++) {
                                                    shiftCount++;
                                                }
                                            }
                                        }

                                        if (chartOptions.series[i].data) {
                                            for (var index = 0; index < chartOptions.series[i].data.length; index++) {
                                                var dataPoint = chartOptions.series[i].data[index];
                                                if (shiftCount > 0) {
                                                    this.chart.series[j].addPoint(dataPoint, false, true);
                                                    shiftCount--;
                                                } else {
                                                    this.chart.series[j].addPoint(dataPoint, false, false);
                                                }
                                            }
                                        }
                                    }
                                    if (this.chart.xAxis && this.chart.xAxis[0]) {
                                        this.chart.xAxis[0].minRange = null;
                                    }
                                    this.chart.redraw();
                                }
                            }
                        }
                    }
                    break;
                default:
                    throw ('Refresh type is undefined');
            }
            this.postProcessChartOptions(chartOptions);
        },

        setRefreshTimerInitialDateRange: function (chartOptions) {
            if (!chartOptions.series || chartOptions.series.length == 0) {
                return;
            }
            var i = 0, length = chartOptions.series.length,
                xAxis, ret = false, isAppend = false;
            for (; i < length; i++) {
                isAppend = false;
                var serie = chartOptions.series[i];
                if (serie.visibleTimespan) {
                    isAppend = true;
                    var timeSpan = serie.visibleTimespan,
                        timeArr = timeSpan.split(':'),
                        dateIndent = timeArr[0] * 3600000 + timeArr[1] * 60000 + timeArr[2] * 1000, //in milliseconds
                        maxDate = LogiXML.getTimestampWithoutClientOffset(new Date()),
                        minDate = new Date(maxDate - dateIndent),
                        axisId = LogiXML.getGuid();
                    if (!chartOptions.xAxis) {
                        chartOptions.xAxis = [];
                    }
                    if (chartOptions.xAxis.length == 0) {
                        chartOptions.xAxis.push({ id: axisId, labels: {}, title: { text: null }, type: 'datetime' });
                        serie.xAxis = axisId;
                    } 
                    chartOptions.xAxis[0].min = minDate.getTime();
                    chartOptions.xAxis[0].max = new Date(maxDate).getTime();
                    ret = true;
                }

                if (serie.refreshInterval) {
                    var prms = "rdAjaxCommand=RefreshElement&rdRefreshElementID=" + this.id +
                                    "&rdRefreshSeriesTimerEvent=True"+
                                    "&rdChartRefreshType=" + (isAppend? "AppendData" : "UpdateData") +
                                    "&rdChartCanvasId=" + this.id +
                                    "&rdChartCanvasSeriesId=" + serie.id +
                                    "&rdReport=" + this.reportName;
                    this.refreshTimers.push(this.createRefreshInterval(prms, serie.refreshInterval));
                }
            }
            return ret;
        },

        createRefreshInterval: function (prms, timeout) {
            return setInterval(function () { rdAjaxRequestWithFormVars(prms); }, timeout);
        },

        setRefreshTimerPreviousValue: function () {
            if (!this.chart || !this.chart.series || !this.chart.series.length > 0) {
                return;
            }
            var i = 0, length = this.chart.series.length,
                serie, maxDataValue;
            for (; i < length; i++) {
                var serie = this.chart.series[i];
                if (serie.userOptions && serie.userOptions.visibleTimespan) {
                    maxDataValue = null;
                    if (serie.xData && serie.xData.length > 0) {
                        maxDataValue = serie.xData[serie.xData.length - 1];
                    }
                    if (maxDataValue) {
                        var inputIdForLastValue = serie.userOptions.inputIdForLastValue;
                        if (inputIdForLastValue) {
                            this.getOrCreateInputElement(inputIdForLastValue).setAttribute('value', new Date(maxDataValue).toISOString());
                        }
                    }
                }
            }
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
            this.chart.destroy();
            configNode.setData(TRIGGER, null);
            if (this.drillInfoBreadcrumb) {
                this.drillInfoBreadcrumb.destroy();
            }
        },

        _clearHandlers: function() {
            var self = this;
            Y.each(this._handlers, function(item) {
                if (item) {
                    item.detach();
                    item = null;
                }
            });

            Y.each(this.refreshTimers, function (item) {
                if (item) {
                    clearTimeout(item);
                }
            });
        },

        _parseHTMLConfig: function() {

            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            this.reportName = this.configNode.getAttribute('data-report-name');
            this.renderMode = this.configNode.getAttribute('data-render-mode');
            this.jsonUrl = this.configNode.getAttribute('data-json-url');
            this.chartPointer = this.configNode.getAttribute('data-chart-pointer');
            this.refreshAfterResize = this.configNode.getAttribute('data-refresh-after-resize') == "True";
            this.debugUrl = this.configNode.getAttribute('data-debug-url');
            this.isUnderSE = this.configNode.getAttribute('data-under-se');
        },

        initChart: function(chartOptions) {
            //what about resizer?
            if (this.id) {
                var idForResizer = this.id.replace(/_Row[0-9]+$/g, "").replace(/\./g, "\\.");
                if (Y.one('#rdResizerAttrs_' + idForResizer) && rdInitHighChartsResizer) {
                    rdInitHighChartsResizer(this.configNode.getDOMNode());
                }
            }
            //post processing
            if (this.renderMode != "Skeleton") {
                this.createChart(chartOptions);
            } else {
                this.createChart(chartOptions);
                if (this.id !="rdMigrationGauge") {
                    this.chart.showLoading('<img src="rdTemplate/rdWait.gif" alt="loading..."></img>');
                }
                this.requestChartData(null, "createChart", true);
            }

        },

        preProcessChartOptions: function (chartOptions) {
            if (chartOptions.series) {
                this.setActions(chartOptions.series);
            }

            if (chartOptions.tooltip) {
                chartOptions.tooltip.formatter = LogiXML.HighchartsFormatters.tooltipFormatter;
            }

            if (!chartOptions.chart.events) {
                chartOptions.chart.events = {};
            }

            if (chartOptions.title && chartOptions.title.text) {
                chartOptions.title.text = LogiXML.decodeHtml(chartOptions.title.text, chartOptions.title.useHTML);
            }

            if (chartOptions.legend && chartOptions.legend.title && chartOptions.legend.title.text) {
                chartOptions.legend.title.text = LogiXML.decodeHtml(chartOptions.legend.title.text, chartOptions.legend.labelFormat == 'HTML');
            }

            if (chartOptions.legend && chartOptions.legend.title && chartOptions.legend.title.text) {
                chartOptions.legend.title.text = LogiXML.decodeHtml(chartOptions.legend.title.text, chartOptions.legend.labelFormat == 'HTML');
            }

            if (chartOptions.subtitle && chartOptions.subtitle.text) {
                chartOptions.subtitle.text = LogiXML.decodeHtml(chartOptions.subtitle.text, chartOptions.subtitle.useHTML);
            }

            if (chartOptions.series && chartOptions.series.length > 0) {
                for (i = 0; i < chartOptions.series.length; i++) {
                    var series = chartOptions.series[i];
                    if (series.name) {
                        series.name = LogiXML.decodeHtml(series.name, true);
                    }
                    var data = series.data;
                    for (var j = 0; data && j < data.length; j++) {
                        if (data[j].name) {
                            if (series.xAxis) {
                                var xAxis;
                                for (var k = 0; k < chartOptions.xAxis.length; k++) {
                                    if (chartOptions.xAxis[k].id == series.xAxis) {
                                        xAxis = chartOptions.xAxis[k];
                                        break;
                                    }
                                }

                                data[j].name = LogiXML.decodeHtml(data[j].name, xAxis && xAxis.labels && xAxis.labels.format === 'HTML');
                            }
                            else {
                                data[j].name = LogiXML.decodeHtml(data[j].name, chartOptions.xAxis[0] && chartOptions.xAxis[0].labels && chartOptions.xAxis[0].labels.format === 'HTML');
                            }
                        }
                    }
                }
            }

            if (chartOptions.series && chartOptions.series.length > 0) {
                for (i = 0; i < chartOptions.series.length; i++) {
                    var series = chartOptions.series[i];
                    if (series.name) {
                        series.name = LogiXML.decodeHtml(series.name);
                    }
                    var data = series.data;
                    for (var j = 0; data && j < data.length; j++) {
                        if (data[j].name) {
                            data[j].name = LogiXML.decodeHtml(data[j].name/*, series.dataLabels && series.dataLabels.format === 'HTML'*/);
                        }
                    }
                }
            }

            if (chartOptions.chart.type = 'gauge' && chartOptions.yAxis && chartOptions.yAxis.length > 0 && chartOptions.yAxis[0].lineColor && chartOptions.yAxis[0].plotBands && chartOptions.yAxis[0].plotBands.length > 0) {
                var newPlotband = {};
                var axis = chartOptions.yAxis[0];
                newPlotband.color = axis.lineColor;
                newPlotband.from = axis.min;
                newPlotband.to = axis.max;
                newPlotband.thickness = axis.lineWidth;
                axis.lineColor = 'transparent';
                axis.plotBands.unshift(newPlotband);
            }

            if (chartOptions.xAxis && chartOptions.xAxis.length > 0) {
                for (var i = 0; i < chartOptions.xAxis.length; i++) {
                    var axis = chartOptions.xAxis[i];
                    if (axis.title && axis.title.text) {
                        axis.title.text = LogiXML.decodeHtml(axis.title.text);
                    }

                    var plotBands = axis.plotBands;
                    if (plotBands){
                        for (var k = 0; k < plotBands.length; k++) {
                            var plotBand = plotBands[k];
                            if (plotBand && plotBand.label && plotBand.label.text) {
                                plotBand.label.text = LogiXML.decodeHtml(plotBand.label.text, plotBand.label.format == 'HTML');
                            }
                        }
                    }

                    var plotLines = axis.plotLines;
                    if (plotLines) {
                        for (k = 0; k < plotLines.length; k++) {
                            var plotLine = plotLines[k];
                            if (plotLine && plotLine.label && plotLine.label.text) {
                                plotLine.label.text = LogiXML.decodeHtml(plotLine.label.text, plotLine.label.format == 'HTML');
                            }
                        }
                    }
                }
            }

            if (chartOptions.yAxis && chartOptions.yAxis.length > 0) {
                for (i = 0; i < chartOptions.yAxis.length; i++) {
                    var axis = chartOptions.yAxis[i];
                    if (axis.title && axis.title.text) {
                        axis.title.text = LogiXML.decodeHtml(axis.title.text);
                    }

                    var plotBands = axis.plotBands;
                    if (plotBands) {
                        for (var k = 0; k < plotBands.length; k++) {
                            var plotBand = plotBands[k];
                            if (plotBand && plotBand.label && plotBand.label.text) {
                                plotBand.label.text = LogiXML.decodeHtml(plotBand.label.text, plotBand.label.format == 'HTML');
                            }
                        }
                    }

                    var plotLines = axis.plotLines;
                    if (plotLines) {
                        for (k = 0; k < plotLines.length; k++) {
                            var plotLine = plotLines[k];
                            if (plotLine && plotLine.label && plotLine.label.text) {
                                plotLine.label.text = LogiXML.decodeHtml(plotLine.label.text, plotLine.label.format == 'HTML');
                            }
                        }
                    }
                }
            }

            if (chartOptions.quicktips && chartOptions.quicktips.length > 0) {
                for (i = 0; i < chartOptions.quicktips.length; i++) {
                    if (chartOptions.quicktips[i].rows && chartOptions.quicktips[i].rows.length > 0) {
                        for (var j = 0; j < chartOptions.quicktips[i].rows.length; j++) {
                            var row = chartOptions.quicktips[i].rows[j];
                            if (row && row.caption) {
                                row.caption = LogiXML.decodeHtml(row.caption, row.format == 'HTML');
                            }
                        }
                    }
                }
            }

            LogiXML.HighchartsFormatters.setFormatters(chartOptions);

            this.preProcessDrillTo(chartOptions);
        },

        postProcessChartOptions: function (chartOptions) {
            if (chartOptions.quicktips) {
                this.setQuicktipsData(chartOptions.quicktips);
            }
            this.disableSelectionForExcludedPoints();
            this.setCursorForAreaSelection();
            this.disableSelectionForExcludedDrillTo();
        },

        createChart: function (chartOptions, fromPostProcessing) {
            this.configNode.fire('beforeCreateChart', { id: this.id, options: chartOptions, chartCanvas: this, chart: this.chart });
            var viewstates;

            if (this.chart) {
                viewstates = this.chart.viewstates;
                this.chart.destroy();
            }

            //width and height by parent?
            var dataWidth = this.configNode.getAttribute('data-width'),
                dataHeight = this.configNode.getAttribute('data-height');
            if (dataWidth > 0 && dataHeight > 0) {
                chartOptions.chart.width = dataWidth;
                chartOptions.chart.height = dataHeight;
                //cleanup old size
                if (fromPostProcessing) {
                    this.configNode.removeAttribute('data-width');
                    this.configNode.removeAttribute('data-height');
                }
            }

            if (!fromPostProcessing) {
                this.fixupAfChartHeight(this.configNode, chartOptions);
            }


            chartOptions.chart.renderTo = this.configNode.getDOMNode();

            this.preProcessChartOptions(chartOptions);

            this.setSelection(chartOptions);

            var shouldSetPrevValue = this.setRefreshTimerInitialDateRange(chartOptions);

            if (chartOptions.chart.options3d) {
                //Fix for Pie chart depth
                if (chartOptions.series) {
                    var containsPie = false;
                    for (var i = 0; i < chartOptions.series.length; i++) {
                        if (chartOptions.series[i].type=='pie') {
                            containsPie = true;
                            break;
                        }
                    }
                    if (containsPie) {
                        if (!chartOptions.plotOptions) {
                            chartOptions.plotOptions = {};
                        }
                        if (!chartOptions.plotOptions.pie) {
                            chartOptions.plotOptions.pie = {};
                        }
                        chartOptions.plotOptions.pie.depth = chartOptions.chart.options3d.depth;
                    }
                }
            }

            chartOptions.isChartCanvas = true;

            this.chart = new Highcharts.Chart(chartOptions);

            if (shouldSetPrevValue) {
                this.setRefreshTimerPreviousValue();
            }
            
            this.chart.options3d = chartOptions.chart.options3d;

            if (this.chart.options3d) {
                //mouse dragging rotation
                if (!this.chart.options3d.disableDragging) {
                    addRotationMouseEvents(this.chart);
                    if (saveOptions3DState) {
                        saveRotationStateFunc = saveOptions3DState;
                    }
                }
            }

            if (viewstates) {
                this.chart.viewstates = viewstates;
            }

            this.postProcessChartOptions(chartOptions);

            if (chartOptions.autoQuicktip === false) {
                this.chart.autoQuicktip = false;
            }

            if (this.restoreSelectionForSeriesIndex !== null) {
                this.syncSelectedValues(this.chart.series[this.restoreSelectionForSeriesIndex]);
                this.restoreSelectionForSeriesIndex = null;
            }
            if (typeof setChartStateEventHandlers != 'undefined') {
                setChartStateEventHandlers(this.chart);
            }
            if (fromPostProcessing) {
                
                //23988 restore chart viewstates from bookmark
                if (!this.chart.viewstates) {
                    var viewstateElem = document.getElementById('rdBookmarkReqId_' + this.chart.userOptions.id + '_viewstates');
                    if (viewstateElem) {
                        this.chart.viewstates = viewstateElem.innerHTML;
                    }
                }
            }

            //hide or show buttons on chartcanvas
            if (typeof this.chart.container != 'undefined') {

            
            var customButtons = Y.one(this.chart.container).all("*[id^=customButton_]");
            customButtons.each(function (customButton) {
                customButton.setStyle("display", 'none');
            });


            var drillBackButton = Y.one(this.chart.container).one('#customButton_DrillBack');
            if (drillBackButton) {
                if (this.drillTo && this.drillTo.drilledToStates && this.drillTo.drilledToStates.length > 0) {
                    if (LogiXML.features['touch']) {
                        drillBackButton.setStyle('display', '');
                    }
                    drillBackButton.setAttribute("collapsed-button", "False");
                } else if (drillBackButton) {
                    drillBackButton.setAttribute('collapsed-button', 'True');
                }
            }

            var zoomButton = Y.one(this.chart.container).one('#customButton_ResetZoom');
            if (zoomButton) {
                zoomButton.setAttribute("collapsed-button", "True");
            }

            var chartExportButton = Y.one(this.chart.container).one('#customButton_ChartExport');
            if (chartExportButton && LogiXML.features['touch']) {
                chartExportButton.setStyle('display', '');
            }


            if (typeof restoreChartState != 'undefined') {
                restoreChartState(this.chart);
            }

           
            this.chart.chartCanvas = this;

            if (this.chart.angular &&
                this.chart.panes && this.chart.panes.length > 0 &&
                this.chart.options.series.length > 0 && this.chart.options.series[0].events) {
                var dials = Y.one(this.chart.renderTo).all("path");
                var dialOptions = this.chart.panes[0].options;

                if (dialOptions.background && dialOptions.background.length > 0) {
                    var dialBackgroundOptions = dialOptions.background[0];

                    if (dialBackgroundOptions.backgroundColor)
                        dials = dials.filter(function () {
                            return Y.one(this).getAttribute('fill').toLowerCase() == dialBackgroundOptions.backgroundColor.toLowerCase();
                        });
                    if (dialBackgroundOptions.borderColor)
                        dials = dials.filter(function () {
                            return Y.one(this).getAttribute('stroke').toLowerCase() == dialBackgroundOptions.borderColor.toLowerCase();
                        });
                    if (dialBackgroundOptions.borderWidth)
                        dials = dials.filter("[stroke-width='" + dialBackgroundOptions.borderWidth + "']");

                    if (dials && dials._nodes && dials._nodes.length == 1 &&
                        this.chart.series && this.chart.series.length > 0 &&
                        this.chart.series[0].points && this.chart.series[0].points.length > 0) {
                        var chart = this.chart;
                        var dial = dials._nodes[0];

                        Highcharts.addEvent(dial, "click", function (event) {
                            chart.hoverPoint = chart.series[0].points[0];
                            Y.one(chart.series[0].group.element).simulate("click", event);
                            chart.hoverPoint = null;
                        });
                        dial.style.cursor = "pointer";
                    }
                }
            }

            }
            //export 
            var wrapperNode = this.configNode.ancestor('.rdBrowserBorn');
            if (wrapperNode) {
                wrapperNode.setAttribute("data-rdBrowserBornReady", "true");
            }
            this.configNode.fire('afterCreateChart', {id: this.id, options: chartOptions, chartCanvas: this, chart: this.chart});
            
        },

        fixupAfChartHeight: function(configNode, chartOptions){
            var dashboardPanel = this.configNode.ancestor('.rdDashboardPanel');
            if (dashboardPanel) {
                var currentHeight = chartOptions.chart.height;
                //REPDEV-22595 - Removed this block of code - it was removing the height for extra elements to fit and chart was cutoff on X axis.
                //var lstElements = ['.rdDashboardFilterCaption', '.rdDashboardGlobalFilterCaption'], elementToExclude;
                //for (var i = 0; i < lstElements.length; i++) {
                //    elementToExclude = dashboardPanel.one(lstElements[i]);
                //    if (elementToExclude && elementToExclude.one('span').get('innerHTML')) {
                //        currentHeight = currentHeight - elementToExclude.get('offsetHeight') - 2;
                //    }
                //}
                if (chartOptions.chart.height != currentHeight) {
                    var wrapper = dashboardPanel.one('.chartfx-wrapper');
                    if (wrapper) {
                        var isResized = wrapper.getAttribute('afResized')
                        if (!isResized) {
                            chartOptions.chart.height = currentHeight;
                            wrapper.set('offsetHeight', currentHeight);
                            wrapper.setAttribute('afResized', true);
                        }
                    }
                }

            }
        },

        requestChartData: function (url, callbackFunctionName, prm1, prm2, prm3) {
            var chartUrl = url ? url : this.jsonUrl;
            if (this.chart && callbackFunctionName != "createChart") {
                chartUrl += "&rdDynamicChartWidth=" + this.chart.chartWidth;
                chartUrl += "&rdDynamicChartHeight=" + this.chart.chartHeight;
            }
            chartUrl += "&guid=" + LogiXML.getGuid();
            if (!callbackFunctionName) {
                callbackFunctionName = "createChart";
            }

            this.configNode.fire('beforeRequestData', { id: this.id, chartCanvas: this, chart: this.chart, dataUrl: chartUrl });
            Y.io(chartUrl, {
                on: {
                    success: function(tx, r) {
                        var parsedResponse = this.parseJson(r.responseText);
                        this.configNode.fire('afterRequestData', { id: this.id, chartCanvas: this, chart: this.chart, options: parsedResponse });
                        if (parsedResponse) {
                            this[callbackFunctionName](parsedResponse, prm1, prm2, prm3);
                        }
                       
                    },
                    failure: function(id, o, a) {
                        this.showError("ERROR " + id + " " + a);
                    }
                },
                context: this
            });
        },

        parseJson: function(jsonString) {
            var obj;
            try {
                var reportDevPrefix = "rdChart error;";
                var redirectPrefix = "redirect:";
                
                if (jsonString.startsWith(reportDevPrefix)) {
                    this.debugUrl = jsonString.substring(reportDevPrefix.length);
                    if (this.debugUrl && this.debugUrl.startsWith(redirectPrefix)) {
                        this.debugUrl = this.debugUrl.substring(redirectPrefix.length);
                    }
                    this.showError();
                    return;
                }
                if (document.URL && document.URL.indexOf('file:') != -1) {
                    eval("window.tmp=" + jsonString + ";");
                    obj = window.tmp;
                } else {
                    obj = Y.JSON.parse(jsonString);
                }
                if (LogiXML.EventBus && LogiXML.EventBus.ChartCanvasEvents) {
                    LogiXML.EventBus.ChartCanvasEvents().fire('load', { id: this.id, options: obj });
                }
            } catch (e) {
                this.showError("JSON parse failed: " + jsonString);
                return;
            }
            return obj;
        },

        setSelection: function(chartOptions) {
            if (!chartOptions.series || chartOptions.series.length == 0) {
                return;
            }
            var series,
                selection,
                i = 0,
                length = chartOptions.series.length,
                self = this;

            if (!chartOptions.chart.events) {
                chartOptions.chart.events = {};
            }
            for (; i < length; i++) {
                series = chartOptions.series[i];
                if (series.selection) {
                    selection = series.selection;
                    
                    //turn on markers for point selection
                    if (selection.mode != "Range") {
                        series.marker.enabled = true;
                    }

                    if (!series.events) {
                        series.events = {};
                    }
                    var cursor;
                    switch (selection.selectionType) {
                        case "ClickSinglePoint":
                        case "ClickMultiplePoints":
                        case "ClickRangePoints":
                            series.allowPointSelect = selection.isReadOnly !== true;
                            series.accumulate = selection.selectionType != "ClickSinglePoint";
                            this.syncSelectedValues(series);
                            if (series.allowPointSelect) {
                                series.events.pointselection = function (e) {
                                    self.pointsSelected(e.target, true, e);
                                    return false;
                                };
                                chartOptions.chart.events.click = function (e) {
                                    //REPDEV-20715: prevent selection destroying after clicking on button
                                    var y_tgt = Y.one(e.target);
                                    if (!(y_tgt && y_tgt.ancestor('.highcharts-button'))) {
                                        self.destroySelection(e, true);
                                    }                                    
                                };
                            }
                            break;
                        case "Area":
                        case "AreaXAxis":
                        case "AreaYAxis":
                            if (selection.isReadOnly !== true) {
                                switch (selection.selectionType) {
                                    case "AreaXAxis":
                                        chartOptions.chart.zoomType = "x";
                                        cursor = 'ew-resize';
                                        break;
                                    case "AreaYAxis":
                                        chartOptions.chart.zoomType = "y";
                                        cursor = 'ns-resize';
                                        break;
                                    default:
                                        chartOptions.chart.zoomType = "xy";
                                        cursor = 'crosshair';
                                        break;
                                }

                                series.accumulate = true;

                                chartOptions.chart.events.selection = function (e) {
                                    self.selectionDrawn(e, true);
                                    return false;
                                };
                                chartOptions.chart.events.redraw = function (e) { self.chartRedrawn(e); };
                                chartOptions.chart.events.selectionStarted = function (e) {
                                    e.selectionMarker.attr({ cursor: cursor });
                                    self.chart.plotBackground.element.style.cursor = cursor;
                                    self.destroySelection();
                                };
                            }
                            if (selection.mode == "Point") {
                                this.syncSelectedValues(series, i);
                            } else {
                                this.restoreSelectionForSeriesIndex = i;
                            }
                            chartOptions.chart.customSelection = true;

                            if (!selection.disableClearSelection) {
                                chartOptions.chart.events.click = function (e) {
                                    //REPDEV-20715: prevent selection destroying after clicking on button
                                    var y_tgt = Y.one(e.target);
                                    if (!(y_tgt && y_tgt.ancestor('.highcharts-button'))) {
                                        self.destroySelection(e, true);
                                    }
                                };
                            }

                            break;
                    }
                }
            }
        },
        setCursorForAreaSelection: function () {
            if (!this.chart.series || this.chart.series.length == 0) {
                return;
            }
            var series,
                i = 0,
                length = this.chart.series.length;

            for (; i < length; i++) {
                series = this.chart.series[i];
                if (series.options.selection && series.options.selection.selectionType.indexOf('Area') != -1 && series.options.cursor) {
                    this.chart.plotBackground.element.style.cursor = series.options.cursor;
                    this.plotBackgroundCursor = series.options.cursor;
                }
            }
        },

        disableSelectionForExcludedPoints: function () {
            if (!this.chart.series || this.chart.series.length == 0) {
                return;
            }
            var series,
                selection,
                i = 0,
                length = this.chart.series.length,
                y = 0, yLength = 0;
            
            for (; i < length; i++) {
                series = this.chart.series[i];
                if (series.options.selection && series.options.selection.excludedPointValues && series.options.selection.excludedPointValues.length > 0) {
                    selection = series.options.selection;
                    y = 0; yLength = series.data.length;
                    for (; y < yLength; y++) {
                        if (series.data[y].graphic && selection.excludedPointValues.indexOf(series.data[y].id) != -1) {
                            series.data[y].graphic.attr({
                                cursor: 'default'
                            });
                        }
                    }
                }
            }
        },

        disableSelectionForExcludedDrillTo: function () {
            if (!this.chart.series || this.chart.series.length == 0 || !this.chart.options.drillTo) {
                return;
            }           
            var series,
                selection,
                i = 0,
                length = this.chart.series.length,
                y = 0, yLength = 0;

            for (; i < length; i++) {
                series = this.chart.series[i];
                if (this.chart.options.drillTo.excludedPointValues && this.chart.options.drillTo.excludedPointValues.length > 0) {                
                    
                    y = 0; yLength = series.data.length;
                    for (; y < yLength; y++) {
                        if (series.data[y].graphic && this.chart.options.drillTo.excludedPointValues.indexOf(series.data[y].name ? series.data[y].name : series.data[y].x) != -1) {
                            series.data[y].graphic.attr({
                                cursor: 'default'
                            });
                        }
                    }
                }
            }
        },

        pointsSelected: function (series, fireEvent, e, force) {
            var selection = series.options.selection,
                valueElement, eleDelimited,
                changeFlagElement,
                oldValue,
                newValue, delimitedValue;

            if (!selection) {
                return;
            }
            if (this.disableNestedEvents) {
                return;
            }

            if (selection.excludedPointValues && selection.excludedPointValues.length > 0)
            {
                if (e && selection.excludedPointValues.indexOf(e.id) != -1) {
                    var selected = !e.selected;
                    e.selected = e.options.selected = selected;
                    e.setState(selected && 'select');
                    return;
                }
            }

            if (fireEvent && selection.deffered && !force && e.options) {
                var selected = !e.selected;
                e.selected = e.options.selected = selected;
                e.setState(selected && 'select');
                this.defferedSelectedPoint = e;
                return;
            } else if (fireEvent && selection.deffered && force && this.defferedSelectedPoint) {
                var selected = !this.defferedSelectedPoint.selected;
                this.defferedSelectedPoint.selected = this.defferedSelectedPoint.options.selected = selected;
                this.defferedSelectedPoint.setState(selected && 'select');
            }

            var isTreemap = series.type === 'treemap';
            var values = isTreemap ? {} : [];
            if (isTreemap) {
                this.getSelectedValuesForTreemap(series, values);
                var valuesCount = values.length;

                for (var valuesString in values) {
                    var valuesArray = values[valuesString];
                    valueElement = this.getOrCreateInputElement(valuesString);
                    oldValue = this.getInputElementValue(valueElement);

                    newValue = valuesArray.join(',');

                    if (oldValue != newValue) {
                        this.setInputElementValue(valueElement, newValue);

                        if (LogiXML.rdInputTextDelimiter) {
                            eleDelimited = this.getOrCreateInputElement("rdCSV_" + valuesString)
                            delimitedValue = LogiXML.rdInputTextDelimiter.delimit(valuesArray, ",", '"', "\\");
                            this.setInputElementValue(eleDelimited, delimitedValue);
                        }

                        if (selection.changeFlagElementId && selection.changeFlagElementId.length > 0) {
                            changeFlagElement = this.getOrCreateInputElement(selection.changeFlagElementId);
                            changeFlagElement.set('value', 'True');
                        }

                        if (fireEvent) {
                            HighchartsAdapter.fireEvent(series, 'selectionChange', null);

                            //if (selection.selectionType != "ClickSinglePoint" && selection.selectionType != "ClickMultiplePoints") {
                            if (newValue == '') {
                                HighchartsAdapter.fireEvent(series, 'selectionCleared', null);
                            } else {
                                HighchartsAdapter.fireEvent(series, 'selectionMade', null);
                            }
                            //}
                        }
                    }
                }
            } else {
                this.getSelectedValues(series, values);
                if (selection.valueElementId && selection.valueElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.valueElementId);
                    oldValue = this.getInputElementValue(valueElement);

                    newValue = values.join(",");

                    var lastPoint = null;
                    if (oldValue != newValue) {
                        this.setInputElementValue(valueElement, newValue);

                        if (LogiXML.rdInputTextDelimiter) {
                            delimitedValue = LogiXML.rdInputTextDelimiter.delimit(values, ",", '"', "\\");
                            eleDelimited = this.getOrCreateInputElement("rdCSV_" + selection.valueElementId);
                            this.setInputElementValue(eleDelimited, delimitedValue);
                        }

                        if (selection.changeFlagElementId && selection.changeFlagElementId.length > 0) {
                            changeFlagElement = this.getOrCreateInputElement(selection.changeFlagElementId);
                            changeFlagElement.set('value', 'True');
                        }
                       
                        var minPoint = values[0];
                        var maxPoint = values[values.length - 1];

                        if (e && selection.selectionType == "ClickRangePoints" && minPoint != maxPoint) {
                            this.disableNestedEvents = true;

                            // deselect points
                            if (!e.selected &&
                                series.points[e.index - 1] && series.points[e.index - 1].selected &&
                                series.points[e.index + 1] && series.points[e.index + 1].selected) {
                                var lastClickedValue = window.LogiXML['chart_' + this.id + '_clickedValue'];
                                if (lastClickedValue) {
                                    lastPoint = this.getPointById(series, lastClickedValue);
                                } 
                                if (!lastPoint) {
                                     lastPoint = this.getPointById(series, maxPoint);
                                }

                                if (lastPoint.index > e.index) {
                                    this.changeSelection(series, minPoint, e.id, true);
                                } else {
                                    this.changeSelection(series, e.id, maxPoint, true);
                                }

                                values = [];
                                this.getSelectedValues(series, values);
                            }

                            // select points between start and end
                            minPoint = values[0];
                            maxPoint = values[values.length - 1];
                            if (minPoint != maxPoint)
                                this.changeSelection(series, minPoint, maxPoint, true);

                            // update actual values
                            values = [];
                            this.getSelectedValues(series, values);

                            newValue = values.join(',');
                            if (LogiXML.rdTextInputDelimiter)
                                delimitedValue = LogiXML.rdInputTextDelimiter.delimit(values, ",", '"', "\\");

                            this.setInputElementValue(valueElement, newValue);

                            if (eleDelimited)
                                this.setInputElementValue(eleDelimited, delimitedValue);

                            this.disableNestedEvents = false;
                        }
                        if (e) {
                            window.LogiXML['chart_' + this.id + '_clickedValue'] = e.id;
                        }

                        if (fireEvent) {
                            HighchartsAdapter.fireEvent(series, 'selectionChange', null);
                            if (newValue == '') {
                                HighchartsAdapter.fireEvent(series, 'selectionCleared', null);
                            } else {
                                HighchartsAdapter.fireEvent(series, 'selectionMade', null);
                            }
                        }

                    }
                }
            }
        },

        pointSelectedDeffered: function (series) {

        },

        getPointById: function (series, id) {
            for (var i = 0; i < series.points.length; i++) {
                if (series.points[i].id == id)
                    return series.points[i];
            }

            return null;
        },

        changeSelection: function (series, minPoint, maxPoint) {
            var select = false;
            for (var i = 0; i < series.points.length; i++) {
                var point = series.points[i];
                if (point.id == minPoint) {
                    select = true;
                }
                point.selected = select;
                point.setState(select && 'select');

                if (point.id == maxPoint) {
                    select = false;
                }
            }
        },

        getSelectedValues: function (series, values) {
            var point, idx, value, i,
                length = series.points.length,
                selection = series.options.selection,
                excludedPointValues = [];

            if (selection && selection.excludedPointValues && selection.excludedPointValues.length > 0) {
                excludedPointValues = selection.excludedPointValues;
            }

            for (i = 0; i < length; i++) {
                point = series.points[i];
                if (point.selected) {
                    value = point.id || '';
                    idx = values.indexOf(value);
                    if (idx == -1 && excludedPointValues.indexOf(value) == -1) {
                        values.push(value);
                    }
                }
            }
        },

        getSelectedValuesForTreemap: function (series, values) {
            var point, i, level = 0,
                length = series.points.length;
            for (i = 0; i < length; i++) {
                point = series.points[i];
                this.getSelectedValuesForTreemapPoint(point, values);
            }
        },

        getSelectedValuesForTreemapPoint: function (point, values) {
            var idx, value;
            for (var j = 0; j < point.children.length; j++) {
                this.getSelectedValuesForTreemapPoint(point.children[j], values);
            }
            if (point.selectable) {
                if (point.selected) {
                    value = point.id || '';
                    idx = values[point.selectionId];
                    if (idx === undefined || values[point.selectionId][0] === '') {
                        values[point.selectionId] = [value];
                    } else {
                        values[point.selectionId].push(value);
                    }
                } else if (!values[point.selectionId] || !values[point.selectionId].length) {
                    values[point.selectionId] = [''];
                }
            }
        },

        rangeSelected: function (series, xMin, xMax, yMin, yMax, rect, fireEvent) {
            var point,
                i = 0, length = series.points.length,
                selection = series.options.selection,
                valueElement,
                pointValue,
                excludedPointValues = [];

            if (!selection) {
                return;
            }

            if (selection.mode == 'Point') {
                if (selection && selection.excludedPointValues && selection.excludedPointValues.length > 0) {
                    excludedPointValues = selection.excludedPointValues;
                }

                for (; i < length; i++) {
                    point = series.points[i];

                    if ((selection.selectionType == "AreaXAxis" && point.x >= xMin && point.x <= xMax) ||
                        (selection.selectionType == "AreaYAxis" && point.y >= yMin && point.y <= yMax) ||
                        (point.x >= xMin && point.x <= xMax && point.y >= yMin && point.y <= yMax)) {

                        pointValue = point.id || '';
                        if (excludedPointValues.indexOf(pointValue) == -1) {
                            point.selected = true;
                            point.setState(true && 'select');
                        } 
                    } else {
                        point.selected = false;
                        point.setState(false && 'select');
                    }
                }

                this.pointsSelected(series, fireEvent);
                return;
            }

            if (series.xAxis.isDatetimeAxis) {
                xMin = xMin == null ? '' : LogiXML.Formatter.formatDate(xMin, 'U');
                xMax = xMax == null ? '' : LogiXML.Formatter.formatDate(xMax, 'U');
            } else if (series.xAxis.categories && series.xAxis.names.length > 0) {
                if (xMin !== null) {
                    xMin = Math.max(0, Math.round(xMin));
                    if (series.xAxis.names.length > xMin) {
                        xMin = series.xAxis.names[xMin];
                    }
                }
                if (xMax !== null) {
                    xMax = Math.min(series.xAxis.names.length - 1, Math.round(xMax));
                    if (series.xAxis.names.length > xMax) {
                        xMax = series.xAxis.names[xMax];
                    }
                }
            } else if (xMin != null && xMax != null) {
                //Round the value to the nearest 3 significant digits
                xMin = parseFloat(xMin.toPrecision(3));
                xMax = parseFloat(xMax.toPrecision(3));
            }

            if (series.yAxis.isDatetimeAxis) {
                yMin = yMin == null ? '' : LogiXML.Formatter.formatDate(yMin, 'U');
                yMax = yMax == null ? '' : LogiXML.Formatter.formatDate(yMax, 'U');
            } else if (series.yAxis.categories && series.yAxis.names.length > 0) {
                if (yMin !== null) {
                    yMin = Math.max(0, Math.round(yMin));
                    if (series.yAxis.names.length > yMin) {
                        yMin = series.yAxis.names[yMin];
                    }
                }
                if (yMax !== null) {
                    yMax = Math.min(series.yAxis.names.length - 1, Math.round(yMax));
                    if (series.yAxis.names.length > yMax) {
                        yMax = series.yAxis.names[yMax];
                    }
                }
            } else if (yMin != null && yMax != null) {
                //Round the value to the nearest 3 significant digits
                yMin = parseFloat(yMin.toPrecision(3));
                yMax = parseFloat(yMax.toPrecision(3));
            }

            if (xMin === null) {
                xMin = '';
            }
            if (xMax === null) {
                xMax = '';
            }
            if (yMin === null) {
                yMin = '';
            }
            if (yMax === null) {
                yMax = '';
            }

            //range selection 
            if (selection.changeFlagElementId && selection.changeFlagElementId.length > 0) {
                valueElement = this.getOrCreateInputElement(selection.changeFlagElementId);
                valueElement.set('value', 'True');
            }

            if (fireEvent) {
                if (selection.minXElementId && selection.minXElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.minXElementId);
                    valueElement.set('value', xMin);
                }
                if (selection.maxXElementId && selection.maxXElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.maxXElementId);
                    valueElement.set('value', xMax);
                }

                if (selection.minYElementId && selection.minYElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.minYElementId);
                    valueElement.set('value', yMin);
                }

                if (selection.maxYElementId && selection.maxYElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.maxYElementId);
                    valueElement.set('value', yMax);
                }
                var eventArgs = {
                    rect: rect,
                    xMin: xMin,
                    xMax: xMax,
                    yMin: yMin,
                    yMax: yMax
                };
                HighchartsAdapter.fireEvent(series, 'selectionChange', eventArgs);
                HighchartsAdapter.fireEvent(series, 'selectionMade', eventArgs);
            }
        },

        getOrCreateInputElement: function (id) {
            var inputElement = Y.one("input[name='" + id + "'],select[name='" + id + "']");
            if (inputElement === null) {
                inputElement = Y.Node.create('<input type="hidden" name="' + id + '" id="' + id + '" />');
                this.configNode.ancestor().appendChild(inputElement);
            }
            return inputElement;
        },

        getInputElementValue: function (inputElement) {
            var inputElementType = inputElement.getAttribute('type'),
                selectedValues = [];
            switch (inputElementType) {
                case "checkbox":
                case "radio":
                    Y.all("input[name='" + inputElement.getAttribute('name') + "']").each(function (inputNode) {
                        if (inputNode.get('checked')) {
                            selectedValues.push(inputNode.get('value'));
                        }
                    });

                    if (LogiXML.rdInputTextDelimiter)
                        return LogiXML.rdInputTextDelimiter.delimit(selectedValues, ",", '"', "\\");

                    return selectedValues.join(',');
                    break;
                default:
                    if (inputElement.get('nodeName').toLowerCase() == "select") {
                        inputElement.all('option').each(function (inputNode) {
                            if (inputNode.get('selected')) {
                                selectedValues.push(inputNode.get('value'));
                            }
                        });

                        if (LogiXML.rdInputTextDelimiter)
                            return LogiXML.rdInputTextDelimiter.delimit(selectedValues, ",", '"', "\\");

                        return selectedValues.join(',');
                    } else {
                        return inputElement.get('value');
                    }
                    break;
            }
            return "";
        },

        setInputElementValue: function (inputElement, value) {
            var inputElementType = inputElement.getAttribute('type');
            var selectedValues;
            
            if (LogiXML.rdInputTextDelimiter)
                selectedValues = LogiXML.rdInputTextDelimiter.getEntries(value, ",", '"', "\\", false);
            else
                selectedValues = value.split(',');

            switch (inputElementType) {
                case "checkbox":
                case "radio":
                    Y.all("input[name='" + inputElement.getAttribute('name') + "']").each(function (inputNode) {
                        if (selectedValues.indexOf(inputNode.get('value')) != -1) {
                            inputNode.set('checked', true);
                        } else {
                            inputNode.set('checked', false);
                        }
                    });
                    break;
                default:
                    if (inputElement.get('nodeName').toLowerCase() == "select") {
                        inputElement.all('option').each(function (inputNode) {
                            if (selectedValues.indexOf(inputNode.get('value')) != -1) {
                                inputNode.set('selected', true);
                            } else {
                                inputNode.set('selected', false);
                            }
                        });
                    } else {
                        return inputElement.set('value', value);
                    }
                    break;
            }
            return "";
        },
        
        destroySelection: function (e, fireEvent) {
            var i = 0, y = 0,
                length = this.chart.series.length, dataLength,
                point, series, selection, wasSelected = false, notClearSelection = false;

            if (this.rangeSelection) { 
                wasSelected = true;
            }
            //clear selected points
            for (; i < length; i++) {
                series = this.chart.series[i];
                selection = series.options.selection;

                if (!selection) {
                    continue;
                }
                switch (selection.mode) {
                    case 'Range':
                        if (!notClearSelection && series.options.selection.disableClearSelection === true) {
                            notClearSelection = true;
                        }
                        if (!notClearSelection) {
                            if (wasSelected && fireEvent) {
                                this.rangeSelected(series, null, null, null, null, null, fireEvent);
                                HighchartsAdapter.fireEvent(series, 'selectionCleared', null);
                            }
                        }
                        break;

                    default:
                        if (fireEvent) {
                            y = 0; dataLength = series.points.length;
                            for (; y < dataLength; y++) {
                                point = series.points[y];
                                if (point.selected) {
                                    point.selected = false;
                                    point.setState(false && 'select');
                                }
                            }
                            this.pointsSelected(series, fireEvent, e);
                        }
                        break;
                }
            }

            if (wasSelected && !notClearSelection) {
                this.rangeSelection.destroy();
                this.rangeSelection = null;
            }
        },

        selectionDrawn: function (e, fireEvent, skipCreateRange) {
            var self = this,
                zoomType = this.chart.options.chart.zoomType;
            if (this.chart.inverted) {
                zoomType = zoomType == 'x' ? 'y' : zoomType == 'y' ? 'x' : zoomType;
            }
            if (!skipCreateRange) {
                this.chart.plotBackground.element.style.cursor = this.plotBackgroundCursor;
                this.rangeSelection = new Y.LogiXML.ChartCanvasRangeSelection(
                {
                    callback: function (rect) { self.selectionChanged(rect, true) },
                    configNode: this.configNode,
                    maskRect: e.selectionBox,
                    constrainRect: this.chart.plotBox,
                    maskType: zoomType,
                    fillColor: this.chart.options.chart.selectionMarkerFill || 'rgba(69,114,167,0.25)',
                    isReadOnly: e.isReadOnly
                });
            }
            this.selectionChanged(e.selectionBox, fireEvent);
            return false;
        },

        chartRedrawn: function (e) {

            var chart = e.target,
                oldWidth = chart.oldChartWidth,
                oldHeight = chart.oldChartHeight,
                chartHeight = chart.chartHeight,
                chartWidth = chart.chartWidth,
                diffWidth, diffHeight;

            var zoomType = chart.options.chart.zoomType,
                i = 0, length = chart.series.length, series, selection;

            if (oldWidth && oldWidth != chartWidth) {
                diffWidth = chartWidth - oldWidth;
            }
            if (oldHeight && oldHeight != chartHeight) {
                diffHeight = chartHeight - oldHeight;
            }

            //reset selection
            if (zoomType && this.rangeSelection && (diffWidth || diffHeight)) {
                for (; i < length; i++) {
                    series = this.chart.series[i];
                    selection = series.options.selection;

                    if (!selection) {
                        continue;
                    }

                    if (selection.mode == 'Range') {
                        this.syncSelectedValues(series);
                    } else if (selection.mode == 'Point' &&
                        (selection.selectionType == "ClickSinglePoint" || selection.selectionType == "ClickMultiplePoints" || selection.selectionType == "ClickRangePoints") && this.rangeSelection) {
                        this.destroySelection();
                    }
                }
            }
        },

        selectionChanged: function (rect, fireEvent) {
            var xMin, xMax, yMin, yMax,
                i = 0, y = 0,
                length = this.chart.series.length, dataLength,
                point, series, selection, valueElement;

            for (; i < length; i++) {
                series = this.chart.series[i];
                selection = series.options.selection;

                if (!selection || (selection.selectionType == "ClickSinglePoint" || selection.selectionType == "ClickMultiplePoints")) {
                    continue;
                }

                //turn off zoom if DisableClearSelection
                if (selection.disableClearSelection) {
                    this.chart.pointer.zoomX = false;
                    this.chart.pointer.zoomY = false;
                }

                //TODO: check if series has x/y axis
                if (this.chart.inverted) {
                    switch (selection.selectionType) {
                        case 'AreaXAxis':
                            xMin = series.xAxis.toValue(rect.y + rect.height);
                            xMax = series.xAxis.toValue(rect.y);
                            yMin = null;
                            yMax = null;
                            break;
                        case 'AreaYAxis':
                            xMin = null;
                            xMax = null;
                            yMin = series.yAxis.toValue(rect.x);
                            yMax = series.yAxis.toValue(rect.x + rect.width);
                            break;
                        default:
                            xMin = series.xAxis.toValue(rect.y + rect.height);
                            xMax = series.xAxis.toValue(rect.y);
                            yMin = series.yAxis.toValue(rect.x);
                            yMax = series.yAxis.toValue(rect.x + rect.width);
                    }
                } else {
                    switch (selection.selectionType) {
                        case 'AreaXAxis':
                            xMin = series.xAxis.toValue(rect.x);
                            xMax = series.xAxis.toValue(rect.x + rect.width);
                            yMin = null;
                            yMax = null;
                            break;
                        case 'AreaYAxis':
                            xMin = null;
                            xMax = null;
                            yMin = series.yAxis.toValue(rect.y + rect.height);
                            yMax = series.yAxis.toValue(rect.y);
                            break;
                        default:
                            xMin = series.xAxis.toValue(rect.x);
                            xMax = series.xAxis.toValue(rect.x + rect.width);
                            yMin = series.yAxis.toValue(rect.y + rect.height);
                            yMax = series.yAxis.toValue(rect.y);
                    }
                }
                this.rangeSelected(series, xMin, xMax, yMin, yMax, rect, fireEvent);
            }
        },

        syncSelectedValues: function (series, seriesIndex) {
            var selection = series.options ? series.options.selection : series.selection,
                valueElement, eleDelimited, value, values, id,
                i = 0, length, minX, maxX, minY, maxY, selectionBox, 
                minPointValueElement, maxPointValueElement,
                minPointValue, maxPointValue;
            if (!selection) {
                return;
            }
            if (selection.mode == 'Point') {
                if (!selection.valueElementId || selection.valueElementId.length == 0) {
                    return;
                }

                valueElement = this.getOrCreateInputElement(selection.valueElementId);
                if (!valueElement) {
                    return;
                }

                value = this.getInputElementValue(valueElement);
                if (!value || value.length == 0) {
                    return;
                }

                if (LogiXML.rdInputTextDelimiter) {
                    eleDelimited = this.getOrCreateInputElement("rdCSV_" + selection.valueElementId);
                    delimitedValue = this.getInputElementValue(eleDelimited);
                    //When open an existing chart,the rdCSV hidden element was not built.
                    if (!delimitedValue) {
                        delimitedValue = value;
                    }
                    values = LogiXML.rdInputTextDelimiter.getEntries(delimitedValue, ",", '"', "\\", false);
                }
                else
                    values = value.split(',');

                switch (selection.selectionType) {
                    case "ClickSinglePoint":
                    case "ClickMultiplePoints":
                        length = series.data ? series.data.length : 0;
                        i = 0;
                        for (; i < length; i++) {
                            id = series.data[i].id;
                            if (values.indexOf(id) != -1) {
                                series.data[i].selected = true;
                                if (series.type == "pie") {
                                    series.data[i].sliced = true;
                                }
                            }
                        }
                        break;

                    case "ClickRangePoints":
                        if (values.length > 0) {
                            minX = values[0];
                            maxX = values[values.length - 1];
                            if (minX && minX != '' && maxX && maxX != '') {
                                if (!series.xAxis) {
                                    //chart is not created yes, so we can't restore selection
                                    //lets re-run it when chart created
                                    this.restoreSelectionForSeriesIndex = i;
                                    return;
                                }
                                selectionBox = this.getSelectionBox(series, minX, maxX, null, null);
                            }
                            this.selectionDrawn({ selectionBox: selectionBox, isReadOnly: selection.isReadOnly }, false, true);
                        }
                        break;

                    case "Area":
                    case "AreaXAxis":
                    case "AreaYAxis":
                        if (values.length > 0) {
                            minX = values[0];
                            maxX = values[values.length - 1];
                            if (minX && minX != '' && maxX && maxX != '') {
                                if (!series.xAxis) {
                                    //chart is not created yes, so we can't restore selection
                                    //lets re-run it when chart created
                                    this.restoreSelectionForSeriesIndex = i;
                                    return;
                                }
                                selectionBox = this.getSelectionBox(series, minX, maxX, null, null);
                            }
                            this.selectionDrawn({ selectionBox: selectionBox, isReadOnly: selection.isReadOnly }, false);
                        }
                        break;
                }
            }

            if (selection.mode == 'Range') {
                if (selection.RestoreSelection) {
                    if (selection.SelectedValues[0]) {
                        minX = selection.SelectedValues[0];
                    }
                    if (selection.SelectedValues[1]) {
                        minY = selection.SelectedValues[1];
                    }
                    if (selection.SelectedValues[2]) {
                        maxX = selection.SelectedValues[2];
                    }
                    if (selection.SelectedValues[3]) {
                        maxY = selection.SelectedValues[3];
                    }
                    selectionBox = this.getSelectionBox(series, minX, maxX, minY, maxY);
                    series.chart.renderer.rect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height, 5).attr({ fill: this.chart.options.chart.selectionMarkerFill || 'rgba(69,114,167,0.25)' }).add();
                } else {
                    if (selection.minXElementId && selection.minXElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.minXElementId);
                        minX = valueElement.get('value');
                    }
                    if (selection.maxXElementId && selection.maxXElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.maxXElementId);
                        maxX = valueElement.get('value');
                    }
                    //}

                    //if (selection.maskType == 'y' || selection.maskType == 'xy') {
                    if (selection.minYElementId && selection.minYElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.minYElementId);
                        minY = valueElement.get('value');
                    }

                    if (selection.maxYElementId && selection.maxYElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.maxYElementId);
                        maxY = valueElement.get('value');
                    }
                    if (selection.mode == 'Range' && selection.selectionType == 'Area' && ((!minX || minX == "") || (!minY || minY == "") || (!maxX || maxX == "") || (!maxY || maxY == ""))) {
                        return;
                    }

                    if ((minX && minX != "") || (minY && minY != "")) {
                        selectionBox = this.getSelectionBox(series, minX, maxX, minY, maxY);
                        if (this.rangeSelection) {
                            this.destroySelection();
                        }
                        this.selectionDrawn({ selectionBox: selectionBox, isReadOnly: selection.isReadOnly }, false);
                    }
                }
            }
        },

        checkDateStringForTimeZone: function (sDate) {
		    if (sDate && sDate.length == 19 && sDate.indexOf('Z') == -1) {
		        sDate = sDate + 'Z'
		    }
		    return sDate;
        },

        getSelectionBox: function(series, minX, maxX, minY, maxY) {
            var selectionBox = {},
                x1, x2, y1, y2, dt, tmp;
            if (series.xAxis.isDatetimeAxis) {
                minX = minX && minX != "" ? new Date(this.checkDateStringForTimeZone(minX)) : null;
                maxX = maxX && maxX != "" ? new Date(this.checkDateStringForTimeZone(maxX)) : null;
            } else if (series.xAxis.categories === true) {
                minX = series.xAxis.names.indexOf(minX);
                minX = minX == -1 ? null : minX;

                maxX = series.xAxis.names.indexOf(maxX);
                maxX = maxX == -1 ? null : maxX;
            }
            if (series.yAxis.isDatetimeAxis) {
                minY = minY && minY != "" ? new Date(minY) : null;
                maxY = maxY && maxY != "" ? new Date(maxY) : null;
            } else if (series.yAxis.categories === true) {
                minY = series.yAxis.names.indexOf(minY);
                minY = minY == -1 ? null : minY;

                maxY = series.yAxis.names.indexOf(maxY);
                maxY = maxY == -1 ? null : maxY;
            }

            x1 = series.xAxis.toPixels(minX != null && minX.toString() != "" ? minX : series.xAxis.getExtremes().min);
            x2 = series.xAxis.toPixels(maxX != null && maxX.toString() != "" ? maxX : series.xAxis.getExtremes().max);
            y1 = series.yAxis.toPixels(minY != null && minY.toString() != "" ? minY : series.yAxis.getExtremes().min);
            y2 = series.yAxis.toPixels(maxY != null && maxY.toString() != "" ? maxY : series.yAxis.getExtremes().max);

            if (series.chart.inverted) {
                if (isNaN(x1) || x1 > series.xAxis.toPixels(series.xAxis.getExtremes().min)) {
                    x1 = series.xAxis.toPixels(series.xAxis.getExtremes().min);
                }
                if (isNaN(x2) || x2 < series.xAxis.toPixels(series.xAxis.getExtremes().max)) {
                    x2 = series.xAxis.toPixels(series.xAxis.getExtremes().max);
                }
                if (isNaN(y1) || y1 < series.yAxis.toPixels(series.yAxis.getExtremes().min)) {
                    y1 = series.yAxis.toPixels(series.yAxis.getExtremes().min);
                }
                if (isNaN(y2) || y2 > series.yAxis.toPixels(series.yAxis.getExtremes().max)) {
                    y2 = series.yAxis.toPixels(series.yAxis.getExtremes().max);
                }
            }
            else {
                if (isNaN(x1) || x1 < series.xAxis.toPixels(series.xAxis.getExtremes().min)) {
                    x1 = series.xAxis.toPixels(series.xAxis.getExtremes().min);
                }
                if (isNaN(x2) || x2 > series.xAxis.toPixels(series.xAxis.getExtremes().max)) {
                    x2 = series.xAxis.toPixels(series.xAxis.getExtremes().max);
                }
                if (isNaN(y1) || y1 > series.yAxis.toPixels(series.yAxis.getExtremes().min)) {
                    y1 = series.yAxis.toPixels(series.yAxis.getExtremes().min);
                }
                if (isNaN(y2) || y2 < series.yAxis.toPixels(series.yAxis.getExtremes().max)) {
                    y2 = series.yAxis.toPixels(series.yAxis.getExtremes().max);
                }
            }

            

            if (this.chart.inverted) {
                selectionBox.x = y1;
                selectionBox.width = y2 - selectionBox.x;
                selectionBox.y = x2;
                selectionBox.height = x1 - selectionBox.y;
            } else {
                selectionBox.x = x1;
                selectionBox.width = x2 - selectionBox.x;
                selectionBox.y = y2;
                selectionBox.height = y1 - selectionBox.y;
            }

            return selectionBox;
        },

        setQuicktipsData: function (quicktips) {
            if (!quicktips && quicktips.length == 0) {
                return;
            }

            var i = 0, length = quicktips.length;
            for (var i = 0; i < length; i++) {
                this.chart.series[quicktips[i].index].quicktip = quicktips[i];
            }
        },

        setActions: function(series) {
            var i = 0,
                length = series.length,
                options;

            for (; i < length; i++) {
                options = series[i];
                if (options.events) {
                    for (var event in options.events) {
                        if (Lang.isString(options.events[event])) {
                            options.events[event] = function (e) {
                                // REPDEV-23729
                                // if this is a click event, then the valueElement hasn't been set yet,
                                // because pointsSelected hasn't been triggered yet,
                                // but it will be set before this call stack has completed.
                                // Therefore setting a timeout will ensure that the report defined click event
                                // will not be triggered until after the value has been set.
                                if (e.type == "click")
                                    setTimeout(this.fun, 10, e);
                                else
                                    this.fun(e);
                            }.bind({
                                fun: new Function('e', options.events[event])
                            });
                        }
                    }
                }
            }
        },

        updateChartOptions: function(response,callback,arg){
            this.chart.userOptions = response;
            this[callback](arg);

        },

        resized: function (e) {
            if (this.chart && this.chart.options) {
                //25753 if series undefined, try to request chart data from server
                if (!this.chart.userOptions.series) {
                    this.requestChartData(null, "updateChartOptions", "resized", e);
                }
                else {
                    var heightOnly = e.width == null;
                    var widthOnly = e.height == null;

                    var width = e.width > 0 ? e.width : this.chart.chartWidth,
                        height = e.height > 0 ? e.height : this.chart.chartHeight;
                    var isGauge = this.chart.userOptions.series[0].type.indexOf("gauge") > -1 && this.chart.userOptions.series[0].type !== "numbergauge";
                    if (this.chart.userOptions.series[0].type.indexOf("bulletgauge") > -1) {
                        this.chart.animation = !this.chart.animation;
                    }

                    width = parseInt(width, 10); //25355
                    height = parseInt(height, 10);

                    if (heightOnly) {
                        this.chart.options.chart.height = height;
                        this.chart.reflow();
                    } else {
                        this.chart.setSize(width, height);
                    }

                    if (e.finished) {
                        if (isGauge) {
                            this.chart.animation = true;
                            var tempUserOptions = this.chart.userOptions;
                            tempUserOptions.chart.width = width;
                            tempUserOptions.chart.height = height;
                            //tempUserOptions.chart.animation = null;
                            this.createChart(tempUserOptions);

                            if (!this.chart.angular) {
                                if (heightOnly) {
                                    this.chart.options.chart.height = height;
                                    this.chart.reflow();
                                } else {
                                    this.chart.setSize(width, height);
                                }
                            }
                        }
                        var requestUrl = null;
                        if (this.refreshAfterResize == true) {
                            this.requestChartData(this.jsonUrl + '&rdResizerNewWidth=' + width + '&rdResizerNewHeight=' + height + "&rdResizer=True", "createChart");
                            //return;
                            requestUrl = 'rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SetElementSize&rdWidth=' + width + '&rdHeight=' + height + '&rdElementId=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
                        } else if (this.refreshAfterResize) {
                            requestUrl = 'rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + '&rdWidth=' + width + '&rdHeight=' + height + '&rdReport=' + this.reportName + '&rdResizeRequest=True&rdRequestForwarding=Form';
                        } else if (e.notify === undefined || (e.notify == true)) {
                            requestUrl = 'rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SetElementSize&rdWidth=' + width + '&rdHeight=' + height + '&rdElementId=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
                        }
                        if (requestUrl !== null) {
                            if (this.isUnderSE === "True") {
                                requestUrl += "&rdUnderSuperElement=True";
                            }

                            if (document.getElementById("rdFreeformLayout")) {
                                requestUrl += "&rdFreeformLayout=True";
                                console.log("width: " + width);
                                console.log("height: " + height);
                            }
                            rdAjaxRequest(requestUrl);
                        }
                    }
                }
            }
        },

        showError: function (message) {
            if (this.chart) {
                this.chart.destroy();
            }
            if (!message && this.debugUrl == "") {
                
                message = "<img src='rdTemplate/rdChartError.gif'>";
            }
            if (message) {
                var errorContainer = Y.Node.create("<span style='color:red'></span>");
                errorContainer.setHTML(message);
                this.configNode.append(errorContainer);
            } else {
                var aLink, imgError;
                aLink = document.createElement("A")
                aLink.href = this.debugUrl
                //Make a new IMG inside of the anchor that points to the error GIF.
                imgError = document.createElement("IMG")
                imgError.src = "rdTemplate/rdChartError.gif"

                aLink.appendChild(imgError)
                this.configNode.append(aLink);
            }
        },

        preProcessDrillTo: function (chartOptions) {
            if (!chartOptions.drillTo) {
                return;
            }
            this.drillTo = chartOptions.drillTo;

            //show drillup button
            //if (this.drillTo.drilledToStates && this.drillTo.drilledToStates.length > 0) {
            //    this.chart.showdrillUpButton();
            //    //chartOptions.exporting.buttons.drillupButton.enabled = true;
            //    //if (!chartOptions.exporting.buttons.drillupButton.onclick) {
            //    //    chartOptions.exporting.buttons.drillupButton.onclick = function () { this.chartCanvas.drillupClick() };
            //    //}
            //} else {
            //    //chartOptions.exporting.buttons.drillupButton.enabled = false;
            //}

            //hide columns in use
            var columnsInUse = [];
            var i;
            if (this.drillTo.usedColumnIndexes.length > 0) {
                for (i = 0; i < this.drillTo.usedColumnIndexes.length; i++) {
                    if (this.drillTo.usedColumnIndexes[i] == -1) {
                        continue;
                    }
                    if (i == 0) {
                        this.addDateGroupingIntoDrilledColumn(this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[i]].DataColumn, this.drillTo.currentDateGrouping, columnsInUse);
                    } else {
                        this.addDateGroupingIntoDrilledColumn(this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[i]].DataColumn, null, columnsInUse);
                    }
                }
            }
            
            for (i = 0; i < this.drillTo.drilledToStates.length; i++) {
                this.addDateGroupingIntoDrilledColumn(this.drillTo.drilledToStates[i].DrilledFilterColumn, this.drillTo.drilledToStates[i].DrilledFilterDateGrouping, columnsInUse);
                this.addDateGroupingIntoDrilledColumn(this.drillTo.drilledToStates[i].DrilledColumn, this.drillTo.drilledToStates[i].DrilledColumnDateGrouping, columnsInUse);
            }

            var options = Y.all('#' + this.drillTo.popupId + ' option');
            options.each(function (node) {
                if (columnsInUse.indexOf(node.get('value')) != -1) {
                    node.setAttribute('disabled', "disabled");
                    node.setStyle('color', '#cccccc');
                } else {
                    node.removeAttribute('disabled');
                    node.setStyle('color', '');
                }
            }, this);

            var columnSelect = Y.one('#' + this.drillTo.columnDropDownId);
            if (columnSelect) {
                var existedEvent = columnSelect.getData('drillToAction');
                if (existedEvent) {
                    existedEvent.detach();
                    existedEvent = null;
                    columnSelect.set('value', '');
                }
                columnSelect.setData('drillToAction', columnSelect.on('change', function () { this.doDrillTo(columnSelect.get('value')) }, this));
                this.highlightJoinedColumns();
            }
            //REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
            var isSsrmDashboard = this.configNode.getAttribute('is-ssrm-dashboard');
            var chartDrillToStatus = this.configNode.getAttribute('chart-drillTo-status');
            //The new breadecrumb menu only show in SSRM dashboard.
            if (isSsrmDashboard == 'True' && chartDrillToStatus == '2') {
                this.updateDrillInfoBreadcrumb();
            }
        },             

        addDateGroupingIntoDrilledColumn: function (dataColumnName, dateGrouping, columnsInUse) {
            var dataColumn = null;
                i = 0;
            for (; i < this.drillTo.drillToColumns.length; i++) {
                if (this.drillTo.drillToColumns[i].DataColumn == dataColumnName) {
                    dataColumn = this.drillTo.drillToColumns[i];
                    break;
                }
            }

            if (dateGrouping && dateGrouping.length > 0) {
                if (this.drillTo.usedColumnIndexes[0] != -1 && this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[0]].DataColumn != dataColumnName) {
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                    columnsInUse.push(dataColumnName);
                } else {
                    switch (dateGrouping) {
                        case 'FirstDayOfYear':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            break;
                        case 'FirstDayOfQuarter':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            break;
                        case 'FirstDayOfMonth':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalMonth');
                            break;
                        case 'FirstDayOfFiscalYear':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                            break;
                        case 'FirstDayOfFiscalQuarter':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                            break;
                    }
                }
            } else if (dataColumn.DataType == 'DateTime') {
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalMonth');
                columnsInUse.push(dataColumnName);
            } else {
                columnsInUse.push(dataColumnName);
            }

        },

        drillBackClick: function () {
            var inpName = this.id + '_' + "drillTo";
            var inp = this.getOrCreateInputElement(inpName);
            this.drillTo.drilledToStates.pop();
            inp.set('value', JSON.stringify(this.drillTo.drilledToStates));
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdAction=ChartDrillTo&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            if (this.drillTo.sGlobalFilterPopupId) {
                requestUrl += '&rdPopupId=' + this.drillTo.sGlobalFilterPopupId
            }
            rdAjaxRequest(requestUrl);
        },

        pointClick: function (point) {
            if (this.drillTo.excludedPointValues && this.drillTo.excludedPointValues.length > 0) {
                var excludedPointValues = this.drillTo.excludedPointValues;
                var clickedValue = point.name ? point.name : point.x;
                if (excludedPointValues.indexOf(clickedValue) != -1) {
                    return;
                }
            }
            //multiple actions available
            //show associated popup
            ShowElement(this.id, this.drillTo.popupId, '', '');
            if (!this.drillTo.current) {
                this.drillTo.current = {};
            }
            this.drillTo.current.DrilledFilterColumn = this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[0]].DataColumn;
            this.drillTo.current.DrilledFilterValue = point.originalName;

            var drillDataType = this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[0]].DataType;

            if (!point.name && drillDataType == 'Text') {
                this.drillTo.current.DrilledFilterValue = '';
            } else if (drillDataType == 'DateTime' || drillDataType == 'Date') {
                var isoDateString = new Date(this.drillTo.current.DrilledFilterValue).toISOString();
                this.drillTo.current.DrilledFilterValue = isoDateString;
                this.drillTo.current.DrilledFilterDateGrouping = this.drillTo.currentDateGrouping;
            }
        },

        doDrillTo: function (dataColumn) {
            var timePeriod = '';
            if (dataColumn.indexOf('!timeperiod!') != -1) {
                var splittedColumn = dataColumn.split('!timeperiod!');
                timePeriod = splittedColumn[1];
                dataColumn = splittedColumn[0];
            }
            if (dataColumn == '') {
                this.drillTo.drilledToStates = [];
            } else {
                this.drillTo.current.DrilledColumn = dataColumn;
                this.drillTo.current.DrilledColumnDateGrouping = timePeriod;
                this.drillTo.drilledToStates.push(this.drillTo.current);
            }

            // persist types
            for (var i = 0; i < this.drillTo.drilledToStates.length; i++) {
                var drilledToState = this.drillTo.drilledToStates[i];

                for (var j = 0; j < this.drillTo.drillToColumns.length; j++) {
                    var drillToColumn = this.drillTo.drillToColumns[j];

                    if (drillToColumn.DataColumn == drilledToState.DrilledFilterColumn) {
                        drilledToState.DrilledFilterColumnType = drillToColumn.DataType;
                        break;
                    }
                }
            }

            var inpName = this.id + '_' + "drillTo";
            var inp = this.getOrCreateInputElement(inpName);
            inp.set('value', JSON.stringify(this.drillTo.drilledToStates));
            //REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
            //Add new parameter rdAction=ChartDrillTo when do drill to or drill back action.
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdAction=ChartDrillTo&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            if (this.drillTo.sGlobalFilterPopupId) {
                requestUrl += '&rdPopupId=' + this.drillTo.sGlobalFilterPopupId
            }
            rdAjaxRequest(requestUrl);
            ShowElement(this.id, this.drillTo.popupId, 'False', 'False');
        },
        //REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
        updateDrillInfoBreadcrumb: function () {
            if (this.drillInfoBreadcrumb) {
                this.drillInfoBreadcrumb.destroy();
            }
            var chart = this;
            Y.use('chartDrillToBreadcrumb', function (Y) {
                chart.drillInfoBreadcrumb = new Y.LogiXML.ChartDrillToBreadcrumb({
                    drillTo: chart.drillTo,             
                    rdChartCanvasId: chart.id,
                    reportName: chart.reportName
                });
            });
        },

        highlightJoinedColumns: function () {
            var joinedOptgroups = Y.all('#' + this.drillTo.popupId + '  optgroup');
            if (joinedOptgroups && joinedOptgroups.size() > 1) {
                var i = 0;
                for (; i < joinedOptgroups.size(); i++) {
                    joinedOptgroups.item(i).addClass("rdAgQbColor" + ((i%6)+1))
                }
            }
        },

        showPopupMenu: function (e, ppId) {
            if (e && e.point && e.point.series && e.point.series.options && e.point.series.options.selection
                && e.point.series.options.selection.excludedPointValues && e.point.series.options.selection.excludedPointValues.length > 0
                && e.point.series.options.selection.excludedPointValues.indexOf(e.point.name) != -1) {
                return;
            }

            if (this.id && this.id.indexOf('_Row') != -1) {
                var sRowNum = this.id.substring(this.id.indexOf('_Row'));
                ppId = ppId + sRowNum;
            }
            this.e = e;
           
            var lbl = Y.one('#' + ppId);
            var rdDpDiv = lbl.ancestor('div.rdDashboardPanel'),
                rdDpContainerDiv;
            if (rdDpDiv) {
                var rdDpContainerDiv = rdDpDiv.ancestor();

                if (rdDpDiv && rdDpDiv.getAttribute('style').indexOf('position') > -1) {
                    rdDpDiv.setStyle('position', '');
                }
            }

            lbl.setStyle('position', 'absolute');

            if (rdDpContainerDiv && rdDpContainerDiv.getAttribute("class").indexOf('freeformPanelContainer') > -1) {
                lbl.setStyle('left', (e.chartX + 10) + 'px');
                lbl.setStyle('top', e.chartY  + 'px');
            } else if (lbl.ancestor('div.rdResponsiveColumn')) {
                if (!LogiXML.isIE()) {
                    lbl.setStyle('left', e.offsetX + 'px');
                    lbl.setStyle('top', e.offsetY + 'px');
                } else {
                    lbl.setStyle('left', e.x + 'px');
                    lbl.setStyle('top', e.y + 'px');
                }
            } else {
                lbl.setStyle('left', e.pageX + 'px');
                lbl.setStyle('top', e.pageY + 'px');
            }

            lbl.setStyle('visibility', 'hidden');
            lbl.getData('ppObject').rdShowPopupMenu(ppId, '');
           
        },

        execPopupMnuAction: function (actionIndex) {
            var sAction = this.e.point.series.options.events.popupMenus[actionIndex];
            window.rdActionToFunction = new Function('e', sAction);
            window.rdActionToFunctionArg = this.e;
            window.setTimeout(function () { window.rdActionToFunction(window.rdActionToFunctionArg);}, 100);
        }

    }, {
        // Static Methods and properties
        NAME: 'ChartCanvas',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },

        createElements: function (isAjax) {
            if (!isAjax) {
                isAjax = false;
            }

            var chart;

            Y.all('.' + TRIGGER).each(function (node) {
                chart = node.getData(TRIGGER);
                if (!chart) {
                    chart = new Y.LogiXML.ChartCanvas({
                        configNode: node,
                        isAjax: isAjax
                    });
                }
            });
        },

        handleError: function (e) {
            var chart = e.chart,
                code = e.code,
                errorText = '';
            switch (code) {
                case 10:
                    errorText = "Can't plot zero or subzero values on a logarithmic axis";
                    break;
                case 11:
                    //errorText = "Can't link axes of different type";
                    break;
                case 12:
                    errorText = "Chart expects point configuration to be numbers or arrays in turbo mode";
                    break;
                case 13:
                    errorText = "Rendering div not found";
                    break;
                case 14:
                    errorText = "String value sent to series.data, expected Number or DateTime";
                    break;
                case 15:
                    //errorText = "Chart expects data to be sorted for X-Axis";
                    break;
                case 17:
                    errorText = "The requested series type does not exist";
                    break;
                case 18:
                    errorText = "The requested axis does not exist";
                    break;
                case 19:
                    errorText = ''; //errorText = "Too many ticks";
                    break;
                default:
                    errorText = "Undefined error";
                    break;
            }
            if (errorText == '') {
                return;
            }
            var container = Y.one(chart.renderTo),
                errorContainer = container.one(".chartError"),
                hasError = false;
            if (!errorContainer) {
                errorContainer = container.append('<div class="rdChartCanvasError" style="display: inline-block; color:red" >Chart error:<ul class="chartError"></ul></div>').one(".chartError");
            }
            errorContainer.get('children').each(function (errorNode) {
                if (errorNode.get('text') == errorText) {
                    hasError = true;
                }
            });

            if (hasError === true) {
                return;
            }
            errorContainer.append('<li>' + errorText  + '</li>');
        },

        reflowCharts: function (rootNode) {
            if (rootNode && rootNode.all) {
                var chart;
                rootNode.all('.' + TRIGGER).each(function (node) {
                    chart = node.getData(TRIGGER);
                    if (chart) {
                        chart.chart.reflow();
                    }
                });
            }
        },

        resizeToWidth: function (width, cssSelectorPrefix) {
            var chart, e;
            Y.all(cssSelectorPrefix + ' .' + TRIGGER).each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart) {
                    e = { width: width, finished: true };
                    chart.resized(e);
                }
            });
        },

        reflowAllCharts: function () {
            var allCharts = Y.all('.' + TRIGGER);
            allCharts.each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart && chart.chart && chart.chart.container) {
                    Y.one(chart.chart.container).hide();
                }
            });

            allCharts.each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart) {
                    //console.log('reflow all charts');
                    chart.responsiveResize.call(chart, chart, true);
                }
            });

            allCharts.each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart && chart.chart && chart.chart.container) {
                    Y.one(chart.chart.container).show();
                }
            });
        },

        reflowChart: function (node) {
            if (!node)
                return;

            chart = node.getData(TRIGGER);

            if (chart && chart.chart && chart.chart.container) {
                var containerNode = Y.one(chart.chart.container);
                containerNode.hide();
                chart.responsiveResize.call(chart, chart, true);
                containerNode.show();
            }
        }
    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'io-xdr', 'chartCanvasRangeSelection', 'event-resize'] });

function rdGetChartCanvasObject(chartId) {
    if (!chartId || chartId == '') {
        return null;
    }
    var div = Y.one('#' + chartId);
    if (!div) {
        return null;
    }
    return div.getData('rdChartCanvas');
}
