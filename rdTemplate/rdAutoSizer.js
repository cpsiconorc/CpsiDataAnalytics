//19105
Y.on('windowresize', function (e) {

    //Reduce all charts
    Y.all('.autoSize').each(function (nodeIn) {
        //Replace with wait image and make size 1 px
        var url = nodeIn.get('src');
        url = url.replace('rdTemplate/rdChart2.aspx', 'rdTemplate/rdChart2.aspx');
        nodeIn.setStyle('width', '1px');
        nodeIn.removeAttribute('width');
        nodeIn.removeAttribute('height');
        nodeIn.set('src', url);
    });

    //Resize all charts
    Y.all('.autoSize').each(function (nodeIn) {
            
            var url = nodeIn.get('src');
            //Get URL minus resize width
            url = url.replace('rdTemplate/rd1x1Trans.gif', 'rdTemplate/rdChart2.aspx');
            var temp = url.split("&rdResizeWidth");
            //Chart is wrapped in a span, so we need the offset parent, not necessarily the direct parent
            var parent = nodeIn.getDOMNode().offsetParent;
            var offsetWidth = parent.clientWidth;
            if (offsetWidth <= 0)
                offsetWidth = parent.offsetWidth;
            if (Y.Lang.isValue(parent.nodeName) && parent.nodeName.toLowerCase() == "div" && parent.id == "rdMainBody")
                offsetWidth = document.documentElement.clientWidth;
            if (offsetWidth > document.documentElement.clientWidth) {
                offsetWidth = document.documentElement.clientWidth;
            }
            //Minimum width of chart needed to avoid 404 error
            if (offsetWidth < 10)
                offsetWidth = 10;

            //Set the URL & width
            url = temp[0] + '&rdResizeWidth=' + offsetWidth;
            nodeIn.setStyle('width', offsetWidth + 'px');
            nodeIn.removeAttribute('width');
            nodeIn.removeAttribute('height');
            nodeIn.set('src', url);

    });
});