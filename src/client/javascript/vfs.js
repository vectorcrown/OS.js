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

  /*@
   *
   *  This is a wrapper for handling all VFS functions
   *  read() write() scandir() and so on.
   *
   *  See 'src/client/javascript/vfs/' for the specific modules.
   *
   *  You should read the information below!
   *
   *  ---------------------------------------------------------------------------
   *
   *  Functions that take 'metadata' (File Metadata) as an argument (like all of them)
   *  it expects you to use an instance of OSjs.VFS.File()
   *
   *     VFS.read(new VFS.File('/path/to/file', 'text/plain'), callback);
   *
   *  or anonymous file paths:
   *     VFS.read('/path/to/file', callback)
   *
   *  ---------------------------------------------------------------------------
   *
   *  By default all functions that read data will return ArrayBuffer, but you can also return:
   *     String
   *     dataSource
   *     ArrayBuffer
   *     Blob
   *
   *  ---------------------------------------------------------------------------
   *
   *  Functions that take 'data' (File Data) as an argument supports these types:
   *
   *     File                      Browser internal
   *     Blob                      Browser internal
   *     ArrayBuffer               Browser internal
   *     String                    Just a normal string
   *     OSjs.VFS.FileDataURL      Wrapper for dataSource URL strings
   *     JSON                      JSON Data defined as: {filename: foo, data: bar}
   *
   *  ---------------------------------------------------------------------------
   *
   *  This a list of modules and their paths
   *
   *     User         home:///            OS.js User Storage
   *     OS.js        osjs:///            OS.js Dist (Read-only)
   *     GoogleDrive  google-drive:///    Google Drive Storage
   *     OneDrive     onedrive:///        Microsoft OneDrive (SkyDrive)
   *     Dropbox      dropbox:///         Dropbox Storage
   *
   */

  OSjs.VFS             = OSjs.VFS            || {};
  OSjs.VFS.Modules     = OSjs.VFS.Modules    || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports || {};

  var DefaultModule = 'User';
  var MountsRegistered = false;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Will transform the argument to a OSjs.VFS.File instance
   * or throw an error depending on input
   */
  function checkMetadataArgument(item, err) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    } else if ( typeof item === 'object' ) {
      if ( item.path ) {
        item = new OSjs.VFS.File(item);
      }
    }

    if ( !(item instanceof OSjs.VFS.File) ) {
      throw new TypeError(err || API._('ERR_VFS_EXPECT_FILE'));
    }

    return item;
  }

  /**
   * Check if given path is an internal module
   */
  function isInternalModule(test) {
    test = test || '';

    var m = OSjs.VFS.Modules;
    var d = null;

    if ( test !== null ) {
      Object.keys(m).forEach(function(name) {
        var i = m[name];
        if ( i.internal === true && i.match && test.match(i.match) ) {
          d = true;
          return false;
        }
        return true;
      });
    }

    return d;
  }

  /**
   * Returns a list of all enabled VFS modules
   *
   * @param   Object    opts          Options
   *
   * @option  opts      boolean       visible       All visible modules only (default=true)
   *
   * @return  Array                   List of all Modules found
   * @api     OSjs.VFS.getModules()
   */
  function getModules(opts) {
    opts = Utils.argumentDefaults(opts, {
      visible: true,
      special: false
    });

    var m = OSjs.VFS.Modules;
    var a = [];
    Object.keys(m).forEach(function(name) {
      var iter = m[name];
      if ( !iter.enabled() || (!opts.special && iter.special) ) {
        return;
      }

      if ( opts.visible && iter.visible === opts.visible ) {
        a.push({
          name: name,
          module: iter
        });
      }
    });
    return a;
  }

  /**
   * Get module name from path
   */
  function getModuleFromPath(test) {
    test = test || '';

    var m = OSjs.VFS.Modules;
    var d = null;

    if ( test !== null ) {
      Object.keys(m).forEach(function(name) {
        var i = m[name];
        if ( i.enabled() === true && i.match && test.match(i.match) ) {
          d = name;
          return false;
        }
        return true;
      });
    }

    if ( !d ) {
      return DefaultModule;
    }

    return d;
  }

  /**
   * Perform VFS request
   */
  function request(test, method, args, callback, options) {
    var m = OSjs.VFS.Modules;
    var d = getModuleFromPath(test);
    var h = OSjs.Core.getHandler();

    h.onVFSRequest(d, method, args, function() {
      try {
        m[d].request(method, args, callback, options);
      } catch ( e ) {
        var msg = API._('ERR_VFSMODULE_EXCEPTION_FMT', e.toString());
        callback(msg);
        console.warn('VFS::request()', 'exception', e.stack, e);
      }
    });
  }

  /**
   * Filters a scandir() request
   */
  function filterScandir(list, options) {

    var defaultOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});

    options = Utils.argumentDefaults(options, defaultOptions.scandir || {});
    options = Utils.argumentDefaults(options, {
      typeFilter: null,
      mimeFilter: [],
      showHiddenFiles: true
    }, true);

    var result = [];

    function filterFile(iter) {
      if ( iter.filename !== '..' ) {
        if ( (options.typeFilter && iter.type !== options.typeFilter) || (!options.showHiddenFiles && iter.filename.match(/^\.\w/)) ) {
          return false;
        }
      }
      return true;
    }

    function validMime(iter) {
      if ( options.mimeFilter && options.mimeFilter.length && iter.mime ) {
        var valid = false;
        options.mimeFilter.forEach(function(miter) {
          if ( iter.mime.match(miter) ) {
            valid = true;
            return false;
          }
          return true;
        });
        return valid;
      }
      return true;
    }

    list.forEach(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }

      if ( (iter.filename === '..' && options.backlink === false) || !filterFile(iter) ) {
        return;
      }

      if ( iter.type === 'file' ) {
        if ( !validMime(iter) ) {
          return;
        }
      }

      result.push(iter);
    });

    var tree = {dirs: [], files: []};
    for ( var i = 0; i < result.length; i++ ) {
      if ( result[i].type === 'dir' ) {
        tree.dirs.push(result[i]);
      } else {
        tree.files.push(result[i]);
      }
    }

    return tree.dirs.concat(tree.files);
  }

  /**
   * Returns the URL without protocol
   */
  function getRelativeURL(orig) {
    return orig.replace(/^([A-z0-9\-_]+)\:\/\//, '');
  }

  /**
   * Get root from path (ex: foo:///)
   */
  function getRootFromPath(path) {
    var module = getModuleFromPath(path);
    return OSjs.VFS.Modules[module].root;
  }

  /**
   * Perform default VFS call via backend
   */
  function internalCall(name, args, callback) {
    API.call('FS:' + name, args, function(res) {
      if ( !res || (typeof res.result === 'undefined') || res.error ) {
        callback((res ? res.error : null) || API._('ERR_VFS_FATAL'));
      } else {
        callback(false, res.result);
      }
    }, function(error) {
      callback(error);
    });
  }

  /**
   * A wrapper for checking if a file exists
   */
  function existsWrapper(item, callback, options) {
    options = options || {};

    if ( typeof options.overwrite !== 'undefined' && options.overwrite === true ) {
      callback();
    } else {
      OSjs.VFS.exists(item, function(error, result) {
        if ( error ) {
          console.warn('existsWrapper() error', error);
        }

        if ( result ) {
          callback(API._('ERR_VFS_FILE_EXISTS'));
        } else {
          callback();
        }
      });
    }
  }

  /**
   * Wrapper for internal file uploads
   *
   * @see _Handler.callPOST()
   * @api OSjs.VFS.internalUpload()
   */
  function internalUpload(file, dest, callback, options) {
    options = options || {};

    if ( typeof file.size !== 'undefined' ) {
      var maxSize = API.getConfig('VFS.MaxUploadSize');
      if ( maxSize > 0 ) {
        var bytes = file.size;
        if ( bytes > maxSize ) {
          var msg = API._('DIALOG_UPLOAD_TOO_BIG_FMT', Utils.humanFileSize(maxSize));
          callback('error', msg);
          return;
        }
      }
    }

    var fd  = new FormData();
    fd.append('upload', 1);
    fd.append('path', dest);

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        fd.append(key, String(options[key]));
      });
    }

    addFormFile(fd, 'upload', file);

    OSjs.Core.getHandler().callAPI('FS:upload', fd, callback, options);
  }

  /**
   * Creates a regexp matcher for a VFS module (from string)
   */
  function createMatch(name) {
    return new RegExp('^' + name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
  }

  /////////////////////////////////////////////////////////////////////////////
  // CONVERSION HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a helper to add a File to FormData
   *
   * @param   FormData          fd      FormData instance
   * @param   String            key     FormData entry name
   * @param   [File]            data    File Data (see supported types)
   * @param   OSjs.VFS.File     file    File Metadata
   *
   * @return  void
   *
   * @api     OSjs.VFS.addFormFile()
   */
  function addFormFile(fd, key, data, file) {
    if ( data instanceof window.File ) {
      fd.append(key, data);
    } else {
      if ( file ) {
        if ( data instanceof window.ArrayBuffer ) {
          try {
            data = new Blob([data], {type: file.mime});
          } catch ( e ) {
            data = null;
            console.warn(e, e.stack);
          }
        }
        fd.append(key, data, file.filename);
      } else {
        if ( data.data && data.filename ) { // In case user defines custom
          fd.append(key, data.data, data.filename);
        }
      }
    }
  }

  /**
   * Convert DataSourceURL to ArrayBuffer
   *
   * @param   String        data        The datasource string
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.dataSourceToAb()
   */
  function dataSourceToAb(data, mime, callback) {
    var byteString = atob(data.split(',')[1]);
    var mimeString = data.split(',')[0].split(':')[1].split(';')[0];

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    callback(false, ab);
  }

  /**
   * Convert PlainText to ArrayBuffer
   *
   * @param   String        data        The plaintext string
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.textToAb()
   */
  function textToAb(data, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob    = new Blob([data], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsArrayBuffer(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /**
   * Convert ArrayBuffer to DataSourceURL
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToDataSource()
   */
  function abToDataSource(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsDataURL(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /**
   * Convert ArrayBuffer to PlainText
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToText()
   */
  function abToText(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsText(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /**
   * Convert ArrayBuffer to BinaryString
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToBinaryString()
   */
  function abToBinaryString(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsBinaryString(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /**
   * Convert ArrayBuffer to Blob
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToBlob()
   */
  function abToBlob(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob = new Blob([arrayBuffer], {type: mime});
      callback(false, blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /**
   * Convert Blob to ArrayBuffer
   *
   * @param   Blob          data        The blob
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.blobToAb()
   */
  function blobToAb(data, callback) {
    try {
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsArrayBuffer(data);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Scandir
   *
   * @param   OSjs.VFS.File   item      File Metadata
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   *
   * @return  void
   * @api     OSjs.VFS.scandir()
   */
  OSjs.VFS.scandir = function(item, callback, options) {
    console.info('VFS::scandir()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    item = checkMetadataArgument(item);

    request(item.path, 'scandir', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_SCANDIR_FMT', error);
      }
      callback(error, response);
    }, options);
  };

  /**
   * Write File
   *
   * This function currently have no options.
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   [File]          data      File Data (see supported types)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   * @param   Application     appRef    Optional reference to an Application
   *
   * @return  void
   * @api     OSjs.VFS.write()
   */
  OSjs.VFS.write = function(item, data, callback, options, appRef) {
    console.info('VFS::write()', item, options);
    if ( arguments.length < 3 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    item = checkMetadataArgument(item);

    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      } else {
        API.message('vfs', {type: 'write', file: item, source: appRef ? appRef.__pid : null});
      }

      callback(error, result);
    }

    function _write(filedata) {
      request(item.path, 'write', [item, filedata], _finished, options);
    }

    function _converted(error, response) {
      if ( error ) {
        _finished(error, null);
        return;
      }
      _write(response);
    }

    if ( typeof data === 'string' ) {
      if ( data.length ) {
        textToAb(data, item.mime, function(error, response) {
          _converted(error, response);
        });
      } else {
        _converted(null, data);
      }
    } else {
      if ( data instanceof OSjs.VFS.FileDataURL ) {
        OSjs.VFS.dataSourceToAb(data.toString(), item.mime, function(error, response) {
          _converted(error, response);
        });
        return;
      } else if ( window.Blob && data instanceof window.Blob ) {
        OSjs.VFS.blobToAb(data, function(error, response) {
          _converted(error, response);
        });
        return;
      }
      _write(data);
    }

  };

  /**
   * Read File
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   *
   * @option  options     String      type    What to return, default: binary. Can also be: text, datasource
   *
   * @return  void
   * @api     OSjs.VFS.read()
   */
  OSjs.VFS.read = function(item, callback, options) {
    console.info('VFS::read()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    item = checkMetadataArgument(item);

    options = options || {};

    function _finished(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_READ_FMT', error);
        callback(error);
        return;
      }

      if ( options.type ) {
        var types = {
          datasource: function() {
            OSjs.VFS.abToDataSource(response, item.mime, function(error, dataSource) {
              callback(error, error ? null : dataSource);
            });
          },
          text: function() {
            OSjs.VFS.abToText(response, item.mime, function(error, text) {
              callback(error, error ? null : text);
            });
          },
          blob: function() {
            OSjs.VFS.abToBlob(response, item.mime, function(error, blob) {
              callback(error, error ? null : blob);
            });
          }
        };

        var type = options.type.toLowerCase();
        if ( types[type] ) {
          types[type]();
          return;
        }
      }

      callback(error, error ? null : response);
    }

    request(item.path, 'read', [item], function(error, response) {
      if ( error ) {
        _finished(error);
        return;
      }
      _finished(false, response);
    }, options);
  };

  /**
   * Copy File
   *
   * @param   OSjs.VFS.File   src       Source File Metadata (you can also provide a string)
   * @param   OSjs.VFS.File   dest      Destination File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   * @param   Application     appRef    Optional reference to an Application
   *
   * @option  options boolean overwrite   If set to true it will not check if the destination exists
   *
   * @return  void
   * @api     OSjs.VFS.copy()
   */
  OSjs.VFS.copy = function(src, dest, callback, options, appRef) {
    console.info('VFS::copy()', src, dest, options);
    if ( arguments.length < 3 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));

    options = Utils.argumentDefaults(options, {
      type: 'binary',
      dialog: null
    });

    options.arrayBuffer = true;

    function dialogProgress(prog) {
      if ( options.dialog ) {
        options.dialog.setProgress(prog);
      }
    }

    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          API.message('vfs', {type: 'mkdir', file: dest, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }

      var srcInternal = isInternalModule(src.path);
      var dstInternal = isInternalModule(dest.path);
      var msrc = getModuleFromPath(src.path);
      var mdst = getModuleFromPath(dest.path);

      if ( (srcInternal && dstInternal) ) {
        var tmp = (msrc === mdst) ? src.path : null;
        request(tmp, 'copy', [src, dest], function(error, response) {
          dialogProgress(100);
          if ( error ) {
            error = API._('ERR_VFSMODULE_COPY_FMT', error);
          }
          _finished(error, response);
        }, options);
      } else {
        OSjs.VFS.Modules[msrc].request('read', [src], function(error, data) {
          dialogProgress(50);

          if ( error ) {
            _finished(API._('ERR_VFS_TRANSFER_FMT', error));
            return;
          }

          dest.mime = src.mime;
          OSjs.VFS.Modules[mdst].request('write', [dest, data], function(error, result) {
            dialogProgress(100);

            if ( error ) {
              error = API._('ERR_VFSMODULE_COPY_FMT', error);
            }
            _finished(error, result);
          }, options);
        }, options);
      }
    }

    existsWrapper(dest, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_COPY_FMT', error);
        return callback(error);
      }
      doRequest();
    });
  };

  /**
   * Move File
   *
   * @param   OSjs.VFS.File   src       Source File Metadata (you can also provide a string)
   * @param   OSjs.VFS.File   dest      Destination File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   * @param   Application     appRef    Optional reference to an Application
   *
   * @option  options boolean overwrite   If set to true it will not check if the destination exists
   *
   * @return  void
   * @api     OSjs.VFS.move()
   */
  OSjs.VFS.move = function(src, dest, callback, options, appRef) {
    console.info('VFS::move()', src, dest, options);
    if ( arguments.length < 3 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));

    var self = this;

    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          API.message('vfs', {type: 'move', file: dest, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }

      var srcInternal = isInternalModule(src.path);
      var dstInternal = isInternalModule(dest.path);
      var msrc = getModuleFromPath(src.path);
      var mdst = getModuleFromPath(dest.path);

      if ( (srcInternal && dstInternal) ) {
        var tmp = (msrc === mdst) ? src.path : null;
        request(tmp, 'move', [src, dest], function(error, response) {
          if ( error ) {
            error = API._('ERR_VFSMODULE_MOVE_FMT', error);
          }
          _finished(error, error ? null : response);
        }, options);
      } else {
        self.copy(src, dest, function(error, result) {
          if ( error ) {
            error = API._('ERR_VFS_TRANSFER_FMT', error);
            return _finished(error);
          }

          OSjs.VFS.Modules[msrc].request('unlink', [src], function(error, result) {
            if ( error ) {
              error = API._('ERR_VFS_TRANSFER_FMT', error);
            }
            _finished(error, result);
          }, options);
        });
      }
    }

    existsWrapper(dest, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_MOVE_FMT', error);
        return callback(error);
      }
      doRequest();
    });
  };
  OSjs.VFS.rename = function(src, dest, callback) {
    OSjs.VFS.move.apply(this, arguments);
  };

  /**
   * Delete File
   *
   * This function currently have no options.
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   * @param   Application     appRef    Optional reference to an Application
   *
   * @return  void
   * @api     OSjs.VFS.unlink()
   */
  OSjs.VFS.unlink = function(item, callback, options, appRef) {
    console.info('VFS::unlink()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    item = checkMetadataArgument(item);

    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_UNLINK_FMT', error);
      } else {
        API.message('vfs', {type: 'delete', file: item, source: appRef ? appRef.__pid : null});
      }
      callback(error, result);
    }
    request(item.path, 'unlink', [item], _finished, options);
  };
  OSjs.VFS['delete'] = function(item, callback) {
    OSjs.VFS.unlink.apply(this, arguments);
  };

  /**
   * Create Directory
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   * @param   Application     appRef    Optional reference to an Application
   *
   * @option  options boolean overwrite   If set to true it will not check if the destination exists
   *
   * @return  void
   * @api     OSjs.VFS.mkdir()
   */
  OSjs.VFS.mkdir = function(item, callback, options, appRef) {
    console.info('VFS::mkdir()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    item = checkMetadataArgument(item);

    function doRequest() {
      function _finished(error, result) {
        if ( error ) {
          error = API._('ERR_VFSMODULE_MKDIR_FMT', error);
        } else {
          API.message('vfs', {type: 'mkdir', file: item, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }
      request(item.path, 'mkdir', [item], _finished, options);
    }

    existsWrapper(item, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_MKDIR_FMT', error);
        return callback(error);
      }
      doRequest();
    });
  };

  /**
   * Check if file exists
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.exists()
   */
  OSjs.VFS.exists = function(item, callback) {
    console.info('VFS::exists()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    item = checkMetadataArgument(item);
    request(item.path, 'exists', [item], callback);
  };

  /**
   * Get file info
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.fileinfo()
   */
  OSjs.VFS.fileinfo = function(item, callback) {
    console.info('VFS::fileinfo()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    item = checkMetadataArgument(item);

    request(item.path, 'fileinfo', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_FILEINFO_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Get file URL
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.url()
   */
  OSjs.VFS.url = function(item, callback) {
    console.info('VFS::url()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    item = checkMetadataArgument(item);
    request(item.path, 'url', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_URL_FMT', error);
      }
      callback(error, Utils.checkdir(response));
    });
  };

  /**
   * Upload file(s)
   *
   * @param   Object          args      Function arguments (see below)
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   * @param   Application     appRef    Optional reference to an Application
   *
   * @option  options boolean     overwrite     If set to true it will not check if the destination exists
   *
   * @option  args    Application app           (optional) If specified (Application ref) it will create a Dialog window
   * @option  args    Window      win           (optional) Save as above only will add as child to this window
   * @option  args    String      destination   Full path to destination
   * @option  args    Array       files         Array of 'File'
   *
   * @return  void
   * @api     OSjs.VFS.upload()
   */
  OSjs.VFS.upload = function(args, callback, options, appRef) {
    console.info('VFS::upload()', args);
    args = args || {};
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    /*
    if ( !(args.app instanceof OSjs.Core.Process) ) {
      throw new Error('upload() expects an Application reference');
    }
    */
    if ( !args.files ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_FILES'));
    }
    if ( !args.destination ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_DEST'));
    }

    function _createFile(filename, mime, size) {
      var npath = (args.destination + '/' + filename).replace(/\/\/\/\/+/, '///');
      return new OSjs.VFS.File({
        filename: filename,
        path: npath,
        mime: mime || 'application/octet-stream',
        size: size
      });
    }

    function _dialogClose(btn, filename, mime, size) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        callback(false, false);
        return;
      }

      var file = _createFile(filename, mime, size);
      API.message('vfs', {type: 'upload', file: file, source: args.app.__pid});
      callback(false, file);
    }

    if ( !isInternalModule(args.destination) ) {
      args.files.forEach(function(f, i) {
        request(args.destination, 'upload', [f, args.destination], callback, options);
      });
      return;
    }

    function doRequest(f, i) {
      if ( args.app ) {
        API.createDialog('FileUpload', {
          dest: args.destination,
          file: f
        }, _dialogClose, args.win || args.app);
      } else {
        OSjs.VFS.internalUpload(f, args.destination, function(err, result, ev) {
          if ( err ) {
            if ( err === 'canceled' ) {
              callback(API._('ERR_VFS_UPLOAD_CANCELLED'), null, ev);
            } else {
              var errstr = ev ? ev.toString() : 'Unknown reason';
              var msg = API._('ERR_VFS_UPLOAD_FAIL_FMT', errstr);
              callback(msg, null, ev);
            }
          } else {
            var file = _createFile(f.name, f.type, f.size);
            callback(false, file, ev);
          }
        }, options);
      }
    }

    args.files.forEach(function(f, i) {
      var filename = (f instanceof window.File) ? f.name : f.filename;
      var dest = new OSjs.VFS.File(args.destination + '/' + filename);

      existsWrapper(dest, function(error) {
        if ( error ) {
          return callback(error);
        }
        doRequest(f, i);
      }, options);
    });

  };

  /**
   * Download a file
   *
   * @param   OSjs.VFS.File   args      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.download()
   */
  OSjs.VFS.download = (function() {
    var _didx = 1;

    return function(args, callback) {
      console.info('VFS::download()', args);
      args = args || {};

      if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

      if ( !args.path ) {
        throw new Error(API._('ERR_VFS_DOWNLOAD_NO_FILE'));
      }
      args = checkMetadataArgument(args);

      var lname = 'DownloadFile_' + _didx;
      _didx++;

      API.createLoading(lname, {className: 'BusyNotification', tooltip: API._('TOOLTIP_VFS_DOWNLOAD_NOTIFICATION')});

      var dmodule = getModuleFromPath(args.path);
      if ( !isInternalModule(args.path) ) {
        var file = args;
        if ( !(file instanceof OSjs.VFS.File) ) {
          file = new OSjs.VFS.File(args.path);
          if ( args.id ) {
            file.id = args.id;
          }
        }

        OSjs.VFS.Modules[dmodule].request('read', [file], function(error, result) {
          API.destroyLoading(lname);

          if ( error ) {
            callback(API._('ERR_VFS_DOWNLOAD_FAILED', error));
            return;
          }

          callback(false, result);
        });
        return;
      }

      OSjs.VFS.url(args, function(error, url) {
        if ( error ) {
          return callback(error);
        }

        Utils.ajax({
          url: url,
          method: 'GET',
          responseType: 'arraybuffer',
          onsuccess: function(result) {
            API.destroyLoading(lname);
            callback(false, result);
          },
          onerror: function(result) {
            API.destroyLoading(lname);
            callback(error);
          }
        });

      });
    };
  })();

  /**
   * Move file to trash (Not used in internal storage)
   *
   * THIS IS NOT USED FOR INTERNAL MODULES
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.trash()
   */
  OSjs.VFS.trash = function(item, callback) {
    console.info('VFS::trash()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    item = checkMetadataArgument(item);

    request(item.path, 'trash', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_TRASH_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Restore file from trash
   *
   * THIS IS NOT USED FOR INTERNAL MODULES
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.untrash()
   */
  OSjs.VFS.untrash = function(item, callback) {
    console.info('VFS::untrash()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    item = checkMetadataArgument(item);

    request(item.path, 'untrash', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_UNTRASH_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Permanently empty trash
   *
   * THIS IS NOT USED FOR INTERNAL MODULES
   *
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.emptyTrash()
   */
  OSjs.VFS.emptyTrash = function(callback) {
    console.info('VFS::emptyTrash()');
    if ( arguments.length < 1 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    request(null, 'emptyTrash', [], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_EMPTYTRASH_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Read a remote file with URL (CORS)
   *
   * This function basically does a cURL call and downloads
   * the data.
   *
   * @param   String          url       URL
   * @param   String          mime      MIME Type
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Options
   *
   * @option  options     String      type    What to return, default: binary. Can also be: text, datasource
   *
   * @return  void
   * @api     OSjs.VFS.remoteRead()
   */
  OSjs.VFS.remoteRead = function(url, mime, callback, options) {
    options = options || {};
    options.type = options.type || 'binary';
    mime = options.mime || 'application/octet-stream';

    console.info('VFS::remoteRead()', url, mime);

    if ( arguments.length < 1 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    options = options || {};

    API.curl({
      body: {
        url: url,
        binary: true,
        mime: mime,
        method: 'POST'
      }
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !response.body ) {
        callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
        return;
      }

      if ( options.type.toLowerCase() === 'datasource' ) {
        callback(false, response.body);
        return;
      }

      dataSourceToAb(response.body, mime, function(error, response) {
        if ( options.type === 'text' ) {
          OSjs.VFS.abToText(response, mime, function(error, text) {
            callback(error, text);
          });
          return;
        }
        callback(error, response);
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // MOUNTPOINTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Mounts given mountpoint
   *
   * Currently supports: Custom internal methods, webdav/owncloud
   *
   * If you want to configure default mountpoints, look at the manual linked below.
   *
   * @param Object        opts        Mountpoint options
   * @param Function      cb          Callback function => fn(err, result)
   *
   * @option  opts    String      name            Mountpoint Name (unique)
   * @option  opts    String      description     General description
   * @option  opts    String      icon            Icon
   * @option  opts    String      type            Connection type (internal/webdav)
   * @option  opts    Object      options         Connection options (for external services like webdav)
   *
   * @option  options String      host            (Optional) Host (full URL)
   * @option  options String      username        (Optional) Username
   * @option  options String      password        (Optional) Password
   * @option  options boolean     cors            (Optional) If CORS is enabled (default=false)
   *
   * @return  void
   *
   * @link  http://os.js.org/doc/manuals/man-mountpoints.html
   *
   * @api   OSjs.VFS.createMountpoint()
   */
  function createMountpoint(opts, cb) {
    opts = Utils.argumentDefaults(opts, {
      description: 'My VFS Module',
      type: 'internal',
      name: 'MyModule',
      icon: 'places/server.png'
    });

    if ( OSjs.VFS.Modules[opts.name] ) {
      throw new Error(API._('ERR_VFSMODULE_ALREADY_MOUNTED_FMT', opts.name));
    }

    if ( opts.type === 'owndrive' ) {
      opts.type = 'webdav';
    }

    var modulePath = opts.name.replace(/\s/g, '-').toLowerCase() + '://';
    var moduleRoot = modulePath + '/';
    var moduleMatch = createMatch(modulePath);
    var moduleOptions = opts.options || {};

    var module = (function() {
      var isMounted = true;

      return {
        readOnly: false,
        description: opts.description,
        visible: true,
        dynamic: true,
        unmount: function(cb) {
          isMounted = false;

          API.message('vfs', {type: 'unmount', module: opts.name, source: null});
          (cb || function() {})(false, true);

          delete OSjs.VFS.Modules[opts.name];
        },
        mounted: function() {
          return isMounted;
        },
        enabled: function() {
          return true;
        },
        root: moduleRoot,
        icon: opts.icon,
        match: moduleMatch,
        options: moduleOptions,
        request: function(name, args, callback, options) {
          if ( opts.type === 'internal' ) {
            OSjs.VFS.Transports.Internal.request.apply(null, arguments);
          } else if ( opts.type === 'webdav' ) {
            OSjs.VFS.Transports.WebDAV.request.apply(null, arguments);
          } else {
            callback(API._('ERR_VFSMODULE_INVALID_TYPE_FMT', opts.type));
          }
        }
      };
    })();

    var validModule = (function() {
      if ( (['internal', 'webdav']).indexOf(opts.type) < 0 ) {
        return 'No such type \'' + opts.type + '\'';
      }
      if ( opts.type === 'webdav' && !moduleOptions.username ) {
        return 'Connection requires username (authorization)';
      }
      return true;
    })();

    if ( validModule !== true ) {
      throw new Error('ERR_VFSMODULE_INVALID_CONFIG_FMT', validModule);
    }

    OSjs.VFS.Modules[opts.name] = module;
    API.message('vfs', {type: 'mount', module: opts.name, source: null});

    (cb || function() {})(false, true);
  }

  /**
   * Unmounts given mountpoint
   *
   * Only mountpoints mounted via `createMountpoint` is supported
   *
   * @param   String      moduleName        Name of registered module
   * @param   Function    cb                Callback function => fn(err, result)
   *
   * @return  void
   *
   * @api OSjs.VFS.removeMountpoints()
   */
  function removeMountpoint(moduleName, cb) {
    if ( !OSjs.VFS.Modules[moduleName] || !OSjs.VFS.Modules[moduleName].dynamic ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_MOUNTED_FMT', moduleName));
    }
    OSjs.VFS.Modules[moduleName].unmount(cb);
  }

  /**
   * Registeres all configured mount points
   *
   * @return  void
   *
   * @api     OSjs.VFS.registerMountpoints()
   */
  function registerMountpoints() {
    if ( MountsRegistered ) { return; }
    MountsRegistered = true;

    var config = null;

    try {
      config = API.getConfig('VFS.Mountpoints');
    } catch ( e ) {
      console.warn('mountpoints.js initialization error', e, e.stack);
    }

    console.debug('Registering mountpoints...', config);

    if ( config ) {
      var points = Object.keys(config);
      points.forEach(function(key) {
        var iter = config[key];
        console.info('VFS', 'Registering mountpoint', key, iter);

        OSjs.VFS.Modules[key] = {
          readOnly: (typeof iter.readOnly === 'undefined') ? false : (iter.readOnly === true),
          description: iter.description || key,
          icon: iter.icon || 'devices/harddrive.png',
          root: key + ':///',
          visible: true,
          internal: true,
          match: createMatch(key + '://'),
          unmount: function(cb) {
            cb = cb || function() {};
            cb(API._('ERR_VFS_UNAVAILABLE'), false);
          },
          mounted: function() {
            return true;
          },
          enabled: function() {
            return (typeof iter.enabled === 'undefined') || iter.enabled === true;
          },
          request: function() {
            // This module uses the same API as public
            OSjs.VFS.Transports.Internal.request.apply(null, arguments);
          }
        };
      });
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.internalCall          = internalCall;
  OSjs.VFS.internalUpload        = internalUpload;
  OSjs.VFS.filterScandir         = filterScandir;
  OSjs.VFS.getModules            = getModules;
  OSjs.VFS.getModuleFromPath     = getModuleFromPath;
  OSjs.VFS.isInternalModule      = isInternalModule;
  OSjs.VFS.getRelativeURL        = getRelativeURL;
  OSjs.VFS.getRootFromPath       = getRootFromPath;
  OSjs.VFS.addFormFile           = addFormFile;

  OSjs.VFS.abToBinaryString      = abToBinaryString;
  OSjs.VFS.abToDataSource        = abToDataSource;
  OSjs.VFS.abToText              = abToText;
  OSjs.VFS.textToAb              = textToAb;
  OSjs.VFS.abToBlob              = abToBlob;
  OSjs.VFS.blobToAb              = blobToAb;
  OSjs.VFS.dataSourceToAb        = dataSourceToAb;

  OSjs.VFS.createMountpoint      = createMountpoint;
  OSjs.VFS.removeMountpoint      = removeMountpoint;
  OSjs.VFS.registerMountpoints   = registerMountpoints;

})(OSjs.Utils, OSjs.API);
