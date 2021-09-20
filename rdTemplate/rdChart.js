function rdChartLoad( imgChart ) {
	var chartNode = Y.one( imgChart ),
		url = chartNode.get('src');
	
	// This image is used when trying to size charts for dashboard panels or mobile charts, skip the first onload
	if ( url.indexOf("rd1x1Trans.gif") != -1 ) {
		
		// Mobile chart autosize to fit container
		if ( chartNode.hasClass( 'autoSize' ) ) {
			url = url.replace( 'rdTemplate/rd1x1Trans.gif','rdTemplate/rdChart2.aspx' );
			url = url + '&rdResizeWidth=' + chartNode.get('clientWidth');
			chartNode.setStyle( 'width', chartNode.get('clientWidth') + 'px' );
			chartNode.removeAttribute( 'width' );
			chartNode.removeAttribute( 'height' );
			chartNode.set( 'src', url );
		}
		//19094  Have to switch the wait image to the chart for a refresh
		else if (Y.Lang.isValue(Y.Selector.ancestor(imgChart, '.rdDashboardPanel'))) {
		    url = url.replace('rdTemplate/rd1x1Trans.gif', 'rdTemplate/rdChart2.aspx');
		    chartNode.removeAttribute('width');
		    chartNode.removeAttribute('height');
		    chartNode.set('src', url);
		}
		return;
	}

	//Does this chart support drill-down?
	if ( url.indexOf("rdDrillDownID=") != -1 ) { 
		var sDrilldownID = imgChart.src;
		sDrilldownID = sDrilldownID.substring( sDrilldownID.indexOf("rdDrillDownID=") + 14 );
		sDrilldownID = sDrilldownID.substring( 0, sDrilldownID.indexOf("&") );
		LogiXML.rd.downloadImageMap( sDrilldownID );
	}
	
	//Does this chart have a resizer?
	if ( url.indexOf("rdResizer=") != -1 ) {
		rdInitResizer(imgChart);
	}
	
	// Take the loader background image away...
	imgChart.style.backgroundImage = "";
}

function findAncestorByIdPrefix(prefix, elem) {
	while (elem.parentNode) {
		elem = elem.parentNode;
		
		if (elem.id && elem.id.indexOf(prefix) == 0)
			return elem;
	}
	
	return null;
}

function rdChartError(imgChart) {
    if (imgChart.parentNode && imgChart.parentNode.tagName != "A") {
		parentChart = imgChart.parentNode
		//Create a link pointing to the error page.
		var aLink = document.createElement("A")
		aLink.href = imgChart.src + "&rdChartDebug=True"
		//Make a new IMG inside of the anchor that points to the error GIF.
		var imgError = document.createElement("IMG")
		imgError.src = "rdTemplate/rdChartError.gif"
		aLink.appendChild(imgError)
		parentChart.appendChild(aLink)
		//Remove the chart image.
		parentChart.removeChild(imgChart)
	}
}

LogiXML.rd.downloadImageMap = function( imageMapID, retry ) {	
	// Use Ajax request to pull down HTML with image map
	var url = "rdTemplate/rdChart2.aspx",
		cfg = {
		method: 'GET',
		data: "rdDrillDownID=" + imageMapID + "&" + Math.floor(Math.random() * 100000),
		on: {
			success: LogiXML.rd.attachImageMap,
			failure: function( transactionid, response, params ) {
				/*
				 * Something in our javascript or a browser caching issue causes Safari on Windows to screw up
				 * the first AJAX request after loading a page by hitting the back button.  The request shows up as canceled
				 * and packet sniffing shows Safari never sends the request to the server.  You could even do
				 * a setTimeout with 10ms and run the exact same call and it would work fine.
				 * 
				 * Spent several hours looking at this and couldn't determine what the root of the problem was.
				 * For now, catch the error and rerun the AJAX request.
				 */
				if ( !(retry === true) && response.readyState === 4 && response.responseXML == null && Y.UA.safari > 0 ) {
					LogiXML.rd.downloadImageMap( params.success, true );
				}
				retry = null;
			}
		},
		arguments: {
			success: imageMapID
		}
	};
	Y.io( url, cfg );
};

LogiXML.rd.attachImageMap = function( transactionID, response, args ) {
	if ( response.responseText ) {
		/* HTML returned is incorrect, should fix at some point, but for now clean it up a bit
		 * ex.<html><map>...</map></html>
		 */
		var localYUI = Y,
			serverResponseText = response.responseText,
			cleanMap = serverResponseText.substring( serverResponseText.indexOf('<map'), serverResponseText.indexOf('</html>') ),
			body = localYUI.one(document.body),
			imageMapID = args.success,
			currentMap = localYUI.one( 'map[name=' + imageMapID +']' ),
			
			// Has image been resized or refreshed?  If so then we need to update existing map
			associatedImage = localYUI.one( 'img[usemap=#' + imageMapID +']' );
		
		/* Charts and their corresponding imagemaps aren't loaded at the same time.  A seperate AJAX request, this is 
		 * the response function, pulls down imagemaps after onload event for chart.  If user updates fast enough, they can
		 * overwrite the old image with new one before we've loaded the imagemap.  Thus associatedImage will be null.
		 * So null check until better event management or chart/imagemap are downloaded at same time.
		 */
		if ( associatedImage == null ) {
		    return;
		}
		
		/* Firefox seems to have a quirk where it internally caches the <map> specified by use usemap attribute.
		 * You can delete the map from DOM and Firefox will still act like the map is there.  To work
		 * around this remove the usemap attribute, *don't blank it*, and set to new map.
		 */
		if ( currentMap ) {
			associatedImage.removeAttribute( 'usemap' );
			currentMap.remove();
		}
		currentMap = localYUI.Node.create( cleanMap );
		body.append( currentMap );
		
		associatedImage.setAttribute( 'usemap', '#' + imageMapID );
	}
};
