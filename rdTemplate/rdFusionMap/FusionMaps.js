/*jslint white: true, browser: true, windows: true, forin: true,  undef: true,
  eqeqeq: true, plusplus: true, bitwise: true, regexp: true, immed: true */

/**!
 * @license FusionCharts JavaScript Library
 * Copyright FusionCharts Technologies LLP
 * License Information at <http://www.fusioncharts.com/license>
 *
 * @author FusionCharts Technologies LLP
 * @version fusioncharts/3.3.0-release.18739
 *
 * @attributions (infers respective third-party copyrights)
 * Highcharts JS v2.1.9 (modified) <http://www.highcharts.com/license>
 * SWFObject v2.2 (modified) <http://code.google.com/p/swfobject/>
 * JSON v2 <http://www.JSON.org/js.html>
 * jQuery 1.7.1 <http://jquery.com/>
 * Firebug Lite 1.3.0 <http://getfirebug.com/firebuglite>
 *
 * @note
 * FusionMaps boot proxy class that allows seamless migration to FusionMaps XT
 * from pre-XT releases without requiring change in deployment codebase.
 */

(function () {

    var LEGACY_FUSIONMAPS_FILENAMES = [
            'fusionmaps\\.js',
            'fusionmaps\\.debug\\.js'
        ],
        DISALLOW_CROSSDOMAIN_RESOURCE = true,
        SCRIPT_LOAD_TIMEOUTMS = 15000,
        ASSUME_FUSIONCHARTS_EXISTS = false,
        FUSIONCHARTS_FILE_NAME = 'FusionCharts.js',
        FUSIONCHARTS_FILE_LOCATION = '',
        FUSIONCHARTS_FILE_LOCATION_ROOT = false, // relative to page root
        FUSIONCHARTS_FILE_LOCATION_REL = true, // relative to map?
        FUSIONCHARTS_FILE_LOCATION_RELPATH = '', // relation with map

        defaultConstructionParams = {};


    var win = window,
        doc = document,
        SCRIPT_NAME_REGEX = new RegExp("(^|[\\/\\\\])(" +
            LEGACY_FUSIONMAPS_FILENAMES.join('|') + ")([\\?#].*)?$", "ig"),
        checkBadChars = /[\\\"<>;&]/,
        hasProtocolDef = /^[^\S]*?(sf|f|ht)(tp|tps):\/\//i,
        querystring = (function () {
            var querystring = {};
            window.location.search.replace(new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
                function( $0, $1, $2, $3 ){
                    querystring[$1.toLowerCase()] = $3;
                });
            return querystring;

        }()),
        debug = querystring['_fusioncharts_geoproxy_debug'] === 'en' ? function (msg) {
            win.console && win.console.log && win.console.log(msg);
        } : function () { },
        cleanObject,
        GeoProxy, // class
        onPageLoad,
        mergePath,
        getScriptPath,
        isXSSSafe,
        loadScript,
        loadingMessage;

    // Check if geo-core already exists during this script load. If it does,
    // check whether legacy-proxy has already been loaded. If loaded then no
    // need to proceed and re-run this script. Otherwise, if an older version of
    // geo-core is found we need to (a) replace that and (b) ensure that any map
    // call made during this time is controlled. Option b may not be easy to
    // trap.
    if (win.FusionMaps && win.FusionMaps.legacy) {
        debug('legacy geo-core exists. exiting.');
        return;
    }

    cleanObject = function (obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                delete obj[prop];
            }
        }
    };

    mergePath = function (paths) {
        var i = arguments.length,
            arg,
            build = '';

        if (i === 1) {
            build = arguments[0];
            return build;
        }

        while(i--) {
            arg = arguments[i];
            if (arg) {
                build = arg.replace(/\/+\s*?$/, '') + '/' +
                    build.replace(/^\s*?\/+/, '');
            }
        }

        return build;
    };

    onPageLoad = function (callback) {

        if (!(/loaded|complete/.test(doc.readyState) || doc.loaded)) {
            (function () {

                function init() {
                    // quit if this function has already been called
                    if (arguments.callee.done) return;

                    // flag this function so we don't do the same thing twice
                    arguments.callee.done = true;

                    // kill the timer
                    if (_timer) clearInterval(_timer);

                    setTimeout(function () {
                        callback(); // delay
                    }, 1);
                };

                if (doc.addEventListener) {
                    doc.addEventListener("DOMContentLoaded", init, false);
                }
                else if (doc.attachEvent) {
                    win.attachEvent("onLoad", init);
                }

                if (/msie/i.test(navigator.userAgent) && !win.opera) {
                  try {
                      doc.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
                      var script = doc.getElementById("__ie_onload");
                      script.onreadystatechange = function() {
                            if (this.readyState == "complete") {
                                init(); // call the onload handler
                            }
                      };
                  } catch (e) {}
                }

                if (/WebKit/i.test(navigator.userAgent)) { // sniff
                    var _timer = setInterval(function() {
                        if (/loaded|complete/.test(doc.readyState)) {
                            init(); // call the onload handler
                        }
                    }, 10);
                }

                win.onload = function (callback) {
                    return function () {
                        init();
                        callback && callback.call && callback.call(win);
                    };
                }(win.onload);
            }());
        }
    };

    isXSSSafe = function (str, proto) {
        if (proto && hasProtocolDef.exec(str) !== null) {
            return false;
        }
        return (checkBadChars.exec(str) === null);
    };

    getScriptPath = function (scriptNameRegex) {
        // Get a collection of all script nodes.
        var scripts = doc.getElementsByTagName('script'),
        l = scripts.length,
        src,
        i;

        // Iterate through the script node collection and match whether its
        // 'src' attribute contains fusioncharts file name.
        for (i = 0; i < l; i += 1) {
            src = scripts[i].getAttribute('src');
            if (!(src === undefined || src === null ||
                src.match(scriptNameRegex) === null)) {
                return src.replace(scriptNameRegex, '$1');
            }
        }
        return undefined;
    };

    loadScript = (function () {
        var scriptLoadFailureTimeout = {},
            scriptsRequested = {},
            scriptsLoaded = {},
            scriptTags = {};

        return function (path, file, success, failure, includeOnce) {

            // If file is not specified, we exit
            if (!file) {
                return false;
            }

            var script,
                src,
                eventArgs = {
                    type: 'script',
                    success: false
                },
                notify = function () {
                    // clear stalled 404 check
                    scriptLoadFailureTimeout[src] =
                            clearTimeout(scriptLoadFailureTimeout[src]);

                    // execute callbacks
                    eventArgs.success ? (success && success(file, src)) :
                            (failure && failure(file, src));
                };

            // Prepare the full src
            src = path + file;

            // we do not allow XSS unsafe string
            if (!isXSSSafe(src, DISALLOW_CROSSDOMAIN_RESOURCE)) {
                src = typeof win.encodeURIComponent === 'function' ?
                    win.encodeURIComponent(src) : win.escape(src);
            }

            // Update event arguments
            eventArgs.path = path;
            eventArgs.src = src;
            eventArgs.file = file;

            // Do not reload the script once loaded.
            if (scriptsLoaded[src] === true && includeOnce) {
                eventArgs.success = true;
                eventArgs.notReloaded = true;
                if (success) {
                    success();
                }
                return true;
            }

            // Check whether this script has been already loaded once and whether
            // multiple inclusion is prevented.
            if (scriptsRequested[src] && includeOnce) {
                return false;
            }
            // Add the src to the lists of scripts loaded.
            scriptsRequested[src] = true;

            // If a script tag with same src exists, then we need to delete the
            // previous one
            if (scriptTags[src] && scriptTags[src].parentNode) {
                scriptTags[src].parentNode.removeChild(scriptTags[src]);
            }

            // Create the script element with its attributes.
            script = scriptTags[src] = doc.createElement('script')
            // Set the script type to javaScript
            script.type = 'text/javascript';
            // Set the prepared src as the script's src.
            script.src = src;

            // Execute callback function when the script was loaded.
            if (success) {
                scriptsLoaded[src] = false;
                scriptLoadFailureTimeout[src] =
                        clearTimeout(scriptLoadFailureTimeout[src]);

                script.onload = function () {
                    scriptsLoaded[src] = true;
                    eventArgs.success = true;
                    notify();
                };

                script.onerror = function () {
                    scriptsLoaded[src] = false;
                    scriptsRequested[src] = false; // in case of error cancel request
                    notify();
                };

                script.onreadystatechange = function () {
                    if (this.readyState === 'complete' || this.readyState === 'loaded') {
                        scriptsLoaded[src] = true;
                        eventArgs.success = true;
                        notify();
                    }
                };
            }

            // Append the script to the head of this page.
            doc.getElementsByTagName('head')[0].appendChild(script);

            // Prepare the timeout check for script load failure
            if (failure) {
                scriptLoadFailureTimeout[src]= setTimeout(function () {
                    if (scriptsLoaded[src]) {
                        return;
                    }
                    notify();
                }, SCRIPT_LOAD_TIMEOUTMS);
            }

            return true;
        };
    }());

    GeoProxy = win.FusionMaps = function (swf, id, w, h, debugMode,
            registerWithJS, c, scaleMode, lang, detectFlashVersion,
            autoInstallRedirect) {

        if (!document.getElementById) {
            return;
        }

        // Create container objects
        this.params = {};
        this.variables = {};
        this.attributes = {};

        //Set attributes for the SWF
        swf && this.setAttribute('swf', swf);
        id && this.setAttribute('id', id);
        c && this.addParam('bgcolor', c);

        this.setAttribute('width', w);
        this.setAttribute('height', h);


        debugMode = debugMode ? debugMode : 0;
        this.addVariable('debugMode', debugMode);

        scaleMode = scaleMode ? scaleMode : 'noScale';
        this.addVariable('scaleMode', scaleMode);

        this.autoInstallRedirect = autoInstallRedirect ? autoInstallRedirect : 1;

        this.addVariable('DOMId', id);
        GeoProxy.items[id] = this;
        debug('captured object id: ' + id);
    };

    /**
     * Collection of FusionMaps instances.
     * @type Object
     */
    GeoProxy.items = {};

    GeoProxy.prototype.setAttribute = function (name, value) {
        this.attributes[name] = value;
    };

    GeoProxy.prototype.getAttribute = function (name) {
        return this.attributes[name];
    };

    GeoProxy.prototype.addParam = function (name, value) {
        this.params[name] = value;
    };

    GeoProxy.prototype.getParams = function() {
        return this.params;
    };

    GeoProxy.prototype.addVariable = function (name, value) {
        this.variables[name] = value;
    };

    GeoProxy.prototype.getVariable = function (name) {
        return this.variables[name];
    };

    GeoProxy.prototype.getVariables = function () {
        return this.variables;
    };

    GeoProxy.prototype.getVariablePairs = function () {
        var variablePairs = [],
            variables = this.getVariables(),
            key;

        for (key in variables) {
            variablePairs.push(key + "=" + variables[key]);
        }

        return variablePairs;
    };

    GeoProxy.prototype.getSWFHTML = function () {
        var swfNode = "",
            params = this.getParams(),
            pairs= this.getVariablePairs().join("&"),
            key;
        if (navigator.plugins && navigator.mimeTypes &&
                    navigator.mimeTypes.length) {
            // netscape plugin architecture
            swfNode = '<embed type="application/x-shockwave-flash" src="' +
                    this.getAttribute('swf') + '" width="' +
                    this.getAttribute('width') + '" height="' +
                    this.getAttribute('height') + '"  ';

            swfNode += ' id="' + this.getAttribute('id') + '" name="' +
                this.getAttribute('id') + '" ';

            for (key in params) {
                swfNode += [key] + '="' + params[key] + '" ';
            }

            if (pairs.length > 0) {
                swfNode += 'flashvars="' + pairs + '"';
            }

            swfNode += '/>';
        }
        else { // PC IE
            swfNode = '<object id="' + this.getAttribute('id') +
                    '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' +
                    this.getAttribute('width') + '" height="' +
                    this.getAttribute('height') + '">';

            swfNode += '<param name="movie" value="' +
                this.getAttribute('swf') + '" />';

            for(var key in params) {
                swfNode += '<param name="' + key + '" value="' +
                        params[key] + '" />';
            }

            if (pairs.length > 0) {
                swfNode += '<param name="flashvars" value="' + pairs + '" />';
            }
            swfNode += "</object>";
        }

        return swfNode;
    };

    GeoProxy.prototype.setDataURL = function (strDataURL) {
        this.dataFormat = 'XMLURL';
        this.dataSource = strDataURL;
        this.addVariable('dataURL', strDataURL);
    };

    GeoProxy.prototype.encodeDataXML = function (strDataXML) {

        var arrDQAtt = strDataXML.match(/=\s*\".*?\"/g),
            repStr,
            repStrr,
            strTo,
            strStart,
            strEnd,
            i;

        if (arrDQAtt){
            for (i = 0; i < arrDQAtt.length; i++){
                repStr = arrDQAtt[i].replace(/^=\s*\"|\"$/g,"");
                repStr = repStr.replace(/\'/g,"%26apos;");
                strTo = strDataXML.indexOf(arrDQAtt[i]);
                repStrr = "='" + repStr + "'";
                strStart = strDataXML.substring(0,strTo);
                strEnd = strDataXML.substring(strTo+arrDQAtt[i].length);
                strDataXML = strStart + repStrr + strEnd;
            }
        }

        return strDataXML.replace(/\"/g,"%26quot;")
                .replace(/%(?![\da-f]{2}|[\da-f]{4})/ig,"%25")
                .replace(/\&/g,"%26");
    };

    GeoProxy.prototype.setDataXML = function (strDataXML) {
        this.dataFormat = 'XML';
        this.dataSource = strDataXML;
        this.addVariable('dataXML', this.encodeDataXML(strDataXML));
    };

    GeoProxy.prototype.setTransparent = function (isTransparent) {
        if (isTransparent === undefined) {
            isTransparent = true;
        }

        this.transparencySet = true;
        this.transparency = isTransparent;
        this.addParam('WMode', isTransparent ? 'transparent' : 'opaque');
    };

    GeoProxy.prototype.render = function (location) {
        this.renderedAt = location;
    };

    GeoProxy.prototype.exportItem = function (core) {
        var params = this.params,
            vars = this.variables,
            attrs = this.attributes,
            args = {
                id: attrs.id,
                swfUrl: attrs.swf,
                width: attrs.width,
                height: attrs.height,
                debugMode: vars.debugMode,
                scaleMode: vars.scaleMode,
                autoInstallRedirect: this.autoInstallRedirect
            },
            chart,
            key;

        if (this.dataFormat) {
            args.dataFormat = this.dataFormat;
            args.dataSource = this.dataSource;
        }

        if (params.bgcolor) {
            args.backgroundColor = params.bgcolor;
        }
        if (params.WMode) {
                args.wMode = params.WMode;
        }

        for (key in defaultConstructionParams) {
            args[key] = defaultConstructionParams[key];
        }
        chart = new core(args);

        debug ('migrated item with id: \"' + chart.id + '\"');

        if (this.renderedAt) {
            chart.render(this.renderedAt);
        }
    }

    GeoProxy.exportAllItems = function (core) {
        for (var item in GeoProxy.items) {
            GeoProxy.items[item].exportItem(core);
        }
    };
    /**
     * The module version identifier of the legacy proxy class.
     * [major, minor, revision, identifier, build]
     * @type Array
     */
    GeoProxy.version = [1, 0, 0, 'release'];


    // Store the legacy module within the proxy class.
    GeoProxy.legacy = function () {
        var g = this,
            core = g.core;
        debug('legacy-module actions triggered.');

        GeoProxy.legacyInEffect = true;
        if (GeoProxy.exportTriggered === true) {
            debug('legacy-module trigger exited.');
            return;
        }

        GeoProxy.exportTriggered = setTimeout(function () {
            GeoProxy.exportAllItems(win.FusionCharts);
            cleanObject(GeoProxy.items);
        }, 1);
    };

    win.getMapFromId = function (id) {
        return GeoProxy.items[id];
    };

    // On effective load of page, we need to load FusionCharts main library in
    // case it is not yet loaded.
    onPageLoad(function () {
        debug('page-load actions triggered.');

        // If the fusioncharts legacy module has been executed or in case
        // the main fusioncharts library script exists, then we do not need to
        // do anything.
        if (win.FusionCharts && win.FusionCharts.version ||
                GeoProxy.legacyInEffect || ASSUME_FUSIONCHARTS_EXISTS) {
            debug('primary core exists. exiting.')
            return;
        }

        // need to load it from the location where fusionmaps exists.
        var path = '';

        // If location is set then use it and forget everuthing else.
        if (FUSIONCHARTS_FILE_LOCATION) {
            path = FUSIONCHARTS_FILE_LOCATION;
        }

        // Check if marked relative to map path
        else if (FUSIONCHARTS_FILE_LOCATION_REL) {
            path = mergePath(getScriptPath(SCRIPT_NAME_REGEX),
                FUSIONCHARTS_FILE_LOCATION_RELPATH, path);
        }

        // Add root to the path
        if (FUSIONCHARTS_FILE_LOCATION_ROOT) {
            path = '/' + path;
            // precaution to prevent double rooting.
            path = path.replace(/^\/{2}/, '/');
        }

        loadingMessage = 'loading \"' + FUSIONCHARTS_FILE_NAME + '\" from \"' +
                path + '\"';

        if (loadScript(path, FUSIONCHARTS_FILE_NAME, function () {
                    debug ('page-load trigger executed.');

                    if (GeoProxy.exportTriggered === true || !win.FusionCharts) {
                        debug ('page-load trigger exited.');
                        return;
                    }

                    GeoProxy.exportTriggered = setTimeout(function () {
                        GeoProxy.exportAllItems(win.FusionCharts);
                        cleanObject(GeoProxy.items);
                    }, 1);

                }, function () {
                    debug('failed ' + loadingMessage);
                }, true)) {
            debug(loadingMessage);
        }
        else {
            debug('cannot continue ' + loadingMessage);
        };
    });

    debug('end of script.');
}());