// JSLint options:
/*global LogiXML, YUI, document, window */

YUI.add('chartfx-resize', function(Y) {
	//"use strict";
	
	var NODE = 'node',
		ABSOLUTE = 'absolute',
		HANDLES = 'handles',
		HANDLES_WRAPPER = 'handlesWrapper',
		HIDDEN = 'hidden',
		PARENT_NODE = 'parentNode',
		POSITION = 'position',
		RELATIVE = 'relative',
		STATIC = 'static',
		WRAP = 'wrap',
		WRAPPER = 'wrapper',
		
		DESTROY_CLASS_KEY = 'chart-resize',
		
		getCN = Y.ClassNameManager.getClassName,
		RESIZE = 'resize',
		CSS_RESIZE = getCN(RESIZE),
		CSS_RESIZE_LARGEHANDLES = getCN(RESIZE, 'large'),
		CSS_RESIZE_HIDDEN_HANDLES = getCN(RESIZE, HIDDEN, HANDLES),
		CSS_RESIZE_HANDLES_WRAPPER = getCN(RESIZE, HANDLES, WRAPPER),
		ImageUtils = Y.LogiXML.Image,
	
	getCompStyle = function( node, val ) {
		return node.getComputedStyle( val );
	};
	
	// Register class with custom destroy code
	Y.LogiXML.Node.destroyClassKeys.push( DESTROY_CLASS_KEY );
	
	function Resize(config) {
		Resize.superclass.constructor.apply(this, arguments);
		
		// Destroy resize when node it's attached to is destroyed
		this.get('node').setData( DESTROY_CLASS_KEY, this );
		
		// Add CSS to render large handles by default, matches what we use with our Resizer element
		this._addLargeHandles();
    }
	
	/*
	 * Replace YUI Resize destructor so it is functionally equivalent to the original.
	 * Additional logic
	 * - Manually remove Resize handles wrapper.
	 * - Use our ImageUtils.unwrap method
	 */
	Y.Resize.prototype.destructor = function() {
		var instance = this,
			node = instance.get(NODE),
			wrapper = instance.get(WRAPPER),
			wrapperDOM = wrapper.getDOMNode(),
			handlesContainer,
			pNode;
			
		if ( wrapperDOM ) {
			// purgeElements on boundingBox
			Y.Event.purgeElement(wrapper, true);
		
			pNode = wrapper.get(PARENT_NODE);
		}

		// destroy handles dd and remove them from the dom
		instance.eachHandle(function(handleEl) {
			instance.delegate.dd.destroy();

			if ( handleEl.getDOMNode() ) {
				// remove handle
				handleEl.remove(true);
			}
			else {
				// DOM Node already gone, just cleanup YUI Node
				handleEl.destroy();
			}
		});
		
		/* Remove handles container, originally these were removed when wrapper was deleted.
		 * Now the wrapper is used by other components so it may not be deleted.  Thus manually remove it
		 *
		 * If the backing DOM Node of wrapper is already gone and you call a selector, it defaults back to
		 * the whole DOM.  Make sure wrapper DOM Node exists before trying to remove handles container.
		 */
		if ( wrapperDOM ) {
			handlesContainer = wrapper.one( '.' + CSS_RESIZE_HANDLES_WRAPPER );
			if ( handlesContainer ) {
				handlesContainer.remove( true );
			}
		}		

		// unwrap node
		if (instance.get(WRAP) && wrapperDOM) {
			instance._copyStyles(wrapper, node);
			ImageUtils.unwrapImage( node );
		}
		
		if ( node.getDOMNode() ) {
			node.removeClass( CSS_RESIZE );
			node.removeClass( CSS_RESIZE_HIDDEN_HANDLES );
		}
	};
	
	Y.extend( Resize, Y.Resize, {
		
		_addLargeHandles : function() {
			this.get( HANDLES_WRAPPER ).addClass( CSS_RESIZE_LARGEHANDLES );
		},
		
		/*
		 * Override function to swap in our DIV wrapping code.  Rest of function matches original YUI code
		 */
		_valueWrapper : function() {
			var instance = this,
				node = instance.get( NODE ),
				position = node.getStyle( POSITION ).toLowerCase(),
				// by default the wrapper is always the node
				wrapper = node;
			
			// if the node is listed on the wrapTypes or wrap is set to true, create another wrapper
			if ( instance.get( WRAP ) ) {
			
				wrapper = ImageUtils.wrapImage( node );
				instance._copyStyles( node, wrapper );

				/*
				 * Remove positioning of wrapped node, the WRAPPER take care about positioning
				 * 
				 * This works for most cases, but our complex FX need absolute positioning
				 * Specifically this would break some of the FX in IE 7/8
				 */
				if ( position !== ABSOLUTE )
				{
					position = STATIC;
				}
				node.setStyles({
					position: position,
					left: 0,
					top: 0
				});
			}

			return wrapper;
		},
		
		/*
		 * Override function to add check for wrapper styling
		 */
		_copyStyles: function(node, wrapper) {
			var position = node.getStyle(POSITION).toLowerCase(),
				surrounding = this._getBoxSurroundingInfo(node),
				chartDimensions = ImageUtils.getDimensions( node ),
				wrapperStyle;
				
			

			// resizable wrapper should be positioned
			/*
			 * CHANGED CODE
			 * Second boolean expression checks to see if wrapper already has relative position styling.
			 * If so we need to perserve it, otherwise other FX might get messed up
			 */
			if ( position === STATIC || wrapper.getStyle( POSITION ).toLowerCase() === RELATIVE ) {
				position = RELATIVE;
			}

			wrapperStyle = {
				position: position,
				left: getCompStyle(node, 'left'),
				top: getCompStyle(node, 'top')
			};

			Y.mix(wrapperStyle, surrounding.margin);
			Y.mix(wrapperStyle, surrounding.border);

			wrapper.setStyles(wrapperStyle);

			// remove margin and border from the internal node
			node.setStyles({ border: 0, margin: 0 });

			if (Y.Lang.isValue(chartDimensions)) {
				wrapper.sizeTo(
					chartDimensions.width + surrounding.totalHBorder,
					chartDimensions.height + surrounding.totalVBorder
				);
			}
			else {
				wrapper.sizeTo(
					node.get('offsetWidth') + surrounding.totalHBorder,
					node.get('offsetHeight') + surrounding.totalVBorder				
				);
			}
		}
	});
	
	Y.namespace('LogiXML.ChartFX').Resize = Resize;

}, '1.0.0', {requires: ['dom-base', 'node-base', 'resize-base', 'image-utils', 'node-custom-destroy'] });