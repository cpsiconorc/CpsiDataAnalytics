var gMaps = gMaps || [];
var ie7Processed = [];
var userMarkers = userMarkers || [];
var userClusterers = userClusterers || [];
var rdPolygonColumnID = "rdCoordinates";

function rdGmapLoad(sMapID) {
    var spanMap = document.getElementById(sMapID)

    var replay = function () {
        rdGmapLoad(sMapID);
    };

    var neededScripts = [];

    var url = spanMap.getAttribute("ApiUrl");
    if (url)
        neededScripts.push(url);

    var clusterInclude = spanMap.getAttribute("MarkerClusterInclude");
    if (clusterInclude)
        neededScripts.push(clusterInclude);

    var markerLabelInclude = spanMap.getAttribute("MarkerLabelInclude");
    if (markerLabelInclude)
        neededScripts.push(markerLabelInclude);

    if (neededScripts.length && LogiXML.addScript(neededScripts, replay))
        return;

    var mapContainer = Y.one('#' + sMapID);

    //Map types
    var sMapTypes = spanMap.getAttribute("GoogleMapTypes")
    var aMapTypes = new Array()
    if (sMapTypes) {
        var asMapTypes = spanMap.getAttribute("GoogleMapTypes").split(",")
        for (var i = 0; i < asMapTypes.length; i++) {
            switch (asMapTypes[i]) {
                case 'Map':
                    aMapTypes.push(google.maps.MapTypeId.ROADMAP)
                    break;
                case 'Satellite':
                    aMapTypes.push(google.maps.MapTypeId.SATELLITE)
                    break;
                case 'Hybrid':
                    aMapTypes.push(google.maps.MapTypeId.HYBRID)
                    break;
                case 'Terrain':
                    aMapTypes.push(google.maps.MapTypeId.TERRAIN)
                    break;
            }
        }
    }

    var initMapTypeId = null
    if (aMapTypes.length != 0) {
        initMapTypeId = aMapTypes[0];
    }
    else {
        initMapTypeId = google.maps.MapTypeId.ROADMAP
        aMapTypes = [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.TERRAIN]
    }

    //Zoom control
    var sZoomControlStyle = spanMap.getAttribute("GoogleMapZoomControl").toLowerCase()
    var zoomControlStyle = null
    switch (sZoomControlStyle) {
        case 'large':
            zoomControlStyle = google.maps.ZoomControlStyle.LARGE
            break;
        case 'small':
            zoomControlStyle = google.maps.ZoomControlStyle.SMALL
            break;
        default:
            zoomControlStyle = google.maps.ZoomControlStyle.DEFAULT
            break;
    }

    var sInitialLatitude = spanMap.getAttribute("InitialLatitude") == null ? "" : spanMap.getAttribute("InitialLatitude").replace(/ /g, '')
    var sInitialLongitude = spanMap.getAttribute("InitialLongitude") == null ? "" : spanMap.getAttribute("InitialLongitude").replace(/ /g, '')

    var centerLatLng = new google.maps.LatLng(0, 0)
    if (sInitialLatitude.length > 0 && sInitialLongitude.length > 0) {
        try {
            centerLatLng = new google.maps.LatLng(sInitialLatitude, sInitialLongitude)
        }
        catch (e) {
        }
    }

    var sInitialZoom = spanMap.getAttribute("InitialZoomLevel") == null ? "" : spanMap.getAttribute("InitialZoomLevel").replace(/ /g, '')
    var nInitialZoom = !isNaN(sInitialZoom) && sInitialZoom.length > 0 ? parseInt(sInitialZoom) : null

    //Show/hide controls

    var sMapScale = spanMap.getAttribute("MapScale").toLowerCase()
    var bShowScale = sMapScale == "true" ? true : false

    var sGoogleMapStreetView = spanMap.getAttribute("GoogleMapStreetView").toLowerCase()
    var bShowStreetView = sGoogleMapStreetView == "false" ? false : true

    var sGoogleMapPan = spanMap.getAttribute("GoogleMapPanControl").toLowerCase()
    var bShowPan = sGoogleMapPan == "false" ? false : true

    var bShowZoom = sZoomControlStyle == "false" ? false : true

    var sGoogleMapTypeControl = spanMap.getAttribute("GoogleMapTypeControl").toLowerCase()
    var bShowMapTypeControl = sGoogleMapTypeControl == "false" ? false : true
    var mapTypeControlStyle = null
    switch (sGoogleMapTypeControl) {
        case 'buttons':
            mapTypeControlStyle = google.maps.MapTypeControlStyle.HORIZONTAL_BAR
            break;
        case 'dropdown':
            mapTypeControlStyle = google.maps.MapTypeControlStyle.DROPDOWN_MENU
            break;
        default:
            mapTypeControlStyle = google.maps.MapTypeControlStyle.DEFAULT
            break;
    }

    //support of the old "GoogleMapControl" attribute
    var sGoogleMapControl = spanMap.getAttribute("GoogleMapControl").toLowerCase()
    if (sGoogleMapControl.indexOf("small") != -1) {
        zoomControlStyle = google.maps.ZoomControlStyle.SMALL
    }
    else if (sGoogleMapControl == "none" && sGoogleMapStreetView == "" && sGoogleMapPan == "" && sZoomControlStyle == "" && sGoogleMapTypeControl == "") {
        bShowStreetView = false
        bShowPan = false
        bShowZoom = false
        bShowMapTypeControl = false
    }

    var mapOptions = {
        zoom: nInitialZoom == null ? 8 : nInitialZoom,
        center: centerLatLng,
        mapTypeId: initMapTypeId,
        mapTypeControlOptions: { mapTypeIds: aMapTypes, style: mapTypeControlStyle },
        zoomControlOptions: { style: zoomControlStyle },
        scaleControl: bShowScale,
        panControl: bShowPan,
        zoomControl: bShowZoom,
        mapTypeControl: bShowMapTypeControl,
        streetViewControl: bShowStreetView
    };

    mapContainer.fire('rdCreate', { id: sMapID, mapOptions: mapOptions, container: mapContainer });

    var map = new google.maps.Map(document.getElementById(sMapID), mapOptions)

    if (spanMap.getAttribute("GoogleMapShowTraffic").toLowerCase() == "true") {
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
    }

    var bounds = new google.maps.LatLngBounds();
    var infowindow = new google.maps.InfoWindow({ content: "" });
    var bUseClustering = spanMap.getAttribute("UseClustering") == null ? false : true
    var aMapMarkerRows = document.getElementsByTagName(sMapID + "_rdMapMarker");
    var markers = [];
    for (var i = 0; i < aMapMarkerRows.length; i++) {
        var eleMapMarkerRow = aMapMarkerRows[i]
        //Validate the marker.
        var lat
        var lng
        if (eleMapMarkerRow.getAttribute(rdPolygonColumnID).length != 0) {
            //For KML files.
            lat = parseFloat(eleMapMarkerRow.getAttribute(rdPolygonColumnID).split(",")[1])
            lng = parseFloat(eleMapMarkerRow.getAttribute(rdPolygonColumnID).split(",")[0])
        } else {
            lat = parseFloat(eleMapMarkerRow.getAttribute("Latitude"))
            lng = parseFloat(eleMapMarkerRow.getAttribute("Longitude"))
        }
        if (isNaN(lat) || isNaN(lng)) { continue }
        if (lat == 0 && lng == 0) { continue }

        var options = new Object()  //GMarkerOptions object
        var point = new google.maps.LatLng(lat, lng)
        options.position = point

        //Marker image.
        var sMarkerId = eleMapMarkerRow.getAttribute("rdMarkerID")
        var eleMarkerImage = document.getElementById("rdMapMarkerImage_" + sMapID + "_" + sMarkerId) //"+"_Row" + (i + 1))
        if (eleMarkerImage) {
            var widthImage = parseInt(eleMarkerImage.getAttribute("width"))
            var heightImage = parseInt(eleMarkerImage.getAttribute("height"))
            if (widthImage == 0) { //IE
                if (eleMarkerImage.currentStyle) {
                    widthImage = parseInt(eleMarkerImage.currentStyle.width)
                    heightImage = parseInt(eleMarkerImage.currentStyle.height)
                }
                else {//19546. If not IE/Opera, then do this
                    widthImage = 1;
                    heightImage = 1;
                }
            }
            var icon = new google.maps.MarkerImage()
            icon.url = eleMarkerImage.getAttribute("src")
            icon.size = new google.maps.Size(widthImage, heightImage)
            icon.scaledSize = new google.maps.Size(widthImage, heightImage)
            icon.anchor = new google.maps.Point(widthImage / 2, heightImage) //bottom middle.
            options.icon = icon
            //Tooltip
            if (eleMarkerImage.title) {
                options.title = eleMarkerImage.title
            }
            //Don't want this to appear in the Info bubble.
            eleMarkerImage.parentNode.removeChild(eleMarkerImage)
        }

        if (eleMapMarkerRow.getAttribute("Tooltip").length != 0) {
            options.title = eleMapMarkerRow.getAttribute("Tooltip")
        }
        var marker = null
        if (eleMapMarkerRow.getAttribute("rdMarkerLabel") != null) {
            options.labelContent = eleMapMarkerRow.getAttribute("rdMarkerLabel")
            options.labelAnchor = options.icon == undefined ? new google.maps.Point(22, 0) : options.icon.anchor
            options.labelClass = eleMapMarkerRow.getAttribute("rdMarkerClass")
            marker = new MarkerWithLabel(options)
        }
        else {
            marker = new google.maps.Marker(options)
        }
        marker.isMarker = true
        var eleMarker = document.getElementById(eleMapMarkerRow.getAttribute("rdMarkerID"))
        rdCreateMarkerAction(map, marker, eleMarker, eleMapMarkerRow.getAttribute("rdActionSpanID"), infowindow)
        if (!bUseClustering) {
            marker.setMap(map)
        }
        else {
            markers.push(marker)
        }
        userMarkers.push({ mapId: sMapID, marker: marker });
        //Add the marker to the bounds, extending the bounds.
        bounds.extend(point)
    }
    var markerCluster = null
    if (bUseClustering == true) {
        markerCluster = new MarkerClusterer(map, markers)
        userClusterers.push({ mapId: sMapID, markerCluster: markerCluster });
    }

    var nMinLat; var nMaxLat; var nMinLon; var nMaxLon;
    var aMapPolygonRows = document.getElementsByTagName(sMapID + "_rdMapPolygon");
    if (aMapPolygonRows.length > 0) {
        for (var i = 0; i < aMapPolygonRows.length; i++) {
            var eleMapPolygonRow = aMapPolygonRows[i]
            var encodedPoints = eleMapPolygonRow.getAttribute("rdEncodedPoints");
            if (encodedPoints.length > 0) {
                var multi = encodedPoints.split("RDMULTIPOLY");
                var polyPaths = [];

                for (var j = 0; j < multi.length; j++) {
                    var encPts = multi[j];
                    if (encPts) {
                        var polygonPoints = google.maps.geometry.encoding.decodePath(encPts);
                        polyPaths.push(polygonPoints);
                    }
                }

                if (!polyPaths.length)
                    continue;

                var encodedPolygon = new google.maps.Polygon({
                    paths: polyPaths,
                    strokeColor: eleMapPolygonRow.getAttribute("rdBorderColor"),
                    strokeOpacity: eleMapPolygonRow.getAttribute("rdBorderOpacity"),
                    strokeWeight: parseInt(eleMapPolygonRow.getAttribute("rdBorderThickness")),
                    fillColor: eleMapPolygonRow.getAttribute("rdFillColor"),
                    fillOpacity: eleMapPolygonRow.getAttribute("rdFillOpacity"),
                    map: map
                });
                encodedPolygon.isMarker = false
                var elePolygon = document.getElementById(eleMapPolygonRow.getAttribute("rdPolygonID"))
                rdCreateMarkerAction(map, encodedPolygon, elePolygon, eleMapPolygonRow.getAttribute("rdActionSpanID"), infowindow)
                //Add the poly's extents to the bounds, extending the bounds.
                bounds.extend(new google.maps.LatLng(eleMapPolygonRow.getAttribute("rdMinLat"), eleMapPolygonRow.getAttribute("rdMinLon")));
                bounds.extend(new google.maps.LatLng(eleMapPolygonRow.getAttribute("rdMaxLat"), eleMapPolygonRow.getAttribute("rdMaxLon")));
            }
        }
    }

    var aMapPolylineRows = document.getElementsByTagName(sMapID + "_rdMapPolyline");
    if (aMapPolylineRows.length > 0) {
        for (var i = 0; i < aMapPolylineRows.length; i++) {
            var eleMapPolylineRow = aMapPolylineRows[i]
            var encodedPoints = eleMapPolylineRow.getAttribute("rdEncodedPoints");
            if (encodedPoints.length > 0) {
                var multi = encodedPoints.split("RDMULTIPOLY");
                var polyPaths = [];

                for (var j = 0; j < multi.length; j++) {
                    var encPts = multi[j];
                    if (encPts) {
                        var plPoints = google.maps.geometry.encoding.decodePath(encPts);
                        polyPaths.push(plPoints);
                    }
                }

                if (!polyPaths.length)
                    continue;

                var plObject = new google.maps.Polyline({
                    path: polyPaths,
                    strokeColor: eleMapPolylineRow.getAttribute("rdBorderColor"),
                    strokeOpacity: eleMapPolylineRow.getAttribute("rdBorderOpacity"),
                    strokeWeight: parseInt(eleMapPolylineRow.getAttribute("rdBorderThickness")),
                    map: map
                });
                plObject.isMarker = false
                var elePolyline = document.getElementById(eleMapPolylineRow.getAttribute("rdPolylineID"))
                rdCreateMarkerAction(map, plObject, elePolyline, eleMapPolylineRow.getAttribute("rdActionSpanID"), infowindow)
                //Add the line's extents to the bounds, extending the bounds.
                bounds.extend(new google.maps.LatLng(eleMapPolylineRow.getAttribute("rdMinLat"), eleMapPolylineRow.getAttribute("rdMinLon")));
                bounds.extend(new google.maps.LatLng(eleMapPolylineRow.getAttribute("rdMaxLat"), eleMapPolylineRow.getAttribute("rdMaxLon")));
            }
        }
    }

    //Set the location
    var rdSetMapLocation = function () {
        var zeroLatLng = new google.maps.LatLng(0, 0)
        if (!centerLatLng.equals(zeroLatLng) || nInitialZoom != null) {
            if (!centerLatLng.equals(zeroLatLng))
                mapOptions.center = centerLatLng
            else
                mapOptions.center = bounds.getCenter()
            map.setOptions(mapOptions)
        }
        else {
            map.fitBounds(bounds);
            var zoom = map.getZoom()
            if (zoom == 0) {
                zoom = 1
                map.setZoom(zoom)
            }
        }
    }

    var aMapKmls = document.getElementsByTagName(sMapID + "_rdKml");
    if (aMapKmls.length > 0) {
        for (var i = 0; i < aMapKmls.length; i++) {
            var eleMapKml = aMapKmls[i]
            var kml = new google.maps.KmlLayer(eleMapKml.getAttribute("rdKmlUrl"), { map: map })
        }
    }

    if (aMapKmls.length == 0) {
        rdSetMapLocation()  //Set viewport based on markers and/polygons
    }

    Y.on('domready', function (e) {
        try {    // Need to access the 'map' object to resize/re-center the Map.
            Y.use("rdResize", function () {
                LogiXML.Resize.rdInitMapResizer(sMapID, map);
            });
        }
        catch (e) { }
    });

    //15646, 15537
    if (navigator.appVersion.match('MSIE 7.0') != null) {
        if (gMaps.length > 0 && ie7Processed == false) {
            google.maps.event.addListener(gMaps[0], 'tilesloaded', function () {
                var oldMapType = gMaps[0].getMapTypeId()
                gMaps[0].setMapTypeId(null);
                gMaps[0].setMapTypeId(oldMapType);
                google.maps.event.clearListeners(gMaps[0], 'tilesloaded')
            });
            ie7Processed = true
        }
        gMaps.push(map)
    }

    try { //for export
        google.maps.event.addListener(map, 'tilesloaded', function (evt) {
            var wrapperNode = Y.one("#" + sMapID).ancestor('.rdBrowserBorn');
            if (wrapperNode) {
                wrapperNode.setAttribute("data-rdBrowserBornReady", "true");
            }
        });
    }
    catch (e) { }

    var markersElement = Y.one("#" + sMapID + "_rdmapmarkers");
    markersElement.reloadMarkers = this.reloadMarkers;
    mapContainer.setData("rdmapmarkers", markersElement);
    mapContainer.setData("rdGMap", map);

    map.resized = function () {
        google.maps.event.trigger(map, 'resize');
    };

    mapContainer.fire('rdCreated', { map: map, id: sMapID, mapOptions: mapOptions, container: mapContainer });
}

function reloadMarkers(newMarkers, sOriginResponse) {
    var sMapID = newMarkers.get("id");
    var mapContainer = Y.one("#" + sMapID);
    var map = mapContainer.getData("rdGMap");
    clearAllMarkers(sMapID);
    var oldMarkers = Y.one("#" + sMapID + "_rdmapmarkers");

    var originResponseDocument = Y.Node.create(sOriginResponse);
    var updatedMarkers = originResponseDocument.one("#" + sMapID + "_rdmapmarkers");

    if (updatedMarkers)
        oldMarkers.insert(updatedMarkers.get("children"), "replace");

    var markersList = document.getElementsByTagName(sMapID + "_rdmapmarker");
    var infowindow = new google.maps.InfoWindow({ content: "" });
    var bUseClustering = mapContainer.getAttribute("UseClustering") == "" ? false : true
    var markers = [];
    for (var i = 0; i < markersList.length; i++) {
        var eleMapMarkerRow = markersList[i]

        //Validate the marker.
        var lat
        var lng
        if (eleMapMarkerRow.getAttribute(rdPolygonColumnID).length != 0) {
            //For KML files.
            lat = parseFloat(eleMapMarkerRow.getAttribute(rdPolygonColumnID).split(",")[1])
            lng = parseFloat(eleMapMarkerRow.getAttribute(rdPolygonColumnID).split(",")[0])
        } else {
            lat = parseFloat(eleMapMarkerRow.getAttribute("Latitude"))
            lng = parseFloat(eleMapMarkerRow.getAttribute("Longitude"))
        }
        if (isNaN(lat) || isNaN(lng)) { continue }
        if (lat == 0 && lng == 0) { continue }

        var options = new Object()  //GMarkerOptions object
        var point = new google.maps.LatLng(lat, lng)
        options.position = point

        var sMarkerId = eleMapMarkerRow.getAttribute("rdMarkerID")
        var eleMarker = originResponseDocument.one('#' + sMarkerId);

        if (!eleMarker)
            continue;

        eleMarker = eleMarker.getDOMNode();

        var eleMarkerImage = originResponseDocument.one("#rdMapMarkerImage_" + sMapID + "_" + sMarkerId) //"+"_Row" + (i + 1))
        if (eleMarkerImage) {
            var widthImage = parseInt(eleMarkerImage.getAttribute("width"))
            var heightImage = parseInt(eleMarkerImage.getAttribute("height"))
            if (widthImage == 0) { //IE
                if (eleMarkerImage.currentStyle) {
                    widthImage = parseInt(eleMarkerImage.currentStyle.width)
                    heightImage = parseInt(eleMarkerImage.currentStyle.height)
                }
                else {//19546. If not IE/Opera, then do this
                    widthImage = 1;
                    heightImage = 1;
                }
            }
            var icon = new google.maps.MarkerImage()
            icon.url = eleMarkerImage.getAttribute("src")
            icon.size = new google.maps.Size(widthImage, heightImage)
            icon.scaledSize = new google.maps.Size(widthImage, heightImage)
            icon.anchor = new google.maps.Point(widthImage / 2, heightImage) //bottom middle.
            options.icon = icon
            //Tooltip
            if (eleMarkerImage.title) {
                options.title = eleMarkerImage.title
            }
            //Don't want this to appear in the Info bubble.
            eleMarkerImage.get('parentNode').removeChild(eleMarkerImage)
        }

        if (eleMapMarkerRow.getAttribute("Tooltip").length != 0) {
            options.title = eleMapMarkerRow.getAttribute("Tooltip")
        }
        var marker = null
        if (eleMapMarkerRow.getAttribute("rdMarkerLabel") != null) {
            options.labelContent = eleMapMarkerRow.getAttribute("rdMarkerLabel")
            options.labelAnchor = options.icon == undefined ? new google.maps.Point(22, 0) : options.icon.anchor
            options.labelClass = eleMapMarkerRow.getAttribute("rdMarkerClass")
            marker = new MarkerWithLabel(options)
        }
        else {
            marker = new google.maps.Marker(options)
        }
        marker.isMarker = true
        
        rdCreateMarkerAction(map, marker, eleMarker, eleMapMarkerRow.getAttribute("rdActionSpanID"), infowindow)
        if (!bUseClustering) {
            marker.setMap(map)
        }
        else {
            markers.push(marker)
        }
        userMarkers.push({ mapId: sMapID, marker: marker });
    }
    var markerCluster = null
    if (bUseClustering == true) {
        markerCluster = new MarkerClusterer(map, markers)
        userClusterers.push({ mapId: sMapID, markerCluster: markerCluster });
    }
}

function setMapOnAll(sMapID, map) {
    var um;
    for (var i = 0; i < userMarkers.length; i++) {
        um = userMarkers[i];

        if (um.mapId == sMapID)
            um.marker.setMap(map);
    }
}

function cleanAllClusterers(sMapID) {
    var uc;
    for (var i = 0; i < userClusterers.length; i++) {
        uc = userClusterers[i];
        
        if (uc.mapId == sMapID)
            uc.markerCluster.clearMarkers();
    }
}

function clearAllMarkers(sMapID) {
    setMapOnAll(sMapID, null);

    for (var i = userMarkers.length - 1; i >= 0; i--) {
        if (userMarkers[i].mapId == sMapID)
            userMarkers.splice(i, 1);
    }

    cleanAllClusterers(sMapID);

    for (var i = userClusterers.length - 1; i >= 0; i--) {
        if (userClusterers[i].mapId == sMapID)
            userClusterers.splice(i, 1);
    }
}

function rdCreateMarkerAction(map, marker, eleMarker, sMarkerActionSpanID, infowindow) {
    if (eleMarker) {
        if (eleMarker.getAttribute("rdActionMapMarkerInfo") == "true") {
            //A bubble-style Info window.
            google.maps.event.addListener(marker, "click", function (point) {
                //RD21353
                Y.each(Y.one(eleMarker).all('rdiframe'), function (nodeFrame) {
                    var sSrc = nodeFrame.getData("hiddensource");
                    if (Y.Lang.isValue(sSrc))
                        rdConvertRdIFrame(nodeFrame.getDOMNode());
                });

                //This is for IFRAMES (SubReports) that may be in the info panel.
                cFrames = eleMarker.getElementsByTagName("IFRAME");
                for (var i = 0; i < cFrames.length; i++) {
                    var cFrame = cFrames[i];
                    var sSrc = Y.one(cFrame).getData("hiddensource");
                    if (sSrc != null) {   //There is no HiddenSource if the element was initially visible.
                        if (cFrame.getAttribute("src") == null) {   //For nonIE
                            cFrame.setAttribute("src", sSrc + "&rdRnd=" + Math.floor(Math.random() * 100000));
                        }										    //For IE.
                        if (cFrame.getAttribute("src").indexOf(sSrc) == -1) {
                            cFrame.setAttribute("src", sSrc + "&rdRnd=" + Math.floor(Math.random() * 100000));
                        }
                    }
                }
                infowindow.setContent(eleMarker.innerHTML);
                if (this.isMarker != true) {
                    infowindow.setPosition(point.latLng);
                    infowindow.open(map);
                }
                else {
                    infowindow.open(map, this);
                    Y.LogiXML.ChartCanvas.createElements();
                }
            });
        } else if (sMarkerActionSpanID) {
            var eleActionSpan = document.getElementById(sMarkerActionSpanID)
            if (eleActionSpan) {
                google.maps.event.addListener(marker, "click", function () { eleActionSpan.click() })
            }
        } else {
            //No Action for the image.
        }
    }
}

function rdGetGMapObject(sMapID) {
    var mapContainer = Y.one('#' + sMapID);
    if (mapContainer) {
        return mapContainer.getData("rdGMap");
    }
    return null;
}

document.addEventListener("DOMContentLoaded", function () {
    var maps = document.getElementsByClassName("rdGoogleMap");

    for (var i = 0; i < maps.length; i++) {
        rdGmapLoad(maps[i].id);
    }
});