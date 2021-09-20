YUI.add('sessionTimeout', function (Y) {
    //"use strict";

    Y.namespace('LogiXML').SessionTimeoutControl = Y.Base.create('SessionTimeoutControl', Y.Base, [], {
        _config : null,

        initializer: function (config) {
            this._config = config;
            this.startup();
            var self = this;
            //we have to subscribe to Ajax events and reset timers (it is an acitivity from user)
            LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { self.startup() });
        },

        startup: function () {
            var self = this;
            this.clearTimers();
            if (this._config.mode == 'redirect') {
                //be sure that popup is hidden
                ShowElement(null, 'pnlSessionTimeoutControl', 'Hide');
                var nWarningDuration = this._config.sessionTimeout - this._config.sessionWarningDuration - 2  //Warn 2 minutes early.
                if (nWarningDuration < 0) {
                    nWarningDuration = 1
                }
                window.rdSessionEndWarningTimout = window.setTimeout(function () { self.showPopup(); }, nWarningDuration * 60000);
                window.rdSessionEndTimout = window.setTimeout(function () { self.logout(); }, this._config.sessionTimeout * 60000);
            } else if (this._config.mode == 'pinging') {
                window.rdSessionPingTimeout = window.setInterval(function () { self.ping(); }, this._config.pingInterval * 60000);
            }
        },

        clearTimers: function () {
            if (window.rdSessionEndWarningTimout) {
                window.clearTimeout(window.rdSessionEndWarningTimout);
            }
            if (window.rdSessionEndTimout) {
                window.clearTimeout(window.rdSessionEndTimout);
            }
            if (window.rdSessionPingTimeout) {
                window.clearTimeout(window.rdSessionPingTimeout);
            }
        },

        ping: function () {            
            rdAjaxRequest('rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=KeepSessionAlive&rnd=' + ((1 + Math.random()) * 0x10000), null, null, null, null, null);
            this.startup();
        },

        logout: function () {
            this.clearTimers();
            if (window.location.href.indexOf("rdWidget") > -1 && this._config.logoutUrl == "rdLogout.aspx") { //fix for widgets
                if (window.location.href.indexOf("/rdTemplate") > -1) {
                    window.location.href = window.location.href.substring(0, window.location.href.indexOf("/rdTemplate") + 1) + "rdLogout.aspx";
                } 
            } else {
                window.location.href = this._config.logoutUrl; //? ask Dima if we already have implementation
            }
        },

        showPopup: function() {
            ShowElement(null, 'pnlSessionTimeoutControl', 'Show');
        }

    }, {
        // Static Methods and properties
        NAME: 'SessionTimeoutControl',
        ATTRS: {
            
        }
    });
}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy'] });
