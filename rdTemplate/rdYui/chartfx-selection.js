// JSLint options:
/*global LogiXML: true, YUI: false, document: false, window: false, console: false */

YUI.add('chartfx-selection', function(Y) {
	//"use strict";

	var ChartFX = Y.namespace('LogiXML.ChartFX'),
		AttributeHelpers = Y.LogiXML.Attribute,
		ColorUtils = Y.LogiXML.Color,
		ImageUtils = Y.LogiXML.Image,
		CanvasUtils = Y.LogiXML.Canvas,
		Lang = Y.Lang,
		isStringNotBlank = LogiXML.String.isNotBlank,
		isStringBlank = LogiXML.String.isBlank,
		
		CLASS_KEY = 'chartfx-selection',
		LEGEND = 'legend',
		NODE = 'node',
		LABEL = 'label',
		DISABLE_HIGHLIGHT_CLASS = ChartFX.Highlight.DISABLE_HIGHLIGHT_CLASS,
		DATA_VALUE_ATTRIBUTE = 'data-valuecolumn',
		VALUE_DELIMITER = ',',
		SERIES_ID_ATTRIBUTE = ImageUtils.Map.SERIES_ID_ATTRIBUTE,
		CHART_TYPE_ATTRIBUTE = 'data-charttype',
		
		LEGEND_FLAG = ImageUtils.Map.LEGEND_FLAG,
		LEGEND_SELECTOR = '[' + LEGEND_FLAG + ']',
		LABEL_FLAG = ImageUtils.Map.LABEL_FLAG,
		LABEL_SELECTOR = '[' + LABEL_FLAG + ']',
		SELECTED = 'chartfx-selected',
		SELECTED_SELECTOR = '.' + SELECTED,
		VALID_AREA = 'chartfx-selection-include',
		VALID_AREA_SELECTOR = '.' + VALID_AREA,
		SELECTION_PROCESS_FLAG = 'data-selection-processed',
		
		EV_STATE_CLICK = 'state:click',
		EV_STATE_RESET = 'state:reset',
		EV_STATE_CHANGE = 'state:change',
	
	// Selects all elements that do not match the given selector
	notSelector = function( selector ) {
		return ':not(' + selector + ')';
	},
	
	getDataSeriesSelector = function( series ) {
		return '[data-seriesID="' + series +'"]';
	},
	
	getDataSeries = function( area ) {
		return area.getAttribute( 'data-seriesID' );
	},
	
	// There's a bug in YUI and IE8 where the :not() selector doesn't work.
	// YUI3 Ticket 2532483 - http://yuilibrary.com/projects/yui3/ticket/2532483
	notSelectorFix = function( nodeList/*, [selectors to not] */ ) {
		if ( !(nodeList instanceof Y.NodeList) || arguments.length === 1 ) {
			return nodeList;
		}
		
		var length = arguments.length,
			node, selectedNode, selector,
			i, j;
		
		for ( i = 1; i < length; i += 1 ) {
			selector = arguments[i];
			
			for ( j = 0; j < nodeList.size(); j += 1 ) {
				node = nodeList.item( j );
				
				// Test selector against self, will find youself if selector worked.  Otherwise could be another node
				selectedNode = Y.Selector.ancestor( node.getDOMNode(), selector, true );
				if ( selectedNode === node.getDOMNode() ) {
					nodeList.splice( j, 1 );
					j -= 1;
				}
			}
		}
		
		return nodeList;
	},
	
	testForNotSelector = function() {
		var bodyNode = Y.one('body'),
			testNode = Y.Node.create('<div style="display: none; position: absolute;"><div data-test-not="true"></div></div>'),
			nodelist, useNotSelector = true;
		
		bodyNode.append( testNode );
		nodelist = testNode.all( ':not([data-test-not])' );
		
		if ( nodelist.size() !== 0 ) {
			useNotSelector = false;
		}
		testNode.remove();
		return useNotSelector;
	},
	

	/*
	 * Keep track of which areas in the map have been selected or deselected.
	 */
	StateTracker = Y.Base.create('StateTracker', Y.Base, [], {
		initializer : function(config) {
			var chartNode = this.get('chart');
			UseNativeNotSelector = testForNotSelector();
			this._mapNode = ImageUtils.getMapfromImage( chartNode );
			this._markValidAreas();
			
			this._dataPointCount = UseNativeNotSelector ?
				this._mapNode.all( notSelector( LEGEND_SELECTOR ) + notSelector( LABEL_SELECTOR ) + VALID_AREA_SELECTOR ).size() :
				notSelectorFix( this._mapNode.all( VALID_AREA_SELECTOR ), LEGEND_SELECTOR, LABEL_SELECTOR ).size();
				
			this._hasLegends = Lang.isValue( this._mapNode.one( LEGEND_SELECTOR ) );
			
			this._customEvents = {};
			this._publishCustomEvents();
			
			this._handles = {};
			this._bindEvents();
		},
		
		destructor : function() {
			this._clearHandles();
			this._removeCustomEvents();
		},
		
		/*
		 * Chart Selection works solely off image maps so when they is bad data in the maps it messed up everything.
		 * Iterate over the area nodes and identify one which don't belong.  By default all are OK
		 */
		_markValidAreas : function() {
			this._mapNode.all('area').addClass( VALID_AREA );
		},
		
		_publishCustomEvents : function() {
			var customEvents = this._customEvents;
			
			customEvents.reset = this.publish(EV_STATE_RESET, {
                defaultFn: this._defResetFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'state'
            });
			
			customEvents.click = this.publish(EV_STATE_CLICK, {
                defaultFn: this._defOnClickFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'state'
            });
			
			customEvents.change = this.publish(EV_STATE_CHANGE, {
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'state'
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
		
		_bindEvents : function() {
			this._handles.areaTap = this._mapNode.delegate( 'click', this._handleTapEvent, 'area' + VALID_AREA_SELECTOR, this );
		},
		
		_clearHandles : function() {
			Y.each( this._handles, function(item) {
				if ( item ) {
					item.detach();
					item = null;
				}
			});
		},
		
		_handleTapEvent: function(ev) {
			var area = ev.currentTarget,
				facade = {}, clickType;
			
			// Which type of area of node was tapped/clicked?
			if ( area.hasAttribute( LEGEND_FLAG ) ) {
				clickType = LEGEND;
			}
			else if ( area.hasAttribute( LABEL_FLAG ) ) {
				clickType = LABEL;
			}
			else {
				clickType = NODE;
			}
			facade.clickType = clickType;
			facade.origClick = ev;
			
            this.fire( EV_STATE_CLICK, facade );
        },
		
		_defOnClickFn : function( ev ) {
			var useCtrlClick = this.get( 'ctrlClick' ),
				origClickEvent = ev.origClick,
				clickType = ev.clickType,
				useLegend = this.get( 'useLegend' ),
				area, seriesID;
			
			if ( useCtrlClick && !origClickEvent.ctrlKey ) {
				return;
			}

			area = origClickEvent.currentTarget;
			seriesID = getDataSeries( area );
			
			// Click on Legend, mass selection or deselection
			if ( clickType === LEGEND ) {
				if ( !useLegend ) {
					return;
				}
				this._legendClick( area, seriesID );
			}
			else if ( clickType === LABEL ) {
				this._labelClick( area, seriesID );
			}
			// Single node selection or deselection
			else {
				this._nodeClick( area, seriesID );
			}
			
			this.fire( EV_STATE_CHANGE, { changeSource : area } );
		},
		
		_legendClick : function( area, seriesID ) {
			var items = UseNativeNotSelector ?
				this._mapNode.all( getDataSeriesSelector( seriesID ) + notSelector( LABEL_SELECTOR ) ) :
				notSelectorFix( this._mapNode.all( getDataSeriesSelector( seriesID ) ), LABEL_SELECTOR );
			
			// Deselect
			if ( area.hasClass( SELECTED ) ) {
				items.removeClass( SELECTED );
			}
			// Select
			else {
				items.addClass( SELECTED );
			}
		},
		
		// Pie Charts have labels pointing to their pie wedge.  These are added to the image map by Chart Director
		// and use by Action elements and Quicktips.  We need to check seriesID and find Pie Wedge to actually highlight.
		_labelClick : function( area, seriesID ) {
			var mapNode = this._mapNode,
				node;
			
			if ( UseNativeNotSelector ) {
				node = mapNode.one( getDataSeriesSelector( seriesID ) + notSelector( LEGEND_SELECTOR ) + notSelector( LABEL_SELECTOR ) + VALID_AREA_SELECTOR );
			}
			else {
				node = notSelectorFix( mapNode.all( getDataSeriesSelector( seriesID ) + VALID_AREA_SELECTOR ), LEGEND_SELECTOR, LABEL_SELECTOR ).item( 0 );
				
			}
			this._nodeClick( node, seriesID );
		},
		
		_nodeClick : function( area, seriesID ) {
			var useLegend = this.get( 'useLegend' );
			
			// Deselect
			if ( this.isNodeSelected( area ) ) {
				area.removeClass( SELECTED );
			}
			// Select
			else {
				area.addClass( SELECTED );
			}
			
			if ( useLegend && isStringNotBlank( seriesID ) ) {
				this._syncLegend( area, seriesID );
			}
		},
		
		_syncLegend : function( area, seriesID ) {
			var mapNode = this._mapNode,
				items, filteredItems, legend;
			
			seriesID = seriesID || getDataSeries( area );
			
			// Get all items for this data series minus legend and label
			items = UseNativeNotSelector ?
				mapNode.all( getDataSeriesSelector( seriesID ) + notSelector( LEGEND_SELECTOR ) + notSelector( LABEL_SELECTOR ) + VALID_AREA_SELECTOR ) :
				notSelectorFix( mapNode.all( getDataSeriesSelector( seriesID ) + VALID_AREA_SELECTOR ), LEGEND_SELECTOR, LABEL_SELECTOR );
			
			filteredItems = items.filter( SELECTED_SELECTOR );
			legend = mapNode.one( getDataSeriesSelector( seriesID ) + LEGEND_SELECTOR + VALID_AREA_SELECTOR );
			
			// Are all the data points deselected?
			if ( filteredItems.size() !== items.size() ) {
				legend.removeClass( SELECTED );
			}
			// Are all the data points selected?
			else if ( filteredItems.size() === items.size() ) {
				legend.addClass( SELECTED );
			}
		},
		
		selectNode : function( node, syncLegend ) {
			var mapNode = this._mapNode,
				ancestor;
				
			syncLegend = Lang.isValue( syncLegend ) ? syncLegend : true;
			
			// Is the node a child of the Map?  Otherwise ignore it
			ancestor = node.ancestor( function( parentNode ) {
				return mapNode === parentNode;
			});
			
			if ( ancestor ) {
				node.addClass( SELECTED );
				
				if ( syncLegend ) {
					this._syncLegend( node );
				}
			}
		},
		
		selectNodes : function( nodeList ) {
			if ( !Lang.isValue( nodeList ) || nodeList.isEmpty() ) {
				return;
			}
			
			var seriesFound = {},
				useLegend = this.get( 'useLegend' );

			// Select each node individually, keep track of which series are selected
			nodeList.each( function( node ) {
				this.selectNode( node, false );
				
				var series = getDataSeries( node );
				if ( seriesFound[series] !== true ) {
					seriesFound[series] = true;
				}
			}, this );
			
			// Sync selected series with associated legend
			if ( useLegend ) {
				Y.each( seriesFound, function( value, series ) {
					this._syncLegend( undefined, series );
				}, this);
			}
		},
		
		isNodeSelected : function( node ) {
			return node.hasClass( SELECTED );
		},
		
		isNodeDeselected : function( node ) {
			return !this.isNodeSelected( node );
		},
		
		getSelectedItems : function() {
			return UseNativeNotSelector ?
				this._mapNode.all( SELECTED_SELECTOR + notSelector( LEGEND_SELECTOR ) + notSelector( LABEL_SELECTOR ) ) :
				notSelectorFix( this._mapNode.all( SELECTED_SELECTOR ), LEGEND_SELECTOR, LABEL_SELECTOR );
		},
		
		getDeselectedItems : function() {
			var items = UseNativeNotSelector ? 
				this._mapNode.all( notSelector( SELECTED_SELECTOR ) + notSelector( LEGEND_SELECTOR ) + notSelector( LABEL_SELECTOR ) + VALID_AREA_SELECTOR ) :
				notSelectorFix( this._mapNode.all( VALID_AREA_SELECTOR ), SELECTED_SELECTOR, LEGEND_SELECTOR, LABEL_SELECTOR );
			
			// Nothing selected, send empty list back instead of everything
			if ( this._dataPointCount === items.size() ) {
				return new Y.NodeList();
			}
			
			return items;
		},
		
		reset : function() {
			this.fire( EV_STATE_RESET );
		},
		
		_defResetFn : function() {
			this._mapNode.all( SELECTED ).removeClass( SELECTED );
			this.fire( EV_STATE_CHANGE, { changeSource : undefined } );
		}
	}, {
		NAME: 'StateTracker',
		ATTRS: {
			chart: {
				setter: Y.one
			},
			ctrlClick: {
				value: false,
				setter: AttributeHelpers.booleanSetter
			},
			useLegend: {
				value: false,
				setter: AttributeHelpers.booleanSetter
			}
		}
	});
	
	
	
	/* ----------- Pie Chart State Tracker ----------- */
	var PieStateTracker = function() {
		PieStateTracker.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( PieStateTracker, StateTracker, {
		// Override
		_markValidAreas : function() {
			// Ignore areas which are pie chart labels
			var nodes = UseNativeNotSelector ?
						this._mapNode.all( 'area' + notSelector( LABEL_SELECTOR ) ) :
						notSelectorFix( this._mapNode.all( 'area' ), LABEL_SELECTOR );
						
			nodes.addClass( VALID_AREA );
		}
	}, {
		NAME: 'PieStateTracker'
	});
	
	
	
	/* ----------- Bar Chart State Tracker ----------- */
	var BarStateTracker = function() {
		BarStateTracker.superclass.constructor.apply(this, arguments);
	};
	
	/*
	 * State Tracker for Bar charts requires some unique tweaks.
	 * Single series chart - Behave like normal
	 * Multi-series chart - Click on bar selects all bar corresponding to that X axis value.  In essence
	 * you select all grouped or stacked bars.  Thus selection represents the X axis value.
	 */
	Y.extend( BarStateTracker, StateTracker, {
		
		// Override
		_markValidAreas : function() {
			var mapNode = this._mapNode,
				chartType = mapNode.getAttribute( CHART_TYPE_ATTRIBUTE ).toLowerCase(),
				chartSeriesTypes = mapNode.getAttribute( 'data-series-types' ).split(',');
			
			mapNode.all( 'area' ).each( function( node ) {
				var seriesID = node.getAttribute( SERIES_ID_ATTRIBUTE );
				if ( isStringNotBlank( seriesID ) ) {
					
					// Make sure seriesID of area matches the main chart.  Otherwise it could be
					// a Trend Line, Lowess Line or Extra Grid Layer that doesn't match
					seriesID = parseInt( seriesID, 10 );
					if ( !isNaN( seriesID ) && chartType === chartSeriesTypes[seriesID - 1].toLowerCase() ) {
						node.addClass( VALID_AREA );
					}
				}
			});
		},
		
		// Override
		_legendClick : function( area, seriesID ) {
			// A legend click with multi series bar chart means everything is selected
			var items = UseNativeNotSelector ?
				this._mapNode.all( notSelector( LABEL_SELECTOR ) + VALID_AREA_SELECTOR ) :
				notSelectorFix( this._mapNode.all( VALID_AREA_SELECTOR ), LABEL_SELECTOR );
			
			// Deselect
			if ( area.hasClass( SELECTED ) ) {
				items.removeClass( SELECTED );
			}
			// Select
			else {
				items.addClass( SELECTED );
			}
		},
		
		// Override
		_nodeClick : function( area, seriesID ) {
			// A node click needs to select all fellow X axis values
			BarStateTracker.superclass._nodeClick.call( this, area, seriesID );
			
			var dataValue = area.getAttribute( DATA_VALUE_ATTRIBUTE ),
				items = this._mapNode.all( '[' + DATA_VALUE_ATTRIBUTE + '="' + dataValue + '"]' + VALID_AREA_SELECTOR );
			
			// Select
			if ( area.hasClass( SELECTED ) ) {
				items.addClass( SELECTED );
			}
			// Deselect
			else {
				items.removeClass( SELECTED );
			}
		}
	}, {
		NAME: 'BarStateTracker'
	});
	
	
	
	/* --------- Default Chart Selection --------- */
	var Selection = Y.Base.create('Selection', Y.Base, [], {
		initializer : function() {
			var chartNode = this.get( 'chart' ),
				inputNode;
			
			this._mapNode = ImageUtils.getMapfromImage( chartNode );
			this._canvasScreen = this._createCanvasScreen( chartNode );
			this._stateTracker = this._createStateTracker( chartNode );
			this._parseHTMLConfig();
			
			// Look for associated hidden input, create if necessary
			inputNode = Y.one( '#' + LogiXML.escapeSelector(this._inputID));
			if ( !Lang.isValue( inputNode ) ) {
				inputNode = this._createInput( this._inputID, chartNode );
			}
			this._hiddenInput = inputNode;
			
			this._handles = {};
			this._bindEvents();
			
			chartNode.setData( CLASS_KEY, this );
			
			this._mapNode.setAttribute( SELECTION_PROCESS_FLAG, true );
			
			// Sync HTML with UI after initialization is completed
			this.onceAfter( 'initializedChange', this.syncUI, this );
		},
		
		destructor : function() {
			this._stateTracker.destroy();
			this._canvasScreen.destroy();
			this._clearHandles();
		},
		
		syncUI : function() {
			var delimitedString = this._hiddenInput.get( 'value' ),
				delimiter = this.get( 'delimiter' ),
				stateTracker = this._stateTracker,
				mapNode = this._mapNode,
				dataValues = delimitedString.split( delimiter );
			
			if ( isStringBlank( delimitedString ) ) {
				return;
			}
			
			Y.each( dataValues, function( val ) {
				var nodeList = mapNode.all( '[' + DATA_VALUE_ATTRIBUTE + '="' + val + '"]' + VALID_AREA_SELECTOR );
				stateTracker.selectNodes( nodeList );
			}, this );
			
			this.drawCurrentState();
		},
		
		_parseHTMLConfig : function() {
			var mapNode = this._mapNode,
				options = mapNode.getAttribute( 'data-selection-options' );
			
			this.set( 'delimiter', mapNode.getAttribute( 'data-selection-delimiter' ) );
			
			if ( isStringBlank( options ) ) {
				return;
			}
			
			options = options.split( this.get( 'delimiter' ) );
			this._inputID = options[0];
			this.set( 'emphasisColor', options[1] );
			this.set( 'emphasisOpacity', options[2] );
			this.set( 'deemphasisColor', options[3] );
			this.set( 'deemphasisOpacity', options[4] );
		},
		
		_createCanvasScreen : function( chartNode ) {
			var canvasScreen = new ChartFX.CanvasScreen({
				chart: chartNode,
				canvasLocation: 'wrapper' // Insert canvas as first child of wrapper so it's behind all the other elements
			});
			
			return canvasScreen;
		},
		
		_createStateTracker : function( chartNode ) {
			return new StateTracker({
				chart: chartNode
			});
		},
		
		_createInput : function( id, chartNode ) {
			var inputNode = Y.Node.create( '<input type="hidden" />');
			inputNode.set( 'id', id );
			inputNode.set( 'name', id );
			
			chartNode.insert( inputNode, 'after' );
			return inputNode;
		},
		
		_bindEvents : function() {
			var handles = this._handles,
				chartNode = this.get('chart');
			
			handles.stateChange = this._stateTracker.on( 'state:change', this._onStateChange, this );
			handles.chartResizeStart = chartNode.on( 'resize:start', this._onChartResizeStart, this );
			handles.chartResizeEnd = chartNode.on( 'resize:end', this._onChartResizeEnd, this );
		},
		
		_clearHandles : function() {
			var handles = this._handles;
			
			Y.each( handles, function(item) {
				if ( item ) {
					item.detach();
					item = null;
				}
			});
		},
		
		_onStateChange : function( ev ) {
			var selectedItems = this._stateTracker.getSelectedItems();
			
			this.drawCurrentState();
			this.populateInput( selectedItems );
		},
		
		_onChartResizeStart : function() {
			// Restore chart opacity and remove canvas
			this.get( 'chart' ).setStyle( 'opacity', 1.0 );
			this._canvasScreen.destroy();
		},
		
		_onChartResizeEnd : function() {
			ChartFX.Selection.reinitializeAfterResize( this.get('chart'), this );
		},
		
		drawCurrentState : function( selectedItems, deselectedItems ) {
			var context = this._canvasScreen.getCanvasContext(),
				stateTracker = this._stateTracker;
			
			selectedItems = selectedItems || stateTracker.getSelectedItems();
			deselectedItems = deselectedItems || stateTracker.getDeselectedItems();
			
			// Clear canvas
			this._canvasScreen.clearCanvas();
			
			// Demphasize deselected items
			if ( !deselectedItems.isEmpty() ) {
				deselectedItems.removeClass( DISABLE_HIGHLIGHT_CLASS );
				this.drawDeselected( deselectedItems, context );
			}
			// If no items are deselected, clear the DISABLE_HIGHLIGHT_CLASS
			else {
				this._mapNode.all( '.' + DISABLE_HIGHLIGHT_CLASS ).removeClass( DISABLE_HIGHLIGHT_CLASS );
			}
			
			// Disable highlight on selected items
			if ( !selectedItems.isEmpty() ) {
				selectedItems.addClass( DISABLE_HIGHLIGHT_CLASS );
				this.drawSelected( selectedItems, context );
			}
		},
		
		drawSelected : function( selectedNodes, context ) {
			this.draw( selectedNodes, this.get( 'emphasisColor' ), this.get( 'emphasisOpacity' ), context );
		},
		
		drawDeselected : function( deselectedNodes, context ) {
			this.draw( deselectedNodes, this.get( 'deemphasisColor' ), this.get( 'deemphasisOpacity' ), context );
		},
		
		draw : function( nodes, color, opacity, context ) {
			if ( !Lang.isValue( color ) || isStringBlank( color ) ) {
				return;
			}
			
			context.save();
			context.fillStyle = ColorUtils.hexToCSS_RGB( color, opacity );
			
			nodes.each( function( node ) {
				CanvasUtils.drawAreaMapShape( context, node );
				context.fill();
			}, this );
			
			context.restore();
		},
		
		populateInput : function( selectedNodeList ) {
			var inputNode = this._hiddenInput,
				delimitedString = '',
				delimiter = this.get( 'delimiter' ),
				previousValues = {},
				inputOnChange;
			
			selectedNodeList.each( function( node ) {
				var dataValue = node.getAttribute( DATA_VALUE_ATTRIBUTE );
				
				// Filter out duplicate values
				if ( previousValues[dataValue] === undefined ) {
					previousValues[dataValue] = true;
					
					if ( delimitedString === '' ) {
						delimitedString = dataValue;
					}
					else {
						delimitedString = delimitedString + delimiter + dataValue;
					}
				}
			});
			
			inputNode.set( 'value', delimitedString );
			
			// If onchange function is defined, call it
			inputOnChange = inputNode.getDOMNode().onchange;
			if ( typeof inputOnChange === 'function' ) {
				inputOnChange();
			}
		}
	}, {
		NAME: 'selection',
		ATTRS: {
			chart: {
				setter: Y.one,
				validator: function( val ) {
					var node = Y.one( val );
					return node instanceof Y.Node && node.get('tagName') === 'IMG';
				}
			},
			
			emphasisColor: {
				validator: isStringNotBlank
			},
			
			emphasisOpacity: {
				value: 0.0,
				validator: LogiXML.opacityValidator
			},
			
			deemphasisColor: {
				value: '#1e1e1e',
				validator: isStringNotBlank
			},
			
			deemphasisOpacity: {
				value: 0.45,
				validator: LogiXML.opacityValidator
			},
			
			delimiter: {
				value: VALUE_DELIMITER,
				validator: isStringNotBlank
			}
		}
	});
	
	
	
	/* --------- Bar Chart Selection --------- */
	var BarChart = function() {
		BarChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( BarChart, Selection, {
		// Override
		_createStateTracker : function( chartNode ) {
			return new BarStateTracker({
				chart: chartNode
			});
		}
	}, {
		NAME: 'SelectionBarChart'
	});
	
	
	/* --------- Pie Chart Selection --------- */
	var PieChart = function() {
		PieChart.superclass.constructor.apply(this, arguments);
	};
	
	Y.extend( PieChart, Selection, {
	
		initializer : function() {
			this._parseHTMLConfig_PieChart();
		},
		
		// Override
		_createStateTracker : function( chartNode ) {
			return new PieStateTracker({
				chart: chartNode
			});
		},
		
		_parseHTMLConfig_PieChart : function() {
			var mapNode = this._mapNode,
				settings = ImageUtils.Map.parsePieChartRenderSettings( mapNode );
			
			if ( Y.Lang.isValue( settings ) ) {
				this._ellipsePie = settings.ellipsePie;
				this._pieCenter = settings.pieCenter;
				this._pieRadius = settings.pieRadius;
				this._pieInnerRadius = settings.pieInnerRadius;
			}
			else {
				return false;
			}
		},
		
		// Override
		draw : function( nodes, color, opacity, context ) {
			if ( !Lang.isValue( color ) || isStringBlank( color ) ) {
				return;
			}
		
			if ( this._ellipsePie ) {
				PieChart.superclass.draw.apply( this, arguments );
				return;
			}
			
			context.save();
			context.fillStyle = ColorUtils.hexToCSS_RGB( color, opacity );
			
			nodes.each( function( node ) {
				CanvasUtils.drawPieWedgeFromArea( context, node, this._pieCenter, this._pieRadius, this._pieInnerRadius );
				context.fill();
			}, this );
			
			context.restore();
		}
	}, {
		NAME: 'SelectionPieChart',
		ATTRS: {
		}
	});
	
	ChartFX.Selection = {};
	ChartFX.Selection.BarChart = BarChart;
	ChartFX.Selection.PieChart = PieChart;
	
	ChartFX.Selection.initializeAll = function() {
		var charts = Y.all( '.' + CLASS_KEY );
		
		if ( !charts.isEmpty() ) {
			charts.each( function( node ) {
				var usemap = ImageUtils.getChartMapName( node ),
					usemapNode = ImageUtils.getMapfromImage( node );
				node.removeClass( CLASS_KEY );
				
				if ( usemapNode ) 
					ChartFX.Selection.initializeChart(node);
				else {
					// Wait for image map to load, then initialize Selection
					// this = imgNode
					Y.once( 'contentready', ChartFX.Selection.initializeChart, 'map[name=' + usemap + ']', this );
				}
			});
		}
	};
	
	ChartFX.Selection.initializeChart = function( node ) {
		var imgNode = node || this,
			mapNode = ImageUtils.getMapfromImage( imgNode ),
			chartType = mapNode.getAttribute( CHART_TYPE_ATTRIBUTE ),
			selection;
			
		if ( Y.Lang.isString( chartType ) ) {
			chartType = chartType.toLowerCase();
			
			if ( chartType === 'pie' ) {
				ImageUtils.Map.checkForPieChartLabels( mapNode );
				selection = new PieChart({
					chart: imgNode
				});
			}
			else if ( chartType === 'bar' ) {
				selection = new BarChart({
					chart: imgNode
				});
			}
		}
	};
	
	/*
	 * Resizer currently works by changing the src attribute of images.  After loading new image, a
	 * new image map is pulled down as well.  We need to remove the old image map, as the name stays
	 * the same, otherwise we wouldn't know when the new one is loaded.  We also look for
	 * 'data-highlight-processed' attribute, it gets added during highlight initialization, to know
	 * whether this is the old image map or new one.
	 */
	ChartFX.Selection.reinitializeAfterResize = function( node, selectionInstance ) {
		var usemap = ImageUtils.getChartMapName( node ),
			mapSelector = 'map[name=' + usemap + ']',
			map = Y.one( mapSelector );
		
		if ( map && map.hasAttribute( SELECTION_PROCESS_FLAG ) ) {
			map.remove( true );
		}
		
		// Destroy the old instance
		selectionInstance.destroy();
		
		// Wait for image map to load, then initialize Highlight
		Y.once( 'contentready', ChartFX.Selection.initializeChart, mapSelector, node );
	};
	
	if ( LogiXML.Ajax.AjaxTarget ) {
		LogiXML.Ajax.AjaxTarget().on( 'reinitialize', ChartFX.Selection.initializeAll );
	}
	
	// Register Chart Selection class with custom destroy code
	Y.LogiXML.Node.destroyClassKeys.push( CLASS_KEY );
	
}, '1.0.0', {requires: ['dom-base', 'node-base', 'base', 'event', 'dom-style-ie', 'selector-css2', 'image-utils', 'color-utils', 'canvas-utils', 'attribute-helpers', 'node-custom-destroy', 'chartfx-canvas-screen', 'chartfx-highlight'] });