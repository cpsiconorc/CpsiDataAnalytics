/**
 * @license 
 * Highcharts funnel module, Beta
 *
 * (c) 2010-2012 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */
/*global Highcharts */
var getColorComponentFromRgbString = function(color, offset) {
    var re = /rgb\((\d+),(\d+),(\d+)\)/;
    var expression = re.exec(color);
    var index = offset / 8 + 1;
    return expression[index];
};
var getColorComponent = function (color, offset) {
    if (color.startsWith("rgb")) {
        return getColorComponentFromRgbString(color, offset);
    }
    var bigInt = parseInt(color.substring(1), 16);
    return (bigInt >> offset) & 255;
};

var Color = Highcharts.Color || {};
Color.getPercentOfSpreadColor3 = function(nValue, nMinRange, nMaxRange, sHexColorLow, sHexColorMed, sHexColorHi) {
    //Get the Percent of Spread from 2 colors.
    if (nMinRange >= nMaxRange)
        return sHexColorMed;

    //Fix the value so it's between 0 and 1, according to the Min and Max range values.
    if (nValue < nMinRange)
        nValue = nMinRange;
    if (nValue > nMaxRange)
        nValue = nMaxRange;

    nValue = (nValue - nMinRange) / (nMaxRange - nMinRange);

    var rLow = parseInt(sHexColorLow.substring(1, 3), 16);
    var gLow = parseInt(sHexColorLow.substring(3, 5), 16);
    var bLow = parseInt(sHexColorLow.substring(5, 7), 16);
    var rMed = parseInt(sHexColorMed.substring(1, 3), 16);
    var gMed = parseInt(sHexColorMed.substring(3, 5), 16);
    var bMed = parseInt(sHexColorMed.substring(5, 7), 16);
    var rHi = parseInt(sHexColorHi.substring(1, 3), 16);
    var gHi = parseInt(sHexColorHi.substring(3, 5), 16);
    var bHi = parseInt(sHexColorHi.substring(5, 7), 16);

    var factorlow = Math.sin((nValue + 0.5) * Math.PI);
    var factorMed = Math.sin(nValue * Math.PI);
    var factorHi = Math.sin((nValue - 0.5) * Math.PI);

    if (factorlow < 0) factorlow = 0;
    if (factorMed < 0) factorMed = 0;
    if (factorHi < 0) factorHi = 0;

    var r = (rLow * factorlow) + (rMed * factorMed) + (rHi * factorHi);
    var g = (gLow * factorlow) + (gMed * factorMed) + (gHi * factorHi);
    var b = (bLow * factorlow) + (bMed * factorMed) + (bHi * factorHi);

    if (r > 255)
        r = 255;
    if (g > 255)
        g = 255;
    if (b > 255)
        b = 255;
    var normalizeArgument = function(arg) {
        var result = Math.floor(arg).toString(16);
        if (result === "0")
            return "00";
        return result;
    };
    
    return "#" + normalizeArgument(r) + normalizeArgument(g) + normalizeArgument(b);
};
Color.R = function (color) { return getColorComponent(color, 16); };
Color.G = function (color) { return getColorComponent(color, 8); };
Color.B = function (color) { return getColorComponent(color, 0); };

Array.prototype.flattern = function(fnChildren) {
    var childrenFlat = [];
    for (var index = 0; index < this.length; index++) {
        var currentCell = this[index];
        var children = fnChildren(currentCell);
        if (children && children.length) {
            var flattered = children.flattern(fnChildren);
            childrenFlat = childrenFlat.concat(flattered);
        } else {
            childrenFlat.push(currentCell);
        }
    }

    return childrenFlat;
};

(function (Highcharts) {
   
    //'use strict;

    var NORMAL_STATE = '',
        HOVER_STATE = 'hover',
        SELECT_STATE = 'select';
    
    // create shortcuts
    var defaultOptions = Highcharts.getOptions(),
        defaultPlotOptions = defaultOptions.plotOptions,
        seriesTypes = Highcharts.seriesTypes,
        merge = Highcharts.merge,
        noop = function () { },
        each = Highcharts.each;

    // set default options
    defaultPlotOptions.treemap = merge(defaultPlotOptions.pie, {
        center: ['50%', '50%'],
        width: '100%',
        height: '100%',

        dataLabels: {
            connectorWidth: 1,
            connectorColor: '#606060',
            align: 'left',
            verticalAlign: 'top'
        },
        size: true, // to avoid adapting to data label size in Pie.drawDataLabels
        states: {
            select: {
                color: '#C0C0C0',
                borderColor: '#000000',
                shadow: false
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size: 10px">{point.key:.2f}</span><br/>',
            pointFormat: '<span style="color:{series.color}"></span>{series.name}: <b>{point.y:.2f}</b><br/>'
        }
        
    });


    seriesTypes.treemap = Highcharts.extendClass(seriesTypes.pie, {
        type: 'treemap',
        pointClass: Highcharts.Point,
        animate: noop,
        trackerGroups: ['group', 'dataLabelsGroup', 'cellsGroup'],
        gradientColors: ['#339900', '#FF0000'],
        // -----
        treeMapRectSize: function() {
            //if border is rounded
            var plotBox = this.chart.plotBox;
            return { X: plotBox.x, Y: plotBox.y, Width: plotBox.width, Height: plotBox.height };
        },
        isInsidePlot: function() {
            return true;
        },
        // -----
        calculateCells: function (cells, parentCell, parentRect) {
            var rect;
            if (parentCell == null)
                rect = parentRect || this.treeMapRectSize();
            else {
                var name = parentCell.isGroup ?  (parentCell.name || "|") : parentCell.name;
                var dimensions = LogiXML.layout.getTextDimensions(name, parentCell.style);
                var padding = 5;
                rect = { X: parentCell.Rect.X + padding, Y: parentCell.Rect.Y + dimensions.height + padding, Width: parentCell.Rect.Width - padding * 2, Height: parentCell.Rect.Height - dimensions.height - padding * 2 };
                if (!rect.Width || rect.Width < 0)
                    rect.Width = 0;
                
                if (!rect.Height || rect.Height < 0)
                    rect.Height = 0;
            }
            if (!cells || !cells.length) {
                return;
            }
            var sortFunction = function(a, b) {
                    return b.y - a.y;
                };

            cells = cells.sort(sortFunction);
            this.calculateCellSizes(rect, cells);
            
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                cell.parent = parentCell;
                if (cell.children && cell.children.length) {
                    cell.children = cell.children.sort(sortFunction);
                    this.calculateCells(cell.children, cell);
                }
                    
            }
            
            var options = this.userOptions;
            
            this.evaluateCellsColors(cells, options.lowValueColor, options.mediumValueColor, options.highValueColor);
        },
        // -----

        getAspect: function(cells, iStart, iEnd, dWidth, dHeight, isVertical) {
            var dTotal = 0,
                dLocalWidth = 0,
                dLocalHeight = 0;

            for (var i = iStart; i <= iEnd; i++) {
                dTotal += cells[i].ScaledSizeValue;
            }

            if (isVertical) {
                dLocalWidth = dTotal / dHeight * 100;
                dLocalHeight = dHeight;
            } else {
                dLocalWidth = dWidth;
                dLocalHeight = dTotal / dWidth * 100;
            }

            for (i = iStart; i <= iEnd; i++) {
                cells[i].WidthTemp = dLocalWidth;
                cells[i].HeightTemp = dLocalHeight;
                var ratio = cells[i].ScaledSizeValue / dTotal;
                if (isVertical) {
                    cells[i].HeightTemp *= ratio;
                } else {
                    cells[i].WidthTemp *= ratio;
                }
            }
            var lastCell = cells[iEnd];
            return Math.max(lastCell.HeightTemp / lastCell.WidthTemp, lastCell.WidthTemp / lastCell.HeightTemp);
        },
        // -----
        calculateCellSizes: function(rect, cells) {
            if (cells.length === 0)
                return;

            if (rect.Width <= 0 || rect.Height <= 0) {
                for (var index = 0; index < cells.length; index++) {
                    cells[index].Rect = rect;
                }
            }
            var rectWidth = rect.Width;
            var rectHeight = rect.Height;

            var offsetX = 0;
            var offsetY = 0;

            //to fix negative numbers sizing
            var minCellSize = cells[0].y;

            for (var i = 1; i < cells.length; i++) {
                minCellSize = Math.min(cells[i].y, minCellSize);
            }
            var subValue = 0;
            if (minCellSize < 0)
                //19374,19376 - Add double the min value, instead of simply adding a fixed value of 1 or 10. doesn't work when the min value is a large -ve number.
                subValue = Math.abs(minCellSize) * 2;
            else if (minCellSize === 0) {
                //' For zero values, add the small +ve value of 1 or 10 based on condition.19587
                //15747
                var addValue = 1;
                subValue = Math.abs(minCellSize) + addValue;
            }

            //calculate total data amount (sum of Size column)
            var totalData = 0;
            for (i = 0; i < cells.length; i++) {
                var value = cells[i].y;
                totalData += (value + subValue);
            }
            // get 1 percent of the rectangle square
            var scaleValue = ((rect.Width * rect.Height) / totalData) / 100;
            //set scaled size for each rectangle
            for (i = 0; i < cells.length; i++) {
                value = cells[i].y;
                cells[i].ScaledSizeValue = (value + subValue) * scaleValue;
            }
            var start = 0;
            var end = 0;
            var isVertical = rectWidth > rectHeight;
            var aspectCurr = Number.MAX_VALUE;
            var aspectLast = 0;

            while (end != cells.length) {
                aspectLast = this.getAspect(cells, start, end, rectWidth, rectHeight, isVertical);

                if (((aspectLast > aspectCurr) || (aspectLast < 1)) && cells.length > 1) {
                    var currX = 0;
                    var currY = 0;

                    for (var i = start; i <= end; i++) {
                        var cellRect = cells[i].Rect || {};
                        
                        cellRect.X = rect.X + offsetX + currX;
                        cellRect.Y = rect.Y + offsetY + currY;

                        if (isVertical)
                            currY += cellRect.Height;
                        else
                            currX += cellRect.Width;

                        cells[i].Rect = cellRect;
                    }

                    if (isVertical)
                        offsetX += cells[start].Rect.Width;
                    else
                        offsetY += cells[start].Rect.Height;

                    
                    rectWidth = rect.Width - offsetX;
                    rectHeight = rect.Height - offsetY;
                    isVertical = rectWidth > rectHeight;

                    start = end;
                    aspectCurr = Number.MAX_VALUE;
                    continue;
                } else {
                    for (i = start; i <= end; i++) {
                        if (!cells[i].Rect)
                            cells[i].Rect = {};
                        cells[i].Rect.Width = cells[i].WidthTemp || 0;
                        cells[i].Rect.Height = cells[i].HeightTemp || 0 ;
                    }
                    aspectCurr = aspectLast;
                }
                end += 1;
            }
            
            var currX1 = 0;
            var currY1 = 0;

            for (i = start; i < end; i++) {
                cells[i].Rect.X = rect.X + offsetX + currX1;
                cells[i].Rect.Y = rect.Y + offsetY + currY1;
                if (isVertical)
                    currY1 += cells[i].Rect.Height;
                else
                    currX1 += cells[i].Rect.Width;
                
            }
        },
        getCenter: Highcharts.CenteredSeriesMixin.getCenter,
        drawDataLabels: function() {
            var series = this,
                seriesOptions = series.options,
                cursor = seriesOptions.cursor,
                options = seriesOptions.dataLabels,
                points = series.points,
                pointOptions,
                generalOptions,
                str,
                dataLabelsGroup;

            if (options.enabled || series._hasPointLabels) {

                // Process default alignment of data labels for columns
                if (series.dlProcessOptions) {
                    series.dlProcessOptions(options);
                }

                // Create a separate group for the data labels to avoid rotation
                dataLabelsGroup = series.plotGroup(
                    'dataLabelsGroup',
                    'data-labels',
                    series.visible ? Highcharts.VISIBLE : Highcharts.HIDDEN,
                    options.zIndex || 6
                );
                var drawChildLabels = function (point) {
                    series.drawLabel(point.name, point, dataLabelsGroup);
                    if (point.children)
                        each(point.children, function (child) {
                            drawChildLabels(child);
                        });
                };
                each(points, function (point) {
                    drawChildLabels(point);
                });
            }
        },
        /**
         * Overrides the pie translate method
         */
        translate: function(positions) {

            var // Get positions - either an integer or a percentage string must be given
                sum = 0,
                series = this,
                visible = true,
                chart = series.chart,
                options = series.options,
                data = series.data,
                half = options.dataLabels.position === 'left' ? 1 : 0;
           
            series.center = series.options.center;
            chart.isInsidePlot = series.isInsidePlot;
            if (!positions) {
			    series.center = positions = series.getCenter();
		    }
            // get the total sum
            var mappingFunction = function (point, nestingLevel) {
                // we should inherit point from Highcharts Point
                var nesting = nestingLevel;
                var parentPrototype = series.pointClass.prototype;
                point.onMouseOver = parentPrototype.onMouseOver;
                point.firePointEvent = parentPrototype.firePointEvent;
                point.getLabelConfig = parentPrototype.getLabelConfig;
                point.setState = parentPrototype.setState;
                point.onMouseOut = parentPrototype.onMouseOut;
                point.select = point.selectable ? parentPrototype.select : function (){};
                //REPDEV-25316,
                //point.options = {};

                point.series = series;
                point.half = half;
                point.color = parseFloat(point.color) || 10;
                point.isGroup = point.children && point.children.length;

                point.getContrastTextColor = function (backgroundColor, darkColor, lightColor) {
                    var brightness = Color.R(backgroundColor) * 0.244627436 + Color.G(backgroundColor) * 0.672045616 + Color.R(backgroundColor) * 0.083326949;
                    return brightness < 255 * 0.5 ? darkColor : lightColor;
                };

                point.y = parseFloat(point.y) || 0;
                point.getStyle = function () {
                    if (this.isGroup) {
                        return options.dataGrouping.groupStyles[nesting];
                    }
                    return options.dataLabels.style;
                };
                point.style = point.getStyle();
                if (point.style.style) {
                    point.style.color = point.style.style.color;
                    point.style.fontSize = point.style.style.fontSize || options.dataLabels.style.fontSize;
                    point.style.fontWeight = point.style.style.fontWeight;
                    point.style.fontFamily = point.style.style.fontFamily;
                }

                point.style.cellBorderColor = point.isGroup ? point.style.cellBorderColor : options.cellBorderColor;
                point.style.cellBorderThickness = point.isGroup ? point.style.cellBorderThickness : options.cellBorderThickness;
                // #23585 - ChartCanvas: Heatmap label must have "hand" cursor when action under series
                point.style.cursor = point.isGroup ? (point.selectable ? 'pointer' : 'default') : options.cursor;
                point.getColor = function () {
                    return this.isGroup ? this.style.backgroundColor : point.Color;
                };
                point.Color = point.getColor();
                point.darkBackgroundFontColor = options.darkBackgroundFontColor || 'White';
                point.lightBackgroundFontColor = options.lightBackgroundFontColor || 'Black';

                point.label = {};
                point.label.color = function (pt) {
                    if (pt.isGroup) {
                        return point.style.color;
                    }
                    return pt.getContrastTextColor(pt.getColor(), pt.darkBackgroundFontColor, pt.lightBackgroundFontColor);
                };

                var align = "left";
                if (point.style.align) {
                    align = point.style.align.toLowerCase();
                }
                point.label.align = point.isGroup ? align : options.dataLabels.align;
                point.label.verticalAlign = point.isGroup ? "top" : options.dataLabels.verticalAlign;
                point.label.getTextAnchor = function() {
                    var cssToSvgMapping = { 'center': 'middle', 'right': 'end', 'left': 'start' };
                    return cssToSvgMapping[this.align];
                };

                if (point.isDate)
                    if (LogiXML.isNumeric(point.name))
                        point.value = new Date(parseInt(point.name));
                    else {
                        point.value = new Date(point.name);
                    }
                else {
                    var isFloat = LogiXML.isNumeric(point.name) && point.name % 1 !== 0;   
                    point.value = isFloat ? parseFloat(point.name) : point.name;    
                }
                
                point.name = LogiXML.Formatter.format(point.value, point.style.format);

                if (point.isGroup && point.style.events) {
                    point.events = point.style.events;
                    if (point.style.events.click && point.style.events.click.indexOf("SubmitForm")>-1) {
                        point.style.cursor = "pointer";
                    }
                } else {
                    point.events = options._events;
                }
                    
                for (var index = 0; point.children && index < point.children.length; index++) {
                    var child = point.children[index];
                    mappingFunction(child, nesting + 1);
                }
            };
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                mappingFunction(item, 0);
            }

            chart.cellsGroup = series.cellsGroup = chart.renderer.g().attr({ "class": "highcharts-series highcharts-tracker" }).add(chart.seriesGroup);
            //REPDEV-25316, the data will be sorted after calculateCells(data) is called, sort options.data accordingly. 
            var sortFunction = function (a, b) {
                return b.y - a.y;
            };
            options.data.sort(sortFunction)            
            this.calculateCells(data);
        },

        alignDataLabel: function (point) {
            var labelText = point.name,
                plotBox = this.chart.plotBox,
                context = { point: point },
                bbox = point.Rect;
            var oneLiner = LogiXML.layout.getTextDimensions("|", point.style);
            var pruneLabel = function (text, boundaries) {
                if (text === "")
                    return "";
                
                var dimensions = LogiXML.layout.getTextDimensions(text, point.style);
                if (dimensions.height > boundaries.Height) {
                    return "";
                }

                if (dimensions.width < boundaries.Width) {
                    return text.toString();
                }
                var index = 0,
                    substring = "",
                    ellipsis = "...";
                
                var split = text.split("<br/>");
                var lastSubstring = split[split.length - 1];
                while (LogiXML.layout.getTextDimensions(substring, point.style).width < boundaries.Width) {
                    substring = lastSubstring.substring(0, index++);
                }
                
                var lblText = lastSubstring.substring(0, index - 2).trim();
            
                var textLeftover = lastSubstring.substring(lblText.length).trim();
                split.pop();
                split.push(lblText);
                split.push(textLeftover);
                var concatenation = split.join("<br/>");
                var pruned = pruneLabel(concatenation, boundaries);
                if (pruned === "") {
                    split.pop();
                    if (split.length === 1 && split[0].length > 4)
                        return split[0].substring(0, split[0].length - 3) + ellipsis;
                    
                    return split.join("<br/>");
                }
                return pruned;
            };

            var extraPadding = 2;
            var padding = point.style.cellBorderThickness / 2 + extraPadding;
            var heightIfChildren = bbox.Height;
            if (point.children && point.children.length) {
                heightIfChildren = Math.min(point.children[0].Rect.Y - point.Rect.Y, heightIfChildren);
            }

            if (labelText != undefined && labelText.toString().length)
                labelText = pruneLabel(labelText.toString(), { Width: bbox.Width - padding, Height: heightIfChildren });
            else
                labelText = "";
            
            var linesNumber = labelText.split("<br/>").length || 1;
            var textDimensions = LogiXML.layout.getTextDimensions(labelText, point.style);
           
            var yOffset = bbox.Y  - plotBox.y;
            switch (point.label.verticalAlign) {
            case "bottom":
                yOffset += bbox.Height;
                break;
                case "middle":
                yOffset += (bbox.Height + textDimensions.height) / 2;
                break;
            default:
                yOffset += textDimensions.height;
                break;
            }

            yOffset -= padding + (linesNumber - 1) * oneLiner.height;

            var xOffset = bbox.X - plotBox.x;
            if (textDimensions.width + 6 <= bbox.Width)
                xOffset += extraPadding;
            
            switch (point.label.align) {
                case "right":
                    xOffset += bbox.Width -  padding;
                    break;
                case "center":
                    xOffset += (bbox.Width) / 2;
                    break;
                default:
                    xOffset += padding;
            }
            return { x: xOffset, y: yOffset, text: labelText };
        },
        /**
         * Draw a single point (wedge)
         * @param {Object} point The point object
         * @param {Object} color The color of the point
         * @param {Number} brightness The brightness relative to the color
         */
       
        drawLabel: function (labelText, point) {
            var style = point.style,
                series = this,
                chart = this.chart,
                renderer = chart.renderer;
            var css = {
                color: point.label.color(point),
                fontSize: style.fontSize,
                "font-weight": style.fontWeight,
                "font-family": style.fontFamily,
                cursor: style.cursor
        };
            var position = series.alignDataLabel(point);
            if (point.dataLabel && !chart.options.isExportRender) {
                var element = point.dataLabel.element;
                series.dataLabelsGroup.safeRemoveChild(element);
                point.dataLabel = null;
            } 
            
            var dataLabel = point.dataLabel = renderer.text(position.text, position.x, position.y)
                .attr({ 'text-anchor': point.label.getTextAnchor() })
                .css(css)
                .add(series.dataLabelsGroup);

            point.dataLabel.element.point = point;
            return dataLabel;
        },
        
        drawPoints: function () {

            var series = this,
                options = series.options,
                chart = series.chart,
                renderer = chart.renderer;

            var drawPoint = function(point) {
                var pointStyle = point.style,
                 pointAttr = {
                    fill: point.getColor(),
                    stroke: pointStyle.cellBorderColor,
                    'stroke-width': pointStyle.cellBorderThickness,
                    cursor: point.style.cursor
                };

                if (!point.pointAttr)
                    point.pointAttr = {};
                
                point.pointAttr[NORMAL_STATE] = pointAttr;
                var color = Highcharts.Color(point.getColor())
								.brighten(options.states.hover.brightness)
								.get();
                
                point.pointAttr[HOVER_STATE] = merge(pointAttr, { fill: color });

                var height = Math.round(point.Rect.Y + point.Rect.Height) - Math.round(point.Rect.Y),
                width = Math.round(point.Rect.X + point.Rect.Width) - Math.round(point.Rect.X),
                x = Math.round(point.Rect.X),
                y = Math.round(point.Rect.Y);

                if (point.graphic && !chart.options.isExportRender) {
                    var el = point.graphic.element;
                    if (document.documentMode <= 8) {
                        el.parentElement.removeChild(el);
                        delete point.graphic;
                    } else {
                        el.setAttribute('width', width);
                        el.setAttribute('height', height);
                        el.setAttribute('x', x);
                        el.setAttribute('y', y);
                        point.graphic.show();
                    }
                    
                } else {
                    point.rect = point.graphic = renderer.rect(x, y, width, height, 0).
                        attr(pointAttr).add(chart.cellsGroup);
                }
                if (point.selected) {
                    point.setState('select');
                }
                if (point.events) {
                    point.graphic.element.onclick = new Function('e', point.events.click);
                    if (point.dataLabel && point.dataLabel.element) {
                        point.dataLabel.element.onclick = new Function('e', point.events.click);
                    }
                }
                point.rect.element.point = point;
                if(point.children)
                    each(point.children, drawPoint);
            };
            each(series.data, drawPoint);
        },

        sortByAngle: noop,
        // -------
        drawTracker: Highcharts.TrackerMixin.drawTrackerPoint,
        evaluateCellsColors: function (cells, spectrPosLeft, spectrPosCenter, spectrPosRight) {
            var series = this,
                options = series.options;

            var highValueColor = options.highValueColor || series.gradientColors[0];
            var lowValueColor = options.lowValueColor || series.gradientColors[1];
            var mediumValueColor = options.mediumValueColor || Color.getPercentOfSpreadColor3(0.25, 0, 1, lowValueColor, highValueColor, highValueColor);
            var getColorByPositionOnSpectrum = function(colorLeft, colorRight, position) {
                var red = Color.R(colorLeft) + (Color.R(colorRight) - Color.R(colorLeft)) * position;
                var green = Color.G(colorLeft) + (Color.G(colorRight) - Color.G(colorLeft)) * position;
                var blue = Color.B(colorLeft) + (Color.B(colorRight) - Color.B(colorLeft)) * position;
                return 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + Math.floor(blue) + ')';
            };

            if (isNaN(spectrPosLeft))
                spectrPosLeft = 0;
            if (isNaN(spectrPosCenter))
                spectrPosCenter = 0.5;
            if (isNaN(spectrPosRight))
                spectrPosRight = 1;

            if (cells.length == 0)
                return;
            var childCells = cells.flattern(function(cell) { return cell.children; });
            var sizes = [];
            for (var index = 0; index < childCells.length; index++) {
                var cell = childCells[index];
                sizes.push(cell.colorValue);
            }
          
            var cellColorMinValue = Math.min.apply(null, sizes);
            var cellColorMaxValue = Math.max.apply(null, sizes);

            var cellColorSizingValue = cellColorMinValue < 0 ? cellColorMinValue * (-1) + 1 : 0;
            var cellColorSumValue = 0,
                cellColorCount = 0;
            
            if (cellColorSizingValue > 0) {
                cellColorSumValue += cellColorCount * cellColorSizingValue;
                cellColorMinValue += cellColorSizingValue;
                cellColorMaxValue += cellColorSizingValue;
            }

            //to fix negative numbers sizing

            var minMaxRange = cellColorMaxValue - cellColorMinValue;
            for (var i = 0; i < childCells.length; i++) {
                var hmCell = childCells[i];
                hmCell.ColorValue = hmCell.colorValue;
                if (hmCell.IsGroup) {
                    continue;
                }
                if (minMaxRange === 0) {
                    hmCell.Color = lowValueColor;
                } else {
                    var scaledColorValue = ((hmCell.ColorValue + cellColorSizingValue) - cellColorMinValue) / minMaxRange;
                    if (scaledColorValue >= 0.0 && scaledColorValue <= spectrPosLeft) {
                        hmCell.Color = lowValueColor;
                    } else if (scaledColorValue > spectrPosLeft && scaledColorValue <= spectrPosCenter) {
                        tmpVal = (((hmCell.ColorValue + cellColorSizingValue) - cellColorMinValue) - minMaxRange * spectrPosLeft) / (minMaxRange * spectrPosCenter - minMaxRange * spectrPosLeft);
                        hmCell.Color = getColorByPositionOnSpectrum(lowValueColor, mediumValueColor, tmpVal);
                    } else if (scaledColorValue > spectrPosCenter && scaledColorValue < spectrPosRight) {
                        var tmpVal = ((hmCell.ColorValue + cellColorSizingValue) - cellColorMinValue - minMaxRange * (spectrPosCenter - spectrPosLeft)) /
                            (minMaxRange * (spectrPosRight + spectrPosLeft) - minMaxRange * (spectrPosCenter + spectrPosLeft));
                        hmCell.Color = getColorByPositionOnSpectrum(mediumValueColor, highValueColor, tmpVal);
                    } else if (scaledColorValue >= spectrPosRight && scaledColorValue <= 1.0) {
                        hmCell.Color = highValueColor;
                    } else
                        throw "Color scaled value out of range";
                }
                hmCell.fill = hmCell.Color;
            }
        }
    });


}(Highcharts));