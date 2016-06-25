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
(function(Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Just a helper function to reduce codesize by wrapping the general
   * request flow into one handy-dandy function.
   */
  function requestWrapper(args, errstr, callback, onfinished, options) {
    function _finished(error, response) {
      if ( error ) {
        error = API._(errstr, error);
      }

      if ( onfinished ) {
        response = onfinished(error, response);
      }
      callback(error, response);
    }

    args.push(_finished);
    if ( typeof options !== 'undefined' ) {
      args.push(options);
    }

    try {
      request.apply(null, args);
    } catch ( e ) {
      _finished(e);
    }
  }

  /**
   * Perform VFS request
   */
  function request(test, method, args, callback, options) {
    var d = VFS.getModuleFromPath(test, false);

    if ( !d ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', test));
    }
    if ( typeof method !== 'string' ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'method', 'String', typeof method));
    }
    if ( !(args instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'args', 'Object', typeof args));
    }
    if ( !(callback instanceof Function) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'callback', 'Function', typeof callback));
    }
    if ( options && !(options instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'options', 'Object', typeof options));
    }

    var h = OSjs.Core.getHandler();
    h.onVFSRequest(d, method, args, function vfsRequestCallback(err, response) {
      if ( arguments.length === 2 ) {
        console.warn('VFS::request()', 'Core::onVFSRequest hijacked the VFS request');
        callback(err, response);
        return;
      }

      try {
        VFS.Modules[d].request(method, args, function(err, res) {
          h.onVFSRequestCompleted(d, method, args, err, res, function(e, r) {
            if ( arguments.length === 2 ) {
              console.warn('VFS::request()', 'Core::onVFSRequestCompleted hijacked the VFS request');
              callback(e, r);
              return;
            } else {
              callback(err, res);
            }
          });
        }, options);
      } catch ( e ) {
        var msg = API._('ERR_VFSMODULE_EXCEPTION_FMT', e.toString());
        callback(msg);
        console.warn('VFS::request()', 'exception', e.stack, e);
      }
    });
  }

  /**
   * Will transform the argument to a VFS.File instance
   * or throw an error depending on input
   */
  function checkMetadataArgument(item, err) {
    if ( typeof item === 'string' ) {
      item = new VFS.File(item);
    } else if ( typeof item === 'object' ) {
      if ( item.path ) {
        item = new VFS.File(item);
      }
    }

    if ( !(item instanceof VFS.File) ) {
      throw new TypeError(err || API._('ERR_VFS_EXPECT_FILE'));
    }

    if ( !VFS.getModuleFromPath(item.path, false) ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', item.path));
    }

    return item;
  }

  /**
   * Check if targets have the same transport/module
   */
  function hasSameTransport(src, dest) {
    // Modules using the normal server API
    if ( VFS.isInternalModule(src.path) && VFS.isInternalModule(dest.path) ) {
      return true;
    }

    var msrc = VFS.getModuleFromPath(src.path);
    var isrc = VFS.Modules[msrc] || {};
    var mdst = VFS.getModuleFromPath(dest.path);
    var idst = VFS.Modules[mdst] || {};

    // If mounts are labeled with a name
    if ( isrc.transport === idst.transport ) {
      return true;
    }

    return msrc === mdst;
  }

  /**
   * A wrapper for checking if a file exists
   */
  function existsWrapper(item, callback, options) {
    options = options || {};

    try {
      if ( typeof options.overwrite !== 'undefined' && options.overwrite === true ) {
        callback();
      } else {
        VFS.exists(item, function(error, result) {
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
    } catch ( e ) {
      callback(e);
    }
  }

  /**
   * Check if destination is readOnly
   */
  function isReadOnly(item) {
    var m = VFS.getModuleFromPath(item.path);
    return (VFS.Modules[m] || {}).readOnly === true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Find file(s)
   *
   * @param   OSjs.VFS.File   item      Root path
   * @param   Object          args      Search query
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   *
   * @option  args   String    query     The search query string
   * @option  args   integer   limit     (Optional) Limit results to this amount
   *
   * @return  void
   * @api     OSjs.VFS.find()
   */
  VFS.find = function(item, args, callback, options) {
    console.debug('VFS::find()', item, args, options);
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'find', [item, args]], 'ERR_VFSMODULE_FIND_FMT', callback);
  };

  /**
   * Scandir
   *
   * @param   OSjs.VFS.File   item      File Metadata
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Optional set of options
   *
   * @option  options     String      typeFilter      (Optional) Filter by 'file' or 'dir'
   * @option  options     Array       mimeFilter      (Optional) Array of mime regex matchers
   * @option  options     boolean     showHiddenFiles (Optional) Show hidden files (default=true)
   * @option  options     boolean     backlink        (Optional) Return '..' when applicable (default=true)
   *
   * @return  void
   * @api     OSjs.VFS.scandir()
   */
  VFS.scandir = function(item, callback, options) {
    console.debug('VFS::scandir()', item, options);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'scandir', [item]], 'ERR_VFSMODULE_SCANDIR_FMT', callback);
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
  VFS.write = function(item, data, callback, options, appRef) {
    console.debug('VFS::write()', item, options);
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);

    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      } else {
        API.message('vfs:write', item, {source: appRef ? appRef.__pid : null});
      }

      callback(error, result);
    }

    function _write(filedata) {
      try {
        request(item.path, 'write', [item, filedata], _finished, options);
      } catch ( e ) {
        _finished(e);
      }
    }

    function _converted(error, response) {
      if ( error ) {
        _finished(error, null);
        return;
      }
      _write(response);
    }

    try {
      if ( typeof data === 'string' ) {
        if ( data.length ) {
          VFS.textToAb(data, item.mime, function(error, response) {
            _converted(error, response);
          });
        } else {
          _converted(null, data);
        }
      } else {
        if ( data instanceof VFS.FileDataURL ) {
          VFS.dataSourceToAb(data.toString(), item.mime, function(error, response) {
            _converted(error, response);
          });
          return;
        } else if ( window.Blob && data instanceof window.Blob ) {
          VFS.blobToAb(data, function(error, response) {
            _converted(error, response);
          });
          return;
        }
        _write(data);
      }
    } catch ( e ) {
      _finished(e);
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
  VFS.read = function(item, callback, options) {
    console.debug('VFS::read()', item, options);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

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
          datasource: function readToDataSource() {
            VFS.abToDataSource(response, item.mime, function(error, dataSource) {
              callback(error, error ? null : dataSource);
            });
          },
          text: function readToText() {
            VFS.abToText(response, item.mime, function(error, text) {
              callback(error, error ? null : text);
            });
          },
          blob: function readToBlob() {
            VFS.abToBlob(response, item.mime, function(error, blob) {
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

    try {
      request(item.path, 'read', [item], function(error, response) {
        _finished(error, error ? false : response);
      }, options);
    } catch ( e ) {
      _finished(e);
    }
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
  VFS.copy = function(src, dest, callback, options, appRef) {
    console.debug('VFS::copy()', src, dest, options);
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    if ( isReadOnly(dest) ) {
      callback(API._('ERR_VFSMODULE_READONLY_FMT', VFS.getModuleFromPath(dest.path)));
      return;
    }

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
          API.message('vfs:copy', {source: src, destination: dest}, {source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }

      if ( hasSameTransport(src, dest) ) {
        request(src.path, 'copy', [src, dest], function(error, response) {
          dialogProgress(100);
          if ( error ) {
            error = API._('ERR_VFSMODULE_COPY_FMT', error);
          }
          _finished(error, response);
        }, options);
      } else {
        var msrc = VFS.getModuleFromPath(src.path);
        var mdst = VFS.getModuleFromPath(dest.path);

        // FIXME: This does not work for folders
        if ( src.type === 'dir' ) {
          _finished(API._('ERR_VFSMODULE_COPY_FMT', 'Copying folders between different transports is not yet supported!'));
          return;
        }

        dest.mime = src.mime;

        VFS.Modules[msrc].request('read', [src], function(error, data) {
          dialogProgress(50);

          if ( error ) {
            _finished(API._('ERR_VFS_TRANSFER_FMT', error));
            return;
          }

          VFS.Modules[mdst].request('write', [dest, data], function(error, result) {
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
        callback(API._('ERR_VFSMODULE_COPY_FMT', error));
      } else {
        try {
          doRequest();
        } catch ( e ) {
          callback(API._('ERR_VFSMODULE_COPY_FMT', e));
        }
      }
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
  VFS.move = function(src, dest, callback, options, appRef) {
    var self = this;

    console.debug('VFS::move()', src, dest, options);
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));

    if ( isReadOnly(dest) ) {
      callback(API._('ERR_VFSMODULE_READONLY_FMT', VFS.getModuleFromPath(dest.path)));
      return;
    }

    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          API.message('vfs:move', dest, {source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }

      if ( hasSameTransport(src, dest) ) {
        request(src.path, 'move', [src, dest], function(error, response) {
          if ( error ) {
            error = API._('ERR_VFSMODULE_MOVE_FMT', error);
          }
          _finished(error, error ? null : response);
        }, options);
      } else {
        var msrc = VFS.getModuleFromPath(src.path);
        var mdst = VFS.getModuleFromPath(dest.path);

        dest.mime = src.mime;

        self.copy(src, dest, function(error, result) {
          if ( error ) {
            error = API._('ERR_VFS_TRANSFER_FMT', error);
            return _finished(error);
          }

          VFS.Modules[msrc].request('unlink', [src], function(error, result) {
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
        callback(API._('ERR_VFSMODULE_MOVE_FMT', error));
      } else {
        try {
          doRequest();
        } catch ( e ) {
          callback(API._('ERR_VFSMODULE_MOVE_FMT', e));
        }
      }
    });
  };
  VFS.rename = function(src, dest, callback) {
    VFS.move.apply(this, arguments);
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
  VFS.unlink = function(item, callback, options, appRef) {
    console.debug('VFS::unlink()', item, options);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);

    function _checkPath() {
      var chkdir = new VFS.File(API.getConfig('PackageManager.UserPackages'));
      var idir = Utils.dirname(item.path);

      if ( idir === chkdir.path ) {
        OSjs.Core.getPackageManager().generateUserMetadata(function() {});
      }
    }

    requestWrapper([item.path, 'unlink', [item]], 'ERR_VFSMODULE_UNLINK_FMT', callback, function(error, response) {
      if ( !error ) {
        API.message('vfs:unlink', item, {source: appRef ? appRef.__pid : null});

        _checkPath();
      }
      return response;
    }, options);
  };
  VFS['delete'] = function(item, callback) {
    VFS.unlink.apply(this, arguments);
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
  VFS.mkdir = function(item, callback, options, appRef) {
    console.debug('VFS::mkdir()', item, options);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    existsWrapper(item, function(error) {
      if ( error ) {
        return callback(API._('ERR_VFSMODULE_MKDIR_FMT', error));
      }

      requestWrapper([item.path, 'mkdir', [item]], 'ERR_VFSMODULE_MKDIR_FMT', callback, function(error, response) {
        if ( !error ) {
          API.message('vfs:mkdir', item, {source: appRef ? appRef.__pid : null});
        }
        return response;
      }, options);
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
  VFS.exists = function(item, callback) {
    console.debug('VFS::exists()', item);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'exists', [item]], 'ERR_VFSMODULE_EXISTS_FMT', callback);
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
  VFS.fileinfo = function(item, callback) {
    console.debug('VFS::fileinfo()', item);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'fileinfo', [item]], 'ERR_VFSMODULE_FILEINFO_FMT', callback);
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
  VFS.url = function(item, callback) {
    console.debug('VFS::url()', item);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'url', [item]], 'ERR_VFSMODULE_URL_FMT', callback, function(error, response) {
      return error ? false : Utils.checkdir(response);
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
  VFS.upload = function(args, callback, options, appRef) {
    console.debug('VFS::upload()', args);
    args = args || {};

    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    if ( !args.files ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_FILES'));
    }
    if ( !args.destination ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_DEST'));
    }

    function _createFile(filename, mime, size) {
      var npath = (args.destination + '/' + filename).replace(/\/\/\/\/+/, '///');
      return new VFS.File({
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
      API.message('vfs:upload', file, {source: args.app.__pid});
      callback(false, file);
    }

    if ( !VFS.isInternalModule(args.destination) ) {
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
        VFS.Transports.Internal.upload(f, args.destination, function(err, result, ev) {
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
      var dest = new VFS.File(args.destination + '/' + filename);

      existsWrapper(dest, function(error) {
        if ( error ) {
          return callback(error);
        }

        try {
          doRequest(f, i);
        } catch ( e ) {
          callback(API._('ERR_VFS_UPLOAD_FAIL_FMT', e));
        }
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
  VFS.download = (function download() {
    var _didx = 1;

    return function(args, callback) {
      console.debug('VFS::download()', args);
      args = args || {};

      if ( arguments.length < 2 ) {
        throw new Error(API._('ERR_VFS_NUM_ARGS'));
      }

      if ( !args.path ) {
        throw new Error(API._('ERR_VFS_DOWNLOAD_NO_FILE'));
      }
      args = checkMetadataArgument(args);

      var lname = 'DownloadFile_' + _didx;
      _didx++;

      API.createLoading(lname, {className: 'BusyNotification', tooltip: API._('TOOLTIP_VFS_DOWNLOAD_NOTIFICATION')});

      var dmodule = VFS.getModuleFromPath(args.path);
      if ( !VFS.isInternalModule(args.path) ) {
        var file = args;
        if ( !(file instanceof VFS.File) ) {
          file = new VFS.File(args.path);
          if ( args.id ) {
            file.id = args.id;
          }
        }

        VFS.Modules[dmodule].request('read', [file], function(error, result) {
          API.destroyLoading(lname);

          if ( error ) {
            callback(API._('ERR_VFS_DOWNLOAD_FAILED', error));
            return;
          }

          callback(false, result);
        });
        return;
      }

      VFS.url(args, function(error, url) {
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
  VFS.trash = function(item, callback) {
    console.debug('VFS::trash()', item);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'trash', [item]], 'ERR_VFSMODULE_TRASH_FMT', callback);
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
  VFS.untrash = function(item, callback) {
    console.debug('VFS::untrash()', item);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'untrash', [item]], 'ERR_VFSMODULE_UNTRASH_FMT', callback);
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
  VFS.emptyTrash = function(callback) {
    console.debug('VFS::emptyTrash()');
    if ( arguments.length < 1 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    requestWrapper([null, 'emptyTrash', []], 'ERR_VFSMODULE_EMPTYTRASH_FMT', callback);
  };

  /**
   * Checks for free space in given protocol from file
   *
   * Result is -1 when unavailable
   *
   * @param   OSjs.VFS.File   item      File Metadata (you can also provide a string)
   * @param   Function        callback  Callback function => fn(error, result)
   *
   * @return  void
   * @api     OSjs.VFS.freeSpace()
   */
  VFS.freeSpace = function(item, callback) {
    console.debug('VFS::freeSpace()', item);
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    item = checkMetadataArgument(item);

    var m = VFS.getModuleFromPath(item.path, false);
    m = VFS.Modules[m];

    requestWrapper([item.path, 'freeSpace', [m.root]], 'ERR_VFSMODULE_FREESPACE_FMT', callback);
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
  VFS.remoteRead = function(url, mime, callback, options) {
    options = options || {};
    options.type = options.type || 'binary';
    mime = options.mime || 'application/octet-stream';

    console.debug('VFS::remoteRead()', url, mime);

    if ( arguments.length < 1 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }

    options = options || {};

    API.curl({
      url: url,
      binary: true,
      mime: mime,
      method: 'POST'
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

      VFS.dataSourceToAb(response.body, mime, function(error, response) {
        if ( options.type === 'text' ) {
          VFS.abToText(response, mime, function(error, text) {
            callback(error, text);
          });
          return;
        }
        callback(error, response);
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

})(OSjs.Utils, OSjs.API, OSjs.VFS);
