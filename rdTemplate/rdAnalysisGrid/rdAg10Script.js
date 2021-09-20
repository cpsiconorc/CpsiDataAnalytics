YUI.add('analysis-grid', function(Y) {

	Y.namespace('LogiInfo').AnalysisGrid = Y.Base.create('AnalysisGrid', Y.Base, [], {
	
		initializer : function() {

  			//Show the selected tab (if the menu is not hidden) -- Dont show menu if we just added a crosstab or chart 24511
		    if (!Y.Lang.isValue(Y.one('hideAgMenu'))
			&& Y.Lang.isValue(document.getElementById('rdAgCurrentOpenPanel'))) {
		        if (location.href.indexOf("AcChartAdd") > -1 || location.href.indexOf("AxAdd") > -1) {
		            //Don't show an open tab.
		            this.rdAgShowMenuTab("", true);
		        } else {
		            this.rdAgShowMenuTab(document.getElementById('rdAgCurrentOpenPanel').value, true);
		        }
		    }

		    //Show the selected tab (if the menu is not hidden)
			if (!Y.Lang.isValue(Y.one('hideAgMenu'))
			&& Y.Lang.isValue(document.getElementById('rdAgCurrentOpenTablePanel')))
			    this.rdAgShowTableMenuTab(document.getElementById('rdAgCurrentOpenTablePanel').value, true);
			
			//Open the correct chart panel if there is an error
			var chartError = Y.one('#rdChartError');
			if (Y.Lang.isValue(chartError))
				this.rdAgShowChartAdd(chartError.get('value'));
		
			//Initialize draggable panels if not disabled
			if (Y.Lang.isValue(Y.one('#rdAgDraggablePanels')))
			    this.rdInitDraggableAgPanels();

            if (document.getElementById('rdAgCurrentOpenTablePanel')
                && document.getElementById('rdAgCurrentOpenTablePanel').value == ""
                && window.location.search.indexOf("rdAgCurrentOpenTablePanel=None") == -1)
                this.rdAgShowTableMenuTab("Layout");

			if (document.getElementById('rdAllowChartBasedOnCurrentColumns') && document.getElementById('rdAllowChartBasedOnCurrentColumns').value == "False")
			    this.rdSetPanelDisabledClass('Chart');

			if (document.getElementById('rdAllowCrosstabBasedOnCurrentColumns') && document.getElementById('rdAllowCrosstabBasedOnCurrentColumns').value == "False")
			    this.rdSetPanelDisabledClass('Crosstab');

			rdSetUndoRedoVisibility();

			setTimeout(rdAgAddCustomAggregatesToHeaders, 10);
		},

		CURRENT_COLUMN_TOKEN: "@CurrentColumn",
		
		/* -----Analysis Grid Methods----- */
        btnAddAggregate_Click: function () {
            var ddlFunc = document.getElementById("rdAgAggrFunction");
            var ddlColumn = document.getElementById("rdAgAggrColumn");

            var sFunction = ddlFunc.options[ddlFunc.selectedIndex].value;
            var sColumn = ddlColumn.options[ddlColumn.selectedIndex].value;

            var hdn = Y.one("[id^=rdAgHdnAggrAdd_" + sColumn + "_" + sFunction + "_Row]");
            if (!hdn) {
                // Already Added
                return false;
            }

            var a = hdn._node.parentNode;
            var script = LogiXML.getScriptFromLink(a);

            if (script)
                eval(script);

            return false;
        },

        btnEditAggregate_Click: function (lbl) {
            var parent = lbl.parentNode;
            var inpts = parent.getElementsByTagName("INPUT");
            var sCol = null;
            var sAggr = null;
            for (var i = 0; i < inpts.length; i++) {
                var inpt = inpts[i];

                if (inpt.id.indexOf("rdAgActiveAggrColumn") == 0) {
                    sCol = inpt.value;
                } else if (inpt.id.indexOf("rdAgActiveAggrFunction") == 0) {
                    sAggr = inpt.value;
                }
            }

            if (!sCol || !sAggr)
                return;

            var ddlCol = document.getElementById("rdAgAggrColumn");
            ddlCol.value = sCol;
            LogiXML.AnalysisGrid.rdChangeAggregateOptions();

            var ddlAggr = document.getElementById("rdAgAggrFunction");
            ddlAggr.value = sAggr;

            if (sAggr.indexOf("rdAgCustAgg_") == 0) {
                var dt = document.getElementById("dtCustAggs");
                inpts = dt.getElementsByTagName("INPUT");
                for (var i = 0; i < inpts.length; i++) {
                    var inpt = inpts[i];
                    if (inpt.id.indexOf("rdAgCustAggIdHidden_") == 0 && inpt.value == sAggr) {
                        var ext = inpt.id.substr(19);
                        document.rdForm.rdAgCustAggName.value = document.getElementById("lblCustAggName" + ext).innerText;
                        document.rdForm.rdAgCustAggFormula.value = document.getElementById("lblCustAggFormula" + ext).innerText;
                        document.rdForm.rdAgCustAggFormats.value = "";
                        rdAgSetCustAggColumnContext();
                        ShowElement(ddlAggr.id, 'rdAgCustAggPopup', '', '');
                        break;
                    }
                }
            }
        },

        btnReplaceAggregate_Click: function (rdAgAggrRemoveColumn) {
            var ddlFunc = document.getElementById("rdAgAggrFunction");
            var ddlColumn = document.getElementById("rdAgAggrColumn");

            var sFunction = ddlFunc.options[ddlFunc.selectedIndex].value;
            var sColumn = ddlColumn.options[ddlColumn.selectedIndex].value;

            var hdn = Y.one("[id^=rdAgHdnAggrAdd_" + sColumn + "_" + sFunction + "_Row]");
            if (!hdn) {
                // Already Added
                return false;
            }

            var a = hdn._node.parentNode;
            var script = LogiXML.getScriptFromLink(a);
            if (script) {
                if (script.indexOf("'rdAgAggrRemoveColumn'") < 0) {
                    // not a calc with ref - edit href - no popup
                    var i1 = script.indexOf("'");
                    var i2 = script.indexOf("'", i1 + 1);
                    var scriptStart = script.substr(0, i1 + 1);
                    var href = script.substring(i1 + 1, i2);
                    var scriptEnd = script.substr(i2);

                    href = LogiXML.setUrlParameter(href, "rdAgAggrRemoveColumn", rdAgAggrRemoveColumn);
                    href = LogiXML.setUrlParameter(href, "rdAgCommand", "AggrReplace");

                    script = scriptStart + href + scriptEnd;
                } else {
                    script = script.replace("'rdAgAggrRemoveColumn'", "'" + rdAgAggrRemoveColumn + "'");
                }

                if (script)
                    eval(script);
            }

            return false;
        },

        rdAgCustAggContext: null,

		rdAgShowMenuTab: function (sTabName, bCheckForReset, sSelectedColumn, bKeepOpen) {
		    var bNoData = false;
		    var eleStartTableDropdown = document.getElementById('rdStartTable');

		    var eleAgDataColumnDetails = document.getElementById('rdAgDataColumnDetails');
		    if (eleAgDataColumnDetails.value == '') {
		        //No table selected in QB. Show the QB.
		        sTabName = "QueryBuilder"
		        bNoData = true
		    }
            
		    var bOpen = true;

			if (sTabName.length==0){
				bOpen=false;
			}else{
				var eleSelectedTab = document.getElementById('col' + sTabName);
				var eleSelectedRow = document.getElementById('row' + sTabName);

                //24368
				if (eleSelectedTab && eleSelectedTab.className.indexOf('rdAgSelectedTab') != -1) {
				    if (eleSelectedTab.selectionInitialized)
				        bOpen = false;
				}
				if (bCheckForReset){
					if (location.href.indexOf("rdAgLoadSaved")!=-1){
						bOpen = false;
					}
				}
			}
			if (bNoData) {
			    bOpen = true;  //When no data, that tab must always remain open.
			}

			if (bKeepOpen && bKeepOpen == true) {
			    bOpen = true;  //Coming from the ag column menu so we dont want to toggle
			}

			var bAlreadyOpen = false;
			if (document.getElementById('rdAgCurrentOpenPanel').value == sTabName)
			    bAlreadyOpen = true;

			document.getElementById('rdAgCurrentOpenPanel').value = '';

			if (document.getElementById('colQueryBuilder')) {
			    if (!bOpen || sTabName != "QueryBuilder") {
			        this.rdSetClassNameById('colQueryBuilder', 'rdAgUnselectedTab');
			        this.rdSetDisplayById('rowQueryBuilder', 'none');
			    }
			    document.getElementById('colQueryBuilder').selectionInitialized = true;
			}

			if (document.getElementById('colCalc')) {
			    if (!bOpen || sTabName != "Calc") {
			        this.rdSetClassNameById('colCalc', 'rdAgUnselectedTab');
			        this.rdSetDisplayById('rowCalc', 'none');
			    }
			    document.getElementById('colCalc').selectionInitialized = true;
			}

			if (document.getElementById('colFilter')) {
			    if (!bOpen || sTabName != "Filter") {
			        this.rdSetClassNameById('colFilter', 'rdAgUnselectedTab');
			        this.rdSetDisplayById('rowFilter', 'none');
			    }
			    document.getElementById('colFilter').selectionInitialized = true;
			}

			if (bOpen) {
			    
			    document.getElementById('rdAgCurrentOpenPanel').value = sTabName;
                if(eleSelectedTab)
			        eleSelectedTab.className = 'rdAgSelectedTab';

                if(eleSelectedRow)
                    eleSelectedRow.style.display = '';

			    //Dont fade the tab if it is already open
                if (!bCheckForReset && eleSelectedRow && eleSelectedRow.firstChild && !bAlreadyOpen)   // Avoid flicker/fading effect when Paged/Sorted/Postbacks.
                {             
                    rdFadeElementIn(eleSelectedRow.firstChild, 400);    //#11723, #17294 tr does not handle transition well.
                }
			}
			
			this.rdSetMenuClasses(bNoData);

			var iQb = 0;
			var iclQbValue = "";
            //Disable menu's if no data is selected (intially or subsequent joins)
		    while (document.getElementById("iclQbColumns" + iQb) != null) {
		        var Qbval = rdGetInputValues(document.getElementById("iclQbColumns" + iQb))
		        Qbval = decodeURIComponent(Qbval.substring(Qbval.lastIndexOf("=") + 1))
		        iclQbValue += Qbval;
		        iQb += 1;
		    }
		    if ((iclQbValue == "") && (iQb > 0)) {
		        this.rdSetMenuClasses(true);
		    }

			if (typeof window.rdRepositionSliders != 'undefined') {
				//Move CellColorSliders, if there are any.
				rdRepositionSliders();
			}


            //Set column and scroll into view if this came from the table menu
			if (sTabName == "Filter") {
			    if (typeof sSelectedColumn != 'undefined') {
                    //Select the right column
			        Y.one("#rdAfFilterColumnID_rdAgAnalysisFilter").get("options").each(function () {
			            var value = this.get('value');
			            if (value == sSelectedColumn)
			                this.set('selected', true);
			            //this.rdAgShowFilterOptions();
			        });
			        if (document.getElementById('rdAfMode_rdAgAnalysisFilter').value == "Design") {
			            rdAfUpdateEditControls('rdAgAnalysisFilter')
			        } else {
			            //Switch to design mode.
			            document.getElementById('rdAfMode_rdAgAnalysisFilter').value = "Design"
			            rdAfUpdateUi(true, 'rdAgAnalysisFilter', 'Design');
			        }

			        Y.one('#rowsAnalysisGrid').scrollIntoView();
			    }
            }

            rdResizeCurrentIFrame();
			
		},

		rdSetMenuClasses: function (bNoData) {
		    this.rdSetPanelModifiedClass('QueryBuilder');
		    this.rdSetPanelModifiedClass('Calc');
		    this.rdSetPanelModifiedClass('Filter');
		    this.rdSetPanelModifiedClass('TableEdit');
		    if (bNoData) {
		        this.rdSetPanelDisabledClass('Calc');
		        this.rdSetPanelDisabledClass('Filter');
		        this.rdSetPanelDisabledClass('TableEdit');
		        this.rdSetPanelDisabledClass('Chart');
		        this.rdSetPanelDisabledClass('Crosstab');
		    }
		},
        

		rdAgToggleTablePanel: function (initializing) {

		    var expandedState = rdGetCookie('rdPanelExpanded_Table');
		    //We do not want to toggle if we are intializing the AG
		    if (!initializing) {
		        if (expandedState != "True") {
		            expandedState = "True";
		            rdSetCookie('rdPanelExpanded_Table', "True");
		        }
		        else {
		            expandedState = "False";
		            rdSetCookie('rdPanelExpanded_Table', "False");
		        }
		    }
		    
		    if (expandedState != "False") {
		        var divClosed = document.getElementById('divPanelClosed_Table');
		        if (divClosed)
		            divClosed.style.display = 'none';
		        var divOpen = document.getElementById('divPanelOpen_Table');
		        if (divOpen)
		            divOpen.style.display = '';
		        var rowContent = document.getElementById('rowContentTable');
		        if (rowContent)
		            rowContent.style.display = '';
		        var rowMenuOptions = document.getElementById('rowsTableMenuOptions');
		        if (rowMenuOptions)
		            rowMenuOptions.style.display = '';
		        var rowControls = document.getElementById('rowTableControls');
		        if (rowControls)
		            rowControls.style.display = '';
		        var colAddToDashboard = document.getElementById('colAddToDashboardDataTable');
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = '';
		        var rowTableMenu = document.getElementById('colTableMenu');
		        if (rowTableMenu)
		            rowTableMenu.style.display = '';
		        var colTableExport = document.getElementById('colTableExportControls');
		        if (colTableExport)
		            colTableExport.style.display = '';

		        var colTableExport = document.getElementById('colAddToDashboardDataTable');
		        if (colTableExport)
		            colTableExport.style.display = '';

            }
		    else {
		        var divClosed = document.getElementById('divPanelClosed_Table');
		        if (divClosed)
		            divClosed.style.display = '';
		        var divOpen = document.getElementById('divPanelOpen_Table');
		        if (divOpen)
		            divOpen.style.display = 'none';
		        var rowContent = document.getElementById('rowContentTable');
		        if (rowContent)
		            rowContent.style.display = 'none';
		        var rowMenuOptions = document.getElementById('rowsTableMenuOptions');
		        if (rowMenuOptions)
		            rowMenuOptions.style.display = 'none';
		        var rowControls = document.getElementById('rowTableControls');
		        if (rowControls)
		            rowControls.style.display = 'none';
		        var colAddToDashboard = document.getElementById('colAddToDashboardDataTable');
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = 'none';
		        var colTableMenu = document.getElementById('colTableMenu');
		        if (colTableMenu)
		            colTableMenu.style.display = 'none';
		        var colTableExport = document.getElementById('colTableExportControls');
		        if (colTableExport)
		            colTableExport.style.display = 'none';
		    }

		    if (typeof window.rdRepositionSliders != 'undefined') {
		        //Move CellColorSliders, if there are any.
		        rdRepositionSliders();
		    }

		    if (!initializing) {
		        this.rdSavePanelState("Table", expandedState)
		    }

		},

		rdAgToggleCrosstabPanel: function (sID, initializing) {
		    var expandedState = rdGetCookie('rdPanelExpanded_' + sID);
		    //We do not want to toggle if we are intializing the AG
		    if (!initializing) {
		        if (expandedState != "True") {
		            expandedState = "True";
		            rdSetCookie('rdPanelExpanded_' + sID, "True");
		        }
		        else {
		            expandedState = "False";
		            rdSetCookie('rdPanelExpanded_' + sID, "False");
		        }
		    }

		    if (expandedState == "True") {
		        var divClosed = document.getElementById('divPanelClosed_' + sID);
		        if (divClosed)
		            divClosed.style.display = 'none';
		        var divOpen = document.getElementById('divPanelOpen_' + sID);
		        if (divOpen)
		            divOpen.style.display = '';
		        var rowContent = document.getElementById('rowContentAnalCrosstab_' + sID);
		        if (rowContent)
		            rowContent.style.display = '';
		        var colAddToDashboard = document.getElementById('colAnalCrosstabAddDashboard_' + sID);
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = '';
		        var colExportLinks = document.getElementById('colCrosstabExportControls_' + sID);
		        if (colExportLinks)
		            colExportLinks.style.display = '';
		        var colEdit = document.getElementById('colAxEdit_' + sID);
		        if (colEdit)
		            colEdit.style.display = '';
            }
		    else {
		        var divClosed = document.getElementById('divPanelClosed_' + sID);
		        if (divClosed)
		            divClosed.style.display = '';
		        var divOpen = document.getElementById('divPanelOpen_' + sID);
		        if (divOpen)
		            divOpen.style.display = 'none';
		        var rowContent = document.getElementById('rowContentAnalCrosstab_' + sID);
		        if (rowContent)
		            rowContent.style.display = 'none';
		        var colAddToDashboard = document.getElementById('colAnalCrosstabAddDashboard_' + sID);
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = 'none';
		        var colExportLinks = document.getElementById('colCrosstabExportControls_' + sID);
		        if (colExportLinks)
		            colExportLinks.style.display = 'none';
		        var colEdit = document.getElementById('colAxEdit_' + sID);
		        if (colEdit)
		            colEdit.style.display = 'none';
		    }
		    if (!document.getElementById("cellAxCrosstab_" + sID)) {  //Is crosstab table present yet?
		        var colAddToDashboard = document.getElementById('colAnalCrosstabAddDashboard_' + sID);
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = 'none';
		        var colExportLinks = document.getElementById('colCrosstabExportControls_' + sID);
		        if (colExportLinks)
		            colExportLinks.style.display = 'none';
            }
		    if (typeof window.rdRepositionSliders != 'undefined') {
		        //Move CellColorSliders, if there are any.
		        rdRepositionSliders();
		    }

		    if (!initializing) {
		        this.rdSavePanelState(sID, expandedState)
		    }

		},


	    /* ---This function gets a list of AG columns for the datatype specified --- */
		rdAgGetColumnList: function (array, arrayLabel, sDataType, aAggrGroupLabel, aAggrGroupLabelClass, includeGroupAggr) {
		    var eleAgDataColumnDetails = document.getElementById('rdAgDataColumnDetails');
		    if (eleAgDataColumnDetails.value != '') {
		        var sDataColumnDetails = eleAgDataColumnDetails.value;
		        var aDataColumnDetails = sDataColumnDetails.split(',')
		        if (aDataColumnDetails.length > 0) {
		            var i; var j = 0;
		            var sColumnVal = '';
		            for (i = 0; i < aDataColumnDetails.length; i++) {
		                var sDataColumnDetail = aDataColumnDetails[i];
		                if (includeGroupAggr == false && sDataColumnDetail.indexOf('^') > -1) {
		                    sDataColumnDetail = '';
		                }
		                if (sDataColumnDetail.length > 1 && sDataColumnDetail.indexOf(':') > -1) {
		                    var sDataColumnType = sDataColumnDetail.split(':')[1].split("|")[0];
		                    if (sDataType == '') {
		                        sColumnVal = sDataColumnDetail.split(':')[0];
		                        array[i] = sColumnVal.split(';')[0];
		                        arrayLabel[i] = sColumnVal.split(';')[1];
		                        /* 21211 - Non IE browsers need a blank value defined for empty array entries */
		                        if (i == 1) {
		                            array[0] = '';
		                            arrayLabel[0] = '';
		                        }
		                        if (sDataColumnDetail.indexOf("|") > -1) {
		                            aAggrGroupLabel[i] = sDataColumnDetail.split('|')[1].split('-')[0];
		                            if (sDataColumnDetail.indexOf("^") > -1) {
		                                aAggrGroupLabelClass[i] = sDataColumnDetail.split('-')[1].split('^')[0];
		                            }
		                            else {
		                                aAggrGroupLabelClass[i] = sDataColumnDetail.split('|')[1].split('-')[1];
		                            }
		                        }
		                        else {
		                            aAggrGroupLabel[i] = '';
		                            aAggrGroupLabelClass[i] = '';
		                        }
		                    }
		                    else if (sDataType == 'number' && sDataColumnType == 'Number') {
		                        sColumnVal = sDataColumnDetail.split(':')[0];
		                        array[j] = sColumnVal.split(';')[0];
		                        arrayLabel[j] = sColumnVal.split(';')[1];
		                        j++;
		                        if (sDataColumnDetail.indexOf("|") > -1) {
		                            aAggrGroupLabel[j] = sDataColumnDetail.split('|')[1].split('-')[0];
		                            aAggrGroupLabelClass[j] = sDataColumnDetail.split('|')[1].split('-')[1];
		                        }
		                        else {
		                            aAggrGroupLabel[j] = '';
		                            aAggrGroupLabelClass[j] = '';
		                        }
		                    }
		                }
		            }
		            if (sDataType == 'number') {
		                array.unshift('');
		                arrayLabel.unshift('');
		            }
		        }
		    }
		},

		rdAgGetColumnDataType: function (sColumn) {
		    var eleAgDataColumnDetails = document.getElementById('rdAgDataColumnDetails');
		    if (eleAgDataColumnDetails.value != '') {
		        var sDataColumnDetails = eleAgDataColumnDetails.value;
		        var aDataColumnDetails = sDataColumnDetails.split(',')
		        if (aDataColumnDetails.length > 0) {
		            var i;
		            for (i = 0; i < aDataColumnDetails.length; i++) {
		                var sDataColumnDetail = aDataColumnDetails[i];
		                if (sDataColumnDetail.length > 1 && sDataColumnDetail.indexOf(':') > -1) {
		                    var sDataColumn = sDataColumnDetail.split(':')[0];
		                    sDataColumn = sDataColumn.split(';')[0];
		                    if (sDataColumn == sColumn) {
		                        //22397
		                        return sDataColumnDetail.split(':')[1].split("|")[0];
		                    }
		                }
		            }
		        }
		    }
		},


		rdAgToggleChartPanel: function (sID, initializing) {

		    var expandedState = rdGetCookie('rdPanelExpanded_' + sID);
		    //We do not want to toggle if we are intializing the AG
		    if (!initializing) {
		        if (expandedState != "True") {
		            expandedState = "True";
		            rdSetCookie('rdPanelExpanded_' + sID, "True");
		        }
		        else {
		            expandedState = "False";
		            rdSetCookie('rdPanelExpanded_' + sID, "False");
		        }
		    }

		    if (expandedState == "True") {
		        var divClosed = document.getElementById('divPanelClosed_' + sID);
		        if (divClosed)
		            divClosed.style.display = 'none';
		        var divOpen = document.getElementById('divPanelOpen_' + sID);
		        if(divOpen)
		            divOpen.style.display = '';
		        var rowContent = document.getElementById('rowContentAnalChart_' + sID);
		        if (rowContent)
		            rowContent.style.display = '';
		        var colAddToDashboard = document.getElementById('colAnalChartAddDashboard_' + sID);
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = '';
		        var colEdit = document.getElementById('colAcEdit_' + sID);
		        if (colEdit)
		            colEdit.style.display = '';
		    }
		    else {
		        var divClosed = document.getElementById('divPanelClosed_' + sID);
		        if (divClosed)
		            divClosed.style.display = '';
		        var divOpen = document.getElementById('divPanelOpen_' + sID);
		        if (divOpen)
		            divOpen.style.display = 'none';
		        var rowContent = document.getElementById('rowContentAnalChart_' + sID);
		        if (rowContent)
		            rowContent.style.display = 'none';
		        var colAddToDashboard = document.getElementById('colAnalChartAddDashboard_' + sID);
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = 'none';
		        var colEdit = document.getElementById('colAcEdit_' + sID);
		        if (colEdit)
		            colEdit.style.display = 'none';
		    }
		    if (!document.getElementById("rdAcChart_" + sID)) {
		        var colAddToDashboard = document.getElementById('colAnalChartAddDashboard_' + sID);
		        if (colAddToDashboard)
		            colAddToDashboard.style.display = 'none';
		    }
		    if (typeof window.rdRepositionSliders != 'undefined') {
		        //Move CellColorSliders, if there are any.
		        rdRepositionSliders();
		    }


		    if (!initializing) {
		        this.rdSavePanelState(sID, expandedState)
		    }

		},

		rdSavePanelState: function (sPanelID, sExpanded) {
		    //Save the panel state in the SaveFile/bookmark.
		    var rdPanelParams = "&rdReport=" + document.getElementById("rdAgReportId").value;
		    rdPanelParams += "&rdAgPanelID=" + sPanelID;
		    rdPanelParams += "&rdAgId=" + document.getElementById('rdAgId').value;
		    rdPanelParams += "&rdAgPanelEpanded=" + sExpanded;
		    rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=UpdateAgPanelState' + rdPanelParams);
		},

		rdChangeAggregateOptions: function(){
		    var aAggrList = []; var aAggrListLabel = []; var aAggrGroupLabel = []; var aAggrGroupLabelClass = [];

		    this.rdAgGetColumnList(aAggrList, aAggrListLabel, '', aAggrGroupLabel, aAggrGroupLabelClass, false);
	
		    var rdColList = document.getElementById('rdAgAggrColumn');
		    var sVal = rdColList.options[rdColList.selectedIndex].value;

			var btnAdd = document.getElementById("rdAgBtnAddAggr");
			var dataType;
            // for the blank default option, set datatype to a random value instead of undefined, so that all the aggregate options are repopulated.26028
			if (sVal == this.CURRENT_COLUMN_TOKEN) {
				dataType = 'all';

				if (!btnAdd.originalVisibility)
					btnAdd.originalVisibility = btnAdd.style.visibility;

				btnAdd.style.visibility = "hidden";
			} else {
				dataType = this.rdAgGetColumnDataType(sVal);

				if (btnAdd.style.visibility == "hidden")
					btnAdd.style.visibility = btnAdd.originalVisibility;
            }

            rdchangeList('rdAgAggrFunction', aAggrList, aAggrListLabel, dataType, '', '');

            if (this.rdAgCustAggContext && this.rdAgCustAggContext != sVal) {
                // clear out custom aggregate formula to get the default for the newly selected column
                var txtCustAgg = document.getElementById("rdAgCustAggFormula");
                if (txtCustAgg && txtCustAgg.value)
                    txtCustAgg.value = "";

                // clear out old name
                txtCustAgg = document.getElementById("rdAgCustAggName");
                if (txtCustAgg && txtCustAgg.value)
                    txtCustAgg.value = "";
            }

            this.rdAgCustAggContext = sVal;
		},

		rdAgTableTogglePanelMenu: function (initializing) {

		    var expandedState = rdGetCookie('rdTablePanelMenuExpanded');
		    //We do not want to toggle if we are intializing the AG
		    if (!initializing) {
		        if (expandedState != "True") {
		            expandedState = "True";
		            rdSetCookie('rdTablePanelMenuExpanded', "True");
		        }
		        else {
		            expandedState = "False";
		            rdSetCookie('rdTablePanelMenuExpanded', "False");
		        }
		    }

		    if (expandedState == "False") {
		        var menu = document.getElementById('rowTableMenu');
		        if (menu)
		            menu.style.display = 'none';
		    }
		    else {
		        var menu = document.getElementById('rowTableMenu');
		        if (menu)
		            menu.style.display = '';
		    }
		    if (typeof window.rdRepositionSliders != 'undefined') {
		        //Move CellColorSliders, if there are any.
		        rdRepositionSliders();
		    }

		},

		rdAgChartTogglePanelMenu: function (sID, initializing) {
  
		    var expandedState = rdGetCookie('rdChartPanelMenuExpanded_' + sID);
		    //We do not want to toggle if we are intializing the AG
		    if (!initializing) {
		        if (expandedState != "True") {
		            expandedState = "True";
		            rdSetCookie('rdChartPanelMenuExpanded_' + sID, "True");
		        }
		        else {
		            expandedState = "False";
		            rdSetCookie('rdChartPanelMenuExpanded_' + sID, "False");
		        }
		    }
		    if (expandedState == "False") {
		        var types = document.getElementById('divAcChartTypes_' + sID);
		        if (types)
		            types.style.display = 'none';
		        var lists = document.getElementById('divChartLists_' + sID);
		        if (lists)
		            lists.style.display = 'none';
		        var controls = document.getElementById('divAcControls_' + sID);
		        if (controls)
		            controls.style.display = 'none';
		    }
		    else {
		        var types = document.getElementById('divAcChartTypes_' + sID);
		        if (types)
		            types.style.display = '';
		        var lists = document.getElementById('divChartLists_' + sID);
		        if (lists)
		            lists.style.display = '';
		        var controls = document.getElementById('divAcControls_' + sID);
		        if (controls)
		            controls.style.display = '';
		    }
		    if (typeof window.rdRepositionSliders != 'undefined') {
		        //Move CellColorSliders, if there are any.
		        rdRepositionSliders();
		    }

		},
    
		rdAgCrosstabTogglePanelMenu: function (sID, initializing) {

		    var expandedState = rdGetCookie('rdCrosstabPanelMenuExpanded_' + sID);
            //We do not want to toggle if we are intializing the AG
		    if (!initializing) {
		        if (expandedState != "True") {
		            expandedState = "True";
		            rdSetCookie('rdCrosstabPanelMenuExpanded_' + sID, "True");
		        }
		        else {
		            expandedState = "False";
		            rdSetCookie('rdCrosstabPanelMenuExpanded_' + sID, "False");
		        }
		    }

		    if (expandedState == "False") {
		        var controls = document.getElementById('divAxControls_' + sID);
		        if(controls)
		            controls.style.display = 'none';
		    }
		    else {
		        var controls = document.getElementById('divAxControls_' + sID);
		        if (controls)
		            controls.style.display = '';
		        var selected = document.getElementById('divAxEditSelected_' + sID);
		        if (selected)
		            selected.style.display = '';
		        var unselected = document.getElementById('divAxEditUnselected_' + sID);
		        if (unselected)
		            unselected.style.display = 'none';
		    }
		    if (typeof window.rdRepositionSliders != 'undefined') {
		        //Move CellColorSliders, if there are any.
		        rdRepositionSliders();
		    }

		},

		rdAgShowTableMenuTab: function (sTabName, bCheckForReset, sSelectedColumn) {

		    var bNoData = false;
		    var bOpen = true;

		    //sTabName may have a ,
		    sTabName = sTabName.replace(/,/g, "")

		    if (sTabName.length == 0) {
		        bOpen = false;
		    } else {
		        var eleSelectedTab = document.getElementById('lblHeading' + sTabName);
		        var eleSelectedRow = document.getElementById('row' + sTabName);

		        //24368
                if (eleSelectedTab && eleSelectedTab.className.indexOf('rdAgCommandHighlight') != -1) {
		            bOpen = false;
		        }
		        if (bCheckForReset) {
		            if (location.href.indexOf("rdAgLoadSaved") != -1) {
		                bOpen = false;
		            }
		        }
		    }
		    if (bNoData) {
		        bOpen = true;  //When no data, that tab must always remain open.
		    }

		    document.getElementById('rdAgCurrentOpenTablePanel').value = '';

		    this.rdSetClassNameById('lblHeadingGroup', 'rdAgCommandIdle');
		    this.rdSetClassNameById('lblHeadingAggr', 'rdAgCommandIdle');
		    this.rdSetClassNameById('lblHeadingPaging', 'rdAgCommandIdle');
		    this.rdSetClassNameById('lblHeadingSortOrder', 'rdAgCommandIdle');
		    this.rdSetClassNameById('lblHeadingLayout', 'rdAgCommandIdle');

		    this.rdSetDisplayById('rowLayout', 'none');
		    this.rdSetDisplayById('rowSortOrder', 'none');
		    this.rdSetDisplayById('rowGroup', 'none');
		    this.rdSetDisplayById('rowAggr', 'none');
		    this.rdSetDisplayById('rowPaging', 'none');


		    if (bOpen && eleSelectedTab) {
		        document.getElementById('rdAgCurrentOpenTablePanel').value = sTabName;
		        eleSelectedTab.className = 'rdAgCommandHighlight';

		        if (eleSelectedRow)
		            eleSelectedRow.style.display = '';
		        if (!bCheckForReset && eleSelectedRow && eleSelectedRow.firstChild)   // Avoid flicker/fading effect when Paged/Sorted/Postbacks.
		            rdFadeElementIn(eleSelectedRow.firstChild, 400);    //#11723, #17294 tr does not handle transition well.
		    }

		    if (sTabName == "Group") {
		        this.rdAgGetGroupByDateOperatorDiv();
		    }

		    if (sTabName == "Aggr") { 
		        this.rdChangeAggregateOptions(); //RD20741
		    }
		    
		},

		rdSetClassNameById: function (sId, sClassName) {
			var ele = document.getElementById(sId);
			if(ele) {
				ele.className = sClassName;
			}
		},
		rdSetDisplayById : function(sId, sDisplay) {
			var ele = document.getElementById(sId);
			if(ele) {
				ele.style.display = sDisplay;
			}
		},
		rdSetPanelModifiedClass: function (sPanel) {
		    var nodeButton = Y.one("#col" + sPanel);
		    if (Y.Lang.isValue(nodeButton) && nodeButton.one('table').hasClass('rdHighlightOn')) {
		        nodeButton._node.style.fontWeight = 'bold';
		    }
		},
		rdSetPanelDisabledClass: function (sPanel) {
		    var nodeButton = Y.one("#col" + sPanel);
		    if (nodeButton != null) {
		        nodeButton.addClass("rdAgDisabledTab");
		    }
		},
		rdAgGetGroupByDateOperatorDiv : function(){
			// Function used by the Grouping division for hiding/unhiding the GroupByOperator Div.
			if((document.rdForm.rdAgPickDateColumnsForGrouping.value.indexOf(document.rdForm.rdAgGroupColumn.value + ",")!=-1) && (document.rdForm.rdAgGroupColumn.value.length != 0)){
				if(Y.Lang.isValue(Y.one('#divGroupByDateOperator')))
					ShowElement(this.id,'divGroupByDateOperator','Show');
			}
			else{
				if(Y.Lang.isValue(Y.one('#divGroupByDateOperator'))){
					ShowElement(this.id,'divGroupByDateOperator','Hide');
					document.rdForm.rdAgDateGroupBy.value='';
				}
			}
		},
	
	
		/* -----Draggable Panels----- */
		rdInitDraggableAgPanels : function(){
			var bDraggableAgPanels = false;
			var eleDraggableAgPanels = document.getElementById('rdAgDraggablePanels');
			if (eleDraggableAgPanels!= null) bDraggableAgPanels = true;  
		  			
			var aDraggableAgPanels = this.rdGetDraggableAgPanels();
		    //Destroy the registered drag/drop nodes if any.
			for (i = 0; i < aDraggableAgPanels.length; i++) {
			    Y.DD.DDM.getNode(aDraggableAgPanels[i]).destroy();
			}
			if (aDraggableAgPanels.length > 1) {
			    for (var i = 0; i < aDraggableAgPanels.length; i++) {
			        var eleAgPanel = aDraggableAgPanels[i];
			        if (bDraggableAgPanels) {

			            var pnlNode = Y.one('#' + LogiXML.escapeSelector(eleAgPanel.id));
			            var pnlDD = new Y.DD.Drag({
			                node: pnlNode
			            });
			            var pnlDrop = pnlNode.plug(Y.Plugin.Drop);
                        //25557
			            pnlNode.addClass('dragHandleOnly');

			            var pnlDragged = null;
			            var originalPanelPosition = [0, 0];
			            var bDoNothingMore = false;

			            pnlDD.on('drag:start', this.Panel_onDragStart, this);
			            pnlDD.on('drag:drag', this.Panel_onDrag, this);
			            pnlDD.on('drag:over', this.Panel_onDragOver, this);
			            pnlDD.on('drag:drophit', this.Panel_onDropHit, this);
			            pnlDD.on('drag:end', this.Panel_onDragEnd, this);

			            var elePanelHeaderId = (Y.Selector.query('table.rdAgContentHeadingRow', eleAgPanel).length == 0 ?
                                                Y.Selector.query('td.rdAgContentHeading', eleAgPanel)[0].id :
                                                Y.Selector.query('table.rdAgContentHeadingRow', eleAgPanel)[0].id);

                        var panelHeaderSelector = "#" + LogiXML.escapeSelector(elePanelHeaderId);

                        var pnlTitleNode = Y.one(panelHeaderSelector);
                        pnlDD.addHandle(panelHeaderSelector).plug(Y.Plugin.DDWinScroll, { horizontal: false, vertical: true, scrollDelay: 100, windowScroll: true });
			            pnlTitleNode.setStyle('cursor', 'move');
			        }
			    }
			}
		},
			
		/* -----Events----- */
		
		Panel_onDragStart : function(e) {
			pnlDragged = e.target.get('dragNode').getDOMNode();
			this.rdSetDraggableAgPanelsZIndex(pnlDragged, e.target.panels);
			Y.DOM.setStyle(pnlDragged, "opacity", '.65');
			originalPanelPosition = Y.DOM.getXY(pnlDragged);
			bDoNothingMore = false;
			this.set('targetPanel', null);
		},
		
		Panel_onDragOver : function(e) {
			this.set('targetPanel', e.drop.get('node').getDOMNode());
			
			var eleTargetPanel = this.get('targetPanel');
			pnlDragged = e.target.get('dragNode').getDOMNode();
			
			if(eleTargetPanel.id.match('rdDivAgPanelWrap_')) {
					var regionDraggedPanel = Y.DOM.region(pnlDragged);
					var regionTargetPanel = Y.DOM.region(eleTargetPanel);
					var nTargetPanelHeight = regionTargetPanel.height; 
					eleTargetPanelHandle = eleTargetPanel.nextSibling;
					if(originalPanelPosition[1] < regionDraggedPanel.top){
						if(regionDraggedPanel.top > (regionTargetPanel.top + Math.round(nTargetPanelHeight/2))){
							 eleTargetPanel.nextSibling.firstChild.firstChild.firstChild.className = 'rdAgDropZoneActive';
						}else{
							 eleTargetPanel.previousSibling.firstChild.firstChild.firstChild.className = 'rdAgDropZoneActive';
						}
					}else{
						 if(regionDraggedPanel.top < (regionTargetPanel.top + Math.round(nTargetPanelHeight/2))){
							eleTargetPanel.previousSibling.firstChild.firstChild.firstChild.className = 'rdAgDropZoneActive';                             
						}else{
							eleTargetPanel.nextSibling.firstChild.firstChild.firstChild.className = 'rdAgDropZoneActive';  
						}
					}
				} 
		},
		
		Panel_onDrag : function(e) {
			this.rdNeutralizeDropZoneColor();   
			
			var eleTargetPanel = this.get('targetPanel');
			
			if(!Y.Lang.isValue(eleTargetPanel)){							
				pnlDragged.previousSibling.firstChild.firstChild.firstChild.className = 'rdAgDropZoneActive';
			}
		},
		
		Panel_onDropHit : function(e) {
			this.rdMoveAgPanels(pnlDragged, this.get('targetPanel'), originalPanelPosition, bDoNothingMore);		    
			pnlDragged.style.cssText = '';
			Y.DOM.setStyle(pnlDragged, "opacity", '1');
			bDoNothingMore = true;
		},
		
		Panel_onDragEnd : function(e) {
			var context = this;
			this.rdMoveAgPanels(pnlDragged, this.get('targetPanel'), originalPanelPosition, bDoNothingMore);
			pnlDragged.style.cssText = '';
			Y.DOM.setStyle(pnlDragged, "opacity", '1');
			if(LogiXML.features['touch']) 
				setTimeout(function(){context.rdResetAGPanelAfterDDScroll(pnlDragged)}, 1000);  // Do this for the Tablet only, #15364.
		},
		
		/* -----Draggable Panel Methods----- */
		
		rdMoveAgPanels : function(eleDraggedPanel, eleTargetPanel, originalPanelPosition, bDoNothing) {
			
			if(!bDoNothing){
			
				var regionDraggedPanel = Y.DOM.region(eleDraggedPanel);						
				var eleDraggedPanelHandle = eleDraggedPanel.nextSibling;
					
				if(eleTargetPanel){						
					
					var regionTargetPanel = Y.DOM.region(eleTargetPanel);	
					var nTargetPanelHeight = regionTargetPanel.height;
					var eleTargetPanelHandle = eleTargetPanel.nextSibling;							
					
					if(eleTargetPanel.id.match('rdDivAgPanelWrap_')) {
						
						if(originalPanelPosition[1] < regionDraggedPanel.top){
							if(regionDraggedPanel.top > (regionTargetPanel.top + Math.round(nTargetPanelHeight/2))){
								 if(eleTargetPanelHandle.nextSibling){
									eleTargetPanel.parentNode.insertBefore(eleDraggedPanel, eleTargetPanelHandle.nextSibling);
									eleTargetPanel.parentNode.insertBefore(eleDraggedPanelHandle, eleTargetPanelHandle.nextSibling.nextSibling);                                
								}else{
									 eleTargetPanel.parentNode.appendChild(eleDraggedPanel);
									 eleTargetPanel.parentNode.appendChild(eleDraggedPanelHandle);
								}
							}else{
								eleTargetPanel.parentNode.insertBefore(eleDraggedPanel, eleTargetPanel);
								eleTargetPanel.parentNode.insertBefore(eleDraggedPanelHandle, eleTargetPanel);
							}
							this.rdSaveDraggableAgPanelPositions();
						}else{
							 if(regionDraggedPanel.top < (regionTargetPanel.top + Math.round(nTargetPanelHeight/2))){
								eleTargetPanel.parentNode.insertBefore(eleDraggedPanel, eleTargetPanel);
								eleTargetPanel.parentNode.insertBefore(eleDraggedPanelHandle, eleTargetPanel);                          
							}else{
								if(eleTargetPanelHandle.nextSibling){
									eleTargetPanel.parentNode.insertBefore(eleDraggedPanel, eleTargetPanelHandle.nextSibling);
									eleTargetPanel.parentNode.insertBefore(eleDraggedPanelHandle, eleTargetPanelHandle.nextSibling.nextSibling);
								}else{
									eleTargetPanel.parentNode.appendChild(eleDraggedPanel);
									eleTargetPanel.parentNode.appendChild(eleDraggedPanelHandle);
								}
							} 
							this.rdSaveDraggableAgPanelPositions();
						}
					}
				}
				else{
					var aDraggableAgPanels = this.rdGetDraggableAgPanels();
					var regionDraggedPanel = Y.DOM.region(eleDraggedPanel);
					if(originalPanelPosition[1] < regionDraggedPanel.top){
						if(eleDraggedPanel.id != aDraggableAgPanels[aDraggableAgPanels.length-1].id){
							if(regionDraggedPanel.top > Y.DOM.region(aDraggableAgPanels[aDraggableAgPanels.length-1]).bottom){
								aDraggableAgPanels[0].parentNode.appendChild(eleDraggedPanel);
								aDraggableAgPanels[0].parentNode.appendChild(eleDraggedPanelHandle);
								this.rdSaveDraggableAgPanelPositions();
							}
						}
					}else{
						if(eleDraggedPanel.id != aDraggableAgPanels[0].id){
							if(regionDraggedPanel.top < Y.DOM.region(aDraggableAgPanels[0]).top){
								aDraggableAgPanels[0].parentNode.insertBefore(eleDraggedPanel, aDraggableAgPanels[0]);
								aDraggableAgPanels[0].parentNode.insertBefore(eleDraggedPanelHandle, aDraggableAgPanels[0]);
								this.rdSaveDraggableAgPanelPositions();
							}
						}
					}
				}
				this.rdNeutralizeDropZoneColor();
				eleDraggedPanel.style.top = '0px';   
				eleDraggedPanel.style.left = '0px';
			}
			
		},
		
		rdSaveDraggableAgPanelPositions : function(){
			var rdPanelParams = "&rdReport=" + document.getElementById("rdAgReportId").value;
			rdPanelParams += "&rdAgPanelOrder="; 
			var aDraggableAgPanels = this.rdGetDraggableAgPanels();
			for (var i=0; i < aDraggableAgPanels.length; i++){
			    var eleAgPnl = aDraggableAgPanels[i];
			    if(rdPanelParams.indexOf(eleAgPnl.id.replace('rdDivAgPanelWrap_', '') + ',') < 0)
				    rdPanelParams += eleAgPnl.id.replace('rdDivAgPanelWrap_', '') + ',';
			}
			rdPanelParams += "&rdAgId=" + document.getElementById('rdAgId').value;

			window.status = "Saving dashboard panel positions.";
			rdAjaxRequestWithFormVars('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=UpdateAgPanelOrder' + rdPanelParams);
		},

		rdGetDraggableAgPanels : function(){
				var aDraggableAgPanels = new Array();
				var eleDivAgPanels = document.getElementById('rdDivAgPanels');
				if(eleDivAgPanels == null) return aDraggableAgPanels; //#16596.
				var aDraggableAgDivs = eleDivAgPanels.getElementsByTagName("div")
				for(i=0;i<aDraggableAgDivs.length;i++){
					var eleDraggableAgDiv = aDraggableAgDivs[i];
					if (eleDraggableAgDiv.id && eleDraggableAgDiv.id.indexOf('rowMenu') < 0 && eleDraggableAgDiv.id.indexOf('rowTitle') < 0) {
						if((eleDraggableAgDiv.id.indexOf('rdDivAgPanelWrap_row') > -1)) {
						    if(Y.Lang.isValue(eleDraggableAgDiv.firstChild.firstChild)){
						        if(eleDraggableAgDiv.firstChild.firstChild.firstChild.style.display != 'none'){
						            aDraggableAgPanels.push(eleDraggableAgDiv);
						        }
						    }else{
                                //Defensive way of avoiding the empty panel issues.
						        var eleEmptyPanel = Y.one(eleDraggableAgDiv).getDOMNode();
						        var eleEmptyPanelDropZone = eleEmptyPanel.previousSibling;
						        eleEmptyPanel.parentNode.removeChild(eleEmptyPanel);
						        eleEmptyPanelDropZone.parentNode.removeChild(eleEmptyPanelDropZone);
						        eleDraggableAgDiv = Y.one('#' + LogiXML.escapeSelector(eleDraggableAgDiv.id)).getDOMNode();
						        aDraggableAgPanels.push(eleDraggableAgDiv);
						    }
						}
					}
				}
				return aDraggableAgPanels;
		},
		
		rdSetDraggableAgPanelsZIndex : function(eleAgPanel, aDraggableAgPanels){
			
			aDraggableAgPanels = this.rdGetDraggableAgPanels()
			for (var i=0; i < aDraggableAgPanels.length; i++){
				var eleAgPnl = aDraggableAgPanels[i];
				if(eleAgPnl.id == eleAgPanel.id){
					 Y.DOM.setStyle(eleAgPnl, "zIndex", 1000);
				}else{
					Y.DOM.setStyle(eleAgPnl, "zIndex", 0);
				}           
			}    
		},
					
		rdResetAGPanelAfterDDScroll : function(elePnlDragged){

			var pnlDragged = Y.one(elePnlDragged);
			pnlDragged.setStyles({
				left:0,
				top:0        
			});    
		},
		
		rdNeutralizeDropZoneColor : function(){

			var aDropZoneTDs = Y.Selector.query('td.rdAgDropZoneActive', Y.DOM.byId('rdDivAgPanels'));
			for (var i=0; i < aDropZoneTDs.length; i++){
				var eleDropZoneTD = aDropZoneTDs[i];
				eleDropZoneTD.className = 'rdAgDropZone';
			}
        },


        rdShowColorRangePopup: function (sColumnID, sCurrentColorRanges, rdCurrentColorRangeFullRow, sDataType) {
            //There are already color ranges, restore them in the UI.
            var aColorRanges = sCurrentColorRanges.split("|");
            for (i = 1; i < 11; i++) {
                var eleInputRange = document.getElementById("rdAgRangeValue" + i);
                if (eleInputRange) {
                    if (i < aColorRanges.length) {
                        eleInputRange.value = aColorRanges[i - 1].split(":")[0];
                        this.rdSetPickerColor("rdAgRangeColor" + i, aColorRanges[i - 1].split(":")[1])
                    } else {
                        //Set blank values and colors for rows with no data
                        eleInputRange.value = ""
                        this.rdSetPickerColor("rdAgRangeColor" + i, "")
                    }
                }
            }

            //Restore color all cells of row or not.
            var eleColorRangeFullRowCheckbox = document.getElementById("rdAgColorRangeFullRow");
            if (eleColorRangeFullRowCheckbox) {
                if (rdCurrentColorRangeFullRow == "True") {
                    eleColorRangeFullRowCheckbox.checked = true;
                }
            }

            //Show and hide some help and caption text.
            var eleHelpRange = document.getElementById("lblColorRangeHelp");
            var eleHelpList = document.getElementById("lblColorListHelp");
            var eleHeaderRange = document.getElementById("lblColorRangeHeader");
            var eleHeaderList = document.getElementById("lblColorListHeader");
            if (sDataType == "Number") {
                eleHelpRange.style.display = "";
                eleHelpList.style.display = "none";
                eleHeaderRange.style.display = "";
                eleHeaderList.style.display = "none";
            } else {
                eleHelpRange.style.display = "none";
                eleHelpList.style.display = "";
                eleHeaderRange.style.display = "none";
                eleHeaderList.style.display = "";
            }

            if (aColorRanges.length > 6) {
                ShowElement(this.id, 'rowMore', 'Hide')
                ShowElement(this.id, 'rowColor6', 'Show')
                ShowElement(this.id, 'rowColor7', 'Show')
                ShowElement(this.id, 'rowColor8', 'Show')
                ShowElement(this.id, 'rowColor9', 'Show')
                ShowElement(this.id, 'rowColor10', 'Show')
            }

            document.getElementById("rdAgColorRangeColumnID").value = sColumnID;
            ShowElement(this.id, 'panelColorRanges', 'Show');
        },

        rdSetPickerColor: function (sColorPickerID, sColor) {
            sColor = sColor.trim()
            if (sColor == "") {
                 // "Special" handling for a blank/transparent color.
                var eleInputRangeColor = Y.one("input#" + sColorPickerID)._node
                eleInputRangeColor.value = ""
                var eleInputColorIndicator = Y.one("#rectColorIndicator_" + sColorPickerID)._node
                eleInputColorIndicator.style.backgroundColor = ""
            } else {  // "Normal" color setting.
                var eleInputColor = Y.one("div#" + sColorPickerID);
                var yColorPicker = eleInputColor.getData("rdInputColorPicker");
                yColorPicker.setValue(sColor);
                yColorPicker.updatePicker();
            }

        }

	},{
		// Y.AnalysisGrid properties		
		/**
		 * The identity of the widget.
		 *
		 * @property AnalysisGrid.NAME
		 * @type String
		 * @default 'AnalysisGrid'
		 * @readOnly
		 * @protected
		 * @static
		 */
		NAME : 'analysisgrid',
		
		/**
		 * Static property used to define the default attribute configuration of
		 * the Widget.
		 *
		 * @property AnalysisGrid.ATTRS
		 * @type {Object}
		 * @protected
		 * @static
		 */
		ATTRS : {
		
			targetPanel : {
				value: null
			}
		
			/*rdFilterOldComparisonOptionsArray: {
				value: new Array()
			},
			rdFilterNewComparisonOptionsArray: {
				value: new Array()
			}*/			
		},

        rdSaveColumnWidths: function () {
            if (!LogiXML || !LogiXML.ResizableColumns || !LogiXML.ResizableColumns.getWidths || !document.rdForm)
                return;

            var hidden = document.getElementsByName("rdColumnWidths");

            if (hidden && hidden.length > 0)
                hidden = hidden[0];
            else
            {
                hidden = document.createElement("input");
                hidden.type = "hidden";
                hidden.name = "rdColumnWidths";
                document.rdForm.appendChild(hidden);
            }

            var widths = LogiXML.ResizableColumns.getWidths();

            hidden.value = JSON.stringify(widths);
        }
	});

}, '1.0.0', {requires: ['dd-drop-plugin', 'dd-plugin', 'dd-scroll', 'dd-constrain']});


function rdAgSwapFilterMode() {
    if (document.getElementById('rdAfMode_rdAgAnalysisFilter').value == "Design") {
        rdAfSetMode('rdAgAnalysisFilter', 'Simple')
    }else{
        rdAfSetMode('rdAgAnalysisFilter', 'Design')
    }
}


var sColorPicker = '1';

function GetColorPicker(sColorPickerValue, obj){
    sColorPicker = sColorPickerValue;    
}

function PickGaugeGoalColor(colColor){
    var sColor = Y.Color.toHex(Y.one('#' + LogiXML.escapeSelector(colColor.id)).getComputedStyle('backgroundColor'));
    var eleColorHolder = document.getElementById('rdAgGaugeGoalsColor' + sColorPicker);
    eleColorHolder.value = sColor;
    var elePickedColorIndicator = document.getElementById('rectColor' + sColorPicker);
    elePickedColorIndicator.style.backgroundColor = sColor;
    ShowElement(this.id,'ppColors','Hide');
}

/* --- Helper functions to change drop down lists for AG aggregate as well as y-axis columns.--- */
function rdchangeList(rdEleId, aNewAggrList, aLabel, sDataColumnType, aAggrGroupLabel, aAggrGroupLabelClass) {
    var rdAggrList = document.getElementById(rdEleId);
    var sSelectedValue
    if (rdAggrList.selectedIndex != -1) {
        sSelectedValue = rdAggrList.options[rdAggrList.selectedIndex].text;
    }
    rdemptyList(rdEleId);    
    rdfillList(rdEleId, aNewAggrList, aLabel, sDataColumnType, sSelectedValue, aAggrGroupLabel, aAggrGroupLabelClass);
}

function rdemptyList(rdEleId) {
    var rdAggrList = document.getElementById(rdEleId);
    while (rdAggrList.options.length) rdAggrList.options[0] = null;

    //Remove the option groups if they are present (they get rebuilt later)
    for (var i = 0; i < rdAggrList.childNodes.length; i++) {
        if (rdAggrList.childNodes[i].nodeName == "optgroup" || rdAggrList.childNodes[i].nodeName == "OPTGROUP") {
            rdAggrList.childNodes[i].parentNode.removeChild(rdAggrList.childNodes[i]);
            i = i - 1;
        }
    }
}

function rdfillList(rdEleId, arr, aLabel, sDataColumnType, sSelectedValue, arrGroupLabel, arrGroupLabelClass) {
    if ( !sDataColumnType || sDataColumnType == '' ) {
        return
    }

    var eleAgAggrFuncList = document.getElementById('rdAgAggrFunctionList');
    var aAggrList;
    if (eleAgAggrFuncList.value != '') {
        var sAggrList = eleAgAggrFuncList.value;
        aAggrList = sAggrList.split('|')        
    }

    if (sDataColumnType.toLowerCase() == "boolean") {
        arr = ["COUNT", "DISTINCTCOUNT"];
        aLabel = ["Count", "Distinct Count"];
        if (aAggrList.length > 0) {
            aLabel = [aAggrList[3], aAggrList[4]];
        }
    }
    else if (sDataColumnType.toLowerCase() == "text" ||
        sDataColumnType.toLowerCase() == "date" ||
        sDataColumnType.toLowerCase() == "datetime")
         {
        arr = ["COUNT", "DISTINCTCOUNT", "MIN", "MAX"];
        aLabel = ["Count", "Distinct Count", "Minimum", "Maximum"];
        if (aAggrList.length > 0) {
            aLabel = [aAggrList[3], aAggrList[4], aAggrList[5], aAggrList[6]];
        }
    }
    else {
        arr = ["SUM", "AVERAGE", "STDEV", "COUNT", "DISTINCTCOUNT", "MIN", "MAX"];
        aLabel = ["Sum", "Average", "Standard Deviation", "Count", "Distinct Count", "Minimum", "Maximum"];
        if (aAggrList.length > 0) {
            aLabel = aAggrList;
        }
    }

    if (rdAgIsActiveSQL()) {
        var ddlAggrCol = document.getElementById("rdAgAggrColumn");
        if (ddlAggrCol && ddlAggrCol.selectedIndex >= 0) {
			var custAggs = rdAgGetCustomAggregates(ddlAggrCol.options[ddlAggrCol.selectedIndex].value, sDataColumnType);

            for (var i = 0; i < custAggs.length; i++) {
                var custAgg = custAggs[i];

                if (arr.indexOf(custAgg.id) < 0) {
                    arr.push(custAgg.id);
                    aLabel.push(custAgg.name);
                }
            }

            if (arr.indexOf("Custom") < 0) {
                arr.push("Custom");
                aLabel.push(rdAgCustAggShowPopupCaption());
            }
        }
    }

    var rdAggrList = document.getElementById(rdEleId);    
    var arrList = arr;
    var arrLabel = aLabel;
    var group = null;
    for (i = 0; i < arrList.length; i++) {
        //Option Grouping
        if (arrGroupLabel[i] != "" && arrGroupLabel[i]) {
            //create new group (either first one or the group item name has changed)
            if (group == null || group.getAttribute("Label") != arrGroupLabel[i]) {
                var group = document.createElement("optgroup");
                group.setAttribute("Label", arrGroupLabel[i]);
                group.setAttribute("Class", arrGroupLabelClass[i]);
                rdAggrList.appendChild(group);
            }
            option = new Option(arrLabel[i], arrList[i]);
            if (option.innerHTML == "")
                option.innerHTML = arrLabel[i];
            group.appendChild(option);
        }
        //Non grouped
        else {
            option = new Option(arrLabel[i], arrList[i]);
            rdAggrList.options[rdAggrList.length] = option;
        }

        // set the selected value '21254
        if (arrLabel[i] == sSelectedValue) {
            rdAggrList.selectedIndex = i;
        }
    }
}

var rdFormulaTextSelection;
function rdGetFormulaSelection() {
    return _rdGetFormulaSelection(document.rdForm.rdAgCalcFormula);
}
var rdCustAggFormulaTextSelection;
function rdGetCustAggFormulaSelection() {
    return _rdGetFormulaSelection(document.rdForm.rdAgCustAggFormula);
}
function _rdGetFormulaSelection(eleFormula) {
    // IE < 9 Support
    if (document.selection) {
        eleFormula.focus();
        var range = document.selection.createRange();
        var rangelen = range.text.length;
        range.moveStart('character', -eleFormula.value.length);
        var start = range.text.length - rangelen;
        return { 'start': start, 'end': start + rangelen };
    }
        // IE >=9 and other browsers
    else if (eleFormula.selectionStart || eleFormula.selectionStart == '0') {
        return { 'start': eleFormula.selectionStart, 'end': eleFormula.selectionEnd };
    } else {
        return { 'start': 0, 'end': 0 };
    }
}

function rdSetFormulaSelection(start, end, eleFormula) {
    // IE >= 9 and other browsers
    if (eleFormula.setSelectionRange) {
        eleFormula.focus();
        eleFormula.setSelectionRange(start, end);
    }
        // IE < 9
    else if (eleFormula.createTextRange) {
        var range = eleFormula.createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', start);
        range.select();
    }
}
function rdInsertIntoFormula(eleInputSelect) {
    return _rdInsertIntoFormula(eleInputSelect, rdFormulaTextSelection, document.rdForm.rdAgCalcFormula);
}
function rdInsertIntoCustAggFormula(eleInputSelect) {
    return _rdInsertIntoFormula(eleInputSelect, rdCustAggFormulaTextSelection, document.rdForm.rdAgCustAggFormula);
}
function _rdInsertIntoFormula(eleInputSelect, selection, eleFormula) {
    var sSelectedText = eleInputSelect.value
    eleInputSelect.selectedIndex = 0
    var sValue = eleFormula.value
    if (selection && selection.end <= sValue.length) {
        sValue = sValue.substring(0, selection.start) + sSelectedText + sValue.substring(selection.end)
        eleFormula.value = sValue
        rdSetFormulaSelection(selection.start + sSelectedText.length, selection.start + sSelectedText.length, eleFormula)
    } else {
        eleFormula.value += sSelectedText
        rdSetFormulaSelection(eleFormula.value.length, eleFormula.value.length, eleFormula)
    }
}

/// Returns false or the id if active
function rdAgGetAggregateColumnID(sColumn, sFunction) {
    var hdnActiveAggs = document.getElementById("rdAgActiveAggregates");
    if (!hdnActiveAggs || !hdnActiveAggs.value)
        return false;

    var i = 0;
    var url = hdnActiveAggs.value;

    var aggrCol = LogiXML.getUrlParameter(url, "AggrColumn_" + i);
    while (aggrCol) {
        if (aggrCol == sColumn) {
            var aggrFunc = LogiXML.getUrlParameter(url, "AggrFunction_" + i);
            if (aggrFunc == sFunction)
                return LogiXML.getUrlParameter(url, "AggrColumnID_" + i);
        }

        i++;
        aggrCol = LogiXML.getUrlParameter(url, "AggrColumn_" + i);
    }

    return false;
}

function rdAgGetActiveAggregates() {
    var hdnActiveAggs = document.getElementById("rdAgActiveAggregates");
    if (!hdnActiveAggs || !hdnActiveAggs.value)
        return [];

    var i = 0;
    var url = hdnActiveAggs.value;
    var aggs = [];

    var aggrCol = LogiXML.getUrlParameter(url, "AggrColumn_" + i);
    while (aggrCol) {
        aggs.push({
            dataColumn: aggrCol,
            func: LogiXML.getUrlParameter(url, "AggrFunction_" + i),
            aggrID: LogiXML.getUrlParameter(url, "AggrColumnID_" + i),
            agColID: LogiXML.getUrlParameter(url, "agColID_" + i)
        });

        i++;
        aggrCol = LogiXML.getUrlParameter(url, "AggrColumn_" + i);
    }

    return aggs;
}

function rdAgIsActiveSQL() {
    var hdn = document.getElementById("rdAgActiveSQL");
    if (!hdn || !hdn.value)
        return false;

    return hdn.value == "True";
}

function rdAgCustAggClose() {
	if (!rdAgCustAggRefresh)
		return;

	var waitCfg = null;

	var hdnWaitCfg = document.getElementById("rdAgWaitPage");
	if (hdnWaitCfg && hdnWaitCfg.value) {
		waitCfg = JSON.parse(hdnWaitCfg.value);
    }

	var sPage = "rdPage.aspx?rdReport=" + encodeURIComponent(document.getElementById("rdAgReportId").value)
		+ "&rdAgCommandID=" + LogiXML.getGuid()
		+ "&rdRequestForwarding=Form"
		+ "&rdSubmitScroll";

	SubmitForm(sPage, "", false, false, false, waitCfg);
}

var rdAgCustAggRefresh = false;
var rdAgCustAggListener = null;

function rdAgCustAggHookClose(changed) {
	var closeBtn = document.getElementById('rdPopupPanelTitle_rdAgCustAggPopup').getElementsByTagName("A")[0];

	if (rdAgCustAggListener)
		LogiXML.removeListener(rdAgCustAggListener);

	rdAgCustAggListener = LogiXML.addListener(closeBtn, "click", rdAgCustAggClose);

	if (changed)
		rdAgCustAggRefresh = true;
}

function rdAgRestoreCustomAggregate(rowNumber, format) {
	// restore the name
	document.rdForm.rdAgCustAggName.value = document.getElementById('lblCustAggName_Row' + rowNumber).innerText;

	// restore the formula
	document.rdForm.rdAgCustAggFormula.value = document.getElementById('lblCustAggFormula_Row' + rowNumber).innerText;

	// restore the format
	document.rdForm.rdAgCustAggFormats.value = format;

	// restore the data types
	var cblDataTypes = document.getElementById('rdAgCustAggDataTypes').getElementsByTagName("INPUT");
	var aDataTypes = document.getElementById('lblCustAggDataTypes_Row' + rowNumber).innerText.replace(/ /g, '').split(',');

	var hasUnchecked = false;

	var cbAll = document.getElementById("rdAgCustAggDataTypes_check_all");

	for (var i = 0; i < cblDataTypes.length; i++) {
		var cb = cblDataTypes[i];

		if (cb === cbAll)
			continue;

		var sDataType = cb.value;

		cb.checked = (!!sDataType && !!(aDataTypes.indexOf(sDataType) >= 0));

		if (!hasUnchecked && !cb.checked)
			hasUnchecked = true;
	}

	cbAll.checked = !hasUnchecked;
}

function rdAgShowCustomAggregatePopup(ddl) {
    if (ddl.options[ddl.selectedIndex].value == "Custom") {
        ddl.selectedIndex = 0;
        // Custom Aggregate Popup will be displayed when this returns true
        rdAgSetCustAggColumnContext();

		rdAgCustAggHookClose();

        return true;
    }

    // Don't show the Custom Aggregate Popup - because Custom was not selected
    return false;
}

function rdAgSetCustAggColumnContext() {
    var ddlAggrCol = document.getElementById("rdAgAggrColumn");
    if (!ddlAggrCol || ddlAggrCol.selectedIndex < 0)
        return;

    var custAggPopup = document.getElementById("rdPopupPanelTitle_rdAgCustAggPopup");
    if (!custAggPopup)
        return;

    var custAggPopupCaption = custAggPopup.getElementsByClassName("rdPopupPanelTitleCaption");
    if (!custAggPopupCaption || !custAggPopupCaption.length)
        return;

    var multiColumn = (ddlAggrCol.selectedIndex == 0);
    var optSelected = ddlAggrCol.options[ddlAggrCol.selectedIndex];
    var sSelectedColumn = optSelected.innerText;
    var sColumnID = optSelected.value;
    var sGroup = optSelected.parentElement.getAttribute("label");
    var ddlSourceColumns = document.getElementById("rdAgCustAggDataColumns");

    custAggPopupCaption = custAggPopupCaption[0];

    // remove original ending and replace with column specific ending
    if (!custAggPopupCaption.multiColumnTitle)
        custAggPopupCaption.multiColumnTitle = custAggPopupCaption.innerText.trim();

    var dtCustAggs = document.getElementById("dtCustAggs");

    ShowElement(null, "divCustAggError-NoDataTypeSelected", "Hide");

    var ShowDataTypes = function (sAction) {
        var sReverseAction = sAction == "Show" ? "Hide" : "Show";

        ShowElement(null, "rdAgCustAggDataTypesFieldBox", sAction);
        ShowElement(null, "rdAgCustAggDataTypesLabel", sAction);
        ShowElement(null, "colCustAggDataTypes-TH", sAction);

        ShowElement(null, "rdAgCreateAndAdd", sReverseAction);
        ShowElement(null, "rdAgCreateAndAddLabel", sReverseAction);
        ShowElement(null, "colCustAggAdded-TH", sReverseAction);

        for (var r = 0; r < dtCustAggs.rows.length; r++) {
            var row = dtCustAggs.rows[r];
            var rowNumber = row.getAttribute("row");
            ShowElement(null, "colCustAggDataTypes_Row" + rowNumber, sAction);
            ShowElement(null, "colCustAggAdded_Row" + rowNumber, sReverseAction);
        }
    };

    var sCurrentColumnToken = LogiXML.AnalysisGrid.CURRENT_COLUMN_TOKEN;

    if (multiColumn) {
        // set multi-column title
        custAggPopupCaption.innerText = custAggPopupCaption.multiColumnTitle;

        // show data types options
        ShowDataTypes("Show");

        // add @CurrentColumn to column drop down
		if (ddlSourceColumns.options[1].value != sCurrentColumnToken) {
			sCurrentColumnToken
			var optCurrCol = new Option(document.getElementById("rdAgCurrentColumnText").innerText, sCurrentColumnToken, false);

            if (ddlSourceColumns.options.length < 2)
                ddlSourceColumns.appendChild(optCurrCol);
            else
                ddlSourceColumns.insertBefore(optCurrCol, ddlSourceColumns.options[0].nextSibling);
        }
    } else {
        // set column specific title
        custAggPopupCaption.innerText = document.getElementById("rdAgOneColCustAggTitle").innerText.replace("{0}", sSelectedColumn);

        // hide data type options
        ShowDataTypes("Hide");

        // remove @CurrentColumn from column drop down
		if (ddlSourceColumns.options[1].value == sCurrentColumnToken)
            ddlSourceColumns.remove(1);
    }

    // hide custom aggregates for other columns
    var shown = 0;
    for (var i = 1; i < dtCustAggs.rows.length; i++) {
        var row = dtCustAggs.rows[i];
        var cellid = row.cells[0].id;
        var idx = cellid.lastIndexOf("_Row");
        var hdnid = "rdAgCustAggColumnHidden" + cellid.substr(idx);

        if (document.getElementById(hdnid).value != sColumnID) {
            if (row.style.display != "none") {
                row.shownDisplay = row.style.display;
                row.style.display = "none";
            }
        } else {
            shown++;
            if (row.style.display == "none") {
                row.style.display = row.shownDisplay;
            }
        }
    }

    var tableContainer = document.getElementById("rdAgDivCustAggList");

    if (!shown) {
        if (tableContainer.style.display != "none") {
            tableContainer.shownDisplay = tableContainer.style.display;
            tableContainer.style.display = "none";
        }
    } else if (tableContainer.style.display == "none") {
        tableContainer.style.display = tableContainer.shownDisplay;
    }

    // set default formula
    var txtFormula = document.getElementById("rdAgCustAggFormula");
    if (!txtFormula)
        reutrn;

    var ddlColumns = document.getElementById("rdAgCustAggDataColumns");
    if (!ddlColumns)
        return;

    var ddlDefaultFormulas = document.getElementById("rdAgCustAggDefaults");

    if (!txtFormula.value) {
        var sFormula = null;
        var sDefaultFormula = null;

        if (multiColumn) {
            sFormula = "COUNT(" + sCurrentColumnToken + ")";
        } else {
            var i = 0;
            for (; i < ddlColumns.options.length; i++) {
                var opt = ddlColumns.options[i];
                if (opt.parentElement.getAttribute("label") == sGroup && opt.text == sSelectedColumn) {

                    if (ddlDefaultFormulas) {
                        var optDef;
                        for (var j = 0; j < ddlDefaultFormulas.options.length; j++) {
                            optDef = ddlDefaultFormulas.options[j];

                            if (optDef.value == opt.value)
                                break;

                            optDef = null;
                        }

                        if (optDef) {
                            sDefaultFormula = optDef.text;
                            break;
                        }
                    }

                    sFormula = "SUM(" + opt.value + ")";
                    break;
                }
            }
        }

        if (sDefaultFormula)
            sFormula = sDefaultFormula;
        else {
            i = 1;
            var suffix = "_Row" + i;
            var hdnCalcID = document.getElementById("rdAgCalcColumnID" + suffix);
            while (hdnCalcID) {
                if (hdnCalcID.value == sColumnID) {
                    sFormula = "SUM(" + document.getElementById("lblCalcColumnFormula" + suffix).innerText + ")";
                    break;
                }
                i++;
                suffix = "_Row" + i;
                hdnCalcID = document.getElementById("rdAgCalcColumnID" + suffix);
            }
        }

        txtFormula.value = sFormula;
    }
}

function rdAgGetCustomAggregates(sColumnID, sDataType) {
    var dt = document.getElementById("dtCustAggs");
    var custAggs = [];
    var sCurrentColumnToken = LogiXML.AnalysisGrid.CURRENT_COLUMN_TOKEN;

    for (var i = 1; i < dt.rows.length; i++) {
        var cellid = dt.rows[i].cells[0].id;
        var idx = cellid.lastIndexOf("_Row");
        var suffix = cellid.substr(idx);
        var hdnid = "rdAgCustAggColumnHidden" + suffix;
        var sCustCol = document.getElementById(hdnid).value;

        if (sCustCol != sColumnID) {
            // not specifically for this column, but might match on data type.
            if (sCustCol != sCurrentColumnToken)
                continue;

            if (!sDataType)
                continue;

            var lblid = "lblCustAggDataTypes" + suffix;
            var lbl = document.getElementById(lblid);
            if (!lbl)
                continue;

            if (lbl.innerText.replace(/ /g, '').split(',').indexOf(sDataType) < 0)
                continue;

            // data type match
        }

		hdnid = "rdAgCustAggIdHidden" + suffix;
		custAggs.push({
			id: document.getElementById(hdnid).value,
			name: document.getElementById("lblCustAggName" + suffix).innerText
		});
	}

    return custAggs;
}

function rdAgCustAggCustomHeaderClick(dcIdx) {
    var ddlDataColumn = document.getElementById('rdAgAggrColumn');
    ddlDataColumn.selectedIndex = dcIdx;
    LogiXML.AnalysisGrid.rdChangeAggregateOptions();

    var ddlAggregate = document.getElementById('rdAgAggrFunction');
    ddlAggregate.selectedIndex = ddlAggregate.options.length - 1;

    if (rdAgShowCustomAggregatePopup(ddlAggregate))
        ShowElement(null, 'rdAgCustAggPopup', 'Show');
}

function rdAgAddCustomAggregatesToHeaders() {
    if (!rdAgIsActiveSQL())
        return;

    var dt = document.getElementById("dtAnalysisGrid");
    if (!dt)
        return;

    var headers = dt.getElementsByTagName("TH");
    if (!headers || !headers.length)
        return;

    var btn = document.getElementById("rdAgBtnCustAggHidden");
    if (!btn || !btn.parentElement || !btn.parentElement.nextSibling)
        return;

    var newOpts = btn.parentElement.nextSibling.getElementsByTagName("LI");
    if (!newOpts || newOpts.length != 2)
        return;

    var aggs = rdAgGetActiveAggregates();
    var suffix = "_Row1";

    for (var i = 0; i < headers.length; i++) {
        var header = headers[i];

        var hdn = document.getElementById(header.id.substr(0, header.id.length - 3) + "_DataColumn" + suffix);
        if (!hdn || !hdn.value)
            continue;

        var popups = header.getElementsByClassName("rdPopupMenu");
        var aggPopup = null;
        for (var j = 0; j < popups.length; j++) {
            if (popups[j].id.indexOf("Aggregate") < 0)
                continue;

            aggPopup = popups[j];
            break;
        }

        if (!aggPopup)
            continue;

        var targetUL = aggPopup.getElementsByClassName("rdThemePopupMenu");
        if (!targetUL || !targetUL.length)
            continue;

        targetUL = targetUL[0];

        var newOpt, newLink;

        var sColumnID = hdn.value;
        var sDataType = LogiXML.AnalysisGrid.rdAgGetColumnDataType(sColumnID);
        var custAggs = rdAgGetCustomAggregates(sColumnID, sDataType);
        if (custAggs) {
            for (var j = 0; j < custAggs.length; j++) {
                var custAgg = custAggs[j];

                var hdnidspan = document.createElement("SPAN");
                var agg = null;

                for (var k = 0; k < aggs.length; k++) {
                    agg = aggs[k];

                    if (agg.func == custAgg.id && agg.dataColumn == sColumnID)
                        break;

                    agg = null;
                }

                if (!agg) {
                    // Not aggregated currently, show the option to add it
                    newOpt = newOpts[0].cloneNode(true);
                    newLink = newOpt.childNodes[0];

                    newLink.setAttribute("onclick", newLink.getAttribute("onclick")
                        .replace("rdAgAggrFunction=ReplaceThis", "rdAgAggrFunction=" + encodeURIComponent(custAgg.id))
                        .replace("rdAgAggrColumn=ReplaceThis", "rdAgAggrColumn=" + encodeURIComponent(sColumnID)));

                    newLink.id = "ppo_Add" + custAgg.id + "_rdPopupOptionItem" + suffix;
                    hdnidspan.id = "rdAgHdnAggrAdd_" + sColumnID + "_" + custAgg.id + suffix;

                    newLink.childNodes[0].innerText = custAgg.name;
                } else {
                    // already aggregated, show the option to remove it
                    newOpt = newOpts[1].cloneNode(true);
                    newLink = newOpt.childNodes[0];

                    newLink.setAttribute("onclick", newLink.getAttribute("onclick")
                        .replace("rdAgAggrRemoveColumn=ReplaceThis", "rdAgAggrRemoveColumn=" + encodeURIComponent(agg.aggrID)));

                    newLink.id = "ppo_Remove" + custAgg.id + "_rdPopupOptionItem" + suffix;
                    hdnidspan.id = "rdAgHdnAggrRemove_" + sColumnID + "_" + custAgg.id + suffix;

                    newLink.childNodes[0].innerText = "Remove " + custAgg.name;
                }

                newLink.appendChild(hdnidspan);
                targetUL.appendChild(newOpt);
            }
        }

        // REPDEV-24887 Add "(Custom)" option
        var ddlDataColumn = document.getElementById("rdAgAggrColumn");

        if (ddlDataColumn) {
            var dcIdx = -1;
            for (var j = 0; j < ddlDataColumn.options.length; j++) {
                if (ddlDataColumn.options[j].value == sColumnID) {
                    dcIdx = j;
                    break;
                }
            }

            if (dcIdx >= 0) {
                newOpt = newOpts[0].cloneNode(true);
                newLink = newOpt.childNodes[0];

                newLink.id = LogiXML.getGuid();

                newLink.setAttribute("onclick", "rdAgCustAggCustomHeaderClick(" + dcIdx + ");");

                newLink.childNodes[0].innerText = rdAgCustAggShowPopupCaption();
                targetUL.appendChild(newOpt);
            }
        }
    }
}

function rdAgCustAggShowPopupCaption() {
    return document.getElementById("rdAgCustAggShowPopupCaption").innerText;
}

function rdAgCustAggPreAdd(popup) {
	var a = popup;
	while (popup && popup.getAttribute("rdPopupPanel") != "True") {
		popup = popup.parentNode;
	}

	if (!popup)
		return false;

	var dataTypesContainer = document.getElementById("rdAgCustAggDataTypesFieldBox");
	if (dataTypesContainer && dataTypesContainer.style.display != "none") {
		var hasOneChecked = false;

		var cbs = dataTypesContainer.getElementsByTagName("input");
		for (var i = 0; i < cbs.length; i++) {
			var cb = cbs[i];
			if (cb.type.toLowerCase() == "checkbox" && cb.checked) {
				hasOneChecked = true;
				break;
			}
		}

		if (!hasOneChecked) {
			ShowElement(null, "divCustAggError-NoDataTypeSelected", "Show");
			a.blur();
			return false;
		}
	}

	var obj = {
		id: popup.id,
		left: popup.style.left,
		top: popup.style.top
	};

	var callback = function () {
		var popup = document.getElementById(this.id);
		if (!popup)
			return;

		popup.style.left = this.left;
		popup.style.top = this.top;

		ShowElement(null, this.id, 'Show');

		popup.style.left = this.left;
		popup.style.top = this.top;

		LogiXML.Ajax.AjaxTarget().detach('refreshed_' + this.id, arguments.callee);
	}.bind(obj);

	LogiXML.Ajax.AjaxTarget().on('refreshed_' + obj.id, callback);

	return true;
}

function rdAgCustAggPopup_AfterRefresh() {
	rdAgSetCustAggColumnContext();
	ShowElement(null, "rdAgCustAggPopup", "Show");
	rdAgCustAggHookClose(true);
}

var rdAgFormats = null;
function rdAgGetFormats() {
    if (rdAgFormats == null) {
        rdAgFormats = [];
        var rdAgCalcFormats = document.getElementById("rdAgCalcFormats");
        if (rdAgCalcFormats) {
            for (var i = 0; i < rdAgCalcFormats.options.length; i++) {
                var opt = rdAgCalcFormats.options[i];
                rdAgFormats.push({
                    value: opt.value,
                    html: opt.outerHTML
                });
            }
        }
    }

    return rdAgFormats;
}

function rdAgFilterDataTypeChanged(rdAgCalcDataTypes) {
    if (!rdAgCalcDataTypes) {
        rdAgCalcDataTypes = document.getElementById("rdAgCalcDataTypes");
        if (!rdAgCalcDataTypes)
            return;
    }

    var rdAgCalcFormats = document.getElementById("rdAgCalcFormats");
    if (!rdAgCalcFormats)
        return;

    var formats = rdAgGetFormats();

    if (!formats || !formats.length)
        return;

    var newFormats = "";
    var curOptVal = rdAgCalcFormats.value;
    var selectedIndex = -1;
    var newCnt = 0;

    switch (rdAgCalcDataTypes.value) {
        case "Number":
            for (var i = 0; i < formats.length; i++) {
                var fmt = formats[i];
                if (!fmt.value || fmt.value.indexOf("/") < 0) {
                    newFormats += fmt.html;
                    if (fmt.value == curOptVal)
                        selectedIndex = newCnt;
                    newCnt++;
                }
            }
            break;
        case "Text":
            for (var i = 0; i < formats.length; i++) {
                var fmt = formats[i];
                if (!fmt.value) {
                    newFormats += fmt.html;
                    if (fmt.value == curOptVal)
                        selectedIndex = newCnt;
                    newCnt++;
                }
            }
            break;
        case "Date":
            for (var i = 0; i < formats.length; i++) {
                var fmt = formats[i];
                if (!fmt.value || (fmt.value.indexOf("MM/") >= 0 && fmt.value.indexOf(":") < 0)) {
                    newFormats += fmt.html;
                    if (fmt.value == curOptVal)
                        selectedIndex = newCnt;
                    newCnt++;
                }
            }
            break;
        case "DateTime":
            for (var i = 0; i < formats.length; i++) {
                var fmt = formats[i];
                if (!fmt.value || fmt.value.indexOf("MM/") >= 0) {
                    newFormats += fmt.html;
                    if (fmt.value == curOptVal)
                        selectedIndex = newCnt;
                    newCnt++;
                }
            }
            break;
        case "Boolean":
            for (var i = 0; i < formats.length; i++) {
                var fmt = formats[i];
                if (!fmt.value || fmt.value.indexOf("True") >= 0) {
                    newFormats += fmt.html;
                    if (fmt.value == curOptVal)
                        selectedIndex = newCnt;
                    newCnt++;
                }
            }
            break;
    }

    rdAgCalcFormats.innerHTML = newFormats;
    rdAgCalcFormats.selectedIndex = selectedIndex;
}

document.addEventListener("DOMContentLoaded", function () {
    var imgCustAgg = document.getElementById("rdAgImgCustAgg");
    if (!imgCustAgg || !imgCustAgg.value)
        return;

    var custAggPopup = document.getElementById("rdPopupPanelTitle_rdAgCustAggPopup");
    if (!custAggPopup)
        return;

    var custAggPopupCaption = custAggPopup.getElementsByClassName("rdPopupPanelTitleCaption");
    if (!custAggPopupCaption || !custAggPopupCaption.length)
        return;

    custAggPopupCaption[0].style.backgroundImage = "url('" + imgCustAgg.value + "')";

    rdAgFilterDataTypeChanged();
});
