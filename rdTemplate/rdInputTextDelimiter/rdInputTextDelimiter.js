var LogiXML = LogiXML || {};
LogiXML.rdInputTextDelimiter = LogiXML.rdInputTextDelimiter || {
    MIN_TYPING_WIDTH: 20,
    INPUT_CLASS_NAME: "rdInputTextDelimited",
    SELECTED_CLASS_NAME: "rdInputTextPillSelected",
    FULL_SELECTED_CLASS_NAME: "rdInputTextPillSelectedFull",
    CONTAINER_CLASS_NAME: "rdInputTextDelimiterContainer",
    PILL_CLASS_NAME: "rdInputTextPill",
    PLACEHOLDER_CLASS_NAME: "rdInputTextPlaceholder",
    EDITOR_CLASS_NAME: "rdInputTextPillEditor",
    AUTO_COMPLETE_CLASS_NAME: "rdAutoCompleteElement",
    _all: [],
    initOne: function (entries, io) {
        var inp = this;
        var sContainerID = inp.getAttribute("data-delimiter-container-id");

        if (!sContainerID)
            return;

        for (var i = 0; i < LogiXML.rdInputTextDelimiter._all.length; i++) {
            var item = LogiXML.rdInputTextDelimiter._all[i];

            if (item.inputID == inp.id && item.containerID != sContainerID)
                return;
        }

        if (document.getElementById(sContainerID))
            return;

        if (inp.offsetWidth == 0) {
            // input not visible, wait until it is
            var ele = inp;

            // the observer must observe the display=none element
            while (ele && ele.style && ele.style.display != "none") {
                ele = ele.parentNode;
            }

            if (ele) {
                if (io && entries && entries.length) {
                    // already observing, just not visible yet, might need to change the observed element
                    if (entries[0].target == ele)
                        return; // already observing this element for changes

                    if (io.unobserve)
                        io.unobserve(entries[0].target);
                    else if (io.disconnect)
                        io.disconnect(entries[0].target);
                }

                if (typeof IntersectionObserver !== "undefined") {
                    io = new IntersectionObserver(function (entries, io) {
                        var inp = document.getElementById(this.inpID);
                        LogiXML.rdInputTextDelimiter.initOne.bind(inp)(entries, io);
                    }.bind({
                        inpID: inp.id
                    }));
                } else if (typeof MutationObserver !== "undefined") {
                    io = new MutationObserver(LogiXML.rdInputTextDelimiter.initOne.bind(inp));
                }

                return io.observe(ele, { attributes: true });
            }

            return setTimeout(initOne.bind(this), 300);
        }

        if (io && entries && entries.length) {
            if (io.unobserve)
                io.unobserve(entries[0].target);
            else if (io.disconnect)
                io.disconnect(entries[0].target);
        }

        var inpStyle = window.getComputedStyle(inp);

        // wrap textbox in a div
        var container = document.createElement("DIV");
        container.id = sContainerID;
        container.className = LogiXML.rdInputTextDelimiter.CONTAINER_CLASS_NAME;
        container.setAttribute("data-text-input-id", inp.id);
        container.title = inp.title;

        container.style.boxSizing = inpStyle.boxSizing;
        container.style.color = inpStyle.color;
        container.style.outlineColor = inpStyle.outlineColor;

        container.style.borderTopStyle = inpStyle.borderTopStyle;
        container.style.borderTopColor = inpStyle.borderTopColor;
        container.style.borderTopWidth = inpStyle.borderTopWidth;
        container.style.borderTopLeftRadius = inpStyle.borderTopLeftRadius;
        container.style.borderTopRightRadius = inpStyle.borderTopRightRadius;

        container.style.borderRightStyle = inpStyle.borderRightStyle;
        container.style.borderRightColor = inpStyle.borderRightColor;
        container.style.borderRightWidth = inpStyle.borderRightWidth;

        container.style.borderBottomStyle = inpStyle.borderBottomStyle;
        container.style.borderBottomColor = inpStyle.borderBottomColor;
        container.style.borderBottomWidth = inpStyle.borderBottomWidth;
        container.style.borderBottomLeftRadius = inpStyle.borderBottomLeftRadius;
        container.style.borderBottomRightRadius = inpStyle.borderBottomRightRadius;

        container.style.borderLeftStyle = inpStyle.borderLeftStyle;
        container.style.borderLeftColor = inpStyle.borderLeftColor;
        container.style.borderLeftWidth = inpStyle.borderLeftWidth;

        container.style.borderCollapse = inpStyle.borderCollapse;
        container.style.boxShadow = inpStyle.boxShadow;

        // only necessary for IE - but adequate for all browsers
        if (inpStyle.boxSizing == "border-box") {
            container.style.width = inp.offsetWidth + "px";
            container.style.height = inp.offsetHeight + "px";
        } else {
            container.style.width = inpStyle.width;
            container.style.height = inpStyle.height;
        }

        container.style.backgroundColor = inpStyle.backgroundColor;

        container.style.marginTop = inpStyle.marginTop;

        container.style.marginTop = inpStyle.marginTop;
        container.style.marginRight = inpStyle.marginRight;
        container.style.marginBottom = inpStyle.marginBottom;
        container.style.marginLeft = inpStyle.marginLeft;

        container.style.paddingTop = inpStyle.paddingTop;
        container.style.paddingBottom = inpStyle.paddingBottom;
        container.style.paddingLeft = inpStyle.paddingLeft;
        container.style.paddingRight = inpStyle.paddingRight;

        container.style.textAlign = inpStyle.textAlign;

        container.style.position = "relative";

        if (inpStyle.display == "inline")
            container.style.display = "inline-block";
        else
            container.style.display = inpStyle.display;

        var editor = document.createElement("DIV");
        editor.className = LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME;
        editor.setAttribute("contenteditable", "true");
        editor.innerText = inp.value;

        editor.style.fontFamily = inpStyle.fontFamily;
        editor.style.fontSize = inpStyle.fontSize;
        editor.style.fontWeight = inpStyle.fontWeight;
        editor.style.color = inpStyle.color;

        var parentHeightGoal = 0;
        var offsetParent = inp.offsetParent;

        if (offsetParent) {
            parentHeightGoal = offsetParent.offsetHeight;
            var parentStyle = window.getComputedStyle(offsetParent);

            if (parentStyle.position == "static")
                offsetParent.style.position = "relative";
        }

        var inpParent = inp.parentNode;
        var inpParentStyle = window.getComputedStyle(inpParent);

        // freeze parent size
        inp.parentNode.style.width = inpParentStyle.width; // container.style.width; // inp.offsetWidth + "px";
        inp.parentNode.style.height = inpParentStyle.height; // container.style.height; // inp.offsetHeight + "px";

        // turn parent inline to inline-block
        while (inpParentStyle.display == "inline") {
            inpParent.style.display = "inline-block";
            inpParent = inpParent.parentNode;
            inpParentStyle = window.getComputedStyle(inpParent);
        }

        // this line can cause the parent element to resize
        inp.parentNode.insertBefore(container, inp);

        // this line can cause the parent element to resize
        inp.style.position = "absolute";
        inp.style.marginTop = "0px";
        inp.style.marginLeft = "0px";
        inp.style.width = container.style.width;
        inp.style.minWidth = container.style.width;
        inp.style.height = container.style.height;
        inp.style.minHeight = container.style.height;

        if (inpStyle.boxSizing == "content-box") {
            inp.style.top = (container.offsetTop - parseInt(inpStyle.borderTopWidth)) + "px";
            inp.style.left = (container.offsetLeft - parseInt(inpStyle.borderLeftWidth)) + "px";
        } else {
            inp.style.top = container.offsetTop + "px";
            inp.style.left = container.offsetLeft + "px";
        }

        inp.style.visibility = "hidden";

        if (parentHeightGoal) {
            var diff = parentHeightGoal - offsetParent.offsetHeight;
            if (diff) {// adding this element changed the height - compensate with margin
                var newMargin = parseInt(container.style.marginBottom) + diff;

                container.style.marginBottom = diff + "px";
                container.parentNode.style.marginBottom = (diff * -1.0) + "px";

                if (parentHeightGoal != offsetParent.offsetHeight) {
                    container.style.marginBottom = newMargin + "px";
                    container.parentNode.style.marginBottom = (newMargin * -1.0) + "px";
                }
            }
        }

        container.appendChild(editor);

        var containerClick = function () {
            var container = this;

            // if a child element is already active, do nothing
            for (var i = 0; i < container.childNodes.length; i++) {
                if (container.childNodes[i] === document.activeElement)
                    return;
            }

            container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0].focus();
        }.bind(container);

        container.addEventListener("click", containerClick);
        container.addEventListener("copy", LogiXML.rdInputTextDelimiter.copy.bind(container));

        // give this input its own update function
        var fun = LogiXML.rdInputTextDelimiter.update.bind(editor);

        editor.addEventListener("change", fun);
        editor.addEventListener("input", fun);
        editor.addEventListener("paste", fun);
        editor.addEventListener("keyup", fun);

        editor.addEventListener("keydown", LogiXML.rdInputTextDelimiter.keydown.bind(editor));
        editor.addEventListener("blur", LogiXML.rdInputTextDelimiter.blur.bind(editor));
        editor.addEventListener("focus", LogiXML.rdInputTextDelimiter.focus.bind(editor));
        editor.addEventListener("reset", LogiXML.rdInputTextDelimiter.reset.bind(editor));

        // call the update to get things going
        fun();

        if (inp.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.AUTO_COMPLETE_CLASS_NAME) >= 0) {
            var initAutoComplete = function () {
                if (!Y || !Y.LogiXML || !Y.LogiXML.rdAutoComplete)
                    return setTimeout(initAutoComplete, 10);

                var ac = Y.one(this).ac;

                if (!ac)
                    return setTimeout(initAutoComplete, 10);

                // leaving this commented for future debugging
                //var visibleChange = function (e) {
                //    console.log(e);
                //}.bind(this);

                //var afterVisibleChange = function (e) {
                //    console.log(e)
                //}.bind(this);

                //ac.on("visibleChange", visibleChange);
                //ac.after("visibleChange", afterVisibleChange);

                ac.after("select", LogiXML.rdInputTextDelimiter.autoCompleteSelect.bind(this));
            }.bind(inp);
            initAutoComplete();
        }

        // REPDEV-23663 Implement events added by Action elements in the report def
        var actionListener = function (e) {
            LogiXML.fireEvent(this, e.type);
        }.bind(inp);

        for (var i = 0; i < inp.attributes.length; i++) {
            var attr = inp.attributes[i];
            if (attr.specified && attr.name.indexOf("on") === 0 && attr.name.length > 2) {
                var eventName = attr.name.substr(2);

                // these events don't fire automatically or well enough, and are implemented separately in the blur and sync functions
                if (eventName == "change" || eventName == "input")
                    continue;

                container.addEventListener(eventName, actionListener, true); // true = capturing phase = will listen for the event on all children
            }
        }

        container.setAttribute("data-original-value", inp.value);
    },
    init: function () {
        var inputs = document.getElementsByClassName(LogiXML.rdInputTextDelimiter.INPUT_CLASS_NAME);
        for (var i = 0; i < inputs.length; i++) {
            var inp = inputs[i];

            if (!inp.id || inp.tagName.toLowerCase() != "input" || inp.getAttribute("type").toLowerCase() != "text" || inp.getAttribute("data-delimiter-container-id"))
                continue;

            for (var j = LogiXML.rdInputTextDelimiter._all.length - 1; j >= 0; j--) {
                if (LogiXML.rdInputTextDelimiter._all[j].inputID == inp.id) {
                    LogiXML.rdInputTextDelimiter._all.splice(j, 1);
                }
            }

            var sContainerID = LogiXML.getGuid();

            inp.setAttribute("data-delimiter-container-id", sContainerID);
            inp.setAttribute("data-delimiter-init", "true");

            LogiXML.rdInputTextDelimiter.initOne.call(inp);

            LogiXML.rdInputTextDelimiter._all.push({
                inputID: inp.id,
                containerID: sContainerID
            });
        }
    },
    isActive: function (container) {
        var activeElement = document.activeElement;
        if (!activeElement)
            return false;

        while (!activeElement.id) {
            activeElement = activeElement.parentNode;

            if (!activeElement)
                return false;
        }

        if (LogiXML.isAncestorID(activeElement, container.id))
            return true;

        var input = document.getElementById(container.getAttribute("data-text-input-id"));
        var ac = Y.one(input).ac;
        if (!ac)
            return false;

        if (ac._contentBox && ac._contentBox._node && LogiXML.isAncestorID(activeElement, ac._contentBox._node.id))
            return true;

        return false;
    },
    autoCompleteSelect: function (e) {
        if (!e || !e.result || !e.result.raw)
            return;

        var inp = this;
        var container = document.getElementById(inp.getAttribute("data-delimiter-container-id"));
        var divOrPill = container.lastFocusedElement;

        if (!divOrPill)
            return;

        divOrPill.innerText = LogiXML.rdInputTextDelimiter.splitSelectedEntry(divOrPill, e.result.raw);

        var isPill = LogiXML.rdInputTextDelimiter._isPill(divOrPill);

        if (!isPill && divOrPill.innerText) {
            LogiXML.rdInputTextDelimiter.addPill(divOrPill, divOrPill.innerText);
            divOrPill.innerText = "";
        }

        LogiXML.rdInputTextDelimiter.sync(divOrPill);

        // focus the editor
        if (isPill)
            divOrPill = divOrPill.parentNode.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];

        divOrPill.focus();

        setTimeout(function () {
            LogiXML.rdInputTextDelimiter.showAutoCompleteList(this);
        }.bind(container), 100);
    },

    selectedPill: null,
    selectPill: function (pill) {
        LogiXML.addCssClass(pill, LogiXML.rdInputTextDelimiter.SELECTED_CLASS_NAME);
        LogiXML.addCssClass(pill, LogiXML.rdInputTextDelimiter.FULL_SELECTED_CLASS_NAME);

        if (LogiXML.rdInputTextDelimiter.selectedPill && LogiXML.rdInputTextDelimiter.selectedPill !== pill) {
            LogiXML.rdInputTextDelimiter.selectedPill.blur();
        }

        LogiXML.rdInputTextDelimiter.selectedPill = pill;
        pill.focus();

        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }

        if (text == pill.innerText)
            return;

        if (window.getSelection && document.createRange) {
            var range = document.createRange();
            range.selectNodeContents(pill);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (document.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(pill);
            range.select();
        }
    },
    deselectPill: function (pill) {
        LogiXML.removeCssClass(pill, LogiXML.rdInputTextDelimiter.FULL_SELECTED_CLASS_NAME);

        if (LogiXML.rdInputTextDelimiter.selectedPill && LogiXML.rdInputTextDelimiter.selectedPill === pill) {
            LogiXML.rdInputTextDelimiter.selectedPill = null;
        }
    },
    addPill: function (nextSibling, text) {
        var container = nextSibling.parentNode;

        var pill = document.createElement("DIV");
        pill.innerText = LogiXML.rdInputTextDelimiter.splitSelectedEntry(nextSibling, text);
        pill.className = LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME;

        pill.setAttribute("contenteditable", "true");

        container.insertBefore(pill, nextSibling);

        pill.style.marginTop = (pill.offsetTop / -2) + "px";
        pill.style.marginRight = container.style.paddingLeft;

        var pillCssClass = container.getAttribute("data-pill-class-name");
        if (pillCssClass)
            LogiXML.addCssClass(pill, pillCssClass);

        pill.addEventListener("focus", LogiXML.rdInputTextDelimiter.focus.bind(pill));
        pill.addEventListener("blur", LogiXML.rdInputTextDelimiter.pillBlur.bind(pill));
        pill.addEventListener("keydown", LogiXML.rdInputTextDelimiter.keydown.bind(pill));

        var fun = LogiXML.rdInputTextDelimiter.pillChange.bind(pill);

        pill.addEventListener("change", fun);
        pill.addEventListener("input", fun);
        pill.addEventListener("paste", fun);
        pill.addEventListener("keyup", fun);

        pill.addEventListener("dblclick", function () {
            LogiXML.rdInputTextDelimiter.selectPill(this);
        }.bind(pill));

        pill.addEventListener("mousedown", function (e) {
            if (this.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.SELECTED_CLASS_NAME) >= 0)
                return;

            LogiXML.rdInputTextDelimiter.selectPill(this);

            e.cancelBubble = true;
            if (e.stopPropogation)
                e.stopPropogation();
            if (e.preventDefault)
                e.preventDefault();
        }.bind(pill));

        return pill;
    },
    applyActiveCss: function (pillOrDiv) {
        var container = pillOrDiv.parentNode;
        var inp = document.getElementById(container.getAttribute("data-text-input-id"));

        // copy the input element's focus appearance on the first focus
        if (container.getAttribute("data-outline-style-set") != "true") {
            container.setAttribute("data-outline-style-set", "true");

            var selection = window.getSelection();
            var offset = selection.anchorOffset;
            var origActive = document.activeElement;

            var tmpFocus = function (e) {
                var pillOrDiv = this;
                var container = pillOrDiv.parentNode;
                var inp = document.getElementById(container.getAttribute("data-text-input-id"));

                inp.removeEventListener("focus", tmpFocus);

                var inpFocus = window.getComputedStyle(inp);

                container.setAttribute("data-outline-color", inpFocus.outlineColor);
                container.setAttribute("data-outline-offset", inpFocus.outlineOffset);
                container.setAttribute("data-outline-style", inpFocus.outlineStyle);
                container.setAttribute("data-outline-width", inpFocus.outlineWidth);

                inp.style.visibility = "hidden";

                if (origActive && origActive != document.activeElement)
                    origActive.focus();

                var textNode;

                if (!pillOrDiv.childNodes.length) {
                    textNode = document.createTextNode("");
                    pillOrDiv.appendChild(textNode);
                } else {
                    textNode = pillOrDiv.childNodes[0];
                }

                var range = document.createRange();

                offset = Math.min(offset, textNode.length);

                range.setStart(textNode, offset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                e.cancelBubble = true;
                if (e.stopPropogation)
                    e.stopPropogation();
                if (e.preventDefault)
                    e.preventDefault();
            }.bind(pillOrDiv);

            inp.addEventListener("focus", tmpFocus);
            inp.style.visibility = "visible";
            inp.focus();
        }

        container.style.outlineColor = container.getAttribute("data-outline-color"); // inp.getAttribute("data-active-outline-color");
        container.style.outlineOffset = container.getAttribute("data-outline-offset"); // inp.getAttribute("data-active-outline-offset");
        container.style.outlineStyle = container.getAttribute("data-outline-style"); // inp.getAttribute("data-active-outline-style");
        container.style.outlineWidth = container.getAttribute("data-outline-width"); // inp.getAttribute("data-active-outline-width");
    },
    removeActiveCss: function (pillOrDiv) {
        var container = pillOrDiv.parentNode;

        container.style.outlineStyle = "none";
        container.style.outlineWidth = "0px";
    },
    blur: function () {
        var div = this;
        var container = div.parentNode;

        if (LogiXML.rdInputTextDelimiter.isActive(container))
            return;

        LogiXML.rdInputTextDelimiter.syncPlaceholder(container);

        var hasPlaceholder = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME).length;

        if (!hasPlaceholder && div.innerText) {
            var pill = LogiXML.rdInputTextDelimiter.addPill(div, div.innerText);
            div.innerText = "";
            container.lastFocusedElement = pill;
            LogiXML.rdInputTextDelimiter.sync(div);
        }
        LogiXML.rdInputTextDelimiter.removeActiveCss(div);

        if (container.acBlurTo)
            clearTimeout(container.acBlurTo);

        var fun = function () {
            LogiXML.rdInputTextDelimiter.hideAutoCompleteList(this);

            // fire onchange if changed
            var origValue = container.getAttribute("data-original-value");
            var inp = document.getElementById(this.getAttribute("data-text-input-id"));
            if (inp.value != origValue) {
                LogiXML.fireEvent(inp, "change");
                container.setAttribute("data-original-value", inp.value);
            }
        }.bind(container);

        container.acBlurTo = setTimeout(fun, 400);
    },
    _isPill: function (divOrPill) {
        return divOrPill.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME) >= 0;
    },
    clear: function (input) {
        input.value = "";

        var sContainerID = input.getAttribute("data-delimiter-container-id");

        var container = document.getElementById(sContainerID);
        if (!container)
            return;

        var pills = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME);

        for (var i = pills.length - 1; i >= 0; i--) {
            container.removeChild(pills[i]);
        }

        var editor = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
        editor.innerText = "";
    },
    copy: function (e) {
        var selection = window.getSelection();
        if (!selection || !selection.anchorNode || selection.anchorNode.nodeType != 1) {
            // anchor is not a div
            if (selection.anchorNode.nodeType != 3 || selection.toString())
                return false; // anchor is not empty text
        }

        // anchor is either a div or empty text

        var anchorNode = selection.anchorNode;
        if (anchorNode.nodeType == 3)
            anchorNode = anchorNode.parentNode;

        var text = null;
        var css = anchorNode.className.split(" ");
        if (css.indexOf(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME) >= 0) {
            // copy pill contents
            text = anchorNode.innerText;
        } else if (css.indexOf(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME) >= 0) {
            // copy input value
            text = document.getElementById(this.getAttribute("data-text-input-id")).value;
        }

        if (text !== null) {
            var clipboardData = e.clipboardData;
            if (clipboardData) {
                clipboardData.setData("text/plain", text);

                e.cancelBubble = true;
                if (e.stopPropogation)
                    e.stopPropogation();
                if (e.preventDefault)
                    e.preventDefault();
            }
        }
    },
    copyIE: function (divOrPill) {
        var selection = window.getSelection();
        if (!selection || !selection.anchorNode || selection.anchorNode.nodeType != 1) {
            // anchor is not a div
            if (selection.anchorNode.nodeType != 3 || selection.toString())
                return false; // anchor is not empty text
        }

        // anchor is either a div or empty text

        var anchorNode = selection.anchorNode;
        if (anchorNode.nodeType == 3)
            anchorNode = anchorNode.parentNode;

        var text = null;
        var css = anchorNode.className.split(" ");
        if (css.indexOf(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME) >= 0) {
            // copy pill contents
            text = anchorNode.innerText;
        } else if (css.indexOf(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME) >= 0) {
            // copy input value data-text-input-id
            text = document.getElementById(divOrPill.parentNode.getAttribute("data-text-input-id")).value;
        }

        if (text !== null) {
            var clipboardData = window.clipboardData;
            if (clipboardData) {
                clipboardData.setData("text", text);
                return true;
            }
        }

        return false;
    },
    focus: function () {
        var divOrPill = this;
        var container = divOrPill.parentNode;

        if (container.acBlurTo)
            clearTimeout(container.acBlurTo);

        var newFocus;
        if (container.lastFocusedElement && container.lastFocusedElement == divOrPill)
            newFocus = false;
        else {
            newFocus = true;
            container.lastFocusedElement = divOrPill;
            LogiXML.rdInputTextDelimiter.hideAutoCompleteList(container);
        }

        var isPill = LogiXML.rdInputTextDelimiter._isPill(divOrPill);

        if (isPill)
            LogiXML.addCssClass(divOrPill, LogiXML.rdInputTextDelimiter.SELECTED_CLASS_NAME);

        LogiXML.rdInputTextDelimiter.applyActiveCss(divOrPill);

        if (divOrPill.offsetWidth < container.offsetWidth) {
            var containerStyle = window.getComputedStyle(container);
            var minX;
            if (container.offsetParent === divOrPill.offsetParent)
                minX = container.scrollLeft + container.offsetLeft + parseInt(containerStyle.marginLeft) + parseInt(containerStyle.borderLeftWidth);
            else if (container === divOrPill.offsetParent)
                minX = container.scrollLeft + parseInt(containerStyle.paddingLeft);

            minX = Math.ceil(minX);
            var maxX = Math.floor(minX + (container.clientWidth - parseInt(containerStyle.paddingLeft) - parseInt(containerStyle.paddingRight)));
            var availWidth = maxX - minX;

            if (divOrPill.offsetWidth <= availWidth) {
                if (divOrPill.offsetLeft < minX) {
                    container.scrollLeft -= (minX - divOrPill.offsetLeft);
                } else if (divOrPill.offsetLeft + divOrPill.offsetWidth > maxX) {
                    container.scrollLeft += (divOrPill.offsetLeft + divOrPill.offsetWidth - maxX);
                }
            }
        }

        setTimeout(function () {
            var editor = this.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
            LogiXML.rdInputTextDelimiter.focusEditorWithPlaceholder(editor);
        }.bind(container), 10);
    },
    focusEditorWithPlaceholder: function (editor) {
        var textNode = null;
        var placeholder = null;

        for (var i = 0; i < editor.childNodes.length; i++) {
            var child = editor.childNodes[i];
            if (child.nodeType == 3) {
                textNode = child;
            } else if (child.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME) >= 0) {
                placeholder = child;
            }
        }

        if (!placeholder)
            return;

        if (!textNode) {
            textNode = document.createTextNode("");
            editor.insertBefore(textNode, placeholder);
        }

        var range = document.createRange();
        range.setStart(textNode, 0);
        range.collapse(true);

        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },
    splitSelectedEntry: function (pillOrEditor, text) {
        var container = pillOrEditor.parentNode;
        var input = document.getElementById(container.getAttribute("data-text-input-id"));
        var qualifier = input.getAttribute("data-qualifier");

        if (!qualifier) {
            // if there is no qualifier, then split the text by the delimiter and add a pill for each one except the last.
            // return the remaining text for the last entry.
            var delimiter = input.getAttribute("data-delimiter");
            if (!delimiter)
                delimiter = ",";

            var texts = text.split(delimiter);
            if (texts.length > 1) {
                for (var i = 0; i < texts.length - 1; i++) {
                    LogiXML.rdInputTextDelimiter.addPill(pillOrEditor, texts[i]);
                }

                text = texts[texts.length - 1];

                console.log("WARNING: The list entry [" + text + "] was split into " + texts.length + " entries. To prevent this set the Qualifier and Escape Character attributes on the Input Text Delimiter element.");
            }
        }

        return text;
    },
    keydown: function (e) {
        var pillOrEditor = this;
        var container = pillOrEditor.parentNode;

        // remove non-text nodes like <br>
        for (var i = 0; i < pillOrEditor.childNodes.length; i++) {
            var child = pillOrEditor.childNodes[i];

            if (child.nodeType != 3 && child.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME) < 0)
                pillOrEditor.removeChild(child);
        }

        var pos = window.getSelection().anchorOffset;
        var del = false;
        var nextIdx = -1;
        var pills = null;
        var dir = 0;
        var isPill = pillOrEditor.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME) >= 0;
        var fullSelected = false;
        if (isPill && pillOrEditor.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.FULL_SELECTED_CLASS_NAME) >= 0) {
            LogiXML.removeCssClass(pillOrEditor, LogiXML.rdInputTextDelimiter.FULL_SELECTED_CLASS_NAME);
            if (e.keyCode == 46 || e.keyCode == 8)
                fullSelected = true;
        }

        switch (e.keyCode) {
            case 8: // backspace
            case 37: // left arrow <- leave pill and enter previous one if it exists
                dir = -1;
                if (pos == 0 || fullSelected) { // cursor is at the far left
                    if (isPill && e.keyCode == 8 && (fullSelected || !pillOrEditor.innerText))
                        del = true; // backspace - and pill is empty

                    pills = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME);

                    if (isPill) {
                        if (del && pills.length == 1)
                            nextIdx = 1;
                        else {
                            for (var i = 0; i < pills.length; i++) {
                                if (pills[i] == pillOrEditor) {
                                    if (i > 0)
                                        nextIdx = i - 1;
                                    else
                                        nextIdx = 0;

                                    break;
                                }
                            }
                        }
                    } else {
                        nextIdx = pills.length - 1;
                    }
                }
                break;
            case 39: // right arrow -> leave pill and enter next one if it exists
            case 46: // delete key
            case 13: // enter key
                if (isPill) {
                    if (e.keyCode == 46 && !fullSelected) {
                        // they pressed delete
                        // if text was selected, don't interfere
                        var text = "";
                        if (window.getSelection) {
                            text = window.getSelection().toString();
                        } else if (document.selection && document.selection.type != "Control") {
                            text = document.selection.createRange().text;
                        }

                        if (text)
                            break;
                    }

                    dir = 1;

                    if (fullSelected || pos >= pillOrEditor.innerText.length || e.keyCode == 13) {
                        if (e.keyCode == 46 && (fullSelected || !pillOrEditor.innerText))
                            del = true;
                        else if (e.keyCode == 13) {
                            var ac = Y.one(document.getElementById(container.getAttribute("data-text-input-id"))).ac;
                            if (ac) {
                                var activeItem = ac.get("activeItem");
                                if (activeItem && activeItem._node && activeItem._node.innerText) {
                                    pillOrEditor.innerText = LogiXML.rdInputTextDelimiter.splitSelectedEntry(pillOrEditor, activeItem._node.innerText);
                                    nextIdx = -2;
                                }
                            }
                        }

                        pills = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME);

                        for (var i = 0; i < pills.length; i++) {
                            if (pills[i] == pillOrEditor) {
                                nextIdx = i + 1;
                                break;
                            }
                        }

                        if (nextIdx == -2)
                            nextIdx = pills.length;
                    }
                } else if (e.keyCode == 13) {
                    // enter pressed from editor
                    var ac = Y.one(document.getElementById(container.getAttribute("data-text-input-id"))).ac;
                    if (ac) {
                        var activeItem = ac.get("activeItem");
                        if (activeItem && activeItem._node && activeItem._node.innerText) {
                            LogiXML.rdInputTextDelimiter.addPill(pillOrEditor, activeItem._node.innerText);
                            pillOrEditor.innerText = "";
                            pills = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME);
                            nextIdx = pills.length;

                            LogiXML.rdInputTextDelimiter.sync(pillOrEditor);
                            ac.sendRequest("");

                            var editor = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
                            editor.blur();

                            setTimeout(function () {
                                this.focus();
                            }.bind(editor), 100);
                        }
                    }
                }
                break;
            case 40: // down - if auto-complete, send event to the input element,
            case 38: // up
                // allow arrow keys to control the auto-complete list
                if (Y) {
                    var input = document.getElementById(container.getAttribute("data-text-input-id"));
                    var ac = Y.one(input).ac;
                    if (ac) {
                        ac.show();

                        if (e.keyCode == 40)
                            ac._activateNextItem();
                        else
                            ac._activatePrevItem();

                        e.cancelBubble = true;
                        if (e.stopPropogation)
                            e.stopPropogation();
                        if (e.preventDefault)
                            e.preventDefault();
                    }
                }
                break;
            case 67: // c
                // special case for IE
                if (e.ctrlKey && window.clipboardData) {
                    if (LogiXML.rdInputTextDelimiter.copyIE(pillOrEditor)) {
                        e.cancelBubble = true;
                        if (e.stopPropogation)
                            e.stopPropogation();
                        if (e.preventDefault)
                            e.preventDefault();
                    }
                }
                break;
            default:
                LogiXML.rdInputTextDelimiter.removePlaceholder(container);
                break;
        }

        if (nextIdx >= 0) {
            var nextEle;
            if (nextIdx < pills.length)
                nextEle = pills[nextIdx];
            else
                nextEle = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];

            if (pillOrEditor !== nextEle) {
                pillOrEditor.blur();
                nextEle.focus();
            }

            var range = document.createRange();
            var textNode;
            if (nextEle.childNodes.length)
                textNode = nextEle.childNodes[0];
            else {
                textNode = document.createTextNode("");
                nextEle.appendChild(textNode);
            }
            range.setStart(textNode, dir < 0 ? textNode.length : 0);

            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            if (del)
                container.removeChild(pillOrEditor);

            e.cancelBubble = true;
            if (e.stopPropogation)
                e.stopPropogation();
            if (e.preventDefault)
                e.preventDefault();
        }
    },
    pillBlur: function () {
        var pill = this;

        LogiXML.rdInputTextDelimiter.deselectPill(pill);
        LogiXML.removeCssClass(pill, LogiXML.rdInputTextDelimiter.SELECTED_CLASS_NAME);
        LogiXML.rdInputTextDelimiter.removeActiveCss(pill);

        var container = pill.parentNode;

        if (container.acBlurTo)
            clearTimeout(container.acBlurTo);

        var fun = function () {
            LogiXML.rdInputTextDelimiter.hideAutoCompleteList(this);
        }.bind(container);

        container.acBlurTo = setTimeout(fun, 400);
    },
    pillChange: function (e) {
        var pill = this;
        var container = pill.parentNode;

        LogiXML.rdInputTextDelimiter.insertPastedText(e, pill);

        var inp = document.getElementById(container.getAttribute("data-text-input-id"));
        if (!inp.getAttribute("data-qualifier")) {
            // no qualifier, so always split pill by delimiter
            var delimiter = inp.getAttribute("data-delimiter");
            if (delimiter) {
                var i = pill.innerText.indexOf(delimiter);
                while (i >= 0) {
                    var text;
                    if (i == 0)
                        text = "";
                    else
                        text = pill.innerText.substr(0, i);

                    LogiXML.rdInputTextDelimiter.addPill(pill, text);

                    if (i == pill.innerText.length - delimiter.length)
                        pill.innerText = "";
                    else
                        pill.innerText = pill.innerText.substr(i + delimiter.length);

                    i = pill.innerText.indexOf(delimiter);
                }
            }
        }

        // allow arrow keys to control the auto-complete list
        if (e && Y) {
            var ac = Y.one(inp).ac;
            if (ac && ac.get("activeItem")) {
                switch (e.keyCode) {
                    case 38:
                    case 40:
                        return;
                }
            }
        }

        LogiXML.rdInputTextDelimiter.sync(pill);
    },
    reset: function () {
    },
    getEntries: function (text, delimiter, qualifier, escape, splitLast) {
        var endString = null;
        var entry = "";
        var escaped = false;
        var ignoreNextDelimiter = false;
        var entries = [];

        for (var i = 0; i < text.length; i++) {
            var c = text[i];

            if (c == '\r' || c == '\n')
                c = ' ';

            if (endString) {
                if (!escaped && c == endString) {
                    if (escape == qualifier) {
                        // not escaped yet, but maybe this is an escape?
                        if (i + 1 < text.length && text[i + 1] == qualifier) {
                            // next char is qualifier, this char is escape
                            entry += c;
                            escaped = true;
                        }
                    }

                    if (!escaped) {
                        entries.push(entry.substr(1));
                        entry = "";
                        endString = null;
                        ignoreNextDelimiter = (text.substr(i + 1).trim().indexOf(delimiter) == 0);
                    }
                } else {
                    entry += c;
                    escaped = (c == escape);
                }
            } else if (qualifier && c == qualifier) {
                if (!entry) {
                    endString = c;
                }
                entry += c;
            } else if (c == delimiter) {
                if (ignoreNextDelimiter)
                    ignoreNextDelimiter = false;
                else {
                    entries.push(entry.trim());
                    entry = "";
                }
            } else {
                entry += c;

                if (entry.trim() == "")
                    entry = "";
            }
        }

        if (splitLast)
            return {
                entries: entries,
                entry: entry
            };

        if (entry.trim())
            entries.push(entry.trim());

        return entries;
    },
    setEntries: function (input, unescapedEntries) {
        if (!input)
            return;

        if (!unescapedEntries || !unescapedEntries.length)
            return;

        var sContainerID = input.getAttribute("data-delimiter-container-id");

        if (!sContainerID) {
            LogiXML.rdInputTextDelimiter.init();
            sContainerID = input.getAttribute("data-delimiter-container-id");
            if (!sContainerID)
                return setTimeout(function () {
                    var input = document.getElementById(this.inputID);
                    LogiXML.rdInputTextDelimiter.setEntries(input, this.unescapedEntries);
                }.bind({
                    inputID: input.id,
                    unescapedEntries: unescapedEntries.slice()
                }), 10);
        }

        LogiXML.rdInputTextDelimiter.clear(input);

        var container = document.getElementById(sContainerID);

        var nextSibling = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];

        for (var i = unescapedEntries.length - 1; i >= 0; i--) {
            nextSibling = LogiXML.rdInputTextDelimiter.addPill(nextSibling, unescapedEntries[i]);
        }

        LogiXML.rdInputTextDelimiter.sync(nextSibling);
    },
    insertPastedText: function (e, pillOrEditor) {
        if (e && e.type == "paste" && pillOrEditor) {
            var pastedText = (e.clipboardData || window.clipboardData).getData("Text");
            var sel = window.getSelection();
            var pos = pillOrEditor.innerText.length;
            if (sel.rangeCount) {
                var range = sel.getRangeAt(0);
                if (range.commonAncestorContainer.parentNode === pillOrEditor) {
                    pos = Math.min(range.endOffset, pillOrEditor.innerText.length);
                }
            }

            if (pos == 0) {
                pillOrEditor.innerText = pastedText + pillOrEditor.innerText;
            } else if (pos == pillOrEditor.innerText.length) {
                pillOrEditor.innerText += pastedText;
            } else if (pos > 0 && pos < pillOrEditor.innerText.length) {
                pillOrEditor.innerText = pillOrEditor.innerText.substr(0, pos) + pastedText + pillOrEditor.innerText.substr(pos);
            }

            e.cancelBubble = true;
            if (e.stopPropogation)
                e.stopPropogation();
            if (e.preventDefault)
                e.preventDefault();

            return true;
        }

        return false;
    },
    update: function (e) {
        var editor = this;
        var container = editor.parentNode;

        if (e) {
            switch (e.keyCode) {
                case 40: // down - if auto-complete, send event to the input element,
                case 38: // up
                    // allow arrow keys to control the auto-complete list
                    e.cancelBubble = true;
                    if (e.stopPropogation)
                        e.stopPropogation();
                    if (e.preventDefault)
                        e.preventDefault();

                    break;
            }
        }

        var text = ""; // div.innerText.replace(/\r\n/g, " ").replace(/\r/g, " ").replace(/\n/g, " ").trim();

        // remove non-text nodes like <br>
        var close = LogiXML.rdInputTextDelimiter.insertPastedText(e, editor);;
        for (var i = 0; i < editor.childNodes.length; i++) {
            var child = editor.childNodes[i];

            if (child.nodeType != 3) {
                if (child.tagName == "P")
                    text += child.innerText;

                editor.removeChild(child);

                if (child.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME) < 0)
                    close = true; // the presence of these elements implies the user pressed Enter
            }
        }

        text += editor.innerText;

        var selection = window.getSelection();
        var offset = selection.anchorOffset;

        var entry = "";
        var addPill = LogiXML.rdInputTextDelimiter.addPill;

        var input = document.getElementById(editor.parentNode.getAttribute("data-text-input-id"));

        var qualifier = input.getAttribute("data-qualifier");
        var delimiter = input.getAttribute("data-delimiter");
        var escape = input.getAttribute("data-escape");

        var entries = LogiXML.rdInputTextDelimiter.getEntries(text, delimiter, qualifier, escape, true);
        var entry = entries.entry;
        entries = entries.entries;

        for (var i = 0; i < entries.length; i++) {
            addPill(editor, entries[i]);
        }

        if (close || (!e && entry)) {
            if (e) {
                entry = entry.trim();
                var ac = Y.one(input).ac;
                if (ac) {
                    var activeItem = ac.get("activeItem");
                    if (activeItem && activeItem._node && activeItem._node.innerText)
                        entry = activeItem._node.innerText;
                }
            }

            if (entry)
                addPill(this, entry);

            entry = "";
        }

        editor.innerText = entry;

        var textNode;

        if (!editor.childNodes.length) {
            textNode = document.createTextNode("");
            editor.appendChild(textNode);
        } else {
            textNode = editor.childNodes[0];
        }

        var range = document.createRange();

        offset = Math.min(offset, textNode.length);

        range.setStart(textNode, offset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // allow arrow keys to control the auto-complete list
        if (e && Y) {
            switch (e.keyCode) {
                case 38:
                case 40:
                    var ac = Y.one(input).ac;
                    if (ac && ac.get("activeItem"))
                        return;
            }
        }

        LogiXML.rdInputTextDelimiter.sync(editor, !e);

        // If this is not triggered from an event, it's the initial load
        if (!e) {
            editor.blur();
            editor.parentNode.scrollLeft = 0;
            LogiXML.rdInputTextDelimiter.hideAutoCompleteList(container);
        }
    },
    isAutoCompleteShown: function (container) {
        if (!container || !Y || !Y.LogiXML || !Y.LogiXML.rdAutoComplete)
            return false;

        var input = document.getElementById(container.getAttribute("data-text-input-id"));

        if (input.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.AUTO_COMPLETE_CLASS_NAME) < 0)
            return false;

        var ac = Y.one(input).ac;
        if (ac && ac._listNode && ac._listNode._node && ac._listNode._node.offsetHeight)
            return true; // already shown

        return false;
    },
    showAutoCompleteList: function (container) {
        if (!container || !Y || !Y.LogiXML || !Y.LogiXML.rdAutoComplete)
            return;

        var input = document.getElementById(container.getAttribute("data-text-input-id"));

        if (input.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.AUTO_COMPLETE_CLASS_NAME) < 0)
            return;

        var ac = Y.one(input).ac;
        if (ac && ac.sendRequest) {
            var pillOrEditor = container.lastFocusedElement;
            if (!container.lastFocusedElement)
                return;

            var isEditor = pillOrEditor.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME) >= 0;
            if (isEditor)
                LogiXML.rdInputTextDelimiter.removePlaceholder(container);

            ac.sendRequest(pillOrEditor.innerText);

            if (isEditor)
                LogiXML.rdInputTextDelimiter.syncPlaceholder(container);
        }
    },
    hideAutoCompleteList: function (container) {
        if (!container || !Y || !Y.LogiXML || !Y.LogiXML.rdAutoComplete)
            return;

        var input = document.getElementById(container.getAttribute("data-text-input-id"));

        if (input.className.split(" ").indexOf(LogiXML.rdInputTextDelimiter.AUTO_COMPLETE_CLASS_NAME) < 0)
            return;

        var ac = Y.one(input).ac;
        if (ac) {
            ac.set("alwaysShowList", false);
            ac.hide();
        }
    },
    sync: function (pillOrEditor, skipAc) {
        var container = pillOrEditor.parentNode;
        var pills = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME);
        var editor = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
        var input = document.getElementById(container.getAttribute("data-text-input-id"));

        var delimiter = input.getAttribute("data-delimiter"); // ,
        var qualifier = input.getAttribute("data-qualifier"); // "
        var escape = input.getAttribute("data-escape");       // \

        var values = [];

        for (var i = 0; i < pills.length; i++) {
            values.push(pills[i].innerText);
        }

        LogiXML.rdInputTextDelimiter.removePlaceholder(container);

        if (editor.innerText)
            values.push(editor.innerText);

        var value = LogiXML.rdInputTextDelimiter.delimit(values, delimiter, qualifier, escape);

        if (input.value != value || !LogiXML.rdInputTextDelimiter.isAutoCompleteShown(container)) {

            if (input.value != value) {
                input.value = value;

                // simulate oninput - because it will not fire automatically
                LogiXML.fireEvent(input, "input");
            }

            if (!skipAc) {
                setTimeout(function () {
                    LogiXML.rdInputTextDelimiter.showAutoCompleteList(this);
                }.bind(container), 100);
            }
        }

        LogiXML.rdInputTextDelimiter.syncPlaceholder(container);
    },
    delimit: function (values, delimiter, qualifier, escape) {
        var regQual = new RegExp(qualifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "g");
        var regEsc = new RegExp(escape.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "g");

        var value = "";

        if (!delimiter)
            delimiter = "";

        var text;

        for (var i = 0; i < values.length; i++) {
            text = values[i];

            // don't include qualifier if it is not needed
            if (delimiter && qualifier
                && (text.indexOf(delimiter) >= 0
                    || text.indexOf(qualifier) >= 0
                    || (escape && text.indexOf(escape) >= 0))) {

                if (escape)
                    text = text.replace(regEsc, escape + escape);

                if (escape != qualifier)
                    text = text.replace(regQual, escape + qualifier);

                text = qualifier + text + qualifier;
            }

            value += text + delimiter;
        }

        if (value == delimiter)
            value = "";
        else if (value && delimiter)
            value = value.substr(0, value.length - delimiter.length);

        return value;
    },
    removePlaceholder: function (container) {
        var placeholder = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME);
        if (placeholder.length) {
            placeholder = placeholder[0];
            placeholder.parentNode.removeChild(placeholder);
        }
    },
    syncPlaceholder: function (container) {
        var placeholder = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME);
        var input = document.getElementById(container.getAttribute("data-text-input-id"));

        if (input.value || !input.placeholder) {
            if (placeholder.length) {
                placeholder = placeholder[0];
                placeholder.parentNode.removeChild(placeholder);
            }
        } else {
            if (!placeholder.length) {
                placeholder = document.createElement("SPAN");
                placeholder.className = LogiXML.rdInputTextDelimiter.PLACEHOLDER_CLASS_NAME;
                placeholder.innerText = input.placeholder;

                var editor = container.getElementsByClassName(LogiXML.rdInputTextDelimiter.EDITOR_CLASS_NAME)[0];
                editor.appendChild(placeholder);

                var focusEditor = function () {
                    LogiXML.rdInputTextDelimiter.focusEditorWithPlaceholder(this);
                }.bind(editor);

                placeholder.addEventListener("keydown", focusEditor);
                placeholder.addEventListener("keyup", focusEditor);
                placeholder.addEventListener("click", focusEditor);
                placeholder.addEventListener("focus", focusEditor);
            }
        }
    },
    selectionChange: function (e) {
        var sel = document.getSelection();

        if (!sel || !sel.anchorNode)
            return;

        var pill = sel.anchorNode;
        var found = false;

        while (pill) {
            try {
                if (pill.className && pill.className.indexOf(LogiXML.rdInputTextDelimiter.PILL_CLASS_NAME) >= 0) {
                    found = true;
                    break;
                }
            }
            catch (e) {
                //Catch Error
            }
            pill = pill.parentNode;
        }

        if (LogiXML.rdInputTextDelimiter.selectedPill && (!found || pill !== LogiXML.rdInputTextDelimiter.selectedPill)) {
            LogiXML.rdInputTextDelimiter.deselectPill(LogiXML.rdInputTextDelimiter.selectedPill);
        }

        if (!found)
            return;

        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }

        if (text && text == pill.innerText) {
            LogiXML.rdInputTextDelimiter.selectPill(pill);
        } else {
            LogiXML.rdInputTextDelimiter.deselectPill(pill);
        }
    }
};

document.addEventListener("DOMContentLoaded", LogiXML.rdInputTextDelimiter.init);
document.addEventListener("selectionchange", LogiXML.rdInputTextDelimiter.selectionChange);