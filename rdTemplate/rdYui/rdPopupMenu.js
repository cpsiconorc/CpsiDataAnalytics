YUI.add('popupmenu', function(Y) {

	var YAHOO = Y.YUI2,
		_menu;	

	Y.namespace('LogiXML').PopupMenu = Y.Base.create('popupmenu', Y.Base, [], {
	
		initializer : function() {
			this.initializePopupMenus(); 
			LogiXML.Ajax.AjaxTarget().on('reinitialize', Y.bind(this.initializePopupMenus, this));
		},
		
		initializePopupMenus: function () {
			var menulinks = Y.all('.rdPopupMenuActivate');
			
			menulinks.each( function(initLink) {			
				initLink.removeClass('rdPopupMenuActivate');
				
				var dhtmlEvent = 'click';
				if (Y.Lang.isValue(initLink.getData('dhtmlevent')))
					dhtmlEvent = initLink.getData('dhtmlevent')
				initLink.setData('ppObject', this);
				initLink.on(dhtmlEvent, Y.bind(this.rdShowPopupMenu, this, initLink.get('id'), initLink.getData('popuplocation')));

				var sMenuId = initLink.get('id');
				var sPopupId; //Add rdPopup to the ID. For tables, it goes befor _Row#, For crosstabs, it needs to go before _Ct#
				if (sMenuId.indexOf("_CtCol") != -1) {
				    sPopupId = sMenuId.replace("_CtCol", "_rdPopup_CtCol");
				}
				else if (sMenuId.indexOf("_Row") != -1) {
				    sPopupId = sMenuId.replace("_Row", "_rdPopup_Row");
				}
				else {
				    sPopupId = sMenuId + "_rdPopup";
				}
				var popup = Y.one('#' + sPopupId);
				if (popup) {
				    popup.setStyle('left', '-9999.33');
				    popup.setStyle('top', '-10000');
				}

			}, this);
		},
		rdShowPopupMenu: function(sMenuId, sPopupLocation) {
		    if (Y.Lang.isValue(this._menu)) {
				this._menu.hide(this._menu);
				YAHOO.widget.MenuManager.removeMenu(this._menu);    //#12703.
		    }

			var sPopupId  //Add rdPopup to the ID. For tables, it goes befor _Row#, For crosstabs, it needs to go before _Ct# 
			if (sMenuId.indexOf("_CtCol") !=-1) { 
				sPopupId = sMenuId.replace("_CtCol", "_rdPopup_CtCol"); 
			} 
			 else if (sMenuId.indexOf("_Row") != -1)  { 
				sPopupId = sMenuId.replace("_Row","_rdPopup_Row");
			} 
			 else { 
				sPopupId = sMenuId + "_rdPopup" ;
			} 

		    //Special case for conditioned menu options. 24118
            var popup = Y.one('#' + sPopupId);

            // selector above does not find popup under subdata table.
            if (!popup)
                popup = Y.one(document.getElementById(sPopupId));

			if (!popup) {
				popup = document.getElementById(sMenuId);
				if (popup) {
					popup = popup.getElementsByClassName("rdPopupMenu");
					if (popup.length)
						popup = popup[0];
					else
						popup = null;
				}

				if (!popup)
					throw "Popup with id " + sPopupId + " was not found";

				sPopupId = popup.getAttribute("id");
				popup = Y.one(popup);
			}

            var ul = popup.all("UL");           
			if (ul) {
				var li = ul.get('childNodes');
				if (li && li[0]) {
					li = li[0];
					for (var i = 0; i < li._nodes.length; i++) {
						var item = li._nodes[i];
						if (item && item.nodeName && item.nodeName.toLowerCase().indexOf("rdcondelement") >= 0) {
							ul.insertBefore(item.firstChild, item);
							item.parentNode.removeChild(item);
						}
					}
				}
			}

			if (sMenuId.indexOf('ppPanelMenu') > -1) {
			    var eleDivDashboardPanels = document.getElementById("rdDivDashboardPanelTable");
			    var elePopupMenu = document.getElementById(sPopupId);
			    if (elePopupMenu.parentNode.id != "rdDivDashboardPanelTable") {
			        elePopupMenu.parentNode.removeChild(elePopupMenu);
			        eleDivDashboardPanels.appendChild(elePopupMenu);
			    }
			    if (typeof (rdMobileReport) != 'undefined') {
			        var dashboardId = "rdDashboardPanel-" + sMenuId.replace("ppPanelMenu_", "");
			        var elePanel = document.getElementById(dashboardId);
			        var elePanelPreviousSibling = elePanel.previousSibling;
			        var elePanelNextSibling = elePanel.nextSibling.nextSibling.nextSibling;
			        if (elePanelPreviousSibling.id.match('rdDashboardDropZone-0-0')) {
			            var eleOptionsList = elePopupMenu.getElementsByTagName('li')
			            for (i = 0; i < eleOptionsList.length; i++) {
			                var eleLI = eleOptionsList[i]
			                if (eleLI.innerHTML.match('Move Up')) {
			                    eleLI.style.display = 'none';
			                }
			            }

			        } else {
			            var eleOptionsList = elePopupMenu.getElementsByTagName('li')
			            for (i = 0; i < eleOptionsList.length; i++) {
			                var eleLI = eleOptionsList[i]
			                if (eleLI.innerHTML.match('Move Up')) {
			                    eleLI.style.display = '';
			                }
			            }
			        }

			        if (!elePanelNextSibling) {
			            var eleOptionsList = elePopupMenu.getElementsByTagName('li')
			            for (i = 0; i < eleOptionsList.length; i++) {
			                var eleLI = eleOptionsList[i]
			                if (eleLI.innerHTML.match('Move Down')) {
			                    eleLI.style.display = 'none';
			                }
			            }

			        } else {
			            var eleOptionsList = elePopupMenu.getElementsByTagName('li')
			            for (i = 0; i < eleOptionsList.length; i++) {
			                var eleLI = eleOptionsList[i]
			                if (eleLI.outerHTML.match('Move Down')) {
			                    eleLI.style.display = '';
			                }
			            }
			        }
			    }
			}

			var sLocation = "bl";
			if (sPopupLocation) {
				if (sPopupLocation.toLowerCase()=="right") {
					sLocation = "tr"; // top right
				}
			}
			
			//Special case for empty menu options. 10890
			var elePopup = document.getElementById(sPopupId);
			for (var i=elePopup.firstChild.firstChild.childNodes.length - 1; i > -1; i--) {
				var item = elePopup.firstChild.firstChild.childNodes[i];
				var sText;
				if (item.textContent != undefined) {
					sText = item.textContent; //Mozilla, Webkit
				} else {
					sText = item.innerText; //IE
				}
				if (sText == "") {
					//if (item.innerHTML.indexOf("Blank.gif") != -1) {
						item.parentNode.removeChild(item);
					//}
				}
			}
			if(elePopup.innerHTML.match("rdModalShade") && elePopup.innerHTML.match("rdPopupPanel")){   
				// Move the Modal and the Popup as Siblings to the Menu  for this to work #12652.
				try{
					var eleMenuList = elePopup.firstChild;
					var aMenuListItems;
						if(eleMenuList){
							while(eleMenuList) {
								if(!eleMenuList.tagName.toLowerCase().match("ul")) {
									eleMenuList = eleMenuList.firstChild;
								}
								else{
									aMenuListItems = eleMenuList.getElementsByTagName("li");
									break;
								}
							}                
						}
					for(var i = 0; i < aMenuListItems.length; i++){
						this.MovePopupPanelAsSiblingToPopupMenu(aMenuListItems[i], elePopup);   //19355
					}
				}catch(e){}
			}
			
			this._menu = YAHOO.widget.MenuManager.getMenu(sPopupId); //9899
		
			if (this._menu == undefined) {
				this._menu = new YAHOO.widget.Menu(sPopupId, { context: [sMenuId, "tl", sLocation] }); //tl:top left  bl:bottom left
				this._menu.render();
				this._menu.show(this._menu);
			} else { 
				//The popup menu already exists.
				this._menu.show(this._menu);
			}
			document.getElementById(this._menu.id).style.zIndex = '9999';
		},
		MovePopupPanelAsSiblingToPopupMenu: function(eleMenuListItem, elePopup) {
			// Move the Modal and the Popup as Siblings to the Menu.
			if(eleMenuListItem.innerHTML.match("rdModalShade") && eleMenuListItem.innerHTML.match("rdPopupPanel")) {
			    var eleModalDivs = eleMenuListItem.getElementsByTagName("div");
                //19355
				for(var x = 0; x < eleModalDivs.length; x++){
					if(eleModalDivs[x]){
						if(eleModalDivs[x].id){
							if(eleModalDivs[x].id.toLowerCase().match("rdmodalshade") || eleModalDivs[x].id.toLowerCase().match("ppaddbookmarks") || eleModalDivs[x].id.toLowerCase().match("ppeditbookmarks")){
								elePopup.parentNode.appendChild(eleModalDivs[x]);
								x = x-1;
							}
						}
					}
				}
			}
		}
	}, {
		// Y.PopupMenu properties
		
		/**
		 * The identity of the widget.
		 *
		 * @property PopupMenu.NAME
		 * @type String
		 * @default 'PopupMenu'
		 * @readOnly
		 * @protected
		 * @static
		 */
		NAME : 'popupmenu',
		
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
		
		}
	});		
}, '1.0.0', {requires: ['base', 'yui2-menu']});