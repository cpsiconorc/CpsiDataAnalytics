/*
 * @license FusionCharts JavaScript Library
 * Copyright FusionCharts Technologies LLP
 * License Information at <http://www.fusioncharts.com/license>
 *
 * @author FusionCharts Technologies LLP
 * @version fusioncharts/3.3.1-sr3.21100
 * @id fusionmaps.VaticanCity.20.10-30-2012 07:14:53
 */
FusionCharts(["private","modules.renderer.js-vaticancity",function(){var p=this,k=p.hcLib,n=k.chartAPI,h=k.moduleCmdQueue,a=k.injectModuleDependency,i="M",j="L",c="Z",f="Q",b="left",q="right",t="center",v="middle",o="top",m="bottom",s="maps",l=false&&!/fusioncharts\.com$/i.test(location.hostname),r=!!n.geo,d,e,u,g;
d=[{name:"VaticanCity",revision:20,creditLabel:l,standaloneInit:true,baseWidth:320,baseHeight:250,baseScaleFactor:10,entities:{"EU.VA":{outlines:[[i,2063,230,j,1888,283,1869,252,1734,252,1608,281,1605,320,1445,372,1431,300,1222,311,1158,464,1194,524,941,765,f,917,767,907,749,865,744,832,773,803,821,815,869,j,833,896,740,1222,582,1277,489,1402,535,1447,f,401,1601,263,1717,j,215,1676,f,113,1723,17,1789,j,176,1908,252,1867,513,2127,467,2193,496,2242,f,552,2236,611,2229,672,2228,729,2211,j,730,2211,730,2134,f,994,2160,1255,2205,j,1255,2267,1427,2347,1754,2366,1755,2366,1766,2329,1781,2326,2157,2446,2188,2404,2157,2376,2160,2048,2268,2049,2286,2012,2635,1989,f,2754,2200,2995,2135,3127,2043,3144,1988,3161,1932,3169,1788,3172,1714,3124,1627,j,3122,1623,f,3075,1540,2981,1444,j,3029,577,2512,397,2478,216,2454,49,2145,151,2063,170,c]],label:"Vatican City",shortLabel:"VA",labelPosition:[196.3,124.7],labelAlignment:[t,v]}}}];
g=d.length;if(r){while(g--){e=d[g];n(e.name.toLowerCase(),e,n.geo);}}else{while(g--){e=d[g];u=e.name.toLowerCase();a(s,u,1);h[s].unshift({cmd:"_call",obj:window,args:[function(w,x){if(!n.geo){p.raiseError(p.core,"12052314141","run","JavaScriptRenderer~Maps._call()",new Error("FusionCharts.HC.Maps.js is required in order to define vizualization"));
return;}n(w,x,n.geo);},[u,e],window]});}}}]);