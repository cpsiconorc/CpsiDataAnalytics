YUI.add('responsiveColumnResizer', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdResponsiveColumnResizer';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.ResponsiveColumnResizer.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').ResponsiveColumnResizer = Y.Base.create('ResponsiveColumnResizer', Y.Base, [], {
        _handlers: {},

        configNode: null,
        id: null,
        resizerClass: null,
        resizerHandlerClass: null,
        endResizeAction: null,
        columns: [],
        spanSize: 0,

        initializer: function (config) {
            var self = this;
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);
            this._handlers.windowResize = Y.on('windowresize', function () {
                self.calculate();
            });
            this.subscribeToDroppableEvents();
            this.calculate();
        },

        subscribeToDroppableEvents: function () {
            /*var columns = this.configNode.get('children'),
                droppable;
            columns.each(function (column) {
                droppable = column.getData('rdDroppableContainer');
                if (droppable) {
                    //this._handlers[column.getAttribute('id') + '_' + 'dropenter'] = droppable.dropObject.on('drop:enter', this.calculate, this);
                    //this._handlers[column.getAttribute('id') + '_' + 'dropexit'] = droppable.dropObject.on('drop:exit', this.calculate, this);
                    //this._handlers[column.getAttribute('id') + '_' + 'sizechanged'] = droppable.on('sizechanged', this.calculate, this);
                    console.log('subscribe');
                };
                
            }, this);
            */
        },

        calculate: function () {
            var columns = this.configNode.get('children'),
                cnt = columns.size(), spanSize = 0, resizeContainers = [],
                columnProp = {};
            this.clearResizers();
            this.columns = [];
            //get all columns, calculate size etc
            this.spanSize = 0;
            columns.each(function (column) {
                columnProp = {};
                columnProp.column = column;
                columnProp.offsetWidth = column.get('offsetWidth');
                columnProp.offsetHeight = column.get('offsetHeight');
                columnProp.actualSpan = this.getColspanByWidth(column);
                this.spanSize = this.spanSize == 0 ? Math.round(columnProp.offsetWidth / columnProp.actualSpan) : Math.round((this.spanSize + columnProp.offsetWidth / columnProp.actualSpan) / 2);
                columnProp.xy = column.getXY();
                this.columns.push(columnProp);
            }, this);
            this.createResizers();
        },

        createResizers: function () {
            var i = 0, cnt = this.columns.length, columnProp, resizeDiv,id, siblingColumnProp, maxColspan;
            for (; i < cnt - 1; i++) {
                columnProp = this.columns[i];
                //calcualte max span
                maxColspan = columnProp.actualSpan;
                siblingColumnProp = this.columns[i + 1];
                if (siblingColumnProp.actualSpan > 1) {
                    maxColspan += siblingColumnProp.actualSpan - 1;
                } else {
                    if (columnProp.actualSpan == 1) {
                        //no space for resizer
                        continue;
                    }
                }
                columnProp.resizeOuterWrapper = Y.Node.create("<div class='column-resizer-outer-wrapper'></div>");
                columnProp.column.prepend(columnProp.resizeOuterWrapper);
                columnProp.resizeInnerWrapper = Y.Node.create("<div class='column-resizer-inner-wrapper'></div>");
                columnProp.resizeOuterWrapper.prepend(columnProp.resizeInnerWrapper);
                columnProp.resize = new Y.Resize({
                    //Selector of the node to resize
                    node: columnProp.resizeInnerWrapper,
                    wrap: false,
                    handles: 'r'
                });
                columnProp.resizeConstrained = columnProp.resize.plug(Y.Plugin.ResizeConstrained, {
                    tickX: this.spanSize,
                    minWidth: this.spanSize,
                    maxWidth: maxColspan * this.spanSize
                });
                //columnProp.resizeProxy = columnProp.resize.plug(Y.Plugin.ResizeProxy, { renderInside: true });
                //events
                columnProp._handlers = {};
                id = columnProp.column.getAttribute('id');
                columnProp._handlers.resizeEnd = columnProp.resize.on('resize:end', function (e) {
                    this.columnResized(e);
                }, this);
            }
        },

        columnResized: function (e, oldColspan) {
            var colspan = this.getColspanByPixelSize(this.spanSize, e.info.offsetWidth),
                column = e.target.get('node').get('parentNode').get('parentNode'),
                self = this,
                originalInfo = e.target.originalInfo,
                info = e.target.info;
            e.preventDefault();
            if (originalInfo && originalInfo.offsetWidth && info && info.offsetWidth) {
                if (originalInfo.offsetWidth == info.offsetWidth) {
                    return;
                }
            }
            this.resizeColumn(colspan, column);
            setTimeout(function () { self.calculate(); }, 100);
        },

        resizeColumn: function (newColspan, column) {
            var siblingColumn = column.next(),
                originalColspan, siblingOriginalColspan,
                newSiblingColspan,
                newColumnWidth, newSiblingWidth, colspanDiff, parentTable,
                raNode, raObject;
            originalColspan = this.getColspanByWidth(column);
            siblingOriginalColspan = this.getColspanByWidth(siblingColumn);
            colspanDiff = originalColspan - newColspan;
            newSiblingColspan = siblingOriginalColspan + colspanDiff;
            newColumnWidth = this.getWidthByColspan(newColspan);
            newSiblingWidth = this.getWidthByColspan(newSiblingColspan);
            column.setStyle('width', newColumnWidth);
            siblingColumn.setStyle('width', newSiblingWidth);

            this.resizeColumnContent (column, newColspan);
            this.resizeColumnContent (siblingColumn, newSiblingColspan);

            raNode = Y.one('.rdReportAuthor');
            if (raNode) {
                raObject = raNode.getData('rdReportAuthor');
                raObject.sendColumnResizeUpdate(this.id.replace('editorHeaderRow_', ''), column.get('id').replace('header_', ''), siblingColumn.get('id').replace('header_', ''),
                    newColspan, newSiblingColspan);
            }
        },

        resizeColumnContent: function (column, colspan) {
            var  columnId, nestedColumns, nestedColumn,
                paddingConstant = 14;
            columnId = column.get('id').replace('header_', '');

            var columnSelector = "#" + LogiXML.escapeSelector(columnId);

            Y.LogiXML.ChartCanvas.resizeToWidth(column.get('offsetWidth') - paddingConstant, columnSelector + ' > .rd-editor-visualization');

            nestedColumns = Y.one(columnSelector).all('.column-with-droppable');
            Y.each(nestedColumns, function (nestedColumn) {
                Y.LogiXML.ChartCanvas.resizeToWidth(nestedColumn.get('offsetWidth') - paddingConstant, '#' + LogiXML.escapeSelector(nestedColumn.getAttribute('id')) + ' > .rd-editor-visualization');
            });
        },

        getColspanByPixelSize: function (spanValue, value) {
            var i = 0, length = 100,
                left = value, right = value;
            if (value % spanValue != 0) {
                for (; i < length; i++) {
                    left -= 1;
                    right += 1;
                    if (left % spanValue == 0) {
                        return left / spanValue;
                    } else if (right % spanValue == 0) {
                        return right / spanValue;
                    }
                }
            }
            return value / spanValue;
        },

        clearResizers: function () {
            var i = 0, length = this.columns.length, columnProp;
            for (; i < length; i++) {
                columnProp = this.columns[i];
                if (columnProp.resizeProxy) {
                    columnProp.resizeProxy.destroy();
                    columnProp.resizeProxy = null;
                }
                if (columnProp.resizeConstrained) {
                    columnProp.resizeConstrained.destroy();
                    columnProp.resizeConstrained = null;
                }
                if (columnProp.resize) {
                    columnProp.resize.destroy();
                    columnProp.resize = null;
                }
                if (columnProp.resizeOuterWrapper) {
                    columnProp.resizeOuterWrapper.remove();
                    columnProp.resizeOuterWrapper = null;
                }
            }
        },

        getColspanByWidth: function (node) {
            var width = node.getStyle('width'),
                colspan;
            width = width == null ? "0" : width.replace("%", "");
            switch (width) {
                case "8.33":
                    return 1;
                case "16.66":
                    return 2;
                case "25":
                    return 3;
                case "33.33":
                    return 4;
                case "41.66":
                    return 5;
                case "50":
                    return 6;
                case "58.33":
                    return 7;
                case "66.66":
                    return 8;
                case "75":
                    return 9;
                case "83.33":
                    return 10;
                case "91.66":
                    return 11;
                case "100":
                    return 12;
            }
            return null;
        },

        getWidthByColspan: function (colspan) {
            switch (colspan) {
                case 1:
                    return "8.33%";
                case 2:
                    return "16.66%";
                case 3:
                    return "25%";
                case 4:
                    return "33.33%";
                case 5:
                    return "41.66%";
                case 6:
                    return "50%";
                case 7:
                    return "58.33%";
                case 8:
                    return "66.66%";
                case 9:
                    return "75%";
                case 10:
                    return "83.33%";
                case 11:
                    return "91.66%";
                case 12:
                    return "100%";
            }
            return null;
        },

        extractColSpan: function (node, cssPrefix) {
            cssPrefix = cssPrefix == null ? "col-sm-" : rdResponsiveColumnResizer;
            var classPrefix = 'col-sm-',
                i = 1, length = 12;
            for (; i <= length; i++) {
                if (node.hasClass(classPrefix + i)) {
                    return i;
                }
            }
            return -1;
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();

            configNode.setData(TRIGGER, null);
        },

        _clearHandlers: function () {
            var self = this;
            Y.each(this._handlers, function (item) {
                if (item) {
                    item.detach();
                    item = null;
                }
            });
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            this.resizerClass = this.configNode.getAttribute('data-resizer-class');
            this.resizerHandlerClass = this.configNode.getAttribute('data-resizer-handler-class');
            this.endResizeAction = this.configNode.getAttribute('data-resizer-endresize');
        }

    }, {
        // Static Methods and properties
        NAME: 'ResponsiveColumnResizer',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },

        createElements: function () {

            var responsiveRow;

            Y.all('.' + TRIGGER).each(function (node) {
                responsiveRow = node.getData(TRIGGER);
                if (!responsiveRow) {
                    responsiveRow = new Y.LogiXML.ResponsiveColumnResizer({
                        configNode: node
                    });
                }

            });
        }


    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'resize', 'resize-plugin', 'resize-constrain', 'stylesheet', 'event-custom', 'chartCanvas'] });
