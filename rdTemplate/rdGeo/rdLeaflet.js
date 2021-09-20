'use strict';

var LogiXML = LogiXML || {};

LogiXML.rdLeaflet = LogiXML.rdLeaflet || {
    POPUP_CSS: "rdLeafletPopup",
    POLYGON_COLUMN_ID: "rdCoordinates",
    getProjection: function () {
        var projection = {
            fromLatLngToDivPixel: function (latLng) {
                var map = this.getMap();

                if (!map)
                    return;

                var pix = map.latLngToLayerPoint(latLng);

                if (this.anchorIcon_) {
                    pix.x -= this.anchorIcon_[1];
                    pix.y -= this.anchorIcon_[0];
                }

                return pix;
            }.bind(this),
            fromDivPixelToLatLng: function (pix) {
                var map = this.getMap();

                if (!map)
                    return;

                if (this.anchorIcon_) {
                    pix.x += this.anchorIcon_[1];
                    pix.y += this.anchorIcon_[0];
                }

                var latLng = map.layerPointToLatLng(pix);

                return latLng;
            }.bind(this)
        }

        return projection;
    },
    Clusterer: function (map, clusterId) {
        var clusterer = new rdMarkerClusterer(map, []);

        clusterer.infoId = clusterId;
        clusterer.mapId = map._container.id;
        clusterer.getLatLngs = LogiXML.rdLeaflet.getClustererLatLngs.bind(clusterer);
        clusterer.getMap = function () { return this._map; }.bind(clusterer);
        clusterer.getProjection = LogiXML.rdLeaflet.getProjection.bind(clusterer);
        clusterer.reCluster = LogiXML.rdLeaflet.reCluster.bind(clusterer);
        clusterer.rdMarkers = [];

        clusterer.clear = function () {
            this.rdMarkers = [];
        }.bind(clusterer);

        clusterer.cluster = function () {
            this.clearMarkers();
            this.addMarkers(this.rdMarkers);
        }.bind(clusterer);

        return clusterer;
    },
    Marker: null,
    MarkerImage: function (url, width, height) {
        this.iconUrl = url;
        this.iconSize = [width, height];
        this.iconAnchor = [Math.round(width / 2), height];
        this.anchor = this.iconAnchor;
    },
    reloader: [],
    userClusterers: [],
    getClusterer: function (map, clusterId) {
        var clusterer;

        for (var i = 0; i < LogiXML.rdLeaflet.userClusterers.length; i++) {
            clusterer = LogiXML.rdLeaflet.userClusterers[i];

            if (clusterer.mapId === map._container.id && clusterer.infoId === clusterId) {
                return clusterer;
            }
        }

        clusterer = new LogiXML.rdLeaflet.Clusterer(map, clusterId);
        LogiXML.rdLeaflet.userClusterers.push(clusterer);

        return clusterer;
    },
    /*
     * Utility functions to decode/encode numbers and array's of numbers
     * to/from strings (Google maps polyline encoding)
     *
     * Extends the L.Polyline and L.Polygon object with methods to convert
     * to and create from these strings.
     *
     * Jan Pieter Waagmeester <jieter@jieter.nl>
     *
     * Original code from:
     * http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/
     * (which is down as of december 2014)
     */
    addPolylineUtil: function () {
        var defaultOptions = function (options) {
            if (typeof options === 'number') {
                // Legacy
                options = {
                    precision: options
                };
            } else {
                options = options || {};
            }

            options.precision = options.precision || 5;
            options.factor = options.factor || Math.pow(10, options.precision);
            options.dimension = options.dimension || 2;
            return options;
        };

        var PolylineUtil = {
            encode: function (points, options) {
                options = defaultOptions(options);

                var flatPoints = [];
                for (var i = 0, len = points.length; i < len; ++i) {
                    var point = points[i];

                    if (options.dimension === 2) {
                        flatPoints.push(point.lat || point[0]);
                        flatPoints.push(point.lng || point[1]);
                    } else {
                        for (var dim = 0; dim < options.dimension; ++dim) {
                            flatPoints.push(point[dim]);
                        }
                    }
                }

                return this.encodeDeltas(flatPoints, options);
            },
            decodeLastLng: null,
            decode: function (encoded, options) {
                options = defaultOptions(options);

                var flatPoints = this.decodeDeltas(encoded, options);

                var points = [];

                if (options.dimension == 2) {

                    for (var i = 0, len = flatPoints.length; i + 1 < len;) {
                        var lat = flatPoints[i++];
                        var lng = flatPoints[i++];

                        if (this.decodeLastLng !== null) {
                            if (this.decodeLastLng < 0) {
                                if (lng > 0) {
                                    var west = (180 + this.decodeLastLng) + (180 - lng);
                                    var east = Math.abs(this.decodeLastLng) + lng;

                                    if (west < east)
                                        lng -= 360;
                                }
                            }
                            else if (this.decodeLastLng > 0) {
                                if (lng < 0) {
                                    var west = this.decodeLastLng + Math.abs(lng);
                                    var east = (180 - this.decodeLastLng) + (180 + lng);

                                    if (east < west)
                                        lng += 360;
                                }
                            }
                        }

                        this.decodeLastLng = lng;

                        var point = new L.LatLng(lat, lng);

                        points.push(point);
                    }
                }
                else {
                    for (var i = 0, len = flatPoints.length; i + (options.dimension - 1) < len;) {
                        var point = [];

                        for (var dim = 0; dim < options.dimension; ++dim) {
                            point.push(flatPoints[i++]);
                        }

                        points.push(point);
                    }
                }

                return points;
            },

            encodeDeltas: function (numbers, options) {
                options = defaultOptions(options);

                var lastNumbers = [];

                for (var i = 0, len = numbers.length; i < len;) {
                    for (var d = 0; d < options.dimension; ++d, ++i) {
                        var num = numbers[i];
                        var delta = num - (lastNumbers[d] || 0);
                        lastNumbers[d] = num;

                        numbers[i] = delta;
                    }
                }

                return this.encodeFloats(numbers, options);
            },

            decodeDeltas: function (encoded, options) {
                options = defaultOptions(options);

                var lastNumbers = [];

                var numbers = this.decodeFloats(encoded, options);
                for (var i = 0, len = numbers.length; i < len;) {
                    for (var d = 0; d < options.dimension; ++d, ++i) {
                        numbers[i] = Math.round((lastNumbers[d] = numbers[i] + (lastNumbers[d] || 0)) * options.factor) / options.factor;
                    }
                }

                return numbers;
            },

            encodeFloats: function (numbers, options) {
                options = defaultOptions(options);

                for (var i = 0, len = numbers.length; i < len; ++i) {
                    numbers[i] = Math.round(numbers[i] * options.factor);
                }

                return this.encodeSignedIntegers(numbers);
            },

            decodeFloats: function (encoded, options) {
                options = defaultOptions(options);

                var numbers = this.decodeSignedIntegers(encoded);
                for (var i = 0, len = numbers.length; i < len; ++i) {
                    numbers[i] /= options.factor;
                }

                return numbers;
            },

            encodeSignedIntegers: function (numbers) {
                for (var i = 0, len = numbers.length; i < len; ++i) {
                    var num = numbers[i];
                    numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
                }

                return this.encodeUnsignedIntegers(numbers);
            },

            decodeSignedIntegers: function (encoded) {
                var numbers = this.decodeUnsignedIntegers(encoded);

                for (var i = 0, len = numbers.length; i < len; ++i) {
                    var num = numbers[i];
                    numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
                }

                return numbers;
            },

            encodeUnsignedIntegers: function (numbers) {
                var encoded = '';
                for (var i = 0, len = numbers.length; i < len; ++i) {
                    encoded += this.encodeUnsignedInteger(numbers[i]);
                }
                return encoded;
            },

            decodeUnsignedIntegers: function (encoded) {
                var numbers = [];

                var current = 0;
                var shift = 0;

                for (var i = 0, len = encoded.length; i < len; ++i) {
                    var b = encoded.charCodeAt(i) - 63;

                    current |= (b & 0x1f) << shift;

                    if (b < 0x20) {
                        numbers.push(current);
                        current = 0;
                        shift = 0;
                    } else {
                        shift += 5;
                    }
                }

                return numbers;
            },

            encodeSignedInteger: function (num) {
                num = (num < 0) ? ~(num << 1) : (num << 1);
                return this.encodeUnsignedInteger(num);
            },

            // This function is very similar to Google's, but I added
            // some stuff to deal with the double slash issue.
            encodeUnsignedInteger: function (num) {
                var value, encoded = '';
                while (num >= 0x20) {
                    value = (0x20 | (num & 0x1f)) + 63;
                    encoded += (String.fromCharCode(value));
                    num >>= 5;
                }
                value = num + 63;
                encoded += (String.fromCharCode(value));

                return encoded;
            }
        };

        // Export Node module
        if (typeof module === 'object' && typeof module.exports === 'object') {
            module.exports = PolylineUtil;
        }

        // Inject functionality into Leaflet
        if (!(L.Polyline.prototype.fromEncoded)) {
            L.Polyline.fromEncoded = function (encoded, options) {
                return L.polyline(PolylineUtil.decode(encoded), options);
            };
        }
        if (!(L.Polygon.prototype.fromEncoded)) {
            L.Polygon.fromEncoded = function (encoded, options) {
                return L.polygon(PolylineUtil.decode(encoded), options);
            };
        }

        var encodeMixin = {
            encodePath: function () {
                return PolylineUtil.encode(this.getLatLngs());
            }
        };

        if (!L.Polyline.prototype.encodePath) {
            L.Polyline.include(encodeMixin);
        }
        if (!L.Polygon.prototype.encodePath) {
            L.Polygon.include(encodeMixin);
        }

        L.PolylineUtil = PolylineUtil;
    },
    __errorCache: [],
    displayError: function (mapDiv, err, name) {
        var text;
        
        if (name) {
            text = "Failed to load LeafletMapLayer \"" + name + "\".";

            if (err)
                text += " " + err;

            text += " Check values for Connection.LeafletMap. If the connection requires an api key, it may be expired or reached its limit.";
        }
        else
            text = err;

        if (LogiXML.rdLeaflet.__errorCache.indexOf(text) >= 0)
            return;

        console.error(text);

        LogiXML.rdLeaflet.__errorCache.push(text);

        var errDiv = document.createElement("DIV");
        errDiv.className = "ThemeErrorText";
        errDiv.innerText = text;
        mapDiv.parentNode.appendChild(errDiv);
    },
    createTileLayer: function (mapDiv, mapType) {
        var tileLayer = {
            caption: mapType.caption
        };

        if (mapType.js) {
            try {
                tileLayer.layer = eval(mapType.js);
            }
            catch (err) {
                tileLayer.layer = null;
                LogiXML.rdLeaflet.displayError(mapDiv, err, mapType.caption);
            }
        }
        else {
            var options = {
                minZoom: 0,
                maxZoom: 30
            };

            if (mapType.attribution)
                options.attribution = mapType.attribution;

            tileLayer.layer = new L.TileLayer(mapType.tileServer, options);
        }

        return tileLayer;
    },
    createBounds: function () {
        return {
            cnt: 0,
            _latLng: null,
            minLat: null,
            maxLat: null,
            minLng: null,
            maxLng: null,
            addLatLng: function (lat, lng) {
                if (this.minLat === null) {
                    this.minLat = lat;
                    this.maxLat = lat;
                }
                else {
                    this.minLat = Math.min(this.minLat, lat);
                    this.maxLat = Math.max(this.maxLat, lat);
                }

                if (this.minLng === null) {
                    this.minLng = lng;
                    this.maxLng = lng;
                }
                else {
                    this.minLng = Math.min(this.minLng, lng);
                    this.maxLng = Math.max(this.maxLng, lng);
                }

                if (!this._latLng)
                    this._latLng = new L.LatLng(this.getMidLat(), this.getMidLng());
                else {
                    this._latLng.lat = this.getMidLat();
                    this._latLng.lng = this.getMidLng();
                }

                this.cnt++;
            },
            hasLatLng: function () {
                return this.minLat !== null;
            },
            toLeafletBounds: function () {
                return L.latLngBounds(
                    new L.LatLng(this.minLat, this.minLng),
                    new L.LatLng(this.maxLat, this.maxLng)
                );
            },
            getMidLat: function () {
                if (!this.hasLatLng())
                    return null;

                var diff = this.maxLat - this.minLat;

                this._midLat = this.minLat + (diff / 2);

                return this._midLat;
            },
            getMidLng: function () {
                if (!this.hasLatLng())
                    return null;

                var diff = this.maxLng - this.minLng;

                this._midLng = this.minLng + (diff / 2);

                return this._midLng;
            }
        };
    },
    getClustererLatLngs: function () {
        var latLngs = [];

        var markers = this.getMarkers();

        var clusterBounds = LogiXML.rdLeaflet.createBounds();
        var latLng;

        for (var i = 0; i < markers.length; i++) {
            latLng = markers[i].getLatLng();

            latLngs.push(latLng);

            clusterBounds.addLatLng(latLng.lat, latLng.lng);
        }

        var midLat = clusterBounds.getMidLat();
        var midLng = clusterBounds.getMidLng();

        if (midLat && midLng) {
            this._latLng = new L.LatLng(midLat, midLng);
        }
        else {
            this._latLng = new L.LatLng(0, 0);
        }

        return latLngs;
    },
    /*
     * Returns "SCRIPT_LOADING" if a script was loaded
     */
    getMapTypes: function (mapDiv, fxIfLoading) {
        var sLayerIDs = mapDiv.getAttribute("LayerIDs")
        var aMapTypes = [];

        var asLayerIDs;

        if (sLayerIDs)
            asLayerIDs = sLayerIDs.split(",");
        else
            asLayerIDs = [];

        var scriptsToAdd = [];

        var i = -1;
        var mapType = null;
        var async = false;
        var nextId;
        var failedIds = mapDiv.getAttribute("FailedLayerIDs");
        var loadedIds = mapDiv.getAttribute("LoadedLayerIDs");

        if (failedIds)
            failedIds = failedIds.split(',');
        else
            failedIds = [];

        if (loadedIds)
            loadedIds = loadedIds.split(',');
        else
            loadedIds = [];

        var loadNextMapType = function () {
            i++;

            for (; i < asLayerIDs.length; i++) {
                nextId = asLayerIDs[i].trim();

                if (failedIds.indexOf(nextId) >= 0)
                    continue;

                mapType = {
                    id: nextId
                };

                mapType.key = mapType.id.toLowerCase().replace(/[^a-z0-9]/g, "_");

                mapType.tileServer = mapDiv.getAttribute("data-" + mapType.key + "tileserver");
                mapType.js = mapDiv.getAttribute("data-" + mapType.key + "tileserverjs");
                mapType.attribution = mapDiv.getAttribute("data-" + mapType.key + "tileserverattribution");
                mapType.include = mapDiv.getAttribute("data-" + mapType.key + "tileserverinclude");
                mapType.layerType = mapDiv.getAttribute("data-" + mapType.key + "tileserverlayer");
                mapType.caption = mapDiv.getAttribute("data-" + mapType.key + "tileservercaption");

                if (mapType.include) {
                    mapType.include = mapType.include.split('|');

                    if (loadedIds.indexOf(mapType.id) < 0 && fxIfLoading) {
                        if (LogiXML.addScript(mapType.include, onSuccess, onFail)) {
                            async = true;
                            return "SCRIPT_LOADING";
                        }
                    }
                }

                onSuccess(false);
            }

            if (!async)
                return aMapTypes;

            if (fxIfLoading)
                setTimeout(fxIfLoading, 1);

            return "SCRIPT_LOADING";
        };

        var onSuccess = function (loadNext) {
            //console.log("Map type loaded: " + mapType.caption);
            aMapTypes.push(mapType);

            loadedIds.push(mapType.id);
            mapDiv.setAttribute("LoadedLayerIDs", loadedIds.join());

            if (loadNext !== false)
                loadNextMapType();
        };

        var onFail = function (error, origArgs) {
            failedIds.push(mapType.id);
            mapDiv.setAttribute("FailedLayerIDs", failedIds.join());

            LogiXML.rdLeaflet.displayError(mapDiv, error, mapType.caption);

            loadNextMapType();
        };

        return loadNextMapType();
    },
    getBoundsFromLayers: function (map) {
        var bounds = LogiXML.rdLeaflet.createBounds();

        map.eachLayer(function (layer) {
            var latLngs = [];

            if (typeof rdClusterIcon !== "undefined" && layer instanceof rdClusterIcon) {
                if (layer.cluster_ && layer.cluster_.center_)
                    latLngs.push(layer.cluster_.center_);
            }
            else if (layer.getBounds) {
                var _bounds = layer.getBounds();
                latLngs = [_bounds.getSouthWest(), _bounds.getNorthEast()];
            }
            else if (layer.getLatLngs)
                latLngs = layer.getLatLngs();
            else if (layer.getLatLng)
                latLngs = [layer.getLatLng()];
            else
                return;

            var latLng;

            for (var i = 0; i < latLngs.length; i++) {
                latLng = latLngs[i];
                bounds.addLatLng(latLng.lat, latLng.lng);
            }
        });

        return bounds;
    },
    createMap: function (mapDiv) {
        if (mapDiv.getAttribute("rdLeafletInit") === "True")
            return;

        var mapId = mapDiv.getAttribute('id');

        var replay = function () {
            if (!L.PolylineUtil)
                LogiXML.rdLeaflet.addPolylineUtil();

            return LogiXML.rdLeaflet.createMap(document.getElementById(mapId));
        };

        var bUseClustering = mapDiv.hasAttribute("UseClustering");

        // Initial zoom and center point
        var useInitialLatLng = true;
        var sInitialLatitude = (mapDiv.getAttribute("InitialLatitude") || "").replace(/ /g, '');
        var lat;
        if (sInitialLatitude.length > 0 && !isNaN(sInitialLatitude))
            lat = parseFloat(sInitialLatitude);
        else {
            lat = 0;
            useInitialLatLng = false;
        }

        var sInitialLongitude = (mapDiv.getAttribute("InitialLongitude") || "").replace(/ /g, '');
        var long;
        if (sInitialLongitude.length > 0 && !isNaN(sInitialLongitude))
            long = parseFloat(sInitialLongitude)
        else {
            long = 0;
            useInitialLatLng = false;
        }

        var useInitialZoom;
        var sInitialZoom = (mapDiv.getAttribute("InitialZoomLevel") || "").replace(/ /g, '');
        var zoom;
        
        if (sInitialZoom.length > 0 && !isNaN(sInitialZoom)) {
            zoom = parseInt(sInitialZoom);
            useInitialZoom = true;
        }
        else {
            zoom = 7;
            useInitialZoom = false;
        }

        var centerLatLng = new L.LatLng(lat, long);

        var aMapTypes = LogiXML.rdLeaflet.getMapTypes(mapDiv, replay);

        if (aMapTypes === "SCRIPT_LOADING")
            return;

        var mapLayer, hybridLayer, satelliteLayer, terrainLayer;

        var firstLayer = null;
        var firstNonOverlayLayer = null;
        var layerControl = L.control.layers();

        for (var i = 0; i < aMapTypes.length; i++) {
            var mapType = aMapTypes[i];
            var tileLayer = LogiXML.rdLeaflet.createTileLayer(mapDiv, mapType);

            if (tileLayer && tileLayer.layer) {
                if (mapType.layerType === "Overlay")
                    layerControl.addOverlay(tileLayer.layer, tileLayer.caption);
                else {
                    layerControl.addBaseLayer(tileLayer.layer, tileLayer.caption);

                    if (!firstNonOverlayLayer)
                        firstNonOverlayLayer = tileLayer.layer;
                }

                if (!firstLayer)
                    firstLayer = tileLayer.layer;
            }
        }

        if (!firstLayer) {
            LogiXML.rdLeaflet.displayError(mapDiv, "No map layers to display");
            return;
        }

        var map = new L.Map(mapId, {
            worldCopyJump: true
        });

        // subscribe to changes to the Dashboard Panel and the Dashboard itself - if this happens to be in a dashboard panel
        if (LogiXML && LogiXML.Ajax && LogiXML.Ajax.AjaxTarget && Y) {
            var panel = Y.one(mapDiv).ancestor(".panelBody");
            if (panel) {
                var ajaxTarget = LogiXML.Ajax.AjaxTarget();

                var eventName = 'refreshed_' + panel.get("id");
                ajaxTarget.detach(eventName, LogiXML.rdLeaflet.onRefresh);
                ajaxTarget.on(eventName, LogiXML.rdLeaflet.onRefresh);

                var dashboardId = Y.one('#DashboardIdentifier');
                if (dashboardId) {
                    dashboardId = dashboardId.get("value");
                    if (dashboardId) {
                        eventName = 'refreshed_' + dashboardId;
                        ajaxTarget.detach(eventName, LogiXML.rdLeaflet.onRefresh);
                        ajaxTarget.on(eventName, LogiXML.rdLeaflet.onRefresh);
                    }
                }
            }
        }

        mapDiv.setAttribute("rdLeafletInit", "True");

        if (bUseClustering) {
            // apply google abstraction implementation
            map.MarkerClustererOptions = {
                OverlayView: LogiXML.rdLeaflet.Marker,
                LatLngBounds: L.LatLngBounds,
                LatLng: L.LatLng,
                addDomListener: LogiXML.addListener,
                trigger: LogiXML.trigger,
                clearInstanceListeners: LogiXML.clearListeners,
                addListener: LogiXML.addListener,
                removeListener: LogiXML.removeListener
            };
        }

        // for resizing
        map.setCenter = map.setView;
        map.resized = function () {
            LogiXML.rdLeaflet.resizePopup(map.infowindow, mapDiv);
            map.invalidateSize.apply(map, arguments);
        };
        map.finishedLoading = false;

        if (bUseClustering) {
            map.on("zoomend", function () {
                if (this.finishedLoading)
                    LogiXML.rdLeaflet.reCluster(map);
            });
        }

        map.useInitialLatLng = useInitialLatLng;
        map.useInitialZoom = useInitialZoom;

        if (firstNonOverlayLayer)
            map.addLayer(firstNonOverlayLayer);
        else
            map.addLayer(firstLayer);

        var bShowScale, bShowMapTypeControl, bShowZoom;
        
        bShowScale = mapDiv.getAttribute("MapScale").toLowerCase() != "false";
        bShowMapTypeControl = mapDiv.getAttribute("MapTypeControl").toLowerCase() != "false";
        bShowZoom = mapDiv.getAttribute("MapZoomControl").toLowerCase() != "false";

        if (bShowScale)
            L.control.scale().addTo(map);

        if (!bShowZoom && map.zoomControl)
            map.removeControl(map.zoomControl);

        if (aMapTypes.length > 1 && bShowMapTypeControl)
            layerControl.addTo(map);

        map.infowindow = L.popup({
            className: LogiXML.rdLeaflet.POPUP_CSS
        });

        LogiXML.rdLeaflet.resizePopup(map.infowindow, mapDiv);

        LogiXML.rdLeaflet.addLeafletMarkers(mapDiv, map);
        LogiXML.rdLeaflet.addLeafletPolygons(mapDiv, map);
        LogiXML.rdLeaflet.addLeafletPolylines(mapDiv, map);
        LogiXML.rdLeaflet.addLeafletKml(mapDiv, map, function () {
            if (!map.useInitialLatLng) {
                var bounds = LogiXML.rdLeaflet.getBoundsFromLayers(map);

                if (bounds.hasLatLng()) {
                    if (map.useInitialZoom)
                        map.setView(bounds.toLeafletBounds().getCenter(), zoom);
                    else
                        map.fitBounds(bounds.toLeafletBounds(), { padding: [50, 50] });
                }
                else
                    map.setView(centerLatLng, zoom);
            }
            else
                map.setView(centerLatLng, zoom);

            var markersElement = Y.one("#" + mapId + "_rdmapmarkers");
            markersElement.reloadMarkers = LogiXML.rdLeaflet.reloadMarkers;

            var mapOptions = {
                zoom: zoom,
                center: centerLatLng,
                mapTypeId: aMapTypes[0],
                mapTypeControlOptions: { mapTypeIds: aMapTypes },
                zoomControlOptions: { },
                scaleControl: bShowScale,
                panControl: false,
                zoomControl: bShowZoom,
                mapTypeControl: bShowMapTypeControl,
                streetViewControl: false
            };

            var mapContainer = Y.one(mapDiv);
            mapContainer.setData("rdmapmarkers", markersElement);
            mapContainer.setData("rdGMap", map);

            mapContainer.fire('rdCreated', { map: map, id: mapId, mapOptions: mapOptions, container: mapContainer });

            Y.use("rdResize", function () {
                LogiXML.Resize.rdInitMapResizer(mapId, map);
            });

            LogiXML.rdLeaflet.reCluster(map);

            LogiXML.rdLeaflet.resizePopup(map.infowindow, mapDiv);
            map.finishedLoading = true;
        });
    },
    addLeafletMarkers: function (mapDiv, map) {
        var cnt = 0;
        var mapId = mapDiv.getAttribute('id');

        var aMapMarkerRows = document.getElementsByTagName(mapId + "_rdMapMarker");

        if (!aMapMarkerRows.length)
            return cnt;

        var bUseClustering = mapDiv.hasAttribute("UseClustering");
        var bounds = LogiXML.rdLeaflet.getBoundsFromLayers(map);
        var markers = [];
        var cluster;

        for (var i = 0; i < aMapMarkerRows.length; i++) {
            var eleMapMarkerRow = aMapMarkerRows[i];
            //Validate the marker.
            var lat, lng;
            if (eleMapMarkerRow.getAttribute(LogiXML.rdLeaflet.POLYGON_COLUMN_ID).length != 0) {
                //For KML files.
                lat = parseFloat(eleMapMarkerRow.getAttribute(LogiXML.rdLeaflet.POLYGON_COLUMN_ID).split(",")[1])
                lng = parseFloat(eleMapMarkerRow.getAttribute(LogiXML.rdLeaflet.POLYGON_COLUMN_ID).split(",")[0])
            } else {
                lat = parseFloat(eleMapMarkerRow.getAttribute("Latitude"))
                lng = parseFloat(eleMapMarkerRow.getAttribute("Longitude"))
            }

            if (isNaN(lat) || isNaN(lng))
                continue;

            if (lat == 0 && lng == 0)
                continue;

            cnt++;

            var options = new Object()  //GMarkerOptions object
            var point = new L.LatLng(lat, lng);

            //Marker image.
            var sMarkerId = eleMapMarkerRow.getAttribute("rdMarkerID");
            var sClusterId = eleMapMarkerRow.getAttribute("rdClusterID");
            var eleMarkerImage = document.getElementById("rdMapMarkerImage_" + mapId + "_" + sMarkerId); //"+"_Row" + (i + 1))
            var sMarkerLabel = eleMapMarkerRow.getAttribute("rdMarkerLabel");
            var sMarkerClass = eleMapMarkerRow.getAttribute("rdMarkerClass");

            var width, height, src;

            if (eleMarkerImage) {
                width = parseInt(eleMarkerImage.getAttribute("width"));
                height = parseInt(eleMarkerImage.getAttribute("height"));

                if (width == 0) { //IE
                    if (eleMarkerImage.currentStyle) {
                        width = parseInt(eleMarkerImage.currentStyle.width)
                        height = parseInt(eleMarkerImage.currentStyle.height)
                    }
                    else {//19546. If not IE/Opera, then do this
                        width = 1;
                        height = 1;
                    }
                }

                //Don't want this to appear in the Info bubble.
                eleMarkerImage.style.display = "none";

                src = eleMarkerImage.getAttribute("src");
                options.title = eleMarkerImage.title;

                eleMapMarkerRow.setAttribute("data-image-width", width);
                eleMapMarkerRow.setAttribute("data-image-height", height);
                eleMapMarkerRow.setAttribute("data-image-src", src);
                eleMapMarkerRow.setAttribute("data-image-tooltip", options.title);
            }
            else {
                width = eleMapMarkerRow.getAttribute("data-image-width");
                if (width)
                    width = Number(width);
                else
                    width = 1;

                height = eleMapMarkerRow.getAttribute("data-image-height");
                if (height)
                    height = Number(height);
                else
                    height = 1;

                src = eleMapMarkerRow.getAttribute("data-image-src");
                options.title = eleMapMarkerRow.getAttribute("data-image-tooltip");
            }

            if (sMarkerLabel) {
                var markerDiv = document.createElement("div");

                if (sMarkerClass)
                    markerDiv.setAttribute("class", sMarkerClass);

                markerDiv.setAttribute("id", sMarkerId + "_divIcon");

                if (src) {
                    var img = document.createElement("img");
                    img.setAttribute("src", src);
                    img.setAttribute("height", height);
                    img.setAttribute("width", width);
                    img.setAttribute("class", "leaflet-marker-icon leaflet-zoom-animated leaflet-clickable");
                    img.setAttribute("style", "margin-left:" + Math.round(width / 2) + "px; margin-top:-" + height + "px; width:" + width + "px; height:" + height + "px;");

                    markerDiv.appendChild(img);
                }

                var span = document.createElement("span");
                span.innerHTML = sMarkerLabel;

                markerDiv.appendChild(span);

                options.icon = new L.divIcon({
                    html: markerDiv.outerHTML,
                    iconSize: [width, height],
                    iconAnchor: [Math.round(width / 2), height]
                });
            }
            else if (src) {
                options.icon = new L.icon({
                    iconUrl: src,
                    iconSize: [width, height],
                    iconAnchor: [Math.round(width / 2), height]
                });
            }

            // this tooltip trumps the image tooltip if both are present
            var sTooltip = eleMapMarkerRow.getAttribute("Tooltip");
            if (sTooltip)
                options.title = sTooltip;

            var marker = new LogiXML.rdLeaflet.Marker(point, options);

            marker.mapId = mapId;
            marker.rdClusterId = sClusterId;

            var eleMarker = document.getElementById(sMarkerId);

            if (eleMarker && eleMarker.getAttribute("rdActionMapMarkerInfo") == "true") {
                eleMapMarkerRow.setAttribute("data-rdPopupContent", eleMarker.innerHTML);
                marker.rdPopupContent = eleMarker.innerHTML;
                eleMarker.innerHTML = "";
            }
            else
                marker.rdPopupContent = eleMapMarkerRow.getAttribute("data-rdPopupContent");

            LogiXML.rdLeaflet.createLeafletMarkerAction(map, marker, eleMarker);

            if (bUseClustering) {
                cluster = LogiXML.rdLeaflet.getClusterer(map, sClusterId);
                cluster.rdMarkers.push(marker);
            }
            else {
                marker.addTo(map);
            }

            LogiXML.rdLeaflet.reloader.push(marker);

            //Add the marker to the bounds, extending the bounds.
            bounds.addLatLng(lat, lng);
        }

        if (bUseClustering)
            LogiXML.rdLeaflet.reCluster(map);

        if (bounds.hasLatLng() && !map.useInitialLatLng)
            map.fitBounds(bounds.toLeafletBounds(), { padding: [50, 50] });

        return cnt;
    },
    addLeafletPolygons: function (mapDiv, map) {
        var cnt = 0;
        var mapId = mapDiv.getAttribute('id');

        var aMapPolygonRows = document.getElementsByTagName(mapId + "_rdMapPolygon");
        if (!aMapPolygonRows.length)
            return cnt;
        
        var bounds = LogiXML.rdLeaflet.getBoundsFromLayers(map);

        var lastOptions = null;

        for (var i = 0; i < aMapPolygonRows.length; i++) {
            var eleMapPolygonRow = aMapPolygonRows[i]
            var encodedPoints = eleMapPolygonRow.getAttribute("rdEncodedPoints");

            if (encodedPoints.length > 0) {
                cnt++;

                var options = {
                    stroke: true,
                    color: eleMapPolygonRow.getAttribute("rdBorderColor"),
                    opacity: eleMapPolygonRow.getAttribute("rdBorderOpacity"),
                    weight: parseInt(eleMapPolygonRow.getAttribute("rdBorderThickness")),
                    fillColor: eleMapPolygonRow.getAttribute("rdFillColor"),
                    fillOpacity: eleMapPolygonRow.getAttribute("rdFillOpacity")
                };

                if (lastOptions === null
                || options.color != lastOptions.color
                || options.opacity != lastOptions.opacity
                || options.weight != lastOptions.weight
                || options.fillColor != lastOptions.fillColor
                || options.fillOpacity != lastOptions.fillOpacity) {
                    // options changed - this is a different grouping of polygons
                    // reset wrap tracker
                    L.PolylineUtil.decodeLastLng = null;
                }

                lastOptions = options;

                var multi = encodedPoints.split("RDMULTIPOLY");
                var elePolygon = document.getElementById(eleMapPolygonRow.getAttribute("rdPolygonID"));
                var polyContent;

                if (elePolygon && elePolygon.getAttribute("rdActionMapMarkerInfo") == "true") {
                    eleMapPolygonRow.setAttribute("data-rdPopupContent", elePolygon.innerHTML);
                    polyContent = elePolygon.innerHTML;
                    elePolygon.innerHTML = "";
                }
                else
                    polyContent = eleMapPolygonRow.getAttribute("data-rdPopupContent");

                var latlngs = [];

                for (var j = 0; j < multi.length; j++) {
                    var encPts = multi[j];

                    if (encPts) {
                        var polyline = L.Polyline.fromEncoded(encPts, options);
                        latlngs.push(polyline.getLatLngs());
                    }
                }

                var polygon = new L.polygon(latlngs, options);
                polygon.addTo(map);

                polygon.rdPopupContent = polyContent;

                LogiXML.rdLeaflet.createLeafletMarkerAction(map, polygon, elePolygon);

                polygon.mapId = mapId;
                polygon.setMap = LogiXML.rdLeaflet.setMap.bind(polygon);

                LogiXML.rdLeaflet.reloader.push(polygon);

                bounds.addLatLng(Number(eleMapPolygonRow.getAttribute("rdMinLat")), Number(eleMapPolygonRow.getAttribute("rdMinLon")));
                bounds.addLatLng(Number(eleMapPolygonRow.getAttribute("rdMaxLat")), Number(eleMapPolygonRow.getAttribute("rdMaxLon")));
            }
        }

        if (bounds.hasLatLng() && !map.useInitialLatLng)
            map.fitBounds(bounds.toLeafletBounds(), { padding: [50, 50] });

        return cnt;
    },
    addLeafletPolylines: function (mapDiv, map) {
        var cnt = 0;
        var mapId = mapDiv.getAttribute("id");

        var aMapPolylineRows = document.getElementsByTagName(mapId + "_rdMapPolyline");

        if (!aMapPolylineRows.length)
            return cnt;

        var bounds = LogiXML.rdLeaflet.getBoundsFromLayers(map);

        var lastOptions = null;

        for (var i = 0; i < aMapPolylineRows.length; i++) {
            var eleMapPolylineRow = aMapPolylineRows[i];
            var encodedPoints = eleMapPolylineRow.getAttribute("rdEncodedPoints");
            if (encodedPoints) {
                cnt++;

                var options = {
                    stroke: true,
                    color: eleMapPolylineRow.getAttribute("rdBorderColor"),
                    opacity: eleMapPolylineRow.getAttribute("rdBorderOpacity"),
                    weight: parseInt(eleMapPolylineRow.getAttribute("rdBorderThickness"))
                };

                if (lastOptions === null
                || options.color != lastOptions.color
                || options.opacity != lastOptions.opacity
                || options.weight != lastOptions.weight) {
                    // options changed - this is a different grouping of polylines
                    // reset wrap tracker
                    L.PolylineUtil.decodeLastLng = null;
                }

                lastOptions = options;

                var multi = encodedPoints.split("RDMULTIPOLY");
                var elePolyline = document.getElementById(eleMapPolylineRow.getAttribute("rdPolylineID"));
                var polyContent;

                if (elePolyline && elePolyline.getAttribute("rdActionMapMarkerInfo") == "true") {
                    eleMapPolylineRow.setAttribute("data-rdPopupContent", elePolyline.innerHTML);
                    polyContent = elePolyline.innerHTML;
                    elePolyline.innerHTML = "";
                }
                else
                    polyContent = eleMapPolylineRow.getAttribute("data-rdPopupContent");

                var latlngs = [];
                var polyLine;

                for (var j = 0; j < multi.length; j++) {
                    var encPts = multi[j];

                    if (encPts) {
                        polyLine = L.Polyline.fromEncoded(encPts, options);
                        latlngs.push(polyLine.getLatLngs());
                    }
                }

                polyLine = new L.polyline(latlngs, options);
                polyLine.addTo(map, options);

                polyLine.rdPopupContent = polyContent;

                LogiXML.rdLeaflet.createLeafletMarkerAction(map, polyLine, elePolyline)

                polyLine.mapId = mapId;
                polyLine.setMap = LogiXML.rdLeaflet.setMap.bind(polyLine);

                LogiXML.rdLeaflet.reloader.push(polyLine);

                //Add the line's extents to the bounds, extending the bounds.
                bounds.addLatLng(Number(eleMapPolylineRow.getAttribute("rdMinLat")), Number(eleMapPolylineRow.getAttribute("rdMinLon")));
                bounds.addLatLng(Number(eleMapPolylineRow.getAttribute("rdMaxLat")), Number(eleMapPolylineRow.getAttribute("rdMaxLon")));
            }
        }

        if (bounds.hasLatLng() && !map.useInitialLatLng)
            map.fitBounds(bounds.toLeafletBounds(), { padding: [50, 50] });

        return cnt;
    },
    addLeafletKml: function (mapDiv, map, callback) {
        var cnt = 0;
        var mapId = mapDiv.getAttribute('id');

        var aRows = document.getElementsByTagName(mapId + "_rdKml");

        var cb = callback;

        if (!aRows.length) {
            if (cb)
                return cb();

            return;
        }

        var bounds = LogiXML.rdLeaflet.getBoundsFromLayers(map);

        for (var i = 0; i < aRows.length; i++) {
            var eleRow = aRows[i];
            var kmlUrl = eleRow.getAttribute("rdKmlUrl");
            var kml = eleRow.getAttribute("rdKml");

            if (!kml)
                continue;

            try {
                kml = LogiXML.xmlStringToDoc(kml);
            }
            catch (err) {
                console.error("Failed to load kml url: [" + kmlUrl + "] kml: [" + kml + "] " + err);
                continue;
            }

            // add kml code
            var layer = new L.KML();

            layer.mapId = mapId;
            layer.setMap = LogiXML.rdLeaflet.setMap.bind(layer);

            LogiXML.rdLeaflet.reloader.push(layer);

            layer.addTo(map);

            layer._addKML(kml);
        }

        if (cb)
            return cb();
    },
    createLeafletMarkerAction: function (map, marker, ele) {
        if (!marker)
            return;

        if (marker.rdPopupContent) {
            //A bubble-style Info window.
            var onclick = function (e) {
                // REPDEV-21895 make the popup show above marker icon, such that both are visible, as opposed to hiding/replacing the marker icon.
                if (e.target && e.target._icon && e.target._icon.height) {
                    map.infowindow.options.offset[1] = 7 - e.target._icon.height;
                }

                //This is for IFRAMES (SubReports) that may be in the info panel.
                map.infowindow.setLatLng(e.latlng);
                map.infowindow.setContent(marker.rdPopupContent);
                map.infowindow.activeMarker = marker;
                map.activePopup = map.infowindow;
                map.infowindow.openOn(map);

                var contentChanged = false;

                var cFrames = map.infowindow._contentNode.getElementsByTagName("IFRAME");
                for (var i = 0; i < cFrames.length; i++) {
                    var cFrame = cFrames[i];
                    var sSrc = Y.one(cFrame).getData("hiddensource");

                    if (sSrc) {   //There is no HiddenSource if the element was initially visible.
                        var attrSrc = cFrame.getAttribute("src");

                        if (!attrSrc || attrSrc.indexOf(sSrc) == -1) {
                            cFrame.setAttribute("src", sSrc + "&rdRnd=" + Math.floor(Math.random() * 100000));
                            contentChanged = true;
                        }
                    }
                }

                cFrames = map.infowindow._contentNode.getElementsByTagName("RDIFRAME");
                var pendingIFrames = cFrames.length;
                for (var i = 0; i < pendingIFrames; i++) {
                    rdConvertRdIFrame(cFrames[i]);
                    contentChanged = true;
                }

                if (contentChanged)
                    map.infowindow.setContent(map.infowindow._contentNode.innerHTML);

                map.infowindow.update();

                var cFrames = map.infowindow._contentNode.getElementsByTagName("IFRAME");
                var pendingFrames = 0;

                var afterIFramesLoad = function () {
                    pendingFrames--;

                    if (pendingFrames == 0)
                        setTimeout(function () { Y.LogiXML.ChartCanvas.createElements(); }, 10);
                }

                for (var i = 0; i < cFrames.length; i++) {
                    var cFrame = cFrames[i];
                    var attrSrc = cFrame.getAttribute("src");
                    var sSrc = Y.one(cFrame).getData("hiddensource");

                    if (!attrSrc && sSrc) { //There is no HiddenSource if the element was initially visible.
                        pendingFrames++;
                        cFrame.addEventListener("load", afterIFramesLoad);
                        rdPostToIFrame(cFrame, sSrc);
                    }
                }

                if (!pendingFrames)
                    setTimeout(function () { Y.LogiXML.ChartCanvas.createElements(); }, 10);
            };

            marker.on("click", onclick);
        }
        else if (ele)
            marker.on("click", function () {
                if (ele.click && ele.onclick)
                    return ele.click();

                for (var i = 0; i < ele.childNodes.length; i++) {
                    var node = ele.childNodes[i];

                    if (node.click && node.onclick)
                        return node.click();
                }
            });
    },
    cleanAllClusterers: function (mapId) {
        var userCluster;
        for (var i = LogiXML.rdLeaflet.userClusterers.length - 1; i >= 0; i--) {
            userCluster = LogiXML.rdLeaflet.userClusterers[i];

            if (userCluster.getMap()._container.getAttribute("id") != mapId)
                continue;

            userCluster.clearMarkers();

            LogiXML.rdLeaflet.userClusterers.splice(i, 1);
        }
    },
    clearAllMarkers: function (mapId) {
        LogiXML.rdLeaflet.setMapOnAll(mapId, null);
        LogiXML.rdLeaflet.cleanAllClusterers(mapId);
    },
    reCluster: function (map) {
        var mapId = map._container.id;

        for (var i = LogiXML.rdLeaflet.userClusterers.length - 1; i >= 0; i--) {
            var userCluster = LogiXML.rdLeaflet.userClusterers[i];

            if (userCluster.getMap()._container.getAttribute("id") != mapId)
                continue;

            userCluster.cluster();
        }
    },
    resizePopup: function (popup, mapDiv) {
        if (!popup || !popup.options || !mapDiv)
            return;

        popup.options.maxWidth = mapDiv.offsetWidth - 70;
        popup.options.maxHeight = mapDiv.offsetHeight - 70;

        popup.update();

        var layerControls = mapDiv.getElementsByClassName("leaflet-control-layers");
        var attrs = mapDiv.getElementsByClassName("leaflet-control-attribution");

        var maxHeight;

        if (attrs && attrs.length)
            maxHeight = (mapDiv.offsetHeight - attrs[0].offsetHeight - 35) + "px";
        else
            maxHeight = (mapDiv.offsetHeight - 35) + "px";

        for (var i = 0; i < layerControls.length; i++) {
            layerControls[i].style.maxHeight = maxHeight;
        }

    },
    reloadMarkers: function (newMarkers, sOriginResponse) {
        var mapId = newMarkers.get("id");
        var mapContainer = Y.one("#" + mapId);
        var map = mapContainer.getData("rdGMap");

        if (!sOriginResponse) {
            if (mapContainer.hasAttribute("UseClustering"))
                LogiXML.rdLeaflet.reCluster(map);

            return;
        }

        LogiXML.rdLeaflet.clearAllMarkers(mapId);

        var yDoc = Y.Node.create(sOriginResponse);

        if (yDoc && yDoc._node) {
            var updatedMarkers = yDoc.one("#" + mapId + "_rdmapmarkers");

            if (updatedMarkers) {
                var newMarkerList = updatedMarkers.get("children");
                var oldMarkers = Y.one("#" + mapId + "_rdmapmarkers");

                // clear old popup content spans to make room for the new ones
                oldMarkers.get("children").each(function (node, i, list) {
                    var rdMarkerId = node.getAttribute("rdmarkerid");

                    if (!rdMarkerId)
                        return;

                    var popupContentSpan = document.getElementById(rdMarkerId);

                    if (!popupContentSpan)
                        return;

                    popupContentSpan.parentNode.removeChild(popupContentSpan);
                });

                oldMarkers.insert(updatedMarkers, "replace");

                newMarkerList.each(function (node, i, list) {
                    var rdMarkerId = node.getAttribute("rdmarkerid");

                    if (!rdMarkerId)
                        return;

                    var newMarker = yDoc.one("#" + rdMarkerId);

                    if (!newMarker || !newMarker._node)
                        return;

                    oldMarkers._node.appendChild(LogiXML.createElement(newMarker._node.outerHTML));
                });
            }
        }

        // don't auto-zoom on refresh
        map.useInitialZoom = true;
        map.useInitialLatLng = true;

        LogiXML.rdLeaflet.addLeafletMarkers(mapContainer._node, map);
        LogiXML.rdLeaflet.addLeafletPolygons(mapContainer._node, map);
        LogiXML.rdLeaflet.addLeafletPolylines(mapContainer._node, map);
        LogiXML.rdLeaflet.addLeafletKml(mapContainer._node, map);
    },
    setMap: function (map) {
        if (map) {

            if (typeof rdClusterIcon != "undefined" && this instanceof rdClusterIcon) {
                this._removeIcon = function () {
                    this._icon = this.div_;
                    LogiXML.rdLeaflet.Marker.prototype._removeIcon.apply(this, arguments);
                };
            }

            this.addTo(map);
            this._map = map;
            return;
        }

        // map is null, remove this marker from the map
        map = this._map;

        if (map) {
            // close popup if removing the marker with the active popup
            if (map.activePopup && map.activePopup.activeMarker && map.activePopup.activeMarker === this) {
                map.activePopup.activeMarker = null;
                map.activePopup = null;
                map.closePopup();
            }

            if (this.div_ || this._icon)
                map.removeLayer(this);
        }

        this._map = null;

        if (typeof this.clustered !== "undefined")
            this.clustered = false;
    },
    setMapOnAll: function (mapId, map) {
        var marker;
        for (var i = LogiXML.rdLeaflet.reloader.length - 1; i >= 0; i--) {
            marker = LogiXML.rdLeaflet.reloader[i];

            if (marker.mapId != mapId)
                continue;

            if (marker.setMap)
                marker.setMap(map);

            if (!map)
                LogiXML.rdLeaflet.reloader.splice(i, 1);
        }
    },
    markerOnAdd: function (map) {
        this._map = map;

        if (typeof rdClusterIcon !== "undefined" && this instanceof rdClusterIcon)
            return rdClusterIcon.prototype.onAdd.apply(this, arguments);

        if (typeof rdMarkerClusterer !== "undefined" && this instanceof rdMarkerClusterer)
            return rdMarkerClusterer.prototype.onAdd.apply(this, arguments);

        if (this instanceof L.Marker) {
            if (!this.options)
                this.options = {};

            if (!this.options.icon) {
                if (typeof this.clustered == "undefined")
                    this.clustered = true;

                while (!this.markerDivId || document.getElementById(this.markerDivId)) {
                    this.markerDivId = "rdClusterIcon_" + Math.floor(Math.random() * 100000)
                }

                var width = 53;
                var height = 53;

                var divIcon = document.createElement("div");
                divIcon.setAttribute("id", this.markerDivId);
                divIcon.setAttribute("style", "background-image: url(&quot;rdTemplate/rdGoogleMap/images/m1.png&quot;); background-size: " + width + "px " + height + "px; background-position: 0px 0px; height: " + height + "px; line-height: " + height + "px; width: " + width + "px; text-align: center; cursor: pointer; color: black; font-size: 11px; font-family: Arial, sans-serif; font-weight: bold; font-style: normal; text-decoration: none;");
                divIcon.innerHTML = layer.cluster_.markers.length;

                this.options.icon = new L.divIcon({
                    html: divIcon.outerHTML,
                    iconSize: [width, height],
                    iconAnchor: [Math.round(width / 2), height]
                });
            }

            return L.Marker.prototype.onAdd.apply(this, arguments);
        }
    },
    _loaded: false,
    _refreshing: null,
    onRefresh: function () {
        // more than one element could have been refreshed
        // but we only need to run this once for all of them
        if (LogiXML.rdLeaflet._refreshing)
            clearTimeout(LogiXML.rdLeaflet._refreshing);
        
        LogiXML._refreshing = setTimeout(LogiXML.rdLeaflet.onDomContentLoaded, 10);
    },
    onDomContentLoaded: function () {
        if (LogiXML.rdLeaflet._refreshing) {
            clearTimeout(LogiXML.rdLeaflet._refreshing);
            LogiXML.rdLeaflet._refreshing = null;
        }

        var maps = document.getElementsByClassName("rdLeafletMap");
        var reload = false;

        if (LogiXML.rdLeaflet._loaded) {
            // maybe we need to reload
            var reload = [];
            for (var i = 0; i < maps.length; i++) {
                var map = maps[i];
                if (map.getAttribute("rdLeafletInit") != "True")
                    reload.push(map);
            }
            maps = reload;
            reload = true;
        } else {
            LogiXML.rdLeaflet._loaded = true;

            LogiXML.addStylesheet("rdTemplate/rdGeo/leaflet/leaflet.css");
            LogiXML.addStylesheet("rdTemplate/rdGeo/rdLeaflet.css");
        }

        if (maps.length == 0)
            return;

        var neededScripts = [
            "rdTemplate/rdGeo/leaflet/leaflet.js?v=" + LogiXML.version,
            "rdTemplate/rdGeo/leaflet/KML.js?v=" + LogiXML.version
        ];

        for (var i = 0; i < maps.length; i++) {
            if (maps[i].hasAttribute("UseClustering")) {
                neededScripts.push("rdTemplate/rdGeo/rdMapClusterer.js");
                break;
            }
        }

        var onScriptsLoaded = function () {
            LogiXML.rdLeaflet.Marker = L.Marker.extend({
                getDraggable: function () { return false; },
                onAdd: LogiXML.rdLeaflet.markerOnAdd,
                setMap: LogiXML.rdLeaflet.setMap,
                getMap: function () { return this._map; },
                getPosition: function () { return this.getLatLng(); },
                getPanes: function () {
                    return {
                        overlayMouseTarget: this.cluster_.getMap()._panes.markerPane
                    };
                },
                getProjection: LogiXML.rdLeaflet.getProjection
            });

            LogiXML.rdLeaflet.addPolylineUtil();

            var maps = document.getElementsByClassName("rdLeafletMap");

            for (var i = 0; i < maps.length; i++) {
                LogiXML.rdLeaflet.createMap(maps[i]);
            }
        };

        if (!LogiXML.addScript(neededScripts, onScriptsLoaded))
            onScriptsLoaded();
    }
};

if (LogiXML && LogiXML.DOMContentLoaded)
    LogiXML.rdLeaflet.onDomContentLoaded();
else
    document.addEventListener("DOMContentLoaded", LogiXML.rdLeaflet.onDomContentLoaded);
