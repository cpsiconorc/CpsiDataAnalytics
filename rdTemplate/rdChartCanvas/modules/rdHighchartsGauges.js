(function (H) {
    //"use strict";

    var defaultPlotOptions = H.getOptions().plotOptions,
		pInt = H.pInt,
		pick = H.pick,
		each = H.each,
        merge = H.merge,
		colorAxisMethods,
        seriesTypes = Highcharts.seriesTypes,
		UNDEFINED;
    defaultPlotOptions.bulletgauge = merge(defaultPlotOptions.bar, {
        color: '#0000FF',
        borderColor: '#000000',
        pointPadding: 0.25,
        pointPlacement: -3,
        stickyTracking: true,
        pointRange: 0,
        states: {
            hover: {
                lineColor: "transparent"
            },
            select: {
                lineColor: "transparent"
            }
        }
    });

    defaultPlotOptions.arcgauge = merge(defaultPlotOptions.pie, {
        color: '#0000FF',
        borderColor: '#000000',
        pointPadding: 0.25,
        pointPlacement: -3,
        marker: null,
        stickyTracking: true
    });

    defaultPlotOptions.numbergauge = merge(defaultPlotOptions.line, {
        color: '#0000FF',
        borderColor: '#000000',
        pointPadding: 0.25,
        pointPlacement: -3,
        stickyTracking: false,
        marker: {},
        states: {
            hover: {
                lineColor: "transparent",
                shadow: false,
                halo: false
            },
            select: {
                lineColor: "transparent",
                shadow: false,
                halo: false
            }
        }
    });

    defaultPlotOptions.balloongauge = merge(defaultPlotOptions.line, {
        borderColor: '#FFFFFF',
        borderRadius: 0,
        groupPadding: 0.2,
        marker: {},
        pointPadding: 0.1,
        minPointLength: 0,
        cropThreshold: 50, 
        pointRange: 0, 
        states: {
            hover: {
                brightness: 0.1,
                shadow: false,
                halo: false
            },
            select: {
                color: '#C0C0C0',
                borderColor: '#000000',
                shadow: false
            }
        },
        dataLabels: {
            align: null, // auto
            verticalAlign: null, // auto
            y: null
        },
        stickyTracking: false,
        tooltip: {
            distance: 6
        },
        threshold: 0
    });

    function isIEOrEdge() {
        var myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : (myNav.indexOf('edge') != -1) ? 12 : (myNav.indexOf('rv:11.0)') != -1) ? 11 : false;
    }

    function setAxisTicks(yAxis) {
        var tickPositions = [];
        
        //yAxis.labels.staggerLines = 1;
        if (yAxis.options.tickInterval && !yAxis.options.notexplicitlySettedTicks) {
            var tickCount = (yAxis.options.max - yAxis.options.min) / yAxis.options.tickInterval;
            for (var i = 0; i < tickCount; i++) {
                tickPositions.push(yAxis.options.min + i * yAxis.options.tickInterval);
            }
            tickPositions.push(yAxis.options.max);
            //yAxis.options.tickPixelInterval = yAxis.chart.plotWidth / (maxLabelsCount - 2);
            yAxis.options.tickPositions = tickPositions;
            yAxis.tickPositions = tickPositions;
            yAxis.options.startOnTick = true;
            yAxis.options.endOnTick = true;
            return;
        }

        var formattedValue = yAxis.options.min;
        if (yAxis.options.labels && yAxis.options.labels.format) {
            formattedValue = LogiXML.HighchartsFormatters.format(yAxis.options.min, yAxis.options.labels.format);
        }
		
        var labelDimA = LogiXML.layout.getTextDimensions(formattedValue, yAxis.options.labels.style).width;
        var formattedValue = yAxis.options.max;
        if (yAxis.options.labels && yAxis.options.labels.format) {
            formattedValue = LogiXML.HighchartsFormatters.format(yAxis.options.max, yAxis.options.labels.format);
        }
        var labelDimB = LogiXML.layout.getTextDimensions(formattedValue, yAxis.options.labels.style).width;
        var maxLabel = labelDimA > labelDimB ? labelDimA : labelDimB;
        var spaceMultiplier = 1.7;
        var labelSpace = maxLabel * spaceMultiplier;
        var maxLabelsCount = Math.floor(yAxis.chart.plotWidth / labelSpace);
        if (maxLabelsCount<2) {
            maxLabelsCount = 2;
        }
        /*var tickInterval = (yAxis.options.max - yAxis.options.min) / (maxLabelsCount - 1);
        //yAxis.tickInterval = (yAxis.options.max - yAxis.options.min) / (maxLabelsCount-1);
        //yAxis.options.tickInterval = yAxis.tickInterval;
        tickPositions = [];
        for (var i = 0; i < maxLabelsCount - 1; i++) {
            tickPositions.push(yAxis.options.min + i * tickInterval);
        }
        tickPositions.push(yAxis.options.max);*/
        yAxis.options.tickPixelInterval = yAxis.chart.plotWidth / (maxLabelsCount - 1);
        /*yAxis.options.tickPositions = tickPositions;
        yAxis.tickPositions = tickPositions;*/
        yAxis.options.startOnTick = true;
        yAxis.options.endOnTick = true;
        yAxis.options.notexplicitlySettedTicks = true;
        //yAxis.isDirty = true;
    }

    function cutTitleFont(chart) {
        var oneLinerH;
        var text;
        var currDimensions;
        var needChange;
        var styleObj;
        styleObj = {
            align: chart.options.title.align,
            margin: chart.options.title.margin,
            fontSize: chart.options.title.style.fontSize,
            fontFamily: chart.options.title.style.fontFamily || chart.renderer.getStyle().fontFamily
        };
        if (!chart.options.title.initialTitleText) {
            chart.options.title.initialTitleText = chart.options.title.text;
        } else {
            chart.options.title.text = chart.options.title.initialTitleText;
        }
        oneLinerH = LogiXML.layout.getTextDimensions("|", styleObj).height;
        text = chart.options.title.text;
        currDimensions = LogiXML.layout.getTextDimensions(text, styleObj);
        needChange = false;
        if (text.indexOf("<BR/>") > -1) {
            text = text.split("<BR/>")[0];
            needChange = true;
        }
        while ((currDimensions.height) > oneLinerH && (text.length > 0)) {
            text = text.substring(0, text.length - 1);
            currDimensions = LogiXML.layout.getTextDimensions(text + "...", styleObj);
            needChange = true;
        }
        currDimensions = LogiXML.layout.getTextDimensions(text, styleObj);
        while ((currDimensions.width) > chart.spacingBox.width - 44 && (text.length > 0)) {
            text = text.substring(0, text.length - 1);
            currDimensions = LogiXML.layout.getTextDimensions(text + "...", styleObj);
            needChange = true;
        }
        if (needChange) {
            text = text + "...";
        }
        chart.options.title.text = text;
    }

    function scaleTitleFont(chart) {
        var minTitleFontSize = 14,
            baseChartHeight = 100,
            addPixelToFontEachHeightPixels = 10,
            //chart is swapped, so height = width
            chartHeight = chart.chartHeight,
            options = chart.userOptions,
            title = options.title ? options.title : {},
            scalable = title.scalable,
            titleStyle = title.style ? title.style : {},
            fontSize = titleStyle.fontSize;
       
        if (true /*deprecated*//*!chart.options.title || !chart.options.title.text || chart.options.series[0].explicitSettedFontSize && (chart.options.series[0].explicitSettedFontSize.indexOf("title") > -1 || chart.options.series[0].explicitSettedFontSize.indexOf("both") > -1)*/) {
            var margin;
            chart.options.title.margin = /*margin/2*/5;
            cutTitleFont(chart);
            chart.setTitle(chart.options.title, true);
            return;
        }

        /*if (fontSize == UNDEFINED && scalable == UNDEFINED) {
            scalable = true;
            title.scalable = scalable;
        }

        if (!scalable) {
            return;
        }

        if (!title.style) {
            title.style = titleStyle;
        }

        if (chartHeight <= baseChartHeight) {
            fontSize = minTitleFontSize + 'px';
        } else {

            fontSize = (minTitleFontSize + Math.round((chartHeight - baseChartHeight) / addPixelToFontEachHeightPixels)) + 'px';
        }*/
        fontSize = chartHeight / 5.3333333333 + 'px';
        chart.options.title.align = 'left';
        chart.options.title.margin = chartHeight / 50;
        chart.options.title.style.fontSize = fontSize;
        cutTitleFont(chart);
        chart.setTitle(chart.options.title, true);
    }

    function setSpacingGetMaxDimension(axis) {
        var formattedValue = axis.options.min;
        if (axis.options.labels && axis.options.labels.format) {
            formattedValue = LogiXML.HighchartsFormatters.format(axis.options.min, axis.options.labels.format);
        }
        var labelDimA = LogiXML.layout.getTextDimensions(formattedValue, axis.options.labels.style).width;
        axis.chart.spacing[3] = (labelDimA / 2) * 1.15;
        formattedValue = axis.options.max;
        if (axis.options.labels && axis.options.labels.format) {
            formattedValue = LogiXML.HighchartsFormatters.format(axis.options.max, axis.options.labels.format);
        }
        var labelDimB = LogiXML.layout.getTextDimensions(formattedValue, axis.options.labels.style).width;
        axis.chart.spacing[1] = (labelDimB / 2) * 1.15;
        var result;
        labelDimA > labelDimB ? result = labelDimA : result = labelDimB;
        var midValue = (axis.options.max - axis.options.min) / 2;
        if (axis.options.labels && axis.options.labels.format) {
            midValue = LogiXML.HighchartsFormatters.format(midValue, axis.options.labels.format);
        }
        var labelMid = LogiXML.layout.getTextDimensions(midValue, axis.options.labels.style).width;
        if (labelMid>result) {
            result = labelMid;
        }
        return result;
    }

    function getTickCount(tickCount) {
        if (tickCount > 11) {
            tickCount = 11;
        }
        else if (tickCount > 6) {
            tickCount = 6;
        }
        else if (tickCount > 4) {
            tickCount = 4;
        } else if (tickCount>=2){
            tickCount = 3;
        } else {
            tickCount = 2;
        }
        return --tickCount;
    }

    //like old gauges
    function getTickCountLikeOld(axis, maxDim) {
        var pxBarWidth = axis.chart.plotWidth - axis.chart.spacing[3] - axis.chart.spacing[1];
        var dDiff = Math.abs(axis.options.max - axis.options.min);
        if (dDiff == 0)
            return 0;
        var nFirstDigit = 0;
        var sDiff = dDiff.toString().replace(/0/g, "").replace(/\./g, "").replace(/\-/g, "");
        if (sDiff.length !== 0)
            nFirstDigit = parseInt(sDiff.substr(0, 1));
        var nTickCount = 1;
        switch (nFirstDigit) {
        case 1:
            nTickCount = 10;
            break;
        case 2:
            nTickCount = 8;
            break;
        case 3:
            nTickCount = 6;
            break;
        case 4:
            nTickCount = 8;
            break;
        case 5:
            nTickCount = 10;
            break;
        default:
            nTickCount = nFirstDigit;
        }
        //Is the gauge too small to support this many ticks?
        while (nTickCount > 1 && (maxDim * nTickCount > pxBarWidth)) {
            switch (nTickCount) {
            case 10:
                nTickCount = 5;
                break;
            case 9:
                nTickCount = 3;
                break;
            case 8:
                nTickCount = 4;
                break;
            case 7:
                nTickCount = 2;
                break;
            case 6:
                nTickCount = 3;
                break;
            case 5:
                nTickCount = 2;
                break;
            case 4:
                nTickCount = 2;
                break;
            default:
                nTickCount = 1;
            }
        }
        return nTickCount;
    }

    function calculateTickCount(axis) {
        var maxDim = setSpacingGetMaxDimension(axis);
        //var tickCount = (axis.chart.plotWidth - axis.chart.spacing[3] - axis.chart.spacing[1]) / maxDim;
        //tickCount = getTickCount(tickCount);
        var tickCount = getTickCountLikeOld(axis, maxDim);
        if (!axis.options.initialTickWidth) {
            axis.options.initialTickWidth = axis.options.tickWidth;
        }
        if (axis.chart.userOptions.series.length == 0 || tickCount==0 || (!axis.chart.userOptions.series[0].data || axis.chart.userOptions.series[0].data.length == 0))/*(axis.options.min == axis.options.max)*/ {
            axis.options.tickWidth = 0;
            axis.options.labels.enabled = false;
        } else {
            axis.options.tickWidth = axis.options.initialTickWidth;
            axis.options.labels.enabled = true;
        }
        axis.tickInterval = (axis.options.max - axis.options.min) / tickCount;
        //var digitsCount = axis.options.max.split
        //axis.options.tickInterval = Math.round(((axis.options.max - axis.options.min) / tickCount)*1000)/1000;
        axis.options.tickInterval = (axis.options.max - axis.options.min) / tickCount;
        axis.options.showAllTicksWithOverlap = true;
        axis.options.tickCount = tickCount+1;
        axis.options.tickPositions = [];
        

        for (var i = 0; i < tickCount; i++) {
            axis.options.tickPositions.push(axis.options.min + i * axis.options.tickInterval);
        }
        /*if (axis.options.showLastLabel == true && axis.options.holdLastTick == true) {
            axis.options.tickPositions.push(axis.options.max);
        }*/
        axis.options.tickPositions.push(axis.options.max);
        axis.tickPositions = axis.options.tickPositions;
        return;
    }

    function checkAndRemoveTwoTicksOverlap(neighbour, lastTick, ticks, tickPositions, sortedPositions, index) {

        if (neighbour && neighbour.label && neighbour.label.getBBox) {
            var neighbourEdge = neighbour.label.xy && neighbour.label.xy.x + neighbour.label.getBBox().width;
            if (neighbourEdge > lastTick.label.xy.x) {
                neighbour.label.xy.opacity = 0;
                delete ticks[tickPositions[index]];
                tickPositions.removeAt(index);
                if (sortedPositions) {
                    sortedPositions.removeAt(index);
                }
                if (neighbour.label.element) {
                    if (neighbour.label.element.remove) {
                        neighbour.label.element.remove();
                        if (neighbour.mark && neighbour.mark.element) {
                            neighbour.mark.element.remove();
                        }
                    } else {
                        neighbour.label.element.style.display = 'none';
                        delete neighbour.label.element;
                        if (neighbour.mark && neighbour.mark.element) {
                            if (neighbour.mark.element.style) {
                                neighbour.mark.element.style.display = 'none';
                            }
                            delete neighbour.mark.element;
                        }
                    }
                }
                /*var oldTickCount = sortedPositions.length - 2;
                var newTickCount = getTickCount(oldTickCount - 1);
                var newTicksPositions = [];
                newTicksPositions.push(sortedPositions[0]);
                var tickInterval = (sortedPositions[sortedPositions.length - 1] - sortedPositions[0]) / newTickCount;
                for (var i = 1; i < newTickCount; i++) {
                    newTicksPositions.push(sortedPositions[0] + i * tickInterval);
                }
                if (axis.options.max !== axis.max) {
                    axis.max = axis.options.max;
                    newTicksPositions.push(axis.options.max);
                } else {
                    newTicksPositions.push(sortedPositions[sortedPositions.length - 1]);
                }
                /*for (var k = 0; k < tickPositions.length; k++) {
                    ticks[tickPositions[k]].destroy();
                    delete ticks[tickPositions[k]];
                }#1#
                ticks = {};
                tickPositions = newTicksPositions;
                sortedPositions = null;
                axis.tickPositions = tickPositions;
                axis.ticks = ticks;
                return false;*/
            }
        }
    }

    function decreaseTickCountIfOverlap(axis, ticks, sortedPositions, tickPositions) {
        if (tickPositions.length <= 2) {
            return true;
        }
        var lastTick = ticks[sortedPositions[sortedPositions.length - 1]];
        var prevLastTick = ticks[sortedPositions[sortedPositions.length - 2]];
        checkAndRemoveTwoTicksOverlap(prevLastTick, lastTick, ticks, tickPositions, sortedPositions, sortedPositions.length - 2);
        if (axis.options.holdLastTick && !axis.options.showAllTicksWithOverlap) {
            var neighbour;
            for (var j = sortedPositions.length - 2; j > 0; j--) {
                neighbour = axis.ticks[tickPositions[j]];
                checkAndRemoveTwoTicksOverlap(neighbour, lastTick, ticks, tickPositions, null, j);
            }

        }
        return true;
    }

    function scaleAxisLabelsFont(axis) {
        
        var minAxisLabelFontSize = 10,
            baseChartHeight = 100,
            addPixelToFontEachHeightPixels = 20,
                chartHeight = axis.chart.chartHeight/* - axis.chart.title.bBox.height*//*axis.chart.plotHeight*/,
                fontSize;
        axis.options.labels.staggerLines = 1;
        if (axis.options.labels && !axis.options.labels.enabled) {
            return;
        }
        if (axis.chart.options.series[0].explicitSettedFontSize && (axis.chart.options.series[0].explicitSettedFontSize.indexOf("both")>-1 || axis.chart.options.series[0].explicitSettedFontSize.indexOf("axis")>-1)) {
            if (axis.options.tickInterval && !axis.options.notexplicitlySettedTicks) {
                //axis.options.labels.overflow = false;
                axis.options.showAllTicksWithOverlap = true;
                axis.isDirty = true;
                axis.options.endOnTick = false;
                axis.endOnTick = false;
                setSpacingGetMaxDimension(axis);
                return;
            }
            calculateTickCount(axis);
            return;
        }
        fontSize = chartHeight / 6.66666 > minAxisLabelFontSize ? chartHeight / 6.66666 + 'px' : minAxisLabelFontSize + 'px';
        if (!axis.options.labels) {
            axis.options.labels = {};
            axis.options.labels.style = {};
        }
        axis.options.labels.style.fontSize = fontSize;
        //var maxDim = setSpacingGetMaxDimension(axis);
        
        //calculate font size when we have explicit tick count
        if (axis.options.tickInterval && !axis.options.notexplicitlySettedTicks) {

            /*var formattedValue = axis.options.min;
            if (axis.options.labels && axis.options.labels.format) {
                formattedValue = LogiXML.HighchartsFormatters.format(axis.options.min, axis.options.labels.format);
            }
            var labelDimA = LogiXML.layout.getTextDimensions(formattedValue, axis.options.labels.style).width;
            formattedValue = axis.options.max;
            if (axis.options.labels && axis.options.labels.format) {
                formattedValue = LogiXML.HighchartsFormatters.format(axis.options.max, axis.options.labels.format);
            }
            var labelDimB = LogiXML.layout.getTextDimensions(formattedValue, axis.options.labels.style).width;*/
            var maxLabel = setSpacingGetMaxDimension(axis);
            var spaceMultiplier = 1.5;
            var labelSpace = maxLabel * spaceMultiplier;
            var nowLabelsSize = labelSpace * ((axis.options.max - axis.options.min) / axis.options.tickInterval);
            while (nowLabelsSize > axis.chart.plotWidth) {
                var newSize = parseInt(axis.options.labels.style.fontSize.substr(0, axis.options.labels.style.fontSize.length - 2)) - 1;
                if (newSize < 8) {
                    return;
                }
                axis.options.labels.style.fontSize = newSize + 'px';
                /*formattedValue = axis.options.min;
                if (axis.options.labels && axis.options.labels.format) {
                    formattedValue = LogiXML.HighchartsFormatters.format(axis.options.min, axis.options.labels.format);
                }
                labelDimA = LogiXML.layout.getTextDimensions(formattedValue, axis.options.labels.style).width;
                formattedValue = axis.options.max;
                if (axis.options.labels && axis.options.labels.format) {
                    formattedValue = LogiXML.HighchartsFormatters.format(axis.options.max, axis.options.labels.format);
                }
                labelDimB = LogiXML.layout.getTextDimensions(formattedValue, axis.options.labels.style).width;*/
                maxLabel = setSpacingGetMaxDimension(axis);
                spaceMultiplier = 1.5;
                labelSpace = maxLabel * spaceMultiplier;
                nowLabelsSize = labelSpace * ((axis.options.max - axis.options.min) / axis.options.tickInterval);
            }
        } else {
            calculateTickCount(axis);
            axis.options.notexplicitlySettedTicks = true;
            //axis.options.showAllTicksWithOverlap = true;
        }
        axis.isDirty = true;
        //axis.chart.isDirty = true;
    }

    function createPlotBands(series, axis, graphic) {
        var stops = axis.options.stops,
            max = axis.options.max,
            startValue = axis.options.min,
            yOffset = series.plotBandsOffset ? series.plotBandsOffset : 0;
        if (axis.min == axis.max && series.options.wrongData) {
            series.chart.renderer.rect(0, yOffset, series.chart.plotWidth - 4, series.chart.plotHeight - yOffset - 1, 0).attr({
                'stroke-width': 2,
                stroke: series.options.borderColor || "#000000",
                fill: 'silver',
                zIndex: 1
            }).add(graphic);
            return;
        }
        var startPoint;
        var endPoint;
        if (series.options.barBackgroundColor) {
            startPoint = axis.toPixels(startValue) - series.chart.plotLeft;
            endPoint = axis.toPixels(max) - series.chart.plotLeft;
            series.chart.renderer.rect(startPoint, yOffset, endPoint - startPoint, series.chart.plotHeight - yOffset, 0).attr({
                fill: series.options.barBackgroundColor,
                zIndex: 1
            }).add(graphic);
        }
        for (var i = 0; i < stops.length; i++) {
            var endValue = stops[i][0],
               color = stops[i][1];
            startPoint = axis.toPixels(startValue) - series.chart.plotLeft;
            if (stops[i][0]<axis.min) {
                continue;
            }
            endPoint = axis.toPixels(endValue) - series.chart.plotLeft;
            /*if (endValue == axis.max) {
                endPoint = series.chart.plotWidth;
            }*/
            series.chart.renderer.rect(startPoint, yOffset, endPoint - startPoint, series.chart.plotHeight - yOffset - 1, 0).attr({
                'stroke-width': 2,
                stroke: series.options.borderColor || "#000000",
                fill: color || '#d0d0d0',
                zIndex: 1
            }).add(graphic);
            startValue = endValue;
        }
    }

    function upscaleFont(source, targetBox) {
        var basefontsize = Math.min(targetBox.width, targetBox.height);
        var iterCount = 0;
        do {
            source.css({ fontSize: --basefontsize + "px" });
            iterCount++;
        } while (source.element.getBoundingClientRect().width >= targetBox.width || calculateActualBox(source.element).height >= targetBox.height || basefontsize <= 0);
        source.css({ fontSize: --basefontsize + "px" });
    }

    function calculateActualBox(element, step) {
        var box,
            canvas,
            context2d;

        box = element.getBoundingClientRect();
        canvas = document.createElement("canvas");

        //debug stuff commented out
        //var t0 = performance.now();
        //document.body.append(canvas);

        canvas.width = box.width; //horizontal position is fine without tweaks
        canvas.height = box.height*2;//have more space for text, baseline will be at the center

        canvas.fontFamily = element.fontFamily;
        canvas.fontSize = element.fontSize;
        canvas.fontWeight = element.fontWeight;
        canvas.fontStyle = element.fontStyle;

        context2d = canvas.getContext("2d");
        context2d.fillStyle = "white";
        context2d.fillRect(0, 0, canvas.width, canvas.height);
        context2d.fillStyle = "black";
        context2d.font = element.style.fontStyle + " " + element.style.fontWeight + " " + element.style.fontSize + " " + element.style.fontFamily;
        context2d.fillText(element.innerHTML, 0, canvas.height / 2);

        var pixelData = context2d.getImageData(0, 0, canvas.width, canvas.height).data,
            oneLinePixelsCount = canvas.width * 4,
            notWhitePixel = false,
            topBlackLine = -1,
            bottomBlackLine;

        //optional performance boosting for large images

        var xStep, yStep;
        //if (step && step !== 0) {
        //    xStep = yStep = step;
        //} else {
        //    if (canvas.width / 200 > 1) {
        //        xStep = Math.floor(canvas.width / 200);
        //    } else {
        //        xStep = 1;
        //    }
        //    if (canvas.height / 200 > 1) {
        //        yStep = Math.floor(canvas.height / 200);
        //    } else {
        //        yStep = 1;
        //    }
        //}

        xStep = (step && step !== 0) ? step : (canvas.width / 200) > 1 ? Math.floor(canvas.width / 200) : 1;
        yStep = (step && step !== 0) ? step : (canvas.height / 200) > 1 ? Math.floor(canvas.height / 200) : 1;

        var keepGoingY = true,
            keepGoingX = true,
            currY = 0,
            currXY = 0;

        //top non-white pixel

        while (keepGoingY) {
            notWhitePixel = false;
            currXY = currY * oneLinePixelsCount;
            keepGoingX = true;
            while (keepGoingX) {
                if (pixelData[currXY] !== 255) {
                    notWhitePixel = true;
                    break;
                }
                currXY += xStep * 4;
                keepGoingX = currXY < (currY + 1) * oneLinePixelsCount ? true : false;
            }
            if (notWhitePixel) {
                topBlackLine = currY;
                break;
            }
            currY += yStep;
            keepGoingY = currY < canvas.height ? true : false;
        }

        //bottom non-white pixel

        keepGoingX = true;
        keepGoingY = true;
        currY = canvas.height - 1;

        while (keepGoingY) {
            notWhitePixel = false;
            currXY = currY * oneLinePixelsCount;
            keepGoingX = true;
            while (keepGoingX) {
                if (pixelData[currXY] !== 255) {
                    notWhitePixel = true;
                    break;
                }
                currXY += xStep * 4;
                keepGoingX = currXY < (currY + 1) * oneLinePixelsCount ? true : false;
            }
            if (notWhitePixel) {
                bottomBlackLine = currY;
                break;
            }
            currY -= yStep;
            keepGoingY = currY > 0 ? true : false;
        }

        /*for (var i = 0; i < canvas.height; i += performanceBoost) {
            notWhitePixel = false;
            for (var k = i * oneLinePixelsCount; k < ((i + 1) * oneLinePixelsCount); k += performanceBoost) {
                if (pixelData[k] !== 255) {
                    notWhitePixel = true;
                    break;
                }
            }
            if (notWhitePixel) {
                topBlackLine = topBlackLine < 0 ? i : topBlackLine;
                break;
            }
        }*/

        /*for (i = canvas.height; i > 0; i -= performanceBoost) {
            notWhitePixel = false;
            for (var k = i * oneLinePixelsCount; k < ((i + 1) * oneLinePixelsCount); k += performanceBoost) {
                if (pixelData[k] !== 255) {
                    notWhitePixel = true;
                    break;
                }
            }
            if (notWhitePixel) {
                topBlackLine = topBlackLine < 0 ? i : topBlackLine;
                break;
            }
        }*/

        var visibleCenter = topBlackLine + (bottomBlackLine - topBlackLine) / 2;
        var baselineDelta = canvas.height / 2 - visibleCenter;

        result = {
            top: topBlackLine,
            bottom: bottomBlackLine,
            height: bottomBlackLine - topBlackLine,
            baseline: canvas.height / 2,
            baselineShift: baselineDelta,
            visibleCenter: visibleCenter
        };
        //debug stuff commented out
        //document.body.removeChild(canvas);
        //var t1 = performance.now();
        //console.log("Calc Time " + (t1 - t0) + " milliseconds.");
        return result;
    }

    H.seriesTypes.numbergauge = H.extendClass(H.Series, {
        type: 'numbergauge',
        isCartesian: false,
        animation: null,
        drawTracker: H.TrackerMixin.drawTrackerPoint,
        trackerGroups: ['group', 'dataLabelsGroup'],
        hasData: function () { return this.points.length > 0; },
        init: function (chart, options) {
            HighchartsAdapter.addEvent(chart, 'setSize', function (e) {
                scaleTitleFont(chart);
                //chart.series[0].drawPoints();
            });
            if (!options.tooltip) {
                options.tooltip = {};
            }
            options.tooltip.followPointer = true;
            chart.animation = false;
            H.Series.prototype.init.apply(this, [chart, options]);
        },
        drawPoints: function () {
            var series = this,
                renderer = series.chart.renderer,
                point = series.points[0];
                
            series.options.states["hover"].enabled = false;

            scaleTitleFont(series.chart);

            if (this.points.length == 0) {
                return;
            }


            graphic = point.graphic;
            if (graphic) {
                graphic.destroy();
            }

            value = this.options.data[0].x;
            if (series.options.format) {
                value = LogiXML.Formatter.format(value, series.options.format);
            }

            targetBox = series.chart.plotBox;
            

            visual = this.chart.renderer.text(value).attr({
                x: '50%',
                y: '50%'
            }).css(
            {
                color: series.options.fontStyle.color || "#000000",
                "font-family": series.options.fontStyle.fontFamily || "",
                fontWeight: series.options.fontStyle.fontWeight || "",
                fontSize: series.options.fontStyle.fontSize || ""
            }
            ).add(series.group);

            point.graphic = visual;

            if (visual.element.getBoundingClientRect().width + visual.element.getBoundingClientRect().height == 0) {
                return;
            }

            if (!series.options.fontStyle.fontSize || (!series.options.explicitSettedFontSize || series.options.explicitSettedFontSize.indexOf("labels") < 0)) {
                //var t0 = performance.now();
                upscaleFont(visual, targetBox);
                //var t1 = performance.now();
                //console.log("Calc Time " + (t1 - t0) + " milliseconds.");
            }
            sourceBox = visual.element.getBoundingClientRect();
            var actualBox = calculateActualBox(visual.element);
            
            visual.attr({
                x: (targetBox.width / 2) - (sourceBox.width / 2),
                y: (targetBox.height / 2) + actualBox.baselineShift
            });

            
        },
        redraw: function () {
            H.Series.prototype.redraw.call(this);
        },
        reflow: function () {
            H.Series.prototype.reflow.call(this);
        }
    });

    H.seriesTypes.arcgauge = H.extendClass(seriesTypes.pie, {
        type: 'arcgauge',
        pointClass: H.Point,
        hasData: function () { return this.points.length > 0; },
        init: function (chart, options) {
            options.animation = null;
            chart.initialHeight = chart.options.chart.height;
            chart.initialWidth = chart.options.chart.width;
            if (!options.tooltip) {
                options.tooltip = {};
            }
            HighchartsAdapter.addEvent(chart, 'setSize', function (e) {
                chart.series[0].prevArc.destroy();
                chart.series[0].prevArc = null;
                scaleTitleFont(chart);
            });
            scaleTitleFont(chart);
            seriesTypes.pie.prototype.init.apply(this, [chart, options]);
        },

        drawPoints: function () {
            if (this.points.length==0) {
                return;
            }

            var renderer = this.chart.renderer,
                point = this.points[0],
                graphic = point.graphic,
                enableAnimation = true;

            if (!this.radiusesRatio) {
                if (this.userOptions.arcInnerRadius < 1) {
                    this.radiusesRatio = this.userOptions.arcInnerRadius;
                } else {
                    this.radiusesRatio = this.userOptions.arcInnerRadius / (this.chart.plotWidth / 2);
                }
            }
                
            this.shapeArgs = {
                x: this.chart.plotWidth / 2,
                y: this.chart.plotHeight,
                start: Math.PI,
                end: 0
            };

            if (graphic) {
                graphic.destroy();
                //enableAnimation = false;
            }
            
            graphic = renderer.g().css({'stroke-width': 0})
                .add(this.group);
            var minDim;
            
            //var chartCaptionHeight = LogiXML.layout.getTextDimensions(this.chart.title.text, this.chart.title.style).height || 0;
            if (this.chart.options.series[0].explicitSettedFontSize && (this.chart.options.series[0].explicitSettedFontSize.indexOf("axis")>-1 || this.chart.options.series[0].explicitSettedFontSize.indexOf("both")>-1)) {
                this.offsetValue = LogiXML.layout.getTextDimensions("|", this.chart.xAxis[0].options.labels.style);
            } else {
                var maxText = LogiXML.layout.getTextDimensions(this.userOptions.highValue, this.chart.xAxis[0].options.labels.style).width > LogiXML.layout.getTextDimensions(this.userOptions.lowValue, this.chart.xAxis[0].options.labels.style).width ? this.userOptions.highValue : this.userOptions.lowValue;
                var nowTextDims = LogiXML.layout.getTextDimensions(maxText, this.chart.xAxis[0].options.labels.style);
                minDim = (this.chart.plotHeight/* - nowTextDims.height*/) * 2 < this.chart.plotWidth ? (this.chart.plotHeight/* - nowTextDims.height*/) * 2 : this.chart.plotWidth;
                var baseArcWidth = minDim / 2 * (1 - this.radiusesRatio);
                if (nowTextDims.width < baseArcWidth) {
                    while (nowTextDims.width < baseArcWidth && baseArcWidth > 0) {
                        this.chart.xAxis[0].options.labels.style.fontSize = parseInt(this.chart.xAxis[0].options.labels.style.fontSize.substr(0, this.chart.xAxis[0].options.labels.style.fontSize.length - 2)) + 1 + "px";
                        nowTextDims = LogiXML.layout.getTextDimensions(maxText, this.chart.xAxis[0].options.labels.style);
                    }
                    this.chart.xAxis[0].options.labels.style.fontSize = parseInt(this.chart.xAxis[0].options.labels.style.fontSize.substr(0, this.chart.xAxis[0].options.labels.style.fontSize.length - 2)) - 1 + "px";
                } else {
                    while (nowTextDims.width > baseArcWidth && baseArcWidth > 0) {
                        this.chart.xAxis[0].options.labels.style.fontSize = parseInt(this.chart.xAxis[0].options.labels.style.fontSize.substr(0, this.chart.xAxis[0].options.labels.style.fontSize.length - 2)) - 1 + "px";
                        nowTextDims = LogiXML.layout.getTextDimensions(maxText, this.chart.xAxis[0].options.labels.style);
                    }
                    this.chart.xAxis[0].options.labels.style.fontSize = parseInt(this.chart.xAxis[0].options.labels.style.fontSize.substr(0, this.chart.xAxis[0].options.labels.style.fontSize.length - 2)) + 1 + "px";
                }
                var nowFontSize = parseInt(this.chart.xAxis[0].options.labels.style.fontSize.substr(0, this.chart.xAxis[0].options.labels.style.fontSize.length - 2));
                if (nowFontSize<8) {
                    nowFontSize = 8;
                    this.chart.xAxis[0].options.labels.style.fontSize = nowFontSize + "px";
                }
                this.offsetValue = LogiXML.layout.getTextDimensions(maxText, this.chart.xAxis[0].options.labels.style);
                this.offsetValue.height = this.offsetValue.height * 0.77;
            }

            minDim = (this.chart.plotHeight - this.offsetValue.height) * 2 < this.chart.plotWidth ? (this.chart.plotHeight - this.offsetValue.height) * 2 : this.chart.plotWidth;

            var needTriangle = 0;
            var triangleHeightMultiplier = 0.025;
            var triangleHeight = minDim * triangleHeightMultiplier;
            var triangleWidthMultiplier = 1.2;
            var currentValue;// = this.options.data[0].y || this.options.data[0];

            if (this.options.data[0].y || this.options.data[0].y == 0) {
                currentValue = this.options.data[0].y;
            } else {
                currentValue = this.options.data[0];
            }

            if (currentValue < this.chart.xAxis[0].min) {
                needTriangle = -1;
            } else if (currentValue > this.chart.xAxis[0].max) {
                needTriangle = 1;
            }
            if (needTriangle !== 0) {
                this.offsetValue.height += triangleHeight;
            }

            if (this.needTriangle != needTriangle) {
                this.prevArc = null;
                this.needTriangle = needTriangle;
            }

            minDim = (this.chart.plotHeight - this.offsetValue.height) * 2 < this.chart.plotWidth ? (this.chart.plotHeight - this.offsetValue.height) * 2 : this.chart.plotWidth;

            this.shapeArgs.r = minDim / 2;
            this.shapeArgs.innerR = minDim / 2 * this.radiusesRatio;

            //calculate offset for data labels
            if ((this.chart.plotHeight - this.offsetValue.height) * 2 > this.chart.plotWidth) {
                this.shapeArgs.y = this.chart.plotHeight / 2 + this.shapeArgs.r / 2 - this.offsetValue.height / 2;
                
            } else {
                this.shapeArgs.y = this.chart.plotHeight - this.offsetValue.height;
            }
            

            renderer.arc(this.shapeArgs)
                .attr({
                    fill: this.userOptions.arcBackgroundColor || '#FFFFFF',
                    stroke: this.userOptions.arcBorderColor || "#000000",
                    'stroke-width': this.userOptions.arcBorderThickness || 1
                }).add(graphic);

            this.shapeArgs.start = -3.141592653589793;
            this.shapeArgs.end = this.shapeArgs.start;
            var newend;
            
            if (needTriangle < 0) {
                newend = this.shapeArgs.end;
            } else if (needTriangle > 0) {
                newend = 0;
            } else {
                newend = (this.shapeArgs.start - (this.shapeArgs.start) * ((currentValue - this.chart.xAxis[0].min) / (this.chart.xAxis[0].max - this.chart.xAxis[0].min)));
            }
            if (isNaN(newend)) {
                newend = 0;
            }

            if (enableAnimation) {
                
                if (this.prevArc) {
                    this.prevArc.attr({
                        fill: this.getColorsInRangesByValue(currentValue, this.chart.xAxis[0].userOptions.stops) || this.userOptions.arcColor
                    }).add(graphic).animate({
                        end: newend
                    });
                } else {
                    this.prevArc = renderer.arc(this.shapeArgs).attr({
                        fill: this.getColorsInRangesByValue(currentValue, this.chart.xAxis[0].userOptions.stops) || this.userOptions.arcColor
                    }).add(graphic).animate({
                        end: newend
                    }, this.chart.animation);
                }
            } else {
                this.shapeArgs.end = newend;
                renderer.arc(this.shapeArgs).attr({
                    fill: this.getColorsInRangesByValue(currentValue, this.chart.xAxis[0].userOptions.stops) || this.userOptions.arcColor
                }).add(graphic);
            }

            var arcBaseWidth = this.shapeArgs.r - this.shapeArgs.innerR;
            var triangleWidth = arcBaseWidth + (this.userOptions.arcBorderThickness || 1)*2/* * triangleWidthMultiplier*/;

             //border for background arc
            this.shapeArgs.end = 0;
            renderer.arc(this.shapeArgs)
                .attr({
                    stroke: this.userOptions.arcBorderColor || "#000000",
                    'stroke-width': this.userOptions.arcBorderThickness || 1
                }).add(graphic);

            var triangleCenterX;

            if (needTriangle!==0) {
                if (needTriangle<0) {
                    triangleCenterX = this.shapeArgs.x - this.shapeArgs.r + arcBaseWidth / 2;
                } else {
                    triangleCenterX = this.shapeArgs.x + this.shapeArgs.r - arcBaseWidth / 2;
                }
                renderer.path(['M', triangleCenterX - triangleWidth / 2, this.shapeArgs.y, 'L', triangleCenterX + triangleWidth / 2, this.shapeArgs.y, triangleCenterX, this.shapeArgs.y + triangleHeight, 'Z']).attr({
                    fill: this.getColorsInRangesByValue(currentValue, this.chart.xAxis[0].userOptions.stops) || this.userOptions.arcColor,
                    stroke: this.userOptions.arcBorderColor || "#000000",
                    'stroke-width': this.userOptions.arcBorderThickness || 1
                }).add(graphic);
                renderer.path(['M', triangleCenterX - triangleWidth / 2 + (this.userOptions.arcBorderThickness || 1) * 1.5, this.shapeArgs.y - this.userOptions.arcBorderThickness || 1, 'L', triangleCenterX + triangleWidth / 2 - (this.userOptions.arcBorderThickness || 1) * 1.5, this.shapeArgs.y - this.userOptions.arcBorderThickness || 1, triangleCenterX + triangleWidth / 2 - (this.userOptions.arcBorderThickness || 1) * 1.5, this.shapeArgs.y, triangleCenterX, this.shapeArgs.y + triangleHeight - (this.userOptions.arcBorderThickness || 1) / 2, triangleCenterX - triangleWidth / 2 + (this.userOptions.arcBorderThickness || 1) * 1.5, this.shapeArgs.y, 'Z']).attr({
                    fill: this.getColorsInRangesByValue(currentValue, this.chart.xAxis[0].userOptions.stops) || this.userOptions.arcColor
                }).add(graphic);
            }
            point.graphic = graphic;
            this.drawLabels();
        },

        drawLabels: function() {
            var positionX = this.chart.plotWidth / 2,
                positionY = this.shapeArgs.y,
                labelSpace = this.innerRadius,
                labelsXOffset = this.shapeArgs.innerR + (this.shapeArgs.r - this.shapeArgs.innerR)/2,
                positionXa = this.chart.plotWidth / 2 - labelsXOffset,
                positionYa = this.shapeArgs.y + this.offsetValue.height + 2 * (this.userOptions.arcBorderThickness || 1),
                spaceX = this.outerRadius - this.innerRadius,
                positionXb = this.chart.plotWidth / 2 + labelsXOffset,
                positionYb = positionYa,
                renderer = this.chart.renderer,
                marginMultiplier = 0.8,
                graphic = this.chart.graphic;
            if (graphic) {
                graphic.destroy();
            }
            graphic = renderer.g()
                .add(this.group);
            /*if (Math.abs(this.chart.xAxis[0].max) < Math.abs(this.chart.xAxis[0].min)/* && this.chart.xAxis[0].max * this.chart.xAxis[0].min > 0#1#) {
                var t = positionXa;
                positionXa = positionXb;
                positionXb = t;
            }*/
            var nowDim = LogiXML.layout.getTextDimensions(this.userOptions.lowValue, this.chart.xAxis[0].options.labels.style);

            renderer.text(this.userOptions.lowValue, positionXa - (nowDim.width / 2), positionYa).css({
                color: this.chart.xAxis[0].options.labels.style.color || "#000000",
                fontSize: this.chart.xAxis[0].options.labels.style.fontSize,
                "font-family": this.chart.xAxis[0].options.labels.style.fontFamily,
                fontWeight: this.chart.xAxis[0].options.labels.style.fontWeight
                }
                ).add(graphic);
            nowDim = LogiXML.layout.getTextDimensions(this.userOptions.highValue, this.chart.xAxis[0].options.labels.style);
            
            renderer.text(this.userOptions.highValue, positionXb - (nowDim.width / 2), positionYb).css({
                color: this.chart.xAxis[0].options.labels.style.color || "#000000",
                fontSize: this.chart.xAxis[0].options.labels.style.fontSize,
                "font-family": this.chart.xAxis[0].options.labels.style.fontFamily,
                fontWeight: this.chart.xAxis[0].options.labels.style.fontWeight
            }).add(graphic);

            var showText = true;

            var labelText;// = this.options.data[0].y || this.options.data[0];
            if (this.options.data[0].y || this.options.data[0].y == 0) {
                labelText = this.options.data[0].y;
            } else {
                labelText = this.options.data[0];
            }

            if (this.options.dataLabels && this.options.dataLabels.format) {
                labelText = LogiXML.Formatter.format(labelText, this.options.dataLabels.format);
            }else if (this.options.dataLabels && this.options.dataLabels._format) {
                labelText = LogiXML.Formatter.format(labelText, this.options.dataLabels._format);
            }

            if (!this.chart.options.series[0].explicitSettedFontSize || (this.chart.options.series[0].explicitSettedFontSize.indexOf("labels")<0 && this.chart.options.series[0].explicitSettedFontSize.indexOf("both")<0)) {
                nowDim = LogiXML.layout.getTextDimensions(labelText, this.options.dataLabels.style);
                var ratio = nowDim.height / nowDim.width;
                var desiredX = (Math.sqrt(((this.shapeArgs.innerR) * (this.shapeArgs.innerR)) / (1 + ratio * ratio)) * 2)*marginMultiplier;
                var nowFontSize;
                
                if (desiredX < nowDim.width) {
                    while (desiredX < nowDim.width && desiredX != 0) {
                        nowFontSize = parseInt(this.options.dataLabels.style.fontSize.substr(0, this.options.dataLabels.style.fontSize.length - 2));
                        if (nowFontSize < 9) {
                            this.options.dataLabels.style.fontSize = nowFontSize + 1 + "px";
                            showText = false;
                            break;
                        }
                        this.options.dataLabels.style.fontSize = nowFontSize - 1 + "px";
                        nowDim = LogiXML.layout.getTextDimensions(labelText, this.options.dataLabels.style);
                    }
                } else {
                    while (desiredX > nowDim.width && desiredX != 0) {
                        nowFontSize = parseInt(this.options.dataLabels.style.fontSize.substr(0, this.options.dataLabels.style.fontSize.length - 2));
                        if (nowFontSize < 9) {
                            this.options.dataLabels.style.fontSize = nowFontSize + 1 + "px";
                            showText = false;
                            break;
                        }
                        this.options.dataLabels.style.fontSize = nowFontSize + 1 + "px";
                        nowDim = LogiXML.layout.getTextDimensions(labelText, this.options.dataLabels.style);
                    }
                }
            }
            if (parseInt(this.options.dataLabels.style.fontSize.substr(0, this.options.dataLabels.style.fontSize.length - 2))<8) {
                this.options.dataLabels.style.fontSize = "8px";
            }
            if (showText) {
                nowDim = LogiXML.layout.getTextDimensions(labelText, this.options.dataLabels.style);
                renderer.text(labelText, positionX - (nowDim.width / 2), positionY).css({
                    color: this.options.dataLabels.style.color || "#000000",
                    fontSize: this.options.dataLabels.style.fontSize,
                    "font-family": this.options.dataLabels.style.fontFamily,
                    fontWeight: this.options.dataLabels.style.fontWeight
                }).add(graphic);
            }
            this.chart.graphic = graphic;
        },
        getColorsInRangesByValue: function (value, stops) {
            var nowColor = null;
            if (stops.length==0) {
                return this.userOptions.arcColor;
            }
            for (var i = 0; i < stops.length; i++) {
                if (stops[i][0]>value) {
                    nowColor = stops[i][1];
                    break;
                }
            }
            if (!nowColor) {
                nowColor = stops[stops.length - 1][1];
            }
            return nowColor;
        },
        drawDataLabels: function () {},
        translate: function () {
            if (!this.processedXData) { // hidden series
                this.processData();
            }
            this.generatePoints();
            /*var series = this,
                options = series.options,
                stacking = options.stacking,
                xAxis = series.xAxis,
                categories = xAxis.categories,
                yAxis = series.yAxis,
                points = series.points,
                dataLength = points.length,
                hasModifyValue = !!series.modifyValue,
                i,
                pointPlacement = options.pointPlacement,
                dynamicallyPlaced = pointPlacement === 'between' || Y.Lang.isNumber(pointPlacement),
                threshold = options.threshold,
                point = points[0],
                xValue, yValue;


            xValue = xAxis.min,
            yValue = yAxis.min;

            // Get the plotX translation
            point.plotX = xAxis.toPixels(xValue);

            point.plotY = yAxis.toPixels(yValue);

            point.pointWidth = xAxis.toPixels(xAxis.max);
            point.pointHeight = yAxis.toPixels(yAxis.max);


            point.clientX = point.plotX;

            point.negative = point.x < (threshold || 0);

            // some API data
            point.category = categories && categories[point.x] !== UNDEFINED ?
                categories[point.x] : point.x;

            point.shapeType = 'rect';
            point.shapeArgs = {
                x: point.plotX,
                y: point.plotY,
                width: point.pointWidth,
                height: point.pointHeight
            };
            H.Series.prototype.getSegments.call(this);*/
        }
    });
    
    H.seriesTypes.bulletgauge = H.extendClass(H.Series, {
        type: 'bulletgauge',
        animation: null,
        drawTracker: H.TrackerMixin.drawTrackerPoint,
        trackerGroups: ['group', 'dataLabelsGroup'],
        hasData: function () { return this.points.length > 0; },

        init: function (chart, options) {
            chart.xAxis[0].decreaseTickCountIfOverlap = decreaseTickCountIfOverlap;
            options.animation = null;
            if (!options.tooltip) {
                options.tooltip = {};
            }
            var tick;
            for (tick in chart.xAxis[0].ticks) {
                if (chart.xAxis[0].ticks[tick].label) {
                    chart.xAxis[0].ticks[tick].label.destroy();
                    chart.xAxis[0].ticks[tick].label = null;
                    chart.xAxis[0].ticks[tick].isNew = true;
                }
            }
            if (chart.options.yAxis && chart.options.yAxis.length > 0) {
                chart.options.yAxis[0].gridLineWidth = 0;
                chart.yAxis[0].gridLineWidth = 0;
                chart.options.yAxis[0].gridLineWidth = 0;
                chart.yAxis[0].options.gridLineWidth = 0;
                chart.yAxis[0].userOptions.gridLineWidth = 0;
                chart.yAxis[0].options.minorTickLength = 0;
                chart.yAxis[0].userOptions.minorTickLength = 0;
            }
            HighchartsAdapter.addEvent(chart, 'setSize', function (e) {
                var axis = chart.xAxis[0],
                    tick,
                    i = 0, length = axis.ticks.length;
                for (tick in axis.ticks) {
                    if (axis.ticks[tick].label) {
                        axis.ticks[tick].label.destroy();
                        axis.ticks[tick].label = null;
                        axis.ticks[tick].isNew = true;
                    }
                }
                chart.series[0].prevBar.destroy();
                chart.series[0].prevBar = null;
                //axis.chart.spacing[1] = 300;
                //axis.chart.spacing[3] = 300;
                axis.options.startOnTick = true;
                axis.options.endOnTick = true;
                axis.options.showLastLabel = true;
                axis.options.holdLastTick = true;
                scaleAxisLabelsFont(axis);
                scaleTitleFont(chart);
                //axis.options.labels.overflow = false;
                //setAxisTicks(axis);
                axis.isDirty = true;
            });
            HighchartsAdapter.addEvent(chart, 'load', function (e) {
                var axis = chart.xAxis[0];
                scaleTitleFont(chart);
                scaleAxisLabelsFont(axis);
                axis.options.startOnTick = true;
                axis.options.endOnTick = true;
                axis.options.showLastLabel = true;
                axis.options.holdLastTick = true;
                axis.isDirty = true;
            });
            scaleTitleFont(chart);
            scaleAxisLabelsFont(chart.xAxis[0]);
            options.tooltip.followPointer = true;
            H.Series.prototype.init.apply(this, [chart, options]);
            scaleAxisLabelsFont(chart.xAxis[0]);
            scaleTitleFont(chart);
            chart.xAxis[0].isDirty = true;
            //chart.setSize(chart.chartWidth+1, chart.chartHeight+1, false);
            //this.redraw();
        },

        bindAxes: function () {
            var axis;
            H.Series.prototype.bindAxes.apply(this);
            axis = this.xAxis;
            scaleTitleFont(this.chart);
            scaleAxisLabelsFont(axis);
            axis.options.startOnTick = true;
            axis.options.endOnTick = true;
            axis.options.showLastLabel = true;
            axis.options.holdLastTick = true;
            axis.isDirty = true;
            //this.chart.setSize(this.chart.chartWidth + 1, this.chart.chartHeight + 1, false);
        },

        getAttribs: function () {
            var prevColor = this.color;
            this.color = "transparent";

            H.Series.prototype.getAttribs.call(this);

            this.color = prevColor;
        },

        drawPoints: function () {
            if (this.points.length==0) {
                return;
            }
            var series = this,
                xAxis = series.xAxis,
                yAxis = series.yAxis,
                options = series.options,
                renderer = series.chart.renderer,
                x,
                y,
                height,
                width,
                plotBox = series.chart.plotBox,
                point = series.points[0],
                graphic = point.graphic,
                plotX = Math.floor(point.plotX),
                plotY = point.plotY;

            if (graphic) {
                graphic.destroy();
            }

            graphic = renderer.g()
                .add(series.group);

            createPlotBands(series, xAxis, graphic);

            if (xAxis.min == xAxis.max && series.options.wrongData) {
                point.graphic = graphic;
                return;
            }
            var barWidth = xAxis.toPixels(options.data[0].x /* - 0.5*/);
            if (options.data[0].x>xAxis.max) {
                barWidth = xAxis.toPixels(xAxis.max);
            }
            //draw the bar
            if (this.prevBar) {
                this.prevBar.add(graphic).animate({ width: barWidth - series.chart.plotLeft });
            } else {
                this.prevBar = series.chart.renderer.rect(xAxis.toPixels(xAxis.options.min) - series.chart.plotLeft, series.chart.plotHeight / 3, 0, series.chart.plotHeight / 3, 0)
                    .attr({
                        'stroke-width': 1,
                        stroke: series.options.borderColor,
                        fill: series.options.color,
                        zIndex: 3
                    })
                    .add(graphic)
                    .animate({ width: barWidth - series.chart.plotLeft }, this.chart.animation);
            }
            //draw the marker
            var markerValue = options.gaugeMarkerValue;
            if (markerValue || markerValue === 0) {
                x = xAxis.toPixels(markerValue) - series.chart.plotLeft - 3;
                y = plotBox.height * 0.2;
                height = plotBox.height * 0.6;
                width = 6;


                series.gaugeMarker = series.chart.renderer.rect(x, y, width, height, 0)
                .attr({
                    'stroke-width': 1,
                    stroke: options.gaugeMarkerBorderColor || 'black',
                    fill: options.gaugeMarkerColor || 'white',
                    zIndex: 3
                })
                .add(graphic);
            }

            point.graphic = graphic;
        },

        haloPath: function (size) {
        },

        redraw: function () {
            /*var series = this,
			chart = series.chart,
			wasDirtyData = series.isDirtyData, // cache it here as it is set to false in render, but used after
			group = series.group,
			xAxis = series.xAxis,
			yAxis = series.yAxis;*/
            H.Series.prototype.redraw.call(this);
        },

        translate: function () {
            if (!this.processedXData) { // hidden series
                this.processData();
            }
            this.generatePoints();
            var series = this,
                options = series.options,
                stacking = options.stacking,
                xAxis = series.xAxis,
                categories = xAxis.categories,
                yAxis = series.yAxis,
                points = series.points,
                dataLength = points.length,
                hasModifyValue = !!series.modifyValue,
                i,
                pointPlacement = options.pointPlacement,
                dynamicallyPlaced = pointPlacement === 'between' || Y.Lang.isNumber(pointPlacement),
                threshold = options.threshold,
                point = points[0],
                xValue, yValue;

            if (!point) {
                return;
            }
            xValue = xAxis.min,
            yValue = yAxis.min;

            // Get the plotX translation
            point.plotX = xAxis.toPixels(xValue);

            point.plotY = yAxis.toPixels(yValue);

            point.pointWidth = xAxis.toPixels(xAxis.max);
            point.pointHeight = yAxis.toPixels(yAxis.max);


            point.clientX = point.plotX;

            point.negative = point.x < (threshold || 0);

            // some API data
            point.category = categories && categories[point.x] !== UNDEFINED ?
                categories[point.x] : point.x;

            point.shapeType = 'rect';
            point.shapeArgs = {
                x: point.plotX,
                y: point.plotY,
                width: point.pointWidth,
                height: point.pointHeight
            };
            H.Series.prototype.getSegments.call(this);
        },

        getSymbol: function () { return H.UNDEFINED; }

    });

    H.seriesTypes.balloongauge = H.extendClass(H.Series, {
        type: 'balloongauge',
        animation: null,
        drawTracker: H.TrackerMixin.drawTrackerPoint,
        trackerGroups: ['group', 'dataLabelsGroup'],
        tickWidth: 0,
        hasData: function () { return this.points.length > 0; },

        init: function (chart, options) {
            chart.xAxis[0].decreaseTickCountIfOverlap = decreaseTickCountIfOverlap;
            if (options.dataLabels && !options.balloonStyle) {
                options.balloonStyle = options.dataLabels;
                options.dataLabels = {};
            }
            /*chart.marginLeft = 500;
            chart.marginRight = 500;
            chart.options.marginLeft = 500;
            chart.options.marginRight = 500;*/

            if (chart.options.xAxis && chart.options.xAxis.length > 0 && (chart.options.xAxis[0].tickWidth != 0 || chart.userOptions.tickWidth != 0)) {
                this.tickWidth = chart.options.xAxis[0].tickWidth === 0 ? chart.userOptions.tickWidth : chart.options.xAxis[0].tickWidth;
                chart.options.xAxis[0].tickWidth = 0;
                chart.xAxis[0].options.tickWidth = 0;
                chart.xAxis[0].userOptions.tickWidth = 0;
                chart.userOptions.tickWidth = this.tickWidth;
                chart.options.tickWidth = this.tickWidth;

            }
            if (chart.options.yAxis && chart.options.yAxis.length > 0) {
                chart.options.yAxis[0].gridLineWidth = 0;
                chart.yAxis[0].gridLineWidth = 0;
                chart.options.yAxis[0].gridLineWidth = 0;
                chart.yAxis[0].options.gridLineWidth = 0;
                chart.yAxis[0].userOptions.gridLineWidth = 0;
                chart.yAxis[0].options.minorTickLength = 0;
                chart.yAxis[0].userOptions.minorTickLength = 0;
            }
            
            if (chart.options.xAxis && chart.options.xAxis.length > 0) {
                chart.options.xAxis[0].gridLineWidth = 0;
                chart.xAxis[0].options.gridLineWidth = 0;
            }
            var tick;
            for (tick in chart.xAxis[0].ticks) {
                if (chart.xAxis[0].ticks[tick].label) {
                    chart.xAxis[0].ticks[tick].label.destroy();
                    chart.xAxis[0].ticks[tick].label = null;
                    chart.xAxis[0].ticks[tick].isNew = true;
                }
            }
            HighchartsAdapter.addEvent(chart, 'setSize', function (e) {
                var axis = chart.xAxis[0],
                   tick,
                   i = 0, length = axis.ticks.length;
                for (tick in axis.ticks) {
                    if (axis.ticks[tick].label) {
                        axis.ticks[tick].label.destroy();
                        axis.ticks[tick].label = null;
                        axis.ticks[tick].isNew = true;
                    }
                }
                //axis.chart.spacing[1] = 300;
                //axis.chart.spacing[3] = 300;
                axis.options.startOnTick = true;
                axis.options.endOnTick = true;
                axis.options.showLastLabel = true;
                axis.options.holdLastTick = true;
                scaleAxisLabelsFont(axis);
                scaleTitleFont(chart);
                //axis.options.labels.overflow = false;
                //setAxisTicks(axis);
                chart.series[0].drawPoints();
                axis.isDirty = true;
            });
            HighchartsAdapter.addEvent(chart, 'load', function (e) {
                var axis = chart.xAxis[0];
                scaleTitleFont(chart);
                scaleAxisLabelsFont(axis);
                axis.options.startOnTick = true;
                axis.options.endOnTick = true;
                axis.options.showLastLabel = true;
                axis.options.holdLastTick = true;
                axis.isDirty = true;
            });
            //scaleTitleFont(chart);
            options.animation = null;
            if (!options.tooltip) {
                options.tooltip = {};
            }
            scaleTitleFont(chart);
            scaleAxisLabelsFont(chart.xAxis[0]);
            options.tooltip.followPointer = true;
            H.Series.prototype.init.apply(this, [chart, options]);
            scaleAxisLabelsFont(chart.xAxis[0]);
            scaleTitleFont(chart);
            chart.xAxis[0].isDirty = true;
        },

        bindAxes: function () {
            var axis;
            H.Series.prototype.bindAxes.apply(this);
            axis = this.xAxis;
            scaleAxisLabelsFont(axis);
            //setAxisTicks(axis);
            axis.options.startOnTick = true;
            axis.options.endOnTick = true;
            axis.options.showLastLabel = true;
            axis.options.holdLastTick = true;
            axis.isDirty = true;
        },

        drawPoints: function () {
            if (this.points.length==0) {
                return;
            }
            var series = this,
				xAxis = series.xAxis,
				options = series.options,
				renderer = series.chart.renderer,
                point = series.points[0],
                graphic = point.graphic,
                group = series.group;

            if (graphic) {
                graphic.destroy();
            }
            graphic = renderer.g()
                .attr({
                })
                .add(series.group);
            if (xAxis.min != xAxis.max && !series.options.wrongData) {
                this.drawBalloon(series, graphic);
            }
            createPlotBands(series, xAxis, graphic);
            if (this.tickWidth > 0) {
                this.createTicks(series, xAxis, graphic);
            }
            point.graphic = graphic;
        },

        redraw: function () {
            H.Series.prototype.redraw.call(this);
        },

        translate: function () {
            if (!this.processedXData) { // hidden series
                this.processData();
            }
            this.generatePoints();
            var series = this,
                options = series.options,
                stacking = options.stacking,
                xAxis = series.xAxis,
                categories = xAxis.categories,
                yAxis = series.yAxis,
                points = series.points,
                dataLength = points.length,
                hasModifyValue = !!series.modifyValue,
                i,
                pointPlacement = options.pointPlacement,
                dynamicallyPlaced = pointPlacement === 'between' || Y.Lang.isNumber(pointPlacement),
                threshold = options.threshold,
                point = points[0],
                xValue, yValue;

            if (!point) {
                return;
            }
            xValue = xAxis.min,
            yValue = yAxis.min;

            // Get the plotX translation
            point.plotX = xAxis.toPixels(xValue);

            point.plotY = yAxis.toPixels(yValue);

            point.pointWidth = xAxis.toPixels(xAxis.max);
            point.pointHeight = yAxis.toPixels(yAxis.max);
                

            point.clientX = point.plotX;

            point.negative = point.x < (threshold || 0);

            // some API data
            point.category = categories && categories[point.x] !== UNDEFINED ?
                categories[point.x] : point.x;

            point.shapeType = 'rect';
            point.shapeArgs = {
                x: point.plotX,
                y: point.plotY,
                width: point.pointWidth,
                height: point.pointHeight
            };

            H.Series.prototype.getSegments.call(this);
        },

        drawDataLabels: function() {
            var series = this,
		    seriesOptions = series.options,
		    cursor = seriesOptions.cursor,
		    options = seriesOptions.dataLabels,
		    points = series.points,
		    pointOptions,
		    generalOptions,
		    hasRendered = series.hasRendered || 0,
		    str,
		    dataLabelsGroup;


                // Process default alignment of data labels for columns
                if (series.dlProcessOptions) {
                    series.dlProcessOptions(options);
                }

                // Create a separate group for the data labels to avoid rotation
                dataLabelsGroup = series.plotGroup(
                    'dataLabelsGroup',
                    'data-labels',
                    options.defer ? 'hidden' : 'visible',
                    options.zIndex || 6
                );

                if (pick(options.defer, true)) {
                    dataLabelsGroup.attr({ opacity: +hasRendered }); // #3300
                    if (!hasRendered) {
                        H.addEvent(series, 'afterAnimate', function () {
                            if (series.visible) { // #3023, #3024
                                dataLabelsGroup.show();
                            }
                            dataLabelsGroup[seriesOptions.animation ? 'animate' : 'attr']({ opacity: 1 }, { duration: 200 });
                        });
                    }
                }

                // Make the labels for each point
                generalOptions = options;
                each(points, function (point) {

                    var enabled,
                        dataLabel = point.dataLabel,
                        attr,
                        name,
                        rotation,
                        connector = point.connector,
                        isNew = true;

                    // Determine if each data label is enabled
                    pointOptions = point.options && point.options.dataLabels;

                    // Create individual options structure that can be extended without
                    // affecting others
                    options = merge(generalOptions, pointOptions);

                    rotation = options.rotation;

                    // Get the string
                    if (series.options.balloonStyle && series.options.balloonStyle.format) {
                        str = LogiXML.Formatter.format(parseFloat(series.data[0].x), series.options.balloonStyle.format);
                    } else if (series.options.balloonStyle && series.options.balloonStyle._format) {
                        str = LogiXML.Formatter.format(parseFloat(series.data[0].x), series.options.balloonStyle._format);
                    }
                    else {
                        str = series.data[0].x;
                    }
                    

                    str = series.trimDataLabels(str); //LOGIFIX 22191 ChartCanvas: Reverting of an upgrade to v4 framework
                    // Determine the color
                    options.style.color = pick(options.color, options.style.color, series.color, 'black');


                    // update existing label
                    if (dataLabel) {

                        if (str) {
                            dataLabel
                                .attr({
                                    text: str
                                })
                                .css({ fontSize: options.style.fontSize })
                            isNew = false;

                        } else { // #1437 - the label is shown conditionally
                            point.dataLabel = dataLabel = dataLabel.destroy();
                            if (connector) {
                                point.connector = connector.destroy();
                            }
                        }

                        // create new label
                    } else if (str) {
                        attr = {
                            //align: align,
                            fill: options.backgroundColor,
                            stroke: options.borderColor,
                            'stroke-width': options.borderWidth,
                            r: options.borderRadius || 0,
                            rotation: rotation,
                            padding: options.padding,
                            zIndex: 1
                        };
                        // Remove unused attributes (#947)
                        for (name in attr) {
                            if (attr[name] === undefined) {
                                delete attr[name];
                            }
                        }

                        dataLabel = point.dataLabel = series.chart.renderer[rotation ? 'text' : 'label']( // labels don't support rotation
                            str,
                            0,
                            -999,
                            null,
                            null,
                            null,
                            options.useHTML
                        )
                        .attr(attr)
                        .css(H.extend(options.style, cursor && { cursor: cursor }))
                        .add(dataLabelsGroup)
                        .shadow(options.shadow);

                    }

                    if (dataLabel) {
                        // Now the data label is created and placed at 0,0, so we need to align it
                        series.alignDataLabel(point, dataLabel, options, null, isNew);
                    }
                });
        },

        alignDataLabel: function (point, dataLabel, options, alignTo, isNew) {
            //nothing 
        },

        getSymbol: function () { return H.UNDEFINED; },

        drawBalloon: function (series, graphic) {
            var options = series.options,
            renderer = series.chart.renderer,
            leftMargin = series.chart.plotLeft,
            rightMargin = 2,
            cornerRound = 2,
            balloonValue = series.data[0].x,
            balloonPointer = series.xAxis.toPixels(balloonValue) - leftMargin,
            fontSize,
            balloonLabelText = series.data[0].x,
            balloonTextSize,
            balloonTextWidth,
            balloonTextHeight,
            balloonWidth,
            balloonHeight,


            //Constants for left and right arrow pointers.
            sidePointerLength = series.chart.plotWidth * 0.04,

            startX,
            startY = 1,
            dx,
            dy,

            //plot midian line
            plotMidian = series.chart.plotHeight / 2,

            //range
            startValue = series.xAxis.min,
            endValue = series.xAxis.max,

            pointerPosition,
            segments = [];

            if (series.options.balloonStyle && series.options.balloonStyle.format) {
                balloonLabelText = LogiXML.Formatter.format(balloonLabelText, series.options.balloonStyle.format);

            } else if (series.options.balloonStyle && series.options.balloonStyle._format) {
                balloonLabelText = LogiXML.Formatter.format(balloonLabelText, series.options.balloonStyle._format);
            }

			
            //datalabel start
            if ( !(series.userOptions.dataLabels && series.userOptions.dataLabels.style && series.userOptions.dataLabels.style.fontSize)) {
                fontSize = series.chart.chartHeight / 9 + 'px';

                if (!series.options.dataLabels) {
                    series.options.dataLabels = {};
                }
                if (!series.options.dataLabels.style) {
                    series.options.dataLabels.style = {};
                }
            }
            if (series.options.fontStyle && series.options.fontStyle.color) {
                series.options.dataLabels.style.color = series.options.fontStyle.color;
            }
            series.options.dataLabels.style.fontSize = series.options.fontStyle && series.options.fontStyle.fontSize ? series.options.fontStyle.fontSize : fontSize;
            series.options.dataLabels.style.fontFamily = series.options.fontStyle && series.options.fontStyle.fontFamily? series.options.fontStyle.fontFamily : series.chart.renderer.getStyle().fontFamily;
            balloonTextSize = LogiXML.layout.getTextDimensions(balloonLabelText, series.options.dataLabels.style);
            balloonTextWidth = balloonTextSize.width + 2,
            balloonTextHeight = balloonTextSize.height,
            balloonWidth = balloonTextWidth + cornerRound * 2,
            balloonHeight = balloonTextHeight * 1.1;

            series.points[0].dataLabel
                .css({
                    fontSize: series.options.dataLabels.style.fontSize || fontSize,
                    color: series.options.dataLabels.style.color,
                    'font-family': series.options.dataLabels.style.fontFamily
                })
                .attr({
                    text: balloonLabelText
                });
            //datalabel end

            //will be used in drawing of plot bands
            series.plotBandsOffset = balloonHeight + 6;

            if (balloonValue < startValue) {
                pointerPosition = 'left';
                startX = sidePointerLength;
            } else if (balloonValue > endValue/* + startValue*/) {
                pointerPosition = 'right';
                startX = series.xAxis.toPixels(series.xAxis.max) - leftMargin - balloonWidth  - sidePointerLength;
            } else if (balloonPointer - balloonWidth / 2 <= 0) {
                pointerPosition = 'beginningTransition';
                startX = leftMargin;
            } else if (balloonPointer + balloonWidth / 2 > series.chart.plotWidth) {
                pointerPosition = 'endingTransition';
                startX = series.chart.plotWidth - balloonWidth - rightMargin;
            } else {
                pointerPosition = 'center';
                startX = balloonPointer - balloonWidth / 2;
            }
            series.labelStartX = startX;
            series.labelStartY = startY;
            dx = startX + cornerRound;
            dy = startY;
            segments.push('M');
            segments.push(dx);
            segments.push(dy);
            segments.push('L');
            //top side
            dx += balloonTextWidth;
            segments.push(dx);
            segments.push(dy);
            //right-top corner
            if (cornerRound > 0) {
                dx = dx + cornerRound
                segments.push('Q');
                segments.push(dx);
                segments.push(dy);
                dy = dy + cornerRound;
                segments.push(dx);
                segments.push(dy);
                segments.push('L');
            }
            //right side
            switch (pointerPosition) {
                case 'right':
                    dy += balloonTextHeight * 0.4;
                    segments.push(dx);
                    segments.push(dy);
                    dy += balloonTextHeight * 0.1;
                    dx += sidePointerLength;
                    segments.push(dx);
                    segments.push(dy);
                    dy += balloonTextHeight * 0.1;
                    dx -= sidePointerLength;
                    segments.push(dx);
                    segments.push(dy);
                    dy += balloonTextHeight * 0.4;
                    segments.push(dx);
                    segments.push(dy);
                    break;

                default:
                    dy += balloonTextHeight;
                    segments.push(dx);
                    segments.push(dy);
                    break;
            }
            //right-bottom corner
            if (cornerRound > 0) {
                dy = dy + cornerRound;
                segments.push('Q');
                segments.push(dx);
                segments.push(dy);
                dx = dx - cornerRound;
                segments.push(dx);
                segments.push(dy);
                segments.push('L');
            }
            //bottom side
            switch (pointerPosition) {
                case 'center':
                    dx -= balloonTextWidth * 0.4;
                    segments.push(dx);
                    segments.push(dy);
                    dx -= balloonTextWidth * 0.1;
                    segments.push(dx);
                    segments.push(dy + plotMidian / 2);
                    dx -= balloonTextWidth * 0.1;
                    segments.push(dx);
                    segments.push(dy);
                    dx -= balloonTextWidth * 0.4;
                    segments.push(dx);
                    segments.push(dy);
                    break;
                case 'beginningTransition':
                    var start = dx;
                    dx -= balloonTextWidth * 0.6;
                    segments.push(dx);
                    segments.push(dy);

                    dx = balloonPointer;
                    segments.push(dx);
                    segments.push(dy + plotMidian / 2);

                    dx = start - balloonTextWidth * 0.8;
                    segments.push(dx);
                    segments.push(dy);

                    dx = start - balloonTextWidth;
                    segments.push(dx);
                    segments.push(dy);

                    break;
                case 'endingTransition':
                    var start = dx;
                    dx -= balloonTextWidth * 0.4;
                    segments.push(dx);
                    segments.push(dy);

                    dx = balloonPointer;
                    segments.push(dx);
                    segments.push(dy + plotMidian / 2);

                    dx = start - balloonTextWidth * 0.6;
                    segments.push(dx);
                    segments.push(dy);

                    dx = start - balloonTextWidth;
                    segments.push(dx);
                    segments.push(dy);
                    break;
                default:
                    dx -= balloonTextWidth;
                    segments.push(dx);
                    segments.push(dy);
                    break;
            }

            //left-bottom corder
            if (cornerRound > 0) {
                dx -= cornerRound;
                segments.push('Q');
                segments.push(dx);
                segments.push(dy);
                dy -= cornerRound;
                segments.push(dx);
                segments.push(dy);
                segments.push('L');
            }
            //left side
            switch (pointerPosition) {
                case 'left':
                    dy -= balloonTextHeight * 0.4;
                    segments.push(dx);
                    segments.push(dy);
                    dy -= balloonTextHeight * 0.1;
                    dx -= sidePointerLength;
                    segments.push(dx);
                    segments.push(dy);
                    dy -= balloonTextHeight * 0.1;
                    dx += sidePointerLength;
                    segments.push(dx);
                    segments.push(dy);
                    dy -= balloonTextHeight * 0.4;
                    segments.push(dx);
                    segments.push(dy);
                    break;

                default:
                    dy -= balloonTextHeight;
                    segments.push(dx);
                    segments.push(dy);
                    break;
            }

            //left-top corner
            if (cornerRound > 0) {
                dy -= cornerRound;
                segments.push('Q');
                segments.push(dx);
                segments.push(dy);
                dx += cornerRound;
                segments.push(dx);
                segments.push(dy);
            }

            var finalPath = [],
                shape, shadow, balloonContainer;
            finalPath = finalPath.concat(segments);
            finalPath.push('z');

            balloonContainer = renderer.g()
                .attr({
                    opacity: 1,
                    'zIndex': 3
                })
                .add(graphic);
            shape = renderer.path(finalPath)
                .attr({
                    'stroke-width': '1px',
                    stroke: series.options.balloonBorderColor || "#000000",
                    fill: series.options.balloonColor || "#FFFFFF",
                    'zIndex': 3
                })
                .add(balloonContainer);

            //LogiXML.attr(shape.shadows[0], { fill: 'black', 'fill-opacity': 0.0 });



           /* series.points[0].dataLabel.align({
                align: 'center', verticalAlign: 'middle'/*, width: balloonTextWidth,
                height: balloonTextHeight#1#
            }, null, {
                x: series.labelStartX,
                y: series.labelStartY,
                width: balloonWidth,
                height: balloonWidth
            });*/
            var attribs = {};
            attribs['x'] = Math.round(series.labelStartX+((balloonWidth - balloonTextWidth)/2)-cornerRound);
            attribs['y'] = Math.round(/*series.labelStartY+*/((balloonHeight - balloonTextHeight * 1.15) / 2));
            //alert(isIE());
            if (isIE()<=8) {
                attribs['x'] = Math.round(series.labelStartX);
                series.points[0].dataLabel.element.childNodes[0].style.top = series.labelStartY + 'px';
            }
            series.points[0].dataLabel['attr'](attribs);
            series.points[0].dataLabel.alignAttr = attribs;
            
            //series.points[0].dataLabel.x = series.labelStartX;
            //series.points[0].dataLabel.y = series.labelStartY;
            /*renderer.text(balloonLabelText, startX + (cornerRound < 2 ? 2 : cornerRound), startY + balloonTextHeight - cornerRound)
                .attr({ 'zIndex': 3, color: 'black', stroke: 'black' })
                .add(balloonContainer);
                */
        },

        createTicks: function (series, axis, graphic) {
            var i = 1, length = axis.tickPositions.length,
                tick, line,
                tickColor = axis.userOptions.tickColor ? axis.userOptions.tickColor : '#000000',
                yOffset = series.plotBandsOffset ? series.plotBandsOffset : 0,
                plotHeight = series.chart.plotHeight - yOffset,
                yStart, yEnd,
                tickSizeMultiplier = 0.3,
                segments = [];
            if (axis.options.labels && !axis.options.labels.enabled) {
                return;
            }
            if (series.tickWidth > 0) {

                for (; i < length - 1; i++) {
                    yStart = yOffset + (plotHeight - plotHeight * tickSizeMultiplier) / 2;
                    yEnd = yStart + plotHeight * tickSizeMultiplier;
                    segments = [];
                    segments.push('M');
                    segments.push(axis.toPixels(axis.tickPositions[i]) - series.chart.plotLeft);
                    segments.push(yStart);
                    segments.push('L');
                    segments.push(axis.toPixels(axis.tickPositions[i]) - series.chart.plotLeft);
                    segments.push(yEnd);
                    series.chart.renderer.path(segments)
                        .attr({
                            'stroke-width': series.tickWidth,
                            stroke: tickColor,
                            fill: tickColor,
                            'zIndex': 1
                        })
                        .add(graphic);
                    if (axis.min==axis.max) {
                        return;
                    }
                }

            }
        },

        drawGraph: function () { return H.UNDEFINED; }
    });

}(Highcharts));

