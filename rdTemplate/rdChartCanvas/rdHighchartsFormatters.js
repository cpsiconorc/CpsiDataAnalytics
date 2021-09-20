//"use strict";
if (window.LogiXML === undefined) {
    window.LogiXML = {};
}
LogiXML.HighchartsFormatters = {

    setFormatters: function (chartOptions) {
        var i, length, axis, series;

        //date in categories should be date object, not timestamp
        if (chartOptions.xAxis) {
            LogiXML.HighchartsFormatters.checkForDateInAxises(chartOptions.xAxis);

            for (var j = 0; j < chartOptions.xAxis.length; j++) {
                var xAxis = chartOptions.xAxis[j];
                if (xAxis.title && xAxis.title.format)
                    xAxis.title.text = LogiXML.Formatter.format(xAxis.title.text, xAxis.title.format);
            }
        }
        if (chartOptions.yAxis) {
            LogiXML.HighchartsFormatters.checkForDateInAxises(chartOptions.yAxis);

            for (var j = 0; j < chartOptions.yAxis.length; j++) {
                var yAxis = chartOptions.yAxis[j];
                if (yAxis.title && yAxis.title.format)
                    yAxis.title.text = LogiXML.Formatter.format(yAxis.title.text, yAxis.title.format);
                this.checkForOnOffInAxis(yAxis);
            }
        }

        if (chartOptions.xAxis) {
            i = 0; length = chartOptions.xAxis.length;

            for (; i < length; i++) {
                axis = chartOptions.xAxis[i];
                if (axis.labels && axis.labels.formatter == 'labelFormatter') {
                    axis.labels.formatter = LogiXML.HighchartsFormatters.labelFormatter;
                }
                this.checkForOnOffInAxis(axis);
            }
        }

        if (chartOptions.yAxis) {
            i = 0; length = chartOptions.yAxis.length;
            for (; i < length; i++) {
                axis = chartOptions.yAxis[i];
                if (axis.labels && axis.labels.formatter == 'labelFormatter') {
                    axis.labels.formatter = LogiXML.HighchartsFormatters.labelFormatter;
                }

                if (axis.stackLabels && axis.stackLabels.formatter == 'stackLabelFormatter') {
                    var format = axis.stackLabels.format;
                    axis.stackLabels.formatter = LogiXML.HighchartsFormatters.stackLabelFormatter;
                    axis.stackLabels._format = axis.stackLabels.format;
                    axis.stackLabels.format = null;
                }
            }
        }

        if (chartOptions.legend) {
            if (chartOptions.legend && chartOptions.legend.labelFormatter == 'legendLabelFormatter') {
                chartOptions.legend.labelFormatter = LogiXML.HighchartsFormatters.legendLabelFormatter;
                chartOptions.legend._format = chartOptions.legend.labelFormat;
                chartOptions.legend.labelFormat = null;
            }
        }

        var useFormat = function (data) {
            if (data.dataLabels && data.dataLabels.formatter) {

                switch (data.dataLabels.formatter) {
                    case "dataLabelFormatter":
                        data.dataLabels.formatter = LogiXML.HighchartsFormatters.dataLabelFormatter;
                        data.dataLabels._format = series.dataLabels.format;
                        data.dataLabels.format = null;
                        break;

                    case "sideLabelFormatter":
                        data.dataLabels.formatter = LogiXML.HighchartsFormatters.sideLabelFormatter;
                        data.dataLabels._format = series.dataLabels.format;
                        data.dataLabels._showPointName = series.dataLabels.showPointName;
                        data.dataLabels.format = null;
                        //data.dataLabels.useHTML = true;
                        break;
                }
            }
        };

        if (chartOptions.series) {
            i = 0; length = chartOptions.series.length;
            for (; i < length; i++) {
                series = chartOptions.series[i];
                if (!series.data)
                    continue;

                for (var f = 0; f < series.data.length; f++) {
                    var dataPoint = series.data[f];
                    if (dataPoint != null && dataPoint != undefined) {
                        useFormat(dataPoint);
                    }
                }
                useFormat(series);
            }
        }
    },

    checkForOnOffInAxis: function (axis) {
        if (axis.labels && axis.labels.format && (axis.labels.format == "Yes/No" || axis.labels.format == "On/Off" || axis.labels.format == "True/False")) {
            axis.hasBinaryValues = true;
        }
    },

    checkForDateInAxises: function (axises) {
        if (!axises || !LogiXML.HighchartsFormatters.isArray(axises)) {
            return;
        }

        var i = 0, length = axises.length;

        for (; i < length; i++) {
            if (axises[i].labels && axises[i].type == 'datetime' && axises[i].categories) {
                LogiXML.HighchartsFormatters.convertTimeStampToDate(axises[i].categories);
            }
        }
    },
    convertTimeStampToDate: function (dataArray) {
        if (!dataArray && dataArray.length == 0) {
            return;
        }

        var length = dataArray.length;

        for (var i = 0; i < length; i++) {
            dataArray[i] = new Date(dataArray[i]);
        }
    },
    isArray: function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    isNumber: function (n) {
        return typeof n === 'number';
    },
    splat: function (obj) {
        return LogiXML.HighchartsFormatters.isArray(obj) ? obj : [obj];
    },
    pick: function () {
        var args = arguments,
		    i,
		    arg,
		    length = args.length;
        for (i = 0; i < length; i++) {
            arg = args[i];
            if (typeof arg !== 'undefined' && arg !== null) {
                return arg;
            }
        }
    },
    inArray: function (item, arr) {
        var len,
            i = 0;

        if (arr) {
            len = arr.length;

            for (; i < len; i++) {
                if (arr[i] === item) {
                    return i;
                }
            }
        }
        // TODO?: return arr.indexOf(item)
        return -1;
    },

    tooltipFormatter: function (tooltip) {
        var quicktip = this.point.series.quicktip,
            i, length, html, tooltipData;

        if (this.point.isGroup)
            quicktip = this.point.style.quicktip;

        //remove quicktip for calculated columns
        if (this.point.isIntermediateSum || this.point.isSum) {
            this.point.qt = [];
            for (var i = 0; i < quicktip.rows.length; i++) {
                this.point.qt.push(LogiXML.HighchartsFormatters.format(this.point.y, quicktip.rows[i].format));
            }
        }

        if (!quicktip) {

            if (this.point.series.chart.autoQuicktip === false) {
                return false;
            }

            var items = this.points || LogiXML.HighchartsFormatters.splat(this),
                series = items[0].series,
                s;

            if (!this.point.series.chart.tooltip.style) {
                this.point.series.chart.tooltip.style = {};
            }

            // build the header
            //s = [series.tooltipHeaderFormatter(items[0])];
            s = [LogiXML.HighchartsFormatters.tooltipAutoHeaderFormatter(items[0])];

            // build the values
            i = 0; length = items.length;
            for (; i < length; i++) {
                series = items[i].series;
                if (series.tooltipFormatter) {
                    s.push(series.tooltipFormatter(items[i]));
                } else {
                    //s.push(items[i].point.tooltipFormatter(series.tooltipOptions.pointFormat));
                    s.push(LogiXML.HighchartsFormatters.tooltipAutoPointFormatter(this.point));
                }

            };

            // footer
            s.push(tooltip.options.footerFormat || '');

            html = '<div class="rdquicktip-content"><div class="body">';
            html += s.join('').replace(/style\=\"[^\"]*\"/g, '').replace(/<span >Series [0-9]+<\/span>(<br\/>|:)/g, '').replace(/<br\/><span .+ Series [0-9:]+(<br\/> |: )/g, '<br/>').replace(/<span .+ Series [0-9]+<\/span><br\/>/g, '');
            html += '</div></div>';
            return html;
        }

        if (!this.point.series.chart.tooltip.style) {
            this.point.series.chart.tooltip.style = {};
        }

        this.point.series.chart.tooltip.style.padding = 0;

        html = '<div class="rdquicktip-content">';
        if (quicktip.title) {
            html += '<div class="header">' + quicktip.title + '</div>';
        }
        html += '<div class="body">';
        if (quicktip.descr) {
            html += '<p>' + quicktip.descr + '</p>';
        }
        //REPDEV-23818
        var defaultFormat = 'Percent';
        var percentageToken = '@Chart.rdStackedChartPercentage~';
        if (this.point.percentage != undefined && html.indexOf(percentageToken) > -1) {
            var formatedValue = LogiXML.Formatter.format(this.point.percentage / 100, defaultFormat);
            html = html.replace(new RegExp(percentageToken, 'g'), formatedValue);
        }

        if (quicktip.rows && quicktip.rows.length > 0) {
            html += '<table class="rdquicktip-table">';
            i = 0;
            length = quicktip.rows.length;
            for (; i < length; i++) {
                var fragment = '<tr><td>' + quicktip.rows[i].caption + '</td><td>' + LogiXML.decodeHtml(quicktip.rows[i].value || "", quicktip.rows[i].format == 'HTML') + '</td></tr>';
                //REPDEV-23818
                if (this.point.percentage != undefined && fragment.indexOf(percentageToken) > -1) {
                    var formatedValue = LogiXML.Formatter.format(this.point.percentage / 100, quicktip.rows[i].format || defaultFormat);
                    fragment = fragment.replace(new RegExp(percentageToken, 'g'), formatedValue);
                }
                html += fragment;
            }
            html += '</table>';
        }

        if (this.point.qt && this.point.qt.length > 0) {
            i = 0;
            length = this.point.qt.length;
            for (; i < length; i++) {
                var qtPointValue = this.point.qt[i];
                
                if (qtPointValue == "LogiHideEle") {
                    return '';
                }

                //REPDEV-20468 fix issue with no returned data for tooltip
                if (!qtPointValue) {
                    qtPointValue = '';
                }
                if (qtPointValue.startsWith('$0')) { // 23595 - we need to escape $0 sign
                    qtPointValue = '$' + qtPointValue;
                }
                html = html.replace(new RegExp('\\{' + i + '\\}', 'g'), LogiXML.decodeHtml(qtPointValue, quicktip.rows && quicktip.rows[i] && quicktip.rows[i].format && quicktip.rows[i].format == 'HTML'));
            }
        }
        html += '</div></div></div>';
        return html;
    },
    tooltipAutoHeaderFormatter: function (point) {
        var series = point.series,
			tooltipOptions = series.tooltipOptions,
			dateTimeLabelFormats = tooltipOptions.dateTimeLabelFormats,
			xDateFormat = tooltipOptions.xDateFormat || dateTimeLabelFormats.year, // #2546
			xAxis = series.xAxis,
			isDateTime = xAxis && xAxis.options.type === 'datetime',
            isCategories = xAxis && xAxis.options.type === 'category',
			headerFormat = tooltipOptions.headerFormat,
			closestPointRange = xAxis && xAxis.closestPointRange,
			n;

        // Guess the best date format based on the closest point distance (#568)
        if (isDateTime && !xDateFormat) {
            if (closestPointRange) {
                for (n in timeUnits) {
                    if (timeUnits[n] >= closestPointRange) {
                        xDateFormat = dateTimeLabelFormats[n];
                        break;
                    }
                }
            } else {
                xDateFormat = dateTimeLabelFormats.day;
            }
        }

        if (xAxis && xAxis.options && xAxis.options.labels && xAxis.options.labels.format) {
            if (isCategories && point.point) {
                headerFormat = headerFormat.replace('{point.key}', LogiXML.Formatter.format(point.point.name, xAxis.options.labels.format));
            } else {
                headerFormat = headerFormat.replace('{point.key}', LogiXML.Formatter.format(isDateTime ? new Date(point.key) : point.key, xAxis.options.labels.format));
            }
        } else if (isDateTime && xDateFormat && LogiXML.HighchartsFormatters.isNumber(point.key)) { // Insert the header date format if any
            if (xDateFormat == "%Y" && point.key) {
                headerFormat = headerFormat.replace('{point.key}', LogiXML.Formatter.formatDate(point.key, 'd'));
            } else {
                headerFormat = headerFormat.replace('{point.key}', '{point.key:' + xDateFormat + '}');
            }
        } else if (!series.xAxis) {
            headerFormat = headerFormat.replace('{point.key:.2f}', point.key);
            tooltipOptions.pointFormat = tooltipOptions.pointFormat.replace('{series.name}:', "").replace('●', '');
        }
        else if (!series.xAxis) {
            headerFormat = headerFormat.replace('{point.key:.2f}', point.key);
            tooltipOptions.pointFormat = tooltipOptions.pointFormat.replace('{series.name}:', "");
        } else if (isCategories && point.point) {
            headerFormat = headerFormat.replace('{point.key}', point.point.name);
        }

        return Highcharts.format(headerFormat, {
            point: point,
            series: series
        });
    },
    tooltipAutoPointFormatter: function (point) {
        var series = point.series,
            tooltipOptions = series.tooltipOptions,
            pointFormat = series.tooltipOptions.pointFormat,
			seriesTooltipOptions = series.tooltipOptions,
			valueDecimals = LogiXML.HighchartsFormatters.pick(seriesTooltipOptions.valueDecimals, ''),
            xAxisIsDateTime = series.xAxis && series.xAxis.options.type === 'datetime',
            yAxisIsDateTime = series.yAxis && series.yAxis.options.type === 'datetime',
			valuePrefix = seriesTooltipOptions.valuePrefix || '',
			valueSuffix = seriesTooltipOptions.valueSuffix || '',
            pointArrayMap, i = 0, length, key,
            format, axisType, val,
            removeXKey = false;

        if (series.xAxis && series.xAxis.options && series.xAxis.options.labels && series.xAxis.options.labels.format) {
            pointFormat = pointFormat.replace('{point.x}', LogiXML.Formatter.format(xAxisIsDateTime ? new Date(point.x) : point.x, series.xAxis.options.labels.format));
        }

        if (series.yAxis && series.yAxis.options && series.yAxis.options.labels && series.yAxis.options.labels.format) {
            pointFormat = pointFormat.replace('{point.y}', LogiXML.Formatter.format(yAxisIsDateTime ? new Date(point.y) : point.y, series.yAxis.options.labels.format));
        }
        else if (series && series.options && series.options.dataLabels && series.options.dataLabels._format && series.options.type !== "pie")
        //pie chart is showing datalabels from xAxis data, so we don't need to format point.y according to DataLabels format.
        {
            pointFormat = pointFormat.replace('{point.y}', LogiXML.Formatter.format(yAxisIsDateTime ? new Date(point.y) : point.y, series.options.dataLabels._format));
        }

        // Loop over the point array map and replace unformatted values with sprintf formatting markup
        pointArrayMap = series.pointArrayMap || ['x', 'y'];
        if (LogiXML.HighchartsFormatters.inArray('x', pointArrayMap) == -1) {
            pointArrayMap.push('x');
            removeXKey = true;
        }
        length = pointArrayMap.length;
        for (; i < length; i++) {
            key = pointArrayMap[i];
            if (key == 'x') {
                axisType = series.xAxis && series.xAxis.options.type || 'category';
            } else {
                axisType = series.yAxis && series.yAxis.options.type || 'linear';
            }
            format = '';
            switch (axisType) {
                case 'category':
                    //nothing to do
                    break;
                case 'datetime':
                    if (key == 'x') {
                        format = tooltipOptions.xDateFormat;
                    } else {
                        format = tooltipOptions.yDateFormat;
                    }
                    if (!format) {
                        val = point[key];
                        if (val) {
                            pointFormat = pointFormat.replace('{point.' + key + '}', LogiXML.Formatter.formatDate(val, 'd'));
                        }
                        continue;
                    }
                    break;
                default: //linear or log
                    format = ':,.' + valueDecimals + 'f';
                    break;
            }

            key = '{point.' + key;
            if (valuePrefix || valueSuffix) {
                pointFormat = pointFormat.replace(key + '}', valuePrefix + key + '}' + valueSuffix);
            }
            if (format && format !== '') {
                pointFormat = pointFormat.replace(key + '}', key + format + '}');
            }
        }
        if (removeXKey)
            pointArrayMap.removeAt(pointArrayMap.indexOf('x'));

        return Highcharts.format(pointFormat, {
            point: point,
            series: point.series
        });
    },

    dataLabelFormatter: function () {
        var format = this.series.options.dataLabels._format,
            value = this.y;

        if (this.series.options.stacking && value === 0) {
            return "";
        }

        //TODO: may be percent, total, etc. Digg it later
        if (format == 'HTML' && this.key) {
            this.key = LogiXML.decodeHtml(this.key, true)
        }
        return LogiXML.Formatter.format(value, format);
    },

    sideLabelFormatter: function () {
        var format = this.series.options.dataLabels._format,
            value = this.point && this.point.name ? this.point.name : "",
            dataValue = this.y,
            showPointName = this.series.options.dataLabels.showPointName,
            showDataValue = this.series.options.dataLabels.showDataValue,
            ret;
        //TODO: may be percent, total, etc. Digg it later
        if (format != null && format != "") {
            if (format == "Percent" || format == "p" || format == "%" || format.indexOf("%", format.length - 1) !== -1) {
                dataValue = this.percentage / 100;
            }
            dataValue = LogiXML.Formatter.format(dataValue, format);
        }
        if (showPointName && showDataValue) {
            ret = "<div>" + value + "<br />" + dataValue + "</div>";
        } else if (showPointName) {
            ret = LogiXML.Formatter.format(value, format);
        } else {
            ret = dataValue;
        }
        return ret;
    },

    legendLabelFormatter: function () {
        var format = this.chart ? this.chart.options.legend._format == 'HTML' ? "" : this.chart.options.legend._format : this.series.chart.options.legend._format;
        return LogiXML.Formatter.format(this.name, format);
    },

    stackLabelFormatter: function () {
        var format = this.options._format;

        return LogiXML.Formatter.format(this.total, format);
    },

    labelFormatter: function () {
        var format = this.axis.options.labels.format;
        if (this.dateTimeLabelFormat || this.value instanceof Date) {
            return LogiXML.Formatter.formatDate(this.value, format);
        } else {
            return LogiXML.Formatter.format(this.value, format);
        }
        //    return LogiXML.Formatter.formatNumber(this.value, format, lang, global);
        //} else if (typeof this.value === 'string') {
        //    return LogiXML.Formatter.formatString(this.value, format, lang, global);
        //}
        //return this.value;
    },

    format: function (value, format) {
        if (this.value instanceof Date) {
            return LogiXML.Formatter.formatDate(value, format);
        } else {
            return LogiXML.Formatter.format(value, format);
        }
        //    return LogiXML.Formatter.formatNumber(this.value, format, lang, global);
        //} else if (typeof this.value === 'string') {
        //    return LogiXML.Formatter.formatString(this.value, format, lang, global);
        //}
        //return this.value;
    }
}
