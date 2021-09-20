//Inherit and extend slider to add dual slider
YUI.add('rdslider', function(Y) {

	var TICKCOUNT = 'tickCount';
	
	function rdSlider() {		
		rdSlider.superclass.constructor.apply(this, arguments);		
	}
	
	Y.rdSlider = Y.extend(rdSlider, Y.Slider, {
		/**
         * Calculates and caches
         * (range between max and min) / (rail length)
         * for fast runtime calculation of position -&gt; value.
         *
         * @method _calculateFactor
         * @protected
         */
        _calculateFactor: function () {
            var length    = this.get( 'length' ),
                thumbSize = this.thumb.getStyle( this._key.dim ),
                min       = this.get('min'),
                max       = this.get('max');
				
            // The default thumb width is based on Sam skin's thumb dimension.
            // This attempts to allow for rendering off-DOM, then attaching
            // without the need to call syncUI().  It is still recommended
            // to call syncUI() in these cases though, just to be sure.
            length = parseFloat( length ) || 150;
            thumbSize = parseFloat( thumbSize ) || 15;

			if (this.get( TICKCOUNT ))				
				this._factor = this.get( TICKCOUNT) / ( length - thumbSize );
			else
				this._factor = ( max - min ) / ( length - thumbSize );
			
        },
		/**
         * <p>Converts a pixel position into a value.  Calculates current
         * thumb offset from the leading edge of the rail multiplied by the
         * ratio of <code>(max - min) / (constraining dim)</code>.</p>
         *
         * <p>Override this if you want to use a different value mapping
         * algorithm.</p>
         *
         * @method _offsetToValue
         * @param offset { Number } X or Y pixel offset
         * @return { mixed } Value corresponding to the provided pixel offset
         * @protected
         */
        _offsetToValue: function ( offset ) {
		
			var value = Math.round( offset * this._factor )
		
			//Handle tick width
			if (this.get( TICKCOUNT )) 				
				value *= ((this.get('max') - this.get('min')) / this.get( TICKCOUNT ));
		
            value += this.get('min');
			
			value =  Math.round( this._nearestValue( value ) );
			
			
				
			return value;
        },
        /**
         * Converts a value into a pixel offset for use in positioning
         * the thumb according to the reverse of the
         * <code>_offsetToValue( xy )</code> operation.
         *
         * @method _valueToOffset
         * @param val { Number } The value to map to pixel X or Y position
         * @return { Number } The pixel offset 
         * @protected
         */
        _valueToOffset: function ( value ) {
            var offset;		
					
			offset = Math.round( ( value - this.get('min') ) / this._factor );
			
			//Handle tick width
			if (this.get( TICKCOUNT )) 				
				offset /= ((this.get('max') - this.get('min')) / this.get( TICKCOUNT ));				

            return offset;
        }
	}, {

    // Y.SliderBase static properties

    /**
     * The identity of the widget.
     *
     * @property rdSlider.NAME
     * @type String
     * @default 'rdSlider'
     * @readOnly
     * @protected
     * @static
     */
    NAME : 'rdSlider',

    /**
     * Static property used to define the default attribute configuration of
     * the Widget.
     *
     * @property SliderBase.ATTRS
     * @type {Object}
     * @protected
     * @static
     */
    ATTRS : {
		/**
		* Used to determine tick count
		*/
		tickCount : {
			value : 0			
		}		
	}
    });

}, '0.0.0', {
	requires:['widget', 'substitute', 'dd-constrain']
});