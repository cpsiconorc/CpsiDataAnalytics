// JSLint options:
/*jslint evil: true*/
/*global LogiXML, YUI, document, window*/

YUI.add('inputchart-xy', function(Y) {
	//"use strict";
	
	var Lang = Y.Lang,
		DOM = Y.DOM,
		LogiMath = LogiXML.Math,
		CHART_LINE = 'line',
		CHART_SPLINE = 'spline',
		CHART_SCATTER = 'scatter',
		BOUNDING_BOX = 'boundingBox',
		TIME = 'time',
		NUMERIC = 'numeric',
		OFFSET_WIDTH = 'offsetWidth',
		OFFSET_HEIGHT = 'offsetHeight',
		
		
		// Create new Overlay class which adds Resize capability along with size constraints.  Add CSS_PREFIX to match original class
		ResizableOverlay = Y.Base.create('resizableOverlay', Y.LogiXML.DrawableOverlay, [Y.LogiXML.DrawableOverlayResize, Y.LogiXML.DrawableOverlaySizeConstrain], null, { CSS_PREFIX: 'drawableoverlay' } ),
	
	// Set element dimensions even if the element doesn't claim space on the page, aka
	// element or any of it's parents have display: none;
	setInvisibleNodeDimensions = function( node, width, height ) {
	
		// Set element width by offset, if offsetWidth changes we're good to go.
		// Otherwise node takes up no space
		node.set( OFFSET_WIDTH, width );
		
		var offsetWidth = node.get( OFFSET_WIDTH ),
			placeHolder, parentNode, bodyNode,
			originalStyles = { display : '' };
		
		// If offsetWidth is 0, then element takes up no space
		if ( offsetWidth === 0 ) {
			placeHolder = Y.Node.create( '<div style="display: none;"></div>' );
			parentNode = node.get( 'parentNode' );
			bodyNode = Y.one( 'body' );
			
			// Remember some of the original styles
			originalStyles.position = node.getComputedStyle( 'position' );
			originalStyles.left = node.getComputedStyle( 'left' );
			originalStyles.top = node.getComputedStyle( 'top' );
			
			// Swap in placeholder DIV to remember our original location
			parentNode.replaceChild( placeHolder, node );
			
			// Push node off the screen, but still visible, so we can set dimensions
			node.setStyles({
				display : '',
				position : 'fixed',
				left : '9999px',
				top : '0px'
			});
			bodyNode.append( node );
			
			node.set( OFFSET_WIDTH, width );
			node.set( OFFSET_HEIGHT, height );
			
			// Restore position and swap node back in
			bodyNode.removeChild( node );
			node.setStyles( originalStyles );
			parentNode.replaceChild( node, placeHolder );
			placeHolder.destroy();
		}
		// Element takes up space, set height and we're done
		else {
			node.set( OFFSET_HEIGHT, height );
		}
	};
	
	/*
	* This class extends the base Input Chart by calculating min/max X/Y values of the
	* overlay region relative to the chart it's attached to.
	*/
	var InputChartXY = function() {
		InputChartXY.superclass.constructor.apply(this, arguments);
	};
	
	Y.namespace('LogiXML.Form').InputChartXY = InputChartXY;
	
	Y.extend(InputChartXY, Y.LogiXML.Form.InputChart, {
	
		initializer : function(config) {
			this._plotToDataRatio = {};
			
			this._parseHTMLConfig_XY();
			this._calculatePlotRatio();
			var constrain = this.get('constrain');
			
			// If min/max X values are unspecified max the overlay min width(fill the space) and add vertical resize handles
			if ( !Lang.isValue( this.get('minX') ) && !Lang.isValue( this.get('maxX') ) ) {
				this.set( 'minOverlayWidth', constrain.get('offsetWidth') );
			}
			
			// If min/max Y values are unspecified max the overlay min height(fill the space) and add horizontal resize handles
			if ( !Lang.isValue( this.get('minY') ) && !Lang.isValue( this.get('maxY') ) ) {
				this.set( 'minOverlayHeight', constrain.get('offsetHeight') );
			}
			
			this.on('inputChart:reset', this._clearInputValues, this);
			this.on('inputChart:runAction', this._onRunAction, this);
			
			this._drawOverlayFromDOM();
		},
		
		/**
		 * Override
		 */
		_createOverlay : function() {
		
			var configNode = this.get('configNode'),
				config = this._getOverlayConfig(),
				overlay;
				
			config = Y.merge( { resizeConfig : this._determineResizeSettings( configNode ) }, config );
			overlay = new ResizableOverlay( config );
			overlay.render();
			
			return overlay;
		},
		
		// I hate parsing this twice, but Overlay Creation is done much earlier in inputchart initializer and we need
		// to know resize settings by then.
		_determineResizeSettings : function( configNode ) {
			
			var minX = Y.one('#' + configNode.getAttribute('data-minXaxisID') ),
				maxX = Y.one('#' + configNode.getAttribute('data-maxXaxisID') ),
				minY = Y.one('#' + configNode.getAttribute('data-minYaxisID') ),
				maxY = Y.one('#' + configNode.getAttribute('data-maxYaxisID') ),
				resizeConfig = null;
			
			// If min/max X values are unspecified max the overlay min width(fill the space) and add vertical resize handles
			if ( !Lang.isValue( minX ) && !Lang.isValue( maxX ) ) {
				resizeConfig = { handles: ['t', 'b'] };
			}
			
			// If min/max Y values are unspecified max the overlay min height(fill the space) and add horizontal resize handles
			if ( !Lang.isValue( minY ) && !Lang.isValue( maxY ) ) {
				resizeConfig = { handles: ['l', 'r'] };
			}
			
			return resizeConfig;
		},

		_parseHTMLConfig_XY : function() {
			var configNode = this.get('configNode'),
				plotAttrs = this.get('plotAttributes'),
				getSignificantDigit = LogiMath.getSignificantDigits,
				minXAxisSigDigit, maxXAxisSigDigit, minYAxisSigDigit, maxYAxisSigDigit;
				
			this.set( 'minX', '#' + configNode.getAttribute('data-minXaxisID') );
			this.set( 'maxX', '#' + configNode.getAttribute('data-maxXaxisID') );
			this.set( 'minY', '#' + configNode.getAttribute('data-minYaxisID') );
			this.set( 'maxY', '#' + configNode.getAttribute('data-maxYaxisID') );
			this.set( 'fullSelectionOnRender', configNode.getAttribute('data-fullSelectionOnRender') );
			
			if ( this.get('xAxisValueType') === NUMERIC ) {
				minXAxisSigDigit = getSignificantDigit( plotAttrs.minXAxisValue );
				maxXAxisSigDigit = getSignificantDigit( plotAttrs.maxXAxisValue );
				this.set( 'xAxisSignificantDigits', minXAxisSigDigit > maxXAxisSigDigit ? minXAxisSigDigit : maxXAxisSigDigit );
			}
			
			if ( this.get('yAxisValueType') === NUMERIC ) {
				minYAxisSigDigit = getSignificantDigit( plotAttrs.minYAxisValue );
				maxYAxisSigDigit = getSignificantDigit( plotAttrs.maxYAxisValue );
				this.set( 'yAxisSignificantDigits', minYAxisSigDigit > maxYAxisSigDigit ? minYAxisSigDigit : maxYAxisSigDigit );
			}
		},
		
		_calculatePlotRatio : function() {
			// Determine what one pixel value is equal to in terms of chart value
		    var plotAttrs = this.get('plotAttributes'),
                dataMargins = this.get('dataMargins'),
				plotXRange = Math.abs( plotAttrs.maxXAxisValue - plotAttrs.minXAxisValue ),
				plotYRange = Math.abs( plotAttrs.maxYAxisValue - plotAttrs.minYAxisValue );
			this._plotToDataRatio.x = plotXRange / (plotAttrs.width - dataMargins[0]);
			this._plotToDataRatio.y = plotYRange / (plotAttrs.height- dataMargins[1]);
		},
		
		_drawOverlayFromDOM : function() {
			var minX = this.get('minX'),
				maxX = this.get('maxX'),
				minY = this.get('minY'),
				maxY = this.get('maxY'),
				overlayNode = this._overlay.get( BOUNDING_BOX ),
				plotAttributes = this.get('plotAttributes'),
				plotToDataRatio = this._plotToDataRatio,
				minOverlayHeight = this.get('minOverlayHeight'),
				minOverlayWidth = this.get('minOverlayWidth'),
				xAxisType = this.get('xAxisValueType'),
				yAxisType = this.get('yAxisValueType'),
				fullSelectionOnRender = this.get('fullSelectionOnRender'),
				width, height, left, bottom;
			
			minX = (minX) ? this._parseInputValue( minX, xAxisType ) : null;
			maxX = (maxX) ? this._parseInputValue( maxX, xAxisType ) : null;
			minY = (minY) ? this._parseInputValue( minY, yAxisType ) : null;
			maxY = (maxY) ? this._parseInputValue( maxY, yAxisType ) : null;
			
			// Server is requesting full selection no matter what
			if ( fullSelectionOnRender ) {
				minY = plotAttributes.minYAxisValue;
				maxY = plotAttributes.maxYAxisValue;
				minX = plotAttributes.minXAxisValue;
				maxX = plotAttributes.maxXAxisValue;
			}
			
			// Are all the values still null?? Then we have no values to draw
			if ( !(minX || maxX || minY || maxY) ) {
				return;
			}
			
			if ( Lang.isNumber( minY ) && Lang.isNumber( maxY ) ) {
				// Make sure values are within chart bounds, otherwise overlay would render outside plotting bounds
				minY = minY >= plotAttributes.minYAxisValue ? minY : plotAttributes.minYAxisValue;
				maxY = maxY <= plotAttributes.maxYAxisValue ? maxY : plotAttributes.maxYAxisValue;
				
				// Transform server values into plot x/y values
				minY = (minY - plotAttributes.minYAxisValue) / plotToDataRatio.y;
				maxY = (maxY - plotAttributes.minYAxisValue) / plotToDataRatio.y;
			}
			// No Y values provided, fill the height
			else if ( minY === null && maxY === null ) {
				minY = 0;
				maxY = plotAttributes.height;
			}
			// Mismatch, one has value and other is null, not enough information to render correctly
			else {
				return;
			}
			
			if ( Lang.isNumber( minX ) && Lang.isNumber( maxX ) ) {
				// Make sure values are within chart bounds, otherwise overlay would render outside plotting bounds
				minX = minX >= plotAttributes.minXAxisValue ? minX : plotAttributes.minXAxisValue;
				maxX = maxX <= plotAttributes.maxXAxisValue ? maxX : plotAttributes.maxXAxisValue;
				
				// Transform server values into plot x/y values
				minX = (minX - plotAttributes.minXAxisValue) / plotToDataRatio.x;
				maxX = (maxX - plotAttributes.minXAxisValue) / plotToDataRatio.x;
			}
			// No X values provided, fill the width
			else if ( minX === null && maxX === null ) {
				minX = 0;
				maxX = plotAttributes.width;
			}
			// Mismatch, one has value and other is null, not enough information to render correctly
			else {
				return;
			}
			
			// Convert plot x/y values into browser x/y and width/height values
			width = Math.round( maxX - minX );
			height = Math.round( maxY - minY );
			left = Math.round( plotAttributes.x + minX );
			bottom = Math.round( plotAttributes.y + minY );
			
			// Don't render overlay unless it's bigger than the min width/height
			if ( width < minOverlayWidth || height < minOverlayHeight ) {
				return;
			}
			
			// Set dimensions using offset, includes style width, padding, and border
			setInvisibleNodeDimensions( overlayNode, width, height );
			
			// Render overlay
			overlayNode.setStyles({
				left: left + 'px',
				bottom: bottom + 'px',
				top: '',
				right: ''
			});
			
			this.set( 'overlayPresent', true );
			this._overlay.show();
		},
		
		_parseInputValue : function( inputNode, axisType ) {
			if ( !(inputNode instanceof Y.Node) ) {
				return null;
			}
			
			var value = inputNode.get('value'),
				parsedValue = this._parseServerValue( value, axisType );
			
			// If parse failed, we'll get undefined
			if ( !Y.Lang.isValue( parsedValue ) ) {
				parsedValue = null;
			}
			
			return parsedValue;
		},
		
		_onRunAction : function() {
			// Calculate XY values
			var submitAction = this._submitAction,
				plotToDataRatio = this._plotToDataRatio,
				plotAttributes = this.get('plotAttributes'),
                dataMargins = this.get('dataMargins'),
				minXValue = 0, minYValue = 0, maxXValue = 0, maxYValue = 0,
				overlayNode = this._overlay.get(BOUNDING_BOX),
				constrainRegion = this._getConstrainRegion(),
				overlayRegion = DOM.region( overlayNode.getDOMNode() ),
				// Determine where, if any, overlay intersects with chart
				intersection = Y.DOM.intersect( null, overlayRegion, constrainRegion ),
				roundToSignificantDigit = LogiMath.roundToSignificantDigit,
				xAxisSigDigits, yAxisSigDigits;

			if ( intersection.inRegion === true ) {
				// Transform client x/y coordinates into server side chart values
			    minXValue = plotToDataRatio.x * (intersection.left - constrainRegion.left - dataMargins[0]) + plotAttributes.minXAxisValue;
			    minYValue = plotToDataRatio.y * (constrainRegion.bottom - intersection.bottom - dataMargins[1]) + plotAttributes.minYAxisValue;
			    maxXValue = plotToDataRatio.x * (intersection.right - constrainRegion.left - dataMargins[0]) + plotAttributes.minXAxisValue;
			    maxYValue = plotToDataRatio.y * (constrainRegion.bottom - intersection.top - dataMargins[1]) + plotAttributes.minYAxisValue;
			}
			
			// If X axis values came in originally as ISO Dates we need to return the same
			if ( this.get('xAxisValueType') === TIME ) {
			    minXValue = new Date(minXValue).toISOString();
			    minXValue = minXValue.substring(0, minXValue.length - 1); //18572 - removing the extra Z at the end.
			    maxXValue = new Date(maxXValue).toISOString();
			    maxXValue = maxXValue.substring(0, maxXValue.length - 1); //18572 - removing the extra Z at the end.
			}
			// Otherwise round to significant digits
			else {
				xAxisSigDigits = this.get('xAxisSignificantDigits');
				minXValue = roundToSignificantDigit( minXValue, xAxisSigDigits );
				maxXValue = roundToSignificantDigit( maxXValue, xAxisSigDigits );
			}
			
			// If Y axis values came in originally as ISO Dates we need to return the same
			if ( this.get('yAxisValueType') === TIME ) {
				minYValue = new Date( minYValue ).toISOString();
				maxYValue = new Date( maxYValue ).toISOString();
			}
			// Otherwise round to significant digits
			else {
				yAxisSigDigits = this.get('yAxisSignificantDigits');
				minYValue = roundToSignificantDigit( minYValue, yAxisSigDigits );
				maxYValue = roundToSignificantDigit( maxYValue, yAxisSigDigits );
			}
			
			this._setInputValues( [minXValue, minYValue, maxXValue, maxYValue] );
			
			// Submit Form if need be
			if ( LogiXML.String.isNotBlank( submitAction ) ) {
				eval( submitAction );
			}
		},
		
		_setInputValues : function( minMaxXY ) {
			var minX = this.get('minX'),
				maxX = this.get('maxX'),
				minY = this.get('minY'),
				maxY = this.get('maxY');
			
			// Only set values if Nodes provided
			if ( minX ) {
				minX.set('value', minMaxXY[0] );
			}
			
			if ( minY ) {
				minY.set('value', minMaxXY[1] );
			}
			
			if ( maxX ) {
				maxX.set('value', minMaxXY[2] );
			}
			
			if ( maxY ) {
				maxY.set('value', minMaxXY[3] );
			}
		},
		
		_clearInputValues : function() {
			this._setInputValues( [0,0,0,0] );
		},
		
		_getConstrainRegion : function() {
			return DOM.region( this.get('constrain').getDOMNode() );
		}
	}, {
		NAME: 'inputChartXY',
		SUPPORTED_CHART_TYPES: [CHART_SCATTER, CHART_LINE, CHART_SPLINE],
		
		ATTRS: {
			/*
			 * Nodes of form elements to write min/max XY values
			 * If you're missing one of the Axises, the overlay will fill in to show
			 * that axis doesn't contribute.  Resize handles are also added.
			 */
			minX: {
				value: null,
				setter: Y.one
			},
			
			maxX: {
				value: null,
				setter: Y.one
			},
			
			minY: {
				value: null,
				setter: Y.one
			},
			
			maxY: {
				value: null,
				setter: Y.one
			},
			
			minimumSignificantDigit: {
				value: 4,
				validator: function( val ) {
					return Lang.isNumber( val ) && val > 0;
				}
			},
			
			/*
			 * ZoomChart wants the overlay to fill chart on render.  This is easily done if the hidden inputs
			 * are to set to min/max values for x/y axis.  Sadly the server doesn't know these until much
			 * later in the rendering process so javascript has compensate.
			 */
			fullSelectionOnRender: {	
				value: false,
				setter: function( val ) {
					if ( Lang.isBoolean( val ) ) {
						return val;
					}
					val = val.toLowerCase();
					
					if ( val === 'true' ) {
						return true;
					}
					
					return false;
				},
				validator: function( val ) {
					return Lang.isString( val ) || Lang.isBoolean( val );
				}
			},
			
			xAxisSignificantDigits: {
				valueFn: function() {
					return this.get('minimumSignificantDigit');
				},
				validator: function( val ) {
					return Lang.isNumber( val ) && val >= this.get('minimumSignificantDigit');
				}
			},
			
			yAxisSignificantDigits: {
				valueFn: function() {
					return this.get('minimumSignificantDigit');
				},
				validator: function( val ) {
					return Lang.isNumber( val ) && val >= this.get('minimumSignificantDigit');
				}
			}
		}
	});
	
}, '1.0.0', {requires: ['inputchart-base', 'drawable-overlay-resize', 'drawable-overlay-size-constrain']});
