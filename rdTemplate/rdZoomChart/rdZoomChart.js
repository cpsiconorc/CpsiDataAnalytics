YUI.add('zoomchart', function(Y) {
	//"use strict";
	var Lang = Y.Lang,
		TRIGGER = 'rdZoomChart',
		ZOOMOUT_PREFIX ='rdZoomChartZoomOut_',
		ZOOMOUT_OFFSET_TOP = 2,
		ZOOMOUT_OFFSET_LEFT = -2,
		ZOOMOUT_PREFIX = 'rdZoomChartZoomOut_',
		CHART_INPUT_PREFIX = 'rdZoomChartInputChart_',
		CHART_DETAIL_PREFIX = 'rdZoomChartDetailChart_',
		CHART_RESIZED_PREFIX = 'rdZoomChartMainChart_',
		CONTAINER_PREFIX = 'rdZoomChartContainer_',
		INNER_CONTAINER_PREFIX = 'rdZoomChartInnerContainer_',
		RESIZER_HEIGHT_PREFIX = 'rdZoomChartResizerHeight_',
		RESIZER_WIDTH_PREFIX = 'rdZoomChartResizerWidth_',
		INPUT_CHART_PREFIX = 'rdZoomChartControlChart_',
		RESIZER_PRM_NAME = 'rdZoomChartResizer_';
	
	if ( LogiXML.Ajax.AjaxTarget ) {
		LogiXML.Ajax.AjaxTarget().on( 'reinitialize', function() { Y.LogiXML.ZoomChart.createElements(true);});	
	}
	
	Y.LogiXML.Node.destroyClassKeys.push( TRIGGER);
	
	//Realization
	Y.namespace('LogiXML').ZoomChart = Y.Base.create('ZoomChart', Y.Base, [], {
		_handlers: {},
		_uid: null,
		initializer : function(config) {
			this._parseHTMLConfig();
			var configNode = this.get('configNode'),
				chartType = this.get('chartType'),
				mainChart = this.get('mainChart');
			configNode.setStyles({
				display: "inline-block"
			});
			//this.initResizer();
			this._uid = configNode.getAttribute('id') + ' ' + this._yuid;
			//console.log('created: ' + this._uid);
			
			//this.attachResizeEvents();
			configNode.setData(TRIGGER, this);
			this.setZoomOutBtn();
			var self = this;
			if (chartType == 'none') {
				mainChart.on( 'inputChart:runAction', function() {self._clearHandlers(true)});
				mainChart.on( 'inputChart:ready', function() {self.setZoomOutBtn(true)});
			}

		},
		destructor : function() {
			var	configNode = this.get('configNode');
			this._clearHandlers();
			configNode.setData(TRIGGER, null);
		},
		_clearHandlers: function() {
			var self = this;
			Y.each( this._handlers, function(item) {
				if ( item ) {
					item.detach();
					item = null;
				}
			});
			/*if (this.resizer) {
				this.resizer.destroy();
				this.resizer = null;
			}*/
		},
		//custom resize processing
		_oldHeight: 0,
		_oldWidth: 0,
		resizer: null,
		resizeStart: function(e) {
			if(!this._handlers.resizeStart) {
				//console.log(' resizeStart no handler '+ this._uid);
				return;
			}
			//console.log(' resizeStart '+ this._uid);
			var configNode = this.get('configNode'),
				wrapper = configNode.get('parentNode'),
				chartType = this.get('chartType'),
				inputChart = chartType == 'none' ? this.get('mainChart') : this.get('bottomChart');
			this.set('resizerWrapper', wrapper);
			this._oldHeight = wrapper.get('offsetHeight');
			this._oldWidth  = wrapper.get('offsetWidth');
			
			var inputChartObj = inputChart.getData('inputchart');
			if (inputChartObj && typeof inputChartObj.destroy === 'function' ) {
				inputChartObj.destroy();
			}
			//console.log(this._oldHeight + ' ' + this._oldWidth);
		},
		resize: function(e) {
			//console.log(' resize '+ this._uid);
			if(!this._handlers.resize) {
				//console.log(' resize no handler '+ this._uid);
				return;
			}
			var configNode = this.get('configNode'),
				elementId = this.get('elementId'),
				wrapper = this.get('resizerWrapper'),
				chartType = this.get('chartType'),
				newHeight = wrapper.get('offsetHeight'),
				newWidth = wrapper.get('offsetWidth'),
				diffHeight = newHeight - this._oldHeight,
				diffWidth = newWidth - this._oldWidth, 
				mainChart = this.get('mainChart'),
				bottomChart = this.get('bottomChart');
				
			if (diffHeight != 0 || diffWidth != 0) {
				var chartHeight = mainChart.get('offsetHeight'),
					chartWidth = mainChart.get('offsetWidth');
				mainChart.setStyles({
					height:  chartHeight + diffHeight,
					width:   chartWidth + diffWidth
				});
					
				if (bottomChart) {
					var bottomChartWidth = bottomChart.get('offsetWidth');
					bottomChart.setStyles({
						width: bottomChartWidth + diffWidth
					});
				}
				this._oldHeight = wrapper.get('offsetHeight');
				this._oldWidth  = wrapper.get('offsetWidth');
			}
		},
		resizeEnd: function(e){
			//console.log(' resizeEnd '+ this._uid);			
			if(!this._handlers.resizeEnd) {
				//console.log(' resizeEnd no handler '+ this._uid);
				return;
			}
			var configNode = this.get('configNode'),
				elementId = this.get('elementId'),
				wrapper = this.get('resizerWrapper'),
				chartType = this.get('chartType'),
				mainChart = this.get('mainChart'),
				bottomChart = this.get('bottomChart'),
				resizerHeight = this.get('resizerHeight'),
				resizerWidth = this.get('resizerWidth'),
				submitAction = this.get('submitAction');
			if (resizerHeight && resizerWidth) {
				resizerHeight.set('value', mainChart.get('offsetHeight'));
				resizerWidth.set('value', mainChart.get('offsetWidth'));
			}
			if (chartType == 'bottom') {
				configNode.setAttribute('id', mainChart.getAttribute('id'));
			}
			//call ajax refresh
			if ( LogiXML.String.isNotBlank( submitAction )) {
				Y.Node.create('<input type="hidden" name="' + RESIZER_PRM_NAME + elementId + '" value="True" />').appendTo(configNode);
				if(! e.preventPostback) {
					eval( submitAction );
				}
			}
		},
		initResizer : function() {
			//console.log(' initResizer '+ this._uid);
			var configNode = this.get('configNode'),
				self = this,
				resizerAttrs = configNode.get('parentNode').one('#rdResizerAttrs_rdZoomChartInnerContainer_' + this.get('elementId'));
			if (!resizerAttrs) {
			    return;
			}
			resizerAttrs.appendTo(configNode);
			resizerAttrs.setAttribute('id', 'rdResizerAttrs_' + configNode.getAttribute('id') );
			Y.on('domready', this.createResizer, this);
		},
		createResizer: function() {
			//console.log(' createResizer '+ this._uid);
			var configNode = this.get('configNode');
			this.resizer = LogiXML.Resize._rdInitCustomResizer(configNode.getDOMNode());
			this._handlers.resizeStart = this.resizer.on('resize:start', this.resizeStart, this);
			this._handlers.resize = this.resizer.on('resize:resize', this.resize, this);
			this._handlers.resizeEnd = this.resizer.on('resize:end', this.resizeEnd, this);
			configNode.get('parentNode').all('.yui3-resize-handles-wrapper').setStyle('visibility', 'visible');	
			//console.log(' attachResizeEvents '+ this._uid);
		},
		attachResizeEvents: function() {
			/*var self = this,
				configNode = this.get('configNode');
			this._handlers.resizeStart = configNode.on('customresize:start', this.resizeStart, this);
			this._handlers.resize = configNode.on( 'customresize:resize', this.resize, this);
			this._handlers.resizeEnd = configNode.on( 'customresize:end', this.resizeEnd, this);
			
			console.log(' attachResizeEvents '+ this._uid);
			*/
		},
		setZoomOutBtn: function(isFromInputChart) {
			if (isFromInputChart === undefined || isFromInputChart === null) {
				isFromInputChart = false;
			}
			var configNode = this.get('configNode'),
				zoomOut = configNode.one('#' + ZOOMOUT_PREFIX + this.get('elementId')),
				mainChart = this.get('mainChart'),
				innerContainer = configNode.one('#' +  INNER_CONTAINER_PREFIX + this.get('elementId'));
			if (!zoomOut) {
				return;
			}
			var chartPos = mainChart.getXY(),
				chartWidth = mainChart.get('offsetWidth'),
				linkWidth = zoomOut.get('offsetWidth'),
				linkHeight = zoomOut.get('offsetHeight'),
				left = chartWidth - linkWidth + ZOOMOUT_OFFSET_LEFT,
				top =  0  + ZOOMOUT_OFFSET_TOP;
			if (innerContainer) {
				innerContainer.setStyles({
					position: "relative",
					display: "inline-block"
				});
			}
			zoomOut.setStyles({
				position: "absolute",
				display: "block",
				left: left + "px",
				top: top + "px"
			});	
			zoomOut.remove();
			mainChart.get('parentNode').get('parentNode').append(zoomOut);
			zoomOut.on( 'click',this._clearHandlers, this);
		},
		_parseHTMLConfig : function() {
			var configNode = this.get('configNode'),
				id = configNode.getAttribute('id'),
				chartType = 'none',
				chartAfterResize = configNode.one('#' + CHART_RESIZED_PREFIX + id);
			
			if (chartAfterResize) {
				chartAfterResize.setAttribute('id', chartAfterResize.getAttribute('id').replace(CHART_RESIZED_PREFIX, ''));
				configNode.setAttribute('id', CONTAINER_PREFIX + 'id');
			}
			
			if (id.indexOf(CONTAINER_PREFIX) === 0 || chartAfterResize) {
				id = id.replace(CONTAINER_PREFIX,''); 
				chartType = 'bottom';
				this.set('mainChart', configNode.one('#' + id));
				this.set('bottomChart', configNode.one('#' + CHART_INPUT_PREFIX + id));
			} else {
				this.set('mainChart', configNode.one('#' +  CHART_INPUT_PREFIX + id));
			}
			this.set('elementId', id);
			this.set('chartType', chartType);
			this.set('resizerHeight', configNode.one('#' + RESIZER_HEIGHT_PREFIX + id));
			this.set('resizerWidth', configNode.one('#' + RESIZER_WIDTH_PREFIX + id));
			
			var inputChart = configNode.one('#' + INPUT_CHART_PREFIX + id); 
			if (inputChart) {
				this.set('submitAction', inputChart.getAttribute('data-submitaction'));
			}
		},
		ajaxPing: function() {
			
		},
		getGuid : function () {
			var S4 = function () {
				return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
			};
			return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
		}
	}, {
		// Static Methods and properties
		NAME: 'ZoomChart',
		ATTRS: {
			configNode: {
				value: null,
				setter: Y.one
			}, 
			chartType: {
				value: null
			},
			mainChart: {
				value: null
			},
			bottomChart: {
				value: null
			},
			resizerWrapper: {
				value: null
			},
			elementId: {
				value: null
			},
			resizerHeight: {
				value: null
			},
			resizerWidth: {
				value: null
			},
			submitAction: {
				value: null
			}
		}, 
		createElements: function(isAjax) {
			if (!isAjax) {
				isAjax = false;
			}
			var zoomChart;
			Y.all('.' + TRIGGER).each(function (node) {
				zoomChart = node.getData(TRIGGER);
				if (! zoomChart){
					zoomChart = new Y.LogiXML.ZoomChart({
						configNode: node, 
						isAjax: isAjax
					});
				} 
			});
		}
	
	});
}, '1.0.0', {requires:['base', 'event', 'node-custom-destroy']});
