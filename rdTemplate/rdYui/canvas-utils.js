// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false, console: false */

YUI.add('canvas-utils', function(Y) {
	//"use strict";
	
	var CanvasUtils = Y.namespace('LogiXML.Canvas'),
		ImageUtils = Y.LogiXML.Image,
		Lang = Y.Lang,
		isValue = Lang.isValue,
		isStringBlank = LogiXML.String.isBlank,
		
		AREA_RECTANGLE = 'rect',
		AREA_POLYGON = 'poly',
		AREA_CIRCLE = 'circ',
		PIE_DRAW_POINT = -Math.PI/2, // Where we start drawing from
	
	areaNodeValidator = function( areaNode ) {
		var shape;
		
		areaNode = Y.one( areaNode );
		if ( !(areaNode instanceof Y.Node && areaNode.get('tagName') === 'AREA') ) {
			return false;
		}
		
		shape = areaNode.getAttribute('shape');
		if ( isStringBlank( shape ) ) {
			return false;
		}
		
		return true;
	},
	
	// Returns radians
	angleBetween2Lines = function( x1, y1, x2, y2, x3, y3, x4, y4 ) {
		var angle1 = Math.atan2( y1 - y2, x1 - x2 ),
			angle2 = Math.atan2( y3 - y4, x3 - x4 );
			
		return angle1 - angle2;
	},
	
	calculateLineLength = function( x1, y1, x2, y2 ) {
		var x = x1 - x2,
			y = y1 - y2;
			
		return Math.sqrt( x*x + y*y );
	},
	
	/*
	 * Get the next point index to the left or right.  Safely navigate array boundaries.
	 * coordinates - array of x/y points
	 * indexPoint - index of x/y point we want to work off of
	 * previous - true to get previous point, false to get next
	 */
	getNextPoint = function( coordinates, indexPoint, previous ) {
		var length = coordinates.length,
			point;
		
		if ( indexPoint >= length ) {
			return undefined;
		}
		
		// Safety check, only 1 point in array
		if ( length === 1 ) {
			return coordinates[0];
		}
		
		// Which direction are we going?
		if ( previous ) {
			indexPoint = indexPoint - 1;
		}
		else {
			indexPoint = indexPoint + 1;
		}

		// Went too far right, wrap around to start
		if ( indexPoint > length - 1 ) {
			point = coordinates[0];
		}
		// Went too far left, wrap around to end
		else if ( indexPoint < 0 ) {
			point = coordinates[length - 1];
		}
		// Within bounds
		else {
			point = coordinates[indexPoint];
		}
		
		return point;
	},
	
	drawAreaMapShape = function( context, shape, coordinates, x_shift, y_shift ) {
		var length, i;
		x_shift = x_shift || 0;
		y_shift = y_shift || 0;
		shape = shape.toLowerCase();
		
		context.beginPath();
		if ( shape === AREA_RECTANGLE ) {
			// x, y, width, height
			context.rect( coordinates.leftX + x_shift, coordinates.topY + y_shift, coordinates.rightX - coordinates.leftX, coordinates.bottomY - coordinates.topY );
		}
		else if ( shape === AREA_POLYGON ) {
			length = coordinates.length;
			
			context.moveTo( coordinates[0].x + x_shift, coordinates[0].y + y_shift );
			for ( i = 1; i < length; i += 1 ) {
				context.lineTo( coordinates[i].x + x_shift, coordinates[i].y + y_shift );
			}				
		}
		else if ( shape === AREA_CIRCLE ) {
			// x, y, radius, startAngle, endAngle, anticlockwise
			context.arc( coordinates.x + x_shift, coordinates.y + y_shift, coordinates.radius, 0, Math.PI * 2, false ) ;
		}
		context.closePath();
	},
	
	drawPieWedge = function( context, x, y, radius, startAngle, endAngle, drawCounterClockwise ) {
		// Adjust angles to start drawing from 12 o'clock
		startAngle = startAngle + PIE_DRAW_POINT;
		endAngle = endAngle + startAngle;
		
		context.beginPath();
		context.moveTo( x, y );
		context.arc( x, y, radius, startAngle, endAngle, drawCounterClockwise );
		context.closePath();
	},
	
	drawDonutWedge = function( context, centerPoint, startPoint, radius, innerRadius, startAngle, endAngle ) {
		// Adjust angles to start drawing from 12 o'clock
		startAngle = startAngle + PIE_DRAW_POINT;
		endAngle = endAngle + startAngle;
		
		context.moveTo( startPoint.x, startPoint.y );
		context.beginPath();
		context.arc( centerPoint.x, centerPoint.y, radius, startAngle, endAngle, false );
		context.arc( centerPoint.x, centerPoint.y, innerRadius, endAngle, startAngle, true );
		context.closePath();
	};
	
	CanvasUtils.drawAreaMapShape = function( context, areaNode, x_shift, y_shift ) {
		var coordinates, shape;
		
		if ( !areaNodeValidator( areaNode ) ) {
			return false;
		}
		
		shape = areaNode.getAttribute('shape');
		coordinates = ImageUtils.Map.parseAreaCoordinates( areaNode );
		if ( !Lang.isValue( coordinates ) ) {
			return false;
		}
		
		drawAreaMapShape( context, shape, coordinates, x_shift, y_shift );
		return true;
	};
	
	// This only works on Pie and Donut charts with a constant radius, ellipsis is no go.
	// Also this implementation is very specific to Chart Director
	CanvasUtils.drawPieWedgeFromArea = function( context, areaNode, centerPoint, radius, innerRadius  ) {
		var coordinates, numberOfCoordiantes, point,
			centerIndex, distanceFromCenter, shortestDistance = Number.MAX_VALUE,
			startCurvePoint, endCurvePoint,
			startAngle, endAngle,
			i, detachedPieWedge = true;
		
		if ( !areaNodeValidator( areaNode ) ) {
			return false;
		}
		
		coordinates = ImageUtils.Map.parseAreaCoordinates( areaNode );
		if ( !Lang.isValue( coordinates ) ) {
			return false;
		}
		numberOfCoordiantes = coordinates.length;
		
		// Find the wedge center point, then calculate edge points of curve
		for ( i = 0; i < numberOfCoordiantes; i += 1 ) {
			point = coordinates[i];
			
			if ( centerPoint.x === point.x && centerPoint.y === point.y ) {
				centerIndex = i;
				detachedPieWedge = false;
				break;
			}
			// It's possible this pie wedge is detached, in this case no point is on the center
			// So calculate the distance between center point and current point.  Shortest distance
			// is the center point for this calculation
			else {
				distanceFromCenter = calculateLineLength( centerPoint.x, centerPoint.y, point.x, point.y );
				if ( shortestDistance > distanceFromCenter ) {
					shortestDistance = distanceFromCenter;
					centerIndex = i;
				}
			}
		}
		
		// We're dealing with a detached pie wedge, relocate our notion of the center point
		if ( detachedPieWedge ) {
			centerPoint = coordinates[centerIndex];
		}
		
		// Find points on each side on the center point in array as these represent start and end curve points.
		// How can I gurantee points are in the correct order?  Image map polygons are rendered by 
		// drawing lines from point to point.  If they weren't in order, the shape would be wrong
		// One caveat, this only works because Chart Director outputs points going in a clockwise direction
		startCurvePoint = getNextPoint( coordinates, centerIndex );
		endCurvePoint = getNextPoint( coordinates, centerIndex, true );
		
		// We need to determine the angles of the pie wedge so we can draw a smooth line.  To calculate proper
		// radian/degrees the axis coordinates need to be changed.  Top left of chart is 0,0.  Degree/Radian calculation
		// has 0,0 in middle of circle essentially.  Middle of our circle is the pie center point.  Transform all coordinates
		// so 0,0 is now the pie center.
		// Bust our your Radian/Degree conversion charts for visual help, just remember to flip them as browsers render from top left corner.
		// http://upload.wikimedia.org/wikipedia/commons/9/9a/Degree-Radian_Conversion.svg
		startCurvePoint.x = startCurvePoint.x - centerPoint.x;
		startCurvePoint.y = centerPoint.y - startCurvePoint.y;			
		endCurvePoint.x = endCurvePoint.x - centerPoint.x;
		endCurvePoint.y = centerPoint.y - endCurvePoint.y;
		
		// 0,50 merely a makes a straight line pointing 12 o'clock, which where I base all my arc drawing from.
		startAngle = angleBetween2Lines( 0,0, 0,50, 0,0, startCurvePoint.x,startCurvePoint.y );
		endAngle = angleBetween2Lines( 0,0, startCurvePoint.x,startCurvePoint.y, 0,0, endCurvePoint.x,endCurvePoint.y );
		
		if ( isValue( innerRadius ) ) {
			drawDonutWedge( context, centerPoint, startCurvePoint, radius, innerRadius, startAngle, endAngle );
		}
		else {
			drawPieWedge( context, centerPoint.x, centerPoint.y, radius, startAngle, endAngle, false );
		}
		
		return true;
	};
	
	CanvasUtils.radiansToDegrees = function( radian ) {
		return Math.round((radian * 180) / Math.PI);
	};
	
	CanvasUtils.degreesToRadians = function( degrees ) {
		return (degrees * Math.PI) / 180;
	};

}, '1.0.0', {requires: ['dom-base', 'node-base', 'image-utils'] });