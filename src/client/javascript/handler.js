/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

(function(API, Utils) {
  'use strict';

  var _handlerInstance;

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HANDLING CODE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Default Handler Implementation
   *
   * Used for communication, resources, settings and session handling
   *
   * You can implement your own.
   *
   * NEVER CONSTRUCT YOUR OWN INTANCE! To get one use:
   * OSjs.Core.getHandler();
   *
   * @api   OSjs.Core._Handler
   * @link https://os.js.org/doc/manuals/man-multiuser.html
   * @link https://os.js.org/doc/tutorials/create-handler.html
   * @class _Handler
   */
  var _Handler = function() {
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }

    this._saveTimeout = null;

    this.offline    = false;
    this.nw         = null;
    this.userData   = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['admin']
    };

    if ( (API.getConfig('Connection.Type') === 'nw') ) {
      this.nw = require('osjs').init({
        root: process.cwd(),
        settings: {
          mimes: API.getConfig('MIME.mapping')
        },
        nw: true
      });
    }

    _handlerInstance = this;
  };

  /**
   * Initializes the handler
   *
   * @param   Function      callback        Callback function
   *
   * @see OSjs.API.initialize()
   *
   * @return  void
   *
   * @method  _Handler::init()
   */
  _Handler.prototype.init = function(callback) {
    console.debug('Handler::init()');

    var self = this;
    API.setLocale(API.getConfig('Locale'));

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.addEventListener('online', function(ev) {
        self.onOnline();
      });
    }

    callback();
  };

  /**
   * Destroy the handler
   *
   * @return  void
   *
   * @method  _Handler::destroy()
   */
  _Handler.prototype.destroy = function() {
    var self = this;
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.removeEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.removeEventListener('online', function(ev) {
        self.onOnline();
      });
    }

    this.nw = null;

    _handlerInstance = null;
  };

  /**
   * Default login method
   *
   * @param   String    username      Login username
   * @param   String    password      Login password
   * @param   Function  callback      Callback function => fn(err)
   *
   * @return  void
   *
   * @method  _Handler::login()
   */
  _Handler.prototype.login = function(username, password, callback) {
    console.info('Handler::login()', username);

    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(false, response.result);
      } else {
        var error = response.error || API._('ERR_LOGIN_INVALID');
        callback(API._('ERR_LOGIN_FMT', error), false);
      }
    }, function(error) {
      callback(API._('ERR_LOGIN_FMT', error), false);
    });
  };

  /**
   * Default logout method
   *
   * @param   boolean   save          Save session?
   * @param   Function  callback      Callback function => fn(err, result)
   *
   * @return  void
   *
   * @method  _Handler::logout()
   */
  _Handler.prototype.logout = function(save, callback) {
    console.info('Handler::logout()');

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

    if ( save ) {
      this.saveSession(function() {
        _finished(true);
      });
      return;
    }
    _finished(true);
  };

  /**
   * Default method for saving current sessions
   *
   * @param   Function  callback      Callback function => fn(err)
   *
   * @return  void
   *
   * @method  _Handler::saveSession()
   */
  _Handler.prototype.saveSession = function(callback) {
    var data = [];
    API.getProcesses().forEach(function(proc, i) {
      if ( proc && (proc instanceof OSjs.Core.Application) ) {
        data.push(proc._getSessionData());
      }
    });
    OSjs.Core.getSettingsManager().set('UserSession', null, data, callback);
  };

  /**
   * Get last saved sessions
   *
   * @param   Function  callback      Callback function => fn(err,list)
   *
   * @return  void
   *
   * @method  _Handler::getLastSession()
   */
  _Handler.prototype.getLastSession = function(callback) {
    callback = callback || function() {};

    var res = OSjs.Core.getSettingsManager().get('UserSession');
    var list = [];
    (res || []).forEach(function(iter, i) {
      var args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];

      list.push({name: iter.name, args: args});
    });

    callback(false, list);
  };

  /**
   * Default method to restore last running session
   *
   * @param   Function  callback      Callback function => fn()
   *
   * @return  void
   *
   * @method  _Handler::loadSession()
   */
  _Handler.prototype.loadSession = function(callback) {
    callback = callback || function() {};

    console.info('Handler::loadSession()');

    this.getLastSession(function(err, list) {
      if ( err ) {
        callback();
      } else {
        API.launchList(list, null, null, callback);
      }
    });
  };

  /**
   * Default method to save given settings pool
   *
   * @param   String    pool          (optional) Pool Name
   * @param   Mixed     storage       Storage data
   * @param   Function  callback      Callback function => fn(error, result)
   *
   * @return  void
   *
   * @method  _Handler::saveSettings()
   */
  _Handler.prototype.saveSettings = function(pool, storage, callback) {
    var self = this;
    var opts = {settings: storage};

    function _save() {
      self.callAPI('settings', opts, function(response) {
        callback.call(self, false, response.result);
      }, function(error) {
        callback.call(self, error, false);
      });
    }

    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }

    setTimeout(_save, 250);
  };

  /**
   * Default method to perform a resolve on a VFS File object.
   *
   * This should return the URL for given resource.
   *
   * @param   OSjs.VFS.File       item      The File Object
   *
   * @return  String
   * @method  _Handler::getVFSPath()
   */
  _Handler.prototype.getVFSPath = function(item) {
    var base = API.getConfig('Connection.FSURI', '/');
    if ( item ) {
      return base + '/get/' + item.path;
    }
    return base + '/upload';
  };

  /**
   * Default method to perform a call to the backend (API)
   *
   * Please note that this function is internal, and if you want to make
   * a actual API call, use "API.call()" instead.
   *
   * @see OSjs.API.call()
   *
   * @see _Handler::__callNW()
   * @see _Handler::_callAPI()
   * @see _Handler::_callVFS()
   * @method  _Handler::callAPI()
   */
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    args      = args      || {};
    options   = options   || {};
    cbSuccess = cbSuccess || function() {};
    cbError   = cbError   || function() {};

    var self = this;

    function checkState() {
      if ( self.offline ) {
        cbError('You are currently off-line and cannot perform this operation!');
        return false;
      } else if ( (API.getConfig('Connection.Type') === 'standalone') ) {
        cbError('You are currently running locally and cannot perform this operation!');
        return false;
      }
      return true;
    }

    function _call() {
      if ( (API.getConfig('Connection.Type') === 'nw') ) {
        return self.__callNW(method, args, options, cbSuccess, cbError);
      }

      if ( method.match(/^FS/) ) {
        return self._callVFS(method, args, options, cbSuccess, cbError);
      }
      return self._callAPI(method, args, options, cbSuccess, cbError);
    }

    console.info('Handler::callAPI()', method);

    return checkState() ? _call() : false;
  };

  /**
   * Calls NW "backend"
   *
   * @return boolean
   * @method _Handler::__callNW()
   * @see  _Handler::callAPI()
   */
  _Handler.prototype.__callNW = function(method, args, options, cbSuccess, cbError) {
    cbError = cbError || function() {
      console.warn('Handler::__callNW()', 'error', arguments);
    };

    try {
      this.nw.request(method.match(/^FS\:/) !== null, method.replace(/^FS\:/, ''), args, function(err, res) {
        cbSuccess({error: err, result: res});
      });
    } catch ( e ) {
      console.warn('callAPI() NW.js Warning', e.stack, e);
      cbError(e);
    }
    return true;
  };

  /**
   * Calls Normal "Backend"
   *
   * @see _Handler::_callAPI()
   * @see _Handler::_callVFS()
   * @method  _Handler::__callXHR()
   */
  _Handler.prototype.__callXHR = function(url, args, options, cbSuccess, cbError) {
    var self = this;

    cbError = cbError || function() {
      console.warn('Handler::__callXHR()', 'error', arguments);
    };

    var data = {
      url: url,
      method: 'POST',
      json: true,
      body: args,
      onsuccess: function(/*response, request, url*/) {
        cbSuccess.apply(self, arguments);
      },
      onerror: function(/*error, response, request, url*/) {
        cbError.apply(self, arguments);
      }
    };

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        data[key] = options[key];
      });
    }

    Utils.ajax(data);

    return true;
  };

  /**
   * Wrapper for server API XHR calls
   *
   * @return boolean
   * @method _Handler::_callAPI()
   * @see  _Handler::callAPI()
   * @see  _Handler::__callXHR()
   */
  _Handler.prototype._callAPI = function(method, args, options, cbSuccess, cbError) {
    var url = API.getConfig('Connection.APIURI') + '/' + method;
    return this.__callXHR(url, args, options, cbSuccess, cbError);
  };

  /**
   * Wrapper for server VFS XHR calls
   *
   * @return boolean
   * @method _Handler::_callVFS()
   * @see  _Handler::callAPI()
   * @see _Handler::__callGET()
   * @see _Handler::__callPOST()
   * @see  _Handler::__callXHR()
   */
  _Handler.prototype._callVFS = function(method, args, options, cbSuccess, cbError) {
    if ( method === 'FS:get' ) {
      return this.__callGET(args, options, cbSuccess, cbError);
    } else if ( method === 'FS:upload' ) {
      return this.__callPOST(args, options, cbSuccess, cbError);
    }

    var url = API.getConfig('Connection.FSURI') + '/' + method.replace(/^FS\:/, '');
    return this.__callXHR(url, args, options, cbSuccess, cbError);
  };

  /**
   * Does a HTTP POST via XHR (For file uploading)
   *
   * @return boolean
   * @method _Handler::__callPOST()
   * @see  _Handler::callAPI()
   */
  _Handler.prototype.__callPOST = function(form, options, cbSuccess, cbError) {
    var onprogress = options.onprogress || function() {};

    cbError = cbError || function() {
      console.warn('Handler::__callPOST()', 'error', arguments);
    };

    OSjs.Utils.ajax({
      url: OSjs.VFS.Transports.Internal.path(),
      method: 'POST',
      body: form,
      onsuccess: function(result) {
        cbSuccess(false, result);
      },
      onerror: function(result) {
        cbError('error', null, result);
      },
      onprogress: function(evt) {
        onprogress(evt);
      },
      oncanceled: function(evt) {
        cbError('canceled', null, evt);
      }
    });

    return true;
  };

  /**
   * Does a HTTP GET via XHR (For file downloading);
   *
   * @return boolean
   * @method _Handler::__callGET()
   * @see  _Handler::callAPI()
   */
  _Handler.prototype.__callGET = function(args, options, cbSuccess, cbError) {
    var self = this;
    var onprogress = args.onprogress || function() {};

    cbError = cbError || function() {
      console.warn('Handler::__callGET()', 'error', arguments);
    };

    Utils.ajax({
      url: args.url || OSjs.VFS.Transports.Internal.path(args.path),
      method: args.method || 'GET',
      responseType: 'arraybuffer',
      onprogress: function(ev) {
        if ( ev.lengthComputable ) {
          onprogress(ev, ev.loaded / ev.total);
        } else {
          onprogress(ev, -1);
        }
      },
      onsuccess: function(response, xhr) {
        if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
          cbSuccess({error: xhr.statusText || response, result: null});
          return;
        }
        cbSuccess({error: false, result: response});
      },
      onerror: function() {
        cbError.apply(self, arguments);
      }
    });

    return true;
  };

  //
  // Events
  //

  /**
   * Called when login() is finished
   *
   * @param   Object    data          JSON Data from login action (userData, userSettings, etc)
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::onLogin()
   */
  _Handler.prototype.onLogin = function(data, callback) {
    callback = callback || function() {};

    var userSettings = data.userSettings;
    if ( !userSettings || userSettings instanceof Array ) {
      userSettings = {};
    }

    this.userData = data.userData;

    // Ensure we get the user-selected locale configured from WM
    function getUserLocale() {
      var curLocale = Utils.getUserLocale() || API.getConfig('Locale');
      var result = OSjs.Core.getSettingsManager().get('CoreWM');
      if ( !result ) {
        try {
          result = userSettings.CoreWM;
        } catch ( e )  {}
      }
      return result ? (result.language || curLocale) : curLocale;
    }

    document.getElementById('LoadingScreen').style.display = 'block';

    API.setLocale(getUserLocale());
    OSjs.Core.getSettingsManager().init(userSettings);

    if ( data.blacklistedPackages ) {
      OSjs.Core.getPackageManager().setBlacklist(data.blacklistedPackages);
    }

    callback();
  };

  /**
   * Called upon a VFS request
   *
   * You can use this to interrupt/hijack operations.
   *
   * It is what gets called 'before' a VFS request takes place
   *
   * @param   String    vfsModule     VFS Module Name
   * @param   String    vfsMethod     VFS Method Name
   * @param   Object    vfsArguments  VFS Method Arguments
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::onVFSRequest()
   */
  _Handler.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    // If you want to interrupt/hijack or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * Called upon a VFS request completion
   *
   * It is what gets called 'after' a VFS request has taken place
   *
   * @param   String    vfsModule     VFS Module Name
   * @param   String    vfsMethod     VFS Method Name
   * @param   Object    vfsArguments  VFS Method Arguments
   * @param   String    vfsError      VFS Response Error
   * @param   Mixed     vfsResult     VFS Response Result
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::onVFSRequestCompleted()
   */
  _Handler.prototype.onVFSRequestCompleted = function(vfsModule, vfsMethod, vfsArguments, vfsError, vfsResult, callback) {
    // If you want to interrupt/hijack or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * When browser goes online
   *
   * @method _Handler::onOnline()
   */
  _Handler.prototype.onOnline = function() {
    console.warn('Handler::onOnline()', 'Going online...');
    this.offline = false;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are On-line!'});
    }
  };

  /**
   * When browser goes offline
   *
   * @method _Handler::onOffline()
   */
  _Handler.prototype.onOffline = function() {
    console.warn('Handler::onOffline()', 'Going offline...');
    this.offline = true;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are Off-line!'});
    }
  };

  /**
   * Get data for logged in user
   *
   * @return  Object      JSON With user data
   *
   * @method  _Handler::getUserData()
   */
  _Handler.prototype.getUserData = function() {
    return this.userData || {};
  };

  /**
   * Initializes login screen
   *
   * @method  _Handler::initLoginScreen()
   */
  _Handler.prototype.initLoginScreen = function(callback) {
    var self      = this;
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
      self.login(username, password, function(error, result) {
        if ( error ) {
          alert(error);
          _restore();
          return;
        }

        console.debug('Handlers::init()', 'login response', result);
        container.parentNode.removeChild(container);

        self.onLogin(result, function() {
          callback();
        });
      });
    }

    login.onsubmit = function(ev) {
      _lock();
      if ( ev ) {
        ev.preventDefault();
      }
      _login(u.value, p.value);
    };

    container.style.display = 'block';

    _restore();
  };

  /**
   * Apply certain traits for given class
   *
   * Available traits are: defaults, init, login, logout, settings
   *
   * Usage: _Handler.use.<trait>(obj)
   *
   * @method  Class   obj     Class reference
   *
   * @api   OSjs.Core._Handler.use
   */
  _Handler.use = (function() {

    //
    // Traits
    //
    var traits = {
      init: function defaultInit(callback) {
        var self = this;
        return OSjs.Core._Handler.prototype.init.call(this, function() {
          self.initLoginScreen(callback);
        });
      },

      login: function defaultLogin(username, password, callback) {
        return OSjs.Core._Handler.prototype.login.apply(this, arguments);
      },

      logout: function defaultLogout(save, callback) {
        return OSjs.Core._Handler.prototype.logout.apply(this, arguments);
      },

      settings: function defaultSettings(pool, storage, callback) {
        return OSjs.Core._Handler.prototype.saveSettings.apply(this, arguments);
      }
    };

    //
    // Helpers
    //

    function applyTraits(obj, add) {
      add.forEach(function(fn) {
        obj.prototype[fn] = traits[fn];
      });
    }

    //
    // Exports
    //
    var exports = {
      defaults: function(obj) {
        applyTraits(obj, Object.keys(traits));
      }
    };

    Object.keys(traits).forEach(function(k) {
      exports[k] = function(obj) {
        applyTraits(obj, [k]);
      };
    });

    return exports;
  })();

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core._Handler = _Handler;
  OSjs.Core.Handler  = null;

  /**
   * Get running 'Handler' instance
   *
   * @return  Handler
   *
   * @api     OSjs.Core.getHandler()
   */
  OSjs.Core.getHandler = function() {
    return _handlerInstance;
  };

})(OSjs.API, OSjs.Utils);

