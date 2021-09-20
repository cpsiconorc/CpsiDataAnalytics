//"use strict";
if (window.LogiXML === undefined) {
    window.LogiXML = {};
}

LogiXML.Formatter = {

    format: function (value, format) {
        if (value === undefined || value === null) {
            return value;
        }
        if (format && format.toLowerCase() === 'html') {
            value = LogiXML.decodeHtml(value, true);
        }
        if (value instanceof Date) {
            return LogiXML.Formatter.formatDate(value, format);
        } else if (typeof value === 'number') {
            return LogiXML.Formatter.formatNumber(value, format);
        } else if (typeof value === 'string') {
            return LogiXML.Formatter.formatString(value, format);
        }
        return value;
    },

    formatDate: function (timestamp, format) {

        if (format == null || format == '') {
            format = 'yyyy/MM/dd hh:mm:ss';
        }

        var useUTC = true,
            date = new Date(timestamp),
            milliseconds = useUTC ? date.getUTCMilliseconds() : date.getMilliseconds(),
            seconds = useUTC ? date.getUTCSeconds() : date.getSeconds(),
            minutes = useUTC ? date.getUTCMinutes() : date.getMinutes(),
            hours = useUTC ? date.getUTCHours() : date.getHours(),
            day = useUTC ? date.getUTCDay() : date.getDay(),
            dayOfMonth = useUTC ? date.getUTCDate() : date.getDate(),
            month = useUTC ? date.getUTCMonth() : date.getMonth(),
            fullYear = useUTC ? date.getUTCFullYear() : date.getFullYear(),
            formattedDate = '',
            pad = function (number, length) {
                return new Array((length || 2) + 1 - String(number).length).join(0) + number;
            },
            padRight = function (number, length) {
                return number + new Array((length || 2) + 1 - String(number).length).join(0);
            };

        //Predefined formats
        switch (format) {
            case "General Date":
            case "G":
                if (hours == 0 && minutes == 0 && seconds == 0 && milliseconds == 0) {
                    format = LogiXML.Localization.DateFormatInfo.shortDatePattern;
                } else if (fullYear == 0 && month == 0 && dayOfMonth) {
                    format = LogiXML.Localization.DateFormatInfo.shortTimePattern;
                } else {
                    format = LogiXML.Localization.DateFormatInfo.shortDatePattern + ' ' + LogiXML.Localization.DateFormatInfo.shortTimePattern;
                }
                break;

            case "Long Date":
            case "D":
                format = LogiXML.Localization.DateFormatInfo.longDatePattern;
                break;

            case "Medium Date":
                format = LogiXML.Localization.DateFormatInfo.longDatePattern;
                break;

            case "Short Date":
            case "d":
                format = LogiXML.Localization.DateFormatInfo.shortDatePattern;
                break;

            case "Long Time":
            case "T":
                format = LogiXML.Localization.DateFormatInfo.longTimePattern;
                break;

            case "Medium Time":
                format = LogiXML.Localization.DateFormatInfo.longTimePattern;
                break;

            case "Short Time":
            case "t":
                format = LogiXML.Localization.DateFormatInfo.shortTimePattern;
                break;

            case "f":
                format = LogiXML.Localization.DateFormatInfo.longDatePattern + ' ' + LogiXML.Localization.DateFormatInfo.shortTimePattern;
                break;

            case "F":
                format = LogiXML.Localization.DateFormatInfo.longDatePattern + ' ' + LogiXML.Localization.DateFormatInfo.longTimePattern;
                break;

            case "g":
                format = LogiXML.Localization.DateFormatInfo.shortDatePattern + ' ' + LogiXML.Localization.DateFormatInfo.shortTimePattern;
                break;

            case "M":
            case "m":
                format = LogiXML.Localization.DateFormatInfo.monthDayPattern;
                break;

            case "R":
            case "r":
            case "s":
            case "u":
            case "U":
                format = "yyyy'-'MM'-'dd'T'HH':'mm':'ss"; //"yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'";
                break;

            case "Y":
            case "y":
                format = LogiXML.Localization.DateFormatInfo.yearMonthPattern;
                break;
        }

        //date and time separators
        if (LogiXML.Localization.DateFormatInfo.dateSeparator != "/") {
            format = format.replace(new RegExp('/'), LogiXML.Localization.DateFormatInfo.dateSeparator);
        }
        if (LogiXML.Localization.DateFormatInfo.timeSeparator != ":") {
            format = format.replace(/:/g, LogiXML.Localization.DateFormatInfo.timeSeparator);
        }
        //remove %
        format = format.replace(/%/g, "");

        formattedDate = format.replace(/(\\)?("[^"]*"?|'[^']*'?|dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S|fyyyy?|fyy?|fqq?|ww?|fF?|qq?)/g,
            function (m) {
                if (m.charAt(0) === "\\") {
                    return m.replace("\\", "");
                }
                switch (m) {
                    case "dddd":
                        return LogiXML.Localization.DateFormatInfo.dayNames[day];
                    case "ddd":
                        return LogiXML.Localization.DateFormatInfo.abbreviatedDayNames[day];
                    case "dd":
                        return pad(dayOfMonth);
                    case "d":
                        return dayOfMonth;

                    case "MMMM":
                        return LogiXML.Localization.DateFormatInfo.monthNames[month];
                    case "MMM":
                    case "mmm":
                        return LogiXML.Localization.DateFormatInfo.abbreviatedMonthNames[month];
                    case "MM":
                        return pad(month + 1);
                    case "M":
                        return month + 1;

                    case "gg":
                        return "";


                    case "hh":
                        return pad(hours < 13 ? (hours === 0 ? 12 : hours) : (hours - 12));
                    case "h":
                        return hours < 13 ? (hours === 0 ? 12 : hours) : (hours - 12);
                    case "HH":
                        return pad(hours);
                    case "H":
                        return hours;


                    case "mm":
                        return pad(minutes);
                    case "m":
                        return minutes;


                    case "ss":
                        return pad(seconds);
                    case "s":
                        return seconds;

                    case "FFFFFFF":
                    case "fffffff":
                        return padRight(milliseconds, 7).substring(0, 7);

                    case "FFFFFF":
                    case "ffffff":
                        return padRight(milliseconds, 6).substring(0, 6);

                    case "FFFFF":
                    case "fffff":
                        return padRight(milliseconds, 5).substring(0, 5);

                    case "FFFF":
                    case "ffff":
                        return padRight(milliseconds, 4).substring(0, 4);

                    case "FFF":
                    case "fff":
                        return padRight(milliseconds, 3).substring(0, 3);

                    case "FF":
                    case "ff":
                        return padRight(milliseconds, 2).substring(0, 2);

                    case "F":
                    case "f":
                        return padRight(milliseconds, 1).substring(0, 1);

                    case "T":
                    case "t":
                        return hours < 12 ? LogiXML.Localization.DateFormatInfo.AMDesignator.substring(0, 1) : LogiXML.Localization.DateFormatInfo.PMDesignator.substring(0, 1);

                    case "TT":
                    case "tt":
                        return hours < 12 ? LogiXML.Localization.DateFormatInfo.AMDesignator : LogiXML.Localization.DateFormatInfo.PMDesignator;


                    case "yyyy":
                        return pad(fullYear, 4);
                    case "yy":
                    case "y":
                        return fullYear.toString().substr(4 -m.length);

                    case "qq":
                        return Math.ceil((month + 1) / 3);
                    case "fyyyy":
                        var adjustedDate = LogiXML.Formatter.getAdjustedFiscalDate(date);
                        return adjustedDate.getUTCFullYear();
                    case "fyy":
                        var adjustedDate = LogiXML.Formatter.getAdjustedFiscalDate(date);
                        return adjustedDate.getUTCFullYear().toString().substr(2);
                    case "fqq":
                        var adjustedDate = LogiXML.Formatter.getAdjustedFiscalDate(date);
                        return parseInt((adjustedDate.getUTCMonth()) / 3) + 1;
                    case "ww":
                        var dayOfYear = LogiXML.Formatter.getDayOfYear(date) - 1;
                        var dayForJan1 = LogiXML.Formatter.getDayOfYear(date) - (dayOfYear % 7);
                        var firstDayOfWeek = 0;
                        var firstDayOfWeekHidden = document.getElementById("rdConstantFirstDayOfWeekHidden");
                        if (firstDayOfWeekHidden) {
                            firstDayOfWeek = parseInt(firstDayOfWeekHidden.value)
                        }
                        var offset = (dayForJan1 - firstDayOfWeek + 14) % 7;
                        return Math.floor(((dayOfYear + offset) / 7 + 1));
                    default:
                        if (m.charAt(0) === "\"") {
                            return m.replace(/["]/g, '');
                        } else if (m.charAt(0) === "'") {
                            return m.replace(/[']/g, '');
                        }
                        return m;
                }
            }
        ).replace("\\","");

        return formattedDate;
    },

    getDayOfYear : function(date){
        var start = new Date(date.getUTCFullYear(), 0, 0);
        var diff = date - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay);
        return day;
    },

    getAdjustedFiscalDate: function (dt) {
        var adjustedDate = new Date(dt);
        var firstDayOfFiscalHidden = document.getElementById("rdConstantFirstDayOfFiscalYearHidden");
        if (firstDayOfFiscalHidden) {
            var firstDayOfFiscalValue = firstDayOfFiscalHidden.value;
            if (firstDayOfFiscalValue) {
                var fiscalStartDate = new Date(firstDayOfFiscalValue);
                if (fiscalStartDate.getUTCDate() == 1 && fiscalStartDate.getUTCMonth() == 0) {
                    return adjustedDate;
                } else {
                    var yearOffset = 0;
                    var positiveFiscalYearValue = "";
                    var positiveFiscalYearHidden = document.getElementById("rdConstantPositiveFiscalYearHidden");
                    if (positiveFiscalYearHidden) {
                        positiveFiscalYearValue = positiveFiscalYearHidden.value;
                    }

                    if (positiveFiscalYearValue != "True") {
                        yearOffset = 1;
                    }


                    adjustedDate.setUTCFullYear(dt.getUTCFullYear() + yearOffset);
                    adjustedDate.setUTCMonth(dt.getUTCMonth() + (1 - (fiscalStartDate.getUTCMonth() + 1)));
                    adjustedDate.setUTCDate(dt.getUTCDate() + (1 - fiscalStartDate.getUTCDate()));
                }
            }
        }
        return adjustedDate;
    },

    formatNumber: function (num, format) {
        if (format == null || format == '') {
            return num;
        }

        var customFormat = format, prefix = "", suffix = "", negativeSymbol = "-",
            i, y, iLength, yLength;
        format = LogiXML.decodeHtml(format, true);
        if (format.indexOf(';') > -1) {
            if (num >= 0) {
                format = format.substring(0, format.indexOf(';'));
            } else {
                format = format.substring(format.indexOf(';') + 1);
                negativeSymbol = "";
            }
            customFormat = format;
        }
        format = LogiXML.decodeHtml(format);
        //pre-defined format to custom
        switch (format) {
            case "General Number":
            case "G":
            case "g":
                //Displays number with no thousand separator.
                customFormat = "#0"
                break;

            case "Currency":
            case "C":
            case "c":
                //Displays number with thousand separator, if appropriate; display two digits to the right of the decimal separator. Output is based on system locale settings.
                customFormat = "#";

                i = 0; iLength = LogiXML.Localization.NumFormatInfo.currencyGroupSizes.length;
                for (; i < iLength; i++) {
                    y = 0; yLength = LogiXML.Localization.NumFormatInfo.currencyGroupSizes[i];
                    customFormat += ","
                    for (; y < yLength; y++) {
                        customFormat += "#";
                    }
                }

                if (customFormat.length > 2) {
                    customFormat = customFormat.substring(0, customFormat.length - 1) + "0";
                }

                if (LogiXML.Localization.NumFormatInfo.currencyDecimalDigits > 0) {
                    customFormat += "."
                    i = 0; iLength = LogiXML.Localization.NumFormatInfo.currencyDecimalDigits;
                    for (; i < iLength; i++) {
                        customFormat += "0";
                    }
                }

                if (num >= 0) {
                    switch (LogiXML.Localization.NumFormatInfo.currencyPositivePattern) {
                        case 0:
                            prefix = LogiXML.Localization.NumFormatInfo.currencySymbol;
                            break;

                        case 2:
                            prefix = LogiXML.Localization.NumFormatInfo.currencySymbol + " ";
                            break;

                        case 1:
                            suffix = LogiXML.Localization.NumFormatInfo.currencySymbol;
                            break;

                        case 3:
                            suffix = " " + LogiXML.Localization.NumFormatInfo.currencySymbol;
                            break;
                    }
                } else {
                    switch (LogiXML.Localization.NumFormatInfo.currencyNegativePattern) {
                        case 0: //($n) 
                            prefix = "(" + LogiXML.Localization.NumFormatInfo.currencySymbol;
                            suffix = ")";
                            negativeSymbol = "";
                            break;

                        case 1://-$n
                            prefix = "-" + LogiXML.Localization.NumFormatInfo.currencySymbol;
                            negativeSymbol = "";
                            break;

                        case 2://$-n  
                            prefix = LogiXML.Localization.NumFormatInfo.currencySymbol;
                            break;

                        case 3://$n-
                            prefix = LogiXML.Localization.NumFormatInfo.currencySymbol;
                            suffix = "-";
                            negativeSymbol = "";
                            break;

                        case 4://(n$) 
                            prefix = "(";
                            suffix = LogiXML.Localization.NumFormatInfo.currencySymbol + ")";
                            negativeSymbol = "";
                            break;

                        case 5://-n$ 
                            suffix = LogiXML.Localization.NumFormatInfo.currencySymbol;
                            break;
                        case 6://n-$ 
                            suffix = "-" + LogiXML.Localization.NumFormatInfo.currencySymbol;
                            negativeSymbol = "";
                            break;

                        case 7://n$- 
                            suffix = LogiXML.Localization.NumFormatInfo.currencySymbol + "-";
                            negativeSymbol = "";
                            break;
                        case 8://-n $ 
                            suffix = " " + LogiXML.Localization.NumFormatInfo.currencySymbol;
                            break;
                        case 9://-$ n 
                            perfix = "-" + LogiXML.Localization.NumFormatInfo.currencySymbol + " ";
                            negativeSymbol = "";
                            break;
                        case 10://n $- 
                            suffix = " " + LogiXML.Localization.NumFormatInfo.currencySymbol + "-";
                            negativeSymbol = "";
                            break;

                        case 11://$ n- 
                            prfix = LogiXML.Localization.NumFormatInfo.currencySymbol = " ";
                            suffix = "-";
                            negativeSymbol = "";
                            break;

                        case 12://$ -n 
                            prfix = LogiXML.Localization.NumFormatInfo.currencySymbol = " ";
                            break;

                        case 13://n- $
                            suffix = "- " + LogiXML.Localization.NumFormatInfo.currencySymbol;
                            negativeSymbol = "";
                            break;
                        case 14://($ n) 
                            prefix = "(" + LogiXML.Localization.NumFormatInfo.currencySymbol + " ";
                            suffix = ")";
                            negativeSymbol = "";
                            break;
                        case 15://(n $) 
                            prefix = "(";
                            suffix = " " + LogiXML.Localization.NumFormatInfo.currencySymbol + ")";
                            negativeSymbol = "";
                            break;
                    }
                }
                break;

            case "Fixed":
            case "F":
            case "f":
                //Displays at least one digit to the left and two digits to the right of the decimal separator.
                customFormat = "0.00";

            case "Standard":
            case "N":
            case "n":
                //Displays number with thousand separator, at least one digit to the left and two digits to the right of the decimal separator.
                customFormat = "#,##0.00";
                break;

            case "Percent":
                //Displays number multiplied by 100 with a percent sign (%) appended immediately to the right; always displays two digits to the right of the decimal separator. 
                format = customFormat = "0.00%";
                break;

            case "P":
            case "p":
                //Displays number with thousandths separator multiplied by 100 with a percent sign (%) appended to the right and separated by a single space; always displays two digits to the right of the decimal separator. 
                format = customFormat = "#,##0.00%";
                break;

            case "Scientific":
                return num.toExponential(2).toUpperCase();
            case "E":
                {
                    return num.toExponential(6).toUpperCase().replace(".", LogiXML.Localization.NumFormatInfo.numberDecimalSeparator);
                }
            case "e":
                {
                    return num.toExponential(6).toLowerCase().replace(".", LogiXML.Localization.NumFormatInfo.numberDecimalSeparator);
                }
            case "True/False":
            {
                if (num > 0) {
                    return "True";
                } else {
                    return "False";
                }
            }
            case "Yes/No":
            {
                if (num > 0) {
                    return "Yes";
                } else {
                    return "No";
                }
            }
            case "On/Off":
            {
                if (num > 0) {
                    return "On";
                } else {
                    return "Off";
                }
            }
            case "Timespan":
            {
                    return LogiXML.Formatter.TimeSpan.FromSeconds(num).To_Timespan_FormattedString();
            }
        }

        //Scientific format with number of digit placeholders
        if (format.charAt(0) == "e" || format.charAt(0) == "E") {
            var rxNum = new RegExp(/[0-9]+/),
                results = rxNum.exec(format),
                decimals = 0, exponential;
            if (results && results.length > 0) {
                decimals = parseInt(results[0]);
                exponential = num.toExponential(decimals > 20 ? 20 : decimals);
            } else {
                exponential = num.toExponential(0);
            }
            exponential = exponential.replace(".", LogiXML.Localization.NumFormatInfo.numberDecimalSeparator);
            return format.charAt(0) == "e" ? exponential.toLowerCase() : exponential.toUpperCase();
        }

        if ((format.charAt(0) == "p" || format.charAt(0) == "P") && format.length > 1) {
            var rxNum = new RegExp(/[0-9]+/),
                results = rxNum.exec(format);
            var decimals = parseInt(results[0]);
            if (!isNaN(decimals)) {//Formats like "Percent" or pPpP are invalid or handled before
                format = customFormat = "#,##0." + Array(++decimals).join("0") + "%";
            }            
        }

        var validFormat = "0#-,.";

        if (customFormat != format) {
            format = customFormat;
        } else {

            //metric prefix
            var mpPattern = new RegExp("mp");
            if (mpPattern.test(format)) {
                mpPattern = new RegExp("mps([1-9]+)");
                if (mpPattern.test(format)) {
                    var matchGroups = format.match(mpPattern);
                    if (matchGroups && matchGroups.length == 2 && matchGroups[1]) {
                        var signDigitsCount = parseInt(matchGroups[1]);
                        if (signDigitsCount && signDigitsCount > 0) {
                            num = LogiXML.Formatter.roundToSignificantDigit(num, signDigitsCount);
                        }
                    }
                    format = format.substr(0, format.indexOf("mps") + 2);
                } else {
                    mpPattern = new RegExp("mps");
                    if (mpPattern.test(format)) {
                        format = format.replace("mps", "mp");
                    }
                }

                var result = LogiXML.Formatter.Helpers.getMetricPrefix(num, LogiXML.Localization.metricPrefixes);
                num = num / result[1];
                format = format.replace(/mp/g, result[0]);
                if (format == result[0]) {
                    format = "0.###" + format;
                }
            }

            for (var i = 0; i < format.length; i++) {
                if (validFormat.indexOf(format.charAt(i)) == -1)
                    prefix = prefix + format.charAt(i);
                else if (negativeSymbol == "") {
                        negativeSymbol = format.charAt(i);
                    }
                else break;
            }
            format = format.substring(prefix.length);

            for (var i = format.length - 1; i >= 0; i--) {
                if (validFormat.indexOf(format.charAt(i)) == -1)
                    suffix = format.charAt(i) + suffix;
                else
                    break;
            }
            format = format.substring(0, format.length - suffix.length);
        }

        return LogiXML.Formatter.formatCustomNumber(num, format, suffix, prefix, negativeSymbol, LogiXML.Localization.NumFormatInfo.numberDecimalSeparator, LogiXML.Localization.NumFormatInfo.numberGroupSeparator);

    },

    formatCustomNumber: function (number, format, suffix, prefix, negativeSymbol, dec, group) {

        var nanForceZero = false,
            round = true,
            decimalSeparatorAlwaysShown = false;


        // Check NAN handling
        var forcedToZero = false;
        if (isNaN(number)) {
            if (nanForceZero == true) {
                number = 0;
                forcedToZero = true;
            } else {
                return '';
            }
        }

        // special case for percentages
        //25741 - specific percent format to avoid multiplying the value by 100
        if(suffix.indexOf('\\%') !== -1){
            suffix = suffix.replace('\\%', '%');
        }else if (suffix.indexOf('%') !== -1) {
            number = number * 100;
        }

        // round off percentages to match rounded values from server for QT's etc.23344
        if (suffix && suffix.indexOf('%') != -1) {
            round = true ;
        }

        var returnString = "";
        if (format.indexOf(".") > -1) {
            var decimalPortion = dec;
            var decimalFormat = format.substring(format.lastIndexOf(".") + 1);

            // round or truncate number as needed
            if (round == true)
                number = new Number(LogiXML.Formatter.Helpers.numberToFixed(number, decimalFormat.length));
            else {
                var numStr = LogiXML.Formatter.Helpers.numberToStringWithNoExponents(number);
                if (numStr.lastIndexOf('.') > 0) {
                    numStr = numStr.substring(0, numStr.lastIndexOf('.') + decimalFormat.length + 1);
                }
                number = new Number(numStr);
            }

            var decimalValue = new Number(LogiXML.Formatter.Helpers.numberToStringWithNoExponents(number).substring(LogiXML.Formatter.Helpers.numberToStringWithNoExponents(number).indexOf('.'))),
                decimalString = new String(LogiXML.Formatter.Helpers.numberToFixed(decimalValue, decimalFormat.length));
            decimalString = decimalString.substring(decimalString.lastIndexOf('.') + 1);
            for (var i = 0; i < decimalFormat.length; i++) {
                if (decimalFormat.charAt(i) == '#' && decimalString.charAt(i) != '0') {
                    decimalPortion += decimalString.charAt(i);
                    continue;
                } else if (decimalFormat.charAt(i) == '#' && decimalString.charAt(i) == '0') {
                    var notParsed = decimalString.substring(i);
                    if (notParsed.match('[1-9]')) {
                        decimalPortion += decimalString.charAt(i);
                        continue;
                    } else
                        break;
                } else if (decimalFormat.charAt(i) == "0")
                    decimalPortion += decimalString.charAt(i);
            }
            returnString += decimalPortion
        } else
            number = Math.round(number);

        var ones = Math.floor(number);
        if (number < 0)
            ones = Math.abs(Math.ceil(number));

        var onesFormat = "";
        if (format.indexOf(".") == -1)
            onesFormat = format;
        else
            onesFormat = format.substring(0, format.indexOf("."));

        var onePortion = "";
        if (!(ones == 0 && onesFormat.substr(onesFormat.length - 1) == '#') || forcedToZero) {
            // find how many digits are in the group
            var oneText = new String(Math.abs(ones));
            var groupLength = 9999;
            if (onesFormat.lastIndexOf(",") != -1)
                groupLength = onesFormat.length - onesFormat.lastIndexOf(",") - 1;
            var groupCount = 0;
            for (var i = oneText.length - 1; i > -1; i--) {
                onePortion = oneText.charAt(i) + onePortion;
                groupCount++;
                if (groupCount == groupLength && i != 0) {
                    onePortion = group + onePortion;
                    groupCount = 0;
                }
            }

            // account for any pre-data padding
            if (onesFormat.length > onePortion.length) {
                var padStart = onesFormat.indexOf('0');
                if (padStart != -1) {
                    var padLen = onesFormat.length - padStart;

                    // pad to left with 0's or group char
                    var pos = onesFormat.length - onePortion.length - 1;
                    while (onePortion.length < padLen) {
                        var padChar = onesFormat.charAt(pos);
                        // replace with real group char if needed
                        if (padChar == ',')
                            padChar = group;
                        onePortion = padChar + onePortion;
                        pos--;
                    }
                }
            }
        }

        if (!onePortion && onesFormat.indexOf('0', onesFormat.length - 1) !== -1)
            onePortion = '0';

        returnString = onePortion + returnString;

        if (number < 0)
            returnString = negativeSymbol + returnString;

        if (!decimalSeparatorAlwaysShown) {
            if (returnString.lastIndexOf(dec) == returnString.length - 1) {
                returnString = returnString.substring(0, returnString.length - 1);
            }
        }
        returnString = prefix + returnString + suffix;
        return returnString;
    },

    formatString: function (str, format) {
        if (format == null || format == '' || str == null || str == '') {
            return str;
        }

        switch (format) {

            case "<":
                {
                    return str.toLowerCase();
                }

            case ">":
                {
                    return str.toUpperCase();
                }

            case "Expanded Spaces":
                {
                    return str.replace(" ", "&nbsp;", "g");
                }
            case "Preserve Line Feeds":
                {
                    return str.replace(/\r|\n/g, "<br />");
                }

            case "Yes/No":
                return str.replace(/True/gi, "Yes").replace(/False/gi, "No");
        }

        return str;
    },

    roundToSignificantDigit: function (num, signDigitsCount) {
        var bNegative = false;
        var result;
        if (num==0) {
            return 0;
        }
        if (num<0) {
            bNegative = true;
            num = -num;
        }
        var mult = Math.pow(10, signDigitsCount - Math.floor(Math.log(num) / Math.log(10)) - 1);
        result = (Math.round(num * mult) / (mult * 1000000)) * 1000000;
        if (bNegative) {
            result = -result;
        }
        return result;
    }
}

LogiXML.Formatter.Helpers = {

    getMetricPrefix: function (number, asymbol) {
        var dsymbcenter = 6.0,
            dsindex = null,
            dmag_fact = null,
            ibase = 1000,
            sSymbol = null;

        if (number == 0) {
            dsindex = 0;
            dmag_fact = 1.0;
        } else {
            //if (number < 0) {
            //    dsindex = Math.ceil(Math.log(Math.abs(number)) / Math.log(ibase));
            //} else {
            if (Math.trunc) {
                dsindex = Math.trunc(Math.log(Math.abs(number)) / Math.log(ibase));
            } else {
                var tmp = Math.log(Math.abs(number)) / Math.log(ibase);
                if (tmp >= 0) {
                    dsindex = Math.floor(tmp);
                } else {
                    dsindex = Math.ceil(tmp);
                }
            }
            //}
            dmag_fact = Math.pow(ibase, dsindex);
        }

        if (dsindex <= dsymbcenter && dsindex >= -dsymbcenter) {
            sSymbol = asymbol[dsindex + dsymbcenter];
        } else {
            sSymbol = "?";
        }

        return [sSymbol, dmag_fact];
    },

    numberToFixed: function (number, precision) {
        var power = Math.pow(10, precision || 0);
        var value = String(Math.round(number * power) / power);

        if (precision > 0) {
            var dp = value.indexOf(".");
            if (dp == -1) {
                value += '.';
                dp = 0;
            } else {
                dp = value.length - (dp + 1);
            }

            while (dp < precision) {
                value += '0';
                dp++;
            }
        }
        return value;
    },

    numberToStringWithNoExponents: function (number) {
        var data = String(number).split(/[eE]/);
        if (data.length == 1) return data[0];

        var z = '', sign = this < 0 ? '-' : '',
        str = data[0].replace('.', ''),
        mag = Number(data[1]) + 1;

        if (mag < 0) {
            z = sign + '0.';
            while (mag++) z += '0';
            return z + str.replace(/^\-/, '');
        }
        mag -= str.length;
        while (mag--) z += '0';
        return str + z;
    }

}

    
TimeSpan = LogiXML.Formatter.TimeSpan = function (seconds) {
    const TicksPerDay = 864000000000;
    const TicksPerHour = 36000000000;
    const TicksPerMillisecond = 10000;
    const TicksPerMinute = 600000000;
    const TicksPerSecond = 10000000;
    var ticks;
    var input = seconds;
    var msecCurrent = seconds * (TicksPerSecond / TicksPerMillisecond);
    //rounding
    msecCurrent = Math.round(msecCurrent);
    ticks = msecCurrent * TicksPerMillisecond;

    getDays = function () {
        return Math.trunc(ticks / TicksPerDay);
    };

    getHours = function () {
        return Math.trunc(ticks % TicksPerDay / TicksPerHour);
    };

    getMilliseconds = function () {
        return Math.trunc(ticks % TicksPerSecond / TicksPerMillisecond);
    };

    getMinutes = function () {
        return Math.trunc(ticks % TicksPerHour / TicksPerMinute);
    };

    getSeconds = function () {
        return Math.trunc(ticks % TicksPerMinute / TicksPerSecond);
    };
    _ = function (number, length) {
        length = length || 2;
        var abs = Math.abs(number);
        return ("00" + abs).slice(-length);//maximum need 3 digits for ms
    };

    // [-][dd:]hh:mm:ss[.fff]
    this.To_g_FormattedString = function () {
        return isNaN(ticks) ? input :
            "" +
            (ticks < 0 ? "-" : "")
            + (getDays() !== 0 ? _(getDays()) + ":" : "")
            + _(getHours()) + ":"
            + _(getMinutes()) + ":"
            + _(getSeconds())
            + (getMilliseconds() !== 0 ? LogiXML.Localization.NumFormatInfo.numberDecimalSeparator + _(getMilliseconds(), 3): "");
    };

    // [-]d:hh:mm:ss
    this.To_Timespan_FormattedString = function () {
        return isNaN(ticks) ? input :
            "" +
            (ticks < 0 ? "-" : "")
            + getDays() + ":"
            + _(getHours()) + ":"
            + _(getMinutes()) + ":"
            + _(getSeconds());
    };
};
TimeSpan.FromSeconds = function (seconds) {
    return new TimeSpan(seconds);
};