var lastAddedVizGuid = "";

thinkspaceConfig.controls.gallery.eventHandlers.click = function () {

    OnClickAddToGallery();
};

thinkspaceConfig.controls.save.eventHandlers.click = function () {

    OnClickSave();
};

if (window.location.href.toLowerCase().indexOf("rdeditthinkspace=true") > 0 || (Y.one('#rdEditThinkspace') && Y.one('#rdEditThinkspace').get('value').toString().toLowerCase() == 'true')) {
    thinkspaceConfig.controls.update.enable = true;
    thinkspaceConfig.controls.update.eventHandlers.click = function () {
        OnClickEditThinkspace();
    };
}
else {    
        thinkspaceConfig.controls.update.enable = false;
    };

function OnClickSave() {
	rdOverrideKeyDownForBookmarkPopup();
    var ngpPlatform = window.Logi;
    var thinkspaceTagId = Y.one('logi-thinkspace').get("id");
    var thinkspaceWidget = ngpPlatform.Platform.select("#" + thinkspaceTagId);

    var tsConfigHiddenInput = Y.one('#rdThinkspaceConfig');
    var rdDvdNameHiddenInput = Y.one('#rdDvdName');


    var tsConfig = thinkspaceWidget.config();
    tsConfigHiddenInput.set('value', JSON.stringify(tsConfig));
    rdDvdNameHiddenInput.set('value', tsConfig.dataview);

    var saveButtonWrapperDiv = Y.one('#rdClassicSaveStateButton');

    if (saveButtonWrapperDiv) {
        var link = saveButtonWrapperDiv.one('#rdTsActionBookmark');
        var fnSaveText = link.getAttribute('onclick');
        eval(fnSaveText);
    }
}

function OnClickAddToGallery() {
    rdOverrideKeyDownForBookmarkPopup();
    CaptureVizConfigDataview(true);

    var buttonWrapper = Y.one('#rdClassicAddToDashboardButton');
    if (buttonWrapper) {
        var link = buttonWrapper.one('a');
        var fnText = link.getAttribute('onclick');
        eval(fnText);
    }
}

function OnClickEditThinkspace() {
    CaptureVizConfigDataview();
    var buttonWrapper = Y.one('#rdHiddenUpdateButton');
    if (buttonWrapper) {
        var link = buttonWrapper.one('a');
        var fnText = link.getAttribute('onclick');
        eval(fnText);
    }
}

function CaptureVizConfigDataview(generateNewId) {
    var ngpPlatform = window.Logi;

    var thinkspaceTagId = Y.one('logi-thinkspace').get("id");
    var vizConfigHiddenInput = Y.one('#rdNgpDataVizConfig');
    var vizDataviewHiddenInput = Y.one('#rdNgpDataViewName');
    var vizDataViewIdHiddenInput = Y.one('#rdDataViewId');

    var thinkspaceWidget = ngpPlatform.Platform.select("#" + thinkspaceTagId);

    var tsConfigHiddenInput = Y.one('#rdThinkspaceConfig');
    var tsConfig = thinkspaceWidget.config();
    tsConfigHiddenInput.set('value', JSON.stringify(tsConfig));

    var vizBuilder = thinkspaceWidget.getVizBuilder();
    var vizConfig = vizBuilder.getCurrentVisualizationConfig();
    if (vizConfig.id == lastAddedVizGuid || generateNewId) {
        vizConfig.id = "id-" + NewGuid();
    }

    lastAddedVizGuid = vizConfig.id;

    var vizConfigClone = jQuery.extend(true, {}, vizConfig);

    vizConfigClone.style = { width: "100%", height: "400px" };
    //this can be removed after AS does clean up  NGP-2842
    delete vizConfigClone.parentContainer;

    if (vizConfig.type = "crosstabTable") {
        delete vizConfigClone.channel;
    }

    //Visualization title
    var inpTitle = Y.one('#rdPanelTitle_addDashboardPanelActionID');
    if (vizConfigClone && vizConfigClone.headerConfig) {
        if (vizConfigClone.headerConfig.userSetTitle && vizConfigClone.headerConfig.userSetTitle.length > 0) {
            inpTitle.set('value', vizConfigClone.headerConfig.userSetTitle);
        } else if (vizConfigClone.headerConfig.title) {
            inpTitle.set('value', vizConfigClone.headerConfig.title);
        }
        vizConfigClone.headerConfig.visible = false;
    }

    vizConfigHiddenInput.set('value', JSON.stringify(vizConfigClone));

    var ads = ngpPlatform.Platform.appDataProvider();
    var vizDataview = ads.resolveDataView(vizConfigClone.dataview).model.plain();
    var vizDataviewClone = jQuery.extend(true, {}, vizDataview);


    if (vizConfig.type = "crosstabTable") {
        vizDataviewClone.name = NewGuid();
    }

    vizDataviewHiddenInput.set('value', JSON.stringify(vizDataviewClone));
    //vizDataviewClone.starts[0].dataview
    vizDataViewIdHiddenInput.set('value', vizDataviewClone.starts[0].dataview);
}

function onLogiReady() {
    Y.one('#thinkspacewait').hide();
}

function rdOverrideKeyDownForBookmarkPopup() {
	//NGP-5412
	var inpPanelName = $("#rdPanelTitle_addDashboardPanelActionID");
	if (inpPanelName.attr('data-override-submit') != 'true') {
		inpPanelName.keydown(function(e){
			if (e.keyCode == 13){
				/*var submitElement = document.getElementById('actAddToDashboard_addDashboardPanelActionID');
				if (submitElement) {
					submitElement.click();
				}*/
				return false;
			}
		});
		inpPanelName.attr('data-override-submit', 'true');
	}
	
	var inpBookmarkName = $("#txtBookmarkDescription");
	if (inpBookmarkName.attr('data-override-submit') != 'true') {
		inpBookmarkName.keydown(function(e){
			if (e.keyCode == 13){
				return false;
			}
		});
		inpBookmarkName.attr('data-override-submit', 'true');
	}

}

function NewGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}