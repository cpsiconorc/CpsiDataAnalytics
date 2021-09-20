var sReqCacheHtml = document.getElementById("rdButtonRedirect").parentNode.parentNode.innerHTML;
sReqCacheHtml = sReqCacheHtml.substring(sReqCacheHtml.indexOf("?") + 1);
sReqCacheHtml = sReqCacheHtml.substring(0, sReqCacheHtml.indexOf("'")).replace(/&amp;/g, '&');
sReqCacheHtml = eval('"' + sReqCacheHtml + '"');

var sHref = window.location.href;

if (sHref.indexOf("?") == -1)
    sHref += "?rdMobile=";
else
    sHref += "&rdMobile=";

if (typeof rdMaxMobileScreenSize === "undefined" || !rdMaxMobileScreenSize || screen.width > rdMaxMobileScreenSize)
    sHref += "False";
else
    sHref += "True";

if (((sHref.indexOf("rdReport=../../rdDownload") == -1) && (sReqCacheHtml.indexOf("rdReport=../../rdDownload") > -1))) {
    sHref += "&" + sReqCacheHtml;
}
window.location.replace(sHref);
