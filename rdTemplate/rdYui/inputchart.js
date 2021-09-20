// JSLint options:
/*jslint evil: true*/
/*global LogiXML, YUI, document, window*/

YUI.add('inputchart', function(Y) {
	//"use strict";

	var Lang = Y.Lang,
		LogiForm = Y.LogiXML.Form,
		ImageUtils = Y.LogiXML.Image,
		XYChartTypes = LogiForm.InputChartXY.SUPPORTED_CHART_TYPES,
		INPUTCHART_CLASS_TRIGGER = 'LogiInputChart',
		getChartMapName = Y.LogiXML.Image.getChartMapName,
		
	validateChartType = function(val, chartTypes) {
		return Lang.isString( val ) && Y.Array.lastIndexOf( chartTypes, val ) !== -1;
	};
	
	LogiForm.initializeInputCharts = function() {
		var inputCharts = Y.all( '.' + INPUTCHART_CLASS_TRIGGER );
		
		if ( inputCharts.size() !== 0 ) {
			inputCharts.each( function( node ) {
				// Clear class early so there's no chance another initialize call is made before the map is downloaded
				node.removeClass( INPUTCHART_CLASS_TRIGGER );
				var usemap = ImageUtils.getChartMapName( node ),
					usemapNode = ImageUtils.getMapfromImage( node );
				
				if (usemapNode)
					LogiForm.initializeInputChart(node);
				else {		
					// Wait for image map to load, then initialize InputChart					
					Y.once('contentready', Y.bind(LogiForm.initializeInputChart, this, node), 'map[name=' + usemap + ']');
				}
			}, this);
		}
	};
	
	LogiForm.initializeInputChart = function( imgNode ) {
		var mapNode = ImageUtils.getMapfromImage( imgNode ),
			configNode = Y.one('#' + imgNode.getAttribute('data-inputParams') ),
			chartType = mapNode.getAttribute('data-chartType'),
			inputChart;
			
		if ( imgNode && chartType ) {
			chartType = chartType.toLowerCase();
			
			if ( validateChartType( chartType, XYChartTypes ) ) {
				inputChart = new LogiForm.InputChartXY({
					chart: imgNode,
					configNode: configNode
				});
			}
			imgNode.removeClass( INPUTCHART_CLASS_TRIGGER );
		}
	};
	
	/*
	 * Resizer currently works by changing the src attribute of images.  After loading new image, a
	 * new image map is pulled down as well.  We need to remove the old image map, as the name stays
	 * the same, otherwise we wouldn't know when the new one is loaded.  We also look for
	 * 'data-inputChartProcessed' attribute, gets added during inputchart initialization, to know
	 * whether this is the old image map or new one.
	 */
	LogiForm.reinitializeInputChartAfterResize = function( node, inputChart ) {
		var usemap = getChartMapName( node ),
			map = Y.one('map[name=' + usemap + ']');
			
		if ( map && map.hasAttribute('data-inputChartProcessed') ) {
			map.remove(true);
		}
		
		// Destroy the old instance
		inputChart.destroy();
		
		// Wait for image map to load, then initialize InputChart
		Y.once('contentready', Y.bind(LogiForm.initializeInputChart, this, node), 'map[name=' + usemap + ']');
	};
	
	if ( LogiXML.Ajax.AjaxTarget ) {
		LogiXML.Ajax.AjaxTarget().on( 'reinitialize', LogiForm.initializeInputCharts );
	}
	
}, '1.0.0', {requires:['array-extras', 'event', 'inputchart-xy', 'image-utils']});