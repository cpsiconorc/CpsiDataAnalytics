function setIframeIOSScrolling()
{
	var is_ios = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
	if(is_ios)
	{
		var iframeCollection = document.getElementsByTagName('iframe');
		for(var i = 0; i < iframeCollection.length; i++)
		{
			iframeCollection[i].style = {};
			iframeCollection[i].parentNode.style["-webkit-overflow-scrolling"] = "touch";
			iframeCollection[i].parentNode.style["overflow"] = "scroll";
		}
	}
}