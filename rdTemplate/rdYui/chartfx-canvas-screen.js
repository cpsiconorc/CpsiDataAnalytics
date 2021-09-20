// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false, G_vmlCanvasManager: false */

/*
 * Canvas Screen setups a canvas element where it's applied on top of
 * a static image.  The image and canvas element are then wrapped in a DIV to
 * keep them positioned correctly.  This allows you to draw visual 
 * effects on top of static images.
 * The technique is based off work from http://davidlynch.org/projects/maphilight/docs/
 *
 * For IE 7/8 we rely on excanvas
 */
YUI.add('chartfx-canvas-screen', function(Y) {
	//"use strict";
	
	var ImageUtils = Y.LogiXML.Image,
		Lang = Y.Lang,
		ABSOLUTE = 'absolute',
		RELATIVE = 'relative',
		PX = 'px',
		CHART_STYLE = {
			position: ABSOLUTE,
			left: 0,
			top: 0
		},
		WRAPPER_STYLE = {
			display: 'block',
			position: RELATIVE,
			padding: 0
		},
		CANVAS_STYLE = {
			position: ABSOLUTE,
			left: 0,
			top: 0,
			padding: 0,
			border: 0,
			opacity: 1.0
		};
	
	Y.namespace('LogiXML.ChartFX').CanvasScreen = Y.Base.create('canvasScreen', Y.Base, [], {
		// Prototype Methods and Properties
		initializer : function(config) {
			var chartNode = this.get('chart'),
				constrainParameters = config.constrainParameters,
				chartDimensions = ImageUtils.getDimensions( chartNode );
				
			this._wrapper = this._createWrapper( chartDimensions );
			this._canvasDOM = this._createCanvas( chartDimensions, constrainParameters ).getDOMNode();
		},
		
		destructor : function() {
			var chartNode = this.get( 'chart' ),
			canvasNode = this.get( 'canvas' );
			
			// Restore opacity of chart and remove background image on wrapper
			chartNode.setStyle( 'opacity', 1.0 );
			
			// Make sure wrapper and canvas node are still there
			if ( this._wrapper.getDOMNode() ) {
				this._wrapper.setStyle( 'background', '' );
			}
			if ( canvasNode.getDOMNode() ) {
				canvasNode.remove( true );
			}
			
			ImageUtils.unwrapImage( chartNode );
		},
		
		_createCanvas : function( chartDimensions, constrainParameters ) {
			var canvasNode = document.createElement( 'canvas' ),
				chartNode = this.get('chart'),
				canvasLocation = this.get('canvasLocation'),
				canvasStyles = CANVAS_STYLE;
			
			canvasNode = Y.Node( canvasNode );
			
			if ( canvasLocation === 'wrapper' ) {
				this._wrapper.prepend( canvasNode );
			}
			else {
				chartNode.insert( canvasNode, 'before' );
			}
			
			// If browser doesn't support canvas, IE7 and 8, use excanvas to add it
			if ( !LogiXML.features.canvas ) {
				G_vmlCanvasManager.initElement( canvasNode.getDOMNode() );
			}
			
			// Constraint parameters were passed in, therefore adjust canvas size and position
			if ( Lang.isValue( constrainParameters ) ) {
				canvasStyles = Y.merge( canvasStyles, { 'left': constrainParameters.x, 'bottom': constrainParameters.y, 'top': '' } );
				chartDimensions.width = constrainParameters.width;
				chartDimensions.height = constrainParameters.height;
			}			
			
			canvasNode.setStyles( canvasStyles );
			// This is important, you have to apply width and height directly to the canvas.
			// Adding width/height via styles won't work
			canvasNode.getDOMNode().width = chartDimensions.width;
			canvasNode.getDOMNode().height = chartDimensions.height;
			
			this._set( 'canvas', canvasNode );
			
			return canvasNode;
		},
		
		_createWrapper : function( chartDimensions ) {
			var chartNode = this.get('chart'),
				divWrapper;
				
			// We need to wrap the image with a div wrapper to allow absolute positioning	
			divWrapper = ImageUtils.wrapImage( chartNode );
			divWrapper.setStyles( this._getWrapperStyles( chartNode, chartDimensions ) );
			
			chartNode.setStyles( this._getChartStyles() );
			
			return divWrapper;
		},
		
		_getChartStyles : function() {
			// Make chart invisible and absolute positioned
			return Y.merge( { 'opacity': 0 }, CHART_STYLE );
		},
		
		_getWrapperStyles : function( chartNode, chartDimensions ) {
			// Wrapper background is set to url of the chart while chart is hidden
			// Crazy yes, but the area maps won't be clickable unless the chart is technically
			// shown.  Shapes drawn onto the canvas won't appear if the image isn't invisible 
			return Y.merge( {
					width: chartDimensions.width + PX,
					height: chartDimensions.height + PX,
					background: 'url("' + chartNode.get('src') + '") no-repeat scroll 0 0 transparent'
				},
				WRAPPER_STYLE );
		},
		
		clearCanvas : function() {
			var canvasDomNode = this._canvasDOM,
				context = canvasDomNode.getContext('2d');
				
			context.clearRect( 0, 0, canvasDomNode.width, canvasDomNode.height );
			return context;
		},
		
		getCanvasContext : function() {
			return this._canvasDOM.getContext('2d');
		},
		
		getWrapper : function() {
			return this._wrapper;
		}
	}, {
		NAME: 'canvasScreen',
		CSS_PREFIX: 'canvasScreen',
		ATTRS: {
			canvas: {
				setter: Y.one,
				readOnly: true
			},
			
			canvasLocation: {
				value: 'chart',
				validator: Lang.isString
			},
			
			chart: {
				setter: Y.one,
				validator: function( val ) {
					var node = Y.one( val );
					return node instanceof Y.Node && node.get('tagName') === 'IMG';
				}
			}
		}
	});
	
}, '1.0.0', {requires: ['dom', 'node-base', 'base', 'image-utils'] });