(function (Highcharts) {

    //'use strict;

    // create shortcuts
    var defaultOptions = Highcharts.getOptions(),
        defaultPlotOptions = defaultOptions.plotOptions,
        seriesTypes = Highcharts.seriesTypes,
        merge = Highcharts.merge,
        noop = function () { },
        each = Highcharts.each;

    // set default options
    defaultPlotOptions.trendline = merge(defaultPlotOptions.spline, {
    });


    seriesTypes.trendline = Highcharts.extendClass(seriesTypes.spline, {
        type: 'trendline',


        init: function (chart, options) {
            var parentId = options.parentId,
                lineAlgorithm = options.lineAlgorithm,
                parentOptions, i = 0, length = chart.series.length,
                data, regressionData;
            for (; i < length; i++) {
                if (chart.series[i].options.id == parentId) {
                    parentOptions = chart.series[i].options;
                    break;
                }
            }
            
            //25275
            if (parentOptions.data.length > 0 && parentOptions.dataInfo)
                data = this.extractXYDataFromSeries(parentOptions);
            if (data && data.data && data.data.length >= 2) {
                lineAlgorithm = lineAlgorithm.toLowerCase().replace('regression', '');
                regressionData = this.methods[lineAlgorithm](data.data);
                options.data = regressionData;
            } 

            Highcharts.Series.prototype.init.apply(this, arguments);
        },

        methods: {

            lowess: function (data) {
                return this.loess_pairs(data, 0.25);
            },

            linear: function (data) {
                return regression('linear', data).points;
            },
            logarithmic: function (data) {
                return regression('logarithmic', data).points;
            },
            power: function (data) {
                return regression('power', data).points;
            },
            polynomial2: function (data) {
                return regression('polynomial', data, 2).points;
            },
            polynomial3: function (data) {
                return regression('polynomial', data, 3).points;
            },
            polynomial4: function (data) {
                return regression('polynomial', data, 4).points;
            },

            loess_pairs: function (pairs, bandwidth) {
                if (pairs && pairs.length < 4) {
                    return pairs;
                }
                var xval = pairs.map(function (pair) { return pair[0] });
                var yval = pairs.map(function (pair) { return pair[1] });
                var res = this.loess(xval, yval, bandwidth);
                return xval.map(function (x, i) { return [x, res[i]] });
            },

            loess: function (xval, yval, bandwidth) {
                function tricube(x) {
                    var tmp = 1 - x * x * x;
                    return tmp * tmp * tmp;
                }

                var res = [];

                var left = 0;
                var right = Math.floor(bandwidth * xval.length) - 1;

                for (var i in xval) {
                    var x = xval[i];

                    if (i > 0) {
                        if (right < xval.length - 1 &&
                        xval[right + 1] - xval[i] < xval[i] - xval[left]) {
                            left++;
                            right++;
                        }
                    }

                    var edge;
                    if (xval[i] - xval[left] > xval[right] - xval[i])
                        edge = left;
                    else
                        edge = right;
                    var d = (xval[edge] - x);
                    var denom = d == 0 || isNaN(d) ? 0 : Math.abs(1.0 / d);

                    var sumWeights = 0;
                    var sumX = 0, sumXSquared = 0, sumY = 0, sumXY = 0;

                    var k = left;
                    while (k <= right) {
                        var xk = xval[k];
                        var yk = yval[k];
                        var dist;
                        if (k < i) {
                            dist = (x - xk);
                        } else {
                            dist = (xk - x);
                        }
                        var w = tricube(dist * denom);
                        var xkw = xk * w;
                        sumWeights += w;
                        sumX += xkw;
                        sumXSquared += xk * xkw;
                        sumY += yk * w;
                        sumXY += yk * xkw;
                        k++;
                    }

                    var meanX = sumX / sumWeights;
                    var meanY = sumY / sumWeights;
                    var meanXY = sumXY / sumWeights;
                    var meanXSquared = sumXSquared / sumWeights;

                    var beta;
                    if (meanXSquared == meanX * meanX)
                        beta = 0;
                    else
                        beta = (meanXY - meanX * meanY) / (meanXSquared - meanX * meanX);

                    var alpha = meanY - beta * meanX;

                    res[i] = beta * x + alpha;
                }

                return res;
            }
        },

        extractXYDataFromSeries: function (seriesOptions) {
            var data = seriesOptions.data,
                dataInfo = seriesOptions.dataInfo,
                ret = { data: [], xType: 'Text', yType: 'Number' },
                i = 0, length,
                xType, yType, xIndex, yIndex, useXData = false;

            length = dataInfo.columnMap.length;
            for (; i < length; i++) {
                switch (dataInfo.columnMap[i].name) {
                    case "x":
                        xType = dataInfo.columnMap[i].dataType;
                        xIndex = i;
                        break;
                    case "y":
                        yType = dataInfo.columnMap[i].dataType;
                        yIndex = i;
                        break;
                }
            }

            if (xType && xType != 'Text') {
                useXData = true;
            } 
            ret.xType = xType;
            ret.yType = yType;

            i = 0; length = data.length;
            for (; i < length; i++) {
                switch (dataInfo.serilizationType) {
                    case "array":
                        ret.data.push([i, data[i]]);
                        //ret.y.push(data[i]);
                        //ret.x.push(i);
                        break;
                    case "arrays":
                        ret.data.push([useXData ? data[i][xIndex] : i, data[i][yIndex]]);
                        //ret.y.push(data[i][yIndex]);
                        //ret.x.push(useXData ? data[i][xIndex] : i);
                        break;
                    case "objects":
                        ret.data.push([useXData ? data[i].x : i, data[i].y]);
                        //ret.y.push(data[i].y);
                        //ret.x.push(useXData ? data[i].x : i);
                        break;
                }
            }

            if (seriesOptions.type.toLowerCase() == "scatter") {
                // group elements
                var groups = {};
                ret.data.forEach(function (value) {
                    var group = value[0];

                    if (group) {
                        if (groups[group])
                            groups[group] = { sum: groups[group].sum + value[1], count: ++groups[group].count };
                        else
                            groups[group] = { sum: value[1], count: 1 };
                    }
                });
                // average of Y values
                ret.data = Object.keys(groups).map(function (group) {
                    return [+group, groups[group].sum / groups[group].count];
                });
                ret.data.sort(function (a, b) {
                    return a[0] - b[0];
                });
            }

            return ret;
        }


    });


}(Highcharts));


/**
* @license
*
* Regression.JS - Regression functions for javascript
* http://tom-alexander.github.com/regression-js/
*
* copyright(c) 2013 Tom Alexander
* Licensed under the MIT license.
*
**/

; (function () {
    //'use strict;

    var gaussianElimination = function (a, o) {
        var i = 0, j = 0, k = 0, maxrow = 0, tmp = 0, n = a.length - 1, x = new Array(o);
        for (i = 0; i < n; i++) {
            maxrow = i;
            for (j = i + 1; j < n; j++) {
                if (Math.abs(a[i][j]) > Math.abs(a[i][maxrow]))
                    maxrow = j;
            }
            for (k = i; k < n + 1; k++) {
                tmp = a[k][i];
                a[k][i] = a[k][maxrow];
                a[k][maxrow] = tmp;
            }
            for (j = i + 1; j < n; j++) {
                for (k = n; k >= i; k--) {
                    a[k][j] -= a[k][i] * a[i][j] / a[i][i];
                }
            }
        }
        for (j = n - 1; j >= 0; j--) {
            tmp = 0;
            for (k = j + 1; k < n; k++)
                tmp += a[k][j] * x[k];
            x[j] = (a[n][j] - tmp) / a[j][j];
        }
        return (x);
    };

    var methods = {
        linear: function (data) {
            var sum = [0, 0, 0, 0, 0], n = 0, results = [];

            for (; n < data.length; n++) {
                sum[0] += data[n][0];
                sum[1] += data[n][1];
                sum[2] += data[n][0] * data[n][0];
                sum[3] += data[n][0] * data[n][1];
                sum[4] += data[n][1] * data[n][1];
            }

            var gradient = (n * sum[3] - sum[0] * sum[1]) / (n * sum[2] - sum[0] * sum[0]);
            var intercept = (sum[1] / n) - (gradient * sum[0]) / n;
            // var correlation = (n * sum[3] - sum[0] * sum[1]) / Math.sqrt((n * sum[2] - sum[0] * sum[0]) * (n * sum[4] - sum[1] * sum[1]));

            for (var i = 0, len = data.length; i < len; i++) {
                var coordinate = [data[i][0], data[i][0] * gradient + intercept];
                results.push(coordinate);
            }

            var string = 'y = ' + Math.round(gradient * 100) / 100 + 'x + ' + Math.round(intercept * 100) / 100;

            return { equation: [gradient, intercept], points: results, string: string };
        },

        exponential: function (data) {
            var sum = [0, 0, 0, 0, 0, 0], n = 0, results = [];

            for (len = data.length; n < len; n++) {
                sum[0] += data[n][0];
                sum[1] += data[n][1];
                sum[2] += data[n][0] * data[n][0] * data[n][1];
                sum[3] += data[n][1] * Math.log(data[n][1]);
                sum[4] += data[n][0] * data[n][1] * Math.log(data[n][1]);
                sum[5] += data[n][0] * data[n][1];
            }

            var denominator = (sum[1] * sum[2] - sum[5] * sum[5]);
            var A = Math.pow(Math.E, (sum[2] * sum[3] - sum[5] * sum[4]) / denominator);
            var B = (sum[1] * sum[4] - sum[5] * sum[3]) / denominator;

            for (var i = 0, len = data.length; i < len; i++) {
                var coordinate = [data[i][0], A * Math.pow(Math.E, B * data[i][0])];
                results.push(coordinate);
            }

            var string = 'y = ' + Math.round(A * 100) / 100 + 'e^(' + Math.round(B * 100) / 100 + 'x)';

            return { equation: [A, B], points: results, string: string };
        },

        logarithmic: function (data) {
            var sum = [0, 0, 0, 0], n = 0, results = [];

            for (len = data.length; n < len; n++) {
                sum[0] += Math.log(data[n][0]);
                sum[1] += data[n][1] * Math.log(data[n][0]);
                sum[2] += data[n][1];
                sum[3] += Math.pow(Math.log(data[n][0]), 2);
            }

            var B = (n * sum[1] - sum[2] * sum[0]) / (n * sum[3] - sum[0] * sum[0]);
            var A = (sum[2] - B * sum[0]) / n;

            for (var i = 0, len = data.length; i < len; i++) {
                var coordinate = [data[i][0], A + B * Math.log(data[i][0])];
                results.push(coordinate);
            }

            var string = 'y = ' + Math.round(A * 100) / 100 + ' + ' + Math.round(B * 100) / 100 + ' ln(x)';

            return { equation: [A, B], points: results, string: string };
        },

        power: function (data) {
            var sum = [0, 0, 0, 0], n = 0, results = [];

            for (len = data.length; n < len; n++) {
                sum[0] += Math.log(data[n][0]);
                sum[1] += Math.log(data[n][1]) * Math.log(data[n][0]);
                sum[2] += Math.log(data[n][1]);
                sum[3] += Math.pow(Math.log(data[n][0]), 2);
            }

            var B = (n * sum[1] - sum[2] * sum[0]) / (n * sum[3] - sum[0] * sum[0]);
            var A = Math.pow(Math.E, (sum[2] - B * sum[0]) / n);

            for (var i = 0, len = data.length; i < len; i++) {
                var coordinate = [data[i][0], A * Math.pow(data[i][0], B)];
                results.push(coordinate);
            }

            var string = 'y = ' + Math.round(A * 100) / 100 + 'x^' + Math.round(B * 100) / 100;

            return { equation: [A, B], points: results, string: string };
        },

        polynomial: function (data, order) {
            if (typeof order == 'undefined') {
                order = 2;
            }
            var lhs = [], rhs = [], results = [], a = 0, b = 0, i = 0, k = order + 1;

            for (; i < k; i++) {
                for (var l = 0, len = data.length; l < len; l++) {
                    a += Math.pow(data[l][0], i) * data[l][1];
                }
                lhs.push(a), a = 0;
                var c = [];
                for (var j = 0; j < k; j++) {
                    for (var l = 0, len = data.length; l < len; l++) {
                        b += Math.pow(data[l][0], i + j);
                    }
                    c.push(b), b = 0;
                }
                rhs.push(c);
            }
            rhs.push(lhs);

            var equation = gaussianElimination(rhs, k);

            for (var i = 0, len = data.length; i < len; i++) {
                var answer = 0;
                for (var w = 0; w < equation.length; w++) {
                    answer += equation[w] * Math.pow(data[i][0], w);
                }
                results.push([data[i][0], answer]);
            }

            var string = 'y = ';

            for (var i = equation.length - 1; i >= 0; i--) {
                if (i > 1) string += Math.round(equation[i] * 100) / 100 + 'x^' + i + ' + ';
                else if (i == 1) string += Math.round(equation[i] * 100) / 100 + 'x' + ' + ';
                else string += Math.round(equation[i] * 100) / 100;
            }

            return { equation: equation, points: results, string: string };
        }
    };

    var regression = (function (method, data, order) {

        if (typeof method == 'string') {
            return methods[method](data, order);
        }
    });

    if (typeof exports !== 'undefined') {
        module.exports = regression;
    } else {
        window.regression = regression;
    }

}());