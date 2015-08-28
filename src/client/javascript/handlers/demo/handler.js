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
(function(API, Utils, VFS) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  function getSettings() {
    var result = {};

    var key;
    for ( var i = 0; i < localStorage.length; i++ ) {
      key = localStorage.key(i);
      if ( key.match(/^OSjs\//) ) {
        try {
          result[key.replace(/^OSjs\//, '')] = JSON.parse(localStorage.getItem(key));
        } catch ( e ) {
          console.warn('DemoHandler::getSetting()', 'exception', e, e.stack);
        }
      }
    }

    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEMO HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Demo handler - Uses localStorage for sessions, for testing purposes
   */
  var DemoHandler = function() {
    OSjs.Core._Handler.apply(this, arguments);

    var curr = OSjs.Core.getConfig().Version;
    var version = localStorage.getItem('__version__');
    if ( curr !== version ) {
      console.warn('DemoHandler()', 'You are running', version, 'version is', curr, 'flushing for compability!');
      localStorage.clear();
    }
    localStorage.setItem('__version__', String(curr));

  };
  DemoHandler.prototype = Object.create(OSjs.Core._Handler.prototype);

  /**
   * Demo initialization
   */
  DemoHandler.prototype.init = function(callback) {
    console.info('OSjs::DemoHandler::init()');

    if ( window.location.href.match(/^file\:\/\//) ) {
      callback({
        id: 0,
        username: 'demo',
        name: 'Local Server',
        groups: ['demo']
      });
    }

    // Use the 'demo' user
    var self = this;
    this.login('demo', 'demo', function(userData) {
      self.onLogin(userData, getSettings(), function() {
        callback();
      });
    });
  };

  /**
   * Demo login. Just an example
   */
  DemoHandler.prototype.login = function(username, password, callback) {
    console.info('DemoHandler::login()', username);
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

  DemoHandler.prototype.saveSettings = function(pool, storage, callback) {
    Object.keys(storage).forEach(function(key) {
      if ( pool && key !== pool ) {
        return;
      }

      try {
        localStorage.setItem('OSjs/' + key, JSON.stringify(storage[key]));
      } catch ( e ) {
        console.warn('DemoHandler::_save()', 'exception', e, e.stack);
      }
    });

    callback();
  };


  //
  // Exports
  //
  OSjs.Core.Handler = DemoHandler;
})(OSjs.API, OSjs.Utils, OSjs.VFS);
