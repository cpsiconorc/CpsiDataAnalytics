YUI.add('element-seeker', function (Y) {
    Y.namespace('LogiInfo').ElementSeeker = Y.Base.create('ElementSeeker', Y.Base, [], {
        HOVER_CLASS: "studioElementSeekerHover",
        initializer: function () {
	        this.rdIdeIdx = null;
			this.active = false; // off
			this.listeners = null;
			this.ons = null;
			this.boundHover = null;
			this.boundClick = null;
			this.highlighterWidth = 1;

			this.highlighterTop = document.createElement("div");
			this.highlighterTop.style.display = "none";
			this.highlighterTop.style.width = "0";
			this.highlighterTop.style.height = this.highlighterWidth + "px";
			this.highlighterTop.style.position = "absolute";
			this.highlighterTop.style.zIndex = 9999;
			this.highlighterTop.className = this.HOVER_CLASS;

			this.highlighterRight = document.createElement("div");
			this.highlighterRight.style.display = "none";
			this.highlighterRight.style.width = this.highlighterWidth + "px";
			this.highlighterRight.style.height = "0";
			this.highlighterRight.style.position = "absolute";
			this.highlighterRight.style.zIndex = 9999;
			this.highlighterRight.className = this.HOVER_CLASS;

			this.highlighterBottom = document.createElement("div");
			this.highlighterBottom.style.display = "none";
			this.highlighterBottom.style.width = "0";
			this.highlighterBottom.style.height = this.highlighterWidth + "px";
			this.highlighterBottom.style.position = "absolute";
			this.highlighterBottom.style.zIndex = 9999;
			this.highlighterBottom.className = this.HOVER_CLASS;

			this.highlighterLeft = document.createElement("div");
			this.highlighterLeft.style.display = "none";
			this.highlighterLeft.style.width = this.highlighterWidth + "px";
			this.highlighterLeft.style.height = "0";
			this.highlighterLeft.style.position = "absolute";
			this.highlighterLeft.style.zIndex = 9999;
			this.highlighterLeft.className = this.HOVER_CLASS;

			document.body.appendChild(this.highlighterTop);
			document.body.appendChild(this.highlighterRight);
			document.body.appendChild(this.highlighterBottom);
			document.body.appendChild(this.highlighterLeft);

            // check to make sure Studio is listening before showing the icon
			this.sendStudioMessageDirect("Ping");
        },
        showIcon: function() {
            var imgs = document.getElementsByClassName("rdElementSeekerImage");
            var img;

            for (var i = 0; i < imgs.length; i++) {
                img = imgs[i];
                img.style.display = "";
            }
        },
		stopBubble: function (e) {
		    e = e || window.event;

		    if (!e)
		        return false;

			e.cancelBubble = true;

			if (e.stopPropagation)
				e.stopPropagation();

			if (e.preventDefault)
				e.preventDefault();

			return false;
		},
		activate: function(e, fromParent) {
		    // if this window has a parent window with an element seeker, then cancel must be called from the parent window.
		    if (fromParent !== true
            && window.parent
            && window.parent !== window.self
            && window.parent.LogiXML
            && window.parent.LogiXML.ElementSeeker)
		        return window.parent.LogiXML.ElementSeeker.activate(e);

            if (this.active) {
                this.cancel();
                return false;
            }

			this.listeners = [];
			this.ons = [];

			var _boundHover = this.hover.bind(this);
			var _boundClick = this.click.bind(this);

			this.boundHover = _boundHover;
			this.boundClick = _boundClick;

			var fxAddEvents = function (ele) {
                if (ele.id == "rdElementSeeker_Action")
                    return;

				if (ele.addEventListener) {
					ele.addEventListener("mouseover", _boundHover);
					ele.addEventListener("click", _boundClick);
				}
				else {
					ele.attachEvent("onmouseover", _boundHover);
					ele.attachEvent("onclick", _boundClick);
				}

				this.listeners.push(ele);
			}.bind(this);

            var fxDisableOnClick = function (ele) {
                if (ele.id == "rdElementSeeker_Action")
                    return;

				var attr, onAttrs;
				var bFound = false;

				for (var i = ele.attributes.length - 1; i >= 0; i--) {
					attr = ele.attributes[i];

					if (attr.name.toLowerCase().indexOf("on") === 0) {
						ele.setAttribute("rdOrigOns_" + attr.name, attr.value);
						ele.removeAttribute(attr.name);
						bFound = true;
					}
				}

				if (bFound)
					this.ons.push(ele);

				for (var i = 0; i < ele.childNodes.length; i++) {
					var child = ele.childNodes[i];

					if (child.tagName)
						fxDisableOnClick(child);
				}
			}.bind(this);

			for (var i = 0; i < document.body.childNodes.length; i++) {
				var child = document.body.childNodes[i];

				if (child.tagName) {
					fxDisableOnClick(child);
					fxAddEvents(child);
				}
			}

			rdAddCssClass(document.body, "elementSeekerCursor");
			rdAddCssClass(document.body.parentNode, "elementSeekerCursor");

			var iframes = document.getElementsByTagName("iframe");
			for (var i = 0; i < iframes.length; i++) {
			    var logiFrame = iframes[i].contentWindow.LogiXML;
			    
                if (logiFrame && logiFrame.ElementSeeker)
			        logiFrame.ElementSeeker.activate(e, true);
			}


		    //generic way to create overflow div to handle ES click
			var itemsToOverflow = ['.rdChartCanvas', 'table[id^=rdPopupPanelTable_popupEditAgViz]']
			for (var j = 0; j < itemsToOverflow.length; j++) {
			    var selectedItems = document.querySelectorAll(itemsToOverflow[j]);
			    for (var i = 0; i < selectedItems.length; i++) {
			        var itemToOverflow = selectedItems[i];
			        var overflowWrapper = itemToOverflow.ownerDocument.createElement("div");
			        if (itemToOverflow.tagName.toLowerCase() == "table") {
			            overflowWrapper = itemToOverflow.ownerDocument.createElement("thead");
			        }
			        var clientRect = itemToOverflow.getBoundingClientRect();
			        overflowWrapper.className = "es-overflow-wrapper";
			        overflowWrapper.style.top = '0px';
			        overflowWrapper.style.left = '0px';
			        overflowWrapper.style.position = "absolute";
			        overflowWrapper.style.zIndex = "9999";
			        overflowWrapper.style.width = clientRect.width + 'px';
			        overflowWrapper.style.height = clientRect.height + 'px';
			        itemToOverflow.appendChild(overflowWrapper);
			        fxAddEvents(overflowWrapper);
			    }
			}
			
			this.setImageActive(true);
			this.active = true;

			return this.stopBubble(e);
        },
        addPage: function (rdReport) {
            this.pages = this.pages || [];
            this.pages.push({
                rdReport: rdReport,
                doc: document
            });
        },
		setImageActive: function (active) {
		    var imgs = document.getElementsByClassName("rdElementSeekerImage");
		    var img, bCurActive;

		    active = active ? true : false;

		    for (var i = 0; i < imgs.length; i++) {
		        img = imgs[i];

		        img.src = img.src.replace("Hover", "")

		        var idx = img.src.lastIndexOf(".");

		        if (idx < 0)
		            bCurActive = (img.src.toLowerCase().indexOf("active") === img.src.length - 6);
		        else
		            bCurActive = (idx >= 6 && img.src.substr(idx - 6, 6).toLowerCase() === "active");

		        if (bCurActive == active)
		            continue;

		        if (active) {
		            img.title = "Click in a highlighted region.";

		            if (idx < 0)
		                img.src = img.src + "Active";
		            else if (idx == 0)
		                img.src = "Active" + img.src;
		            else
		                img.src = img.src.substr(0, idx) + "Active" + img.src.substr(idx);
		        }
		        else {
		            img.title = "Seek an element in Logi Studio.";

		            if (idx < 0)
		                img.src = img.src.substr(0, img.src.length - 6);
		            else if (idx == 6)
		                img.src = img.src.substr(idx);
		            else
		                img.src = img.src.substr(0, idx - 6) + img.src.substr(idx);
		        }
		    }
		},
		cancel: function (fromParent) {
		    // if this window has a parent window with an element seeker, then cancel must be called from the parent window.
		    if (fromParent !== true
            && window.parent
            && window.parent !== window.self
            && window.parent.LogiXML
            && window.parent.LogiXML.ElementSeeker)
		        return window.parent.LogiXML.ElementSeeker.cancel();

		    this.clear();

			if (!this.active)
				return;

			if (this.ons) {
				var ele;

				for (var i = 0; i < this.ons.length; i++) {
					ele = this.ons[i];

					for (var j = ele.attributes.length - 1; j >= 0; j--) {
						attr = ele.attributes[j];

						if (attr.name.length > 10 && attr.name.toLowerCase().indexOf("rdorigons_") === 0) {
							ele.setAttribute(attr.name.substr(10), attr.value);
							ele.removeAttribute(attr.name);
						}
					}
				}

				this.ons = null;
			}

			if (this.listeners) {
				var ele;
				var _boundHover = this.boundHover;
				var _boundClick = this.boundClick;

				for (var i = 0; i < this.listeners.length; i++) {
					ele = this.listeners[i];

					if (ele.removeEventListener) {
						ele.removeEventListener("mouseover", _boundHover);
						ele.removeEventListener("click", _boundClick);
					}
					else {
						ele.detachEvent("onmouseover", _boundHover);
						ele.detachEvent("onclick", _boundClick);
					}
				}

				this.listeners = null;
			}

			var highlighters = document.getElementsByClassName(this.HOVER_CLASS);
			for (var i = 0; i < highlighters.length; i++) {
			    highlighters[i].style.display = "none";
			}

			rdRemoveCssClass(document.body, "elementSeekerCursor");
			rdRemoveCssClass(document.body.parentNode, "elementSeekerCursor");

            // cancel children
			var iframes = document.getElementsByTagName("iframe");
			for (var i = 0; i < iframes.length; i++) {
			    var logiFrame = iframes[i].contentWindow.LogiXML;

			    if (logiFrame && logiFrame.ElementSeeker)
			        logiFrame.ElementSeeker.cancel(true);
			}

		    //REPDEV-20530 remove chart canvas overflow for ES
			var wrappers = document.getElementsByClassName("es-overflow-wrapper");
			while (wrappers[0]) {
			    wrappers[0].parentNode.removeChild(wrappers[0]);
			}

			this.setImageActive(false);

			this.active = false;
		},
		clear: function () {
			//var previouslyHoveredElements = document.getElementsByClassName(this.HOVER_CLASS);

			//for (var i = 0; i < previouslyHoveredElements.length; i++) {
			//	Y.one(previouslyHoveredElements[i]).removeClass(this.HOVER_CLASS);
			//}
		},
		hover: function (e) {
			e = e || window.event;

			var target = e.target;

			while (target) {
			    if (target.getAttribute && target.getAttribute("rdIdeIdx")) {
			        this.setActiveElement(target);
			        break;
			    }

			    target = target.parentNode;
			}

			return this.stopBubble(e);
		},
		setActiveElement: function(ele) {
		    this.clear();

		    var eleHighlight = ele

		    //Find the table for interactive paging.  REPDEV-20545
            if (eleHighlight.tagName.indexOf("RDCONDELEMENT") != -1) {
                eleHighlight = eleHighlight.firstChild.firstChild
            }
            if (eleHighlight.firstChild && eleHighlight.firstChild.tagName == "RDINTERACTIVEPAGING") {
                eleHighlight = eleHighlight.firstChild.firstChild 
            }

            console.log(eleHighlight.tagName)


		    var rect = eleHighlight.getBoundingClientRect();
		    var width = rect.right - rect.left;
		    var height = rect.bottom - rect.top;

		    var top = rect.top;
		    var left = rect.left;

		    var offsetElement = ele.offsetElement || document.body;
		    while (offsetElement) {
		        if (offsetElement === document.body) {
		            top += (document.body.scrollTop + document.body.parentNode.scrollTop);
		            left += (document.body.scrollLeft + document.body.parentNode.scrollLeft);
		            break;
		        }

		        top += offsetElement.scrollTop;
		        left += offsetElement.scrollLeft;
		        offsetElement = offsetElement.offsetParent;
		    }

		    this.rdIdeIdx = ele.getAttribute("rdIdeIdx");

		    this.highlighterTop.style.width = width + "px";
		    this.highlighterTop.style.top = top + "px";
		    this.highlighterTop.style.left = left + "px";
		    this.highlighterTop.style.display = "block";

		    this.highlighterRight.style.height = height + "px";
		    this.highlighterRight.style.top = top + "px";
		    this.highlighterRight.style.left = (left + width - this.highlighterWidth) + "px";
		    this.highlighterRight.style.display = "block";

		    this.highlighterBottom.style.width = width + "px";
		    this.highlighterBottom.style.top = (top + height - this.highlighterWidth) + "px";
		    this.highlighterBottom.style.left = left + "px";
		    this.highlighterBottom.style.display = "block";

		    this.highlighterLeft.style.height = height + "px";
		    this.highlighterLeft.style.top = top + "px";
		    this.highlighterLeft.style.left = left + "px";
		    this.highlighterLeft.style.display = "block";
		},
		click: function (e) {
		    e = e || window.event;

		    var ele = e.target;

		    if (!ele || ele.id === "rdElementSeeker_Image")
		        return this.stopBubble(e);

			this.cancel();

			this.sendStudioMessageDirect("Seek");

			this.rdIdeIdx = null;

			return this.stopBubble(e);
		},
		sendStudioMessageDirect: function (type) {
		    var rdIdeIdx;

		    switch (type) {
		        case "Seek":
		            rdIdeIdx = this.rdIdeIdx;
		            break;
		        case "Ping":
		            rdIdeIdx = "0";
		            break;
		        default:
		            return;
		    }

		    if (rdIdeIdx === null)
		        return;

            var afterPageAdded = function () {
                if (!this.pages || !this.pages.length)
                    return setTimeout(afterPageAdded, 300);

                var reportID;

                for (var i = 0; i < this.pages.length; i++) {
                    var page = this.pages[i];
                    if (page.doc === document) {
                        reportID = page.rdReport;
                        break;
                    }
                }

                var isMobileReport = LogiXML.getUrlParameter(location.href.toString(), "rdMobile");
                var xml = window.document.implementation.createDocument("", "", null);
                var docEle = xml.createElement("ServerMessage");

                var parentHiddenInput = document.getElementsByName("rdParentReport")[0];
                if (parentHiddenInput) {
                    reportID = parentHiddenInput.value;
                }

                docEle.setAttribute("ReportID", reportID || "");
                docEle.setAttribute("rdIdeIdx", rdIdeIdx);
                docEle.setAttribute("Type", type);
                if (isMobileReport) {
                    docEle.setAttribute("IsMobileReport", isMobileReport)
                }
                xml.appendChild(docEle);

                var payload = (new XMLSerializer()).serializeToString(xml);
                var sUrl = document.getElementById("rdElementSeekerUrl").value;

                try {
                    Y.io(sUrl, {
                        method: "POST",
                        data: payload,
                        headers: {
                            "Content-Type": "text/plain"
                        },
                        on: type == "Seek" ? {
                            success: function () {
                                // console.log("Element Locator message sent successfully to Logi Studio");
                            },
                            failure: function () {
                                console.log('The Element Seeker connection was refused because this application is not open in Studio. To disable the Element Seeker, open this application in Studio, then select "No Element Seeker" in the Debug menu.');
                            }
                        } : { // "Ping"
                                success: this.showIcon,
                                failure: function () {
                                    console.log('The Element Seeker connection was refused because this application is not open in Studio. To disable the Element Seeker, open this application in Studio, then select "No Element Seeker" in the Debug menu.');
                                }
                            }
                    });
                }
                catch (e) {
                    console.log(e);
                }
            }.bind(this);

            afterPageAdded();
        },
        onMouseOver: function (img) {
            if (LogiXML.ElementSeeker.active)
                return;

            img.setAttribute('src', 'rdTemplate/rdElementSeeker/rdElementSeekerHover.png')
        },
        onMouseOut: function (img) {
            if (LogiXML.ElementSeeker.active)
                return;

            img.setAttribute('src', 'rdTemplate/rdElementSeeker/rdElementSeeker.png')
        }
	},
	{
	    NAME: 'elementseeker',
		ATTRS : {},
	});
}, '1.0.0', {requires: []});
