"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Example Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

(function() {

  window.OSjs   = window.OSjs   || {};
  OSjs.Handlers = OSjs.Handlers || {};

  /**
   * Storage
   */
  var DefaultStorage = function() {
    if ( !OSjs.Compability.localStorage ) {
      throw "Your browser does not support localStorage :(";
    }
    this.prefix = 'OS.js-v2/ExampleHandler/';
  };

  DefaultStorage.prototype.store = function(o) {
    for ( var i in o ) {
      if ( o.hasOwnProperty(i) ) {
        this.set(i, o[i]);
      }
    }
  };

  DefaultStorage.prototype.load = function() {
    var ret = {};
    for ( var i in localStorage ) {
      if ( localStorage.hasOwnProperty(i) ) {
        ret[i.replace(this.prefix, '')] = JSON.parse(localStorage[i]) || null;
      }
    }
    return ret;
  };

  DefaultStorage.prototype.set = function(k, v) {
    localStorage.setItem(this.prefix + k, JSON.stringify(v));
  };

  DefaultStorage.prototype.get = function(k) {
    var val = localStorage.getItem(this.prefix + k);
    return val ? JSON.parse(val) : null;
  };

  /**
   * Handler
   */
  var ExampleHandler = function() {
    OSjs.Handlers.Default.apply(this, arguments);

    this.storage  = new DefaultStorage();
  };
  ExampleHandler.prototype = Object.create(OSjs.Handlers.Default.prototype);

  ExampleHandler.prototype.init = function(callback) {
    //OSjs.Handlers.Default.prototype.init.apply(this, arguments);

    var self      = this;

    var _onLoaded = function() {
      var container = document.getElementById('Login');
      var login     = document.getElementById('LoginForm');
      var u         = document.getElementById('LoginUsername');
      var p         = document.getElementById('LoginPassword');
      var s         = document.getElementById('LoginSubmit');

      if ( !container ) {
        throw "Could not find Login Form Container";
      }

      var _restore = function() {
        s.removeAttribute("disabled");
        u.removeAttribute("disabled");
        p.removeAttribute("disabled");
      };

      var _lock = function() {
        s.setAttribute("disabled", "disabled");
        u.setAttribute("disabled", "disabled");
        p.setAttribute("disabled", "disabled");
      };

      var _login = function(username, password) {
        self.login(username, password, function(result, error) {
          if ( error ) {
            alert(error);
            _restore();
            return;
          }
          console.debug('OSjs::Handlers::ExampleHandler::init()', 'login response', result);
          self.userData = result.userData;
          var locale = null;
          if ( result.userSettings ) {
            self.settings = result.userSettings;
            if ( result.userSettings.Core ) {
              locale = result.userSettings.Core.Locale || null;
            }
          }
          OSjs.Locale.setLocale(locale || self.config.Core.Locale);

          container.parentNode.removeChild(container);
          callback();
        });
      };

      login.onsubmit = function(ev) {
        _lock();
        if ( ev ) ev.preventDefault();
        _login(u.value, p.value);
      };

      container.style.display = 'block';
    };

    var uri = '/frontend/handlers/example.html';
    OSjs.Utils.Ajax(uri, function(response, httpRequest, url) {
      if ( !response ) {
        alert("No content was found for example handler login HTML");
        return;
      }

      document.body.innerHTML += response;

      setTimeout(function() {
        _onLoaded();
      }, 0);
    }, function(error, response, httpRequest) {
      alert("Failed to fetch example handler login HTML");
    }, {method: 'GET', parse: true});
  };

  ExampleHandler.prototype.login = function(username, password, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::login()');
    var opts = {
      method : 'POST',
      post   : {
        'method'    : 'login',
        'arguments' : {username: username, password: password}
      }
    };
    this.call(opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(response.result);
      } else {
        callback(false, response.error ? ("Error while logging in: " + response.error) : "Invalid login");
      }

    }, function(error) {
      callback(false, "Login error: " + error);
    });
  };

  ExampleHandler.prototype.logout = function(session, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::logout()', session);
    var self = this;

    var _finished = function() {
      var opts = {
        method : 'POST',
        post   : {
          'method'    : 'logout',
          'arguments' : {}
        }
      };

      self.call(opts, function(response) {
        if ( response.result ) {
          callback(true);
        } else {
          callback(false, "An error occured: " + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, "Logout error: " + error);
      });
    };

    if ( session !== null ) {
      self.setUserSession(session, function() {
        _finished();
      });
    } else {
      _finished();
    }
  };

  ExampleHandler.prototype.syncSettings = function(callback) {
    var self = this;
    var settings = this.storage.load();
    var opts = {
      method : 'POST',
      post   : {
        'method'    : 'settings',
        'arguments' : {settings: settings}
      }
    };

    this.call(opts, function(response) {
      console.debug("ExampleHandler::syncSettings()", response);
      if ( response.result ) {
        callback.call(self, true);
      } else {
        callback.call(self, false);
      }
    }, function(error) {
      console.warn("ExampleHandler::syncSettings()", "Call error", error);
      callback.call(self, false);
    });
  };

  ExampleHandler.prototype._setSetting = function(cat, values, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::_setSetting()', cat, values);
    OSjs.Handlers.Default.prototype._setSetting.call(this, cat, values, function(/* ignore result*/) {
      this.storage.set(cat, values);
      this.syncSettings(function() {
        callback.call(this, true);
      });
    });
  };

  ExampleHandler.prototype._setSettings = function(cat, key, opts, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::_setSettings()', cat, key, opts);
    OSjs.Handlers.Default.prototype._setSettings.call(this, cat, key, opts, function(/* ignore result*/) {
      this.storage.store(this.settings);
      this.syncSettings(function() {
        callback.call(this, true);
      });
    });
  };

  OSjs.Handlers.Current  = ExampleHandler; // Set this as the default handler
})();
