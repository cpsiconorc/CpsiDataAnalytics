// JSLint options:
/*global YUI: false, document: false, DocumentTouch: false, window: false, console: false */

/*
 * Tap event is essentially a workaround for mobile devices where there is 300-500ms lag between 'touchend' and 'click' event.
 * The inner workings are based on Tap.js, https://github.com/alexgibson/tap.js.
 */
YUI.add('event-tap', function(Y) {
	//"use strict";

	var isValue = Y.Lang.isValue,
		MAX_DISTANCE = 10,
		// From Modernizer, yes I know it would flag Chrome versions older than 6 as touch enabled.
		SUPPORT_TOUCH = ('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch),
		EVENT = SUPPORT_TOUCH ? {
				start : 'touchstart',
				move : 'touchmove',
				end : 'touchend'
			} : {
				start : 'mousedown',
				move : 'mousemove',
				end : 'mouseup'
			},
		CURRENT_TARGET = 'currentTarget',
		TARGET = 'target',
		BUTTON = 'button',
		TAP = 'tap',
		
		// Pulled from YUI's event-move.js
		_normalizeTouchFacade = function( touchFacade, touch, params ) {
			touchFacade.pageX = touch.pageX;
			touchFacade.pageY = touch.pageY;
			touchFacade.screenX = touch.screenX;
			touchFacade.screenY = touch.screenY;
			touchFacade.clientX = touch.clientX;
			touchFacade.clientY = touch.clientY;
			touchFacade[TARGET] = touchFacade[TARGET] || touch[TARGET];
			touchFacade[CURRENT_TARGET] = touchFacade[CURRENT_TARGET] || touch[CURRENT_TARGET];
			touchFacade[BUTTON] = (params && params[BUTTON]) || 1; // default to left (left as per vendors, not W3C which is 0)
		},
		
		_detacher = function( subscription, key ) {
			Y.each( subscription[key], function(item) {
				if ( item ) {
					item.detach();
				}
			});
			subscription[key] = null;
		};
	
Y.Event.define( TAP, {
	
	on: function( node, subscription, notifier ) {
		var handles = {};
		
		handles.start = node.on( EVENT.start, this._onStart, this, node, subscription, notifier );
		handles.move = node.on( EVENT.move, this._onMove, this, node, subscription, notifier );
		handles.end = node.on( EVENT.end, this._onEnd, this, node, subscription, notifier );
		
		subscription._handles = handles;
    },

    delegate: function( node, subscription, notifier, filter ) {
        var handles = {};
		
		handles.start = node.delegate( EVENT.start, this._onStart, filter, this, node, subscription, notifier, true );
		handles.move = node.delegate( EVENT.move, this._onMove, filter, this, node, subscription, notifier, true );
		handles.end = node.delegate( EVENT.end, this._onEnd, filter, this, node, subscription, notifier, true );
		
		subscription._delegate_handles = handles;
    },

    detach: function( node, subscription, notifier ) {
		_detacher( subscription, '_handles' );
    },

    detachDelegate: function( node, subscription, notifier ) {
		_detacher( subscription, '_delegate_handles' );
    },
	
	_onStart : function( ev, node, subscription, notifier, delegate ) {
		// Clear any previous subscription info
		subscription.moved = false;
		subscription.startEvent = undefined;
		
		// If mouse click, only allow left click
		if ( ev.button && ev.button !== 1 ) {
			return;
		}
		
		// 1 finger taps only
		if ( ev.touches && ev.touches.length !== 1 ) {
            return;
        }
		
		subscription.startEvent = ev;
	},
	
	_onMove : function( ev, node, subscription, notifier, delegate ) {
		// Ignore events without a previous start event or when we know movement has occurred
		if ( !isValue( subscription.startEvent ) || subscription.moved ) {
			return;
		}
		
		var x = SUPPORT_TOUCH ? ev.touches[0].pageX : ev.pageX,
			y = SUPPORT_TOUCH ? ev.touches[0].pageX : ev.pageY,
			startEvent = subscription.startEvent,
			startX = SUPPORT_TOUCH ? startEvent.touches[0].pageX : startEvent.pageX,
			startY = SUPPORT_TOUCH ? startEvent.touches[0].pageY : startEvent.pageY;
		
		// Flag when too much movement has occurred
		if ( Math.abs(x - startX) > MAX_DISTANCE || Math.abs(y - startY) > MAX_DISTANCE ) {
			subscription.moved = true;
		}
	},
	
	_onEnd : function( ev, node, subscription, notifier, delegate ) {
		// Ignore events without a previous start event or too much movement has occurred
		if ( !isValue( subscription.startEvent ) || subscription.moved ) {
			return;
		}
		
		if ( delegate ) {
            node = ev[CURRENT_TARGET];
        }
		else {
			node = ev[TARGET];
		}
		
		var tagName = node.get( 'tagName' );
		
		// Tap.js had this and I assume it's for allowing click events to bubble up to form controls
		// Only preventDefault on elements that are not form inputs
		if ( tagName !== 'SELECT' && tagName !== 'INPUT' && tagName !== 'TEXTAREA' && tagName !== 'BUTTON' ) {
			ev.preventDefault();
		}
		
		if ( !subscription.moved ) {
			// Normalize touch event
			if ( ev.changedTouches ) {
				_normalizeTouchFacade( ev, ev.changedTouches[0] );
			}
			ev.type = TAP;
			notifier.fire( ev );
		}
	}
});
	
}, '1.0.0', {requires: ['node-base', 'event-touch', 'event-synthetic'] });