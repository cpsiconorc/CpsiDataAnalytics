YUI.add('rdLogiVisualization', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdLogiVisualization';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.rdLogiVisualization.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER); 

    Y.namespace('LogiXML').rdLogiVisualization = Y.Base.create('rdLogiVisualization', Y.Base, [], {

        id: null,
        configNode: null,

        initializer: function (config) {
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
        },

        destructor: function () {
            var configNode = this.configNode;
            var div = $('#' + this.id + ' div');
            if (div) {
                var divScope = div.children().scope();
                if (divScope) {
                    divScope.$destroy();
                }
            }
            configNode.setData(TRIGGER, null);
        }

    }, {
        // Static Methods and properties
        NAME: 'rdLogiVisualization',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },

        createElements: function (isAjax) {
            var element;
            Y.all('.' + TRIGGER).each(function (node) {
                element = node.getData(TRIGGER);
                if (!element) {
                    element = new Y.LogiXML.rdLogiVisualization({
                        configNode: node
                    });
                    if (isAjax) {
                        Y.LogiXML.rdLogiVisualization.createVisualization(node);
                    }
                }
            });
        },
        
        createVisualization: function (configNode) {

            var vizElement = configNode.one('logi-visualization,logi-crosstab-table');
            if (!vizElement) {
                return;
            }
            var parentNode = vizElement.get('parentNode');
            var vizDataView = vizElement.getAttribute('dataview');
            var vizDataViewObject = window[vizDataView];
            var vizConfig = vizElement.getAttribute('config');
            configNode.setAttribute('config', vizConfig);
            var vizConfigObject = window[vizConfig];
            vizConfigObject.dataview = vizDataViewObject;
            vizElement.remove();
            var ngpPlatform = window.Logi;
            if (vizConfigObject && vizConfigObject.id) {
                delete vizConfigObject.id;
            }
            if (ngpPlatform && ngpPlatform.Platform) {
                var createdViz = ngpPlatform.Platform.select('#' + parentNode.getAttribute('id')).append(vizConfigObject);
            }
        },

        visualizationRendered: function (visId) {
            var divContainer = Y.one('#' + visId);
            if (divContainer) {
                if (divContainer.hasClass('rdBrowserBorn')) {
                    divContainer.setAttribute("data-rdBrowserBornReady", "true");
                } else {
                    var wrapperNode = divContainer.ancestor('.rdBrowserBorn');
                    if (wrapperNode) {
                        wrapperNode.setAttribute("data-rdBrowserBornReady", "true");
                    }
                }
            }
        },

        resize: function (yuiObject, width, height, wUnit, hUnit) {
            if (wUnit != '%') {
                yuiObject.setStyle('width', (width - 25) + 'px');
            } else {
                yuiObject.setStyle('width', width + wUnit);
            }
            if (hUnit != '%') {
                yuiObject.setStyle('height', height + "px");
            }

            var ngpPlatform = window.Logi,
                ct, config, elementId;
            elementId = yuiObject.getAttribute('id');
            if (!elementId || elementId == '') {
                return;
            }
            if (ngpPlatform && ngpPlatform.Platform) {
                try {
                    ct = Logi.Platform.select('#' + yuiObject.getAttribute('id'));
                    if (ct && ct.config) {
                        config = ct.config();
                    }
                } catch (e) {
                    //nothing
                }
            }

            if (!config) {
                var visConfigVarName = yuiObject.get('parentNode').getAttribute('config');
                config = window[visConfigVarName];
            }

            if (!config) {
                var visConfigVarName = yuiObject.getAttribute('config');
                config = window[visConfigVarName];
            }
            
            if (config && config.style) {
                if (config.type === 'visualization') {
                    if (config.style.width == '100%' && config.style.height == '100%') {
                        return;
                    }
                    config.style.width = '100%';
                    config.style.height = '100%';
                } else { //crosstab
                    config.style.width = '100%';
                    config.style.height = height + "px";
                }
            }

            if (ct && ct.config) {
                ct.config(config);
            }
            if (window.$) {
                window.$(window).trigger('resize');
            }
        }
    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'event-custom'] });

