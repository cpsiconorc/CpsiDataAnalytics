function rdShowDrillthroughIcon(eleContainer,bShow) {
    //Empty cell?
    var sCellContent;
    if (eleContainer.textContent != undefined) {
        sCellContent = eleContainer.textContent; //Mozilla, Webkit
    } else {
        sCellContent = eleContainer.innerText; //IE
    }
    if (sCellContent.replace(/ /g, '').replace(/\u00a0/g, '').length==0) { // \u00a0 is &nbsp;
        bShow = false; //No drillthrough for empty cells.
    }
	
	Y.one(eleContainer).all('a').each(
        function (node) {
            nodeclick = node.get('onclick');
            if (nodeclick != undefined) {
                if (String(nodeclick).indexOf("Drillthrough") != -1) {
                    var eleImage = node.one('img');
                    //init image if not loaded
                    eleImage.set('src', "rdTemplate/rdGroupDrillthrough/rdDrillthrough.gif");
                    if (bShow)
                        eleImage.setStyle('visibility', 'visible');
                    else
                        eleImage.setStyle('visibility', 'hidden');
                }
            }
		}
	);
}
