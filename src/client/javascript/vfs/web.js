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

  /*
   * THIS IS AN EXPERIMENTAL WEB TRANSPORT MODULE FOR OS.js VFS
   *
   * IT IS READ-ONLY!
   *
   * To make this work you *will need* CORS support!
   *
   * scandir() works by loading a file named `_scandir.json` in the
   * requested folder.
   *
   * Example _scandir.json file in doc/vfs/web/_scandir.json
   */

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function httpCall(func, item, callback) {
    var url = makePath(item);

    if ( func === 'scandir' ) {
      url += '/_scandir.json';
    }

    var args = {
      method: func === 'exists' ? 'HEAD' : 'GET',
      url: url,
      onerror: function(error) {
        callback(error);
      },
      onsuccess: function(response) {
        callback(false, response);
      }
    };

    if ( func === 'read' ) {
      args.responseType = 'arraybuffer';
    }

    Utils.ajax(args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Web/HTTP VFS Transport Module
   *
   * @api OSjs.VFS.Transports.Web
   */
  var Transport = {
    scandir: function(item, callback, options) {
      var root = OSjs.VFS.getRootFromPath(item.path);

      httpCall('scandir', item, function(error, response) {
        var list = null;
        if ( !error ) {
          var json = null;
          try {
            json = JSON.parse(response);
          } catch ( e ) {}

          if ( json === null ) {
            error = 'Failed to parse directory JSON';
          } else {
            list = json.map(function(iter) {
              iter.path = root + iter.path.replace(/^\//, '');
              return iter;
            });

            var rel = OSjs.VFS.getRelativeURL(item.path);
            if ( rel !== '/' ) {
              list.unshift({
                filename: '..',
                path: Utils.dirname(item.path),
                type: 'dir',
                size: 0
              });
            }
          }
        }
        callback(error, list);
      });
    },

    read: function(item, callback, options) {
      options = options || {};

      var mime = item.mime || 'application/octet-stream';

      httpCall('read', item, function(error, response) {
        if ( !error ) {
          if ( options.type === 'text' ) {
            OSjs.VFS.abToText(response, mime, function(error, text) {
              callback(error, text);
            });
            return;
          }
        }
        callback(error, response);
      });
    },

    exists: function(item, callback) {
      httpCall('exists', item, function(err) {
        callback(err, err ? false : true);
      });
    },

    url: function(item, callback, options) {
      callback(false, makePath(item));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Make a Web HTTP URL for VFS
   *
   * @param   Mixed       item        (Optional) Path of VFS.File object
   *
   * @retun   String                  URL based on input
   *
   * @api OSjs.VFS.Transports.Web.path()
   */
  function makePath(file) {
    var root = OSjs.VFS.getRootFromPath(file.path);
    var rel = OSjs.VFS.getRelativeURL(file.path);
    var moduleName = OSjs.VFS.getModuleFromPath(file.path);
    var module = OSjs.VFS.Modules[moduleName];
    var base = (module.options || {}).url;
    return base + rel.replace(/^\/+/, '/');
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Transports.Web = {
    defaults: function(iter) {
      iter.readOnly = true;
    },
    module: Transport,
    path: makePath
  };

})(OSjs.Utils, OSjs.API);
