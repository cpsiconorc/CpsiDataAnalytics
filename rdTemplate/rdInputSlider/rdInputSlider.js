YUI.add('inputslider', function(Y) {

	var InputSlider = Y.namespace('LogiXML.InputSlider');
	
	InputSlider.initialize = function() {
		//Initialize sliders
		LogiXML.InputSlider._rdInitInputSliders();		
		
		//Wire up for re-int after refreshelement
		LogiXML.Ajax.AjaxTarget().on('reinitialize', function(e) { LogiXML.InputSlider._rdInitInputSliders(); });
	};
	
	//Initilize all sliders on the page
	InputSlider._rdInitInputSliders = function() {
		var sliderNodes = Y.all('.yui3-slider-rail');
		
		for (var i = 0; i < sliderNodes.size(); i++) {
			//Make sure that the slider is not already initilized.
			if (sliderNodes.item(i).one('.yui3-dd-draggable') === null)		
				LogiXML.InputSlider.rdInputSliderLoad(sliderNodes.item(i).getDOMNode().parentNode.id.replace('rdInputSliderBg_',''));
		}
	};
	
	InputSlider.rdInputSliderLoad = function(sliderID) {
		var eleSlider = document.getElementById(sliderID)	
		
		if (!LogiXML.isNodeVisible(Y.one(eleSlider.parentNode))) {return} //Load it later, when there's an Action.ShowElement.
		if (eleSlider) {
		
			var sliderInstance;			
			var sSliderOrientation = eleSlider.getAttribute('SliderOrientation');
			var slider2ID = eleSlider.getAttribute('Slider2Id');
			var nSliderLength = parseInt(eleSlider.getAttribute('SliderLength'));
			var nDecimalPoints = parseInt(eleSlider.getAttribute('DecimalPoints'));
			var decimalFactor = Math.pow(10,nDecimalPoints);
			var thumbSeparationValue = parseFloat(eleSlider.getAttribute('ThumbSeparationValue'));
			var nTickCount = parseInt(eleSlider.getAttribute('TickCount'));
			var nMinConstraint = parseInt(eleSlider.getAttribute('MinConstraint'));
			var nMaxConstraint = parseInt(eleSlider.getAttribute('MaxConstraint'));
			var sliderBackgroundUrl = eleSlider.getAttribute('BackgroundImageUrl');
			var nThumbOffsetLeft = parseInt(eleSlider.getAttribute('SliderThumbOffsetLeft'));
			var nThumbOffsetTop = parseInt(eleSlider.getAttribute('SliderThumbOffsetTop'));		
			var nNonZeroStartValue;       			
					
			if (!slider2ID) {	
			
				//One thumb				
				if (sSliderOrientation && sSliderOrientation == 'Vertical') {
					//Create the control				
					sliderInstance = new Y.rdSlider({
						id: sliderID,
						axis: 'y',
						min: nMinConstraint * decimalFactor,
						max: nMaxConstraint * decimalFactor,
						length: nSliderLength
					});
				}
				else {
					//Create the control				
					sliderInstance = new Y.rdSlider({
						id: sliderID,							
						min: nMinConstraint * decimalFactor,
						max: nMaxConstraint * decimalFactor,
						length: nSliderLength
					});		
				}
				sliderInstance.set('decimalfactor', decimalFactor);
					
				//Initialize tick count				
				if (nTickCount) sliderInstance.set('tickCount', nTickCount);	
				
				sliderInstance.renderRail = function() {
					return Y.one('#rdBackground_' + sliderID);
				};				
				sliderInstance.renderThumb = function() {
					return this.rail.one('#rdThumb_' + sliderID);
				};				
				sliderInstance.render('#rdInputSliderBg_' + sliderID);
				
				//Set offset
				if (nThumbOffsetLeft) sliderInstance.thumb.setStyle('paddingLeft', nThumbOffsetLeft);
				if (nThumbOffsetTop) sliderInstance.thumb.setStyle('paddingTop', nThumbOffsetTop);
				
				if (eleSlider.value.length == 0) {
					eleSlider.value = nMinConstraint;
				}
				sliderInstance.setValue(eleSlider.value * decimalFactor);				
					
			}
			else {  			
				//Two thumbs
				var eleSlider2 = eleSlider.parentNode.nextSibling.firstChild;
							
				//Create the control			
				if (sSliderOrientation && sSliderOrientation == 'Vertical') {
					//Create the control				
					sliderInstance = new Y.DualSlider({
						id: sliderID,
						axis: 'y',
						min: nMinConstraint * decimalFactor,
						max: nMaxConstraint * decimalFactor,
						length: nSliderLength							
					});
				}
				else {
					//Create the control				
					sliderInstance = new Y.DualSlider({
						id: sliderID,							
						min: nMinConstraint * decimalFactor,
						max: nMaxConstraint * decimalFactor,
						length: nSliderLength
					});							
				}
				sliderInstance.set('decimalfactor', decimalFactor);
				sliderInstance.set('slider2ID', slider2ID);
				
				//Initialize tick count				
				if (nTickCount) sliderInstance.set('tickCount', nTickCount);	
				
				//Initialize thumb separation
				sliderInstance.set('thumbSeparation', thumbSeparationValue * decimalFactor);

				sliderInstance.renderRail = function() {
					return Y.one('#rdBackground_' + sliderID);
				};
				sliderInstance.renderThumb = function() {
					return this.rail.one('#rdThumb_' + sliderID);
				};				
				sliderInstance.renderThumb2 = function() {
					return this.rail.one('#rdThumb_' + slider2ID);
				};				
				sliderInstance.render('#rdInputSliderBg_' + sliderID);
				
				//Set offset
				if (nThumbOffsetLeft) {
					sliderInstance.thumb.setStyle('paddingLeft', nThumbOffsetLeft);
					sliderInstance.thumb2.setStyle('paddingLeft', nThumbOffsetLeft);
				}
				if (nThumbOffsetTop) {
					sliderInstance.thumb.setStyle('paddingTop', nThumbOffsetTop);
					sliderInstance.thumb2.setStyle('paddingTop', nThumbOffsetTop);
				}
				
				//Set value for first thumb
				if (eleSlider.value.length == 0) {
					eleSlider.value = nMinConstraint;
				}
				//Ensure adequate separation from the end.
				if (parseInt(eleSlider.value) + thumbSeparationValue > nMaxConstraint ) {
					eleSlider.value = nMaxConstraint - thumbSeparationValue;
				}
				sliderInstance.setValue(eleSlider.value * decimalFactor);	
				//Set value for second thumb
				if (eleSlider2.value.length == 0){
					eleSlider2.value = nMaxConstraint;
				}
				//Ensure adequate separation.
				if (parseInt(eleSlider.value) + thumbSeparationValue > eleSlider2.value  ) {
					eleSlider2.value = Math.min(parseInt(eleSlider.value) + thumbSeparationValue, nMaxConstraint)
				}
				sliderInstance.setValue2(eleSlider2.value * decimalFactor);	
			
			}
			
			sliderInstance.after(['valueChange', 'value2Change'], InputSlider._afterValueChange);
			sliderInstance.after(['slideEnd', 'railMouseDown'], InputSlider._afterSlideEnd);

			//Set background image if set
			if (sliderBackgroundUrl) {
				var bgImage = document.createElement('img');
				
				bgImage.onload = function(e) { InputSlider.loadCustomBackground(e, sliderInstance, sliderBackgroundUrl, bgImage, sSliderOrientation); }
						
				bgImage.src = sliderBackgroundUrl;
			}
			
			Y.one(eleSlider).setData('sliderInstance', sliderInstance);
		}			
	};
	
	InputSlider.loadCustomBackground = function(e, sliderInstance, sliderBackgroundUrl, bgImage, sSliderOrientation) {
		if ( bgImage.width > 0 ) {
			sliderInstance.rail.setStyle('backgroundImage', 'url("' + sliderBackgroundUrl + '")');
							
			//Set rail dimension to fit the image
			switch (sSliderOrientation) {
				case 'Horizontal':						
					sliderInstance.rail.setStyle('height', bgImage.height + 'px');
					break;
				case 'Vertical':						
					sliderInstance.rail.setStyle('width', bgImage.width + 'px');
					break;
			}
		}
	};
	
	/* -----Events----- */

	InputSlider._afterValueChange = function(e) {
		var sliderInstance = e.currentTarget;
		var sliderID = sliderInstance.get('id');
		var eleSlider = document.getElementById(sliderID);				
		
		if (e.attrName == 'value2')
			eleSlider = document.getElementById(sliderInstance.get('slider2ID'));				
						
		if (eleSlider) {				
		
			//Handle decimals
			eleSlider.value = e.newVal / sliderInstance.get('decimalfactor');
			
			//Fire the onchange event for special ondrag element.
			var eleSliderChange = document.getElementById(sliderID + "_ondrag");
			if (eleSliderChange)
				eleSliderChange.onchange();		
		}
	};
	
	InputSlider._afterSlideEnd = function(e) {
		var sliderInstance = e.currentTarget;
		var sliderID = sliderInstance.get('id');
		
		sliderInstance.syncUI();  

		//Fire the onchange event for special slideEnd element.
		var eleSliderChange = document.getElementById(sliderID + '_onchange');
		if (Y.Lang.isValue(eleSliderChange))
			eleSliderChange.onchange();	
		else { //#16960 also support onChange case
			eleSliderChange = document.getElementById(sliderID + '_onChange');
			
			if (Y.Lang.isValue(eleSliderChange))
				eleSliderChange.onchange();	
		}
	};

	LogiXML.InputSlider = InputSlider;	
		
}, '1.0.0', { requires: ['slider', 'rdslider', 'dualslider'] });


function rdInputSliderSet(sliderID, sRealValue) {
    var eleSlider = Y.one('#' + sliderID);
    if (Y.Lang.isValue(eleSlider)) {
        var sliderInstance = eleSlider.getData('sliderInstance');
        var nRealValue = parseInt(sRealValue);
        sliderInstance.setValue(nRealValue);
    }
};

//NEEDS to be replaced with uniform event that can be fired by tabs and action-show-element
function rdShowHiddenInputSliders(eleParent) {
	if (Y.Lang.isValue(LogiXML.InputSlider.rdInputSliderLoad))
		_rdShowHiddenInputSliders(eleParent);
	else
		setTimeout(function () {rdShowHiddenInputSliders(eleParent);}, 100);
}

function _rdShowHiddenInputSliders(eleParent) {
    var sHtml = eleParent.innerHTML;
    var nCurrPos = sHtml.indexOf("rdInputSliderBg_");
    while (nCurrPos!=-1) {
        if (sHtml.substring(nCurrPos - 5,nCurrPos + 5).indexOf('id=') != -1) { //13695
            var sliderID = sHtml.substring(nCurrPos + 16,sHtml.indexOf(' ',nCurrPos))
            if (sliderID.indexOf('"')!=-1){
                sliderID = sliderID.substring(0,sliderID.indexOf('"')); //For Mozilla
            }
			if (!Y.Lang.isValue(Y.one('#rdInputSliderBg_' + sliderID).one('.yui3-dd-draggable')))
				LogiXML.InputSlider.rdInputSliderLoad(sliderID);
        }
        nCurrPos = sHtml.indexOf("rdInputSliderBg_",nCurrPos + 1);
    }
}