function rdInitGoogleMapsResizer(GoogleMapID, eleGoogleMapObj) {
    var eleGoogleMap = document.getElementById(GoogleMapID);    // This is a Div. But the Google Map sits on top of this Div
    var width = eleGoogleMap.offsetWidth;
    var height = eleGoogleMap.offsetHeight;
    var eleGoogleMapContentHolder = document.createElement("Div");  // Add a Div around the Google Map.
    eleGoogleMapContentHolder.setAttribute("id", "rdGoogleMap" + GoogleMapID);
    var eleContentParent = eleGoogleMap.parentNode;
    eleGoogleMap.parentNode.removeChild(eleGoogleMap);
    eleContentParent.appendChild(eleGoogleMapContentHolder);
    eleGoogleMapContentHolder.appendChild(eleGoogleMap);             
    eleGoogleMapContentHolder.style.width = width + 10;
    eleGoogleMapContentHolder.style.height = height + 10;
    eleGoogleMapContentHolder.src = 'javascript:void(0)';
    var center = eleGoogleMapObj.getCenter();
    var zoom = eleGoogleMapObj.getZoom();
    var type = eleGoogleMapObj.getCurrentMapType();

    var eleAttrs = document.getElementById("rdResizerAttrs_" + GoogleMapID);
     if(!eleAttrs)
        setTimeout(function(){rdInitGoogleMapsResizer(GoogleMapID)},250);
    if (!eleAttrs) {
        return;
    }
    var sReportID = document.getElementById(GoogleMapID + '-Hidden').value;
    
    var yuiResize = new YAHOO.util.Resize(eleGoogleMapContentHolder.id, {
        knobHandles: (eleAttrs.getAttribute('rdHandleStyle')=="Knob")
    });
    
    if (eleAttrs.getAttribute('rdMinWidth')) {
        yuiResize.setAttributes({minWidth: parseInt(eleAttrs.getAttribute('rdMinWidth'))})
    }
    if (eleAttrs.getAttribute('rdMinHeight')) {
        yuiResize.setAttributes({minHeight: parseInt(eleAttrs.getAttribute('rdMinHeight'))})
    }
     if (eleAttrs.getAttribute('rdMaxWidth')) {
        yuiResize.setAttributes({maxWidth: parseInt(eleAttrs.getAttribute('rdMaxWidth'))})
    }
    if (eleAttrs.getAttribute('rdMaxHeight')) {
        yuiResize.setAttributes({maxHeight: parseInt(eleAttrs.getAttribute('rdMaxHeight'))})
    }
    
    eleGoogleMapObj.enableScrollWheelZoom();    // ScrollWheelZoom.
    //debug;
    yuiResize.on('endResize', function() {
        if((eleGoogleMapContentHolder.offsetWidth != eleGoogleMap.offsetWidth)|(eleGoogleMapContentHolder.offsetHeight != eleGoogleMap.offsetHeight)){
//            eleGoogleMap.style.width = parseInt(eleGoogleMapContentHolder.offsetWidth) - 10 
//            eleGoogleMap.style.height = parseInt(eleGoogleMapContentHolder.offsetHeight) - 10   
            //eleGoogleMap.style.visibility = '';
            //eleGoogleMapObj.checkResize();
//            var accountmap = new GMap2(document.getElementById(GoogleMapID),{mapTypes:aMapTypes});
//            accountmap.checkResize();
            //rdGmapLoad(GoogleMapID)
            //google.load('maps','2.x',{'callback' : function(){rdGmapLoad(GoogleMapID)}});
            //map.setUIToDefault();
            rdAjaxRequest('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + GoogleMapID + ',' + eleGoogleMapContentHolder.id + '&rdGoogleMapCurrentWidth=' + (parseInt(eleGoogleMapContentHolder.offsetWidth)-5).toString() + '&rdGoogleMapCurrentHeight=' + (parseInt(eleGoogleMapContentHolder.offsetHeight)-5).toString() +  '&rdGoogleMapId=' + GoogleMapID + '&rdReport=' + sReportID + '&rdGoogleMapResizerRefresh=True');            
//            var center = eleGoogleMapObj.getCenter();
//            var zoom = eleGoogleMapObj.getZoom();
//            var type = eleGoogleMapObj.getCurrentMapType();
//            eleGoogleMapObj.setCenter(center, zoom, type);       
            //eleGoogleMapObj.centerAtLatLng(center);
            
        }
    });
    
     yuiResize.on('startResize', function() {
        //eleGoogleMap.style.visibility = 'hidden';  
        center = eleGoogleMapObj.getCenter();   // Get the values at the beginning of the Resize.
        zoom = eleGoogleMapObj.getZoom();
        type = eleGoogleMapObj.getCurrentMapType();
      });     
    yuiResize.on('resize', function() {
            eleGoogleMap.style.width = parseInt(eleGoogleMapContentHolder.offsetWidth) - 10 
            eleGoogleMap.style.height = parseInt(eleGoogleMapContentHolder.offsetHeight) - 10   
            eleGoogleMapObj.checkResize();  // Resize the Map.
            eleGoogleMapObj.setCenter(center, zoom, type);   // Set the Center of the Map.          
        }); 
}




