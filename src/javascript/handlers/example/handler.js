/*!
 * OS.js - JavaScript Operating System
 *
 * Example Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
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

/*
See doc/example-handler.txt
*/

(function(API, Utils, VFS) {
  'use strict';

  window.OSjs  = window.OSjs || {};
  OSjs.Core    = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @extends OSjs.Core._Handler
   * @class
   */
  var ExampleHandler = function() {
    OSjs.Core._Handler.apply(this, arguments);
    this._saveTimeout;
  };

  ExampleHandler.prototype = Object.create(OSjs.Core._Handler.prototype);

  /**
   * Override default init() method
   */
  ExampleHandler.prototype.init = function(callback) {
    var self = this;

    function _onLoaded() {
      var container = document.getElementById('Login');
      var login     = document.getElementById('LoginForm');
      var u         = document.getElementById('LoginUsername');
      var p         = document.getElementById('LoginPassword');
      var s         = document.getElementById('LoginSubmit');

      if ( !container ) {
        throw new Error('Could not find Login Form Container');
      }

      function _restore() {
        s.removeAttribute('disabled');
        u.removeAttribute('disabled');
        p.removeAttribute('disabled');
      }

      function _lock() {
        s.setAttribute('disabled', 'disabled');
        u.setAttribute('disabled', 'disabled');
        p.setAttribute('disabled', 'disabled');
      }

      function _login(username, password) {
        self.login(username, password, function(result, error) {
          if ( error ) {
            alert(error);
            _restore();
            return;
          }
          console.debug('OSjs::Handlers::ExampleHandler::init()', 'login response', result);
          container.parentNode.removeChild(container);

          self.settings.load(result.userSettings); // IMPORTANT
          self.onLogin(result.userData, function() {
            callback();
          });
        });
      }

      login.onsubmit = function(ev) {
        _lock();
        if ( ev ) ev.preventDefault();
        _login(u.value, p.value);
      };

      container.style.display = 'block';
    }

    var uri = '/example.html';
    OSjs.Utils.ajax({
      url: uri,
      onsuccess: function(response) {
        if ( !response ) {
          alert('No content was found for example handler login HTML');
          return;
        }

        document.body.innerHTML += response;

        setTimeout(function() {
          _onLoaded();
        }, 0);
      },
      onerror: function(error) {
        alert('Failed to fetch example handler login HTML');
      }
    });
  };

  /**
   * Example login api call
   */
  ExampleHandler.prototype.login = function(username, password, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::login()');
    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(response.result);
      } else {
        callback(false, response.error ? ('Error while logging in: ' + response.error) : 'Invalid login');
      }

    }, function(error) {
      callback(false, 'Login error: ' + error);
    });
  };

  /**
   * Example logout api call
   */
  ExampleHandler.prototype.logout = function(save, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::logout()', save);
    var self = this;

    function _finished() {
      var opts = {};
      self.callAPI('logout', opts, function(response) {
        if ( response.result ) {
          callback(true);
        } else {
          callback(false, 'An error occured: ' + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, 'Logout error: ' + error);
      });
    }


    OSjs.Core._Handler.prototype.logout.call(this, save, _finished);
  };

  /**
   * Override default settings saving
   */
  ExampleHandler.prototype.saveSettings = function(callback) {
    console.debug('OSjs::Handlers::DemoHandler::saveSettings()');

    var self = this;
    var settings = this.settings.get();
    var opts = {settings: settings};

    function _save() {
      this.callAPI('settings', opts, function(response) {
        console.debug('ExampleHandler::syncSettings()', response);
        if ( response.result ) {
          callback.call(self, true);
        } else {
          callback.call(self, false);
        }
      }, function(error) {
        console.warn('ExampleHandler::syncSettings()', 'Call error', error);
        callback.call(self, false);
      });
    }

    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    setTimeout(_save, 100);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Handler = ExampleHandler;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
