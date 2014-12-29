/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var OSjsStorage = {};
  OSjsStorage.scandir = function(item, callback, options) {
    OSjs.VFS.internalCall('scandir', [item.path], function(error, result) {
      var list = [];
      if ( result ) {
        result = OSjs.VFS.filterScandir(result, options);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };
  OSjsStorage.write = function(item, data, callback) {
    callback('Unavailable');
  };
  OSjsStorage.read = function(item, callback, options) {
    var ropts = [item.path];
    var dataSource = options ? (options.dataSource ? true : false) : false;
    if ( options ) {
      ropts.push(options);
    }

    if ( options && options.arrayBuffer ) {
      this.url(item, function(error, url) {
        if ( error ) {
          return callback(error);
        }

        Utils.AjaxDownload(url, function(response) {
          callback(false, response);
        }, function(error) {
          callback(error);
        });
      });
    } else {
      OSjs.VFS.internalCall('read', ropts, function(error, result) {
        if ( error ) {
          return callback(error);
        }
        if ( dataSource ) {
          return callback(false, result);
        }

        return callback(false, atob(result));
      });
    }
  };
  OSjsStorage.copy = function(src, dest, callback) {
    callback('Unavailable');
  };
  OSjsStorage.move = function(src, dest, callback) {
    callback('Unavailable');
  };
  OSjsStorage.unlink = function(item, callback) {
    callback('Unavailable');
  };
  OSjsStorage.mkdir = function(item, callback) {
    callback('Unavailable');
  };
  OSjsStorage.exists = function(item, callback) {
    callback(false, true);
  };
  OSjsStorage.fileinfo = function(item, callback) {
    callback('Unavailable');
  };
  OSjsStorage.url = function(item, callback) {
    var url = item.path.replace(OSjs.VFS.Modules.OSjs.match, '');
    callback(false, url);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !OSjsStorage[name] ) {
      throw new Error('Invalid OSjsStorage API call name');
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    OSjsStorage[name].apply(OSjsStorage, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.OSjs = OSjs.VFS.Modules.OSjs || {
    readOnly: true,
    description: 'OS.js',
    root: 'osjs:///',
    match: /^osjs\:\/\//,
    icon: 'devices/harddrive.png',
    visible: true,
    internal: true,
    mounted: function() {
      return true;
    },
    enabled: function() {
      return true;
    },
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
