// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false */

YUI.add('chartfx-highlight', function(Y) {
	//"use strict";
	
	var AttributeHelpers = Y.LogiXML.Attribute,
		CanvasUtils = Y.LogiXML.Canvas,
		ColorUtils = Y.LogiXML.Color,
		ImageUtils = Y.LogiXML.Image,
		isStringNotBlank = LogiXML.String.isNotBlank,
		Lang = Y.Lang,
		isValue = Lang.isValue,
		
		ChartFX = Y.namespace('LogiXML.ChartFX'),
		CLASS_KEY = 'chartfx-highlight',
		DISABLE_HIGHLIGHT_CLASS = 'disable-highlight', // Disable highlight on individual items
		AREA_RECTANGLE = 'rect',
		PX = 'px',
		LABEL_FLAG = ImageUtils.Map.LABEL_FLAG,
		LEGEND_FLAG = ImageUtils.Map.LEGEND_FLAG,
		PLOT_EDGE = 'data-plot-edge',
		LEFT = 'left',
		HIGHLIGHT_PROCESS_FLAG = 'data-highlight-processed',
		SERIES_ID_ATTRIBUTE = ImageUtils.Map.SERIES_ID_ATTRIBUTE,
		CHART_TYPE_ATTRIBUTE = 'data-charttype',
		HEATMAP_GROUP_ATTRIBUTE = 'data-heatmap-grouping',
		
		// Juice color
		EMPHASIS2 = '#5b5b5b',
		WHITE = '#ffffff',
		
		VERTICAL_BAR_STYLE = {
			display: 'block',
			background: 'none repeat scroll 0 0 ' + EMPHASIS2,
			position: 'absolute',
			left: 0,
			bottom: 0,
			padding: 0,
			border: 0,
			margin: 0,
			width: '1px',
			height: '1px'
		};
	
	// Register Highlight class with custom destroy code
	Y.LogiXML.Node.destroyClassKeys.push( CLASS_KEY );
	
	var Highlight = Y.Base.create('Highlight', Y.Base, [], {
		// Prototype Methods and properties
		
		initializer : function() {
			var chartNode = this.get('chart');
			
			this._mapNode = ImageUtils.getMapfromImage( chartNode );
			ImageUtils.wrapImage( chartNode );
			
			this._parseHTMLConfig( this._mapNode, chartNode );
			
			// Create canvas screen
			this._canvasScreen = this._createCanvasScreen();
			
			// Setup mouseover events for areas
			this._handles = {};
			this._trigger = {};
			this._trigger.node = null;
			this._trigger.mouseLeaveHandle = null;
			this._bindEvents();
			
			chartNode.setData( CLASS_KEY, this );
			this._mapNode.setAttribute( HIGHLIGHT_PROCESS_FLAG, true );
		},
		
		destructor : function() {
			// Remove event handles
			this._clearHandles();
			
			// Delete canvas screen
			this._canvasScreen.destroy();
			
			// Remove wrapper if need be
			if ( !this._unwrapDone ) {
				ImageUtils.unwrapImage( this.get('chart') );
			}
		},
		
		_parseHTMLConfig : function( mapNode, chartNode ) {
			var plotAttributes = mapNode.getAttribute( 'data-plotAttributes' ).split(',');
			
			this._chart3D = AttributeHelpers.booleanSetter( mapNode.getAttribute( 'data-chart3d' ) );
			this._chartType = mapNode.getAttribute( CHART_TYPE_ATTRIBUTE ).toLowerCase();
			this._chartSeriesTypes = mapNode.getAttribute( 'data-series-types' ).split(',');
			
			this.set( 'fillColor', mapNode.getAttribute( 'data-highlight-fill-color' ) );
			this.set( 'opacity', mapNode.getAttribute( 'data-highlight-opacity' ) );
			this._set('plotAttributes', {
				x: parseInt( plotAttributes[0], 10 ),
				y: parseInt( plotAttributes[1], 10 ),
				width: parseInt( plotAttributes[2], 10 ),
				height: parseInt( plotAttributes[3], 10 )
			});
		},
		
		_createCanvasScreen : function( constrain ) {
			var canvasScreen;
			if ( constrain ) {
				canvasScreen = new ChartFX.CanvasScreen({
					chart: this.get( 'chart' ),
					constrainParameters: this.get( 'plotAttributes' )
				});
			}
			else {
				canvasScreen = new ChartFX.CanvasScreen({
					chart: this.get( 'chart' )
				});
			}
			
			return canvasScreen;
		},
		
		_bindEvents : function() {
			var handles = this._handles;
			handles.mouseEnter = Y.delegate( 'mouseenter', this._onMouseEnter, this._mapNode, 'area', this );
			handles.mouseClick = Y.delegate( 'click', this._onMouseClick, this._mapNode, 'area', this );
			this._addResizeEvents();
		},
		
		_addResizeEvents : function() {
			var handles = this._handles,
				chartNode = this.get('chart');
				
			handles.chartResizeStart = chartNode.on( 'resize:start', this._onChartResizeStart, this );
			handles.chartResizeEnd = chartNode.on( 'resize:end', this._onChartResizeEnd, this );
		},
		
		_clearHandles : function() {
			var handles = this._handles;
			
			Y.each( handles, function(item) {
				if ( item ) {
					item.detach();
					item = null;
				}
			});
		},
		
		_onMouseEnter : function( e ) {
			var node = e.currentTarget,
				currentTriggerNode = this._trigger.node,
				seriesID, seriesTypes;
			
			// Highlight disabled?
			if ( node.hasClass( DISABLE_HIGHLIGHT_CLASS ) ) {
				return;
			}
			
			// Ignore areas which are just labels(Pie Charts) or legends
			if ( node.hasAttribute( LABEL_FLAG ) || node.hasAttribute( LEGEND_FLAG ) ) {
				node.addClass( DISABLE_HIGHLIGHT_CLASS );
				return;
			}
			
			// Does the area's data series match chart type? Aka did someone add line(s) to a bar chart?
			// We don't support highlighting of different chart types at the same time, plus it doesn't make sense.
			seriesID = node.getAttribute( SERIES_ID_ATTRIBUTE );
			seriesTypes = this._chartSeriesTypes;
			if ( isStringNotBlank( seriesID ) && seriesTypes.length > 1 ) {
				seriesID = parseInt( seriesID, 10 );
				if ( !isNaN( seriesID ) && this._chartType !== seriesTypes[seriesID - 1].toLowerCase() ) {
					return;
				}
			}
			
			if ( node && (!currentTriggerNode || !node.compareTo(currentTriggerNode)) ) {
				this._setTriggerNode( node );
				
				// Render Highlight
				this._highlightAreaMapShape( node );
			}
		},
		
		_onMouseLeave : function() {
			this._clearTriggerNode();
			this._canvasScreen.clearCanvas();
		},
		
		// We mainly do this so highlight is cleared after chart selection click
		_onMouseClick : function() {
			this._clearTriggerNode();
			this._canvasScreen.clearCanvas();
		},
		
		_onChartResizeStart : function() {
			// Restore chart opacity and remove chart from background of wrapper
			var chartNode = this.get( 'chart' );
			chartNode.setStyle( 'opacity', 1.0 );
			//this._canvasScreen.getWrapper().setStyle( 'background', 'none repeat scroll 0 0 transparent' );
			this._canvasScreen.destroy();
			ImageUtils.unwrapImage( chartNode );
			this._unwrapDone = true;
		},
		
		_onChartResizeEnd : function() {
			ChartFX.Highlight.reinitializeAfterResize( this.get('chart'), this );
		},
		
		_setTriggerNode : function( node ) {			
			this._trigger.mouseLeaveHandle = node.on( 'mouseleave', this._onMouseLeave, this );
			this._trigger.node = node;
		},
		
		_clearTriggerNode : function() {
			this._trigger.node = null;
			
			if ( this._trigger.mouseLeaveHandle ) {
				this._trigger.mouseLeaveHandle.detach();
				this._trigger.mouseLeaveHandle = null;
			}
		},
		
		// Default implementation just follows the area map
		_highlightAreaMapShape : function( areaNode ) {
			var shape = areaNode.getAttribute( 'shape' ),
				coordinates = ImageUtils.Map.parseAreaCoordinates( areaNode ),
				context;
				
			if ( !Y.Lang.isValue( coordinates ) ) {
				return;
			}
			
			if ( !Y.Lang.isString( shape ) ) {
				return;
			}
			
			this._canvasScreen.clearCanvas();
			context = this._canvasScreen.getCanvasContext();
			
			context.save();
			context.fillStyle = ColorUtils.hexToCSS_RGB( this.get('fillColor'), this.get('opacity') );
			CanvasUtils.drawAreaMapShape( context, areaNode );
			context.fill();
			context.restore();
		},
		
		// Transform a client side coordinate into server side version, aka 0,0 in top left to 0,0 in bottom left
		convertClientToServerCoordinate : function( coordinate ) {
			var plotAttributes = this.get( 'plotAttributes' ),
				chartHeight = this.get( 'chart' ).get( 'height' ),
				transformedCoordinate = {};
			
			transformedCoordinate.x = coordinate.x - plotAttributes.x;
			// Original Y - Yt(distance from top)
			// Yt = ImageHeight - Yb(distance from bottom) - PlotHeight
			transformedCoordinate.y = coordinate.y - (chartHeight - plotAttributes.y - plotAttributes.height);
			
			return transformedCoordinate;
		}
	}, {
		NAME: 'highlight',
		ATTRS: {
			chart: {
				setter: Y.one,
				validator: function( val ) {
					var node = Y.one( val );
					return node instanceof Y.Node && node.get('tagName') === 'IMG';
				}
			},
			
			fillColor: {
				value: WHITE,
				validator: isStringNotBlank
			},
			
			opacity: {
				value: 0.2,
				validator: LogiXML.opacityValidator
			},
			
			// Contains several values related to the plotting region of the chart, look at _parseHTMLConfig for more info
			plotAttributes: {
				readOnly: true
			}
		}
	});
	
	
	
	/* ----------- Bar Chart ----------- */
	var BarChart = function() {
		BarChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( BarChart, Highlight, {
	
		// Override
		_onMouseEnter : function( e ) {
			var node = e.currentTarget;
			
			// Ignore areas which aren't part of a data series
			if ( !node.hasAttribute( SERIES_ID_ATTRIBUTE ) ) {
				return;
			}
			
			BarChart.superclass._onMouseEnter.call( this, e );
		}
	}, {
		NAME: 'HighlightBarChart'
	});
	
	
	
	/* ----------- HeatMap ----------- */
	var Heatmap = function() {
		Heatmap.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( Heatmap, Highlight, {
	
		// Override
		_onMouseEnter : function( e ) {
			var node = e.currentTarget;
			
			// Ignore areas which are just group titles
			if ( node.hasAttribute( HEATMAP_GROUP_ATTRIBUTE ) ) {
				return;
			}
			
			Heatmap.superclass._onMouseEnter.call( this, e );
		}
	}, {
		NAME: 'HighlightHeatmap'
	});
	
	
	/* ----------- Pie Chart ----------- */
	var PieChart = function() {
		PieChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( PieChart, Highlight, {
	
		// Override
		_parseHTMLConfig : function( mapNode, chartNode ) {
			PieChart.superclass._parseHTMLConfig.call( this, mapNode, chartNode );
			
			var settings = ImageUtils.Map.parsePieChartRenderSettings( mapNode );
			
			if ( Y.Lang.isValue( settings ) ) {
				this._ellipsePie = settings.ellipsePie;
				this._pieCenter = settings.pieCenter;
				this._pieRadius = settings.pieRadius;
				this._pieInnerRadius = settings.pieInnerRadius;
			}
			else {
				return false;
			}
		},
		
		// Override
		_highlightAreaMapShape : function( areaNode ) {
			var context;
			
			// Pie is shaped like ellipsis, use default render method
			if ( this._ellipsePie ) {
				PieChart.superclass._highlightAreaMapShape.call( this, areaNode );
				return;
			}
			
			context = this._canvasScreen.getCanvasContext();
			this._canvasScreen.clearCanvas();
			
			context.save();
			context.fillStyle = ColorUtils.hexToCSS_RGB( this.get('fillColor'), this.get('opacity') );
			CanvasUtils.drawPieWedgeFromArea( context, areaNode, this._pieCenter, this._pieRadius, this._pieInnerRadius );
			context.fill();
			context.restore();
		}
	}, {
		NAME: 'HighlightPieChart'
	});
	
	
	
	/* ----------- Scatter Chart ----------- */
	var ScatterChart = function() {
		ScatterChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( ScatterChart, Highlight, {
		initializer : function() {
			this._parseHTMLConfig_ScatterChart();
		},
		
		// I would like to override _parseHTMLConfig, but then it will run during parent class initializer
		// Then Scatter class ATTRS will be processed and override the settings I'm parsing here
		_parseHTMLConfig_ScatterChart : function() {
			this.set( 'borderColor', this._mapNode.getAttribute( 'data-highlight-border-color' ) );
			this.set( 'borderWidth', parseFloat( this._mapNode.getAttribute( 'data-highlight-border-width' ) ) );
		},
		
		// Override, force constrain of canvas
		_createCanvasScreen : function() {
			return ScatterChart.superclass._createCanvasScreen.call( this, true );
		},
		
		// Override
		_onMouseEnter : function( e ) {
			var node = e.currentTarget;
			
			// Ignore areas which aren't part of a data series
			if ( !node.hasAttribute( SERIES_ID_ATTRIBUTE ) ) {
				return;
			}
			
			ScatterChart.superclass._onMouseEnter.call( this, e );
		},
		
		// Override
		_highlightAreaMapShape : function( areaNode ) {
			/*
			 * Scatter/bubble plots are little weird, you render out bubbles but the area
			 * maps backing these bubbles are sqaures.  Oh well, calculate center and radius of
			 * circle from the square.
			 */
			var coordinates = ImageUtils.Map.parseAreaCoordinates( areaNode ),
				shape = areaNode.getAttribute( 'shape' ),
				borderWidth = this.get( 'borderWidth' ),
				center = {}, circleRadius, width, height,
				context;
			
			if ( !Y.Lang.isString( shape ) ) {
				return;
			}
			
			shape = shape.toLowerCase();
			if ( shape === AREA_RECTANGLE ) {
				width = coordinates.rightX - coordinates.leftX;
				height = coordinates.bottomY - coordinates.topY;
				
				// If for some reason this isn't a square but a rectangle, take the larger dimension as the radius
				if ( height > width ) {
					circleRadius = height / 2;
				}
				else {
					circleRadius = width / 2;
				}
				
				center.x = width / 2 + coordinates.leftX;
				center.y = height / 2 + coordinates.topY;
				
				// Canvas is constrained to plotting area of chart, adjust coordinates
				center = this.convertClientToServerCoordinate( center );
				
				this._canvasScreen.clearCanvas();
				context = this._canvasScreen.getCanvasContext();
				
				// Put border around bubble/circle
				context.save();
				context.beginPath();
				context.strokeStyle = ColorUtils.hexToCSS_RGB( this.get('borderColor'), this.get('opacity') );
				context.lineWidth = borderWidth;
				context.arc( center.x, center.y, circleRadius + 1.0 + borderWidth/2.0, 0, Math.PI*2, false );
				context.stroke();
				context.closePath();
				context.restore();
			}
			// If by chance we see another shape, use normal render method
			else {
				Highlight.superclass._highlightAreaMapShape.call( this, areaNode );
			}
		}
	}, {
		NAME: 'HighlightScatterChart',
		ATTRS: {
			borderColor: {
				value: EMPHASIS2,
				validator: isStringNotBlank,
				lazyAdd: false
			},
			borderWidth: {
				value: 2.0,
				validator: Lang.isNumber
			},
			opacity: {
				value: 1.0
			}
		}
	});
	
	
	
	/* ----------- Line Mouse Tracker ----------- */
	var LineMouseTracker = function() {
		LineMouseTracker.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( LineMouseTracker, ChartFX.MouseTracker, {
	
		// Override
		calculateCenterofArea : function( area, region ) {
			var centerPoint = ImageUtils.Map.calculateMiddleofLineChartArea( area, 'vertical' );
			
			if ( area.hasAttribute( PLOT_EDGE ) ) {
				centerPoint = this.correctCenterPointforEdges( centerPoint, area, area.getAttribute( PLOT_EDGE ) );
			}
			
			return centerPoint;
		},
		
		correctCenterPointforEdges : function( centerPoint, area, plotEdge ) {
			var uniquePoints, uniqueXKeys, uniqueYKeys,
				edgePoints, pointSet1, pointSet2, leftEdge;
			
			/*
			 *	There are 2 ways line charts end their area maps on the plot edges, either horizontal or
			 *	vertical.  The line itself lies in the middle of this edge.  We need to determine if edge
			 *	is horizontal or vertical.  Check for this by determining how many unique X and Y values
			 *	we have.
			 */
			uniquePoints = this.findUniquePoints( area );
			uniqueXKeys = Y.Object.keys( uniquePoints.x );
			uniqueYKeys = Y.Object.keys( uniquePoints.y );
			leftEdge = plotEdge === LEFT ? true : false;
			
			// Standard rectangle/square
			if ( uniqueXKeys.length === 2 && uniqueYKeys.length === 2 ) {
				uniquePoints = uniquePoints.x;
				pointSet1 = uniquePoints[uniqueXKeys[0]];
				pointSet2 = uniquePoints[uniqueXKeys[1]];
				
				if ( pointSet1[0].x < pointSet2[0].x ) {
					edgePoints = leftEdge ? pointSet1 : pointSet2;
				}
				else {
					edgePoints = leftEdge ? pointSet2 : pointSet1;
				}
				
				centerPoint.x = edgePoints[0].x;
			}
			/*
			 * 2 unique X values and 3-4 unique Y values
			 * 
			 *	|\
			 *	| \
			 *	\  \
			 *	 \ |
			 *	  \| 
			 */
			else if ( uniqueXKeys.length === 2 ) {
				uniquePoints = uniquePoints.x;
				pointSet1 = uniquePoints[uniqueXKeys[0]];
				pointSet2 = uniquePoints[uniqueXKeys[1]];
				
				// Which set of points is more to the left? X will be lower
				if ( pointSet1[0].x < pointSet2[0].x ) {
					edgePoints = leftEdge ? pointSet1 : pointSet2;
				}
				else {
					edgePoints = leftEdge ? pointSet2 : pointSet1;
				}
				centerPoint.x = edgePoints[0].x;
				centerPoint.y = (edgePoints[1].y - edgePoints[0].y) / 2 + edgePoints[0].y;
			}
			
			 /*
			 * 2 unique Y values and 3-4 unique X values
			 *	__
			 *  \ \
			 *	 \ \
			 *	  ¯¯
			 */
			else if ( uniqueYKeys.length === 2 ) {
				uniquePoints = uniquePoints.y;
				pointSet1 = uniquePoints[uniqueYKeys[0]];
				pointSet2 = uniquePoints[uniqueYKeys[1]];
				
				// Which set of points is more to the left?  Their sum of X values will be lower
				if ( pointSet1[0].x + pointSet1[1].x < pointSet2[0].x + pointSet2[1].x ) {
					edgePoints = leftEdge ? pointSet1 : pointSet2;
				}
				else {
					edgePoints = leftEdge ? pointSet2 : pointSet1;
				}
				centerPoint.x = (edgePoints[1].x - edgePoints[0].x) / 2 + edgePoints[0].x;
				centerPoint.y = edgePoints[0].y;
			}
			
			return centerPoint;
		},
		
		findUniquePoints : function( area ) {
			var coordinates = ImageUtils.Map.parseAreaCoordinates( area ),
				uniquePoints = { x: {}, y: {} },
				i, point, numberOfCoordinates;
			
			numberOfCoordinates = coordinates.length;
			for ( i = 0; i < numberOfCoordinates; i += 1 ) {
				point = coordinates[i];
				
				if ( !isValue( uniquePoints.x[point.x] ) ) {
					uniquePoints.x[point.x] = [];
				}
				uniquePoints.x[point.x].push( point );
				
				if ( !isValue( uniquePoints.y[point.y] ) ) {
					uniquePoints.y[point.y] = [];
				}
				uniquePoints.y[point.y].push( point );
			}
			
			return uniquePoints;
		}
	}, {
		NAME: 'LineMouseTracker'
	});
	
	/* ----------- Line Chart ----------- */
	var LineChart = function() {
		LineChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( LineChart, Highlight, {
	
		initializer : function() {
			var chartNode = this.get('chart'),
				tracker;
				
			this._parseHTMLConfig_LineChart();
			
			// Create vertical highlight bar
			this._createHighlightBar();
			
			// Track mouse in relation to area maps			
			tracker = this._createMouseTracker( chartNode );
			this._changeHandle = tracker.on( 'tracker:change', this._onTrackerChange, this );
			this._mouseLeaveHandle = chartNode.on( 'mouseleave', this._onMouseLeave, this );
			this._tracker = tracker;
		},
		
		destructor : function() {
			this._changeHandle.detach();
			this._changeHandle = null;
			
			this._mouseLeaveHandle.detach();
			this._mouseLeaveHandle = null;
			
			this._verticalBar.remove( true );
			this._tracker.destroy();
		},
		
		// Override
		_parseHTMLConfig : function( mapNode, chartNode ) {
			LineChart.superclass._parseHTMLConfig.call( this, mapNode, chartNode );
			
			var numberOfSeries = mapNode.getAttribute( 'data-series' ),
				seriesColors = mapNode.getAttribute( 'data-seriesColors' ).split(',');
			
			numberOfSeries = parseInt( numberOfSeries, 10 );
			
			// Make sure we have colors for all series
			if ( numberOfSeries !== seriesColors.length ) {
				this._useDefaultColor = true;
			}
			else {
				this._useDefaultColor = false;
				this._seriesColors = seriesColors;
			}
		},
		
		// I would prefer to do this in main HTML Config method, but it runs during parent class initializer.
		// When Line Chart ATTRS is created it would override the earlier settings
		_parseHTMLConfig_LineChart : function() {
			var mapNode = this._mapNode;
			
			this.set( 'borderColor', mapNode.getAttribute( 'data-highlight-border-color' ) );
			this.set( 'borderWidth', parseFloat( this._mapNode.getAttribute( 'data-highlight-border-width' ) ) );
			this.set( 'lineColor', mapNode.getAttribute( 'data-highlight-line-color' ) );
			this.set( 'circleRadius', parseFloat( this._mapNode.getAttribute( 'data-highlight-symbol-radius' ) ) );
		},
		
		// Override, force constrain of canvas
		_createCanvasScreen : function() {
			return LineChart.superclass._createCanvasScreen.call( this, true );
		},
		
		_createMouseTracker : function( chartNode ) {
			return new LineMouseTracker({
				chart: chartNode,
				plotAttributes: this.get( 'plotAttributes' ),
				chartType: this._chartType,
				chartSeriesTypes: this._chartSeriesTypes
			});
		},
		
		_createHighlightBar : function() {
			var div = Y.Node.create('<div></div>'),
				plotAttributes = this.get( 'plotAttributes' ),
				vertLineStyle = Y.merge( VERTICAL_BAR_STYLE, {
					'bottom' : plotAttributes.y + PX,
					'height' : plotAttributes.height + PX
				});
			
			div.setStyles( vertLineStyle );
			this._canvasScreen.get( 'canvas' ).insert( div, 'before' ); 
			div.hide();
			this._verticalBar = div;
		},
		
		// Override, don't want the default highlight events
		_bindEvents : function() {
			this._addResizeEvents();
		},
		
		_onTrackerChange : function(ev) {
			var slice = ev.slice;
			
			this._clearHighlight();
			
			if ( slice ) {
				this.highlightSlice( slice );
			}
		},
		
		_onMouseLeave : function(ev) {
			var tagName = "";
			
			if ( Lang.isValue( ev.relatedTarget ) ) {
				tagName = ev.relatedTarget.get('tagName').toLowerCase();
			}
			
			// If the previous target is an AREA, then we didn't really leave.  Just the mouseleave event
			// getting confused by areas
			if ( tagName !== 'area' ) {
				this._clearHighlight();
				this._tracker.resetState();
			}
		},
		
		highlightSlice : function( slice ) {
			var nodePoints = slice.get( 'nodePoints' ),
				verticalBar = this._verticalBar,
				lineColor = this.get( 'lineColor' ),
				x;
			
			// Use the points x value for determining where to render
			x = nodePoints[0].get('xy').x;
			verticalBar.setStyles({
				'left': x + PX,
				'backgroundColor': ColorUtils.hexToCSS_RGB( lineColor ),
				'opacity': this.get('opacity')
			});
			verticalBar.show();
			
			Y.each( nodePoints, function( point ) {
				this.highlightPoint( point );
			}, this );
		},
		
		highlightPoint : function( point ) {
			var context = this._canvasScreen.getCanvasContext(),
				xy = point.get( 'xy' ),
				node = point.get( 'node' ),
				seriesID = node.getAttribute( SERIES_ID_ATTRIBUTE ),
				highlightRadius = this.get( 'circleRadius' ),
				borderColor = this.get( 'borderColor' ),
				borderWidth = this.get( 'borderWidth' ),
				fillStyle;
			
			if ( this._useDefaultColor || LogiXML.String.isBlank( seriesID ) ) {
				fillStyle = '#000000';
			}
			else {
				seriesID = parseInt( seriesID, 10 );
				fillStyle = this._seriesColors[seriesID - 1];
			}
			
			// Canvas is constrained to plotting area of chart, adjust coordinates
			xy = this.convertClientToServerCoordinate( xy );
			
			// Fill with color of chart series
			context.save();
			context.fillStyle = ColorUtils.hexToCSS_RGB( fillStyle );
			context.beginPath();
			context.arc( xy.x, xy.y, highlightRadius, 0, Math.PI*2, false );
			context.closePath();
			context.fill();
			
			// Put border on circle
			context.strokeStyle = ColorUtils.hexToCSS_RGB( borderColor, this.get('opacity') );
			context.lineWidth = borderWidth;
			context.beginPath();
			context.arc( xy.x, xy.y, highlightRadius + borderWidth/2, 0, Math.PI*2, false );
			context.closePath();
			context.stroke();
			
			context.restore();
		},
		
		_clearHighlight : function() {
			this._canvasScreen.clearCanvas();
			this._verticalBar.hide();
		}
		
	}, {
		NAME: 'HighlightLineChart',
		ATTRS: {
			borderColor: {
				value: WHITE,
				validator: isStringNotBlank
			},
			borderWidth: {
				value: 2.0,
				validator: Lang.isNumber
			},
			circleRadius: {
				value: 3.0,
				validator: Lang.isNumber
			},
			lineColor: {
				value: EMPHASIS2,
				validator: isStringNotBlank
			},
			opacity: {
				value: 1.0
			}
		}
	});
	
	
	
	/* ----------- Area Mouse Tracker ----------- */
	var AreaMouseTracker = function() {
		AreaMouseTracker.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( AreaMouseTracker, ChartFX.MouseTracker, {
		
		// Override
		calculateCenterofArea : function( area, region ) {
			var centerPoint = ImageUtils.Map.calculateAreaChartHighlightPoint( area, 'vertical' );
			
			if ( area.hasAttribute( PLOT_EDGE ) ) {
				centerPoint = this.correctCenterPointforEdges( centerPoint, area, region );
			}
			return centerPoint;
		},
		
		correctCenterPointforEdges : function( centerPoint, area, region ) {
			var coordinates = ImageUtils.Map.parseAreaCoordinates( area ),
				shape = area.getAttribute( 'shape' ).toLowerCase(),
				numberOfCoordinates = coordinates.length,
				edgePoints = [],
				point, i, leftEdge, edgeX;
			
			leftEdge = area.getAttribute( PLOT_EDGE ) === LEFT ? true : false;
			edgeX = leftEdge ? region.minX : region.maxX;
			
			if ( shape === 'rect' ) {
				centerPoint.y = coordinates.topY;
				centerPoint.x = coordinates.leftX;
			}
			else {
				// Find edge points around polygon
				for ( i = 0; i < numberOfCoordinates; i += 1 ) {
					point = coordinates[i];

					if ( leftEdge && point.x === edgeX ) {
						edgePoints.push( point );
					}
					else if ( !leftEdge && point.x === edgeX ) {
						edgePoints.push( point );
					}
				}
				
				// Area chart polygons always have 2 points on the edge, we need the lower the y value, which is the taller of the 2 points
				centerPoint.y = Math.min( edgePoints[0].y, edgePoints[1].y );
				centerPoint.x = edgePoints[0].x;
			}
			
			return centerPoint;
		}
	}, {
		NAME: 'areaMouseTracker'
	});
	
	/* ----------- Area Chart ----------- */
	var AreaChart = function() {
		AreaChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( AreaChart, LineChart, {
		_createMouseTracker : function( chartNode ) {
			return new AreaMouseTracker({
				chart: chartNode,
				plotAttributes: this.get( 'plotAttributes' ),
				chartType: this._chartType,
				chartSeriesTypes: this._chartSeriesTypes
			});
		}
	}, {
		NAME: 'HighlightAreaChart'
	});
	
	ChartFX.Highlight = {};
	ChartFX.Highlight.PieChart = PieChart;
	ChartFX.Highlight.ScatterChart = ScatterChart;
	ChartFX.Highlight.LineChart = LineChart;
	ChartFX.Highlight.AreaChart = AreaChart;
	ChartFX.Highlight.DISABLE_HIGHLIGHT_CLASS = DISABLE_HIGHLIGHT_CLASS;
	
	ChartFX.Highlight.initializeAll = function() {
		var charts = Y.all( '.' + CLASS_KEY );
		
		if ( charts.size() !== 0 ) {
			charts.each( function( node ) {
				var usemap = ImageUtils.getChartMapName( node ),
					usemapNode = ImageUtils.getMapfromImage( node );
				node.removeClass( CLASS_KEY );
				
				if ( Y.Lang.isValue( usemap ) ) {					
					if (usemapNode)
						ChartFX.Highlight.initializeChart(node);
					else {
						// Wait for image map to load, then initialize Highlight effects
						// this = imgNode
						Y.once('contentready', ChartFX.Highlight.initializeChart, 'map[name=' + usemap + ']', this);
					}
				}
			});
		}
	};
	
	ChartFX.Highlight.initializeChart = function( node ) {
		var imgNode = node || this,
			mapNode = ImageUtils.getMapfromImage( imgNode ),
			chartType = mapNode.getAttribute( CHART_TYPE_ATTRIBUTE ) || '',
			highlight;
			
		if ( Y.Lang.isString( chartType ) ) {
			chartType = chartType.toLowerCase();
			
			if ( chartType === 'bar' ) {
				highlight = new BarChart({
					chart: imgNode
				});
			}
			else if ( chartType === 'heatmap' ) {
				highlight = new Heatmap({
					chart: imgNode
				});
			}
			else if ( chartType === 'pie' ) {
				ImageUtils.Map.checkForPieChartLabels( mapNode );
				highlight = new PieChart({
					chart: imgNode
				});
			}
			else if ( chartType === 'scatter' ) {
				highlight = new ScatterChart({
					chart: imgNode
				});
			}
			else if ( chartType === 'line' ) {
				highlight = new LineChart({
					chart: imgNode
				});
			}
			else if ( chartType === 'area' ) {
				highlight = new AreaChart({
					chart: imgNode
				});
			}
			// Use simple shape following for anything else really
			else {
				highlight = new Highlight({
					chart: imgNode
				});
			}
		}
	};
	
	/*
	 * Resizer currently works by changing the src attribute of images.  After loading new image, a
	 * new image map is pulled down as well.  We need to remove the old image map, as the name stays
	 * the same, otherwise we wouldn't know when the new one is loaded.  We also look for
	 * 'data-highlight-processed' attribute, it gets added during highlight initialization, to know
	 * whether this is the old image map or new one.
	 */
	ChartFX.Highlight.reinitializeAfterResize = function( node, highlightInstance ) {
		var usemap = ImageUtils.getChartMapName( node ),
			mapSelector = 'map[name=' + usemap + ']',
			map = Y.one( mapSelector );
		
		if ( map && map.hasAttribute( HIGHLIGHT_PROCESS_FLAG ) ) {
			map.remove( true );
		}
		
		// Destroy the old instance
		highlightInstance.destroy();
		
		// Wait for image map to load, then initialize Highlight
		Y.once( 'contentready', ChartFX.Highlight.initializeChart, mapSelector, node );
		
	};
	
	if ( LogiXML.Ajax.AjaxTarget ) {
		LogiXML.Ajax.AjaxTarget().on( 'reinitialize', ChartFX.Highlight.initializeAll );
	}
	
}, '1.0.0', {requires: ['dom-base', 'node-base', 'base', 'event', 'canvas-utils', 'color-utils', 'image-utils', 'node-custom-destroy', 'chartfx-canvas-screen', 'attribute-helpers', 'chartfx-mouse-tracker'] });
