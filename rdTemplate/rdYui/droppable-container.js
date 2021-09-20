YUI.add('droppableContainer', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdDroppableContainer';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.DroppableContainer.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').DroppableContainer = Y.Base.create('DroppableContainer', Y.Base, [], {
        _handlers: {},
        dropObject: null,

        configNode: null,
        id: null,
        groups: null,
        noGhost: false,
        targetId: null,
        dataIgnore: false,


        initializer: function (config) {
            var self = this;
            this._parseHTMLConfig();
            if (this.dataIgnore)
                return;
            this.configNode.setData(TRIGGER, this);
            this.attachDrop();
            this.checkPlaceholder();
        },

        attachDrop: function () {
            var self = this, dropPrms = {};
            dropPrms.node = this.configNode;
            if (this.groups) {
                dropPrms.groups = this.groups;
            }

            this.dropObject = new Y.DD.Drop(dropPrms);
            //it is buggy, we will call onDropHit from draggable element
            //this._handlers.onDropHit = this.dropObject.on('drop:hit', this.onDropHit, this);
            this._handlers.onDropEnter = this.dropObject.on('drop:enter', this.onDropEnter, this);
            this._handlers.onDropExit = this.dropObject.on('drop:exit', this.onDropExit, this);
            //this._handlers.onDropOver = this._handlers.drop.on('drop:over', this.onDropOver, this);
        },

        onDropHit: function (e) {
            var dragNode = e.drag.get('node');

            var obj = dragNode.getData("rdDraggableElement");
            if (!obj)
                return;

            var act = obj.action;
            var node = null;
            var guid = this.getGuid();
            var prevSibling = this.removeGhost();

            var editorId;
            if (!obj.proxyHideOnStart) {
                editorId = "EditorFor_" + guid;
            }
            else {
                var editorNode = this.configNode.ancestor('.rd-element-editor');
                if (!editorNode) {
                    editorId = this.id;
                } else {
                    editorId = editorNode.getAttribute('id');
                }
            }

            if (!obj.preventCloneNode) {
                if (obj.proxyHideOnStart != true) {
                    if (obj.dropStubId && obj.dropStubId != "") {
                        var dropStub = Y.one('#' + obj.dropStubId);
                        node = dropStub.cloneNode(true);
                        node.show();
                        node.setStyle('height', dragNode.getAttribute('offsetHeight'));
                    } else {
                        node = dragNode.cloneNode(true);
                    }
                    node.setAttribute("id", editorId);
                } else {
                    node = dragNode;
                }
                if (prevSibling) {
                    prevSibling.insert(node, 'before');
                } else {
                    this.configNode.appendChild(node);
                }
            }

            if (act) {
                act = act.replace(/rdDropContainerID/g, this.id);
                act = act.replace(/rdElementID/g, guid);
                act = act.replace(/rdNewParentID/g, this.id);
                act = act.replace(/rdTargetID/g, this.targetId);
                act = act.replace(/rdSiblingID/g, prevSibling ? prevSibling.getAttribute('id') : '');
                act = act.replace(/rdReturnElementID/g, editorId);
                eval(act);
            }
            if (node) {
                node.removeClass('yui3-dd-dragging');
            }
            this.checkPlaceholder();

            //resize
            if (node && obj.proxyHideOnStart) {
                var charts = node.all('.rdChartCanvas'), i = 0, length = charts.size(),
                    chartNode, chartInstance, parentWidth;
                for (; i < length; i++) {
                    chartNode = charts.item(i);
                    chartNode.hide();

                    var container = chartNode.ancestor('.rdDroppableContainer');
                    var draggedProxy = Y.one(".rdDragProxy");
                    var chartWidth = null;

                    if (draggedProxy) {
                        var oldContainerWidth = draggedProxy.get("offsetWidth");
                        draggedProxy = draggedProxy.one(".rdVisEditRight");
                        if (draggedProxy) {
                            chartWidth = draggedProxy.get("clientWidth");
                            if (chartWidth <= 0) {
                                chartWidth = null;
                            } else {
                                var newContainerWidth = container.get("clientWidth");
                                var widthDiff = newContainerWidth - oldContainerWidth;
                                chartWidth += widthDiff;
                            }
                        }
                    }

                    if (chartWidth === null)
                        chartWidth = container.get("clientWidth");

                    chartWidth -= 4; // Padding

                    chartNode.show();

                    charts.item(i).getData('rdChartCanvas').resized({ width: chartWidth, height: null, finished: false });
                }
                /*
                var visualizations = node.all('.logi-visualization-container'), z = 0, zlength = visualizations.size(),
                    visualizationNode, visualizationInstance, visualizationParentWidth;
                for (; z < zlength; z++) {
                    visualizationNode = visualizations.item(z);
                    visualizationNode.hide();
                    parentWidth = visualizationNode.ancestor('.rdDroppableContainer').get('offsetWidth');
                    visualizationNode.show();
                    if (!Logi || !Logi.Platform || !Logi.Platform.select) {
                        return;
                    }
                    var visualizationObject = Logi.Platform.select('#' + visualizationNode.getAttribute('id'));
                    if (!visualizationObject) {
                        return;
                    }
                    visualizationObject.setWidth(parentWidth - 16);
                }
                */
            }
            this.dropObject.sizeShim();

            // bubble to dragged element and dropped ancestors that want this event
            dragNode.fire(e.type);

            if (e.drop) {
                var anc = e.drop.get("node");
                if (anc) {
                    anc = anc.ancestor(".rdCaptureDropEvent");
                    while (anc) {
                        anc.fire(e.type);
                        anc = anc.ancestor(".rdCaptureDropEvent");
                    }
                }
            }
        },

        onDropEnter: function (e) {
            
        },

        onDropExit: function (e) {

        },

        onDropOver: function (e) {
            
        },

        checkPlaceholder: function () {
            this.fire("sizechanged", { value: 'from check placeholder' });
            var childNodes = this.configNode.get('children'),
                showPlaceholder = childNodes.size() == 1,
                placeholder = this.configNode.one("> .rdDropPlaceholder");
            if (placeholder == null) {
                return;
            }
            if (!showPlaceholder && childNodes.size() == 3 &&
                !this.configNode.one("> .rdDropGhost")
                //&& this.configNode.get('nodeName').toLowerCase() == 'td' 
                && this.configNode.one('> .yui3-dd-dragging')
                && this.configNode.one('> .rdDragProxy')) {
                    showPlaceholder = true;
            }
            placeholder.setStyle('display', showPlaceholder ? '' : 'none');
        },

        showGhost: function (dragNode, hoverNode) {
            if (this.noGhost) {
                return;
            }
            /*var ghost = dragNode.get('node').cloneNode(true);
            ghost.setStyle('display', '');
            ghost.addClass('rdDropGhost');*/
            var ghost = Y.Node.create('<div class="rdDropGhost">&nbsp;</div>');
            ghost.setAttribute("data-for", dragNode.get('node').getAttribute("id"));
            if (hoverNode) {
                hoverNode.insert(ghost, hoverNode.rdInsertBefore ? 'before' : 'after');
            } else {
                this.configNode.appendChild(ghost);
            }
            this.checkPlaceholder();
            return ghost;
        },

        moveGhost: function (dragNode, hoverNode) {
            if (this.noGhost) {
                return;
            }
            var ghost = this.configNode.one("> .rdDropGhost");
            if (!ghost) {
                ghost = this.showGhost(dragNode, hoverNode);
            }
            if (hoverNode) {
                if (hoverNode.rdInsertBefore) {
                    if (hoverNode.previous() == ghost) {
                        return;
                    }
                    hoverNode.insert(ghost, 'before');
                } else {
                    if (hoverNode.next() == ghost) {
                        return;
                    }
                    hoverNode.insert(ghost, 'after');
                }
            }
        },

        removeGhost: function () {
            var ghost = this.configNode.one("> .rdDropGhost"),
                sibling = null;
            if (ghost) {
                sibling = ghost.next();
                ghost.remove();
            }
            this.checkPlaceholder();
            return sibling;
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            var group = this.configNode.getAttribute('data-group');
            if (group) {
                this.groups = group.split(",");
            }
            this.noGhost = this.configNode.getAttribute("data-no-ghost") == "True";
            this.dataIgnore = this.configNode.getAttribute("data-ignore") == "True";
            this.targetId = this.configNode.getAttribute("data-target-id");
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
            this.dropObject.destroy();
            this.dropObject = null;
            configNode.setData(TRIGGER, null);
        },

        _clearHandlers: function () {
            var self = this;
            Y.each(this._handlers, function (item) {
                if (item) {
                    if (item.detach) {
                        item.detach();
                    }
                    item = null;
                }
            });
        },

        getGuid: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        }


    }, {
        // Static Methods and properties
        NAME: 'DroppableContainer',
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
                    element = new Y.LogiXML.DroppableContainer({
                        configNode: node
                    });
                }
            });
            //Y.LogiXML.ResponsiveColumnResizer.createElements();
        },

        sizeAllShims: function () {
            var element;
            Y.all('.' + TRIGGER).each(function (node) {
                element = node.getData(TRIGGER);
                if (element) {
                    element.dropObject.sizeShim();
                }
            });
        }


    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'stylesheet', 'event-custom', 'dd-drag', 'dd-drop', 'dd-proxy', 'dd-constrain', 'dd-scroll', 'responsiveColumnResizer'] });

