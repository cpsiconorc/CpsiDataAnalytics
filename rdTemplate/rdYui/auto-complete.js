YUI.add('rdAutoComplete', function (Y) {
    //"use strict";

    var Lang = Y.Lang,
        TRIGGER = 'rdAutoCompleteElement';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.rdAutoComplete.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').rdAutoComplete = Y.Base.create('rdAutoComplete', Y.Base, [], {
        _handlers: {},

        configNode: null,
        id: null,
		values: [],
		multiSelect: false,
		delimiter: null,
		rdEventOnAutoComplete: "",
		
        initializer: function (config) {
            var self = this;

            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);
            var btnComboDropdown = Y.one("#" + this.configNode.getAttribute('id') + "_rdDropdown");

            var inputNode = this.configNode

            var parent = inputNode.get('parentNode');
            if (parent)
                parent.addClass('yui3-skin-sam');
				
            var EventOnAutoComplete = this.rdEventOnAutoComplete;
            var multiSelect = this.multiSelect;

            var sOnChange = this.configNode.getAttribute('data-event-onchange');
            var sOnBlur = this.configNode.getAttribute('data-event-onblur');
            var sOnFocus = this.configNode.getAttribute('data-event-onfocus');

			this._handlers.AutCompletePlugin = this.configNode.plug(Y.Plugin.AutoComplete, {
				allowTrailingDelimiter: true,
				minQueryLength: 0,
				queryDelay: 0,
				// queryDelimiter: ',',
				queryDelimiter: this.delimiter,
				scrollIntoView: false,
				resultHighlighter: 'startsWith',
				source: this.values,
				render: (btnComboDropdown) ? false:true,

				//24592
				after : {
				    select: function () {

				        if (sOnChange != "") {
				            eval(sOnChange);
				        }
				        
                        //25730
					    if (multiSelect && this._inputNode) {
					        this._inputNode.ac.sendRequest(''); 
					    }
				    }
				},
                
				resultFormatter: function (query, results) {
				    return Y.Array.map(results, function (result) {
				        var sText = result.raw
                        var sTitle = ""
				        var nSplitLocation = result.text.indexOf('_rdTooltip_')
				        if (nSplitLocation != -1) {
				             sTitle = 'title="' + sText.substr(nSplitLocation + 11).replace("'","\'") + '" '
				            sText = sText.substr(0, nSplitLocation)
				            result.text = result.text.substr(0, nSplitLocation)
                        }
				        return '<span ' + sTitle + '">' + sText + '</span>';
				    });
                },
                //23727 (xNumber)
                resultListLocator: function (response) {
                    if (LogiXML && LogiXML.rdInputTextDelimiter) {
                        var nFetchMin = inputNode._node.getAttribute("data-fetch-minLength");
                        if ((!nFetchMin) || nFetchMin <= 0) {
                            return response;
                        }

                        var input = inputNode._node;
                        var containerID = input.getAttribute("data-delimiter-container-id");
                        if (containerID) {
                            var container = document.getElementById(containerID);
                            if (container) {
                                var editor = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
                                LogiXML.rdInputTextDelimiter.sync(editor, true);
                            }
                        }
                        var text = inputNode.get("value");
                        var delimiter = inputNode._node.getAttribute("data-delimiter");
                        var qualifier = inputNode._node.getAttribute("data-qualifier");
                        var escape = inputNode._node.getAttribute("data-escape");

                        if (!delimiter)
                            delimiter = ",";

                        var entry;
                        if (!qualifier) {
                            var  selected = LogiXML.rdInputTextDelimiter.getEntries(text, delimiter, qualifier, escape, true);
                            entry = selected.entry;
                        } else {
                            var selected = text.split(/\s*,\s*/);
                            entry = selected[selected.length - 1];
                        }
                        return entry.length >= nFetchMin ? response : [];
                    } else {
                        return response;
                    }
                },
                resultFilters: ['startsWith', function (query, results) {
                    var selected;

                    if (LogiXML && LogiXML.rdInputTextDelimiter) {
                        var input = inputNode._node;
                        var containerID = input.getAttribute("data-delimiter-container-id");
                        if (containerID) {
                            var container = document.getElementById(containerID);
                            if (container) {
                                var editor = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
                                LogiXML.rdInputTextDelimiter.sync(editor, true);
                            }
                        }
                        var text = inputNode.get("value");
                        var delimiter = inputNode._node.getAttribute("data-delimiter");
                        var qualifier = inputNode._node.getAttribute("data-qualifier");
                        var escape = inputNode._node.getAttribute("data-escape");

                        if (!delimiter)
                            delimiter = ",";

                        selected = LogiXML.rdInputTextDelimiter.getEntries(text, delimiter, qualifier, escape, false);

                        if (!qualifier) {
                            // if there is no qualifier, but a list item contains the delimiter, mark it as selected if each portion of this result is selected
                            // "one,two" as one entry will be flagged as selected if "one" and "two" are selected.
                            for (var i = 0; i < results.length; i++) {
                                var res = results[i].text;
                                var splt = res.split(delimiter);
                                if (splt.length > 1) {
                                    var missingOne = false;
                                    for (var j = 0; j < splt.length; j++) {
                                        var s = splt[j];
                                        if (selected.indexOf(s) < 0) {
                                            missingOne = true;
                                            break;
                                        }
                                    }
                                    if (!missingOne)
                                        selected.push(res);
                                }
                            }
                        }
                    } else {
					    selected = inputNode.get('value').split(/\s*,\s*/);
                    }

					selected = Y.Array.hash(selected);
					return Y.Array.filter(results, function (result) {
						return !selected.hasOwnProperty(result.text);
					  });
					}]	
            });

			
			if (sOnChange != "") {
			    inputNode.on('change', function () { eval(sOnChange); });
			}

			if (sOnBlur != "") {
			    inputNode.on('blur', function () { eval(sOnBlur); });
			}

			if (sOnFocus) {  
			    inputNode.on('focus', function () { eval(sOnFocus); });
			}

			if (btnComboDropdown) {
			    //This is an InputComboList element. 
			    //Put the arrow inside the control.
			    var eleButton = btnComboDropdown.getDOMNode()
			    eleButton.style.display = '';
			    eleButton.style.cursor = 'default';
			    //Setup rendering.
			    inputNode.ac.sendRequest('');
			    inputNode.ac.render();
			    btnComboDropdown.on('click', function (e) {
                    // might not be initialized, page refreshed other parts of the report.RD21281
			        try {
			            inputNode.ac.sendRequest('');
			            inputNode.getDOMNode().focus();
			        }  catch (e) {
			        
			        }			        
			    });
			} else {
                //InputText with AutoComplete.
			    inputNode.ac.render = true;
			}

            if (this.delimiter) {
                //23862 23865
                if (inputNode.getDOMNode().value && inputNode.getDOMNode().value.length > 0) {
                    var inputVal = inputNode.getDOMNode().value;
                    var inputArray = inputVal.trim().split(this.delimiter);
                    for (var i = 0; i < inputArray.length; i++) {
                        inputArray[i] = inputArray[i].trim();
                    }
                    inputNode.set('value', inputArray.join(this.delimiter + ' '));
                    inputNode.ac.set('value', inputNode.get('value'));
                }

                if (inputNode.getDOMNode().value && inputNode.getDOMNode().value.length > 0 && inputNode.getDOMNode().value.trim().lastIndexOf(this.delimiter) != inputNode.getDOMNode().value.trim().length - this.delimiter.length) {
                    inputNode.set('value', inputNode.getDOMNode().value + this.delimiter + ' ');
                    inputNode.ac.set('value', inputNode.get('value'));
                }
            }            
        },
				
        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            // this.values = this.configNode.getAttribute('data-values').split(',');
			this.values = this.configNode.getAttribute('data-values').split('||');
			this.multiSelect = this.configNode.getAttribute('data-multiSelect') == "True" ? true : false;
			if (this.multiSelect) {
					this.delimiter = this.configNode.getAttribute('data-delimiter');		
				} else {
					this.delimiter = "";
				}	

			this.rdEventOnAutoComplete = this.configNode.getAttribute('data-event');			
        },

        
        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
            configNode.setData(TRIGGER, null);
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
        },
    }, {
        // Static Methods and properties
        NAME: 'rdAutoComplete',
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
                    element = new Y.LogiXML.rdAutoComplete({
                        configNode: node
                    });
                }
            });
        }


    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'autocomplete', 'autocomplete-highlighters', 'autocomplete-filters'] });
