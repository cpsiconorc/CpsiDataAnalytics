// JSLint options:
/*global LogiXML, YUI, document, window */

YUI.add('drawable-overlay-size-constrain', function(Y) {
	//"use strict";
	
	var Lang = Y.Lang,
		BOUNDING_BOX = 'boundingBox';
	
	/*
	 * Enables size constrains for the overlay
	 * Use minWidth/minHeight prevent an overlay from being drawn unless it's greater than those values
	 *
	 * Can also set minWidth/minHeight to container width/height values to essentially fill an entire region.
	 */
	function DrawableOverlaySizeConstrain() {
	
		this._handles_SizeConstrain = {
			bindUI: Y.after(this._bindUISizeConstrain, this, 'bindUI'),
			destructor: Y.before(this._destructorSizeConstrain, this, 'destructor'),
			afterMouseDown: Y.after(this._afterMouseDownSizeConstrain, this, '_onMouseDown')
		};
		
		this._overlayNodeSizeConstrain = this.get( BOUNDING_BOX );
		this._heightMaxed_SizeConstrain = false;
		this._widthMaxed_SizeConstrain = false;
	}
	
	DrawableOverlaySizeConstrain.ATTRS = {
		// Minimum height in px
		minHeight: {
			value: 5,
			setter: function(value) {
				// Prevent someone from setting minHeight greater than constraining node height
				var constrainNodeHeight = this.get('constrain').get('offsetHeight');
				return value > constrainNodeHeight ? constrainNodeHeight : value;
			},
			validator: '_defDimensionValidator'
		},
		
		// Minimum width in px
		minWidth: {
			value: 5,
			setter: function(value) {
				// Prevent someone from setting minWidth greater than constraining node width
				var constrainNodeWidth = this.get('constrain').get('offsetWidth');
				return value > constrainNodeWidth ? constrainNodeWidth : value;
			},
			validator: '_defDimensionValidator'
		},
		
		// Initial height in px
		initialHeight: {
			value: 0,
			setter: function(value) {
				var minHeight = this.get('minHeight');
				return minHeight > value ? minHeight : value;
			},
			validator: '_defDimensionValidator'
		},
		
		// Initial height in px
		initialWidth: {
			value: 0,
			setter: function(value) {
				var minWidth = this.get('minWidth');
				return minWidth > value ? minWidth : value;
			},
			validator: '_defDimensionValidator'
		},
		
		_defDimensionValidator: function(value) {
			return Lang.isNumber(value) && value > -1;
		}
	};
	
	DrawableOverlaySizeConstrain.prototype = {
		
		_bindUISizeConstrain : function() {
			var resize = this._resize,
				constrainNode = this.get('constrain');
				
			if ( resize ) {
				resize.plug( Y.Plugin.ResizeConstrained, {
					constrain: constrainNode,
					minWidth: this.get('minWidth'),
					minHeight: this.get('minHeight')
				});
			}
		},
		
		// Override reDraw method
		_reDraw : function( x, y, width, height ) {
			var minHeight = this.get('minHeight'),
				minWidth = this.get('minWidth');
			
			// Make sure width/height are greater than minimum, otherwise correct it
			if ( width < minWidth ) {
				width = minWidth;
			}
			if ( height < minHeight ) {
				height = minHeight;
			}
			
			// Call parent class with corrected width/height
			this.constructor.superclass._reDraw.apply(this, [x, y, width, height]);
		},
		
		_afterMouseDownSizeConstrain : function() {
			// TODO: This could be simplified to check constrain node once or only after constrain node change, for another day
			var constrainNode = this.get('constrain'),
				constrainRegion = Y.DOM.region( constrainNode.getDOMNode() ),
				initialXY = this.get('initialXY'),
				minHeight = this.get('minHeight'),
				minWidth = this.get('minWidth');
			
			// Min Height is same as constraining node height, adjust initialXY so Y is 'top' of constraining node
			if ( constrainNode.get('offsetHeight') === minHeight ) {
				initialXY[1] = constrainRegion.top;
				this._heightMaxed_SizeConstrain = true;
			}
			
			// Min Width is same as constraining node width, adjust initialXY so X is 'left' of constraining node
			if ( constrainNode.get('offsetWidth') === minWidth ) {
				initialXY[0] = constrainRegion.left;
				this._widthMaxed_SizeConstrain = true;
			}
		},
		
		_destructorSizeConstrain : function() {
			this._overlayNodeSizeConstrain = null;
			this._clearHandlesSizeConstrain();
        },
		
		_clearHandlesSizeConstrain : function() {
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
		}
		
		/**
		* Provided by drawableOverlay
		* Here used for resize constrain
		 
		constrain: {
			value: null,
			setter: Y.one
		}
		*/
	};
	
	Y.namespace('LogiXML').DrawableOverlaySizeConstrain = DrawableOverlaySizeConstrain;
	
}, '1.0.0', {requires: ['event-custom', 'resize-constrain']} );