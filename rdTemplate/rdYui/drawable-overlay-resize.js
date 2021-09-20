// JSLint options:
/*global LogiXML, YUI, document, window */

YUI.add('drawable-overlay-resize', function(Y) {
	//"use strict";
	
	var EV_DRAW_END = 'draw:end',
		BOUNDING_BOX = 'boundingBox';
	
	function DrawableOverlayResize() {
	
		Y.after(this._bindUIResize, this, 'bindUI');
		Y.before(this._destructorResize, this, 'destructor');
	}
	
	DrawableOverlayResize.ATTRS = {
		resizeConfig: {
			value: null
		}
	};
	
	DrawableOverlayResize.prototype = {
	
		_resize : null,
		
		_bindUIResize : function() {
			var overlayNode = this.get(BOUNDING_BOX),
				resizeConfig = this.get('resizeConfig'),
				options, resize;
				
			if ( resizeConfig !== null ) {
				options = Y.merge( { node: overlayNode }, this.get('resizeConfig') );
				resize = new Y.LogiXML.ChartFX.Resize( options );

				resize.on('resize:end', this._onOverlayResizeEnd, this);
				this._resize = resize;				
			}
		},
		
		_onOverlayResizeEnd: function(ev) {
			this.fire( EV_DRAW_END, { 
				pageX : ev.pageX,
				pageY : ev.pageY,
				resizeEV : ev
			});
		},
		
		_destructorResize : function() {
			if ( this._resize ) {
				this._resize.destroy();
				this._resize = null;
			}
        }
	};
	
	Y.namespace('LogiXML').DrawableOverlayResize = DrawableOverlayResize;
	
}, '1.0.0' , {requires:['chartfx-resize']} );