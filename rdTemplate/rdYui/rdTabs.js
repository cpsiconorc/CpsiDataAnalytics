YUI.add('tabs', function(Y) {

	var YAHOO = Y.YUI2,
		CLASS_KEY = 'tabs';
		
	// Register Highlight class with custom destroy code
	Y.LogiXML.Node.destroyClassKeys.push( CLASS_KEY );

	Y.namespace('LogiXML').Tabs = Y.Base.create('Tabs', Y.Base, [], {
	
		/*
         * Initialization Code: Sets up privately used state
         * properties, and publishes the events Tooltip introduces
         */
	    configNode: null,
        initializer : function(config) {
			
            this.configNode = config;
			this.set('_id', config.id);
			this.set('_orientation', config.orientation);
			this.set('reportID', config.reportid);
			//Check for mobile tab mode
			this.set('isMobile', config.isMobile);

			this.initializeTabs();
			
			//18588 Initialize iframes
			LogiXML.SubReport.initSubReports();
			this.TabsTarget().fire('selectedTabChanged');
			
            //Attach Ajax refresh
			if (LogiXML.StartupScripts && LogiXML.StartupScripts.tabsInit) {
			    LogiXML.Ajax.AjaxTarget().detach('reinitialize', LogiXML.StartupScripts.tabsInit);
            }

            var tabsInit = Y.LogiXML.Tabs.prototype.initializeTabs.bind(this);

            LogiXML.Ajax.AjaxTarget().on('reinitialize', tabsInit);

			if (LogiXML.StartupScripts) {
			    LogiXML.StartupScripts.tabsInit = tabsInit;
			}
			
		},		
		destructor: function() {
			_tabs.unsubscribeAll('activeTabChange');
		},
		initializeTabs: function() {
		
			var thisid = this.get('_id');
			var tabsID = 'rdTabs-' + thisid;


			var tabNode = Y.one('#' + tabsID);
            //20296 -- tabs have already been initialized 21406
			if (!Y.Lang.isNull(tabNode) && Y.Lang.isValue(tabNode._data)) {
			    return;
			}

			_tabs = null;
			_tabs = new YAHOO.widget.TabView(tabsID,{orientation: this.get('_orientation')});

			if (Y.Lang.isNull(tabNode)) return;     //#18992.
			//Attach for destructor
			tabNode.setData(CLASS_KEY, this);
			
			//Init values for hidden inputs
            //Set tab index and attach event			
			_tabs.addListener('activeTabChange', this.rdSaveActiveTabIndex);
			_tabs.addListener('activeTabChange', this.rdTabsShowTabContents);
			_tabs.addListener('activeTabChange', this.rdTabsSetMinWidth);

			var activeIndex = _tabs.get('activeIndex');
		    if (!activeIndex) {
		        activeIndex = 0;
		        _tabs.set("activeTab", _tabs.getTab(activeIndex), false);
		    }
		    document.getElementById('rdActiveTabIndex_' + thisid).value = activeIndex;
		    document.getElementById('rdActiveTabId_' + thisid).value = _tabs.getTab(activeIndex).get('id');		    
		    var isiPad = navigator.userAgent.match(/iPad/i) != null;        //#21530
			var isiPod = navigator.userAgent.match(/iPod/i) != null;
			var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
			if (isiPad || isiPhone || isiPod) {
			    Y.Node.all('#rdTabs ul li').each(function (node) {
			        node.on('touchend', function (e) {
			            if (!LogiXML.Tabs[0].get('wasDragged')) {
			                var tabs = _tabs.get('tabs'),
			                    tabId = e.currentTarget.get('id'),
                                i = 0, length = tabs.length, iTab;
			                for (; i < length; i++) {
			                    iTab = tabs[i];
			                    if (tabId == iTab.get('id')) {
			                        _tabs.set("activeTab", iTab, false);
			                        break;
			                    }
			                }
			                //e.currentTarget._node.childNodes[0].click();
			            }
			            LogiXML.Tabs[0].set('wasDragged', false)
			        });
			    });
			}

			this.rdTabsSetMinWidth();
		    //Make the tabs draggable
			if ((!Y.Lang.isNull(Y.one('#rdDraggableTabs'))) && this.get('_id') == 'rdDashboardTabs') {
			    this.rdDraggableTabs();
			}
		},
		rdDraggableTabs: function () {
		    YUI().use('dd-constrain', 'dd-proxy', 'dd-drop', function (Y) {
		        //Listen for all drop:over events
		        Y.DD.DDM.on('drop:over', function (e) {
		            //Get a reference to our drag and drop nodes
		            var drag = e.drag.get('node'),
                        drop = e.drop.get('node');
		            dropTab = drop;
		            if (dragDirection === 'right') {
		                if (drop.get('nextSibling') != null) {
		                    drop = drop.get('nextSibling');
		                    e.drop.get('node').get('parentNode').insertBefore(drag, drop);
		                } else {
		                    drop.get('parentNode').appendChild(drag);
		                }
		               
		            } else {
		                e.drop.get('node').get('parentNode').insertBefore(drag, drop);
		            }		            
		            //Resize this nodes shim, so we can drop on it later.
		            e.drop.sizeShim();
		        });
		        //Listen for all drag:drag events
		        Y.DD.DDM.on('drag:drag', function (e) {
		            //Get the last y point
		            var y = e.target.lastXY[1];
		            //is it greater than the lastY var?
		            if (y < lastY) {
		                //We are going up
		                goingUp = true;
		            } else {
		                //We are going down.
		                goingUp = false;
		            }
		            //Cache for next check
		            lastY = y;

		            //Get the last X point
		            var x = e.target.lastXY[0];
		            //is it greater than the lastY var?
		            if (x < lastX) {
		                //We are going left.
		                dragDirection = 'left';
		            } else if (x > lastX) {
		                //We are going to the right.
		                dragDirection = 'right';
		            } else if(x === lastX){
		                //We are stuck at the left.
		                dragDirection = 'left';
		            }
		            //Cache for next check
		            lastX = x;
		            LogiXML.Dashboard.pageDashboard.rdPositiontabSettingsCog();
		        });
		        //Listen for all drag:start events
		        Y.DD.DDM.on('drag:start', function (e) {
		            LogiXML.Tabs[0].set('wasDragged', true)
		            //Get our drag object
		            var drag = e.target;
		            //Set some styles here
		            drag.get('node').setStyle('opacity', '.25');
		            drag.get('dragNode').set('innerHTML', drag.get('node').get('innerHTML'));
		            drag.get('dragNode').setStyles({
		                opacity: '.5',
		                borderColor: drag.get('node').getStyle('borderColor'),
		                backgroundColor: drag.get('node').getStyle('backgroundColor')
		            });
		        });
		        //Listen for a drag:end events
		        Y.DD.DDM.on('drag:end', function (e) {
		            var drag = e.target;
		            //Put our styles back
		            drag.get('node').setStyles({
		                visibility: '',
		                opacity: '1'
		            });
		            //if (!bDropHit) {
		            var lis = Y.Node.all('#rdTabs-rdDashboardTabs>#rdTabs ul li');
		                lis._nodes[lis._nodes.length - 1].getAttribute("id");
		                var rdParams = "&rdReport=" + document.getElementById("rdDashboardDefinition").value
		                rdParams += "&TabID=" + e.target.get("node").getAttribute("id");
		                if (Y.Lang.isNull(dropTab)) return; //#21954.
		                rdParams += "&TargetTabID=" + dropTab.getAttribute("id");
		                rdParams += "&DragDirection=" + dragDirection;
		                rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=MoveDashboardTab' + rdParams)
		                LogiXML.Dashboard.pageDashboard.rdPositiontabSettingsCog();
		            //}
		        });
		        //Listen for all drag:drophit events
		        Y.DD.DDM.on('drag:drophit', function (e) {
		            var drop = e.drop.get('node'),
                        drag = e.drag.get('node');

		            //if we are not on an li, we must have been dropped on a ul
		            if (drop.get('tagName').toLowerCase() !== 'li') {
		                if (!drop.contains(drag)) {
		                    drop.appendChild(drag);
		                }
		            }
		        });

		        //Static Vars
		        var goingUp = false, lastY = 0, lastX = 0, dragDirection = 'right', bDropHit = false, dropTab = null;

		        //Get the list of li's in the lists and make them draggable
		        var lis = Y.Node.all('#rdTabs-rdDashboardTabs>#rdTabs ul li');
		        lis.each(function (v, k) {
		            var dd = new Y.DD.Drag({
		                node: v,
		                target: {
		                    padding: '0 0 0 20'
		                }
		            }).plug(Y.Plugin.DDProxy, {
		                moveOnEnd: false
		            }).plug(Y.Plugin.DDConstrained, {
		                constrain2node: '#rdTabs-rdDashboardTabs>#rdTabs'
		            }).removeInvalid('a');
		        });

		        //Create simple targets for the 2 lists.
		        var uls = Y.Node.all('#rdTabs-rdDashboardTabs>#rdTabs ul li');
		        uls.each(function (v, k) {
		            var tar = new Y.DD.Drop({
		                node: v
		            });
		        });
		    });
		},
		rdSaveActiveTabIndex : function(e) {
			var activeIndex = this.getTabIndex(e.newValue);
			var id = this.get('id');
			var elementID = id.substring(id.indexOf('-') + 1);
			
			document.getElementById('rdActiveTabIndex_' + elementID).value = activeIndex;			 
			document.getElementById('rdActiveTabId_' + elementID).value = e.newValue.get('id');
			
		},
		rdTabsShowTabContents : function(e) {
			var tabInstance = Y.one('#' + this.get('id')).getData('tabs');			
			if (tabInstance.get('isMobile') && e.newValue.get('id') == 'rdTabAddNewTab') {
				this.set('activeIndex', 0);
				ShowElement(this.get('id'), 'pnlMobileDashboardTabs', 'Show');
				return false;
			}
							
			var id = this.get('id');
			var elementID = id.substring(id.indexOf('-') + 1);			
			
			if (Y.Lang.isValue(Y.rdSlider))
				rdShowHiddenInputSliders(document.getElementById(elementID));

			var activeTab = this.get('activeTab');
			var sActiveTabId = activeTab.get('id');
            var breflowCharts = true;
            var waitCfg = ['', '', ''];
						
			//The tab's contents may need to come from a RefreshElement.
			var eleActiveTab = document.getElementById("rdTabPanel_" + sActiveTabId)
			if (eleActiveTab.innerHTML.indexOf("SubmitForm(") == 0) {
				var sRefreshPageFunction = eleActiveTab.innerHTML;
                sRefreshPageFunction = sRefreshPageFunction.replace("&amp;rdRequestForwarding", "&rdRequestForwarding"); //12458
				breflowCharts = false;
                eleActiveTab.innerHTML = "";
                rdShowWaitPanel(waitCfg);
				eval(sRefreshPageFunction);
				return;
			}
			var eleTabs = eleActiveTab.parentNode;
			if(eleTabs.parentNode != null){ //#17282.
				if(eleTabs.parentNode.getAttribute("sTabbingStyle") == "Ajax"){
					if (eleActiveTab.innerHTML.length == 0) {
						//Ajax Refresh
						rdAjaxRequestWithFormVars("rdAjaxCommand=RefreshElement&rdRefreshTabPanel=True&rdCurrTabId=" + sActiveTabId 
						+ "&rdRefreshElementID=rdTabPanel_" + sActiveTabId 
						+ "," + sActiveTabId 
						+ "&rdReport=" + tabInstance.get('reportID'), false, "",false,null,null, waitCfg);
					}
				}
			}

			if (eleTabs.parentNode.id == "rdTabs-rdDashboardTabs") {
			    breflowCharts = false;
			}
            			
			//In some cases, deselected tab panels don't get shown/hidden. Fix this.    
			for (var i=0; i < eleTabs.childNodes.length; i++) {
				if (eleTabs.childNodes[i].id == eleActiveTab.id) {
					eleTabs.childNodes[i].style.display="";
				}else{
					eleTabs.childNodes[i].style.display="none";
				}
			}
			
			//18588 Initialize iframes
			LogiXML.SubReport.initSubReports();
			
			//18897 An event is needed for other JS libs to attach to.
			tabInstance.TabsTarget().fire('selectedTabChanged');
			
		    //Resize charts in tabs that are not currently selected.
			var eleTabBody = Y.one('#' + eleActiveTab.id);
			if (breflowCharts == true) {			    
			    var listCharts = eleTabBody.all(".rdChartCanvas");
			    for (var i = 0; i < (listCharts.size()) ; i++) {
			        var eleChart = listCharts.item(i);
			        var chartcanvasObject = eleChart.getData("rdChartCanvas");
			        if (chartcanvasObject) {
			            chartcanvasObject.chart.reflow();
			        }
			    }
			}

		    //gmaps? RD21629
			var listGoogMaps = eleTabBody.all(".rdGoogleMap");
			for (var i = 0; i < (listGoogMaps.size()) ; i++) {
			    var eleGMap = listGoogMaps.item(i).getAttribute("id");
			    rdGmapLoad(eleGMap);
			}

			
		},
		TabsTarget : function() {
			if ( Y.LogiXML.Tabs._tabTarget === undefined )
			{
				Y.LogiXML.Tabs._tabTarget = new Y.EventTarget();
			}
				
			return Y.LogiXML.Tabs._tabTarget;
		},
		rdTabsSetMinWidth: function () {  //11744
			var activeTab = _tabs.get('activeTab');
			var sActiveTabId = activeTab.get('id');
			var minTabWidth = 0;
			
			//Set the width of a hidden table so that the tab's panel cannot be smaller than width of the tabs.
			//Get the current tab's label.
			var nodeTab = Y.one('#' + sActiveTabId);
			var marginRight = parseInt(nodeTab.getStyle('marginRight'));
			minTabWidth += nodeTab.get('offsetWidth') + marginRight;			
			
			//Add up the sibling widths
			nodeTab.siblings().each( function() {
				minTabWidth += this.get('offsetWidth') + marginRight;
			});		
			
			 //= nodeTab.get('offsetLeft') + nodeTab.get('offsetWidth');
			var nodeMinWidth = Y.one("#rdTabMinWidth_" + sActiveTabId);
			if ( Y.Lang.isValue(nodeMinWidth) ) {
				nodeMinWidth.setStyles({
					width: minTabWidth + "px",
					display: "block"
				});
			}
		}
	}, {
		// Y.Tabs properties
		
		/**
		 * The identity of the widget.
		 *
		 * @property Tabs.NAME
		 * @type String
		 * @default 'WaitPanel'
		 * @readOnly
		 * @protected
		 * @static
		 */
		NAME : 'tabs',
		
		/**
		 * Static property used to define the default attribute configuration of
		 * the Widget.
		 *
		 * @property SliderBase.ATTRS
		 * @type {Object}
		 * @protected
		 * @static
		 */
		ATTRS : {
			_id: {},
			_tabs: {},
			_orientation: {},
			reportID: {},
			isMobile: {},
			wasDragged: {}
		}
	});		
}, '1.0.0', {requires: ['base', 'node-custom-destroy', 'yui2-tabview']});
