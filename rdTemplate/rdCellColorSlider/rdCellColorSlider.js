YUI.add('cell-color-slider', function(Y) {

	Y.namespace('LogiInfo').CellColorSlider = Y.Base.create('CellColorSlider', Y.Base, [], {
	
		initializer : function(config) {
			this.set('_id', config.id); 						//Set ID
			this.set('spectrum1ID', config.spectrum1ID);		//Set spectrum 1 ID
			this.set('spectrum2ID', config.spectrum2ID);		//Set spectrum 2 ID
			this.set('rankColumnID', config.rankColumnID);		//Set rank column ID
			this.set('colorLow', config.colorLow);				//Set low color
			this.set('colorMedium', config.colorMedium);		//Set medium color
			this.set('colorHigh', config.colorHigh);			//Set high color
			this.set('colorAttribute', config.colorAttribute);	//Set color attribute
			this.set('isForegroundBlackAndWhite', config.isForegroundBlackAndWhite);
			
			this.initializeColorSlider();
			
			//Attach Ajax refresh
			LogiXML.Ajax.AjaxTarget().on('reinitialize', Y.bind(Y.LogiInfo.CellColorSlider.prototype.initializeColorSlider, this));		
		},
		
		initializeColorSlider : function() {
		
			if (this.get('_id').length != 0) {
				var eleSlider = document.getElementById(this.get('_id'));			
				var eleSpectrum1 = document.getElementById(this.get('spectrum1ID'));
				var eleSpectrum2 = document.getElementById(this.get('spectrum2ID'));
				
				if (!eleSpectrum1) {return}  //DataColumn has Condition="False"
								
				this.set('spectrumWidth', eleSpectrum1.width * 2);
				
				//Move the slider to the center.
				eleSlider.style.position = 'absolute';
				var xSpectrum = this._getObjectX(eleSpectrum1); 
				var ySpectrum = this._getObjectY(eleSpectrum1);
				eleSlider.style.cursor = 'e-resize';
				var sliderNode = Y.one(eleSlider);
                sliderNode.offsetTop = 200
				if (!sliderNode.hasClass('yui3-dd-draggable')) {			
					var dd = sliderNode.plug(Y.Plugin.Drag).dd.plug(Y.Plugin.DDConstrained, {
						constrain2node: '#' + eleSlider.parentNode.id,
						stickX: true
					});
					
					dd.on('drag:start', function(e) {
						this.set('isDraggingCellColorSlider', true);
					}, this);
					dd.on('drag:drag', this._onDrag, this);
					dd.on('drag:end', function(e) {
						this.set('isDraggingCellColorSlider', false);
					}, this);				
				}
			}
			
			//Default slider
			this._onDrag();
			setTimeout(function(){rdRepositionSliders()}, 15);   //#3911.
		},
		
		_onDrag : function(e) {
		
			var nSlider = .5;
			if (Y.Lang.isValue(e)) {
				var sliderDragging = e.target.get('node');
				var sliderSpan = sliderDragging.ancestor('span');
				var region = sliderSpan.get('region');
			
				nSlider = (e.pageX - region.left) / (region.right - region.left);
			}
			
			if (nSlider >= 0) { 		
						
				//value is a number between 0 and 1.
				
				//Stretch and shrink the spectrum images.
				if (this.get('spectrum1ID').length != 0) {		
					var eleSpectrum1 = document.getElementById(this.get('spectrum1ID'));
					var eleSpectrum2 = document.getElementById(this.get('spectrum2ID'));
					
					this.set('spectrumWidth', eleSpectrum1.width + eleSpectrum2.width);
					
					eleSpectrum1.width = this.get('spectrumWidth') * nSlider;
					eleSpectrum2.width = this.get('spectrumWidth') - eleSpectrum1.width;
				}	
				
				//Set the colors for all cells.
				var aHiddens = document.getElementsByTagName("rdCellSliderValue");
				for (var i=0; i < aHiddens.length; i++) {
					var eleHiddenValue = aHiddens[i]
					var sHiddenId = eleHiddenValue.parentNode.getAttribute("id")
					
					if (sHiddenId.indexOf(this.get('rankColumnID') + "_Row") != -1) { 
						var nCellSliderValue = parseFloat(eleHiddenValue.getAttribute("VALUE"))
						if (!isNaN(nCellSliderValue)) {
							var eleBackground = eleHiddenValue.parentNode.parentNode.parentNode  //This is the TD.
							var sCellColor = this._getCellColor(	nSlider, 
																	parseFloat(nCellSliderValue), 
																	this.get('colorLow'), 
																	this.get('colorMedium'), 
																	this.get('colorHigh'));
							
							if (this.get('colorAttribute') == 'foreground' ) {
								if (eleBackground.getElementsByTagName('FONT')[0]) {
									eleBackground.getElementsByTagName('FONT')[0].color = sCellColor  //Works with colored <a> tags with IE and Mozilla
								} else {
									eleBackground.style.color = sCellColor  //In case the above doesn't work.
								}
							} else {    //background
								eleBackground.style.backgroundColor = sCellColor
								if ( this.get('isForegroundBlackAndWhite')) {
									//Standard formula for determining brightness.  Colors have different weights.
									var nBrightness = parseInt(sCellColor.substring(1,3),16) * .244627436 + parseInt(sCellColor.substring(3,5),16) * .672045616 + parseInt(sCellColor.substring(5,7),16) * .083326949;
									if (nBrightness < 255 * .5) {
										eleBackground.style.color = "#FFFFFF"
									} else {
										eleBackground.style.color = "#000000"
									}
								}
							}
						}
					}
				}
			}
		},
		
		_getCellColor : function(nSlider,nCellValue, sColorLow, sColorMed, sColorHi) {

			//Adjust the cell value based according to the slider.
			if (nCellValue == 1) {
				
			}else if (nCellValue == 0) {
				 
			}else if (nCellValue <= nSlider) {
				nCellValue =   (.5 * nCellValue / nSlider );

			}else{
				nCellValue = 1 - (.5 / (1 - nSlider) * (1 - nCellValue));
			}

			var rLow = parseInt(sColorLow.substring(1,3),16);
			var gLow = parseInt(sColorLow.substring(3,5),16);
			var bLow = parseInt(sColorLow.substring(5,7),16);
			var rMed = parseInt(sColorMed.substring(1,3),16);
			var gMed = parseInt(sColorMed.substring(3,5),16);
			var bMed = parseInt(sColorMed.substring(5,7),16);
			var rHi = parseInt(sColorHi.substring(1,3),16);
			var gHi = parseInt(sColorHi.substring(3,5),16);
			var bHi = parseInt(sColorHi.substring(5,7),16);
			
			var factorLow = Math.sin((nCellValue + .5) * Math.PI);
			var factorMed = Math.sin(nCellValue * Math.PI);
            var factorHi = Math.sin((nCellValue - .5) * Math.PI);

			if (factorLow < 0) {factorLow=0;}
			if (factorMed < 0) {factorMed=0;}
			if (factorHi < 0) {factorHi=0;}
			
			var r = (rLow * factorLow) + (rMed * factorMed) + (rHi * factorHi);
			var g = (gLow * factorLow) + (gMed * factorMed) + (gHi * factorHi);
			var b = (bLow * factorLow) + (bMed * factorMed) + (bHi * factorHi);
			
			return "#" + this._int2Hex(parseInt(r)) + this._int2Hex(parseInt(g)) + this._int2Hex(parseInt(b));

		},
		
		/* -----Utility functions----- */
		
		// [0-255] --> [00-ff] 
		_int2Hex : function(nb) { 
			nb = (nb > 255)? 255: (nb < 0)? 0:nb; 
			n_ = Math.floor(nb/16); 
			n__ = nb % 16; 
			return  n_.toString(16) + n__.toString(16) ;
		},
		_getObjectX : function(eleObject) { 
		  return(eleObject.offsetParent ? (this._getObjectX(eleObject.offsetParent) + eleObject.offsetLeft) : eleObject.offsetLeft); 
		}, 
		_getObjectY: function (eleObject) {
		    return (eleObject.offsetParent ? (this._getObjectY(eleObject.offsetParent) + eleObject.offsetTop) : eleObject.offsetTop);
		}
		
	}, {
		// Y.LogiInfo.CellColorSlider properties
		
		/**
		 * The identity of the widget.
		 *
		 * @property CellColorSlider.NAME
		 * @type String
		 * @default 'cell-color-slider'
		 * @readOnly
		 * @protected
		 * @static
		 */
		NAME : 'cell-color-slider',
		
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
			_id: { },			
			spectrum1ID: { },
			spectrum2ID: { },
			rankColumnID: { },
			colorLow: { },
			colorMedium: { },
			colorHigh: { },
			colorAttribute: { },
			isForegroundBlackAndWhite: { },
			isDraggingCellColorSlider: {
				value: false
			}
		}
	});		
	
}, '1.0.0', {requires: ['base', 'dd-constrain', 'dd-drop-plugin', 'dd-plugin']});



//NEEDS to be replaced with uniform event that can be fired by tabs and action-show-element
window.rdRepositionSliders = function () {
    var aImages = document.getElementsByTagName("IMG");
    for (var i = 0; i < aImages.length; i++) {
        var sSrc = aImages[i].getAttribute("src");
        if (sSrc) {
            if (sSrc.indexOf('rdCellColorSlider.png') != -1) {
                var eleSlider = aImages[i];
                var sliderID = eleSlider.getAttribute("id"); //sliderID is something like:  rdCellColorSlider-da6b4e9c-ebb3-4d4d-b084-1b207d693dc0
                var sSpectrum1Id = sliderID.replace('rdCellColorSlider', 'rdColorSpectrum1');
                var eleSpectrum1 = document.getElementById(sSpectrum1Id);
                var xSpectrum = LogiXML.getObjectX(eleSpectrum1);
                var ySpectrum = LogiXML.getObjectY(eleSpectrum1);
                eleSlider.style.left = (xSpectrum + eleSpectrum1.width) + 'px';
                eleSlider.style.top = (ySpectrum - 2) + 'px';
            }
        }
    }
};



