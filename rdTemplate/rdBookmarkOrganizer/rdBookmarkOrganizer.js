YUI.add('rd-BookmarkOrganizer-plugin', function (Y) {
    //'use strict;

    //Define querySelectorAll if it's not defined (IE7)
    if (!document.querySelectorAll) {
        (function (d, s) { d = document, s = d.createStyleSheet(); d.querySelectorAll = function (r, c, i, j, a) { a = d.all, c = [], r = r.split(','); for (i = r.length; i--;) { s.addRule(r[i], 'k:v'); for (j = a.length; j--;) a[j].currentStyle.k && c.push(a[j]); s.removeRule(0) } return c } })()
    }
    //create namespaced plugin class
    Y.namespace('LogiXML').rdBookmarkOrganizer = Y.Base.create("rdBookmarkOrganizer", Y.Plugin.Base, [], {

        //constructor
        initializer: function () {

            this._container = this.get("host");
            this._container.addClass("rdCaptureDropEvent");
            this._container.on("drag:drophit", rdClearSelectedBookmarks);

            this._id = this._container.getAttribute("id");
            document.getElementById(this._id).style.display = "none";
            var folders = document.getElementById('dtFolders');
            var sharedFolders = document.getElementById('dtSharedFolders');
			 var myFolders;
            if (folders) {
                var tbody = folders.getElementsByTagName("tbody")[0];
				 if (tbody == undefined) {
					return;
				 }			
                myFolders = tbody.getElementsByTagName("tr");
            } else {
                //critical error, cannot find root of the folders, exit
                return;
            }
            var selectedFolder = document.getElementById('rdSelectedFolderID').value;
            var selectedSharedFolder = document.getElementById('rdSelectedSharedFolderID').value;
            var selectedSharedParentFolder = document.getElementById('rdSelectedSharedParentFolderID').value;

            //Hierarchical
            var myFolderStatus = document.getElementById("rdExpandedCollapsedHistory_myFolder").value;
            var sharedFolderStatus = document.getElementById("rdExpandedCollapsedHistory_sharedFolder").value;
            if (myFolderStatus != "")
                this.restoreFolderState(myFolderStatus, 'myFolder');
            else {
                //Unless the user specified otherwise, root folder always expanded
                this.restoreFolderState("undefined:true", 'myFolder');
            }
            if (sharedFolderStatus != "")
                this.restoreFolderState(sharedFolderStatus, 'sharedFolder');

            for (var i = 0; i < myFolders.length; i++) {

                if (myFolders[i].getElementsByTagName("input").length > 0) {
                    var folderExpanded = myFolders[i].getElementsByTagName("input")[0].value;
                    var folderDepth = this.getDepth(myFolders[i]);
                    var folderID = this.getID(myFolders[i]);

                    for (var j = 0; j < folderDepth; j++) {
                        if (myFolders[i]) {
                            if (myFolders[i].querySelector('#drag_' + folderID)) {
                                myFolders[i].querySelector('#drag_' + folderID).innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + myFolders[i].querySelector('#drag_' + folderID).innerHTML;
                            }
                        }
                    }

                    if (folderDepth == 0)
                        this.initializeExpandCollapse(myFolders[i], false);
                }
            }

            if (sharedFolders) {
                var theirFolders = sharedFolders.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

                for (var i = 0; i < theirFolders.length; i++) {

                    var folderExpanded = theirFolders[i].getElementsByTagName("input")[0].value;
                    var folderDepth = this.getDepth(theirFolders[i]);
                    var folderID = this.getID(theirFolders[i]);

                    for (var j = 0; j < folderDepth; j++) {
                        if (theirFolders[i]) {
                            if (theirFolders[i].querySelector('#drag_' + folderID)) {
                                theirFolders[i].querySelector('#drag_' + folderID).innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + theirFolders[i].querySelector('#drag_' + folderID).innerHTML;
                            }
                        }
                    }

                    if (folderDepth == 0)
                        this.initializeExpandCollapse(theirFolders[i], false);
                }
            }

            if (selectedFolder)
                this.selectFolder(null, selectedFolder, selectedSharedFolder, selectedSharedParentFolder);
            else
                this.selectFolder(null, "", "", "");

            document.getElementById(this._id).style.display = "";

        },

        //clean up on destruction
        destructor: function () {
           
        },
        restoreFolderState: function (status, table) {
            //Restore expanded/collapsed status
            var folderTable;
            if(table == 'myFolder')
                folderTable = document.getElementById('dtFolders');
            else if(table == 'sharedFolder')
                folderTable = document.getElementById('dtSharedFolders');
                
            if (folderTable) {
                var folderTableRows = folderTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
            } else {
                return;
            }

            var folders = status.split("|");
            for (var i = 0; i < folders.length; i++) {

                var folderID = folders[i].split(":")[0];
                if (folderID == 'undefined')
                    continue;
                var folderStatus = folders[i].split(":")[1];

                if (folderStatus == "true" || folderStatus == "false") {

                    var row = this.getTableRowByFolderID(folderID, table);

                    if (row) {
                        this.setExpandedCollapsed(row, folderStatus);
                    }
                }
            }
        
        },
        initializeExpandCollapse: function (currentNode, hiddenChild) {

            var targetLevel = this.getDepth(currentNode);
            //First parent will be 1 level up
            var hideLevel = targetLevel + 1;
            var nextSibling = this.getNextTableRow(currentNode);

            var showHide;
            //showing or hiding?
            if (this.getExpandedCollapsed(currentNode) == "true") {
                this.setExpandedCollapsed(currentNode, "true");
                showHide = "";
            }
            else {
                this.setExpandedCollapsed(currentNode, "false");
                hiddenChild = true;
                showHide = "none";
            }
            while (nextSibling) {
                //When we find the next element that is either the same level or higher, we're finished
                if (this.getDepth(nextSibling) == hideLevel) {
                    nextSibling.style.display = showHide;
                    this.initializeExpandCollapse(nextSibling, hiddenChild);
                }
                else if (this.getDepth(nextSibling) > hideLevel && hiddenChild)
                    nextSibling.style.display = "none";

                else if (this.getDepth(nextSibling) < hideLevel) {
                    break;
                }

                nextSibling = this.getNextTableRow(nextSibling);
            }

        },
        getDepth: function (tableRow) {

            var inputs = tableRow.getElementsByTagName("input");
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].id.indexOf("rdFolderDepth") >= 0) {
                    var rdLevel = parseInt(inputs[i].value);
                    return rdLevel;
                }
            }
        },
        getID: function (tableRow) {

            var inputs = tableRow.getElementsByTagName("input");
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].id.indexOf("rdFolderID") >= 0) {  
                    return inputs[i].value;
                }
            }
        },
        getExpandedCollapsed: function (tableRow) {

            var inputs = tableRow.getElementsByTagName("input");
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].id.indexOf("rdFolderExpanded") >= 0) {
                    
                    return inputs[i].value;
                }
            }
        },
        setExpandedCollapsed: function (tableRow, val) {

            var inputs = tableRow.getElementsByTagName("input");
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].id.indexOf("rdFolderExpanded") >= 0) {
                    inputs[i].value = val;
                }
            }

            var images = tableRow.getElementsByTagName("img");
            for (var i = 0; i < images.length; i++) {
                if (images[i].id.indexOf("rdToggleChildrenShow") >= 0) {
                    if (val == "true") {
                        images[i].style.display = "none";
                        images[i + 1].style.display = "";
                        return;
                    }
                    else {
                        images[i].style.display = "";
                        images[i + 1].style.display = "none";
                        return;
                    }
                }
            }

        },

        //Necessary because some browsers insert random text nodes into dom for spacing and they show up in the .nextSibling method

        getNextTableRow: function (tableRow) {
            var toReturn = tableRow.nextSibling;
            while (toReturn && (toReturn.tagName != "TR" && toReturn.tagName != "tr"))
                toReturn = toReturn.nextSibling;
            return toReturn;
        },
        getTableRowByFolderID: function (sFolderID, sParent) {

            var toggleNode
            if (sParent == "sharedFolder") {
                toggleNode = document.getElementById('dtSharedFolders').querySelectorAll("[value='" + sFolderID + "']");
            }
            else {
                toggleNode = document.querySelectorAll("[value='" + sFolderID + "']");
            }
            if (toggleNode) {
                for (var i = 0; i < toggleNode.length; i++) {
                    if (toggleNode[i].id.indexOf("rdFolderID") >= 0) {
                        toggleNode = toggleNode[i];
                        break;
                    }
                }
                if (toggleNode.tagName) {
                    while (toggleNode.tagName != "tr" && toggleNode.tagName != "TR")
                        toggleNode = toggleNode.parentNode;
                        return toggleNode;
                }
                //If a session gets switched or somehow the folderid is not present, we selected the root folder and then get it.
                else {
                    this.selectFolder(null, "", "", "");
                    return this.getTableRowByFolderID("");
                }
            }

            

        },
        selectFolder: function (e, sFolderID, sSharedFolderID, sSharedParentFolderID, sSharedFolder, sBookmarkUserName,sBookmarkCollection,sClearMsg) {

            if (!sFolderID) {
                sFolderID = "";
            }
            if (!sSharedFolderID) {
                sSharedFolderID = "";
            }
            if (!sSharedParentFolderID) {
                sSharedParentFolderID = "";
            }
            if (!sSharedFolder) {
                sSharedFolder = "";
            }

            var className = document.getElementById('rdSelectedFolderClassName').value;

            var dataTableID = document.getElementById('rdBookmarkOrganizerDataTableID').value;

            var selectedFolders = Y.all('.' + className);

            selectedFolders.removeClass(className);

            document.getElementById('rdSelectedFolderID').value = sFolderID;

            document.getElementById('rdSelectedSharedFolderID').value = sSharedFolderID;

            document.getElementById('rdSelectedSharedParentFolderID').value = sSharedParentFolderID;

            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            if (e) {
                var toggleNode = e.parentNode;

                if (toggleNode) {
                    while (toggleNode.tagName != "tr" && toggleNode.tagName != "TR")
                        toggleNode = toggleNode.parentNode;

                    toggleNode.className += " " + className;
                }
            }
            else {

                var toggleNode = this.getTableRowByFolderID(sFolderID);

                if (sSharedParentFolderID != "") {
                    //Get the first child
                    toggleNode = this.getNextTableRow(this.getTableRowByFolderID(sSharedParentFolderID));

                    //Keep moving down the children until we find the right one
                   
                    while (this.getNextTableRow(toggleNode) && this.getID(toggleNode) != sFolderID) {
                        toggleNode = this.getNextTableRow(toggleNode);
                    }
                }
                
                if (toggleNode)
                    toggleNode.className += " " + className;
                else
                    this.selectFolder(null, "", "", "");
            }

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SelectFolder&rdDataTableID=' + dataTableID + '&FolderID=' + sFolderID + '&SharedFolderID=' + sSharedFolderID + '&SharedParentFolderID=' + sSharedParentFolderID + '&sSharedFolder=' + sSharedFolder + '&rdReport=' + sReportID + '&rdBookmarkUserName=' + sBookmarkUserName + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdClearMessages=' + sClearMsg, 'false', '', null, null, null, null); 

            rdClearSelectedBookmarks();
        },
        toggleImage: function (tableRow, val) {

            var images = tableRow.getElementsByTagName("img");
            for (var i = 0; i < images.length; i++) {
                if (images[i].id.indexOf("rdToggleChildrenShow") >= 0) {
                    if (val == "show") {
                        images[i].style.display = "none";
                        images[i + 1].style.display = "";
                        return;
                    }
                    else {
                        images[i].style.display = "";
                        images[i + 1].style.display = "none";
                        return;
                    }
                }
            }

        },
        toggleNode: function (e, tableRow, dontChangeExpandCollapseStatus) {

            var toggleNode;

            if (!dontChangeExpandCollapseStatus)
                dontChangeExpandCollapseStatus = false;
            
            if (e) {
                toggleNode = e.parentNode;
                while (toggleNode.tagName != "tr" && toggleNode.tagName != "TR")
                    toggleNode = toggleNode.parentNode;
            }
            else {
                toggleNode = tableRow;
            }

            var targetLevel = this.getDepth(toggleNode);

            //First parent will be 1 level up
            var hideLevel = targetLevel + 1;
            var nextSibling = this.getNextTableRow(toggleNode);
            var showHide;
            //showing or hiding?
            if (this.getExpandedCollapsed(toggleNode) == "false") {
                showHide = "";
                this.setExpandedCollapsed(toggleNode, "true");
                this.toggleImage(toggleNode, "show");
            }
            else {
                showHide = "none";
                this.setExpandedCollapsed(toggleNode, "false");
                this.toggleImage(toggleNode, "hide");
            }
            while (nextSibling) {

                //When we find the next element that is either the same level or higher, we're finished
                if (this.getDepth(nextSibling) == hideLevel && showHide == "") {
                    nextSibling.style.display = showHide;
                    if (this.getExpandedCollapsed(nextSibling) == "true")
                        this.toggleChildren(nextSibling);
                }
                else if (this.getDepth(nextSibling) >= hideLevel && showHide == "none") {
                    nextSibling.style.display = showHide;
                }
                else if (this.getDepth(nextSibling) < hideLevel) {
                    break;
                }

                nextSibling = this.getNextTableRow(nextSibling);
            }

            this.buildStatusList();
        },
        expandSingleRow: function (tableRow) {

            var toggleNode = tableRow;
  

            var targetLevel = this.getDepth(toggleNode);

            //First parent will be 1 level up
            var hideLevel = targetLevel + 1;
            var nextSibling = this.getNextTableRow(toggleNode);
            var showHide = "";
            this.setExpandedCollapsed(toggleNode, "true");
            this.toggleImage(toggleNode, "show");

            while (nextSibling) {

                //When we find the next element that is either the same level or higher, we're finished
                if (this.getDepth(nextSibling) == hideLevel && showHide == "") {
                    nextSibling.style.display = showHide;
                }
                else if (this.getDepth(nextSibling) >= hideLevel && showHide == "none") {
                    nextSibling.style.display = showHide;
                }
                else if (this.getDepth(nextSibling) < hideLevel) {
                    break;
                }

                nextSibling = this.getNextTableRow(nextSibling);
            }

            this.buildStatusList();
        },
        buildStatusList: function () {

            var folders = document.getElementById('dtFolders');
            var sharedFolders = document.getElementById('dtSharedFolders');
            var myFolders = folders.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            var sMyFolders = "";
            for (var i = 0; i < myFolders.length; i++) {

                if (myFolders[i].getElementsByTagName("input").length > 0) {
                    var folderExpanded = myFolders[i].getElementsByTagName("input")[0].value;
                    var folderDepth = this.getDepth(myFolders[i]);
                    var folderID = myFolders[i].getElementsByTagName("input")[2].value;

                    if(!folderID)
                        folderID = "";

                    sMyFolders += folderID + ":" + folderExpanded + "|";
                }
            }

            var sSharedFolders = "";
            if (sharedFolders) {
                var theirFolders = sharedFolders.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

                for (var i = 0; i < theirFolders.length; i++) {

                    if (theirFolders[i].getElementsByTagName("input").length > 0) {
                        var folderExpanded = theirFolders[i].getElementsByTagName("input")[0].value;
                        var folderDepth = this.getDepth(theirFolders[i]);
                        var folderID = theirFolders[i].getElementsByTagName("input")[2].value;

                        sSharedFolders += folderID + ":" + folderExpanded + "|";
                    }
                }

            }

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SaveBookmarkOrganizerExpandedCollapsedStatus&rdMyFolderState=' + sMyFolders + '&rdSharedFolderState=' + sSharedFolders + '&rdReport=' + sReportID);

        },
        toggleChildren: function (toggleNode) {

            var targetLevel = this.getDepth(toggleNode);

            //First parent will be 1 level up
            var hideLevel = targetLevel + 1;
            var nextSibling = this.getNextTableRow(toggleNode);
            var showHide;
            //showing or hiding?
            if (this.getExpandedCollapsed(toggleNode) == "true") {
                showHide = "";
            }
            else {
                showHide = "none";
            }
            while (nextSibling) {

                //When we find the next element that is either the same level or higher, we're finished
                if (this.getDepth(nextSibling) == hideLevel && showHide == "") {
                    nextSibling.style.display = showHide;
                    if (this.getExpandedCollapsed(nextSibling) == "true")
                        this.toggleChildren(nextSibling);
                }
                else if (this.getDepth(nextSibling) >= hideLevel && showHide == "none") {
                    nextSibling.style.display = showHide;
                }
                else if (this.getDepth(nextSibling) < hideLevel) {
                    break;
                }

                nextSibling = this.getNextTableRow(nextSibling);
            }

        },

        /*  Folder & Bookmark Management (ajax entry points)  */

        rdAddNewFolderSetup: function (sParentFolderID) {
            document.getElementById('rdParentFolderID').value = sParentFolderID;
        },
        rdAddFolder: function (sFolderName) {

            var sParentFolderID = document.getElementById('rdParentFolderID').value;
            var sFolderName = document.getElementById('rdFolderNameText').value;
            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sDataTableID = document.getElementById('rdBookmarkOrganizerDataTableID').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            var trParentFolder = this.getTableRowByFolderID(sParentFolderID);
            this.expandSingleRow(trParentFolder);

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddBookmarkFolder&rdDataTableID=' + sDataTableID + '&rdParentFolderID=' + sParentFolderID + '&rdFolderName=' + sFolderName + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
            
        },
        rdAddBookmarkToFolder: function (sBookmarkID, sFolderID) {

            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sDataTableID = document.getElementById('rdBookmarkOrganizerDataTableID').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddBookmarkToFolder&rdDataTableID=' + sDataTableID + '&rdFolderID=' + sFolderID + '&rdBookmarkID=' + sBookmarkID + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
        },
        rdDragBookmarkToFolder: function (sBookmarkID, sBookmarkUserName, sBookmarkDescription, sFolderID) {
            var sDataTableID = document.getElementById('rdBookmarkOrganizerDataTableID').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddBookmarkToFolder&rdDataTableID=' + sDataTableID + '&rdFolderID=' + sFolderID + '&rdBookmarkDescription=' + sBookmarkDescription + '&rdBookmarkID=' + sBookmarkID + '&rdBookmarkUserName=' + sBookmarkUserName + '&rdReport=' + sReportID);
        },
        rdSaveCheckboxListState: function(c) {
            var inputNode = c.parentNode.parentNode.nextSibling;
            var parentID = inputNode.id.split("_rdList")[0];

            var rdExpandCollapseHistory = document.getElementById(parentID + "_rdExpandedCollapsedHistory")
            var sOldState = "," + inputNode.id + ":expanded";
            rdExpandCollapseHistory.value = rdExpandCollapseHistory.value.replace(sOldState, "");
            sOldState = "," + inputNode.id + ":collapsed";
            rdExpandCollapseHistory.value = rdExpandCollapseHistory.value.replace(sOldState, "");

            if (inputNode.getAttribute("rdExpanded") == "true") {
                var parentID = inputNode.id.split("_")[0];
                rdExpandCollapseHistory.value = rdExpandCollapseHistory.value + "," + inputNode.id + ":collapsed";
                inputNode.setAttribute("rdExpanded", "false");
            }
            else {
                var parentID = inputNode.id.split("_")[0];
                rdExpandCollapseHistory.value = rdExpandCollapseHistory.value + "," + inputNode.id + ":expanded";
                inputNode.setAttribute("rdExpanded", "true");
            }
            Y.LogiXML.rdInputCheckList.prototype.expandCollapseChildren(inputNode);
        },
        rdAddFolderToFolder: function (sMovingFolderID, sReceivingFolderID) {

            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sDataTableID = document.getElementById('rdBookmarkOrganizerDataTableID').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddFolderToFolder&&rdDataTableID=' + sDataTableID + '&rdMovingFolderID=' + sMovingFolderID + '&rdReceivingFolderID=' + sReceivingFolderID + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
        },
        rdRemoveFolder: function (sFolderID) {

            var sResetSelectedFolder = "False";
            if (document.getElementById('rdSelectedFolderID').value == sFolderID || document.getElementById('rdSelectedSharedParentFolderID').value == sFolderID) {
                document.getElementById('rdSelectedFolderID').value = "";
                sResetSelectedFolder = "True";
            }
            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sDataTableID = document.getElementById('rdBookmarkOrganizerDataTableID').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=RemoveBookmarkFolder&rdDataTableID=' + sDataTableID + '&rdFolderID=' + sFolderID + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdResetSelectedFolder=' + sResetSelectedFolder + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
        },
        rdRenameFolderSetup: function (sFolderID, sFolderName) {
            document.getElementById('rdFolderRenameText').value = sFolderName;
            document.getElementById('rdFolderID').value = sFolderID;
        },
        rdRenameFolder: function () {

            var sFolderID = document.getElementById('rdFolderID').value;
            var sRenameFolderText = document.getElementById('rdFolderRenameText').value;
            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=RenameBookmarkFolder&rdFolderID=' + sFolderID + '&rdFolderName=' + sRenameFolderText + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
        },
        rdExcludeFolder: function (sFolderID, sFolderCollection) {

            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=ExcludeSharedFolder&rdSharedFolderID=' + sFolderID + '&rdSharedFolderCollection=' + sFolderCollection + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
        },
        rdCreateFolderShortcut: function (sFolderID, sShortcutUserName, sShortcutCollection, sFolderName, sReceivingFolderID) {

            var sBookmarkOrganizerID = document.getElementById('rdBookmarkOrganizerID').value;
            var sBookmarkCollection = document.getElementById('rdBookmarkCollection').value;
            var sReportID = document.getElementById('rdBookmarkOrganizerReport').value;

            rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=AddFolderShortcut&rdFolderID=' + sFolderID + '&rdFolderName=' + sFolderName + '&rdReceivingFolderID=' + sReceivingFolderID + '&rdShortcutCollection=' + sShortcutCollection + '&rdShortcutUserName=' + sShortcutUserName + '&rdBookmarkCollection=' + sBookmarkCollection + '&rdBookmarkOrganizerID=' + sBookmarkOrganizerID + '&rdReport=' + sReportID);
        },
    },
    {
        NAME: "rdBookmarkOrganizer",
        NS: "rdBookmarkOrganizer",
        ATTRS: {}
    });
}, "1.0.0", { requires: ['base', 'plugin', 'json'] });




