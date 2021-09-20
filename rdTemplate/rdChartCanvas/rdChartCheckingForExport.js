if (window.LogiXML === undefined) {
    window.LogiXML = {};
}
window.LogiXML.checkAllChartsForReady = function () {
    var allCharts = Y.all(".rdChartCanvas"),
		allChartsAreReady = true,
		i = 0, length = allCharts.size(),
		chartNode, flagElement = Y.one('#rdReadyForExport');

    for (; i < length; i++) {
        chartNode = allCharts.item(i);
        svg = chartNode.one('svg');
        if (!svg) {
            if (!chartNode.one('img[src="rdTemplate/rdChartError.gif"]')) {
                allChartsAreReady = false;
                break;
            }
        } else if (chartNode.one('.highcharts-loading')) {
            allChartsAreReady = false;
            break;
        }
    }
    flagElement.setAttribute('data-ready', allChartsAreReady.toString());
    if (!allChartsAreReady) {
        window.LogiXML.rdChartTimeout = setTimeout(window.LogiXML.checkAllChartsForReady, 500);
    }
    console.log(allChartsAreReady.toString());
}

window.LogiXML.initChartCheckingForExport = function () {
    var span = Y.Node.create('<span id="rdReadyForExport" data-ready="false"></span>');
    Y.one('body').appendChild(span);
    window.LogiXML.rdChartTimeout = setTimeout(window.LogiXML.checkAllChartsForReady, 500);
}

