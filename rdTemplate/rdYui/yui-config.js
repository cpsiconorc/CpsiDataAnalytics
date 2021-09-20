(function () {
    // Based on tests from Modernizer -- http://www.modernizr.com
    // At some point just switch over to Modernizer, for now this is lighter
    if (window.LogiXML === undefined) {
        window.LogiXML = {};
    }
    LogiXML.features = {};
    var tests = {},
		features = LogiXML.features,
		junk = 'junk',
		feature;

    tests['localstorage'] = function () {
        try {
            localStorage.setItem(junk, junk);
            localStorage.removeItem(junk);
            return true;
        } catch (e) {
            return false;
        }
    };

    tests['canvas'] = function () {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['touch'] = function () {
        // Modernizer Test in case this one has problems
        // return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        try {
            //document.createEvent('TouchEvent');   //Chrome returns true in latest versions.
            //return 'ontouchstart' in window;
            if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
                /* browser with either Touch Events of Pointer Events running on touch-capable device */
                return true;
            }
            else
                return false;
        } catch (e) {
            return false;
        }
    };

    for (feature in tests) {
        if (tests.hasOwnProperty(feature)) {
            features[feature.toLowerCase()] = tests[feature]();
        }
    }
}());

var rdYUI_DebugBase = window.location.href.indexOf("/rdDownload/") >= 0 && window.location.href.indexOf("-rdDebug.htm") > 0;
var rdYUI_GetBase = function (base) {
    if (rdYUI_DebugBase)
        return "../" + base;

    return base;
}

var YUI_config = {
    base: rdYUI_GetBase('rdTemplate/yui3/build/'),
    combine: false,
    root: rdYUI_GetBase('rdTemplate/yui3/build/'),
    pollInterval: 20,
    groups: {

        Info: {
            // enable combo loading
            combine: false,

            // The comboSeperator to use with this group's combo handler
            //comboSep: ';',

            // The maxURLLength for this server
            //maxURLLength: 500,

            // the base path for non-combo paths
            base: rdYUI_GetBase('rdTemplate/'),

            // a fragment to prepend to the path attribute when
            // when building combo urls
            root: rdYUI_GetBase('rdTemplate/'),

            // Module defintions
            modules: {
                'analysis-grid': {
                    path: 'rdAnalysisGrid/rdAg10Script.js',
                    requires: ['dd-drop-plugin', 'dd-plugin', 'dd-scroll', 'dd-constrain']
                },
                'dashboard': {
                    path: 'rdDashboard/rdDashboard2.js',
                    requires: ['dd-drop-plugin', 'dd-plugin', 'dd-scroll', 'dashboard-freeform']
                },
               'olap-grid': {
                    path: 'rdOlapGrid/rdOgScript.js',
                    requires: ['dd-drop-plugin', 'dd-plugin', 'dd-scroll', 'dd-constrain']
                },
                'zoomchart': {
                    path: 'rdZoomChart/rdZoomChart.js',
                    requires: ['base', 'event', 'node-custom-destroy']
                },
                'draggable-columns': {
                    path: 'rdDraggableColumns.js',
                    requires: ['dd-constrain', 'dd-proxy', 'dd-drop-plugin', 'dd-plugin', 'dd-scroll']
                },
                'resizable-columns': {
                    path: 'rdResize/rdResizableColumns.js',
                    requires: ['dd-constrain', 'dd-proxy', 'dd-drop-plugin', 'dd-plugin', 'dd-scroll']
                },
                'cell-color-slider': {
                    path: 'rdCellColorSlider/rdCellColorSlider.js',
                    requires: ['base', 'dd-constrain', 'dd-drop-plugin', 'dd-plugin']
                },
                'inputslider': {
                    path: 'rdInputSlider/rdInputSlider.js',
                    requires: ['slider', 'rdslider', 'dualslider']
                },
                'rd-BookmarkOrganizer-plugin': {
                    path: 'rdBookmarkOrganizer/rdBookmarkOrganizer.js',
                    requires: ['base', 'plugin', 'json']
                },
                'rd-inputCheckList-plugin': {
                    path: 'rdInputCheckboxList/rdInputCheckboxList.js',
                    requires: ['base', 'plugin', 'json']
                },
                'rd-inputSelectList-plugin': {
                    path: 'rdInputSelectList/rdInputSelectList.js',
                    requires: ['base', 'plugin', 'json']
                },
                'rd-script-full': {
                    path: 'rdScript.min.js?v=12.12.12',
                    requires: []
                },
                'rd-chartcanvas-full': {
                    path: 'rdChartCanvas.min.js',
                    requires: ['rd-script-full', 'dom-base', 'node-base', 'base', 'event', 'image-utils', 'node-custom-destroy', 'quicktip']
                },
                'rd-animated-charts': {
				    async: false,
                    path: 'rdAnimatedChart/FusionCharts.js',
                    requires: ['dom-base', 'node-base', 'base', 'event']
                },
                'rd-animated-charts-jquery': {
				    async: false,
                    path: 'rdAnimatedChart/jquery.min.js',
                    requires: []
                },
                'rd-animated-charts-hc': {
				    async: false,
                    path: 'rdAnimatedChart/FusionCharts.HC.js',
                    requires: ['rd-animated-charts-jquery']
                },
                'rd-animated-charts-hc-charts': {
				    async: false,
                    path: 'rdAnimatedChart/FusionCharts.HC.Charts.js',
                    requires: ['rd-animated-charts-jquery']
                },
                'rd-animated-charts-hc-widgets': {
				    async: false,
                    path: 'rdAnimatedChart/FusionCharts.HC.Widgets.js',
                    requires: ['rd-animated-charts-jquery']
                },
                'element-seeker': {
                    path: 'rdElementSeeker/rdElementSeeker.js',
                    requires: []
                }
            }
        },
        LogiYUI3: {

            // enable combo loading
            combine: false,

            // The comboSeperator to use with this group's combo handler
            //comboSep: ';',

            // The maxURLLength for this server
            //maxURLLength: 500,

            // the base path for non-combo paths
            base: rdYUI_GetBase('rdTemplate/rdYui/'),

            // a fragment to prepend to the path attribute when
            // when building combo urls
            root: rdYUI_GetBase('rdTemplate/rdYui/'),

            // Module defintions
            modules: {
                'attribute-helpers': {
                    path: 'attribute-helpers.js'
                },

                'canvas-utils': {
                    path: 'canvas-utils.js',
                    requires: ['dom-base', 'node-base', 'image-utils']
                },

                'chartfx-canvas-screen': {
                    path: 'chartfx-canvas-screen.js',
                    requires: ['dom', 'node-base', 'base', 'image-utils']
                },

                'chartfx-highlight': {
                    path: 'chartfx-highlight.js',
                    requires: ['dom-base', 'node-base', 'base', 'event', 'canvas-utils', 'color-utils', 'image-utils', 'node-custom-destroy', 'chartfx-canvas-screen', 'attribute-helpers', 'chartfx-mouse-tracker']
                },

                'chartfx-mouse-tracker': {
                    path: 'chartfx-mouse-tracker.js',
                    requires: ['dom-base', 'dom-screen', 'node-base', 'base', 'event-move', 'image-utils']
                },

                'chartfx-resize': {
                    path: 'chartfx-resize.js',
                    requires: ['dom-base', 'node-base', 'resize-base', 'image-utils', 'node-custom-destroy']
                },

                'chartfx-selection': {
                    path: 'chartfx-selection.js',
                    requires: ['dom-base', 'node-base', 'base', 'event', 'event-tap', 'dom-style-ie', 'selector-css2', 'image-utils', 'color-utils', 'canvas-utils', 'attribute-helpers', 'node-custom-destroy', 'chartfx-canvas-screen', 'chartfx-highlight']
                },
								//REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
                'chartDrillToBreadcrumb': {
                    path: 'chart-drillto-breadcrumb.js',
                    requires: ['base', 'node', 'event']
                },
								
                'color-utils': {
                    path: 'color-utils.js'
                },

                'drawable-overlay': {
                    path: 'drawable-overlay.js',
                    requires: ['node', 'event', 'widget', 'widget-position', 'dd-drag', 'dd-constrain', 'drawable-overlay-css']
                },

                'drawable-overlay-css': {
                    path: 'drawable-overlay.css',
                    type: 'css'
                },

                'drawable-overlay-resize': {
                    path: 'drawable-overlay-resize.js',
                    requires: ['resize']
                },

                'drawable-overlay-size-constrain': {
                    path: 'drawable-overlay-size-constrain.js',
                    requires: ['event-custom', 'resize-constrain']
                },

                'excanvas': {
                    path: 'excanvas.js',
                    condition: {
                        trigger: 'chartfx-canvas-screen',
                        test: function (Y) {
                            // Only load excanvas if browser doesn't natively support canvas
                            return !LogiXML.features.canvas;
                        },
                        when: 'before'
                    }
                },

                'image-utils': {
                    path: 'image-utils.js',
                    requires: ['dom-base', 'node-base', 'attribute-helpers']
                },

                'inputchart': {
                    path: 'inputchart.js',
                    requires: ['event', 'inputchart-xy', 'image-utils']
                },

                'inputchart-xy': {
                    path: 'inputchart-xy.js',
                    requires: ['inputchart-base', 'drawable-overlay-resize', 'drawable-overlay-size-constrain']
                },

                'inputchart-base': {
                    path: 'inputchart-base.js',
                    requires: ['node', 'base', 'dom-screen', 'drawable-overlay', 'image-utils', 'node-custom-destroy']
                },

                'node-custom-destroy': {
                    path: 'node-custom-destroy.js',
                    requires: ['node']
                },

                'quicktip': {
                    path: 'rdQuicktip.js',
                    requires: ['event', 'widget', 'widget-position', 'widget-position-constrain', 'json-parse', 'transition']
                },

                'rdResizer': {
                    path: '../rdResizer.js',
                    requires: []
                },

                'rdDashboardResizer': {
                    path: '../rdYui/rdDashboardResizer.js',
                    requires: []
                },

                'resize-large-handles-css': {
                    path: '../resize-large-handles.css',
                    condition: {
                        trigger: 'rdResizer',
                        test: function (Y) {
                            // Don't load the CSS if Touch support is available since Touch CSS loads large handles for all Resizers
                            return !LogiXML.features.touch;
                        }
                        , when: 'after'
                    }
                },

                'resize-touch-css': {
                    path: '../resize-touch.css',
                    condition: {
                        trigger: 'rdResizer',
                        test: function (Y) {
                            return LogiXML.features.touch;
                        }
                        ,when: 'after'
                    }
                },

                'rdslider': {
                    path: 'rdSlider.js',
                    requires: ['widget', 'substitute', 'dd-constrain']
                },

                'dualslider': {
                    path: 'rdDualSlider.js',
                    requires: ['widget', 'substitute', 'dd-constrain']
                },

                'waitpanel': {
                    path: 'wait-panel.js',
                    requires: ['base', 'panel', 'transition', 'cookie', 'waitpanel-css', 'history']
                },
                'waitpanel-css': {
                    path: 'wait-panel.css',
                    type: 'css'
                },

                'tabs': {
                    path: 'rdTabs.js',
                    requires: ['base', 'node-custom-destroy', 'yui2-tabview']
                },

                'popupmenu': {
                    path: 'rdPopupMenu.js',
                    requires: ['base', 'yui2-menu']
                },
                'io-upload-iframe': {
                    path: 'io-upload-iframe.js',
                    requires: ['io-base', 'node-base']
                },
                'rdInputColorPicker-css': {
                    path: '../rdInputColorPicker/rdInputColorPicker.css',
                    type: 'css'
                }
            }
        },
        yui2: {
            //YUI 2 Version
            yui2: '2.5.2',

            // enable combo loading
            combine: false,

            // the base path for non-combo paths
            base: rdYUI_GetBase('rdTemplate/yui3/2in3/'),

            // a fragment to prepend to the path attribute when
            // when building combo urls
            root: rdYUI_GetBase('rdTemplate/yui3/2in3/'),

            patterns: {
                'yui2-': {
                    configFn: function (me) {
                        if (/-skin|reset|fonts|grids|base/.test(me.name)) {
                            me.type = 'css';
                            me.path = me.path.replace(/\.js/, '.css');
                            me.path = me.path.replace(/\/yui2-skin/, '/assets/skins/sam/yui2-skin');
                        }
                    }
                }
            }
        }
    }
};
/*
 * Create Global YUI object for easy access to commonly used YUI functionality outside of 
 * YUI modules.
 *
 * You're welcome to add more modules to this list but we're trying to keep the footprint small.
 * Use Y.use('module') if you need to bring in another module separately.  Refer to README file
 * for details
 */



