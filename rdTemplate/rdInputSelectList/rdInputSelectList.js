YUI.add("rd-inputSelectList-plugin", function (Y) {

    //create namespaced plugin class
    Y.namespace("LogiXML").rdInputSelectList = Y.Base.create("rdInputSelectList", Y.Plugin.Base, [], {
        _listCaptionsElementId: "",
        _onchangeHandlers: [],
        initializer: function () {
            this._container = this.get("host");
            this._id = this._container.getAttribute("id");
            if (!Y.Lang.isValue(this._container) || !Y.Lang.isValue(this._id)) {
                return;
            }

            //ListCaptionsElementId
            var listCaptionsElementId = this._container.getAttribute("data-list-captions-element-id");

            if (listCaptionsElementId && listCaptionsElementId.value !== "") {
                this._listCaptionsElementId = listCaptionsElementId;
                var inputListElement = Y.one("#" + this._id);
                var hiddenCaptionField = Y.one("#" + listCaptionsElementId);
                if (hiddenCaptionField && inputListElement) {
                    this.populateHiddenCaption(hiddenCaptionField, inputListElement._node);
                    var handler = this.populateHiddenCaption;
                    this._onchangeHandlers.push(inputListElement.on("change", function(selectList) {
                        handler(Y.one("#" + listCaptionsElementId), selectList._currentTarget);
                    }));
                }
            }
        },
        destructor: function() {
            if (this._onchangeHandlers) {
                // RD20538
                for (var i = this._onchangeHandlers.length - 1; i >= 0; i--) {
                    if (this._onchangeHandlers[i].evt.el) {
                        if (this._onchangeHandlers[i].evt.el.id == this._id) {
                            this._onchangeHandlers[i].detach();
                            this._onchangeHandlers.splice(i, 1);
                        }
                    } else {
                        this._onchangeHandlers[i].detach();
                        this._onchangeHandlers.splice(i, 1);
                    }                    
                }
                this._onchangeHandlers = null;
            }
        },
        populateHiddenCaption: function (hiddenCaptionField, selectList) {
            hiddenCaptionField.set("value", "");
            if (selectList && selectList.length > 0) {
                var tempSelectedValues = "";
                for (var i = 0; i < selectList.length; i++) {
                    if (selectList[i].selected) {
                        tempSelectedValues += LogiXML.decodeHtml(selectList[i].innerHTML.concat(", "),true);
                    }
                }
                tempSelectedValues = tempSelectedValues.substring(0, tempSelectedValues.length - 2);
                hiddenCaptionField.set("value", tempSelectedValues);
            }
        }
    }, {
        NAME: "rdInputSelectList",
        NS: "rdInputSelectList",
        ATTRS: {}
    });

}, "1.0.0", { requires: ["base", "plugin", "json"] });

