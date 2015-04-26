/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

(function(Utils, API, GUIElement, Window) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};

  OSjs.Helpers = OSjs.Helpers || {};

  var URL_FMT = 'https://marketplace.firefox.com/api/';

  function buildURL(path, args) {
    var str = [];
    Object.keys(args).forEach(function(i) {
      str.push(i + '=' + args[i]);
    });
    return URL_FMT + path + (str.length ? '?' : '') + str.join('&');
  }

  function apiCall(url, callback) {
    API.curl({
      body: {
        url: url,
        binary: false,
        mime: 'application/json',
        method: 'GET'
      }
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !response.body ) {
        callback('Response was empty');
        return;
      }

      var data = JSON.parse(response.body);
      callback(false, data);
    });
  }

  // TODO: REMOVE WHEN #89 is done
  function IframeElement(name, src, cb) {
    this.frameSource = src;
    this.frame = null;

    GUIElement.apply(this, [name, {
      isIframe: true
    }]);
  }

  IframeElement.prototype = Object.create(GUIElement.prototype);

  IframeElement.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, ['GUIWolfenstenIframe']);
    this.frame = document.createElement('iframe');
    this.frame.style.position = 'absolute';
    this.frame.style.top = '0px';
    this.frame.style.right = '0px';
    this.frame.style.bottom = '0px';
    this.frame.style.left = '0px';
    this.frame.style.width = '100%';
    this.frame.style.height = '100%';
    this.frame.style.border = '0 none';
    this.frame.frameborder = '0';
    this.frame.src = this.frameSource;
    el.appendChild(this.frame);
    return el;
  };

  /////////////////////////////////////////////////////////////////////////////
  // FFAPP WINDOW
  /////////////////////////////////////////////////////////////////////////////

  var FirefoxAppWindow = function(id, title, icon, url) {
    Window.apply(this, ['FirefoxAppWindow' + id.toString(), {
      icon: icon,
      title: title,
      width: 320,
      height: 480,
      allow_resise: false,
      allow_restore: false,
      allow_maximize: false
    }, null]);

    this.iframeWindow = null;
    this.firefoxAppId  = id;
    this.firefoxAppUrl = url;
  };

  FirefoxAppWindow.prototype = Object.create(Window.prototype);

  FirefoxAppWindow.prototype.init = function(wmRef, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    var w = this._addGUIElement(new IframeElement('WolfensteinIframe', this.firefoxAppUrl, function(contentWindow) {
      self._addHook('focus', function() {
        if ( contentWindow ) {
          contentWindow.focus();
          w.frame.focus();
        }
      });
      self._addHook('blur', function() {
        if ( contentWindow ) {
          contentWindow.blur();
          w.frame.blur();
        }
      });
    }), root);

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var SingletonInstance = null;


  /**
   * The FirefoxMarketplace wrapper class
   *
   * This is a private class and can only be aquired through
   * OSjs.Helpers.FirefoxMarketplace.createInsatance()
   *
   * @link http://firefox-marketplace-api.readthedocs.org/en/latest
   *
   * @see OSjs.Helpers.FirefoxMarketplace.createInsatance()
   * @api OSjs.Helpers.FirefoxMarketplace.FirefoxMarketplace
   *
   * @private
   * @class
   */
  function FirefoxMarketplace(clientId) {
  }

  /**
   * Destroy the class
   */
  FirefoxMarketplace.prototype.destroy = function() {
  };

  /**
   * Initializes (preloads) the API
   */
  FirefoxMarketplace.prototype.init = function(callback) {
    callback = callback || function() {};
    callback();
  };

  FirefoxMarketplace.prototype._call = function(func, data, callback) {
    var url = buildURL(func, data);
    apiCall(url, callback);
  };

  FirefoxMarketplace.prototype._metadata = function(appId, callback) {
    var func = 'v2/apps/app/' + appId.toString() + '/';
    var data = {};

    callback = callback || function() {};

    this._call(func, data, function(error, response) {
      if ( error ) { callback(error); }

      var url = response.manifest_url;

      apiCall(url, function(error, metadata) {
        if ( error ) { callback(error); }

        callback(false, metadata, url);
      });

    });
  };

  FirefoxMarketplace.prototype.search = function(q, callback) {
    var func = 'v1/fireplace/search/featured';
    var data = {
      type: 'app',
      app_type: 'hosted'
    };

    if ( q ) {
      func = 'v1/apps/search/';
      data.q = q;
    }

    callback = callback || function() {};

    this._call(func, data, function(error, response) {
      if ( error ) { callback(error); }

      callback(false, response.objects);
    });
  };

  FirefoxMarketplace.prototype.launch = function(id, callback) {
    callback = callback || function() {};

    this._metadata(id, function(error, metadata, url) {
      if ( error ) { callback(error); }

      var resolve = document.createElement('a');
      resolve.href = url;

      var launcher = resolve.host + (metadata.launch_path ? ('/' + metadata.launch_path) : '');
      launcher = resolve.protocol + '//' + launcher.replace(/\/+/g, '/');

      var wm = OSjs.Core.getWindowManager();
      var icon = metadata.icons ? metadata.icons["128"] : null;
      if ( icon.match(/^\//) ) {
        icon = resolve.protocol + '//' + resolve.host + icon;
      }
      var win = new FirefoxAppWindow(id, metadata.name, icon, launcher);
      wm.addWindow(win);

      callback(false, win);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.FirefoxMarketplace = OSjs.Helpers.FirefoxMarketplace || {};

  /**
   * Gets the currently running instance
   *
   * @api OSjs.Helpers.FirefoxMarketplace.getInstance()
   *
   * @return  FirefoxMarketplace       Can also be null
   */
  OSjs.Helpers.FirefoxMarketplace.getInstance = function() {
    return SingletonInstance;
  };

  /**
   * Create an instance of FirefoxMarketplace
   *
   * @param   Object    args      Arguments
   * @param   Function  callback  Callback function => fn(error, instance)
   *
   * @option  args    Array     scope     What scope to load
   *
   * @api OSjs.Helpers.FirefoxMarketplace.createInstance()
   *
   * @return  void
   */
  OSjs.Helpers.FirefoxMarketplace.createInstance = function(args, callback) {
    args = args || {};

    if ( !SingletonInstance ) {
      SingletonInstance = new FirefoxMarketplace();
      SingletonInstance.init(function() {
        callback(false, SingletonInstance);
      });
      return;
    }

    callback(false, SingletonInstance);
  };

})(OSjs.Utils, OSjs.API, OSjs.Core.GUIElement, OSjs.Core.Window);
