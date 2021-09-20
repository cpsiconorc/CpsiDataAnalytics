// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false, console: false */

/*
 * Mouse Tracker tracks the user's mouse position across a chart and 
 * relates that position to areas provided in the chart's image map.
 *
 * This only works along the horizontal(X) axis and assumes your data points 
 * share the same axis values across all data series.  Which is normally line and area charts.
 * 
 */
YUI.add('chartfx-mouse-tracker', function(Y) {
	//"use strict";
	
	var Lang = Y.Lang,
		ImageUtils = Y.LogiXML.Image,
		isValue = Lang.isValue,
		isStringNotBlank = LogiXML.String.isNotBlank,
		ChartFX = Y.namespace('LogiXML.ChartFX'),
		
		TRACKER_CHANGE = 'tracker:change',
		AREA_RECTANGLE = 'rect',
		AREA_POLYGON = 'poly',
		AREA_CIRCLE = 'circ',
		PLOT_EDGE = 'data-plot-edge',
		LEFT = 'left',
		RIGHT = 'right',
		LEGEND_FLAG = ImageUtils.Map.LEGEND_FLAG,
		SERIES_ID_ATTRIBUTE = ImageUtils.Map.SERIES_ID_ATTRIBUTE;
	
	var coordinateValidator = function( val ) {
		return Lang.isNumber( val ) && val >= 0;
	};
	
	/* ------------ Node Point ------------ */
	// Individual nodes and the their center xy point
	var NodePoint = Y.Base.create('NodePoint', Y.Base, [], {
		initializer : function(config) {
			if ( !Lang.isValue( this.get('node') ) ) {
				Y.error('"node" config attribute is required.');
			}
		}
	}, {
		NAME: 'nodePoint',
		ATTRS: {
			// YUI Node of whatever object to keep track of
			node: {
				setter: Y.one
			},
			
			// XY value of where to render
			xy: {
				value: { x: 0, y: 0},
				validator: function( val ) {
					if ( Lang.isObject( val ) ) {
						return coordinateValidator( val.x ) && coordinateValidator( val.y );
					}
					return false;
				}
			}
		}
	});



	/* ------------ Vertical Slice ------------ */
	// Represents an imaginary vertical line at one point along the X axis, contains
	// all nodes imaginary line would intersect.
	var VerticalSlice = Y.Base.create('VerticalSlice', Y.Base, [], {
	
		initializer : function(config) {
			var nodePoint = config.nodePoint;
			if ( Lang.isValue( nodePoint ) && nodePoint instanceof NodePoint ) {
				this.addNodePoint( nodePoint );
			}
		},
		
		destructor : function() {
			// Clear array of node points
			var nodePoints = this.get('nodePoints'),
				node, i;
			
			for ( i = nodePoints.length - 1; i >= 0; i -= 1 ) {
				node = nodePoints[i];
				if ( typeof node.destroy === 'function' )
				{
					node.destroy();
				}
				nodePoints.splice(i, 1);
			}
		},
		
		addNodePoint : function( node ) {
			if ( node instanceof NodePoint ) {
				var nodePoints = this.get('nodePoints');
				nodePoints.push( node );
				return true;
			}
			return false;
		}
	}, {
		NAME: 'verticalSlice',
		ATTRS: {
			// Min value along X axis
			minAxisValue: {
				validator: coordinateValidator,
				writeOnce: true
			},
			
			// Max value along X axis
			maxAxisValue: {
				validator: coordinateValidator,
				writeOnce: true
			},
			
			// If a line chart has multiple series, then there will be multiple Nodes at every axis series point
			nodePoints: {
				value: [],
				validator: function( val ) {
					return Lang.isArray( val );
				},
				readOnly: true
			}
		}
	});



	/* ------------ Mouse Tracker ------------ */
	var MouseTracker = Y.Base.create('MouseTracker', Y.Base, [], {
		// Prototype Methods and properties
		
		initializer : function(config) {
			var chart = this.get('chart');
			this._mapNode = ImageUtils.getMapfromImage( chart );
			
			if ( !Lang.isValue( chart ) ) {
				Y.error('"chart" attribute is required.');
				return;
			}
			
			this._currentSlice = null;
			this._lookupTable = null;
			
			this._customEvents = {};
			this._publishCustomEvents();
			
			this._handles = {};
			this._bindEvents();
			
			// Build lookup table after full initialization is completed, aka child classes
			this.onceAfter( 'initializedChange', Y.bind( this._buildLookupArray, this, chart ), this );
		},
		
		destructor : function() {
			var regionArray = this._lookupTable,
				region, i;
				
			this._clearHandles();
			this._removeCustomEvents();
			
			// Clear array of region points
			for ( i = regionArray.length - 1; i >= 0; i =- 1 ) {
				region = regionArray[i];
				if ( region && typeof region.destroy === 'function' )
				{
					region.destroy();
				}
				regionArray.splice(i, 1);
			}
		},
		
		_publishCustomEvents : function() {
			var customEvents = this._customEvents;
			
			customEvents.sliceChange = this.publish( TRACKER_CHANGE, {
				queuable: false,
				emiteFacade: true,
				bubbles: true,
				prefix: 'tracker'
			});
		},
		
		_bindEvents : function() {
			var handles = this._handles,
				chartNode = this.get('chart');
			
			handles.imgMouseMove = chartNode.on('mousemove', this._onMouseMove, this);
			handles.mapMouseMove = this._mapNode.on('mousemove', this._onMouseMove, this);
		},
		
		_removeCustomEvents : function() {
			Y.each( this._customEvents, function(item) {
				if ( item ) {
					item.detachAll();
					item = null;
				}
			});
		},
		
		_clearHandles : function() {
			Y.each( this._handles, function(item) {
				if ( item ) {
					item.detach();
					item = null;
				}
			});
		},
		
		_onMouseMove : function(ev) {
			var offset = Math.round( Y.DOM.getXY( this.get('chart').getDOMNode() )[0] ),
				x = ev.pageX - offset,
				slice = this._lookupTable[x];
			
			if ( slice !== this._currentSlice ) {
				this._currentSlice = slice;
				
				this.fire( TRACKER_CHANGE, {
					slice: slice,
					moveEV: ev
				});
			}
		},
		
		_buildLookupArray : function( chart ) {
			var width;
			
			// Create array with size set to width of image
			width = chart.get('width');
			// Image pixels are 1 based, array is 0 based.  Add 1 to make life easier
			this._lookupTable = new Array( width + 1 );
			
			// Figure out which nodes are edge nodes
			this.determineEdgeNodes();
			/*
			 * Go through all areas
			 * - determine left and right most points
			 * - determine center of area
			 * - For each region of the chart area occupies, add itself to region array
			 */
			this._mapNode.all('area').each( function( area ) {
				
				if ( this.isAreaInvalid( area ) ) {
					return;
				}
				
				var region = MouseTracker.calculateAreaRegion( area ),
					centerPoint = this.calculateCenterofArea( area, region ),
					nodePoint = new NodePoint({ node: area, xy: centerPoint });
					
				this._addNodePoint( nodePoint, region );
			}, this );
		},
		
		isAreaInvalid : function( area ) {
			// Skip legend areas and those which aren't part of a data series
			if ( area.hasAttribute( LEGEND_FLAG ) || !area.hasAttribute( SERIES_ID_ATTRIBUTE ) ) {
				return true;
			}
			
			// Skip areas which don't match the chart's type.  Aka add bars to line chart
			var chartType = this.get( 'chartType' ),
				chartSeriesTypes = this.get( 'chartSeriesTypes' ),
				seriesID = area.getAttribute( SERIES_ID_ATTRIBUTE );
			
			if ( isStringNotBlank( seriesID ) && chartSeriesTypes.length > 1 ) {
				seriesID = parseInt( seriesID, 10 );
				if ( !isNaN( seriesID ) && chartType !== chartSeriesTypes[seriesID - 1].toLowerCase() ) {
					return true;
				}
			}
			
			return false;
		},
		
		_addNodePoint : function( nodePoint, region ) {
			var lookupTable = this._lookupTable,
				startVerticalSlice, endVerticalSlice,
				clippedRegion, slice, i, end;
			
			// Clip the regions so our lookups are always within plot area
			clippedRegion = this.clipRegion( region );
			
			// Lookup slices
			startVerticalSlice = lookupTable[region.minX];
			endVerticalSlice = lookupTable[region.maxX];
			
			/*
			 * Sometimes image maps overlap, which is ok, but we need to make sure nodes
			 * only render in one vertical slice.  This matches up with the W3C spec, 
			 * http://www.w3.org/TR/html4/struct/objects.html#edef-MAP, when image maps
			 * overlap the earliest area to appear in the document responds to user input.
			 */
			// Slices match up so region is fine. Add nodePoint and we're done
			if ( Lang.isValue( startVerticalSlice ) && startVerticalSlice === endVerticalSlice ) {
				startVerticalSlice.addNodePoint( nodePoint );
				return;
			}
			
			// Make sure start and end X axis values are OK
			if ( Lang.isValue( endVerticalSlice ) ) {
				// Found a slice at the end of x axis range, did we overlap?
				if ( region.maxX !== endVerticalSlice.get('maxAxisValue') && region.maxX >= endVerticalSlice.get('minAxisValue') ) {
					// Yeap, shift out of overlap
					region.maxX = endVerticalSlice.get('minAxisValue') - 1;
					endVerticalSlice = lookupTable[region.maxX];
				}
			}
			
			if ( Lang.isValue( startVerticalSlice ) ) {
				// Found a slice at the beginning of x axis range, did we overlap?
				if ( region.minX !== startVerticalSlice.get('minAxisValue') && region.minX <= startVerticalSlice.get('maxAxisValue') ) {
					// Yeap, shift out of overlap
					region.minX = startVerticalSlice.get('maxAxisValue') + 1;
					startVerticalSlice = lookupTable[region.minX];
				}
			}
			
			// Slices match up so region is fine. Add nodePoint and we're done
			if ( Lang.isValue( startVerticalSlice ) && startVerticalSlice === endVerticalSlice ) {
				startVerticalSlice.addNodePoint( nodePoint );
			}
			// Is this the first insert for vertical slice?
			else if ( !Lang.isValue( startVerticalSlice ) && !Lang.isValue( endVerticalSlice ) ) {
				slice = new VerticalSlice({
					minAxisValue : region.minX,
					maxAxisValue : region.maxX,
					nodePoint : nodePoint
				});
				
				
				end = slice.get('maxAxisValue');
				for ( i = slice.get('minAxisValue'); i <= end; i += 1 ) {
					lookupTable[i] = slice;
				}
			}
		},
		
		/*
		 * Sometimes the area region goes beyond plot area.  Which is fine, just need
		 * to clip region dimensions so everything stays within bounds.
		 */
		clipRegion : function( region, plotAttributes ) {
			plotAttributes = plotAttributes || this.get( 'plotAttributes' );
			
			if ( region.minX < plotAttributes.x ) {
				region.minX = plotAttributes.x;
			}
			
			if ( region.maxX > plotAttributes.x + plotAttributes.width ) {
				region.maxX = plotAttributes.x + plotAttributes.width;
			}
			
			return region;
		},
		
		// Pass in extra paramters in case someone wants to override
		calculateCenterofArea : function( area, region, coordinates ) {
			return {
				x: (region.maxX - region.minX) / 2 + region.minX,
				y: (region.maxY - region.minY) / 2 + region.minY
			};
		},
		
		resetState : function() {
			this._currentSlice = null;
		},
		
		determineEdgeNodes : function() {
			var leftMostNodes = [],
				rightMostNodes = [],
				leftRegion = [],
				rightRegion = [],
				leftNode, rightNode;
				
			// Go through all nodes and find which lie on the plot edges
			this._mapNode.all('area').each( function( area ) {
				
				if ( this.isAreaInvalid( area ) ) {
					return;
				}
				
				var seriesID = area.getAttribute( SERIES_ID_ATTRIBUTE ),
					region = MouseTracker.calculateAreaRegion( area );
				
				leftNode = leftMostNodes[seriesID];
				rightNode = rightMostNodes[seriesID];
				
				// First node found for this series
				if ( !isValue( leftNode ) ) {
					leftMostNodes[seriesID] = area;
					leftRegion[seriesID] = region;
					rightMostNodes[seriesID] = area;
					rightRegion[seriesID] = region;
					return;
				}
				
				// Is area further left?
				if ( region.minX < leftRegion[seriesID].minX ) {
					leftMostNodes[seriesID] = area;
					leftRegion[seriesID] = region;
				}
				// Is area further right?
				else if ( region.maxX > rightRegion[seriesID].maxX ) {
					rightMostNodes[seriesID] = area;
					rightRegion[seriesID] = region;
				}
			}, this );
			
			Y.Array.each( leftMostNodes, function( item, index ) {
				leftMostNodes[index].setAttribute( PLOT_EDGE, LEFT );
				rightMostNodes[index].setAttribute( PLOT_EDGE, RIGHT );
			});
		}
	}, {
		NAME: 'mouseTracker',
		ATTRS: {
			chart: {
				value: null,
				setter: Y.one,
				validator: function( val ) {
					var node = Y.one( val );
					return node instanceof Y.Node && node.get('tagName') === 'IMG';
				}
			},
			chartType: {
				/* value: string */
				writeOnce: true
			},
			chartSeriesTypes: {
				/* value: array of strings */
				writeOnce: true
			},
			plotAttributes: {
				writeOnce: true
			}
		},
		
		// Determine area's region
		calculateAreaRegion : function( area, coords ) {
			var coordinates = coords || ImageUtils.Map.parseAreaCoordinates( area ),
				shape = area.getAttribute( 'shape' ),
				region = {},
				x, y, i, length, left, right, top, bottom;
			
			if ( !Y.Lang.isString( shape ) ) {
				return undefined;
			}
			shape = shape.toLowerCase();
			
			if ( shape === AREA_RECTANGLE ) {
				region.minX = coordinates.leftX;
				region.maxX = coordinates.rightX;
				region.minY = coordinates.topY;
				region.maxY = coordinates.bottomY;
			}
			else if ( shape === AREA_POLYGON ) {
				length = coordinates.length;
				left = coordinates[0].x;
				right = left;
				top = coordinates[0].y;
				bottom = top;
				
				for ( i = 1; i < length; i += 1 ) {
					x = coordinates[i].x;
					y = coordinates[i].y;
					if ( x < left ) {
						left = x;
					}
					else if ( x > right ) {
						right = x;
					}
					if ( y < top ) {
						top = y;
					}
					else if ( y > bottom ) {
						bottom = y;
					}
				}
				
				region.minX = left;
				region.maxX = right;
				region.minY = top;
				region.maxY = bottom;
			}
			else if ( shape === AREA_CIRCLE ) {
				region.minX = coordinates.x - coordinates.radius;
				region.maxX = coordinates.x + coordinates.radius;
				region.minY = coordinates.y - coordinates.radius;
				region.maxY = coordinates.y + coordinates.radius;
			}
			
			return region;
		}
	});
	ChartFX.MouseTracker = MouseTracker;
}, '1.0.0', {requires: ['dom-base', 'dom-screen', 'node-base', 'base', 'event-move', 'image-utils'] });