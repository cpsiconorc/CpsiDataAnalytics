// JSLint options:
/*global LogiXML, YUI, document, window */

YUI.add('drawable-overlay', function(Y) {
	//"use strict";
	
	var Lang = Y.Lang,
		ImageUtils = Y.LogiXML.Image,
		BOUNDING_BOX = 'boundingBox',
		CONSTRAIN = 'constrain',
		TRIGGER = 'trigger',
		OVERLAY_STYLES = {
			position: 'absolute',
			zIndex: 10
		},
		DRAG_NODE_ID = 'logi_dragNode',
		DRAG_NODE_TEMPLATE = '<div></div>',
		DRAG_NODE_STYLES = {
			position: 'absolute',
			left: 0,
			top: 0,
			height: '0px',
			width: '0px'
		},
		EV_DRAW_START = 'draw:start',
		EV_DRAW_DRAW = 'draw:draw',
		EV_DRAW_END = 'draw:end',
		EV_DRAW_RESET = 'draw:reset',
		// Call the drag event move, just to differentiate between YUI event and ours
		EV_MOVE_END = 'move:end',
		LEGEND_FLAG = ImageUtils.Map.LEGEND_FLAG,
		NOT_LEGEND = 'notLegend';
	
	Y.namespace('LogiXML').DrawableOverlay = Y.Base.create('drawableOverlay', Y.Widget, [Y.WidgetPosition], {
		// Prototype Methods and properties
		
		/**
		* Content Box is not needed, contentBox and boundingBox will point to same Node now
		*/ 
		CONTENT_TEMPLATE : null,
		
		initializer : function(config) {
			var constrainNode = this.get( CONSTRAIN ),
				triggerNode = this.get( TRIGGER );
			
			// Neither constrain nor trigger were passed in, use body as trigger
			if ( !triggerNode && !constrainNode ) {
				this.set( TRIGGER, 'body' );
			}
			
			// Constrain passed in, but not trigger
			if ( constrainNode && !triggerNode ) {
				this.set( TRIGGER, constrainNode );
			}
			
			this._constrainIndependent = false;
			// Are constrain and trigger different?
			if ( !constrainNode.compareTo( triggerNode ) ) {
				this._constrainIndependent = true;
			}
			
			// Node which gets dragged instead of targetNode
			this._dragNode =  null;
			
			// Hold handles for custom Events so we can clean them up during destroy
			this._customEvents = {};
			this._publishCustomEvents();
			
			this._handles = {
				mouseDown: null,
				dragStart: null,
				dragMove: null,
				dragEnd: null,
				overlayDragEnd: null
			};
			
			this._dd = {
				container: null,
				overlay: null,
				imageMap: null
			};
		},
		
		/*
         * Destruction Code: Clears event handles
         */
        destructor : function() {
			this._removeCustomEvents();
			this._clearHandles();
			this._clearDD();
        },
		
		_publishCustomEvents : function() {
			var customEvents = this._customEvents;
			
			customEvents.drawStart = this.publish(EV_DRAW_START, {
                defaultFn: this._defStartFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'draw'
            });
			
			customEvents.drawDraw = this.publish(EV_DRAW_DRAW, {
                defaultFn: this._defDrawFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'draw'
            });
			
			customEvents.drawEnd = this.publish(EV_DRAW_END, {
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'draw'
            });
			
			customEvents.drawReset = this.publish(EV_DRAW_RESET, {
				defaultFn: this._reset,
				queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'draw'
			});
			
			customEvents.moveEnd = this.publish(EV_MOVE_END, {
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'move'
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
		
		/*
		 * Responsible for binding event listeners (both attribute change and DOM event listeners) to 'activate' the rendered UI.
		 */
        bindUI : function() {
			this._createContainerDD();
			this._createOverlayDD();
			if ( this.get('imageMap') ) {
				this._createImageMapDD();
			}
			this._bindDragEvents();
        },
		
		/*
		 * Responsible for creating/adding elements to the DOM to render the widget.
		 */
		renderUI : function() {
			this._createOverlay();
			this._createDragNode();
		},
		
		_createOverlay : function() {
			// We use the widget's HTML as a starting point
			var overlay = this.get(BOUNDING_BOX),
				backgroundColor = this.get('backgroundColor'),
				borderColor = this.get('borderColor'),
				opacity = this.get('opacity');
			overlay.setStyles( OVERLAY_STYLES );
			
			if ( backgroundColor ) {
				overlay.setStyle( 'backgroundColor', backgroundColor );
			}
			if ( opacity ) {
				overlay.setStyle( 'opacity', opacity );
			}
			if ( borderColor ) {
				overlay.setStyle( 'borderColor', borderColor );
			}
			
			this.hide();
		},
		
		_createDragNode : function() {
			var dragNode = Y.one( '#' + DRAG_NODE_ID );
			if ( dragNode === undefined || dragNode === null ) {
				dragNode = Y.Node.create( DRAG_NODE_TEMPLATE );
				dragNode.setAttribute( 'id', DRAG_NODE_ID );
				dragNode.setStyles( DRAG_NODE_STYLES );
				Y.one('body').appendChild( dragNode );
			}
			this._dragNode = dragNode;
		},
		
		_bindDragEvents : function() {
			var handles = this._handles;
				
			handles.mouseDown = this.on('drag:mouseDown', this._onMouseDown, this);
			handles.dragStart = this.on('drag:start', this._onDragStart, this);
			handles.dragMove = this.on('drag:drag', this._onDragMove, this);
			handles.dragEnd = this.on('drag:end', this._onDragEnd, this);
		},
		
		_createContainerDD: function() {
			var constrainNode = this.get( CONSTRAIN ),
				triggerNode = this.get( TRIGGER ),
				dd = new Y.DD.Drag({
					node: triggerNode,
					dragNode: this._dragNode,
					move: false,
					offsetNode: false,
					clickPixelThresh: 1
				});
				
			if ( constrainNode ) {
				dd.plug( Y.Plugin.DDConstrained, {
					constrain2node: constrainNode
				});
			}			
			
			this._dd.container = dd;
			
			// Add drawableOverlay to Drag bubble event chain
			dd.addTarget( this );
		},
		
		_createOverlayDD: function() {
			var constrainNode = this.get( CONSTRAIN ),
				overlayNode = this.get(BOUNDING_BOX),
				overlayDD = new Y.DD.Drag( { node: overlayNode } );
			
			if ( constrainNode ) {
				overlayDD.plug( Y.Plugin.DDConstrained, {
					constrain2node: constrainNode
				});
			}
			
			this._dd.overlay = overlayDD;
			
			// The only event we care about here is the drag ending
			this._handles.overlayDragEnd = overlayDD.on('drag:end', this._onOverlayDragEnd, this);
		},
		
		_createImageMapDD: function() {
			// Work around bug in YUI and IE8 where the :not() selector doesn't work.
			// YUI3 Ticket 2532483 - http://yuilibrary.com/projects/yui3/ticket/2532483
			var imageMap = this.get('imageMap');
			imageMap.all( 'area' ).each( function( node ) {
				if ( !node.hasAttribute( LEGEND_FLAG ) ) {
					node.addClass( NOT_LEGEND );
				}
			});
			
			var constrainNode = this.get( CONSTRAIN ),
				ddDelegate = new Y.DD.Delegate({
					container: this.get('imageMap'),
					nodes: '.' + NOT_LEGEND,
					dragConfig: {
						move: false,
						dragNode: this._dragNode,
						offsetNode: false,
						clickPixelThresh: 1
					}
				});
			
			if ( constrainNode ) {
				ddDelegate.dd.plug( Y.Plugin.DDConstrained, {
					constrain2node: constrainNode
				});
			}			
			
			this._dd.imageMap = ddDelegate;
			
			// Add drawableOverlay to Drag bubble event chain
			ddDelegate.addTarget( this );
		},
		
		_clearHandles : function() {
			var handles = this._handles;
			
			Y.each( handles, function(item) {
				if ( item ) {
					if ( Lang.isArray( item ) ) {
						Y.each( item, function(handle) {
							handle.detach();
						});
						item = [];
					}
					else {
						item.detach();
						item = null;
					}
				}
			});
		},
		
		_clearDD : function() {
			var drags = this._dd,
				containerDD = drags.container,
				overlayDD = drags.overlay,
				imageMapDragDelegate = drags.imageMap;
				
			if ( containerDD ) {
				containerDD.unplug( Y.Plugin.DDConstrained );
				containerDD.destroy();
			}
			
			if ( overlayDD ) {
				overlayDD.unplug( Y.Plugin.DDConstrained );
				overlayDD.destroy();
			}
			
			if ( imageMapDragDelegate ) {
				imageMapDragDelegate.dd.unplug( Y.Plugin.DDConstrained );
				imageMapDragDelegate.destroy();
			}
		},
		
		_defStartFn : function(ev) {
			var initialXY = this.get('initialXY');
			this.move( initialXY[0], initialXY[1] );
			this.show();
		},
		
		_defDrawFn : function(ev) {
			var initialXY = this.get('initialXY'),
				initialX = initialXY[0],
				initialY = initialXY[1],
				newX = ev.pageX,
				newY = ev.pageY,
				overlayX = initialX,
				overlayY = initialY,
				adjustedWidth = 1,
				adjustedHeight = 1;
				
			// Mouse has moved left of the initial starting point 
			if ( newX < initialX ) {
				overlayX = newX;
				adjustedWidth = initialX - newX;
			}
			else {
				adjustedWidth = newX - initialX;
			}
			
			// Mouse has moved above the initial starting point
			if ( newY < initialY ) {
				overlayY = newY;
				adjustedHeight = initialY - newY;
			}
			else {
				adjustedHeight = newY - initialY;
			}
			
			this._reDraw( overlayX, overlayY, adjustedWidth, adjustedHeight );
		},
		
		_reDraw : function( x, y, width, height ) {
			var overlayNode = this.get( BOUNDING_BOX );
			
			overlayNode.set( 'offsetWidth', width );
			overlayNode.set( 'offsetHeight', height );
			
			this.move( x, y );
		},
		
		_onMouseDown: function(ev) {
			
			// The dragMouseDown event stores original mousedown event inside itself
			var mousedownEvent = ev.ev,
				pageX = mousedownEvent.pageX,
				pageY = mousedownEvent.pageY,
				mouseRegion;
		
			// Ignore mousedown event if triggered by overlay.  This signals a drag starting, not drawing
			if ( mousedownEvent.currentTarget === this.get( BOUNDING_BOX ) ) {
				return;
			}
			
			// If constrainNode is different than triggerNode, only start Drag operation when done inside constrain region
			if ( this._constrainIndependent && mousedownEvent.currentTarget === this.get( TRIGGER ) ) {
				mouseRegion = {
					left : pageX,
					right : pageX,
					top : pageY,
					bottom : pageY
				};
				
				// Is the mouse position within constrain region?
				if ( !Y.DOM.inRegion( null, this.get( CONSTRAIN ).getDOMNode(), true, mouseRegion )  )
				{
					ev.preventDefault();
					return;
				}
			}
			
			this.set( 'initialXY', [pageX, pageY] );
		},
		
		_onDragStart: function(ev) {
			this.fire( EV_DRAW_START, { 
				pageX : ev.pageX,
				pageY : ev.pageY,
				dragEV : ev
			});
		},
		
		_onDragMove: function(ev) {
			this.fire( EV_DRAW_DRAW, { 
				pageX : ev.pageX,
				pageY : ev.pageY,
				dragEV : ev
			});
		},
		
		_onDragEnd: function(ev) {
			this.fire( EV_DRAW_END, { 
				pageX : ev.pageX,
				pageY : ev.pageY,
				dragEV : ev
			});
		},
		
		_onOverlayDragEnd: function(ev) {
			this.fire( EV_MOVE_END, { 
				pageX : ev.pageX,
				pageY : ev.pageY,
				dragEV : ev
			});
		},
		
		reset: function(ev) {
			this.fire( EV_DRAW_RESET, Y.Lang.isValue( ev ) ? { origEV: ev } : {} );
		},
		
		_reset: function() {
			var overlayNode = this.get( BOUNDING_BOX );
			this.hide();
			overlayNode.setStyles( {
				height: 0,
				width: 0
			});
		}
	}, {
		NAME: 'drawableOverlay',
		
		// Override default YUI prefixing
		CSS_PREFIX: 'drawableoverlay',
		
		// Static Methods and Properties
		ATTRS: {
			// Background color of overlay in Hex
			backgroundColor: {
				validator: Lang.isString
			},
			
			// Border color of overlay in Hex
			borderColor: {
				validator: Lang.isString
			},
			
			// YUI node to use for dd-constrain
			constrain: {
				setter: Y.one
			},
			
			/*
			 * Overlay can be used with anything can you register mousemove, mouseout, and
			 * mouseenter events.  If you do use an image the area's from a map will intercept
			 * clicks since they live on top of the image.  This provides ability to add event
			 * listeners onto the areas as well.
			 */
			imageMap: {
				setter: Y.one
			},
			
			// InitialXY position of mouse cursor
			initialXY: {
				value: [],
				validator: Lang.isArray
			},
			
			// Opacity of overlay
			opacity: {
				value: 0.5,
				validator: LogiXML.opacityValidator
			},
			
			// YUI node used to start Drag Event
			trigger: {
				validator: Y.one
			}
		}
	});
	
}, '1.0.0' , {requires:['node', 'event', 'widget', 'widget-position', 'dd-drag', 'dd-constrain', 'dd-delegate', 'image-utils']} );