YUI.add('chartCanvasRangeSelection', function (Y) {
    //"use strict";
    var Lang = Y.Lang,
        TRIGGER = 'rdChartCanvasRangeSelection',
        MIN_HEIGHT = 5,
        MIN_WIDTH = 5;

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').ChartCanvasRangeSelection = Y.Base.create('ChartCanvasRangeSelection', Y.Base, [], {

        _handlers: {},
        configNode: null,
        constrainDiv: null,
        maskDiv: null,
        maskDraggable: null,
        maskResizer: null,
        callback: null,
        maskType: null,
        fillColor: null,
        isReadOnly: false,

        initializer: function (config) {
            this.configNode = config.configNode;
            this.callback = config.callback;
            this.maskType = config.maskType;
            this.fillColor = config.fillColor;
            this.isReadOnly = config.isReadOnly;
            this.configNode.setData(TRIGGER, this);
            this.createConstrainDiv(config.constrainRect);
            this.createMaskDiv(config.maskRect);
            //remove handlers
            this.configNode.all('.yui3-resize-handle-inner').each(function (node) {
                node.setAttribute('class', '');
            });
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
            if (this.maskResizer) {
                this.maskResizer.destroy();
            };
            if (this.constrainDiv) {
                this.constrainDiv.remove();
            }
            if (this.maskDiv) {
                this.maskDiv.remove();
            }
            this.configNode.setData(TRIGGER, null);
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

        createConstrainDiv: function (rect) {
            if (!rect) {
                return;
            }

            this.constrainDiv = Y.Node.create('<div style="visibility: hidden;position:absolute;"></div>');
            this.constrainDiv.setStyles({
                top: rect.y + 'px',
                left: rect.x + 'px',
                height: rect.height + 'px',
                width: rect.width + 'px'
            });
            this.configNode.insert(this.constrainDiv, 0);
        },

        createMaskDiv: function (rect) {
            if (!rect) {
                return;
            }

            this.maskDiv = Y.Node.create('<div style="position:absolute;"></div>');
            var colorWithOpacity = Y.LogiXML.Color.hexWithOpacity(this.fillColor),
                fillColor = colorWithOpacity[0],
                opacity = colorWithOpacity[1];
            this.maskDiv.setStyles({
                top: rect.y + 'px',
                left: rect.x + 'px',
                height: rect.height + 'px',
                width: rect.width + 'px',
                backgroundColor: fillColor,
                opacity: opacity
            });

            if (this.isReadOnly !== true) {
                this.maskDiv.setStyle('cursor', 'move');
            }

            this.configNode.appendChild(this.maskDiv);
            if (this.isReadOnly !== true) {
                this.createMaskDraggable();
                this.createResizer();
            }
        },

        createMaskDraggable: function () {
            this.maskDraggable = new Y.DD.Drag({ node: this.maskDiv });

            if (this.constrainDiv) {
                this.maskDraggable.plug(Y.Plugin.DDConstrained, {
                    constrain2node: this.constrainDiv
                });
            }
            this._handlers.dragEnd = this.maskDraggable.on('drag:end', this.maskChanged, this);
        },

        createResizer: function () {
            var self = this,
                cfg = {
                    node: this.maskDiv,
                    handles: this.maskType == 'x' ? 'l,r' : this.maskType == 'y' ? 't,b' : 'all'
                };
            

            this.maskResizer = new Y.LogiXML.ChartFX.Resize(cfg);
            if (this.constrainDiv) {
                this.maskResizer.plug(Y.Plugin.ResizeConstrained, {
                    constrain: this.constrainDiv
                });
            }
            this._handlers.resized = this.maskResizer.on('resize:end', this.maskChanged, this);
        },

        maskChanged: function (e) {
            var rect = {
                x: this.maskDiv.get('offsetLeft'),
                y: this.maskDiv.get('offsetTop'),
                height: this.maskDiv.get('offsetHeight'),
                width: this.maskDiv.get('offsetWidth')
            }
            if (this.callback) {
                this.callback(rect);
            }
        }

    }, {


    });

}, '1.0.0', { requires: ['base', 'dom-base', 'node-base', 'resize-base', 'event', 'color-utils', 'node-event-simulate', 'event-synthetic', 'node-custom-destroy', 'dd-drag', 'dd-constrain', 'dd-delegate', 'drawable-overlay', 'drawable-overlay-resize', 'drawable-overlay-size-constrain', 'chartfx-resize'] });