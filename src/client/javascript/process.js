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
(function(Utils, API) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var _PROCS = [];        // Running processes

  function _kill(pid) {
    if ( pid >= 0 && _PROCS[pid] ) {
      var res = _PROCS[pid].destroy();
      console.warn('Killing application', pid, res);
      if ( res !== false ) {
        _PROCS[pid] = null;
        return true;
      }
    }
    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Kills all processes
   *
   * @param   Mixed     match     String/RegExp to match with (optional)
   *
   * @return  void
   * @api     OSjs.API.killAll()
   */
  function doKillAllProcesses(match) {
    if ( match ) {
      var isMatching;
      if ( match instanceof RegExp && _PROCS ) {
        isMatching = function(p) {
          return p.__pname && p.__pname.match(match);
        };
      } else if ( typeof match === 'string' ) {
        isMatching = function(p) {
          return p.__pname === match;
        };
      }

      if ( isMatching ) {
        _PROCS.forEach(function(p) {
          if ( p && isMatching(p) ) {
            _kill(p.__pid);
          }
        });
      }
      return;
    }

    _PROCS.forEach(function(proc, i) {
      if ( proc ) {
        proc.destroy(true);
      }
      _PROCS[i] = null;
    });
    _PROCS = [];
  }

  /**
   * Kills a process
   *
   * @param   int     pid       Process ID
   *
   * @return  boolean           Success or not
   * @api     OSjs.API.kill()
   */
  function doKillProcess(pid) {
    return _kill(pid);
  }

  /**
   * Sends a message to all processes
   *
   * Example: VFS uses this to signal file changes etc.
   *
   * @param   String    msg     Message name
   * @param   Object    obj     Message object
   * @param   Object    opts    Options
   *
   * @option  opts    integer   source   (Optional) Source Process ID
   *
   * @return  void
   * @see     Process::_onMessage()
   * @api     OSjs.API.message()
   */
  function doProcessMessage(msg, obj, opts) {
    console.debug('doProcessMessage', msg, opts);
    _PROCS.forEach(function(p, i) {
      if ( p && (p instanceof OSjs.Core.Application || p instanceof Process) ) {
        p._onMessage(msg, obj, opts);
      }
    });
  }

  /**
   * Get a process by name
   *
   * @param   String    name    Process Name (or by number)
   * @param   boolean   first   Return the first found
   *
   * @return  Process           Or an Array of Processes
   * @api     OSjs.API.getProcess()
   */
  function doGetProcess(name, first) {
    var p;
    var result = first ? null : [];

    if ( typeof name === 'number' ) {
      return _PROCS[name];
    }

    _PROCS.every(function(p, i) {
      if ( p ) {
        if ( p.__pname === name ) {
          if ( first ) {
            result = p;
            return false;
          }
          result.push(p);
        }
      }

      return true;
    });

    return result;
  }

  /**
   * Get all processes
   *
   * @return  Array
   *
   * @api     OSjs.API.getProcesses()
   */
  function doGetProcesses() {
    return _PROCS;
  }

  /////////////////////////////////////////////////////////////////////////////
  // PROCESS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Process Template Class
   *
   * Events:
   *  message       All events                               => (msg, object, options)
   *  attention     When application gets attention signal   => (args)
   *  hashchange    When URL hash has changed                => (args)
   *  api           API event                                => (method)
   *  destroy       Destruction event                        => (killed)
   *  destroyWindow Attached window destruction event        => (win)
   *  initedWindow  Attached window event                    => (win)
   *  vfs           For all VFS events                       => (msg, object, options)
   *  vfs:mount     VFS mount event                          => (module, options, msg)
   *  vfs:unmount   VFS unmount event                        => (module, options, msg)
   *  vfs:write     VFS write event                          => (dest, options, msg)
   *  vfs:mkdir     VFS mkdir event                          => (dest, options, msg)
   *  vfs:move      VFS move event                           => ({src,dest}, options, msg)
   *  vfs:delete    VFS delete event                         => (dest, options, msg)
   *  vfs:upload    VFS upload event                         => (file, options, msg)
   *  vfs:update    VFS update event                         => (dir, options, msg)
   *
   * @param   String    name    Process Name
   *
   * @see     OSjs.Helpers.EventHandler
   * @api     OSjs.Core.Process
   * @class
   */
  function Process(name, args, metadata) {
    console.group('Process::constructor()', name);

    this.__pid        = _PROCS.push(this) - 1;
    this.__pname      = name;
    this.__args       = args || {};
    this.__metadata   = metadata || {};
    this.__started    = new Date();
    this.__destroyed  = false;
    this.__evHandler  = new OSjs.Helpers.EventHandler(name, [
      'message', 'attention', 'hashchange', 'api', 'destroy', 'destroyWindow', 'vfs',
      'vfs:mount', 'vfs:unmount', 'vfs:mkdir', 'vfs:write', 'vfs:move',
      'vfs:copy', 'vfs:delete', 'vfs:upload', 'vfs:update'
    ]);

    this.__label    = this.__metadata.name;
    this.__path     = this.__metadata.path;
    this.__scope    = this.__metadata.scope || 'system';
    this.__iter     = this.__metadata.className;

    console.debug('id', this.__pid);
    console.debug('args', this.__args);

    console.groupEnd();
  }

  /**
   * Destroys the process
   *
   * @return  boolean
   *
   * @method  Process::destroy()
   */
  Process.prototype.destroy = function() {
    if ( !this.__destroyed ) {
      this.__destroyed = true;

      console.group('Process::destroy()', this.__pid, this.__pname);

      this._emit('destroy', []);

      if ( this.__evHandler ) {
        this.__evHandler = this.__evHandler.destroy();
      }

      if ( this.__pid >= 0 ) {
        _PROCS[this.__pid] = null;
      }

      console.groupEnd();

      return true;
    }

    return false;
  };

  /**
   * Method for handling internal messaging system
   *
   * @return  void
   *
   * @method  Process::_onMessage()
   */
  Process.prototype._onMessage = function(msg, obj, opts) {
    opts = opts || {};

    if ( this.__evHandler && opts.source !== this.__pid ) {
      console.debug('Process::_onMessage()', msg, obj, opts, this.__pid, this.__pname);

      this.__evHandler.emit('message', [msg, obj, opts]);
      if ( msg.substr(0, 3) === 'vfs' ) {
        this.__evHandler.emit('vfs', [msg, obj, opts]);
      }
      this.__evHandler.emit(msg, [obj, opts, msg]);
    }
  };

  /**
   * Fire a hook to internal event
   *
   * @param   String    k       Event name
   * @param   Array     args    Send these arguments (fn.apply)
   *
   * @return  void
   *
   * @see Process::_on()
   * @see EventHandler::emit()
   * @method  Process::_emit()
   */
  Process.prototype._emit = function(k, args) {
    return this.__evHandler.emit(k, args);
  };

  /**
   * Adds a hook to internal event
   *
   * @param   String    k       Event name
   * @param   Function  func    Callback function
   *
   * @return  integer
   *
   * @see EventHandler::on()
   * @method  Process::_on()
   */
  Process.prototype._on = function(k, func) {
    return this.__evHandler.on(k, func, this);
  };

  /**
   * Adds a hook to internal event
   *
   * @param   String    k       Event name
   * @param   integer   idx     The hook index returned from _on()
   *
   * @return  void
   *
   * @see Process::_on()
   * @see EventHandler::off()
   * @method  Process::_off()
   */
  Process.prototype._off = function(k, idx) {
    return this.__evHandler.off(k, idx);
  };

  /**
   * Call the ApplicationAPI
   *
   * This is used for calling 'api.php' or 'api.js' in your Application.
   *
   * On Lua or Arduino it is called 'server.lua'
   *
   * @param   String      method      Name of method
   * @param   Object      args        Arguments in JSON
   * @param   Function    callback    Callback method => fn(error, result)
   * @param   boolean     showLoading Show loading indication (default=true)
   *
   * @return  boolean
   *
   * @method  Process::_api()
   */
  Process.prototype._api = function(method, args, callback, showLoading) {
    var self = this;

    function cb(err, res) {
      if ( self.__destroyed ) {
        console.warn('Process::_api()', 'INGORED RESPONSE: Process was closed');
        return;
      }
      callback(err, res);
    }

    this._emit('api', [method]);

    return OSjs.API.call('application', {
      application: this.__iter,
      path: this.__path,
      method: method,
      'arguments': args, __loading: showLoading
    }, cb);
  };

  /**
   * Get a launch/session argument
   *
   * @return  Mixed     Argument value or null
   *
   * @method  Process::_getArgument()
   */
  Process.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  };

  /**
   * Get all launch/session argument
   *
   * @return  Array
   *
   * @method  Process::_getArguments()
   */
  Process.prototype._getArguments = function() {
    return this.__args;
  };

  /**
   * Get full path to a resorce belonging to this process (package)
   *
   * This is a shortcut for API.getApplicationResource()
   *
   * @param   String      src       Resource name (path)
   *
   * @return  String
   *
   * @method  Process::_getResource()
   * @see     API::getApplicationResource()
   */
  Process.prototype._getResource = function(src) {
    return API.getApplicationResource(this, src);
  };

  /**
   * Set a launch/session argument
   *
   * @param   String    k             Key
   * @param   String    v             Value
   *
   * @return  void
   *
   * @method  Process::_setArgument()
   */
  Process.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Process          = Object.seal(Process);

  OSjs.API.killAll           = doKillAllProcesses;
  OSjs.API.kill              = doKillProcess;
  OSjs.API.message           = doProcessMessage;
  OSjs.API.getProcess        = doGetProcess;
  OSjs.API.getProcesses      = doGetProcesses;

})(OSjs.Utils, OSjs.API);
