// JSLint options:
/*global LogiXML, YUI, document, window*/
//18934

YUI.add('waitpanel', function (Y) {
	
    var DEFAULTWAITMESSAGE = '';
    var DEFAULTCLASS = '';
    var DEFAULTCAPTIONCLASS = '';
	
	Y.namespace('LogiXML').WaitPanel = Y.Base.create('WaitPanel', Y.Base, [], {
	
		/*
         * Initialization Code: Sets up privately used state
         * properties, and publishes the events Tooltip introduces
         */
        initializer : function(config) {
            this._intervalKey = 0;

            if (config) {
                if (config.defaultCaption)
                    DEFAULTWAITMESSAGE = config.defaultCaption;

                if (config.defaultClass)
                    DEFAULTCLASS = config.defaultClass;

                if (config.defaultCaptionClass)
                    DEFAULTCAPTIONCLASS = config.defaultCaptionClass;
            }
			
			this.initPageWaitFrames(); 
			
			//Ajax reinit handler
			LogiXML.Ajax.AjaxTarget().on('reinitialize', this.initPageWaitFrames, this);
			
			//Tabchange handler
			if (Y.Lang.isValue(Y.LogiXML.Tabs))
				Y.LogiXML.Tabs.prototype.TabsTarget().on('selectedTabChanged', this.initPageWaitFrames, this);
			
			//Initialize waitall image for chrome
			document.body.insertBefore(Y.Node.create('<div style="display: none; background-image: url(\'rdTemplate/rdWaitAll.gif\')" />').getDOMNode(), document.body.children[0]);
        },

        // returns true if a difference was found - ignores yui classes
        compareCss: function (ele1, ele2) {
            var css1 = ele1.className.split(" ");
            var css2 = ele2.className.split(" ");

            var i, j;
            for (i = css1.length - 1; i >= 0; i--) {
                var css1_ = css1[i];

                if (css1_.indexOf("yui") == 0) {
                    css1.splice(i, 1);
                } else {
                    var match = false;

                    for (j = css2.length - 1; j >= 0; j--) {
                        var css2_ = css2[j];
                        if (css2_.indexOf("yui") == 0)
                            css2.splice(j, 1);
                        else if (css2_ == css1_) {
                            match = true;
                            css2.splice(j, 1);
                        }
                    }

                    if (!match)
                        return true;
                }
            }

            for (i = css2.length - 1; i >= 0; i--) {
                var css2_ = css2[i];

                if (css2_.indexOf("yui") != 0)
                    return true; // all matching classes should have been removed - cnt2 has a different class
            }

            return false;
        },

        // returns true if different - ignoring yui additions
        compareWaitContent: function (wait1, wait2) {
            if (!wait1) {
                if (!wait2)
                    return false;

                return true;
            }

            if (!wait2)
                return true;

            if (this.compareCss(wait1, wait2))
                return true;

            if (wait1.innerText != wait2.innerText)
                return true;

            if (wait1.style.backgroundColor != wait2.style.backgroundColor)
                return true;

            if (wait1.style.border != wait2.style.border)
                return true;

            var wi1 = wait1.getElementsByClassName("rdWaitImage");
            var wi2 = wait2.getElementsByClassName("rdWaitImage");

            if (!wi1 || !wi1.length) {
                if (wi2 && wi2.length)
                    return true;
            } else if (!wi2 || !wi2.length)
                return true;
            else if (wi1[0].style.backgroundImage != wi2[0].style.backgroundImage)
                return true;

            var span1 = wait1.getElementsByTagName("span");
            var span2 = wait2.getElementsByTagName("span");

            if (!span1 || !span1.length) {
                if (span2 && span2.length)
                    return true;
            } else if (!span2 || !span2.length)
                return true;
            else if (this.compareCss(span1[0], span2[0]))
                return true;

            return false;
        },
		
		createWaitContent : function(waitMessage, waitClass, waitCaptionClass, animGif, waitKey) {
			var imgPath = 'rdTemplate/';
			if (animGif)
				imgPath += 'rdWait.gif';
			else
			    imgPath += 'rdWaitAll.gif';
		 
			var origWaitMessage = waitMessage
		    // RD19320 - encoded international character sets like cyrlic are not decoded back. 
		    // The fix for alex19096 was to look for certain characters, so added this as a global fix, includes alex18934.          
			try {
			    waitMessage = waitMessage.replace(/\\x/g, "%"); //Had to convert \x to % for YUI's decode function
			    waitMessage = Y.HistoryHash.decode(waitMessage);
		    }
		    catch (e) {
                waitMessage = origWaitMessage
		    }
			
			var sWaitKey = '';
			var sSetStyle = '';
			if (Y.Lang.isValue(waitKey)) {
				sWaitKey = '_' + waitKey;
			}
			
			sSetStyle = 'style="';
			
			//Set default style if there is no class
            if (!waitClass && DEFAULTCLASS)
                waitClass = DEFAULTCLASS;

			if (!waitClass)
                sSetStyle += 'background-color: #fff; border: 1px solid #000;';

            sSetStyle += 'display: table;"'; //This prevents the div from stretching

            if (!waitCaptionClass && DEFAULTCAPTIONCLASS)
                waitCaptionClass = DEFAULTCAPTIONCLASS;
				
			return Y.Node.create(
                '<div id="rdWait' + sWaitKey + '" ' + sSetStyle + ' class="' + waitClass 
				+ '" ><table><tr><td><div id="rdWaitImage" style="width: 32px; height: 32px; background-image: url(' + imgPath + '); background-position: 0px 0px;" ></div></td><td><span class="' 
				+ waitCaptionClass + '" >' + waitMessage 
				+ '</td></table></span></div>');
		},
	
		showWaitPanel : function(waitCfg, fileGuid) {
			if (this.isWaitCanceled()) {
				return;
			}
			else if (LogiXML.isDownloadComplete(false)) {
				LogiXML.unwatchDownload();
				return; //25599
			}

			LogiXML.watchDownload(fileGuid);
			
            var waitMessage, waitClass, waitCaptionClass;
            if (waitCfg.waitMessage)
                waitMessage = waitCfg.waitMessage;
			else if (waitCfg[0])
				waitMessage = waitCfg[0];

            if (!waitMessage)
                waitMessage = DEFAULTWAITMESSAGE;

            if (waitCfg.waitClass)
                waitClass = waitCfg.waitClass;
            else if (waitCfg[1])
				waitClass = waitCfg[1];
			else
                waitClass = '';

            if (!waitClass && DEFAULTCLASS)
                waitClass = DEFAULTCLASS;

            if (waitCfg.waitCaptionClass)
                waitCaptionClass = waitCfg.waitCaptionClass;
            else if (waitCfg[2])
				waitCaptionClass = waitCfg[2];
			else
                waitCaptionClass = '';

            if (!waitCaptionClass && DEFAULTCAPTIONCLASS)
                waitCaptionClass = DEFAULTCAPTIONCLASS;

            var newWait = this.createWaitContent(waitMessage, waitClass, waitCaptionClass).getDOMNode();
            var oldWait = document.getElementById('rdWait');
            if (!Y.Lang.isValue(oldWait))
                document.body.insertBefore(newWait, document.body.children[0]);
            else if (this.compareWaitContent(newWait, oldWait)) {
                this.hideWaitPanel();
                document.body.insertBefore(newWait, document.body.children[0]);
            }

			if (!Y.Lang.isValue(this._pnlWait)) {
				this._pnlWait = new Y.Panel({
					srcNode			: '#rdWait',								
					zIndex			: 9300,
					centered		: true,
					modal			: true,
					render			: true,
                    buttons         : null
				});			
			}							
			
			//Show the panel
            this._pnlWait.show();

            var node = Y.one('.yui3-widget-mask');	

            //Hack For MS Edge to show full screen overlay when scrolled half-way down page.
            node.setStyle('width', '100%');
            node.setStyle('height', '100%'); 
            node.setStyle('position', 'fixed'); 
            //console.log(node._node);
           
			//Fade it in
			node.transition({
				duration: .25,
				opacity: {
					'value' : .5,
					'easing': 'ease-in'				
                }
			});
							
            if (waitCfg.elementId) {
                var ele = document.getElementById(waitCfg.elementId);

                if (ele) {
                    LogiXML.eleOverlay(ele, node._node);

                    var rdWait = document.getElementById("rdWait");

                    if (rdWait)
                        node._node.appendChild(rdWait.parentNode.removeChild(rdWait));
                }
            }

			/*
			 * Act like an animated gif by constantly changing left offset on horizontal image.
			 * Image is comprised of side-by-side frames you would see in an gif.
			 * Div container acts like a viewport with height and width set to dimensions of a single frame.
			 * Time delay on window.setInterval controls how fast the image updates and thus animates.
			 */			 			
			LogiXML.WaitPanel._loadingCounter = 0;
			var animateImage = function() {
				// 7 is the number of frames in the image
				// 32 is the width of a single frame
				var mod = LogiXML.WaitPanel._loadingCounter % 60
				var offset = -32 * mod;
				var loadingImage = document.getElementById('rdWaitImage')
				if (!loadingImage) {
				    window.clearInterval(this.instance._intervalKey);
                    this.instance._intervalKey = null
				    return;
				}
				LogiXML.WaitPanel._loadingCounter++;
				
				loadingImage.style.backgroundPosition = offset + 'px 0px'
				
				//Check for response cookie
				if (LogiXML.isDownloadComplete(!!this.fileGuid)) {
					LogiXML.unwatchDownload(this.fileGuid);
					LogiXML.WaitPanel.pageWaitPanel.hideWaitPanel();
				}
			}.bind({
				instance: this,
				fileGuid: fileGuid
			});

			if (!this._intervalKey) {
			    this._intervalKey = window.setInterval(animateImage, 30);
			}
		},
		
		hideWaitPanel : function() {			
			if (Y.Lang.isValue(this._pnlWait)) {			
                this._pnlWait.hide();

                var mask = Y.one('.yui3-widget-mask');
                if (mask && mask._node)
                    LogiXML.eleOverlayUndo(mask._node);

                var waitPanel = document.getElementById('rdWait');
                if (waitPanel) {
			        waitPanel.parentElement.removeChild(waitPanel);
                    this._pnlWait.destroy(); // 22310
			        this._pnlWait = null;
			    }
			    window.clearInterval(this._intervalKey);
			    this._intervalKey = null
			}					
		},
		
		readyWait : function() {			
			this.get('cancelStack').push(false);			
		},
		
		cancelWait : function() {
			var stk = this.get('cancelStack');
			stk[stk.length - 1] = true;			
		},
		
		isWaitCanceled : function() {			
			return this.get('cancelStack').pop();			
		},

		showFrameWait : function(nodeFrame) {
			var iframePosted = false;

			//Handle waiting
			var waitKey = nodeFrame.getData('waitkey');
			if ( nodeFrame.getAttribute('src') == '' && Y.Lang.isValue(waitKey)) {	
				var waitMessage, waitClass, waitCaptionClass;
                waitMessage = nodeFrame.getData('waitmessage');
				if (!waitMessage)
                    waitMessage = DEFAULTWAITMESSAGE;

				if (Y.Lang.isValue(nodeFrame.getData('waitclass')))
					waitClass = nodeFrame.getData('waitclass');
				else
                    waitClass = '';

                if (!waitClass && DEFAULTCLASS)
                    waitClass = DEFAULTCLASS;

				if (Y.Lang.isValue(nodeFrame.getData('waitcaptionclass')))
					waitCaptionClass = nodeFrame.getData('waitcaptionclass');
				else
                    waitCaptionClass = '';

                if (!waitCaptionClass && DEFAULTCAPTIONCLASS)
                    waitCaptionClass = DEFAULTCAPTIONCLASS;
				
				waitKey = nodeFrame.get('id')+ '_' + waitKey;
                if (!Y.Lang.isValue(document.getElementById('rdWait_' + waitKey))) {
                    var frameDOM = nodeFrame.getDOMNode();
                    frameDOM.setAttribute("rdWaitingForSubmit", "True");
                    var frameParent = frameDOM.parentNode;
                    var waitContent = this.createWaitContent(waitMessage, waitClass, waitCaptionClass, true, waitKey).getDOMNode();
                    frameParent.insertBefore(waitContent, frameDOM);
                }
											
				nodeFrame.setStyle('display', 'none');
				
				//Set frame onload event
				nodeFrame.on('load', this.hideFrameWait);

				rdPostToIFrame(nodeFrame, nodeFrame.getData('hiddensource'));

				iframePosted = true;
			}

			return iframePosted;
		},
		
		hideFrameWait : function(e) {		
		
            var nodeFrame = e.target;

            if (nodeFrame.getAttribute("rdWaitingForSubmit") == "True")
                return;

			var frameSibling = nodeFrame.previous();
			
			if (Y.Lang.isValue(frameSibling) && frameSibling.get('id').indexOf('rdWait') == 0) {
				nodeFrame.previous().remove(); 
				nodeFrame.setStyle('display', '');				
            }
            if (nodeFrame._node.tagName === "IFRAME") {
                iframeResize(document.getElementById(nodeFrame._node.id));
            }
		},
		
		initPageWaitFrames : function() {
            Y.each(Y.all('iframe'), function (nodeFrame) {
                if (!nodeFrame.getAttribute("rdSkipReinit")) {
                    // REPDEV-23451 - don't call showFrameWait if already loaded and nothing has changed
                    if (LogiXML.isNodeVisible(nodeFrame) && Y.Lang.isValue(nodeFrame.getData('waitkey')) && rdIFrameChanged(nodeFrame, nodeFrame.getData("hiddensource")))
                        this.showFrameWait(nodeFrame);

                    var sib = nodeFrame.previous();
                    //node before iframe (waitdiv or not)
                    if (sib != null && sib._node != null && (sib._node.nodeName == 'DIV' || sib._node.nodeName == 'div') && sib._node.id.indexOf('rdWait_') > -1) { //this is waitdiv 
                        sib = sib.previous();
                        if (sib != null && sib._node != null && (sib._node.nodeName == 'DIV' || sib._node.nodeName == 'div') && sib._node.id.indexOf('rdWait_') > -1) {//this is another one waitdiv, deleting, #26251
                            sib._node.parentNode.removeChild(sib._node);
                        }
                    }
                }
			},this);
		}
		
	}, {
		// Y.WaitPanel properties
		
		/**
		 * The identity of the widget.
		 *
		 * @property WaitPanel.NAME
		 * @type String
		 * @default 'WaitPanel'
		 * @readOnly
		 * @protected
		 * @static
		 */
		NAME : 'waitpanel',
		
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
			/**
			* Cancels the show panel action
			*/
			cancelStack : {
				value : new Array()
			}		
		}
	});	

}, '1.0.0', {requires: ['base','panel','transition','cookie','history']});
