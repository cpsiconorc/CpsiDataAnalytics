function DoPrintablePageBreaks(sTableID, nPageHeight, bShowPrintDialog) {

	if (nPageHeight.length == 0) {
		nPageHeight = 9.5
		// The width is set by the engine, for PDF only.
	}
	nPageHeight = nPageHeight * 87   //Inches to IE 

	//Get the table.
	var eleTable = document.getElementById(sTableID)
	if (eleTable==null) {
		return;  //There's no table to paginate.
	}
	if (eleTable.rows[0].cells.length==-0) {
		return;  //There's no table to paginate.
	}
	
	// Verify that the current table is not a part of the report page footer or header.
    var eleTableParent;
    var eleTableVerify = eleTable;
    for (;;) {
        eleTableParent = eleTableVerify.parentNode;
        if (!eleTableParent) {
            return;
        }
        if (eleTableParent.id == "rdPageHeader" || eleTableParent.id == "rdPageFooter") {
            return; //This table is in the Printable Paging element. Do not create paging from this table.
        }
        if (eleTableParent.tagName == "BODY" ) {
            break; //Verified - this is under the report level. Continue creating pages.
        }
        eleTableVerify = eleTableParent;
     }

	window.status = "Formatting pages..."

	//Get the table header height
	var eleTableHeader = eleTable.rows[0]
	var nTableHeaderHeight = 0
	if (eleTable.rows[0].cells[0].tagName == "TH") {
		nTableHeaderHeight = eleTableHeader.offsetHeight
	}

	//Get the page header.
	var eleHeader = document.getElementById("rdPageHeader");
	//Get the page footer.
	var eleFooter = document.getElementById("rdPageFooter");

	//Get the column count.
	var nColumnCnt = eleTable.rows[0].cells.length
	
	//Move the Page Header at the top to inside of the table as the first row.
	var rowHdr
	var colHdr
	var sHeader = ""
	var nReportHeaderHeight = 0
	var nPageHeaderHeight = 0
	if (eleHeader) {
		rowHdr = eleTable.insertRow(0)
		colHdr = rowHdr.insertCell(-1)
		colHdr.colSpan = nColumnCnt
		sHeader = eleHeader.innerHTML 
		//colHdr.innerHTML = sHeader.replace(/rdPrintablePageNrHeader/g, 1)
		colHdr.innerHTML = sHeader.replace(/rdPrintablePageNr/g, 1)
		
		//Get the header size.
		nReportHeaderHeight = nGetAbsoluteTop(eleHeader) + eleHeader.offsetHeight
		nPageHeaderHeight = rowHdr.offsetHeight

		//Remove the original header.
		eleHeader.parentNode.removeChild(eleHeader)
	}
	
	//Temporarily create a page footer inside the table to see how tall it will be.
	var rowFtr
	var colFtr
	var sFooter = ""
	var nPageFooterHeight = 0
	if (eleFooter) {
		rowFtr = eleTable.insertRow(0)
		colFtr = rowFtr.insertCell(-1)
		colFtr.colSpan = nColumnCnt
		sFooter = eleFooter.innerHTML
		colFtr.innerHTML = sFooter.replace(/rdPrintablePageNr/g, 1)
		nPageFooterHeight = rowFtr.offsetHeight 
		rowFtr.parentNode.removeChild(rowFtr) 
	}
	
	var nCurrPageOffset = 0
	var aPageBreakRowIndex = new Array(0)
	var nPageBreakCount = 0
	
	//Figure out the absolute position of the table element.  That's the height of the report header.
	var nTableOffset = 0
	nTableOffset = nGetAbsoluteTop(eleTable)
	
	var nBodyHeight = nPageHeight - nTableOffset - nPageFooterHeight  //Set the body height for page 1.  (Different that other pages.)

	//Figure out where the page breaks go.
	var bForceBreak = false
	var bSkippedHeaderBreak = false
	var bLastBreakForced = false
	for (var i = 0; i < eleTable.rows.length; i++) {
		var eleRowLastElement = eleTable.rows[i]
		//Some rows (More Information Rows) may be hidden.  Try to find one that's not.
		if (eleRowLastElement.offsetHeight == 0) {eleRowLastElement = eleRowLastElement.previousSibling }

		if (eleRowLastElement.getAttribute("rdPageBreak") == "Before") {
			if (bSkippedHeaderBreak) {
				bForceBreak = true
			} else {
				bSkippedHeaderBreak = true 
			}
		}

		//Check the position of this row for a possible page break.
		var posTop = nGetAbsoluteTop(eleRowLastElement)
		if (bForceBreak || posTop + eleRowLastElement.offsetHeight - nTableOffset > nCurrPageOffset + nBodyHeight) {
			// Need to insert a page break after the previous row-break.  Save the row index.
			if (i > 0) {   //Don't break on the first row.
				bForceBreak = false
				nCurrPageOffset = eleRowLastElement.offsetTop // + eleTR.offsetHeight
				aPageBreakRowIndex.push(i - 1)	
				nBodyHeight = nPageHeight - nPageHeaderHeight - nPageFooterHeight - nTableHeaderHeight  //Set body height for pages 2 on down.
			}
		}
		else {
			if (eleRowLastElement.getAttribute("rdPageBreak") == "After") {
				bForceBreak = true
				bLastBreakForced = true 
			}
		}
	}
		
	var rowNew
	var colNew
	var nBreakCnt = aPageBreakRowIndex.length
	if (bLastBreakForced) {nBreakCnt -= 1}  //Don't break after the last summary row.
	for (var i=0; i < nBreakCnt; i++) {
		window.status = "Formatting page " + (i + 1) + " of " + (aPageBreakRowIndex.length + 1) + "..."

		var nInsertRowCnt = 4
		if (nTableHeaderHeight == 0) {
			nInsertRowCnt = nInsertRowCnt - 1  //No table header rows will be inserted.
		}
		var nRowIndexOffset = nInsertRowCnt * i + 1 
		
		//Page Header row
		rowNew = eleTable.insertRow(aPageBreakRowIndex[i] + nRowIndexOffset )
		rowNew.style.pageBreakBefore = "always"
		colNew = rowNew.insertCell(-1)
		colNew.colSpan = nColumnCnt
		colNew.innerHTML = sHeader.replace(/rdPrintablePageNr/g, i + 2)
		//Table Header row
		if (nTableHeaderHeight != 0) { 
			rowNew = eleTableHeader.cloneNode(true)
			if (eleTable.rows[aPageBreakRowIndex[i] + nRowIndexOffset]) {
				//eleTable.rows[0].parentNode.insertBefore(rowNew,eleTable.rows[nRowIndexOffset + nIeRowAdjust])
				var rowReference = eleTable.rows[aPageBreakRowIndex[i] + nRowIndexOffset + 1]
				rowReference.parentNode.insertBefore(rowNew,rowReference)   //#12981.
			}
		}
		//Seperator line row
		rowNew = eleTable.insertRow(aPageBreakRowIndex[i] + nRowIndexOffset)
		colNew = rowNew.insertCell(-1)
		colNew.colSpan = nColumnCnt
		colNew.innerHTML = "<HR ID='rdPageSeperator'></HR>"
		//Page Footer row
		rowNew = eleTable.insertRow(aPageBreakRowIndex[i] + nRowIndexOffset)
		colNew = rowNew.insertCell(-1)
		colNew.colSpan = nColumnCnt
		colNew.innerHTML = sFooter.replace(/rdPrintablePageNr/g, i + 1)
	}

	window.status = "Finishing..."
		
	//Move the page footer into a final table row.
	if (eleFooter) {
		rowNew = eleTable.insertRow(-1)
		colNew = rowNew.insertCell(-1)
		colNew.colSpan =nColumnCnt
		colNew.innerHTML = sFooter.replace(/rdPrintablePageNr/g, i + 1)
		eleFooter.parentNode.removeChild(eleFooter)
	}

	
	//Set the total page count.
	document.body.innerHTML = document.body.innerHTML.replace(/rdPrintablePageCount/g, i + 1)
	
	window.status = "Done"
	
	if (bShowPrintDialog == "True") {
		window.print()
	}
}

function nGetAbsoluteTop(ele) {
	var nOffset = ele.offsetTop
	var eleOffsetParent = ele.offsetParent
	while (eleOffsetParent) {
		nOffset += eleOffsetParent.offsetTop
		eleOffsetParent = eleOffsetParent.offsetParent
	}
	return nOffset
}

