// JSLint options:
/*global LogiXML, YUI, document, window*/

YUI.add('quicktip', function (Y) {
	//"use strict";
	
	var Lang = Y.Lang,
		StringUtils = LogiXML.String,
		QUOTE_ESCAPED = '&quot;',
		HEADER_CLASS = 'header',
		BODY_CLASS = 'body',
		POINTER_CLASS = 'quicktip-pointer',
		HEADER_TEMPLATE = '<div class="' + HEADER_CLASS + '"></div>',
		BODY_TEMPLATE = '<div class="' + BODY_CLASS + '"></div>',
		POINTER_TEMPLATE = '<div class="' + POINTER_CLASS + '"><div class="quicktip-pointer-inner"></div></div>',
		BOUNDING_BOX = "boundingBox",
		CONTENT_BOX = "contentBox",
		// DOM Custom Data Attributes
		DATA_TITLE = 'data-tiptitle',
		DATA_DESCRIPTION = 'data-tipdescription',
		DATA_JSON = 'data-tipjson',
		DATA_JSON_VAR = 'data-tipjsonvar',
		// Key for local caching
		JSON_LOCAL_CACHE = 'tt-json';
	
	Y.namespace('LogiXML').rdQuicktip = Y.Base.create('rdQuicktip', Y.Widget, [Y.WidgetPosition, Y.WidgetPositionConstrain], {
		/*
         * Initialization Code: Sets up privately used state
         * properties, and publishes the events Tooltip introduces
         */
        initializer : function(config) {
		
			this._trigger = {
				// Current Trigger Node
				node: null,
				// Hold title text if present on Trigger Node
				titleText: null,
				// Allows individual nodes to override a few of the class wide options
				renderPointer: null,
				fixedElementSelector: null
			};
		
			// Event handlers - mouse over is set on the delegate element,
			// mousemove and mouseleave are set on current trigger node
			this._eventHandles = {
				delegate: null,
				trigger: {
					mouseMove: null,
					mouseOut: null
				}
			};
			
			// Show/hide timers
			this._timers = {
				show: null,
				hide: null
			};
			
			// Server sends a lot of empty strings down.  I don't know whether to render or not 
			// until parsing the content so use this var for it.
			this._emptyTooltip = true;
		},
		
		/*
         * Destruction Code: Clears event handles, timers,
         * and current trigger information
         */
        destructor : function() {
			this._clearTriggerNode();
            this._clearTimers();
            this._clearHandles();
        },
		
		/*
		 *  responsible for creating/adding elements to the DOM to render the widget.
		 */
		renderUI : function() {
			var contentBox = this.get( CONTENT_BOX ),
				additionalClass = this.get('additionalClassName');
			
			if ( additionalClass ) {
				this.get( BOUNDING_BOX ).addClass( additionalClass );
			}
			
			contentBox.append( HEADER_TEMPLATE );
			contentBox.append( BODY_TEMPLATE );
			contentBox.append( POINTER_TEMPLATE );
		},
		
		/*
		 * responsible for updating the rendered UI based on the current state of the widget.
		 */
		syncUI : function() {
		},
		
		 /*
         * bindUI is used to bind attribute change and dom event
         * listeners
         */
        bindUI : function() {
            this.after("delegateChange", this._afterSetDelegate);
            this._bindDelegate();
        },
		
		// Prototype Method and Properties
		/*
         * Default attribute change listener for 
         * the delegate attribute
         */
        _afterSetDelegate : function(e) {
            this._bindDelegate(e.newVal);
        },
		
		positionTooltip : function(e) {
		
			var node = e.currentTarget,
				size = {x: node.get('winWidth'), y: node.get('winHeight')},
				scroll = {x: node.get('docScrollX'), y: node.get('docScrollY')},
				boundingBox = this.get( BOUNDING_BOX ),
				pointer = boundingBox.one('.' + POINTER_CLASS),
				tooltip = {x: boundingBox.get('offsetWidth'), y: boundingBox.get('offsetHeight')},
				offsetX = this.get('Offset_X'),
				offsetY = this.get('Offset_Y'),
				// Position relative to another element or mouse cursor
				cursorPos = this._getFixedtoElementPosition() || {x: e.pageX, y: e.pageY},
				props = {};
			
			props.x = cursorPos.x + offsetX;
			props.y = cursorPos.y + offsetY;
			
			if ( (props.x + tooltip.x - scroll.x) > size.x ) {
				props.x = cursorPos.x - offsetX - tooltip.x;
				pointer.addClass('right');
				pointer.removeClass('left');
			}
			else {
				pointer.addClass('left');
				pointer.removeClass('right');
			}
			
			// By default try to position below item
			if ( (props.y + tooltip.y - scroll.y) > size.y ) {
				props.y = cursorPos.y - offsetY - tooltip.y;
				pointer.addClass('bottom');
				pointer.removeClass('top');
			}
			else {
				pointer.addClass('top');
				pointer.removeClass('bottom');
			}
			
			this.move( props.x, props.y );
		},
		
		setTooltipContent : function(node) {
			
			var contentBox = this.get( CONTENT_BOX ),
				tooltipTitle = contentBox.one( '.' + HEADER_CLASS ),
				tooltipBody = contentBox.one( '.' + BODY_CLASS ),
				pointer = contentBox.one('.' + POINTER_CLASS),
				title =  node.getAttribute( DATA_TITLE ),
				description = node.getAttribute( DATA_DESCRIPTION ),
				parsedJSON, jsontoHTML,
				content = '',
				titleBlank = !StringUtils.isNotBlank( title ),
				descriptionBlank = !StringUtils.isNotBlank( description ),
				jsonBlank;
				
			if ( !descriptionBlank ) {
				content = content + '<p>' + description + '</p>';
			}
						
			parsedJSON = this.getAvailableJSONData( node );
			if ( parsedJSON !== null ) {
			
				// Simple List
				if ( parsedJSON.list ) {
				    jsontoHTML = this.buildList( parsedJSON );
				}
				// Table
				else if ( parsedJSON.table ) {
				    jsontoHTML = this.buildTable( parsedJSON );
				}
				else {
				    jsonBlank = true;
				}
				
				// Cleanup for server code since it sends empty strings
			    if ( jsontoHTML ) {
			        content = content + jsontoHTML;
			    }
			    else {
			        jsonBlank = true;
			    }
			}
			else {
				jsonBlank = true;
			}
			
			// Render out some text instead of displaying blank string
			if ( titleBlank && descriptionBlank && jsonBlank ) {
				this._emptyTooltip = true;
				return;
			}
			else {
				this._emptyTooltip = false;
			}
			
			// Clear content and redraw
			tooltipTitle.empty();
			if ( !titleBlank ) {
				tooltipTitle.set('innerHTML', title);
				tooltipTitle.show();
			}
			else {
				tooltipTitle.hide();
			}
			
			tooltipBody.empty();
			tooltipBody.append( content );
			
			if ( this._getPointerVisibility() ) {
				pointer.show();	
			}
			else {
				pointer.hide();
			}
		},
		
		/* Two sources of JSON now, either from data-tipjson attribute or data-tipjsonvar
		 * data-tipjson - json string
		 * data-tipjsonvar = variable name(guid) in LogiXML.guids namespace containing JSON object.  This
		 * is a workaround to the internal logi xml parser and its' limitations in parsing attributes
		 * which contain JSON.
		 */
		getAvailableJSONData : function( node ) {
			var rawJSON, jsonVar, cachedJSON, parsedJSON;
			
			// Pull from attribute
			rawJSON = node.getAttribute( DATA_JSON );
			if ( rawJSON && StringUtils.isNotBlank( rawJSON ) ) {
				// Depending on how JSON comes across the wire, "s may be escaped
				rawJSON = rawJSON.replace( QUOTE_ESCAPED, '"' );
				
				parsedJSON = Y.JSON.parse( rawJSON );
				node.setData( JSON_LOCAL_CACHE , parsedJSON );
				// Remove attribute, this way if attribute shows again then new data is available
				node.removeAttribute( DATA_JSON );
				
				return parsedJSON;
			}
			
			// Pull from cache
			cachedJSON = node.getData( JSON_LOCAL_CACHE );
			if ( cachedJSON !== undefined && cachedJSON !== null ) {
				return cachedJSON;
			}
			
			// Pull from var
			jsonVar = node.getAttribute( DATA_JSON_VAR );
			if ( jsonVar && StringUtils.isNotBlank( jsonVar ) ) {
				rawJSON = LogiXML.guids[jsonVar];
				
				if ( Lang.isString( rawJSON ) ) {
					parsedJSON = JSON.parse( rawJSON );
				}
				else {
					parsedJSON = rawJSON;
				}
				
				node.setData( JSON_LOCAL_CACHE, parsedJSON );
				// Remove attribute, this way if attribute shows again then new data is available
				node.removeAttribute( DATA_JSON_VAR );
				
				return parsedJSON;
			}
			
			return null;
		},
		
		buildList : function(parsedJSON) {
			var ulHTML = '<ul class="rdquicktip-list">',
				currentItem, length, i,
				emptyList = true;

			// Build list and check for empty Strings so we can cleanup junk strings from server
			for ( i = 0, length = parsedJSON.list.length; i < length; i++ ) {
			    currentItem = parsedJSON.list[i];
				ulHTML = ulHTML + '<li>' + currentItem + '</li>';
				
				if ( emptyList ) {
			        emptyList = StringUtils.isBlank( currentItem );
			    }
			}
			
			return emptyList ? null : ulHTML + '</ul>';
		},
		
		buildTable : function(parsedJSON) {
			var tableHTML = '<table class="rdquicktip-table"><tbody>',
				length,	i,
				rowLength, j,
				currentRow,
				emptyTable = true;
				
			// Rows
			for ( i = 0, length = parsedJSON.table.length; i < length; i++ ) {					
				tableHTML = tableHTML + '<tr>';
				currentRow = parsedJSON.table[i];
				
				// Cleanup more junk strings from server
				if ( emptyTable ) {
				    // Check every cell for blank text, if string isn't blank short circuit the check
				    for ( j = 0, rowLength = currentRow.length; j < rowLength; j++ ) {
				        emptyTable = StringUtils.isBlank( currentRow[j].text );
				        
				        if ( !emptyTable ) {
				            break;
				        }
				    }
				}
				
				// Columns
				for ( j = 0, rowLength = currentRow.length; j < rowLength; j++ ) {
					// Anymore attributes and switch code back over to node creation
					if ( currentRow[j].color ) {
						tableHTML = tableHTML + '<td style="color: ' + currentRow[j].color + ';">' + currentRow[j].text + '</td>';
					}
					else {
						tableHTML = tableHTML + '<td>' + currentRow[j].text + '</td>';
					}
				}
				tableHTML = tableHTML + '</tr>';
			}
			
			return emptyTable ? null : tableHTML + '</tbody></table>';
		},
		
		_showTooltip : function() {
			var bb = this.get( BOUNDING_BOX ),
				autoHideDelay = this.get('autoHideDelay'),
				transition = this.get('showTransition');

			this.show();
			bb.transition(transition);
            
            this._clearTimers();

			if ( autoHideDelay > 0 ) {
				this._timers.hide = Y.later(autoHideDelay, this, this._hideTooltip);
			}
		},
		
		_hideTooltip : function() {
			var bb = this.get( BOUNDING_BOX ),
				tooltip = this,
				transition = this.get('hideTransition');
			
			bb.transition( transition, function() {
				tooltip.hide();
			});
		},
		
		/*
		 * Determine if pointer should render.  Checks node for override, otherwise uses class wide value
		 */
		_determinePointerVisibility : function(node) {	
			var renderPointer = node.getAttribute('data-tiprenderpointer');
			if ( renderPointer === '' ) {
				this._trigger.renderPointer = null;
			}
			else {
				this._trigger.renderPointer = (renderPointer === "false" ? false : true);
			}
		},
		
		/*
		 * Element to position tooltip off of instead of cursor?
		 */
		_determineFixedtoElement : function(node) {
			var fixedElement = node.getAttribute('data-tipfixedelement');
			if ( fixedElement === '' ) {
				this._trigger.fixedElementSelector = null;
			}
			else {
				this._trigger.fixedElementSelector = fixedElement;
			}
		},
		
		_getPointerVisibility : function() {
			// Node override
			var renderPointer = Y.one( this._trigger.renderPointer );
			if ( renderPointer ) {
				return renderPointer;
			}
			// Default
			else {
				return this.get('renderPointer');
			}
		},
		
		_getFixedtoElementPosition : function() {
			var fixedElement = Y.one( this._trigger.fixedElementSelector ),
				props = null;
			
			// Node override
			if ( fixedElement ) {
				props = { x: fixedElement.getX(), y: fixedElement.getY() };
			}
			
			return props;
		},
		
		_isPositionFixed : function() {
			// Either fixed to element mouse is hovering over or to a specified element
			return (this.get('fixed') || Y.one( this._trigger.fixedElementSelector )) ? true : false;
		},
		
		_bindDelegate : function() {
			var eventHandles = this._eventHandles;
			
			// Clean up old leftover delegate?
			if (eventHandles.delegate) {
                eventHandles.delegate.detach();
                eventHandles.delegate = null;
            }
			
			eventHandles.delegate = Y.delegate("mouseenter", Y.bind(this._onMouseEnter, this), this.get("delegate"), this.get("triggerSelector"));
		},
		
		_onMouseLeave : function(e) {
			this._clearTimers();
			this._clearTriggerNode();
            this._timers.hide = Y.later(this.get("hideDelay"), this, this._hideTooltip);
		},
		
		_onMouseEnter: function(e) {
			var node = e.currentTarget,
				currentTriggerNode = this._trigger.node;
			
            if (node && (!currentTriggerNode || !node.compareTo(currentTriggerNode))) {
				
				this.setTooltipContent( node );
				
				// Don't render tooltip if we found all empty strings during content parse
				if ( this._emptyTooltip ) {
					return;
				}
				
				this._setTriggerNode( e );
				this._determinePointerVisibility( node );
				this._determineFixedtoElement( node );
				this.positionTooltip( e );
				
                this._timers.show = Y.later(this.get('showDelay'), this, this._showTooltip);
            }
		},
		
		_onMouseMove: function(e) {
			if ( !this._isPositionFixed() ) {
				this.positionTooltip( e );
			}
		},
		
		_setTriggerNode: function(e) {
			var triggerEventHandles = this._eventHandles.trigger,
				node = e.currentTarget;
			
			if ( node.get('title') ) {
				this._trigger._titleText = node.get('title');
				node.removeAttribute('title', '');
			}
			
			triggerEventHandles.mouseMove = Y.on('mousemove', Y.bind(this._onMouseMove, this), node);
            triggerEventHandles.mouseOut = Y.on('mouseleave', Y.bind(this._onMouseLeave, this), node);
			
			this._trigger.node = node;
		},
		
		/*
		 * Clear Trigger Node and any events attached to it
		 */
		_clearTriggerNode: function() {
			var triggerEventHandles = this._eventHandles.trigger,
				trigger = this._trigger;
			
			// Restore Title text
			if ( trigger._titleText ) {
				trigger.node.setAttribute('title', trigger._titleText );
			}
			
			trigger.node = null;
			trigger.renderPointer =  null;
			trigger.fixedElementSelector = null;
			
			if ( triggerEventHandles.mouseMove ) {
				triggerEventHandles.mouseMove.detach();
				triggerEventHandles.mouseMove = null;
			}
			
			if ( triggerEventHandles.mouseOut ) {
				triggerEventHandles.mouseOut.detach();
				triggerEventHandles.mouseOut = null;
			}
		},
		
		/*
         * Cancel any existing show/hide timers
         */
        _clearTimers : function() {
            var timers = this._timers;
            if (timers.hide) {
                timers.hide.cancel();
                timers.hide = null;
            }
            if (timers.show) {
              timers.show.cancel();
              timers.show = null;
            }
        },
		
		/*
		 * Detach event handlers
		 */
		_clearHandles : function() {
			var eventHandles = this._eventHandles;

            if (eventHandles.delegate) {
                eventHandles.delegate.detach();
            }
			if (eventHandles.trigger.mouseOut) {
                eventHandles.trigger.mouseOut.detach();
            }
            if (eventHandles.trigger.mouseMove) {
                eventHandles.trigger.mouseMove.detach();
            }
		}
	}, {
		// Static Method and Properties
		NAME: 'rdquicktip',
		
		// Override default YUI prefixing
		CSS_PREFIX: 'rdquicktip',
		
		ATTRS : {
			Offset_X: {
				value: -18
			},
			
			Offset_Y: {
				value: 30
			},
			
			/*
			 * Don't allow tooltip to render outside viewport.
			 * Functionality inherited from WidgetPostionConstrain
			 */
			constrain: {
				value: true
			},
			
			/*
			 * Sets whether element is fixed relative to the element or will it move along with mouse cursor.
			 */
			fixed: {
				value: false
			},
			
			/*
			 * CSS selector which targets one element.  Tooltip will positioned based on this element.
			 */
			fixedElementSelector: {
				value: null,
				setter: function(val) {
					return Y.one(val) || null;
				}
			},
			
			/*
             * The delegate node to which event listeners should be attached.
             * This node should be an ancestor of all trigger nodes bound
             * to the instance. By default the body is used.
             */
			delegate : {
				value: null,
				setter: function(val) {
					return Y.one(val) || Y.one('body');
                }
			},
			
			/* 
             * A selector that must match the target of the event
             */
			triggerSelector: {
				value: null,
				setter: function(val) {
                    if ( val && Lang.isString(val) ) {
                        return val;
                    }
					else {
						return '.' + this.getClassName('trigger');
					}
                }
			},
			
			/*
             * The time to wait, after the mouse enters the trigger node,
             * to display the tooltip
             */
            showDelay : {
                value: 100
            },
			
			/*
             * The time to wait, after the mouse leaves the trigger node,
             * to hide the tooltip
             */
            hideDelay : {
                value: 250
            },
			
			/*
             * The time to wait, after the tooltip is first displayed for 
             * a trigger node, to hide it, if the mouse has not left the 
             * trigger node
             */
            autoHideDelay : {
                value: 0
            },
			
			/*
			 * Render pointer(caret) or not
			 */
			renderPointer : {
				value: true
			},
			
			/*
             * Override the default visibility set by the widget base class
             */
            visible : {
                value: false
            },
			
			/*
			 * Transition effects to use while showing Quicktip
			 */
			showTransition : {
				value: {
					'duration': 0.25,
					'opacity': {
						'value' : 1,
						'easing': 'ease-in'
					}
				},
				validator: function(val) {
					return ( val && !Lang.isArray( val ) && Lang.isObject( val ) );
				}
			},
			
			/*
			 * Transition effects to use while hiding Quicktip
			 */
			hideTransition : {
				value: {
					'duration': 0.25,
					'opacity': {
						'value' : 0,
						'easing': 'ease-in'
					}
				},
				validator: function(val) {
					return ( val && !Lang.isArray( val ) && Lang.isObject( val ) );
				}
			},
			
			/*
			 * CSS class name which will be added to Widget bounding box, aka yui3-rdquicktip
			 */
			additionalClassName : {
				value: null,
				setter: function(val) {
                    if ( val && Lang.isString(val) ) {
                        return val;
                    }
					else {
						return null;
					}
                }
			}
		}
	});
	
}, '1.0.0', {requires: ['event', 'widget', 'widget-position', 'widget-position-constrain', 'json-parse', 'transition']});