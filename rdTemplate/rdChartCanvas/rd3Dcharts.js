var saveRotationStateFunc;
var addRotationMouseEvents = function (chart) {

    var oldEventMouseDown = chart.container.onmousedown;
    var oldEventMouseMove = chart.container.onmousemove;
    var oldEventMouseUp = chart.container.onmouseup;
    
    var chart3DmouseDownEventListener = function(e) {
        e = chart.pointer.normalize(e);

        var posX = e.pageX,
            posY = e.pageY,
            alpha = chart.options.chart.options3d.alpha,
            beta = chart.options.chart.options3d.beta,
            newAlpha,
            newBeta,
            sensitivity = 5;
        //fix for IE 7,8
        if (!e||!e.pageX||!e.pageY) {
            e = window.event;
            posX = e.clientX;
            posY = e.clientY;
        }
        var chart3DMouseMoveEventListener = function (e) {
            var newX,
                newY;
            //fix for IE 7,8
            if (!e || !e.pageX || !e.pageY) {
                e = window.event;
                newX = e.clientX;
                newY = e.clientY;
            } else {
                newX = e.pageX;
                newY = e.pageY;
            }
            // Run beta
            newBeta = beta + (posX - newX) / sensitivity;
            newBeta = Math.min(100, Math.max(-100, newBeta));
            chart.options.chart.options3d.beta = newBeta;

            // Run alpha
            newAlpha = alpha + (newY - posY) / sensitivity;
            newAlpha = Math.min(100, Math.max(-100, newAlpha));
            chart.options.chart.options3d.alpha = newAlpha;

            chart.redraw(false);
            if (saveRotationStateFunc) {
                saveRotationStateFunc(chart, chart.options.chart.options3d);
            }
        };
        chart.container.onmousemove = function(e) {
            if (oldEventMouseMove) {
                oldEventMouseMove(e);
            }
            chart3DMouseMoveEventListener(e);
        };
        chart.container.onmouseup = function(e) {
            if (oldEventMouseUp) {
                oldEventMouseUp(e);
            }
            chart3DremoveEventListeners(e);
        };
    };


    var chart3DremoveEventListeners = function (e) {
        chart.container.onmousemove = oldEventMouseMove;
        chart.container.onmouseup = oldEventMouseUp;
    };

    chart.container.onmousedown = function(e) {
        if (oldEventMouseDown) {
            oldEventMouseDown(e);
        }
        chart3DmouseDownEventListener(e);
    };
};