//"use strict";
if (Highcharts && LogiXML && LogiXML.Localization) {
    Highcharts.setOptions({
        lang: {
            resetZoom: LogiXML.Localization.Strings.resetZoom,
            resetZoomTitle: LogiXML.Localization.Strings.resetZoomTitle,
            loading: LogiXML.Localization.Strings.loading,
            months: LogiXML.Localization.DateFormatInfo.monthNames,
            shortMonths: LogiXML.Localization.DateFormatInfo.abbreviatedMonthNames,
            weekdays: LogiXML.Localization.DateFormatInfo.dayNames,
            decimalPoint: LogiXML.Localization.NumFormatInfo.numberDecimalSeparator,
            thousandsSep: LogiXML.Localization.NumFormatInfo.numberGroupSeparator
        }
    });
}