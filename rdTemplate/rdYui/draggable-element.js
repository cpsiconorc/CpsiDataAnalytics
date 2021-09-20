YUI.add('draggableElement', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdDraggableElement';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.DraggableElement.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').DraggableElement = Y.Base.create('DraggableElement', Y.Base, [], {
        handlers: null,
        configNode: null,
        id: null,
        handlerId: null,
        proxyMode: null,
        proxyId: null,
        groups: null,
        proxyMoveOnEnd: null,
        proxyHideOnEnd: null,
        proxyHideOnStart: null,
        dropStack: [],
        goingUp: null,
        lastY: 0,
        action: null,
        preventCloneNode: null,
        dataIgnore: false,
        dropStubId: null,

        initializer: function (config) {
            var self = this;
            this.handlers = {},
            this._parseHTMLConfig();
            if (this.dataIgnore)
                return;
            this.configNode.setData(TRIGGER, this);
            this.attachDrag();
        },

        attachDrag: function () {
            var dragPrms = {}, proxyPrms = {};
            dragPrms.node = this.configNode;
            if (this.groups) {
                dragPrms.groups = this.groups;
            }
            if (this.proxyMode == "element") {
                dragPrms.dragNode = Y.one('#' + LogiXML.escapeSelector(this.proxyId));
            }

            if (this.handlerId && this.handlerId.length > 0) {
                dragPrms.handles = this.configNode.all('#' + LogiXML.escapeSelector(this.handlerId));
            }

            this.handlers.drag = new Y.DD.Drag(dragPrms);
            //always, only vertical autoscroll
            this.handlers.drag.plug(Y.Plugin.DDWinScroll,{'horizontal':false});

            if (this.proxyMode != "none") {
                if (this.proxyMode == "cloneNode") {
                    proxyPrms.cloneNode = true;
                }
                if (this.proxyMoveOnEnd != null) {
                    proxyPrms.moveOnEnd = this.proxyMoveOnEnd;
                }
                if (this.proxyHideOnEnd != null) {
                    proxyPrms.hideOnEnd = this.proxyHideOnEnd;
                }
                this.handlers.drag.plug(Y.Plugin.DDProxy, proxyPrms);
            }

            this.handlers.onDragExit = this.handlers.drag.on('drag:exit', this.onDragExit, this);
            this.handlers.onDragOver = this.handlers.drag.on('drag:over', this.onDragOver, this);
            this.handlers.onDragEnter = this.handlers.drag.on('drag:enter', this.onDragEnter, this);
            this.handlers.onDragStart = this.handlers.drag.on('drag:start', this.onDragStart, this);
            this.handlers.onDragEnd = this.handlers.drag.on('drag:end', this.onDragEnd, this);
            this.handlers.onDrag = this.handlers.drag.on('drag:drag', this.onDrag, this);
            this.handlers.onDropMiss = this.handlers.drag.on('drag:dropmiss', this.onDropMiss, this);
            this.handlers.onDropHit = this.handlers.drag.on('drag:drophit', this.onDropHit, this);
        },

        onDropHit: function (e) {
            e.drop.get('node').getData('rdDroppableContainer').onDropHit(e);
        },

        onDragStart: function (e) {
            this.dropStack = [];
            if (this.proxyHideOnStart) {
                this.configNode.hide();
            }
            e.target.get('dragNode').addClass('rdDragProxy');
        },

        onDragEnd: function (e) {
            if (this.proxyHideOnStart) {
                this.configNode.setStyle('top', '');
                this.configNode.setStyle('left', '');
                this.configNode.setStyle('position', '');
                this.configNode.show();
            }
            e.target.get('dragNode').removeClass('rdDragProxy');
            if (this.dropStack.length > 1) {
                Y.one('#' + LogiXML.escapeSelector(this.dropStack[this.dropStack.length - 1])).getData('rdDroppableContainer').checkPlaceholder();
            }
            this.dropStack = [];
        },

        onDropMiss: function (e) {
            var dragNode, parent;
            dragNode = e.target.get('dragNode');
            if (dragNode) {
                dragNode.removeClass('rdDragProxy');
                parent = dragNode.ancestor('.rdDroppableContainer');
                if (parent && parent.getData('rdDroppableContainer')) {
                    parent.getData('rdDroppableContainer').checkPlaceholder();
                }
            }
        },

        onDrag: function(e) {
            //Get the last y point
            var y = e.target.lastXY[1];
            //is it greater than the lastY var?
            if (y < this.lastY) {
                //We are going up
                this.goingUp = true;
            } else if (y > this.lastY) {
                //We are going down.
                this.goingUp = false;
            }
            //Cache for next check
            this.lastY = y;
        },

        onDragEnter: function (e) {
            var dropId = e.drop.get('node').get('id');
            this.checkSiblingsForExit(e);
            this.dropStack.push(dropId);
            if (this.dropStack.length > 1) {
                Y.one('#' + LogiXML.escapeSelector(this.dropStack[this.dropStack.length - 2])).getData('rdDroppableContainer').removeGhost();
            }
            var hoverNode = this.getHoverNode(e);
            Y.one('#' + LogiXML.escapeSelector(dropId)).getData('rdDroppableContainer').showGhost(e.drag, hoverNode);
            Y.LogiXML.DroppableContainer.sizeAllShims();
        },

        checkSiblingsForExit: function (e) {
            //the order of events (onDragEnter/onDragExit) is unpredictable
            //we have to do this
            var dropNode = e.drop.get('node'),
                dropId = dropNode.get('id'),
                parent = dropNode.get('parentNode'),
                parentName = parent.get('nodeName'),
                siblingDroppable = null;
            if (parentName = "TD") {
                parent = parent.get('parentNode'); //-> row
                parent.get('children').each(function (columnNode) {
                    siblingDroppable = columnNode.one('> yui3-dd-drop');
                    if (siblingDroppable && siblingDroppable.get('id') != dropId) {
                        this.forcedDragExit(siblingDroppable, e.drop, e.drag);
                    }
                }, this);
            }
        },

        onDragExit: function (e) {
            this.forcedDragExit(e.drop.get('node'), e.drop, e.drag);
        },

        forcedDragExit: function (dropNode, drop, drag) {
            var dropId = dropNode.get('id'),
                dropIndex = this.dropStack.indexOf(dropId);
            if (dropIndex != -1) {
                this.dropStack.splice(dropIndex, 1);
                dropNode.getData('rdDroppableContainer').removeGhost();
            }
            Y.LogiXML.DroppableContainer.sizeAllShims();
        },

        onDragOver: function (e) {
            var dropId = this.dropStack[this.dropStack.length - 1];
            
            if (e.drop.get('node').get('id') != dropId) {
                //it is ancestor fires, return
                return;
            }
            var hoverNode = this.getHoverNode(e);
            Y.one('#' + LogiXML.escapeSelector(dropId)).getData('rdDroppableContainer').moveGhost(e.drag, hoverNode);
        },

        getHoverNode: function(e, offset) {
            var dropId = this.dropStack[this.dropStack.length - 1];
            if (e.drop.get('node').get('id') != dropId) {
                //it is ancestor fires, return
                return;
            }
            var dropNode = Y.one('#' + LogiXML.escapeSelector(dropId)),
                dropObj = dropNode.getData('rdDroppableContainer'),
                dragXY = e.drag.mouseXY,
                hoverNode = null,
                dragNodeId = e.drag.get('dragNode').get('id');

            dropNode.get('children').each(function (childNode) {
                if (hoverNode != null) {
                    return;
                }
                if (childNode.get('id') == dragNodeId) {
                    return;
                }
                var bbox = {}, xy;
                xy = childNode.getXY();
                bbox.left = childNode.getX();
                bbox.top = childNode.getY();
                if (offset > 0) {
                    bbox.top -= offset;
                }
                bbox.right = bbox.left + childNode.get('offsetWidth');
                bbox.bottom = bbox.top + childNode.get('offsetHeight');
                if (offset > 0) {
                    bbox.bottom += offset;
                }
                if (dragXY[0] >= bbox.left && dragXY[0] <= bbox.right &&
                    dragXY[1] >= bbox.top && dragXY[1] <= bbox.bottom) {
                    hoverNode = childNode;
                    hoverNode.rdInsertBefore = dragXY[1] < (bbox.top + (bbox.bottom - bbox.top) / 2);
                }
            });

            if (!hoverNode && !offset) {
                //can be margin between siblings, let's expand our bbox to margin value
                return this.getHoverNode(e, 10);
            }
            return hoverNode;
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            this.handlerId = this.configNode.getAttribute('data-handler');
            this.proxyMode = this.configNode.getAttribute('data-proxy-mode');
            this.proxyId = this.configNode.getAttribute('data-proxy-id');
            var moveOriginalNodeOnEnd = this.configNode.getAttribute('data-proxy-move-on-end'),
                hideProxyOnEnd = this.configNode.getAttribute('data-proxy-hide-on-end'),
                hideNodeOnStart = this.configNode.getAttribute('data-proxy-hide-on-start');
            this.proxyMoveOnEnd = moveOriginalNodeOnEnd == "True" ? true : moveOriginalNodeOnEnd == "False" ? false : null;
            this.proxyHideOnEnd = hideProxyOnEnd == "True" ? true : hideProxyOnEnd == "False" ? false : null;
            this.proxyHideOnStart = hideNodeOnStart == "True" ? true : hideNodeOnStart == "False" ? false : null;
            var group = this.configNode.getAttribute('data-group');
            if (group) {
                this.groups = group.split(",");
            }
            this.action = this.configNode.getAttribute('data-action');
            this.preventCloneNode = this.configNode.getAttribute('data-prevent-clone') == "True";
            this.dataIgnore = this.configNode.getAttribute('data-ignore') == "True";
            this.dropStubId = this.configNode.getAttribute('data-drop-stub-id');
        },
        

        destructor: function () {
            var configNode = this.configNode;

            if (this.handlerId && this.handlerId.length > 0 && this.handlers.drag) {
                this.handlers.drag.removeHandle = this.configNode.one('#' + LogiXML.escapeSelector(this.handlerId));
            }

            this._clearHandlers();
            configNode.setData(TRIGGER, null);

            
        },

        _clearHandlers: function () {
            var self = this;
            Y.each(this.handlers, function (item) {
                if (item) {
                    if (item.detach) {
                        item.detach();
                    }
                    if (item.destroy) {
                        item.destroy();
                    }
                    item = null;
                }
            });
        }

    }, {
        // Static Methods and properties
        NAME: 'DraggableElement',
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
                    element = new Y.LogiXML.DraggableElement({
                        configNode: node
                    });
                }
            });
        }


    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'stylesheet', 'event-custom', 'dd-drag', 'dd-ddm', 'dd-proxy', 'dd-constrain', 'dd-scroll'] });
