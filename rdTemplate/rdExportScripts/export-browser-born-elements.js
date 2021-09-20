var page = require('webpage').create(),
    system = require('system'),
    fs = require('fs');

function TryParseInt(str, defaultValue) {
    var retValue = defaultValue;
    if (str !== null) {
        if (str.length > 0) {
            if (!isNaN(str)) {
                retValue = parseInt(str);
            }
        }
    }
    return retValue;
}

function TryParseFloat(str, defaultValue) {
    var retValue = defaultValue;
    if (str !== null) {
        if (str.length > 0) {
            if (!isNaN(str)) {
                retValue = parseFloat(str);
            }
        }
    }
    return retValue;
}

if (system.args.length < 7) {
    console.log('Script expects 6 parameters: htmlFileName, fileNameTemplate, pageWidth, browserTimeout, sCheckTimeInterval, sAccessToken (optional)');
    phantom.exit(1);
} else {
    var address = system.args[1];
    var output = system.args[2];
    var pageWidth = TryParseInt(system.args[3], 1200);
    page.viewportSize = { width: pageWidth, height: 800 };
    var browserTimeout = TryParseInt(system.args[4], 60) * 1000;
    var checkTimeInterval = TryParseInt((TryParseFloat(system.args[5], 0.25) * 1000) + "", 250);  //25729
    var sAccessToken = system.args[6];
    if (sAccessToken) {
        page.customHeaders = {
            "Authorization": sAccessToken
        };
    }
    var maxAttempt = browserTimeout / checkTimeInterval;
    var currentAttempt = 0;

    capture = function (targetFile, clipRect) {
        var previousClipRect;
        previousClipRect = page.clipRect;
        page.clipRect = clipRect;
        try {
            page.render(targetFile);
        } catch (e) {
            console.log('Failed to capture screenshot as ' + targetFile + ': ' + e, "error");
        }
        if (previousClipRect) {
            page.clipRect = previousClipRect;
        }
        return this;
    }

    function doExport() {
        var i = 0, length = 0;
            lstAllBrowserBornElements = [],
            browserBornItem = null,
            fileName = null;

        lstAllBrowserBornElements = page.evaluate(function () {
            var ret = [],
                lstElements = Y.all('.rdBrowserBorn,.rdBrowserBornHtml,.rdBrowserBornImage'),
                browserBornElement = null,
                i = 0, length = lstElements.size(),
                id = null,
                elementContent = null,
                html;

            for (; i < length; i++) {
                browserBornElement = lstElements.item(i);
                var clipRect = browserBornElement.getDOMNode().getBoundingClientRect();
                //special case for Highcharts
                if (browserBornElement.one('.highcharts-container')) {
                    html = browserBornElement.one('.highcharts-container').get('outerHTML');
                } else if (browserBornElement.one("logi-visualization logi-load-overlay")) {
                    browserBornElement.one("logi-visualization logi-load-overlay").remove();
                    html = browserBornElement.get('outerHTML');
                }
                else {
                    html = browserBornElement.get('outerHTML')
                }
                ret.push({
                    id: browserBornElement.getAttribute('id'),
                    html: html,
                    clipRect: clipRect,
                    isImage: browserBornElement.hasClass("rdBrowserBornImage")
                });
            }
            return ret;
        });

        length = lstAllBrowserBornElements.length;
        for (; i < length; i++) {
            browserBornItem = lstAllBrowserBornElements[i];
            if (browserBornItem.isImage) {
                var imgFilename = output.replace('{0}', browserBornItem.id + "_png").replace(".html", ".png");
                capture(imgFilename, browserBornItem.clipRect);
                browserBornItem.html = "<img src='file:///" + imgFilename + "' />";
            }

            fileName = output.replace('{0}', browserBornItem.id);
            fs.write(fileName, browserBornItem.html, 'w');
        }
        phantom.exit();
    }

    function waitForAllBrowserBornElementsBeforeExport() {
        var isPageRendered = false;

        isPageRendered = page.evaluate(function () {
            var isPageRendered = true,
                lstElements = Y.all('.rdBrowserBorn,.rdBrowserBornHTML,.rdBrowserBornImage'),
                i = 0, length = lstElements.size(),
                isElementRendered = false;
            for (; i < length; i++) {
                isElementRendered = lstElements.item(i).getAttribute('data-rdBrowserBornReady').toLowerCase() == 'true';
                if (!isElementRendered) {
                    isPageRendered = false;
                    break;
                }
            }
            return isPageRendered;
        });

        if (isPageRendered) {
            doExport();
        } else {
            if (currentAttempt >= maxAttempt) {
                //timeout
                doExport();
            } else {
                currentAttempt += 1;
                window.setTimeout(waitForAllBrowserBornElementsBeforeExport, checkTimeInterval);
            }
        }
    }

    page.onError = function (msg, trace) {
        var msgStack = ['ERROR: ' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function (t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
            });
        }
        console.error(msgStack.join('\n'));
    };

    phantom.onError = function (msg, trace) {
        var msgStack = ['ERROR: ' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function (t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
            });
        }
        console.error(msgStack.join('\n'));
        phantom.exit(1);
    };

    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
        } else {
            var allBrowserBornElementsSize = page.evaluate(function () {
                return Y.all('.rdBrowserBorn,.rdBrowserBornHTML,.rdBrowserBornImage').size();
            });
            if (allBrowserBornElementsSize == 0) {
                console.log("Page doesn't contain elements with .rdBrowserBorn, .rdBrowserBornHTML and .rdBrowserBornImage classes");
                return;
            }
            window.setTimeout(waitForAllBrowserBornElementsBeforeExport, checkTimeInterval);
        }
    });
}
