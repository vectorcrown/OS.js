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

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getModule(item) {
    var module = OSjs.VFS.getModuleFromPath(item.path);
    if ( !module || !OSjs.VFS.Modules[module] ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_FMT', module));
    }
    return OSjs.VFS.Modules[module];
  }

  function getNamespace(item) {
    var module = getModule(item);
    return module.options.ns || 'DAV:';
  }

  function getCORSAllowed(item) {
    var module = getModule(item);
    var val = module.options.cors;
    return typeof val === 'undefined' ? false : val === true;
  }

  function getURL(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    var module = getModule(item);
    var opts = module.options;
    return Utils.parseurl(opts.host, {username: opts.username, password: opts.password}).url;
  }

  function getURI(item) {
    var module = getModule(item);
    return Utils.parseurl(module.options.host).path;
  }

  function resolvePath(item) {
    var module = getModule(item);
    return item.path.replace(module.match, '');
  }

  function davCall(method, args, callback, raw) {
    function parseDocument(body) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(body, 'application/xml');
      return doc.firstChild;
    }

    var url = getURL(args[0]);
    if ( args[0] ) {
      var reqpath = resolvePath(args[0]);
      url += reqpath.replace(/^\//, '');
    }

    var opts = {url: url, method: method};
    if ( arguments.length > 3 ) {
      opts.binary = true;
      opts.mime = args[0].mime || 'application/octet-stream';
    }

    if ( method === 'PUT' && typeof args[1] !== 'undefined' ) {
      opts.query = args[1];
    }

    OSjs.API.call('curl', opts, function(response) {
      if ( response.error ) {
        callback(response.error);
        return;
      }

      if ( !response.result ) {
        callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
        return;
      }

      if ( ([200, 203, 207]).indexOf(response.result.httpCode) < 0 ) {
        callback(API._('ERR_VFSMODULE_XHR_ERROR') + ': ' + response.result.httpCode);
        return;
      }

      if ( opts.binary ) {
        OSjs.VFS.dataSourceToAb(response.result.body, opts.mime, callback);
      } else {
        var doc = parseDocument(response.result.body);
        callback(false, doc);
      }
    }, function(err) {
      callback(err);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var _DAVModule = {};

  _DAVModule.scandir = function(item, callback, options) {
    function parse(doc) {
      var ns = getNamespace(item);
      var list = [];
      var reqpath = resolvePath(item);

      doc.children.forEach(function(c) {
        var type = 'file';

        function getPath() {
          var path = c.getElementsByTagNameNS(ns, 'href')[0].textContent;
          return path.substr(getURI(item).length - 1, path.length);
        }

        function getId() {
          var id = null;
          try {
            id = c.getElementsByTagNameNS(ns, 'getetag')[0].textContent;
          } catch ( e ) {
          }
          return id;
        }

        function getMime() {
          var mime = null;
          if ( type === 'file' ) {
            try {
              mime = c.getElementsByTagNameNS(ns, 'getcontenttype')[0].textContent || 'application/octet-stream';
            } catch ( e ) {
              mime = 'application/octet-stream';
            }
          }
          return mime;
        }

        function getSize() {
          var size = 0;
          if ( type === 'file' ) {
            try {
              size = parseInt(c.getElementsByTagNameNS(ns, 'getcontentlength')[0].textContent, 10) || 0;
            } catch ( e ) {
            }
          }
          return size;
        }

        var path = getPath();
        if ( path.match(/\/$/) ) {
          type = 'dir';
        }

        if ( path !== reqpath ) {
          list.push({
            id: getId(),
            path: item.path.replace(/\/$/, '') + path,
            filename: Utils.filename(path),
            size: getSize(),
            mime: getMime(),
            type: type
          });
        }
      });

      return OSjs.VFS.filterScandir(list, options);
    }

    davCall('PROPFIND', [item], function(error, doc) {
      var list = [];
      if ( !error && doc ) {
        var result = parse(doc);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };

  _DAVModule.write = function(item, data, callback, options) {
    davCall('PUT', [item, data], callback);
  };

  _DAVModule.read = function(item, callback, options) {
    davCall('GET', [item], callback, true);
  };

  _DAVModule.copy = function(src, dest, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.move = function(src, dest, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.unlink = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.mkdir = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.exists = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.fileinfo = function(item, callback, options) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.url = function(item, callback, options) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }

    var fsuri    = getURL(item);
    var reqpath  = resolvePath(item).replace(/^\//, '');
    var fullpath = fsuri + reqpath;

    if ( !getCORSAllowed(item) ) {
      fullpath = API.getConfig('Connection.FSURI') + fullpath;
    }

    callback(false, fullpath);
  };

  _DAVModule.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _DAVModule.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !_DAVModule[name] ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_METHOD_FMT', name));
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    _DAVModule[name].apply(_DAVModule, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is the WebDAV VFS Module wrapper
   *
   * @api OSjs.VFS.Modules._DAVModule
   */
  OSjs.VFS._DAVModule = {
    unmount: function(cb) {
      cb = cb || function() {};
      cb(API._('ERR_VFS_UNAVAILABLE'), false);
    },
    mounted: function() {
      return true;
    },
    enabled: function() {
      return true;
    },
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
