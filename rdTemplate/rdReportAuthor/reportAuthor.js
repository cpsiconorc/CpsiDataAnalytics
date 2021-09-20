YUI.add('reportAuthor', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdReportAuthor';

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').ReportAuthor = Y.Base.create('ReportAuthor', Y.Base, [], {
        _handlers: {},

        configNode: null,
        id: null,
        reportName: '',
        visualizationStack: [],
        visualizationParentId: null,
        visualizationParentSiblingId: null,

        initializer: function (config) {
            var self = this;
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);
            this.processPopups();
            //defined in global.js
            rdSetUndoRedoVisibility();
        },

        reportAuthorReinitializeHandler: function () {
            this.processPopups();
            this.checkForLoadedPopups();
            rdSetUndoRedoVisibility();
        },

        processPopups: function () {
            /*--------------- visualizations -----------------*/
            if (this._handlers.popupClose) {
                if (this._handlers.popupClose.detach) {
                    this._handlers.popupClose.detach();
                }
                this._handlers.popupClose = null;
            }

            var popupCloseImageSettingsButton = Y.one(".rd-image-settings #actionHidePanel");
            if (popupCloseImageSettingsButton) {
                this._handlers.popupClose = popupCloseImageSettingsButton.on('click', function () {
                    var imageSettingsPopupId = Y.one(".rd-image-settings")._node.id;
                    var imageSettingsUID = imageSettingsPopupId.split('_')[1];
                    document.getElementById('txtImageUploadFile_' + imageSettingsUID).value = '';                
                    ShowElement(this.id, imageSettingsPopupId, 'Hide', '');
                }, this);
            }
            var popupCloseButton = Y.one("#ppChangeDashboard #actionHidePanel");
            if (popupCloseButton) {
                this._handlers.popupClose = popupCloseButton.on('click', function () {
                    ShowElement(this.id,'ppChangeDashboard','Hide','');
                    this.addVisualizationsPopupClose();
                }, this);
            }
            if (LogiXML.Ajax.AjaxTarget) {
                this._handlers.popupCloseAjax && this._handlers.popupCloseAjax.detach(); //re-attach reinitialize because subscription will drop after IFrame loading (while editing)
                this._handlers.popupCloseAjax = LogiXML.Ajax.AjaxTarget().on('reinitialize', this.reportAuthorReinitializeHandler, this);
            }
            
        },

        checkForLoadedPopups: function () {
            /*--------------- show control panel after load -----------------*/
            var loadedPopup = Y.one('.rd-show-on-loaded');
            if (loadedPopup) {
                ShowElement('', loadedPopup.getAttribute('id'), '', '');
                Y.all('.rd-show-on-loaded').each(function (node) {
                    node.removeClass('rd-show-on-loaded');
                });
            }
        },

        initAddVisualizations: function (parentId, siblingId) {
            this.visualizationStack = [];
            this.visualizationParentId = parentId;
            this.visualizationParentSiblingId = siblingId;
        },

        addVisualizationsPopupClose: function () {
            //same as done
            this.addVisualizationsPopupDone();
        },

        addVisualizationsPopupDone: function () {
            var visualizationIds = this.visualizationStack.join(","),
                parentId = this.visualizationParentId,
                siblingId = this.visualizationParentSiblingId,
                refreshElementId = null;

            //clean vars before any actions
            this.visualizationStack = [];
            this.visualizationParentId = null;
            this.visualizationParentSiblingId = null;

            var parentNode = Y.one('#' + parentId),
                editorNode = parentNode.ancestor('.rd-element-editor');
            if (!editorNode) {
                refreshElementId = parentId;
            } else {
                refreshElementId = editorNode.getAttribute('id');
            }

            //hide popup 
            ShowElement(this.id, 'ppChangeDashboard', 'Hide', '');
           
            //post to server 
            if (visualizationIds && visualizationIds.length > 0) {
                rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + ',' + refreshElementId +
                    '&rdReportAuthorAction=refresh&rdReportAuthorElementID=' + refreshElementId + '&rdReport=' + this.reportName, 'false', '', null, null, null, ['', '', '']);
                
                // should be revisited , if NGP platform, refresh after adding panel
                //console.log("visualizationIds: " + visualizationIds); 
                //if (window.Logi !== undefined) {
                if (visualizationIds.indexOf('NGPviz') >= 0 && !window.Logi) {
                    //console.log("visualizationIds.length: " + visualizationIds.length);
                    //window.location.reload(false);
					var href = window.location.href;
					if (href && href.indexOf) {
					    href = href.replace('&rdNewBookmark=True', '');
					    href = href.replace('&goBookmarkCaption=', '&goNotUsedBookmarkCaption=');

					    if (href.indexOf("rdReportAuthorViewMode") == -1)
					        href = href + "&rdReportAuthorViewMode=DesignEdit";

						window.location.replace(href);
					} else {
						window.location = window.location;
					}
                }
            }

        },
        
        addVisualizationSort: function () {
          
            rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=rdAddPanelsList&rdReportAuthorAction=refresh&rdReportAuthorElementID=rdAddPanelsList&rdReport=' + this.reportName, 'false', '', null, null, null, null);

        },

        addVisualizationIntoStack: function (id, nRowNr) {
            //For Report Author
            var nodeOriginationPopup = Y.one('#ppChangeDashboard');
            var eleCount = nodeOriginationPopup.one('#lblCount_Row' + nRowNr).getDOMNode();
            eleCount.innerHTML = parseInt(eleCount.innerHTML) + 1;
            var eleCountDiv = nodeOriginationPopup.one('#divCount_Row' + nRowNr).getDOMNode();
            eleCountDiv.className = eleCountDiv.className.replace("rdDashboardHidden", "");
            var eleAddedDiv = nodeOriginationPopup.one('#divAdded_Row' + nRowNr).getDOMNode();
            eleAddedDiv.className = eleAddedDiv.className.replace("rdDashboardHidden", "");
            //Hide the Add button?
            if (nodeOriginationPopup.one('#hiddenMultiInstance_Row' + nRowNr).getDOMNode().value == "False") {
                var eleAddNowButton = nodeOriginationPopup.one('#lblAddPanel_Row' + nRowNr).getDOMNode();
                eleAddNowButton.className = "rdDashboardHidden";
                eleCountDiv.className = "rdDashboardHidden";
/*                var eleDeletePanelButton = nodeOriginationPopup.one('#lblDeletePanel_Row' + nRowNr).getDOMNode();
                eleDeletePanelButton.className = "rdDashboardHidden"*/
            }
            this.visualizationStack.push(id);
            var parentId = this.visualizationParentId,
                siblingId = this.visualizationParentSiblingId;
            rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id +
                '&rdReportAuthorAction=add&rdReportAuthorSilentUpdate=True&rdElementType=Visualization&rdReportAuthorVisualizationIds=' + id + '&rdReportAuthorParentID=' + parentId + '&rdReportAuthorSiblingElementID=' + siblingId + '&rdReport=' + this.reportName, 'false', '', null, null, null, null);
        },

        deleteVisualizationFromGallery: function (id, nRowNr) {
            //For Report Author
            var panelsTable = Y.one('#rdDashboardPanelList').getDOMNode();
            var currentPanelRow = panelsTable.childNodes[0].childNodes[nRowNr-1];
            currentPanelRow.className = "rdDashboardHidden";
            var parentId = this.visualizationParentId,
                siblingId = this.visualizationParentSiblingId;
            rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id +
                '&rdReportAuthorAction=removeFromGallery&rdReportAuthorSilentUpdate=True&rdElementType=VisualizationPanel&rdReportAuthorVisualizationIds=' + id + '&rdReportAuthorParentID=' + parentId + '&rdReportAuthorSiblingElementID=' + siblingId + '&rdReport=' + this.reportName, 'false', '', null, null, null, null);
        },

        refreshPanel: function (sPanelID, callback) {
            rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + ',' + sPanelID
                + '&rdReportAuthorAction=refresh'
                + '&rdReport=' + this.reportName,
                'false', '', null, null, callback, null);
        },

        sendColumnResizeUpdate: function (rowElementId, leftColumnId, rightColumnId, leftColumnSpan, rightColumnSpan) {
            if (leftColumnSpan<=1) {
                this.showHideAddColumnButtonById(leftColumnId, true);
            } else {
                this.showHideAddColumnButtonById(leftColumnId, false);
            }
            if (rightColumnSpan <= 1) {
                this.showHideAddColumnButtonById(rightColumnId, true);
            } else {
                this.showHideAddColumnButtonById(rightColumnId, false);
            }
            rdAjaxRequestWithFormVars('rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id +
                '&rdReportAuthorAction=resize&rdReportAuthorSilentUpdate=True&rdElementType=Row&rdReportAuthorElementID=' + rowElementId +
                '&leftColumnID=' + leftColumnId + '&rightColumnID=' + rightColumnId + '&leftColumnSpan=' + leftColumnSpan + '&rightColumnSpan=' + rightColumnSpan +
                '&rdReport=' + this.reportName, 'false', '', null, null, null, null);
        },

        showHideAddColumnButtonById: function(columnID, hide) {
            var tdToHide = Y.one("#header_" + columnID);
            var spanToHide = getElementsByClassName("addColumnButtonDiv", "span", tdToHide._node)[0];
            if (!spanToHide) {
                return;
            }
            if (hide) {
                spanToHide.style["display"] = "none";
            } else {
                spanToHide.style["display"] = "";
            }
        },

        showAddPanels: function () {
            rdShowAddGalleryPanels(this.id, this.reportName);
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            this.reportName = Y.one("#hiddenCurrentReport").getAttribute("value");
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
        },

        _clearHandlers: function () {
            var self = this;
            Y.each(this._handlers, function (item) {
                if (item) {
                    if (item.detach) {
                        item.detach();
                    }
                    if (item.destroy) {
                        item.destroy();
                    }
                    item = null;
                }
            });
        }

    }, {
        // Static Methods and properties
        NAME: 'ReportAuthor',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },

        createElements: function () {

            var element;

            Y.all('.' + TRIGGER).each(function (node) {
                element = node.getData(TRIGGER);
                if (!element) {
                    element = new Y.LogiXML.ReportAuthor({
                        configNode: node
                    });
                }
            });
        },

        pg:  function pickGaugeGoalColor(colColor, border) {
            var sColor = Y.Color.toHex(Y.one('#' + colColor.id).getComputedStyle('backgroundColor'));
            var concreteColorPickerId = sColorPicker.split("_")[1];

            //var replaceParam = function(str, elementType) {
            //    return str.replace('Border', elementType);
            //};
            var elementPrefix = border ? 'slctBorderColor_' : 'slctLabelFontColor_';
            var indicatorPrefix = border ? 'rectBorderColor_' : 'rectColor_';
            var visualPrefix = border ? 'ppLabelBorderColors_' : 'ppLabelFontColors_';

            var eleColorHolder = document.getElementById(elementPrefix + concreteColorPickerId);
            eleColorHolder.value = sColor;
            var elePickedColorIndicator = document.getElementById(indicatorPrefix + concreteColorPickerId);
            elePickedColorIndicator.style.backgroundColor = sColor;
            ShowElement(this.id, visualPrefix + concreteColorPickerId, 'Hide');
        },

        updateDeleteLink: function (elementId, newParentId) {
            if (!elementId || elementId == "") {
                return;
            }
            if (!newParentId || newParentId == "") {
                return;
            }
            var deleteLinks = Y.all('#actDeleteElement_' + elementId),
                href, idxStart, idxEnd;
            deleteLinks.each(function (deleteLink) {
                href = deleteLink.getAttribute('href');
                if (!href) {
                    return;
                }
                idxStart = href.indexOf('&rdRefreshElementID=');
                if (idxStart == -1) {
                    return;
                }
                idxStart = href.indexOf(',', idxStart + 1);
                if (idxStart == -1) {
                    return;
                }
                idxEnd = href.indexOf('&', idxStart + 1);
                if (idxEnd == -1) {
                    return;
                }

                href = href.substr(0, idxStart) + ',' + newParentId + href.substr(idxEnd) + ';return false;';

                idxStart = href.indexOf('&rdReportAuthorRefreshElementID=');
                if (idxStart == -1) {
                    return;
                }
                idxStart = href.indexOf('=', idxStart + 1);
                if (idxStart == -1) {
                    return;
                }
                idxEnd = href.indexOf('&', idxStart + 1);
                if (idxEnd == -1) {
                    return;
                }

                href = href.substr(0, idxStart+1) + newParentId + href.substr(idxEnd)

                if (href.indexOf('javascript:') == 0) {
                    href = href.substr(11);
                }
                deleteLink.setAttribute('onclick', href);
            });
        }
    });

}, '1.0.0', { requires: ['base', 'node', 'node-base', 'event', 'node-custom-destroy', 'json-parse', 'stylesheet', 'event-custom', 'io-base','io-xdr','io-form','io-upload-iframe','io-queue'] });



function GetColorPicker(sColorPickerValue) {
    window.sColorPicker = sColorPickerValue;
};

function toggleInlineEdit(element) {
    if (!element.previousSibling)
        return;
    element.previousSibling.style.display = 'none';
    element.parentNode.style.background = 'none';
    element = element.firstChild.firstChild; //fix for moving action to template
    element.style.width = '100%';
    element.style.height = '100%';
    if (element.outerHTML.indexOf("<span") > -1) {
        var numberOfRows = getRows(element);
        element.innerHTML = brToNewLine(element.innerHTML);
        element.outerHTML = element.outerHTML.replace("<span", "<textarea").replace("</span>", "</textarea>");
        element = document.getElementById(element.id);
        element.setAttribute("rows", numberOfRows);
        element.focus();
        moveCaretToEnd(element);
        element.onblur = onblurwrapper;
        Y.one(element).on(['keydown','change'], delayedResize);
        element.parentElement.parentElement.onlclick = null; //fix for moving action to template
    }
};
function resize(el) {
    var node = el.currentTarget;
    //node.setStyle('height', 'auto');
    node.setStyle('height', node.get('scrollHeight') + 'px');
    node.setStyle('overflowY', 'hidden');
    node.setStyle('paddingTop', '.2em');

}

/* 0-timeout to get the already changed text */
function delayedResize(el) {
    //window.setTimeout(function() {
    //    resize(el);
    //}, 0);
    
    Y.later(0, window, resize, [el], false);
}
function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
        el.onmouseup = null;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
    }
}
function brToNewLine(str) {
    return str.replace(/<br\s*\/?>/mg, "\n");
}

function clickOnPencil(el) {
    toggleInlineEdit(el.nextSibling);
}
function onblurwrapper(event) {
    javascript:exitInlineEdit(this);
}

function getRows(el) {
    var minRow = 4;
    var maxRow = 16;
    var height = el.offsetHeight;
    var lineHeight = el.style.fontSize == '' ? 13 : el.style.fontSize;
    lineHeight = parseFloat(lineHeight);
    var rows = Math.round(height / lineHeight);
    rows = rows == 0 ? minRow : (rows > maxRow ? maxRow : rows);
    return (rows);
}

function onClickwrapper(event) {
    javascript:toggleInlineEdit(this);
}

function exitInlineEdit(element) {
    if (element.outerHTML.indexOf("<textarea") > -1) {
        var newText = element.value;
        var elemId = element.id.substring(element.id.lastIndexOf("_") + 1, element.id.length);
        element.className = "rd-editable";
        element.parentNode.parentNode.previousSibling.style.display = "";
        element.parentNode.parentNode.parentNode.style.background = "";

        if (element.defaultValue != newText) {
            document.getElementById("isChanged_" + elemId).value = "True";

            element.innerHTML = newText;

            var editor = document.getElementById("txtLabelText_" + elemId);
            if (editor) {
                editor.value = element.value;
            }
        }
        
        element.outerHTML = element.outerHTML.replace("<textarea", "<span").replace("</textarea>", "</span>");
        element = document.getElementById(element.id);
        element.onblur = null;
        element.onclick = onClickwrapper;
        var saveBtn = document.getElementById("actSetSettings_" + elemId);
        if (saveBtn) {
            saveBtn.onclick();
        }
    }
}


function setEditActionCause(isUser) {
    var eleSetFromUser = document.getElementById('rdSetSettingsFromUser');
    if (eleSetFromUser) {
         eleSetFromUser.value = isUser;
    }
}
