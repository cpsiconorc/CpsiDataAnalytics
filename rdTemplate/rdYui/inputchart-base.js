// JSLint options:
/*jslint evil: true*/
/*global LogiXML, YUI, document, window */

YUI.add('inputchart-base', function(Y) {
	//"use strict";
	
	var Lang = Y.Lang,
		ImageUtils = Y.LogiXML.Image,
		ORIENTATION_VERTICAL = 'vertical',
		ORIENTATION_HORIZONTAL = 'horizontal',
		BOUNDING_BOX = 'boundingBox',
		ABSOLUTE = 'absolute',
		RELATIVE = 'relative',
		PX = 'px',
		NUMERIC = 'numeric',
		TIME = 'time',
		CONSTRAIN_TEMPLATE = '<div></div>',
		DESTROY_CLASS_KEY = 'inputchart',
		
		EV_INPUTCHART_READY = 'inputChart:ready',
		EV_INPUTCHART_RESET = 'inputChart:reset',
		EV_INPUTCHART_RUN_ACTION = 'inputChart:runAction',
		
		axisTypeValidator = function( val ) {
			if ( !Lang.isString( val ) ) {
				return false;
			}
			var lowerCase = val.toLowerCase();
			return lowerCase === TIME || lowerCase === NUMERIC;
		},
		
		toLowerCase = function( val ) {
			return val.toLowerCase();
		},
		
		booleanValidator = function( val ) {
			return Lang.isString( val ) || Lang.isBoolean( val );
		},
		
		booleanSetter = function( val ) {
			if ( Lang.isBoolean( val ) ) {
				return val;
			}
			val = val.toLowerCase();
			
			if ( val === 'true' ) {
				return true;
			}
			
			return false;
		};
	
	// Register class with custom destroy code
	Y.LogiXML.Node.destroyClassKeys.push( DESTROY_CLASS_KEY );
	
	Y.namespace('LogiXML.Form').InputChart = Y.Base.create('inputChart', Y.Base, [], {
		// Prototype Methods and properties
		
		initializer : function(config) {
			var configNode = this.get('configNode'),
				chartNode = this.get('chart'),
				overlayBB;
			
			if ( configNode === null || configNode === undefined ) {
				Y.error('inputChart: attribute "configNode" is required');
				return;
			}
			
			if ( chartNode === null || chartNode === undefined ) {
				Y.error('inputChart: attribute "chart" is required');
				return;
			}
			
			// Bubble events to IMG node as well
			this.addTarget( chartNode );
			
			chartNode.setData( DESTROY_CLASS_KEY, this );
			
			this._handles = {};
			
			// Actions to run on overlay draw and clear
			this._submitAction = null;
			this._clearAction = null;
			
			// Get all the configuration info we need
			this._mapNode = ImageUtils.getMapfromImage( chartNode );
			this._parseHTMLConfig();
			
			// Wrap image in <div> wrapper, will container overlay and constraining div
			this._wrapper = this._createWrapper();
			/*
			 * Create a <div> which corresponds to the plotting region of the chart, which is used
			 * to constrain the overlay drawing
			 */
			this._createConstrainRegion();
			
			// Create drawableOverlay
			this._overlay = this._createOverlay( config );
			overlayBB = this._overlay.get(BOUNDING_BOX);
			this._wrapper.append( overlayBB );
			
			// Publish custom Events and keep handles so we can clean up during destroy
			this._customEvents = {};
			this._publishCustomEvents();
			
			// Attach events to overlay
			this._bindEvents();
			
			// DD determines what cursor to use during drag operation by looking at drag handle.
			// There are no preset handles, so <IMG> tag becomes the handle.
			chartNode.setStyle('cursor', 'auto');
			overlayBB.setStyle('cursor', 'move');
		},
		
		destructor : function() {
			var constrainNode = this.get('constrain'),
				chartNode = this.get('chart');
			
			this._clearHandles();
			this._removeCustomEvents();
			
			if ( typeof this._overlay.destroy === 'function' ) {
				this._overlay.destroy();
			}
			
			// Does the constrain node still exist?
			if ( constrainNode.getDOMNode() ) {
				constrainNode.remove(true);
			}
			else {
				constrainNode = null;
			}
			
			ImageUtils.unwrapImage( chartNode );
		},
		
		_createWrapper : function() {
			var chartNode = this.get('chart'),
				chartDimensions = ImageUtils.getDimensions( chartNode ),
				divWrapper;
			
			// For constrain to work we need to wrap the image with a div wrapper to allow absolute positioning	
			divWrapper = ImageUtils.wrapImage( chartNode );
			divWrapper.setStyles({
				position: RELATIVE,
				width: chartDimensions.width + PX,
				height: chartDimensions.height + PX
			});
			
			// We need absolute position to make sure z-index works correctly
			chartNode.setStyles({
				position: ABSOLUTE,
				left: 0,
				top: 0
			});
			
			return divWrapper;
		},
		
		_createConstrainRegion : function() {
			var plotAttributes = this.get('plotAttributes'),
				constrainNode = Y.Node.create( CONSTRAIN_TEMPLATE );
			
			// Use plotAttributes to position and size constrain node
			constrainNode.setStyles( {
				position: ABSOLUTE,
				left: plotAttributes.x + PX,
				bottom: plotAttributes.y + PX,
				top: '',
				right: '',
				width: plotAttributes.width,
				height: plotAttributes.height
			});
			
			// Insert before chart, this way default z-indexing puts chart on top of constrain region
			this.get('chart').insert( constrainNode, 'before' );
			this.set('constrain', constrainNode );
		},
		
		_createOverlay : function() {
			var overlay = new Y.LogiXML.DrawableOverlay( this._getOverlayConfig() );
			overlay.render();
			return overlay;
		},
		
		_getOverlayConfig : function() {
			return {
				constrain: this.get('constrain'),
				trigger: this.get('chart'),
				minHeight: this.get('minOverlayHeight'),
				minWidth: this.get('minOverlayWidth'),
				imageMap: this._mapNode,
				backgroundColor: this.get('overlayBackgroundColor'),
				borderColor: this.get('overlayBorderColor'),
				opacity: this.get('overlayOpacity')
			};
		},
		
		_publishCustomEvents : function() {
			var customEvents = this._customEvents,
				disableSelectionClear = this.get('disableSelectionClear');
			
			customEvents.runAction = this.publish( EV_INPUTCHART_RUN_ACTION, {
				queuable: false,
				emitFacade: true,
				bubbles: true
			});
			
			// Fired when the InputChart has finished initialization
			customEvents.ready = this.publish( EV_INPUTCHART_READY, {
				queueable: false,
				emitFacede: true,
				bubbles: true
			});
			
			if ( !disableSelectionClear ) {
				customEvents.reset = this.publish( EV_INPUTCHART_RESET, {
					defaultFn: this._defonReset,
					queuable: false,
					emitFacade: true,
					bubbles: true
				});
			}
		},
		
		_bindEvents : function() {
			var overlay = this._overlay,
				chartNode = this.get('chart'),
				handles = this._handles,
				disableSelectionClear = this.get('disableSelectionClear');
			
			// Fire event after init(base class) is done
			this.onceAfter( 'init', this._afterInit, this );
			
			handles.drawEnd = overlay.on('draw:end', this._onDraworMoveEnd, this);
			handles.moveEnd = overlay.on('move:end', this._onDraworMoveEnd, this);
			
			handles.drawReset = overlay.on('draw:reset', function(ev) {
				// Prevent the default reset function from firing so overlay is not reset
				if ( disableSelectionClear ) {
					ev.preventDefault();
					return;
				}
				
				this.fire( 'inputChart:reset' );
			}, this);
			handles.mouseClick = chartNode.on('click', this._onMouseClick, this);
			
			handles.minOverlayHeightChange = this.after('minOverlayHeightChange', Y.rbind( this._afterOverlayAttributeChange, this, 'minHeight') );
			handles.minOverlayWidthChange = this.after('minOverlayWidthChange', Y.rbind( this._afterOverlayAttributeChange, this, 'minWidth') );
			handles.overlayBGChange = this.after('overlayBackgroundColorChange', Y.rbind( this._afterOverlayAttributeChange, this, 'backgroundColor') );
			handles.overlayBorderChange = this.after('overlayBorderColorChange', Y.rbind( this._afterOverlayAttributeChange, this, 'borderColor') );
			handles.overlayOpacityChange = this.after('overlayOpacityChange', Y.rbind( this._afterOverlayAttributeChange, this, 'opacity') );
			
			handles.chartResizeStart = chartNode.on('resize:start', this._onChartResizeStart, this);
			handles.chartResizeEnd = chartNode.on('resize:end', this._onChartResizeEnd, this);
		},
		
		_clearHandles : function() {
			Y.each( this._handles, function(item) {
				if ( item ) {
					item.detach();
					item = null;
				}
			});
		},
		
		_removeCustomEvents : function() {
			Y.each( this._customEvents, function(item) {
				if ( item ) {
					item.detachAll();
					item = null;
				}
			});
		},
		
		_parseHTMLConfig : function() {
			var configNode = this.get('configNode'),
				imageMap = this._mapNode,
				parseServerValue = this._parseServerValue,
				xAxisValueType = NUMERIC,
				yAxisValueType = NUMERIC,
				plotAttributes,
				dataMargins;
			
			this._set( 'chartOrientation', configNode.getAttribute('data-chartOrientation') );
			this._set( 'chartType', imageMap.getAttribute('data-chartType') );
			this._set( 'chart3D', imageMap.getAttribute('data-chart3D') );
			this.set( 'overlayBackgroundColor', configNode.getAttribute('data-overlayBgColor') );
			this.set( 'overlayBorderColor', configNode.getAttribute('data-overlayBorderColor') );
			this.set( 'overlayOpacity', configNode.getAttribute('data-overlayOpacity') );
			this.set( 'disableSelectionClear', configNode.getAttribute('data-disableselectionclear') );
			this._submitAction = configNode.getAttribute('data-submitAction');
			this._clearAction = configNode.getAttribute('data-clearAction');
			
			/* These are a number of attributes related to the plotting region of the chart.
			 * Values are as follows, "plotareaX,plotareaY,width,height,minXValue,maxXValue,minYValue,maxYValue,XaxisType,YaxisType"
			 * plotAreaX/Y - relative to the bottom left corner of the image, where does the plotting area start, aka 0,0.
			 * width/height - Dimensions of plot
			 * Later on we use these 4 values to adjust the page X/Y coordinates so they work with server values.
			 * In essence 0,0 is top left in browser, while server is bottom left
			 * 
			 * Only used by InputChart XY
			 * min/max X/y - What are the min/max values of the axises.  Convert the overlay's position within the plotting
			 * region into actual chart values.  Only works for linear scale
			 * X/Y axisType - Are the axis values numeric or time based?  Determines how we parse values
			 */
            
		    /*19832 adding data-margins*/
			dataMargins = imageMap.getAttribute('data-margins').split(',');
		    if (dataMargins) {
		        dataMargins[0] = parseInt(dataMargins[0], 10);
		        dataMargins[1] = parseInt(dataMargins[1], 10);
		    } else {
		        dataMargins = [ 0, 0 ];
		    }
		    this._set('dataMargins', dataMargins);

			plotAttributes = imageMap.getAttribute('data-plotAttributes').split(',');
			
			if ( plotAttributes.length === 10 ) {
				xAxisValueType = plotAttributes[8].toLowerCase();
				yAxisValueType = plotAttributes[9].toLowerCase();
			}
			
			// Run axis value types values through Attributes to validate and normalize
			this.set( 'xAxisValueType', xAxisValueType );
			this.set( 'yAxisValueType', yAxisValueType );
			xAxisValueType = this.get( 'xAxisValueType' );
			yAxisValueType = this.get( 'yAxisValueType' );
			
			this._set('plotAttributes', {
				x: parseInt( plotAttributes[0], 10 ),
				y: parseInt( plotAttributes[1], 10 ),
				width: parseInt( plotAttributes[2], 10 ),
				height: parseInt( plotAttributes[3], 10 ),
				minXAxisValue: parseServerValue( plotAttributes[4], xAxisValueType ),
				maxXAxisValue: parseServerValue( plotAttributes[5], xAxisValueType ),
				minYAxisValue: parseServerValue( plotAttributes[6], yAxisValueType ),
				maxYAxisValue: parseServerValue( plotAttributes[7], yAxisValueType ),
				xAxisValueType: xAxisValueType,
				yAxisValueType: yAxisValueType
			});
			
			// Mark the image map as processed, used as a marker after resize events to know whether a 
			// new image map was pulled down.
			if ( imageMap ) {
				imageMap.setAttribute('data-inputChartProcessed', true);
			}
		},
		
		/*
		 * The server sends axis values over with chart config and hidden inputs.  These values are normally numbers
		 * but they can also send Dates in ISO 8601 string format.  We need to be able to parse both.
		 */
		_parseServerValue: function( value, axisType ) {
			var parsedValue;
		
			if ( axisType === NUMERIC ) {
				parsedValue = parseFloat( value, 10 );
			}
			else if ( axisType === TIME ) {
				/*
				 * .NET doesn't follow the ISO 8601 date spec exactly.  When you ask for the sortable format
				 * it produces something like this "2009-06-15T13:45:30" which is incorrect.  There is no timezone
				 * information, the correct way would be "2009-06-15T13:45:30Z" for UTC.  Until they fix it, if ever,
				 * add the 'Z' so all browsers parse it correctly.
				 */
				if ( value.lastIndexOf('Z') !== value.length - 1 )
				{
					value = value + 'Z';
				}
				parsedValue = Date.parse( value );
			}
			else {
				parsedValue = undefined;
			}
		
			// Did either of the parses fail?
			if ( isNaN( parsedValue ) ) {
				parsedValue = undefined;
			}
			
			return parsedValue;
		},
		
		_afterInit: function() {
			this.fire( EV_INPUTCHART_READY );
		},
		
		_onMouseClick: function(ev) {
			
			var overlayNode = this._overlay.get(BOUNDING_BOX),
				cursorRegion = {
					left: ev.pageX,
					top: ev.pageY,
					right: ev.pageX,
					bottom: ev.pageY
				},
				inregion = Y.DOM.inRegion( null, overlayNode.getDOMNode(), true, cursorRegion );
			
			// Don't clear overlay if click happens inside it
			if ( !inregion ) {
				this._overlay.reset();
			}
		},
		
		_onDraworMoveEnd : function(ev) {
			if ( ev.type === 'draw:end' ) {
				this.set( 'overlayPresent', true );
			}
			this.fire( EV_INPUTCHART_RUN_ACTION );
		},
		
		/*
		 * As soon as resize starts we need to hide overlay as it won't be accurate anymore
		 */
		_onChartResizeStart : function() {
			this._overlay.hide();
		},
		
		_onChartResizeEnd : function() {
			Y.LogiXML.Form.reinitializeInputChartAfterResize( this.get('chart'), this );
		},
		
		_defonReset : function() {
			var clearAction = this._clearAction,
				overlayPresent = this.get('overlayPresent');
			
			this.set('overlayPresent', false);
			if ( overlayPresent && LogiXML.String.isNotBlank( clearAction ) ) {
				eval( this._clearAction );
			}
		},
		
		_afterOverlayAttributeChange : function( ev, att ) {
			this._overlay.set( att, ev.newVal );
		}
	}, {
		// Static Methods and properties
		NAME: 'inputChart',
		CSS_PREFIX: 'inputChart',
		
		ATTRS: {
			chart: {
				setter: Y.one,
				validator: function( val ) {
					var node = Y.one( val );
					return node instanceof Y.Node && node.get('tagName') === 'IMG';
				}
			},
			
			chartOrientation: {
				value: ORIENTATION_VERTICAL,
				setter: function(val) {
					return val.toLowerCase();
				},
				validator: function(val) {
					if ( Lang.isString( val ) ) {
						val = val.toLowerCase();
						return val === ORIENTATION_VERTICAL || val === ORIENTATION_HORIZONTAL;
					}
					return false;
				},
				readOnly: true
			},
			
			chartType: {
				readOnly: true
			},
			
			chart3D: {
				value: false,
				setter: booleanSetter,
				validator: booleanValidator,
				readOnly: true
			},
			
			configNode: {
				setter: Y.one
			},
			
			constrain: {
				readOnly: true
			},
			
			// Prevent selection area from being cleared
			disableSelectionClear: {
				value: false,
				setter: booleanSetter,
				validator: booleanValidator
			},
			
			minOverlayHeight: {
				value: 10,
				validator: function (value) {
					return Lang.isNumber(value) && value > 0;
				}	
			},
			
			minOverlayWidth: {
				value: 10,
				validator: function (value) {
					return Lang.isNumber(value) && value > 0;
				}
			},
			
			overlayBackgroundColor: {
				validator: Lang.isString
			},
			
			overlayBorderColor: {
				validator: Lang.isString
			},
			
			overlayOpacity: {
				value: 0.5,
				validator: LogiXML.opacityValidator
			},
			
			overlayPresent: {
				value: false
			},
			
			// Contains several values related to the plotting region of the chart, look at _parseHTMLConfig for more info
			plotAttributes: {
				readOnly: true
			},
			
			// Are the X axis values Dates?
			xAxisValueType: {
				value: NUMERIC,
				setter: toLowerCase,
				validator: axisTypeValidator
			},
			
			// Are the Y axis values Dates?
			yAxisValueType: {
				value: NUMERIC,
				setter: toLowerCase,
				validator: axisTypeValidator
			}
		}
	});
	
}, '1.0.0', {requires:['node', 'base', 'dom-screen', 'drawable-overlay', 'image-utils', 'node-custom-destroy']});