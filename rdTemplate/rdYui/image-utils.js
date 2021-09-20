// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false, console: false, Image: false */

YUI.add('image-utils', function(Y) {
	//"use strict";
	
	var WRAPPER_CLASS = 'chartfx-wrapper',
		AttributeHelpers = Y.LogiXML.Attribute,
		imageNS = Y.namespace('LogiXML.Image'),
		isValue = Y.Lang.isValue,
		isNumber = Y.Lang.isNumber,
		isStringNotBlank = LogiXML.String.isNotBlank,
		WRAPPER_USAGE_COUNT = 'wrapUsageCount',
		ORIENTATION_VERTICAL = 'vertical',
		LEGEND_FLAG = 'data-islegend',
		LABEL_FLAG = 'data-islabel',
		SERIES_ID_ATTRIBUTE = 'data-seriesID',
		
	isYUI3Node = function( checkMe ) {
		// Normally you would use Y.instanceOf( node, Y.Node ), but this fails for Nodes created in different Node instances.
		return isValue( checkMe ) && !!checkMe.getDOMNode;
	};
	
	imageNS.wrapImage = function( imgNode ) {
		var wrapper = imgNode.get('parentNode'),
			usageCount;
		
		// See if parentNode is already wrapper
		if ( wrapper.get('tagName') !== 'DIV' || !wrapper.hasClass( WRAPPER_CLASS ) ) {
			imgNode.wrap('<div></div>');
			wrapper = imgNode.get('parentNode');
			wrapper.addClass( WRAPPER_CLASS );
			// TODO: add better code for keeping original styling of node, refer to resize-base.js for examples
		}
		
		/*
		 * Several classes use the image wrapping code, keep track of how many by storing a count on the the wrapper.
		 * This way when a class goes to cleanup it can check if wrapper is still needed
		 */
		usageCount = wrapper.getData( WRAPPER_USAGE_COUNT );
		if ( isNumber( usageCount ) ) {
			usageCount = usageCount + 1;
		}
		else {
			usageCount = 1;
		}
		wrapper.setData( WRAPPER_USAGE_COUNT, usageCount );
		
		return wrapper;
	};
	
	imageNS.unwrapImage = function( imgNode ) {
		var wrapper = imgNode.get('parentNode'),
			removeWrapper = false,
			usageCount;
		
		if ( isYUI3Node( wrapper ) && wrapper.hasClass( WRAPPER_CLASS ) ) {
			usageCount = wrapper.getData( WRAPPER_USAGE_COUNT );
			if ( isNumber( usageCount ) ) {
				usageCount = usageCount - 1;
				
				if ( usageCount === 0 ) {
					removeWrapper = true;
				}
			}
			else {
				removeWrapper = true;
			}
		}
		
		if ( removeWrapper ) {
			imgNode.unwrap();
			wrapper.destroy();
		}
	};
	
	imageNS.getImageFromMap = function( mapNode ) {
		if ( mapNode && mapNode instanceof Y.Node ) {
			return Y.one('img[usemap="#' + mapNode.getAttribute('name') + '"]');
		}
		return null;
	};
	
	imageNS.getChartMapName = function( element ) {
		var node, usemap;
		
		// YUI Node
		if ( isYUI3Node( element ) ) {
			node = element;
		}
		// DOM Node
		else if ( LogiXML.isDomNode( element ) ) {
			node = Y.one( element );
		}
		// Can't work with anything else
		else {
			return undefined;
		}
		
		// Not an IMG tag
		if ( node.get('tagName') !== 'IMG' ) {
			return undefined;
		}
		
		usemap = node.getAttribute('usemap');
		if ( usemap ) {
			usemap = usemap.split('#')[1];
			return usemap;
		}
		return undefined;
	};
	
	imageNS.getMapfromImage = function( element ) {
		var mapName = imageNS.getChartMapName( element );
		
		if ( mapName ) {
			return Y.one('map[name=' + mapName + ']');
		}
		return null;
	};
	
	imageNS.isImageLoaded = function( element ) {
		var node, naturalWidth;
		
		// YUI Node
		if ( isYUI3Node( element ) ) {
			node = element;
		}
		// DOM Node
		else if ( LogiXML.isDomNode( element ) ) {
			node = Y.one( element );
		}
		// Can't work with anything else
		else {
			return undefined;
		}
		
		// Not an IMG tag
		if ( node.get('tagName') !== 'IMG' ) {
			return undefined;
		}
		
		// Hack for IE 7/8
		if ( Y.UA.ie ) {
			return node.get('readyState') === 'complete';
		}
		// Good Browsers
		naturalWidth = node.get('naturalWidth');
		return !(typeof naturalWidth === 'undefined' || naturalWidth === 0 );
	};
	
	imageNS.getDimensions = function( element ) {
		var node = Y.one( element ),
			width, height, image;
		
		if ( isYUI3Node( node ) && node.get('tagName') === 'IMG' ) {
			width = node.get('width');
			height = node.get('height');
			
			// If the image is inside a container with display:none, aka popup panel, then IE won't
			// return the image's dimensions even though the image is loaded
			if ( width === 0 && height === 0 ) {
				// Normally I create elements through YUI, but IE doesn't create 
				// <img> tags correctly through document.createElement
				image = new Image();
				image.src = node.get('src');
				width = image.width;
				height = image.height;
			}
			
			return {
				width: width,
				height: height
			};
		}
		
		return undefined;
	};
	
	imageNS.Map = {};
	
	imageNS.Map.LEGEND_FLAG = LEGEND_FLAG;
	imageNS.Map.LABEL_FLAG = LABEL_FLAG;
	imageNS.Map.SERIES_ID_ATTRIBUTE = SERIES_ID_ATTRIBUTE;
	
	imageNS.Map.parsePieChartRenderSettings = function( mapNode ) {
		var node, _3dAngle, coordinates, pieRadius, pieInnerRadius,
			settings = {};
		
		// YUI Node
		if ( mapNode instanceof Y.Node ) {
			node = mapNode;
		}
		// DOM Node
		else if ( LogiXML.isDomNode( mapNode ) ) {
			node = Y.one( mapNode );
		}
		// Can't work with anything else
		else {
			return undefined;
		}
		
		settings.chart3D = AttributeHelpers.booleanSetter( mapNode.getAttribute('data-chart3d') );
		_3dAngle = parseInt( mapNode.getAttribute( 'data-3dAngle' ), 10 );
		settings._3dAngle = _3dAngle;
		
		// If the 3D Angle is greater than 0, then pie is shaped like an ellipse so rest of config is worthless
		if ( settings.chart3D && !isNaN( _3dAngle ) && _3dAngle > 0 ) {
			settings.ellipsePie = true;
			return settings;
		}
		settings.ellipsePie = false;
		
		// Parse X/Y coordinates for center of pie chart
		coordinates = mapNode.getAttribute( 'data-piecenter' );
		if ( !Y.Lang.isString( coordinates ) ) {
			return undefined;
		}
		coordinates = coordinates.split(',');
		if ( coordinates.length !== 2 ) {
			return undefined;
		}
		
		settings.pieCenter = {};
		settings.pieCenter.x = parseInt( coordinates[0], 10 );
		settings.pieCenter.y = parseInt( coordinates[1], 10 );
		
		// Parse radius of pie chart
		pieRadius = parseInt( mapNode.getAttribute('data-pieradius'), 10 );
		if ( isNaN( pieRadius ) ) {
			return undefined;
		}
		settings.pieRadius = pieRadius;
		
		// Parse inner radius, if one, of donut chart
		pieInnerRadius = mapNode.getAttribute( 'data-pieinnerradius' );
		if ( isStringNotBlank( pieInnerRadius ) ) {
			pieInnerRadius =  parseInt( pieInnerRadius, 10 );
			if ( !isNaN( pieRadius ) ) {
				settings.pieInnerRadius = pieInnerRadius;
			}
		}
		
		return settings;
	};
	
	/*
	 * Chart Director adds area for labels in Pie Charts.  Not sure why but we need to identify them
	 * so Highlighting and Selection code can work around them.
	 */
	imageNS.Map.checkForPieChartLabels = function( mapNode ) {
		var areaNodeList = mapNode.all( 'area' );
		
		areaNodeList.each( function( node ) {
			var shape = node.getAttribute( 'shape' );
			
			// Labels have rectangle shape and aren't flaggged as a legend item
			if ( isValue( shape ) && shape.toLowerCase() === 'rect' && !node.hasAttribute( LEGEND_FLAG ) ) {
				node.setAttribute( LABEL_FLAG, true );
			}
		}, this );
	};
	
	imageNS.Map.parseAreaCoordinates = function( areaNode ) {
			
		var node, coordinateString, areaType, coordinates,
			numerofCoordinates,
			coordinatePairs = [], i;

		// YUI Node
		if ( isYUI3Node( areaNode ) ) {
			node = areaNode;
		}
		// DOM Node
		else if ( LogiXML.isDomNode( areaNode ) ) {
			node = Y.one( areaNode );
		}
		// Can't work with anything else
		else {
			return undefined;
		}
		
		// Make sure it's an area element
		if ( node.get('tagName') !== 'AREA' ) {
			return undefined;
		}
		
		coordinateString = node.getAttribute('coords');
		areaType = node.getAttribute('shape');
		
		// Make sure we have everything needed
		if ( LogiXML.String.isBlank( coordinateString ) || LogiXML.String.isBlank( areaType ) ) {
			return undefined;
		}
		
		coordinates = coordinateString.split(',');
		numerofCoordinates = coordinates.length;
		
		/* 
		 * http://www.w3.org/TR/xhtml2/mod-csImgMap.html
		 * 
		 * rect: left-x, top-y, right-x, bottom-y
		 * poly: x1, y1, x2, y2, ..., xN, yN. If the first and last x and y coordinate pairs
		 * are not the same, infer an additional coordinate pair to close the polygon.
		 * circle: center-x, center-y, radius.  Radius can be percent value, which is based on image
		 * width/height.  Not going to parse for now.
		 */
		 areaType = areaType.toLowerCase();
		if ( areaType === 'rect' ) {
			return {
				'leftX' : parseInt( coordinates[0], 10 ),
				'topY' : parseInt( coordinates[1], 10 ),
				'rightX' : parseInt( coordinates[2], 10 ),
				'bottomY' : parseInt( coordinates[3], 10 )
			};
		}
		
		if ( areaType === 'poly' ) {
			for ( i = 0 ; i < numerofCoordinates; i = i + 2 ) {
				coordinatePairs[i/2] = { 'x' : parseInt( coordinates[i], 10 ), 'y' : parseInt( coordinates[i+1], 10 ) };
			}
			return coordinatePairs;
		}
		
		if ( areaType === 'circle' ) {
			if ( coordinates[2].indexOf('%') > 0 ) {
				return undefined;
			}
			
			return {
				'x' : parseInt( coordinates[0], 10 ),
				'y' : parseInt( coordinates[1], 10 ),
				'radius' : parseInt( coordinates[2], 10 )
			};
		}
		
		return undefined;
	};
	
	imageNS.Map.determineParallelogramMiddlePoint = function( coordinates ) {
		if ( coordinates.length !== 4 ) {
			return undefined;
		}
		
		/*
		* Parrallelogram is just a slanted rectangle, recreate the rectangle by finding low/high x/y values
		*/
		var selectionPoint = {},
			point = coordinates[0],
			lowX = point.x,
			highX = point.x,
			lowY = point.y,
			highY = point.y,
			length = coordinates.length,
			x, y, i;

		for ( i = 1; i < length; i += 1 ) {
			x = coordinates[i].x;
			y = coordinates[i].y;
			
			if ( x <= lowX ) {
				lowX = x;
			}
			else if ( x > highX ) {
				highX = x;
			}
			
			if ( y <= lowY ) {
				lowY = y;
			}
			else if ( y > highY ) {
				highY = y;
			}
		}

		selectionPoint.x = (highX - lowX) / 2 + lowX;
		selectionPoint.y = (highY - lowY) / 2 + lowY;
		
		return selectionPoint;
	};
	
	/*
	 * Line charts areas can have varying sizes, but they consist of two shapes, Rectangles and Polygons.
	 * - Polygons always consist of 4 to 6 points.  With 4 points just calculate middle of Parallelogram and
	 * you're good.  With 6 points, take the two middle points and calculate the midpoint between those two.
	 * - Rectangles calculate middle
	 */
	imageNS.Map.calculateMiddleofLineChartArea = function( areaNode, orientation ) {
				
		var coordinates = imageNS.Map.parseAreaCoordinates( areaNode ),
			shape = areaNode.getAttribute( 'shape' ).toLowerCase(),
			selectionPoint = {};
		
		// Rectangle shape
		if ( shape === 'rect' ) {
			selectionPoint.x = coordinates.leftX + (coordinates.rightX - coordinates.leftX)/2; 
			selectionPoint.y = coordinates.topY + (coordinates.bottomY - coordinates.topY)/2;
			return selectionPoint;
		}
		
		// Polygon Shape
		// Vertical
		if ( orientation === ORIENTATION_VERTICAL ) {
			// 6 points, ChartDirector starts left-top most point and works clockwise
			// Our mid points are 2 and 5 then.
			if ( coordinates.length === 6 ) {
				selectionPoint.y = (coordinates[4].y - coordinates[1].y) / 2 + coordinates[1].y;
				selectionPoint.x = coordinates[1].x;
			}
			
			// 4 points, starting position varies in line chart.  Points create a parallelogram
			else if ( coordinates.length === 4 ) {
				selectionPoint = imageNS.Map.determineParallelogramMiddlePoint( coordinates );
			}
		}
		// Horizontal
		else {
			// 6 points, ChartDirector starts in the bottom left corner and works clockwise
			// Our mid points are 2 and 5 then.
			if ( coordinates.length === 6 ) {
				selectionPoint.x = (coordinates[4].x - coordinates[1].x) / 2 + coordinates[1].x;
				selectionPoint.y = coordinates[1].y;
			}
			
			// 4 points, starting position varies in line chart.  Points create a parallelogram
			else if ( coordinates.length === 4 ) {
				selectionPoint = imageNS.Map.determineParallelogramMiddlePoint( coordinates );
			}
		}
		
		return selectionPoint;
	};
	
	imageNS.Map.calculateAreaChartHighlightPoint = function( areaNode, orientation ) {
		var coordinates = imageNS.Map.parseAreaCoordinates( areaNode ),
			shape = areaNode.getAttribute( 'shape' ).toLowerCase(),
			selectionPoint = {};
			
		// Rectangle shape
		if ( shape === 'rect' ) {
			selectionPoint.x = coordinates.leftX + (coordinates.rightX - coordinates.leftX)/2; 
			selectionPoint.y = coordinates.topY + (coordinates.bottomY - coordinates.topY)/2;
			return selectionPoint;
		}
		
		// Polygon Shape
		// Vertical
		if ( orientation === ORIENTATION_VERTICAL ) {
			// 6 points, ChartDirector starts left-top most point and works anti-clockwise
			// Our highlight point is 6
			if ( coordinates.length === 6 ) {
				selectionPoint = coordinates[5];
			}
			// 4 points, starts in left-top point and works anti-clockwise
			// Our points are 1 and 4
			else {
				selectionPoint.x = (coordinates[3].x - coordinates[0].x) / 2 + coordinates[0].x;
				selectionPoint.y = (coordinates[3].y - coordinates[0].y) / 2 + coordinates[0].y;
			}
		}
		// Horizontal
		else {
			// 6 points, ChartDirector starts left-bottom point and works anti-clockwise
			// Our highlight point is 3
			if ( coordinates.length === 6 ) {
				selectionPoint = coordinates[2];
			}
			// 4 points, start left-bottom point and works anti-clockwise
			// Our points are 2 and 3
			else {
				selectionPoint.x = (coordinates[1].x - coordinates[2].x) / 2 + coordinates[2].x;
				selectionPoint.y = (coordinates[1].y - coordinates[2].y) / 2 + coordinates[2].y;
			}
		}
		
		return selectionPoint;
	};

}, '1.0.0', {requires: ['dom', 'node', 'attribute-helpers'] });
