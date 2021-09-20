//General resize yui namespace
YUI.add('rdResize', function(Y) {

    Y.namespace('rdResize').AddYUIResizerHandles = function (sContentHolderID, eleAttrs) {
        
        sContentHolderID = sContentHolderID.replace(/\./g, "\\.");

		// Function includes the common code used to instantiate a YUI object and wrap YUI handles around the Container.		
		var freeFormLayout = false;
		if (sContentHolderID.indexOf('rdDashboardPanel-') == 0)
			freeFormLayout = true;
			
		var yuiResize,
			resizeeNode = Y.one('#' + LogiXML.escapeSelector(sContentHolderID)),
		    cfg = { node: resizeeNode },
            heightOnly = eleAttrs.getAttribute("rdHeightOnly") == "True",
            widthOnly = eleAttrs.getAttribute("rdWidthOnly") == "True";

		if (freeFormLayout) {
			Y.mix(cfg, { handles: 'l,bl,b,br,r' });
		} else if (heightOnly) {
		    Y.mix(cfg, {
		        wrap: true,
		        handles: 'b'
		    });
		} else if (widthOnly) {
		    Y.mix(cfg, {
		        wrap: true,
		        handles: 'r'
		    });
		} else {
		    Y.mix(cfg, {
		        wrap: true,
		        handles: 'b,br,r'
		    });
		}


		var nodeImageParent, nodeResizeWrapper, bContentHidden = false;
		if( ( resizeeNode.get('tagName') === 'IMG' ) && ( resizeeNode.get('width') === 0 && resizeeNode.get('height') === 0 ) ){    //#18419.
		    var nodeImageParent, nodeResizeWrapper
		    
            nodeImageParent = resizeeNode.get('parentNode');
			resizeeNode.setStyles({
			                       left: '-999px',
			                       top: '0px',
			                       position: 'fixed'
			                       });
			Y.one('body').appendChild(resizeeNode);
			bContentHidden = true;
		}
							
		if (freeFormLayout) {
			//Set autoHide for non-touch
			if (!LogiXML.features['touch'])
				Y.mix(cfg, {autoHide: true});
				
			yuiResize = new Y.Resize(cfg);
			
			yuiResize.plug(Y.Plugin.ResizeConstrained, {
				minWidth: 200,
				minHeight: 100,
				tickX: 10,
			    tickY: 10
			});
		}
		else {			
			yuiResize = new Y.LogiXML.ChartFX.Resize(cfg);
						
			if (!LogiXML.features['touch']) {
			    var w = yuiResize.get('wrapper'),
                    h = w.one('.yui3-resize-handles-wrapper');
				
			    //Initial Hide of resizers
			    if (h) {
			        h.setStyle('visibility', 'hidden');
			    }
				//Assign mouse enter / leave.							
				//Chart Wrapper
			    w.on('mouseenter', function (e) {
			        if (h) {
			            h.setStyle('visibility', 'visible');
			        }
				});	
				w.on('mouseleave', function(e) {
					if (Y.Lang.isValue(e.currentTarget)
					&& !e.currentTarget.inRegion({top:e.pageY,right:e.pageX,bottom:e.pageY,left:e.pageX}) && h)
						h.setStyle('visibility', 'hidden');						
				});				
			}	
		}
		
		if(bContentHidden){
		    nodeResizeWrapper = resizeeNode.get('parentNode');
			nodeResizeWrapper.setStyles({
			                       left: '',
			                       top: '',
			                       position: 'relative'
			                       });
			nodeImageParent.insert(nodeResizeWrapper);
		}
			
		// Add the node being resized as an EventTarget
		yuiResize.addTarget( resizeeNode );
		
		if (eleAttrs.getAttribute('rdMinWidth') 
		|| eleAttrs.getAttribute('rdMinHeight') 
		|| eleAttrs.getAttribute('rdMaxWidth') 
		|| eleAttrs.getAttribute('rdMaxHeight')) {
		
			yuiResize.plug(Y.Plugin.ResizeConstrained, {
				minWidth: parseInt(eleAttrs.getAttribute('rdMinWidth')),
				minHeight: parseInt(eleAttrs.getAttribute('rdMinHeight')),
				maxWidth: parseInt(eleAttrs.getAttribute('rdMaxWidth')),
				maxHeight: parseInt(eleAttrs.getAttribute('rdMaxHeight'))
			});			
		}	
								
		return yuiResize;	
	}
	
}, '10.1.100', {
    requires: ['base', 'resize', 'stylesheet', 'event-custom', 'chartfx-resize']
});

Y.use('rdResize', function(Y) {	
	//Resize function used by rdChart.js
	LogiXML.Resize._rdInitResizer = function(eleContent) {

		var resizeNode = Y.one( eleContent ),
			sIdForAttrs = eleContent.id;
			
		if(sIdForAttrs.lastIndexOf("_Row") != -1) {
			//For rows in tables
			sIdForAttrs = sIdForAttrs.substr(0,sIdForAttrs.lastIndexOf("_Row"))
		}
		
		// Resize already created
		if ( resizeNode.hasClass('yui3-resize') ) {
			return;
		}

		var eleAttrs = document.getElementById("rdResizerAttrs_" + sIdForAttrs)
		if (!Y.Lang.isValue(eleAttrs))
			return;
				
		eleContent.removeAttribute('Height');
		eleContent.removeAttribute('Width');	
		
		var yuiResize = Y.rdResize.AddYUIResizerHandles(eleContent.id, eleAttrs);
		yuiResize.on('resize:end', function(e) {
		        eleContent = document.getElementById(eleContent.id);
		        var src = eleContent.src
		        if (src.indexOf("rdChart2.aspx") != -1) {
		            if (src.indexOf("&rdResizerNewWidth=") != -1) {
		                src = src.substr(0, src.indexOf("&rdResizerNewWidth="))
		            }		            
		        var nowWidth = (eleContent.style && eleContent.style['width']) ? eleContent.style['width'] : eleContent.width
		        nowWidth = nowWidth.replace("px", "");
		        var nowHeight = (eleContent.style && eleContent.style['height']) ? eleContent.style['height'] : eleContent.height
		        nowHeight = nowHeight.replace("px", "");
		        src += "&rdResizerNewWidth=" + nowWidth + "&rdResizerNewHeight=" + nowHeight
					
					if (document.rdForm && document.rdForm.rdAgId) {
					    src += "&rdAgId=" + document.rdForm.rdAgId.value;
					}				
								
					eleContent.src = src + '&rdRequestForwarding=Form'; //#12431.
				} 
				yuiResize.set('resizing', false);   //#18431.

			/*if (rdForm.rdAgId) {
				//Update the AG with the new size.
				rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdAgId=' + rdForm.rdAgId.value + '&rdNotifyCommand=SaveAgChartSize&ChartID=' + eleContent.id + '&ChartWidth=' + eleContent.width + '&ChartHeight=' + eleContent.height)
			}*/
			//Update the OG with the new size.
			if (document.rdForm && document.rdForm.rdOgId)
				rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdOgId=' + document.rdForm.rdOgId.value + '&rdNotifyCommand=SaveOgChartSize&ChartWidth=' + eleContent.width + '&ChartHeight=' + eleContent.height);
		});
	};

	LogiXML.Resize._rdInitAnimatedChartResizer = function (sAnimatedChartMovieType, sAnimatedChartID, sAnimatedChartDataFile, sAnimatedChartOriginalID, sBGColor, sIsJscript, width, height) {
	    // Function runs onLoad to wrap the Yui handles around the Div enclosing the Animated Chart.
        
        //Chart will be undefined, not yet created
	    var eleAnimatedChart = document.getElementById(sAnimatedChartID);   // This is an Object, not a regular HTML element.

	    //Height and width passed as param if chart's been resized, they are undefined for first load or refresh, so they get set here
	    if (!Y.Lang.isValue(width)) {
	        width = parseInt(eleAnimatedChart.offsetWidth == 0 ? eleAnimatedChart.getAttribute('Width') : eleAnimatedChart.offsetWidth); // To handle issue under DataTable.
	        height = parseInt(eleAnimatedChart.offsetHeight == 0 ? eleAnimatedChart.getAttribute('Height') : eleAnimatedChart.offsetHeight);
	    }

	    var eleAnimatedChartContentHolder = document.getElementById('rdAnimatedChart' + sAnimatedChartID);  // Div that holds the Chart.
	    //var eleAnimatedChartContentHolderSVG = eleAnimatedChartContentHolder.parentNode;
	    if (FusionCharts.getCurrentRenderer() == "javascript") {
	        var svgWidth = width + 5;
	        var svgHeight = height + 5;
            //Removing -- chart object not yet created so we can't set the size
	        //eleSVGAnimChart.setAttribute('width', svgWidth);
	        //eleSVGAnimChart.setAttribute('height', svgHeight);
	        eleAnimatedChartContentHolder.style.width = parseInt(width, 10) + 5;
	        eleAnimatedChartContentHolder.style.height = parseInt(height, 10) + 5;
	    }
	    else {
	        eleAnimatedChartContentHolder.style.width = parseInt(width, 10) + 5;
	        eleAnimatedChartContentHolder.style.height = parseInt(height, 10) + 5;
	        eleAnimatedChartContentHolder.src = 'javascript:void(0)';
	    }

        //Sanity check -- there should always be a resizer when this method is called
	    var eleAttrs = document.getElementById("rdResizerAttrs_" + sAnimatedChartID);
	    if (!Y.Lang.isValue(eleAttrs))
	        return;

	    try {
	        var sReportID = document.getElementById(sAnimatedChartID + '-Hidden').value;
	    }
	    catch (e) {   // Under a DataTable.
	        if (!sReportID) {
	            var sRowIdentifier = eleAnimatedChartContentHolder.parentNode.id.substring(eleAnimatedChartContentHolder.parentNode.id.lastIndexOf('_'), eleAnimatedChartContentHolder.parentNode.id.length);

	            sReportID = document.getElementById(sAnimatedChartID + '-Hidden' + sRowIdentifier).value;
	        }
	    }

	    if (eleAnimatedChartContentHolder.className.indexOf('yui3-resize') >= 0) {
            //23170
	        if (eleAnimatedChartContentHolder.nextSibling.className.indexOf('yui3-resize-handles-wrapper') >= 0) {
	            eleAnimatedChartContentHolder.nextSibling.parentNode.removeChild(eleAnimatedChartContentHolder.nextSibling);
	        }
	    }

	    //Set width and height based on parameters
	    var yuiResize = Y.rdResize.AddYUIResizerHandles(eleAnimatedChartContentHolder.id, eleAttrs);
	    yuiResize.get('wrapper').setStyles({
	        width: width,
	        height: height
	    });

	    yuiResize.on('resize:end', function (e) {
	        var eleAnimatedChartResizing = e.target.get('node').one('embed, object, span').getDOMNode();   

	        if ((eleAnimatedChartContentHolder.style.width != width) | (eleAnimatedChartContentHolder.style.height != height)) {
	            var currWidth = parseInt(e.target.get('wrapper').getStyle('width')), currHeight = parseInt(e.target.get('wrapper').getStyle('height'));
                //Reset the YUI resizer
	            this.reset();

                //Resize the chart
	            var chartRef = FusionCharts(sAnimatedChartID);
	            if (parseInt(chartRef.width, 10) == currWidth && parseInt(chartRef.height, 10) == currHeight) {
	                document.getElementById("rdAnimatedChart" + sAnimatedChartID).style.opacity = "1.0";
	                document.getElementById("rdAnimatedChart" + sAnimatedChartID).style.visibility = "visible";
	                document.getElementById(sAnimatedChartID).style.visibility = 'visible';
	                document.getElementById(sAnimatedChartID).style.opacity = "1.0";
	            }
	            else {
	                chartRef.width = currWidth;
	                chartRef.height = currHeight;
	                

	                if (chartRef.args.swfUrl.indexOf("StackedColumn") >= 0) {
	                    //No animation on Resize (Bug in stacked charts)
	                    chartRef.setChartAttribute("animation", "0");
	                    chartRef.render();
	                }
	                else {
	                    chartRef.resizeTo(currWidth, currHeight);
	                }

	                //Save the new chart size
	                rdAjaxRequest('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + sAnimatedChartOriginalID + ',' + sAnimatedChartID + ',' + eleAnimatedChartContentHolder.id + '&rdAnimatedChartCurrentWidth=' + currWidth + '&rdAnimatedChartCurrentHeight=' + currHeight + '&rdCurrentAnimatedChartId=' + sAnimatedChartID + '&rdReport=' + sReportID + '&rdAnimatedChartResizerRefresh=True&rdRequestForwarding=Form');
	            }
	        }
	    });

	    yuiResize.on('resize:start', function (e) {
	        // event triggered after the resize has begun.
	        var eleAnimatedChartResizing = e.target.get('node').one('embed, object, span').getDOMNode();

	        //hide chart -- it becomes visible with FC_Resized global function
	        eleAnimatedChartResizing.style.visibility = 'hidden';
	        eleAnimatedChartResizing.style.opacity = '0';

	    });

	    Y.on('domready', function (e) {
	        //FusionCharts.debugMode.enabled(console.log, 'verbose');
	        if (sIsJscript != 'flash')
	            FusionCharts.setCurrentRenderer('javascript');

	        if (navigator.userAgent.indexOf('MSIE 8.0') > 0 || navigator.userAgent.indexOf('MSIE 7.0') > 0) {
	            FusionCharts.setCurrentRenderer('flash');
	        }

	        //Build the chart object
	        var rdAnimatedChart = new FusionCharts({
	            swfUrl: "rdTemplate/rdAnimatedChart/" + sAnimatedChartMovieType + ".swf",
	            renderAt: "rdAnimatedChart" + sAnimatedChartID,
	            //have to add an underscore so names dont get replaced on server
	            width: width,
	            height: height,
	            id: sAnimatedChartID
	        });

	        rdAnimatedChart.setDataURL(sAnimatedChartDataFile);
	        rdAnimatedChart.render();
	    });
	};

	//Resize animated charts (Old method)
	LogiXML.Resize._rdInitAnimated_ChartResizer = function (sAnimatedChartMovieType, sAnimatedChartID, sAnimatedChartDataFile, sAnimatedChartOriginalID, sBGColor, sIsJscript, width, height) {
	    // Function runs onLoad to wrap the Yui handles around the Div enclosing the Animated Chart.

	    var eleAnimatedChart = document.getElementById(sAnimatedChartID);   // This is an Object, not a regular HTML element.
	    if (!eleAnimatedChart) return;
	    // Javascript chart? SVG 
	    var eleAnimatedChartChildren = eleAnimatedChart.childNodes;
	    var eleSVGAnimChart = eleAnimatedChartChildren[0];
	    //Height and width passed as param if chart's been resized, they are undefined for first load or refresh, so they get set here
	    if (!Y.Lang.isValue(width)) {
	        width = parseInt(eleAnimatedChart.offsetWidth == 0 ? eleAnimatedChart.getAttribute('Width') : eleAnimatedChart.offsetWidth) // To handle issue under DataTable.
	        height = parseInt(eleAnimatedChart.offsetHeight == 0 ? eleAnimatedChart.getAttribute('Height') : eleAnimatedChart.offsetHeight)
	    }


	    var eleAnimatedChartContentHolder = document.getElementById('rdAnimatedChart' + sAnimatedChartID);  // Div that holds the Chart.
	    var eleAnimatedChartContentHolderSVG = eleAnimatedChartContentHolder.parentNode;
	    if ((eleAnimatedChart.tagName.match('OBJECT')) || (eleAnimatedChart.tagName.match('EMBED')) || (eleAnimatedChart.tagName.match('SPAN')) || (eleAnimatedChart.tagName.match('DIV'))) {
	        if (sIsJscript == "javascript") {
	            var svgWidth = width + 5;
	            var svgHeight = height + 5;
	            eleSVGAnimChart.setAttribute('width', svgWidth);
	            eleSVGAnimChart.setAttribute('height', svgHeight);
	            eleAnimatedChartContentHolderSVG.style.width = width + 5;
	            eleAnimatedChartContentHolderSVG.style.height = height + 5;
	        }
	        else {
	            eleAnimatedChartContentHolder.style.width = width + 5;
	            eleAnimatedChartContentHolder.style.height = height + 5;
	            eleAnimatedChartContentHolder.src = 'javascript:void(0)';
	        }
	    }
	    else return;

	    var eleAttrs = document.getElementById("rdResizerAttrs_" + sAnimatedChartID);
	    if (!Y.Lang.isValue(eleAttrs))
	        return;

	    try {
	        var sReportID = document.getElementById(sAnimatedChartID + '-Hidden').value;
	    }
	    catch (e) {   // Under a DataTable.
	        if (!sReportID) {
	            var sRowIdentifier = eleAnimatedChartContentHolder.parentNode.id.substring(eleAnimatedChartContentHolder.parentNode.id.lastIndexOf('_'), eleAnimatedChartContentHolder.parentNode.id.length);

	            sReportID = document.getElementById(sAnimatedChartID + '-Hidden' + sRowIdentifier).value;
	        }
	    }



	    if (eleAnimatedChartContentHolder.className.indexOf('yui3-resize') == 0)
	        return;

	    //Set width and height based on parameters
	    var yuiResize = Y.rdResize.AddYUIResizerHandles(eleAnimatedChartContentHolder.id, eleAttrs);
	    yuiResize.get('wrapper').setStyles({
	        width: width,
	        height: height
	    });

	    yuiResize.on('resize:end', function (e) {
	        var eleAnimatedChartResizing = e.target.get('node').one('embed, object, span').getDOMNode();
	        // event triggered after the resize is done.      

	        if ((eleAnimatedChartContentHolder.style.width != width) | (eleAnimatedChartContentHolder.style.height != height)) {
	            var currWidth = parseInt(e.target.get('wrapper').getStyle('width')), currHeight = parseInt(e.target.get('wrapper').getStyle('height'));
	            this.reset();

	            var chartRef = FusionCharts(sAnimatedChartID);
	            chartRef.width = currWidth;
	            chartRef.height = currHeight;
	            chartRef.resizeTo(currWidth, currHeight);

	            rdAjaxRequest('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + sAnimatedChartOriginalID + ',' + sAnimatedChartID + ',' + eleAnimatedChartContentHolder.id + '&rdAnimatedChartCurrentWidth=' + currWidth + '&rdAnimatedChartCurrentHeight=' + currHeight + '&rdCurrentAnimatedChartId=' + sAnimatedChartID + '&rdReport=' + sReportID + '&rdAnimatedChartResizerRefresh=True&rdRequestForwarding=Form');
	        }

	    });
	    yuiResize.on('resize:start', function (e) {
	        // event triggered after the resize has begun.
	        var eleAnimatedChartResizing = e.target.get('node').one('embed, object, span').getDOMNode();

	        //hide chart -- it becomes visible with FC_Resized global function
	        eleAnimatedChartResizing.style.visibility = 'hidden';
	    });

	};
	
	//Resize Java Applets
	LogiXML.Resize._rdInitAppletResizer = function(AppletID, sBGColor) {
		// Function runs onLoad to wrap the Yui handles around the Div enclosing the Applet (IDV).

		var eleApplet = document.getElementById(AppletID);  // This is an Object, not a regular HTML element.
		if(!eleApplet) return;
		var width = parseInt(eleApplet.offsetWidth == 0 ? eleApplet.getAttribute('Width') : eleApplet.offsetWidth) // To handle issue under DataTable.
		var height = parseInt(eleApplet.offsetHeight == 0 ? eleApplet.getAttribute('Height') : eleApplet.offsetHeight)
		var eleAppletContentHolder = document.getElementById("Applet_" + AppletID);
		if((eleApplet.tagName.match('APPLET'))||(eleApplet.tagName.match('OBJECT'))){   // #  11632.           
			if(!eleAppletContentHolder){    // Applet needs to be Wrapped in a Div.
				eleAppletContentHolder = document.createElement("Div");
				eleAppletContentHolder.setAttribute("id", "Applet_" + AppletID);
				var eleContentParent = eleApplet.parentNode;
				eleApplet.parentNode.removeChild(eleApplet);
				eleContentParent.appendChild(eleAppletContentHolder);
				eleAppletContentHolder.appendChild(eleApplet);             
			}        
			eleAppletContentHolder.src = 'javascript:void(0)';
		}
		else return;

		var eleAttrs = document.getElementById("rdResizerAttrs_" + AppletID);
		if (!Y.Lang.isValue(eleAttrs))
			return;
				 
		try{    
			var sReportID = document.getElementById(AppletID + '-Hidden').value;  
		}
		catch(e){   // Under a DataTable.
			if(!sReportID){
				var sRowIdentifier = eleAppletContentHolder.parentNode.id.substring(eleAppletContentHolder.parentNode.id.lastIndexOf('_'),eleAppletContentHolder.parentNode.id.length);
				
				sReportID = document.getElementById(AppletID + '-Hidden' + sRowIdentifier).value;				
			}   
		}    

		if(AppletID.substring(AppletID.lastIndexOf('_'), AppletID.length).length > 32)  // To handle Dashboards.
			AppletID = AppletID.substring(0, AppletID.lastIndexOf('_'));                // Cut the ID off the GUID so that the server finds the definiton on Ajax request.
		
		if (eleAppletContentHolder.className.indexOf('yui3-resize') == 0)
				return;
						
		var yuiResize = Y.rdResize.AddYUIResizerHandles(eleAppletContentHolder.id, eleAttrs);
			    
		yuiResize.get('wrapper').setStyles({
			padding: '10',
			width: eleApplet.width,
			height: eleApplet.height
		});		
		
		yuiResize.on('resize:end', function(e) {
			if(eleApplet){
				eleAppletContentHolder.style.backgroundColor = "transparent";        
				eleApplet.style.visibility = '';
			}

			if((eleAppletContentHolder.offsetWidth != eleApplet.offsetWidth)|(eleAppletContentHolder.offsetHeight != eleApplet.offsetHeight)){
				var currWidth = parseInt(e.target.get('wrapper').getStyle('width')), currHeight = parseInt(e.target.get('wrapper').getStyle('height'));
				eleApplet.width = currWidth;
				eleApplet.height =  currHeight;
				rdAjaxRequest('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + AppletID + '&rdAppletCurrentWidth=' + currWidth + '&rdAppletCurrentHeight=' + currHeight + '&rdAppletId=' + AppletID + '&rdReport=' + sReportID +'&rdAppletResizerRefresh=True&rdRequestForwarding=Form');
			}
		});   
		yuiResize.on('resize:start', function(e) {
			eleAppletContentHolder.style.backgroundColor = sBGColor;        
			eleApplet.style.visibility = 'hidden';        
		});
		
	};
	
	//Resize Animated Maps
	LogiXML.Resize._rdInitAnimatedMapResizer = function(sAnimatedMapMovieType, sAnimatedMapID, sAnimatedMapDataFile, sAnimatedMapOriginalID, sBGColor) {
		// Function runs onLoad to wrap the Yui handles around the Div enclosing the Animated Map.

		var eleAnimatedMap = document.getElementById(sAnimatedMapID);   // This is an Object, not a regular HTML element.
		if(!eleAnimatedMap) return;
		var width = parseInt(eleAnimatedMap.offsetWidth == 0 ? eleAnimatedMap.getAttribute('Width') : eleAnimatedMap.offsetWidth) // To handle issue under DataTable.
		var height = parseInt(eleAnimatedMap.offsetHeight == 0 ? eleAnimatedMap.getAttribute('Height') : eleAnimatedMap.offsetHeight)
		var eleAnimatedMapContentHolder = document.getElementById('rdFusionMap'+ sAnimatedMapID);  // Div that holds the Chart.
		if (eleAnimatedMap.tagName.match('OBJECT') || eleAnimatedMap.tagName.match('EMBED') || eleAnimatedMap.tagName.match('SPAN')) {
			if(!eleAnimatedMapContentHolder){
				var eleAnimatedMapContentHolder = document.createElement("Div");
				eleAnimatedMapContentHolder.setAttribute("id","rdFusionMap" + sAnimatedMapOriginalID);
				var eleContentParent = eleAnimatedMap.parentNode;   // Span that holds the Div.
				eleAnimatedMap.parentNode.removeChild(eleAnimatedMap);
				eleContentParent.appendChild(eleAnimatedMapContentHolder);
				eleAnimatedMapContentHolder.appendChild(eleAnimatedMap);           
			}        
			eleAnimatedMapContentHolder.src = 'javascript:void(0)';
		}
		else return;

		var eleAttrs = document.getElementById("rdResizerAttrs_" + sAnimatedMapOriginalID);
		if (!Y.Lang.isValue(eleAttrs))
			return;
					 
		try{    
			var sReportID = document.getElementById(sAnimatedMapOriginalID + '-Hidden').value;   
		}
		catch(e){   // Under a DataTable.
			if(!sReportID){
				var sRowIdentifier = eleAnimatedMapContentHolder.parentNode.id.substring(eleAnimatedMapContentHolder.parentNode.id.lastIndexOf('_'),eleAnimatedMapContentHolder.parentNode.id.length);
				
				var sReportID = document.getElementById(sAnimatedMapOriginalID + '-Hidden').value;				
			}   
		}   
		
		if (eleAnimatedMapContentHolder.className.indexOf('yui3-resize') == 0)
				return;
		
		var yuiResize = Y.rdResize.AddYUIResizerHandles(eleAnimatedMapContentHolder.id, eleAttrs);
		yuiResize.get('wrapper').setStyles({
            margin: '0 auto',
			padding: '10',
			width: eleAnimatedMap.width,
			height: eleAnimatedMap.height
		});			

		yuiResize.on('resize:end', function(e) { 
			var eleAnimatedMapResizing = e.target.get('node').one('embed, object, span').getDOMNode();		
			// event triggered after the resize is done.      
			if(eleAnimatedMapResizing){
				eleAnimatedMapContentHolder.style.backgroundColor="transparent";
				eleAnimatedMapResizing.style.visibility = '';
			} 
			
			if((eleAnimatedMapContentHolder.style.width != width)|(eleAnimatedMapContentHolder.style.height != height)){
				var currWidth = parseInt(e.target.get('wrapper').getStyle('width')) - 20, currHeight = parseInt(e.target.get('wrapper').getStyle('height'));
				eleAnimatedMapResizing.parentNode.removeChild(eleAnimatedMapResizing);
				rdAjaxRequest('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + sAnimatedMapOriginalID + ',' + sAnimatedMapID + ',' + eleAnimatedMapContentHolder.id + '&rdAnimatedMapCurrentWidth=' + currWidth + '&rdAnimatedMapCurrentHeight=' + currHeight +  '&rdCurrentAnimatedMapId=' + sAnimatedMapOriginalID + '&rdReport=' + sReportID + '&rdAnimatedMapResizerRefresh=True');
			}       
		});    
		yuiResize.on('resize:start', function(e) {
			var eleAnimatedMapResizing = e.target.get('node').one('embed, object, span').getDOMNode();	
			// event triggered after the resize has begun.     
			eleAnimatedMapResizing.style.visibility = 'hidden';
		});
		yuiResize.on('resize:resize', function(e) {
			// event triggered as you resize.
			eleAnimatedMapContentHolder.style.backgroundColor = sBGColor;       			
		});		
	};
	
	LogiXML.Resize.rdInitMapResizer = function(mapId, map) {
		// Function runs onLoad to wrap the Yui handles around the Div enclosing the Google Map.
		if (typeof map == "undefined" || !map)
		    return;

		var containerId = "rdMapContainer_" + mapId;
		var eleMap = document.getElementById(mapId);    // This is a Div. But the Google Map sits on top of this Div

		if (!eleMap)
		    return;

		var eleContainer = document.getElementById(containerId);

		if (!eleContainer)
		    return;

		var eleAttrs = document.getElementById("rdResizerAttrs_" + mapId);

		if (!Y.Lang.isValue(eleAttrs))
		    return;

		if (eleContainer.className.indexOf('yui3-resize') == 0)
		    return; // already initialized

		var pcsLegendIds = eleMap.getAttribute("data-pcslegends");
		if (pcsLegendIds)
		    pcsLegendIds = pcsLegendIds.split(",");
		else
		    pcsLegendIds = [];

		var pcsLegends = [];

		for (var i = 0; i < pcsLegendIds.length; i++) {
		    var pcsLegend = document.getElementById("rdLegendSpectrum_rdColorSpectrumLegend_" + pcsLegendIds[i]);

		    if (pcsLegend)
		        pcsLegends.push(pcsLegend);
		}

		var eleLegend = document.getElementById("rdLegendSpectrum_rdColorSpectrumLegend_spectrumPopulation");

		var sReportID = document.getElementById(mapId + '-Hidden').value;

		var yuiResize = Y.rdResize.AddYUIResizerHandles(containerId, eleAttrs);
		
		yuiResize.on('resize:end', function() {
			if((eleContainer.offsetWidth != eleMap.offsetWidth) || (eleContainer.offsetHeight != eleMap.offsetHeight)){
			    rdAjaxRequest('rdAjaxCommand=RefreshElement'
                    + '&rdRefreshElementID=' + encodeURIComponent(mapId + ',' + containerId)
                    + '&rdGoogleMapCurrentWidth=' + eleMap.offsetWidth
                    + '&rdGoogleMapCurrentHeight=' + eleMap.offsetHeight
                    + '&rdGoogleMapId=' + encodeURIComponent(mapId)
                    + '&rdReport=' + encodeURIComponent(sReportID)
                    + '&rdGoogleMapResizerRefresh=True'
                    + '&rdRequestForwarding=Form');
				//eleGoogleMapObj.setCenter(center, zoom, type);   // Set the Center of the Map.          
			}
		});
		yuiResize.on('resize:start', function() { 
			center = map.getCenter();   // Get the values at the beginning of the Resize.
		});     
		yuiResize.on('resize:resize', function () {
		    var width = parseInt(eleContainer.offsetWidth);
		    var height = parseInt(eleContainer.offsetHeight);

		    eleMap.style.width = (width - 5) + "px";
		    eleMap.style.height = (height - 5) + "px";

		    for (var i = 0; i < pcsLegends.length; i++) {
		        pcsLegends[i].style.width = (width - 7) + "px";
		    }

		    map.setCenter(center);   // Set the Center of the Map.
		    map.resized();
		});	
	};	

	LogiXML.Resize._rdInitCustomResizer = function(eleContent) {
		var resizeNode = Y.one( eleContent ),
			id = resizeNode.getAttribute('id')
			sIdForAttrs = id;
			
		if(sIdForAttrs.lastIndexOf("_Row") != -1) {
			//For rows in tables
			sIdForAttrs = sIdForAttrs.substr(0,sIdForAttrs.lastIndexOf("_Row"))
		}
		
		// Resize already created
		if ( resizeNode.hasClass('yui3-resize') ) {
			return;
		}

		var eleAttrs = document.getElementById("rdResizerAttrs_" + sIdForAttrs)
		if (!Y.Lang.isValue(eleAttrs))
			return;
				
		resizeNode.removeAttribute('Height');
		resizeNode.removeAttribute('Width');	
		
		return Y.rdResize.AddYUIResizerHandles(id, eleAttrs);
	};

	LogiXML.Resize._rdInitHighChartsResizer = function (eleContent) {
	    var resizeNode = Y.one(eleContent),
			sIdForAttrs = eleContent.id,
            width = eleContent.getAttribute('Width'),
            height = eleContent.getAttribute('Height'),
            timeout = 0;

	    if (width == null || height == null) {
	        var sWidth = resizeNode.getStyle('width');
	        var sHeight = resizeNode.getStyle('height');
	        if (sWidth != null && sHeight != null) {
	            width = parseInt(sWidth.replace('px', ''));
	            height = parseInt(sHeight.replace('px', ''));
	        }
	    }

	    if (sIdForAttrs.lastIndexOf("_Row") != -1) {
	        //For rows in tables
	        sIdForAttrs = sIdForAttrs.substr(0, sIdForAttrs.lastIndexOf("_Row"))
	    }

	    // Resize already created
	    if (resizeNode.hasClass('yui3-resize')) {
	        return;
	    }

	    var eleAttrs = document.getElementById("rdResizerAttrs_" + sIdForAttrs)
	    if (!Y.Lang.isValue(eleAttrs))
	        return;
	    var heightOnly = eleAttrs.getAttribute("rdHeightOnly") == "True",
            widthOnly = eleAttrs.getAttribute("rdWidthOnly") == "True";

	    eleContent.removeAttribute('Height');
	    eleContent.removeAttribute('Width');

	    var yuiResize = Y.rdResize.AddYUIResizerHandles(eleContent.id, eleAttrs);
	    if (heightOnly) {
	        if (height > 0) {
	            yuiResize.get('wrapper').setStyles({
	                height: sHeight,
                    width: null
	            });

	            if (sHeight.indexOf('%') > 0)
	                eleContent.style.height = "";
	        }
	    } else if (widthOnly) {
	        if (width > 0 ) {
	            yuiResize.get('wrapper').setStyles({
	                width: sWidth,
                    height: null
	            });

	            if (sWidth.indexOf('%') > 0)
	                eleContent.style.width = "";
	        }
	    } else {
	        if (width > 0 && height > 0) {
	            yuiResize.get('wrapper').setStyles({
	                width: sWidth,
	                height: sHeight
	            });

	            if (sWidth.indexOf('%') > 0)
	                eleContent.style.width = "";
	            if (sHeight.indexOf('%') > 0)
	                eleContent.style.height = "";
	        }
	    }

	    yuiResize.on('resize:resize', function (e) {

	    });
	    var resizeChart = function (width, height, finished) {
	        if (heightOnly) {
	            width = null;
	        } else if (widthOnly) {
	            height = null;
	        }
	        resizeNode.getData('rdChartCanvas').resized({width: width, height:height, finished: finished});
	    }
	    yuiResize.on('resize:resize', function (e) {
	        if (timeout) {
	            clearTimeout(timeout);
	        }
	        timeout = setTimeout(function () {
	            var height = e.info.offsetHeight,
                   width = e.info.offsetWidth;
	            resizeChart(width, height, false);
	            if (isIE()===7) {
	                resizeChart(width, height, false);
	            }
	        }, 50);
	    });

	    yuiResize.on('resize:end', function (e) {
	        if (isIE() === 7) {
	            return;
	        }
	        if (timeout) {
	            clearTimeout(timeout);
	        }
	        var height = e.info.offsetHeight,
	            width = e.info.offsetWidth;

	        resizeChart(width, height, true);
	        yuiResize.set('resizing', false);
	        if (heightOnly) {
	            var wrapper = resizeNode.ancestor('.chartfx-wrapper');
	            if (wrapper) {
                    setTimeout(function () { if (wrapper) { wrapper.setStyle('width', ''); resizeNode.setStyle('width', ''); }}, 100);
	            }
	        }
	    });
	};

	LogiXML.Resize._rdInitVisualizationResizer = function (eleContent) {
	    var resizeNode = Y.one(eleContent),
			sIdForAttrs = eleContent.id,
            sReportName = resizeNode.getAttribute('data-rdReport'),
            width = eleContent.getAttribute('Width'),
            height = eleContent.getAttribute('Height'),
            timeout = 0;

	    if (width == null || height == null) {
	        var sWidth = resizeNode.getStyle('width');
	        var sHeight = resizeNode.getStyle('height');
	        if (sWidth != null && sHeight != null) {
	            width = parseInt(sWidth.replace('px', ''));
	            height = parseInt(sHeight.replace('px', ''));
	        }
	    }

	    // Resize already created
	    if (resizeNode.hasClass('yui3-resize')) {
	        return;
	    }

	    var eleAttrs = document.getElementById("rdResizerAttrs_" + sIdForAttrs)
	    if (!Y.Lang.isValue(eleAttrs))
	        return;
	    var heightOnly = eleAttrs.getAttribute("rdHeightOnly") == "True",
            widthOnly = eleAttrs.getAttribute("rdWidthOnly") == "True";

	    eleContent.removeAttribute('Height');
	    eleContent.removeAttribute('Width');

	    var yuiResize = Y.rdResize.AddYUIResizerHandles(eleContent.id, eleAttrs);
	    if (heightOnly) {
	        if (height > 0) {
	            yuiResize.get('wrapper').setStyles({
	                height: height,
	                width: null
	            });
	        }
	    } else if (widthOnly) {
	        if (width > 0) {
	            yuiResize.get('wrapper').setStyles({
	                width: width,
	                height: null
	            });
	        }
	    } else {
	        if (width > 0 && height > 0) {
	            yuiResize.get('wrapper').setStyles({
	                width: width,
	                height: height
	            });
	        }
	    }

	    var resizeVisualization = function (width, height, finished) {
	        var visualizationDiv = resizeNode.one('logi-visualization,logi-crosstab-table');
	        if (!visualizationDiv || !Logi || !Logi.Platform || !Logi.Platform.select) {
	            return;
	        }
	        var visualizationObject = Logi.Platform.select('#' + LogiXML.escapeSelector(visualizationDiv.getAttribute('id')));
	        if (!visualizationObject) {
	            return;
	        }
	        var currSize = {height:100, width:100, wUnit:'%', hUnit:'%'};
	        if (visualizationObject.getSize) {
	            currSize = visualizationObject.getSize();
	        } 
            if (heightOnly) {
                //visualizationObject.resize(currSize.width + currSize.wUnit, height);
                Y.LogiXML.rdLogiVisualization.resize(visualizationDiv, currSize.width, height, currSize.wUnit, 'px');
	        } else if (widthOnly) {
	            //visualizationObject.resize(width, currSize.height + currSize.hUnit);
	            Y.LogiXML.rdLogiVisualization.resize(visualizationDiv, width, currSize.height, 'px', currSize.hUnit);
	        } else {
	            //visualizationObject.resize(width + "px", height + "px");
	            Y.LogiXML.rdLogiVisualization.resize(visualizationDiv, width, height, 'px', 'px');
	        }
	        /*var currSize = visualizationObject.getSize();
	        if (heightOnly) {
	            visualizationObject.resize(currSize.width + currSize.wUnit, height);
	        } else if (widthOnly) {
	            visualizationObject.resize(width, currSize.height + currSize.hUnit);
	        } else {
	            visualizationObject.resize(width + "px", height + "px");
	        }*/
            rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SetElementSize&rdWidth=' + width + '&rdHeight=' + height + '&rdElementId=' + sIdForAttrs + '&rdReport=' + sReportName +'&rdRequestForwarding=Form');
	    }
	    yuiResize.on('resize:resize', function (e) {
	        if (timeout) {
	            clearTimeout(timeout);
	        }
	        timeout = setTimeout(function () {
	            var height = e.info.offsetHeight,
                   width = e.info.offsetWidth;
	            resizeVisualization(width, height, false);
	            if (isIE() === 7) {
	                resizeVisualization(width, height, false);
	            }
	        }, 50);
	    });

	    yuiResize.on('resize:end', function (e) {
	        if (isIE() === 7) {
	            return;
	        }
	        if (timeout) {
	            clearTimeout(timeout);
	        }
	        var height = e.info.offsetHeight,
	            width = e.info.offsetWidth;

	        resizeVisualization(width, height, true);
	        yuiResize.set('resizing', false);

	    });
	};
});

//Expose YUI3 contained functions
function rdInitResizer(eleContent) {
	if (Y.Lang.isValue(LogiXML.Resize._rdInitResizer))
		LogiXML.Resize._rdInitResizer(eleContent);
	else
		setTimeout(function() {rdInitResizer(eleContent);}, 100);
}
function rdInitAnimatedChartResizer(sAnimatedChartMovieType, sAnimatedChartID, sAnimatedChartDataFile, sAnimatedChartOriginalID, sBGColor, isJScriptChart,width,height) {
	if (Y.Lang.isValue(LogiXML.Resize._rdInitAnimatedChartResizer))
	    LogiXML.Resize._rdInitAnimatedChartResizer(sAnimatedChartMovieType, sAnimatedChartID, sAnimatedChartDataFile, sAnimatedChartOriginalID, sBGColor, isJScriptChart,width,height );
	else
	    setTimeout(function () { rdInitAnimatedChartResizer(sAnimatedChartMovieType, sAnimatedChartID, sAnimatedChartDataFile, sAnimatedChartOriginalID, sBGColor, isJScriptChart, width, height); }, 200);
}
function rdInitAppletResizer(AppletID, sBGColor) {
	if (Y.Lang.isValue(LogiXML.Resize._rdInitAppletResizer))
		LogiXML.Resize._rdInitAppletResizer(AppletID, sBGColor);
	else
		setTimeout(function() { rdInitAppletResizer(AppletID, sBGColor); }, 100);
}
function rdInitAnimatedMapResizer(sAnimatedMapMovieType, sAnimatedMapID, sAnimatedMapDataFile, sAnimatedMapOriginalID, sBGColor) {
	if (Y.Lang.isValue(LogiXML.Resize._rdInitAnimatedMapResizer))
		LogiXML.Resize._rdInitAnimatedMapResizer(sAnimatedMapMovieType, sAnimatedMapID, sAnimatedMapDataFile, sAnimatedMapOriginalID, sBGColor);
	else
		setTimeout(function() { rdInitAnimatedMapResizer(sAnimatedMapMovieType, sAnimatedMapID, sAnimatedMapDataFile, sAnimatedMapOriginalID, sBGColor); }, 100);
}
function rdInitGoogleMapsResizer(GoogleMapID, eleGoogleMapObj) {
	if (Y.Lang.isValue(LogiXML.Resize._rdInitGoogleMapsResizer))
		LogiXML.Resize._rdInitGoogleMapsResizer(GoogleMapID, eleGoogleMapObj);
	else
		setTimeout(function() { rdInitGoogleMapsResizer(GoogleMapID, eleGoogleMapObj); }, 100);
}
function rdInitHighChartsResizer(eleContent) {
    if (Y.Lang.isValue(LogiXML.Resize._rdInitHighChartsResizer))
        LogiXML.Resize._rdInitHighChartsResizer(eleContent);
    else
        setTimeout(function () { rdInitHighChartsResizer(eleContent); }, 100);
}
function rdInitVisualizationResizer(eleContent) {
    if (Y.Lang.isValue(LogiXML.Resize._rdInitVisualizationResizer))
        LogiXML.Resize._rdInitVisualizationResizer(eleContent);
    else
        setTimeout(function () { rdInitVisualizationResizer(eleContent); }, 100);
}

//Supporting external functions

function rdRerenderAnimatedChart(sParams, eleDivObj){
    // Function extracts all the needed parameters, changes the Chart container Id with the new chart id and instantiates a new Chart object.
	var trim = Y.Lang.trim;
    
    var sChartParams = sParams.substring(sParams.indexOf('new FusionCharts('), sParams.lastIndexOf('rdAnimatedChart.setDataURL'));
    var myRegExp = new RegExp("'|\\\\|\"","g"); 
    sChartParams = sChartParams.replace(myRegExp, ""); 
    var aAnimatedChartParams = sChartParams.split(',');
    var sAnimChartType = trim(aAnimatedChartParams[0].substring(aAnimatedChartParams[0].indexOf('rdTemplate'), aAnimatedChartParams[0].length));
    var sChartId = trim(aAnimatedChartParams[1]);
    var sChartWidth = trim(aAnimatedChartParams[2]);
    var sChartHeight = trim(aAnimatedChartParams[3]);
    var sACDFile = sParams.substring(sParams.indexOf('setDataURL('), sParams.indexOf('rdAnimatedChart.render')).replace(myRegExp, "");
    var sAnimatedChartDataFile =  trim(sACDFile.substring(sACDFile.indexOf('(')+ 1, sACDFile.lastIndexOf(')')));
    if(eleDivObj.id.indexOf('_') != -1){
        if(eleDivObj.id.substring(eleDivObj.id.lastIndexOf('_'), eleDivObj.id.length).length > 32){  // To handle Dashboards.   ' # 11496.
            var sChartOriginalID = eleDivObj.id.substring(eleDivObj.id.indexOf('rdAnimatedChart')+15, eleDivObj.id.lastIndexOf('_'));
            var ChartGUID = eleDivObj.id.substring(eleDivObj.id.lastIndexOf('_'), eleDivObj.id.length).substring(0,33)
            var eleResizerAttrs = document.getElementById("rdResizerAttrs_" + sChartId) // Need to change the ID's for these elements below, 
            eleResizerAttrs.setAttribute('id', "rdResizerAttrs_" + sChartId)                        // so that they stay current with the returned Ajax response
            var eleHiddenReportID =  document.getElementById(sChartId + '-' + 'Hidden') // and get picked up when looked up for with the current Id's. 
            eleHiddenReportID.setAttribute('id', sChartId + '-Hidden')
        }
    }

    //Get the dimensions (height, width) from the chart containing DIV (since it's a string we have to parse it)
    //Support IE7 too. #19150 (edited the previous fix for 19125)
    if (eleDivObj.style.width) {
        sChartWidth = eleDivObj.style.width.split('px')[0];
    }
    if (eleDivObj.style.height) {
        sChartHeight = eleDivObj.style.height.split('px')[0];
    }

    // Find the chart with the same ID if it exists
    var chartReference = FusionCharts(sChartId);

    //19125 Chart must be destroyed before a new one can be created or you have duplicate ID errors
    if (Y.Lang.isValue(chartReference)) {
        FusionCharts(sChartId).dispose();
    }

    Y.on('domready', function (e) {
        var rdAnimatedChart = new FusionCharts(sAnimChartType, sChartId, sChartWidth, sChartHeight, "0", "0");
        rdAnimatedChart.setDataURL(sAnimatedChartDataFile);
        rdAnimatedChart.render('rdAnimatedChart' + sChartId);
    });
}

function rdRerenderAnimatedMap(sParams, eleDivObj){
    // Function extracts all the needed parameters, changes the Map container Id with the new chart id and instantiates a new Map object.
	var trim = Y.Lang.trim;

    var sChartParams = sParams.substring(sParams.indexOf('new FusionMaps('), sParams.lastIndexOf('map.setDataURL'));
    var myRegExp = new RegExp("'|\\\\|\"","g"); 
    sChartParams = sChartParams.replace(myRegExp, ""); 
    var aAnimatedChartParams = sChartParams.split(',');
    var sAnimChartType = trim( aAnimatedChartParams[0].substring(aAnimatedChartParams[0].indexOf('rdTemplate'), aAnimatedChartParams[0].length) );
    var sChartId = trim(aAnimatedChartParams[1]);
    var sChartWidth = trim(aAnimatedChartParams[2]);
    var sChartHeight = trim(aAnimatedChartParams[3]);
    var sAMDFile = sParams.substring(sParams.indexOf('setDataURL('), sParams.indexOf('map.render')).replace(myRegExp, "");
    var sAnimatedChartDataFile =  trim(sAMDFile.substring(sAMDFile.indexOf('(')+ 1, sAMDFile.lastIndexOf(')'))); 
    eleDivObj.setAttribute('id', 'rdFusionMap'+ sChartId);
    // Create a new Map object.
    if (typeof FusionCharts !== 'undefined')    //20691
        FusionCharts.setCurrentRenderer('flash');
    var Map = new FusionMaps(sAnimChartType, sChartId , sChartWidth , sChartHeight , "0", "0");
    Map.setDataURL(sAnimatedChartDataFile);
    Map.render('rdFusionMap'+ sChartId);
}

// Keep old calls for legacy
var LTrim = Y.Lang.trimLeft,
	RTrim = Y.Lang.trimRight,
	trim = Y.Lang.trim;
