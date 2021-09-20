YUI.add('rdInputColorPicker', function (Y) {
    "use strict";

    var Lang = Y.Lang,
     TRIGGER = 'rdInputColorPicker';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { Y.LogiXML.rdInputColorPicker.createElements(true); });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').rdInputColorPicker = Y.Base.create('rdInputColorPicker', Y.Base, [], {
        _handlers: {},
        id: null,
        configNode: null,
        capacity: 10,
        colors: ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF', '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC', '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD', '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0', '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79', '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47', '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'],
        customColors: [],
        tileTemplate: '<td style="width: 12px;" class="rdColorPanelHolder" id="colColor" onclick="javascript:Y.LogiXML.rdInputColorPicker.PickColor(this,event);"><a href="javascript:void(0)" tabindex="0" id="<%rdTileID%>" onkeydown="Y.LogiXML.rdInputColorPicker.moveFocusOnArrow(event,<%rdColorPickerID%>,<%left%>,<%right%>,<%top%>,<%bottom%>);"><div style="width:11px;height:11px;border-width:1px;border-style:solid;border-color:#FFFFFF;background-color:<%color%>;" class="rdColorPanel"></div></a></td>',
        allowAlpha: false,
        oldValue:"",
        changeHandler:"",
        defaults: {
            horizontal: false, // horizontal mode layout ?
            inline: false, //forces to show the colorpicker as an inline element
            color: false, //forces a color
            format: false, //forces a format
            input: 'input', // children input selector
            container: false, // container selector
            component: '.add-on, .input-group-addon', // children component selector
            sliders: {
                saturation: {
                    maxLeft: 100,
                    maxTop: 100,
                    callLeft: 'setSaturation',
                    callTop: 'setBrightness'
                },
                hue: {
                    maxLeft: 0,
                    maxTop: 100,
                    callLeft: false,
                    callTop: 'setHue'
                },
                alpha: {
                    maxLeft: 0,
                    maxTop: 100,
                    callLeft: false,
                    callTop: 'setAlpha'
                }
            },
            slidersHorz: {
                saturation: {
                    maxLeft: 100,
                    maxTop: 100,
                    callLeft: 'setSaturation',
                    callTop: 'setBrightness'
                },
                hue: {
                    maxLeft: 100,
                    maxTop: 0,
                    callLeft: 'setHue',
                    callTop: false
                },
                alpha: {
                    maxLeft: 100,
                    maxTop: 0,
                    callLeft: 'setAlpha',
                    callTop: false
                }
            },
            template: '<div class="colorpicker colorpicker-dropdown-menu">' +
              '<div class="colorpicker-saturation"><i><b></b></i></div>' +
              '<div class="colorpicker-hue"><i></i></div>' +
              '<div class="colorpicker-alpha"><i></i></div>' +
              '<div class="colorpicker-color"><div /></div>' +
              '<div class="colorpicker-selectors"></div>' +
              '</div>',
            align: 'right',
            customClass: null,
            colorSelectors: null,
        },

        initializer: function (config) {

            var self = this;
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);

            var img = this.configNode.one('#colorPicker_' + this.id);
            var colorIndicator = Y.one('#rectColorIndicator_' + this.id);

            if (img) {
                this._handlers.click = img.on('click', this.click, this);
            }

            /*var row = colorIndicator.ancestor().ancestor();
            var closeButton = row.one('#actionHidePanel');
            closeButton.on('click', this.lostfocus, this);*/

            this._handlers.click = colorIndicator.on('click', this.click, this);
            colorIndicator.setStyle("cursor", "pointer");

            var storageValue = rdGetLocalStorage("rdDefaultValue_" + this.id);
            if (storageValue) {
                if (colorIndicator.getStyle('backgroundColor') == "transparent")
                    colorIndicator.setStyle('backgroundColor', storageValue);
            }
            //if (colorIndicator.getStyle('backgroundColor') == "transparent")
               // colorIndicator.setStyle('display', 'none');

            this.element = Y.one('input#' + this.id);
            //this.update(true); add onchange for input

            this.element.addClass('colorpicker-element');

            this.options = {};
            Y.extend(this.options, Y.Base, this.defaults, this.element.getData('color'));
            this.options = this.options.prototype;

            this.component = this.options.component;
            this.component = (this.component !== false) ? this.element.one(this.component) : false;
            if (!this.component) {
                this.component = false;
            }
            this.container = (this.options.container === true) ? this.element : this.options.container;
            this.container = (this.container !== false) ? Y.one(this.container) : false;

            // Is the element an input? Should we search inside for any input?
            this.input = this.element.get('nodeName').toLowerCase() == 'input' ? this.element : (this.options.input ?
              this.element.one(this.options.input) : false);
            if (this.input && (this.input.length === 0)) {
                this.input = false;
            }
            // Set HSB color
            this.color = new window.LogiXML.Color(this.options.color !== false ? this.options.color : this.getValue(), this.options.colorSelectors);
            this.format = this.options.format !== false ? this.options.format : this.color.origFormat;

            // Setup picker

            this.picker = Y.Node.create(this.options.template);


            if (this.options.customClass) {
                this.picker.addClass(this.options.customClass);
            }
            if (this.options.inline) {
                this.picker.addClass('colorpicker-inline colorpicker-visible');
            } else {
                this.picker.addClass('colorpicker-hidden');
            }
            if (this.options.horizontal) {
                this.picker.addClass('colorpicker-horizontal');
            }
            if ((this.format === 'rgba' || this.format === 'hsla' || this.options.format === false)&&(this.allowAlpha)) {
                this.picker.addClass('colorpicker-with-alpha');
            }
            if (this.options.align === 'right') {
                this.picker.addClass('colorpicker-right');
            }

            this._handlers.pickerMouseDown = this.picker.on('mousedown', this.mousedown, this);

            this._handlers.pickerTouchstart = this.picker.on('touchstart', this.mousedown, this);

            //this.picker.appendTo(this.container ? this.container : Y.one('body'));

            // Bind events
            if (this.input !== false) {
                //this._handlers.inputKeyUp = this.input.on('keyup', this.keyup, this);

                this._handlers.inputKeyUp = this.input.on('change', this.onInputChangeUpdate, this);
                //if (this.component === false) {
                //    this._handlers.componentfocus = this.element.on('focus', this.show, this);
                //}
                //if (this.options.inline === false) {
                //    this._handlers.innlinefocusOut = this.element.on('focusout', this.hide, this);
                //}
            }

            this._handlers.lostFocus = this.input.on('blur', this.lostfocus,this);
            this._handlers.gotFocus = this.input.on('focus', this.gotfocus,this);

            if (this.component !== false) {
                this._handlers.componentClick = this.component.on('click', this.show, this);
            }

            if ((this.input === false) && (this.component === false)) {
                this._handlers.elementClick = this.element.on('click', this.show, this);
            }

            // for HTML5 input[type='color']
            if ((this.input !== false) && (this.component !== false) && (this.input.attr('type') === 'color')) {

                this._handlers.inputClick = this.input.on('click', this.show, this);
                this._handlers.inputFocus = this.input.on('focus', this.show, this);
            }
            this.update();
        },

        gotfocus: function(e) {
             this.oldValue = this.input.get('value');
        },

        lostfocus: function (e) {
            if (this.oldValue.toUpperCase() !== this.input.get('value').toUpperCase()) {
                if (this.changeHandler != "") {
                    eval(this.changeHandler);
                }
                if (this.input.getDOMNode().onchange) {
                    this.input.getDOMNode().onchange();
                }
            }
            this.oldValue = this.input.get('value');
        },

        click: function (e) {
            if (!this.inited) {
                this.initializePopup();
                this.inited = true;
            }
            var imgId = 'colorPicker_' + this.id;
            var button = document.getElementById(imgId);
            if (!button)
                button = document.getElementById("rectColorIndicator_" + this.id);

            ShowElement(imgId, "ppColors_" + this.id, "Show");
            Y.LogiXML.rdInputColorPicker.addOnblurToColorpicker(button);
            Y.LogiXML.rdInputColorPicker.setFocusToPopup(button, e);
            this.gotfocus();
            this.update();
        },

        initializePopup: function () {
            var tiles = this.buildPopup(this.colors, this.capacity);
            var popup = Y.one('#' + 'ppColors_{0}'.format(this.id));
            this.show();
            var tbody = popup.one('#ppTiles_{0}'.format(this.id)).appendChild(Y.Node.create('<tbody/>'));
            popup.one('#ppSaturation_{0}'.format(this.id)).appendChild(this.picker);
            tbody.appendChild(Y.Node.create(tiles));

            var customTiles = this.buildPopup(this.customColors, this.capacity * 2);
            var customTilePalette = popup.one('#ppCustomPalette_{0}'.format(this.id));
            customTilePalette.setContent(customTiles);

            var currentColor = this.configNode.one('input').get('value');
            if (currentColor) {
                var selector = 'div[style*="background-color:{0}"]'.format(currentColor);
                var activeTile = popup.one(selector);
                if (activeTile) {
                    var activeTileTd = activeTile.ancestor('td');
                    Y.LogiXML.rdInputColorPicker.PickColor(activeTileTd);
                }
            }
        },

        _parseHTMLConfig: function () {
            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            this.capacity = parseInt(this.configNode.getAttribute('data-capacity') || this.capacity, 10);
            var colorString = this.configNode.getAttribute('data-colors');
            if (colorString != "")
                this.customColors = colorString.split(',');
            this.allowAlpha = this.configNode.getAttribute('allowAlpha').toLowerCase() == "true";
            this.changeHandler = this.configNode.getAttribute('data-changed');
        },
        Tile: function (id, parentId, left, right, top, bottom, color) {
            this.rdTileID = id;
            this.rdColorPickerID = parentId;
            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;
            this.color = color;
        },
        buildPopup: function (colors, capacity) {
            var rows = "";
            var rowsCount = colors.length / capacity;
            if (rowsCount != Math.round(rowsCount)) {
                rowsCount = Math.trunc(rowsCount) + 1;
            }
            var colorNumber = 0
            for (var i = 0; i < rowsCount; i++) {
                var row = "<tr>";
                for (var j = 0; j < capacity ; j++) {
                    var left = "null";
                    var top = "null";
                    var bottom = "null";
                    var right = "null";
                    if (i || j) {
                        left = "'Color_{0}_{1}'".format(this.id, colorNumber - 1);
                    }
                    if (i != rowsCount - 1 || j != capacity - 1) {
                        if (colorNumber + 1 < colors.length)
                            right = "'Color_{0}_{1}'".format(this.id, colorNumber + 1);
                    }
                    if (i) {
                        top = "'Color_{0}_{1}'".format(this.id, colorNumber - capacity);
                    }
                    if (i != rowsCount - 1) {
                        var sum = colorNumber + capacity;
                        if (sum < colors.length) {
                            bottom = "'Color_{0}_{1}'".format(this.id, sum);
                        }
                    }
                    row += LogiXML.TemplateEngine(this.tileTemplate, new this.Tile('Color_' + this.id + '_' + colorNumber, "'ppColors_Parent'", left, right, top, bottom, colors[colorNumber]));
                    colorNumber++;
                    if (colorNumber == colors.length) {
                        break;
                    }
                }
                row += "</tr>";
                rows += row;
            }
            return rows;
        },

        show: function (e) {
            if (this.isDisabled()) {
                return false;
            }
            this.picker.addClass('colorpicker-visible').removeClass('colorpicker-hidden');
            //  this.reposition();
            /*if (this.options.inline === false && !this._handlers.documentOnMouseDown) {
                var doc = Y.one(document);
                this._handlers.documentOnMouseDown = doc.on('mousedown', this.hide, this);
            }*/
        },
        hide: function () {
            this.lostfocus();
        },
        updateData: function (val) {
            val = val || this.color.toString(this.format);
            this.element.setData('color', val);
            return val;
        },
        updateInput: function (val) {
            val = val || this.color.toString(this.format);
            if (this.input !== false) {
                if (this.options.colorSelectors) {
                    var color = new window.LogiXML.Color(val, this.options.colorSelectors);
                    var alias = color.toAlias();
                    if (typeof this.options.colorSelectors[alias] !== 'undefined') {
                        val = alias;
                    }
                }
                //var oldVal = this.input.get('value');
                this.input.set('value', val.toUpperCase());
                /*if (this.input.getDOMNode().onchange) {
                    this.input.getDOMNode().onchange();
                }*/
               
            }
            return val;
        },
        updatePicker: function (val) {
            if (val !== undefined) {
                this.color = new window.LogiXML.Color(val, this.options.colorSelectors);
            }           
            var sl = (this.options.horizontal === false) ? this.options.sliders : this.options.slidersHorz;
            var icns = this.picker.all('i');
            if (icns.size() === 0) {
                return;
            }
            if (this.options.horizontal === false) {
                sl = this.options.sliders;
                icns.item(1).setStyle('top', sl.hue.maxTop * (1 - this.color.value.h) + "px");
                icns.item(2).setStyle('top', sl.alpha.maxTop * (1 - this.color.value.a) + "px");
            } else {
                sl = this.options.slidersHorz;
                icns.item(1).setStyle('left', sl.hue.maxLeft * (1 - this.color.value.h) + "px");
                icns.item(2).setStyle('left', sl.alpha.maxLeft * (1 - this.color.value.a) + "px");
            }
            icns.item(0).setStyle('top', sl.saturation.maxTop - this.color.value.b * sl.saturation.maxTop + "px");
            icns.item(0).setStyle('left', this.color.value.s * sl.saturation.maxLeft + "px");

            this.picker.one('.colorpicker-saturation').setStyle('background-color', this.color.toHex(this.color.value.h, 1, 1, 1));
            this.picker.one('.colorpicker-alpha').setStyle('background-color', this.color.toHex());
            this.picker.all('.colorpicker-color, .colorpicker-color div').setStyle('background-color', this.color.toString(this.format));
            return val;
        },
        updateComponent: function (val) {
            if (this.format && this.format == 'rgba' && this.color && this.color.value && this.color.value.a === 1) {
                this.format = 'hex';
                this.color.origFormat = 'hex';
            }
            val = val || this.color.toString(this.format);
            if (this.component !== false) {
                var icn = this.component.all('i').item(0);
                if (icn.size() > 0) {
                    icn.setStyle({
                        'background-color': val
                    });
                } else {
                    this.component.setStyle({
                        'background-color': val
                    });
                }
            }
            var elePickedColorIndicator = document.getElementById('rectColorIndicator_' + this.id);
            elePickedColorIndicator.style.backgroundColor = val;
            elePickedColorIndicator.style.display = 'block';
            return val;
        },
        update: function (force) {
            var val;
            if ((this.getValue(false) !== false) || (force === true)) {
                // Update input/data only if the current value is not empty
                val = this.updateComponent();
                this.updateInput(val);
                this.updateData(val);
                //if (Y.LogiXML.rdInputColorPicker.isShadeOfGray(val))
                //    return false;
                this.updatePicker(); // only update picker if value is not empty
                var popup = Y.one('#' + 'ppColors_{0}'.format(this.id));
                var palette = popup.one('#ppTiles_{0}'.format(this.id));
                var checkedSelector = "div .rdImageColorSelected";
                var checkedDiv = popup.one(checkedSelector);
                if (checkedDiv) {
                    checkedDiv.removeClass('rdImageColorSelected');
                    var checkedImage = checkedDiv.one('.CheckedAlignment');
                    if (checkedImage) {
                        checkedImage.setStyle('visibility', 'hidden');
                    }
                }
                var color = new window.LogiXML.Color(val, this.options.colorSelectors);
                var sColor = color.toString("rgb").replace(/,/g, ", ");
                if (val.toString().toUpperCase().indexOf('RGBA') != -1) {
                    sColor = color.toString("rgba").replace(/,/g, ", ");
                }
                var selector = "td div[style*='background-color:{0}'], td div[style*='background-color: {1}']".format(val.toString().toUpperCase(), sColor);
                var tileColor = palette.one(selector);
                if (tileColor) {
                    var tile = tileColor.ancestor('td');
                    Y.LogiXML.rdInputColorPicker.PickColor(tile, null, true);
                } else {
                    var customTilePalette = popup.one('#ppCustomPalette_{0}'.format(this.id));
                    var customTileColor = customTilePalette.one(selector);
                    var customTile;
                    if (customTileColor) {
                        customTile = customTileColor.ancestor('td');
                        Y.LogiXML.rdInputColorPicker.PickColor(customTile,null,true);
                    }
                }
            }
            return val;

        },
        onInputChangeUpdate: function (force) {
            var val = this.getValue(false);
            if ((val !== false) || (force === true)) {
                // Update input/data only if the current value is not empty
                val = this.updateComponent(val);
                this.updateInput(val);
                this.updateData(val);
                this.updatePicker(val); // only update picker if value is not empty               
            } else {
                this.color = "";
                val = this.updateComponent("");
                this.updateInput(val);
                this.updateData(val);
                this.updatePicker(val);  
            }
            return val;

        },
        setValue: function (val) { // set color manually
            this.color = new window.LogiXML.Color(val, this.options.colorSelectors);
            this.update(true);
        },
        getValue: function (defaultValue) {
            defaultValue = (defaultValue === undefined) ? '#000000' : defaultValue;
            var val;
            if (this.hasInput()) {
                val = this.input.get('value');
            } else {
                val = this.element.getData('color');
            }
            if ((val === undefined) || (val === '') || (val === null)) {
                // if not defined or empty, return default
                val = defaultValue;
            }
            return val;
        },
        hasInput: function () {
            return (this.input && this.input._node);
        },
        isDisabled: function () {
            if (this.hasInput()) {
                return (this.input.get('disabled') === true);
            }
            return false;
        },
        disable: function () {
            if (this.hasInput()) {
                this.input.set('disabled', true);
                return true;
            }
            return false;
        },
        enable: function () {
            if (this.hasInput()) {
                this.input.set('disabled', false);
                return true;
            }
            return false;
        },
        currentSlider: {},
        mousePointer: {
            left: 0,
            top: 0
        },

        clearMouseDownAndMouseMoveEvents: function() {
            if (this._handlers.documentMouseMove) {
                this._handlers.documentMouseMove.detach();
                this._handlers.documentMouseMove = null;
            }
            if (this._handlers.documentTouchmove) {
                this._handlers.documentTouchmove.detach();
                this._handlers.documentTouchmove = null;
            }
            if (this._handlers.documentMouseUp) {
                this._handlers.documentMouseUp.detach();
                this._handlers.documentMouseUp = null;
            }
            if (this._handlers.documentTouchend) {
                this._handlers.documentTouchend.detach();
                this._handlers.documentTouchend = null;
            }
        },

        mousedown: function (e) {
            e.stopPropagation();
            e.preventDefault();
            this.clearMouseDownAndMouseMoveEvents();
            this.isMouseDown = true;
            if (!e.pageX && !e.pageY && e.originalEvent) {
                e.pageX = e.originalEvent.touches[0].pageX;
                e.pageY = e.originalEvent.touches[0].pageY;
            }

            var target = e.target;

            //detect the slider and set the limits and callbacks
            var zone = target.ancestor('div', true);

            var sl = this.options.horizontal ? this.options.slidersHorz : this.options.sliders;
            if (!zone.hasClass('colorpicker')) {
                if (zone.hasClass('colorpicker-saturation')) {
                    Y.extend(this.currentSlider, Y.Base, sl.saturation);
                } else if (zone.hasClass('colorpicker-hue')) {
                    Y.extend(this.currentSlider, Y.Base, sl.hue);
                } else if (zone.hasClass('colorpicker-alpha')) {
                    Y.extend(this.currentSlider, Y.Base, sl.alpha);
                } else {
                    return false;
                }
                this.currentSlider = this.currentSlider.prototype;
                var offset = zone.getXY();
                //reference to guide's style
                this.currentSlider.guide = zone.one('i');
                this.currentSlider.left = e.pageX - offset[0];
                this.currentSlider.top = e.pageY - offset[1];
                this.mousePointer = {
                    left: e.pageX,
                    top: e.pageY
                };
                var doc = Y.one(document);
                this._handlers.documentMouseMove = doc.on('mousemove', this.mousemove, this);
                this._handlers.documentTouchmove = doc.on('touchmove', this.mousemove, this);
                this._handlers.documentMouseUp = doc.on('mouseup', this.mouseup, this);
                this._handlers.documentTouchend = doc.on('touchend', this.mouseup, this);
                this.mousemove(e);
            }
            return false;
        },
        isMouseDown: false,
        mousemove: function (e) {
            e.stopPropagation();
            e.preventDefault();

            if (!this.isMouseDown) {
                return;
            }
            if (!e.pageX && !e.pageY && e.originalEvent) {
                e.pageX = e.originalEvent.touches[0].pageX;
                e.pageY = e.originalEvent.touches[0].pageY;
            }
            e.stopPropagation();
            e.preventDefault();

            var left = Math.max(
              0,
              Math.min(
                this.currentSlider.maxLeft,
                this.currentSlider.left + ((e.pageX || this.mousePointer.left) - this.mousePointer.left)
              )
            );
            var top = Math.max(
              0,
              Math.min(
                this.currentSlider.maxTop,
                this.currentSlider.top + ((e.pageY || this.mousePointer.top) - this.mousePointer.top)
              )
            );
            this.currentSlider.guide.setStyle('left', left + 'px');
            this.currentSlider.guide.setStyle('top', top + 'px');
            if (this.currentSlider.callLeft) {
                this.color[this.currentSlider.callLeft].call(this.color, left / this.currentSlider.maxLeft);
            }
            if (this.currentSlider.callTop) {
                this.color[this.currentSlider.callTop].call(this.color, top / this.currentSlider.maxTop);
            }
            // Change format dynamically
            // Only occurs if user choose the dynamic format by
            // setting option format to false
            if (this.currentSlider.callTop === 'setAlpha' && this.options.format === false) {

                // Converting from hex / rgb to rgba
                if (this.color.value.a !== 1) {
                    this.format = 'rgba';
                    this.color.origFormat = 'rgba';
                }

                    // Converting from rgba to hex
                else {
                    this.format = 'hex';
                    this.color.origFormat = 'hex';
                }
            }
            this.update(true);
            return false;
        },
        mouseup: function (e) {
            this.isMouseDown = false;
            e.stopPropagation();
            e.preventDefault();
            this.clearMouseDownAndMouseMoveEvents();
            this.lostfocus();
            return false;
        },
        change: function (e) {
            this.update(true);
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
            configNode.setData(TRIGGER, null);

            this.picker.remove();
            this.element.clearData('colorpicker').detach('.colorpicker');
            if (this.input !== false) {
                this.input.detach('.colorpicker');
            }
            if (this.component !== false) {
                this.component.detach('.colorpicker');
            }
        },

        _clearHandlers: function () {
            var self = this;
            Y.each(this._handlers, function (item) {
                if (item) {
                    if (item.detach) {
                        item.detach();
                    }
                    item = null;
                }
            });
        },
    }, {
        // Static Methods and properties
        NAME: 'rdInputColorPicker',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },
        PickColor: function (colColor,evt, silent) {
            var self = Y.one(colColor),
                wrapper = self.ancestor('.rdInputColorPicker'),
                eleColorHolder = wrapper.one('input'),
                id = eleColorHolder.getAttribute('id'),
                colorDiv = self.one('div'),
                sColor = Y.Color.toHex(colorDiv.getStyle('background-color') || colorDiv.getDOMNode().style.backgroundColor),
                checkedImage = self.ancestor('div').one('.CheckedAlignment');
            checkedImage.getDOMNode().parentElement.className = checkedImage.getDOMNode().parentElement.className.replace("rdImageColorSelected", "");
            //input
            var oldValue = eleColorHolder.get('value', sColor);
            if (!oldValue) {
                oldValue = eleColorHolder.getAttribute("value");
                
            }
            if (oldValue.toUpperCase() != sColor.toUpperCase()) {
                eleColorHolder.setAttribute("value", sColor);
                eleColorHolder.set('value', sColor);
                if (!silent && eleColorHolder.getDOMNode().onchange) {
                    eleColorHolder.getDOMNode().onchange();
                }
                // this.updateInput(sColor);
                if (!silent) {
                    eleColorHolder.simulate("change");
                    //eleColorHolder.simulate("blur");
                }
                var changeHandler = wrapper.getAttribute('data-changed');
                if (changeHandler != "") {
                    eval(changeHandler);
                }
            }
            //set image to selected color
            colorDiv.appendChild(checkedImage);
            checkedImage.getDOMNode().parentElement.className += " rdImageColorSelected";
            checkedImage.getDOMNode().className = checkedImage.getDOMNode().className.replace("hidden", "");
            checkedImage.setStyle('visibility', 'visible');
            checkedImage.ancestor('a').focus();
            var elePickedColorIndicator = document.getElementById('rectColorIndicator_' + id);
            elePickedColorIndicator.style.backgroundColor = sColor;
            elePickedColorIndicator.style.display = 'block';
        },
        addOnblurToColorpicker: function (colColor) {
            var self = Y.one(colColor),
                wrapper = self.ancestor('.rdInputColorPicker'),
                eleColorHolder = wrapper.one('input'),
                id = eleColorHolder.getAttribute('id'),
                shade = wrapper.one(".popupPanelModal");

            //shade.addClass("popupPanelModalTransparent");
            //shade.on('click', function () {
            //    ShowElement('colorPicker_' + id, 'ppColors_' + id, 'Hide');
            //});
        },
        setFocusToPopup: function (colColor, e) {
            var self = Y.one(colColor),
                wrapper = self.ancestor('.rdInputColorPicker'),
                eleColorHolder = wrapper.one('input'),
                id = eleColorHolder.getAttribute('id'),
                anchor = Y.one('#Color_' + id + '_0');
            var selectedImage = Y.one('#selectedColor_' + id);
            if (selectedImage.ancestor().get('id').indexOf('PopupPanelContent') !== -1) {
                anchor.focus();
            }
            else {
                selectedImage.ancestor('a').focus();
            }

            Y.LogiXML.rdInputColorPicker.stopEventPropogation(e);
        },
        moveFocusOnArrow: function (e, inpid, left, right, top, bottom) {
            if (!e.which)
                e.which = e.keyCode;
            if (e.which == 9) {
                return;
            }
            Y.LogiXML.rdInputColorPicker.stopEventPropogation(e);
            var nextItemId = "";
            var id = "";
            var eventsource = Y.LogiXML.rdInputColorPicker.rdGetEventSource(e);
            id = eventsource.id;
            id = id.slice(id.indexOf('_') + 1, id.lastIndexOf('_'));
            if (e.which == '37') {//left
                nextItemId = left;
            }
            else if (e.which == '38') {//up
                nextItemId = top;
            }
            else if (e.which == '39') {//right
                nextItemId = right;
            }
            else if (e.which == '40') {//down
                nextItemId = bottom;
            }
            else if (e.which == '27') {//esc
                var parent = document.getElementById('ppColors_' + id).parentNode;
                Y.one('#colorPicker_' + id).focus();
                ShowElement('colorPicker_' + id, 'ppColors_' + id, 'Hide');
            }
            else if (e.which == '13') {//enter 
                if (isIE() < 10) {
                    Y.LogiXML.rdInputColorPicker.PickColor(Y.LogiXML.rdInputColorPicker.rdGetEventSource(e).parentNode);
                }
                else if (isIE()) {
                    setTimeout(Y.LogiXML.rdInputColorPicker.rdGetEventSource(e).parentNode.onclick, 100);
                }
                else {
                    Y.LogiXML.rdInputColorPicker.rdGetEventSource(e).parentNode.onclick();
                }
               // Y.one('#colorPicker_' + id).focus();
                Y.LogiXML.rdInputColorPicker.colorselected = true;
                //  setTimeout(document.getElementById('colorPicker_' + id).setAttribute('tabindex', '-1'), 500);//we need to call it after function execution
            }
            if (nextItemId && nextItemId != "" && nextItemId != "null") {
                nextItemId = nextItemId;
                var elem = Y.one('#' + nextItemId);
                elem.focus();
            }
        },
        rdGetEventSource: function (e) {
            return e.srcElement || e.currentTarget;
        },
        stopEventPropogation: function (e) {
            e = e || window.event;
            if (e) {
                e.cancelBubble = true;
                if (e.stopPropagation)
                    e.stopPropagation();
                if (e.preventDefault)
                    e.preventDefault();
                e.returnValue = false;
            }
        },
        callOnclickIfSpaceOrEnter: function (object, e, inpid) {

            if (!e.which)
                e.which = e.keyCode;
            if (isIE() && Y.LogiXML.rdInputColorPicker.colorselected) {
                Y.LogiXML.rdInputColorPicker.colorselected = false;
                return;
            }
            if ((e.which == '32') || (e.which == '13')) {
                Y.LogiXML.rdInputColorPicker.stopEventPropogation(e);
                var id = object.firstChild.getAttribute('id');
                var ele = document.getElementById(id);
                ele.parentNode.appendChild(document.getElementById('ppColors_' + id.slice(id.indexOf('_') + 1)));
                YUI().use('node-event-simulate', function (Y) {
                    Y.one('input#' + id).simulate("click");
                });
                setTimeout(function () {
                    var style = document.getElementById('ppColors_' + id.slice(id.indexOf('_') + 1)).style;
                    style.top = ele.getBoundingClientRect().bottom.toString() + 'px';
                    style.left = (ele.getBoundingClientRect().left + ele.width).toString() + 'px';
                }, 5);
            }
        },
        isShadeOfGray: function(color) {
            var regex = /#(([0-9a-fA-F]){1,2})(\1{2})\b/;
            var match = regex.exec(color);
            if (match)
                return true;
            return false;
        },
        createElements: function () {
            var element;
            Y.all('.' + TRIGGER).each(function (node) {
                element = node.getData(TRIGGER);
                if (!element) {
                    element = new Y.LogiXML.rdInputColorPicker({
                        configNode: node
                    });
                }
            });
            //Y.LogiXML.ResponsiveColumnResizer.createElements();
        }

    });

}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'stylesheet', 'event-custom', 'rdInputColorPicker-css', 'node-event-simulate'] });

if (!Math.trunc)
    Math.trunc = parseInt;
