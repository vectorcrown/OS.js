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

  var DefaultModule = 'Public';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

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
    var h = API.getHandlerInstance();

    h.onVFSRequest(d, method, args, function() {
      m[d].request(method, args, callback, options);
    });
  }

  /**
   * Filters a scandir() request
   */
  function filterScandir(list, options) {
    options = options || {};
    var result = [];

    var typeFilter = options.typeFilter || null;
    var mimeFilter = options.mimeFilter || [];
    list.forEach(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }

      if ( typeFilter && iter.type !== typeFilter ) {
        return;
      }

      if ( iter.type === 'file' ) {
        if ( mimeFilter && mimeFilter.length && iter.mime ) {
          var valid = false;
          mimeFilter.forEach(function(miter) {
            if ( iter.mime.match(miter) ) {
              valid = true;
              return false;
            }
            return true;
          });

          if ( !valid ) {
            return;
          }
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
   * Perform default VFS call via backend
   */
  function internalCall(name, args, callback) {
    API.call('fs', {'method': name, 'arguments': args}, function(res) {
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
   */
  function internalUpload(file, dest, callback) {
    var handler = OSjs.API.getHandlerInstance();
    var fsuri   = '/';
    if ( handler ) {
      fsuri = handler.getConfig('Core').FSURI;
    }

    var fd  = new FormData();
    fd.append('upload', 1);
    fd.append('path', dest);
    addFormFile(fd, 'upload', file);

    OSjs.Utils.ajax({
      url: fsuri,
      method: 'POST',
      body: fd,
      onsuccess: function(result) {
        callback('success', result);
      },
      onerror: function(result) {
        callback('error', result);
      },
      onprogress: function(evt) {
        callback('progress', evt);
      },
      oncanceled: function(evt) {
        callback('canceled', evt);
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // CONVERSION HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a helper to add a File to FormData
   */
  function addFormFile(fd, key, data, file) {
    if ( data instanceof window.File ) {
      fd.append(key, data);
    } else {
      if ( file ) {
        if ( data instanceof window.ArrayBuffer ) {
          data = new Blob([data], {type: file.mime});
        }
        fd.append(key, data, file.filename);
      }
    }
  }

  /**
   * Convert DataSourceURL to ArrayBuffer
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
   */
  function textToAb(data, mime, callback) {
    mime = mime || 'application/octet-stream';

    var blob    = new Blob([data], {type: mime});
    var r       = new FileReader();
    r.onerror   = function(e) { callback(e);               };
    r.onloadend = function()  { callback(false, r.result); };
    r.readAsArrayBuffer(blob);
  }

  /**
   * Convert ArrayBuffer to DataSourceURL
   */
  function abToDataSource(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    var blob    = new Blob([arrayBuffer], {type: mime});
    var r       = new FileReader();
    r.onerror   = function(e) { callback(e);               };
    r.onloadend = function()  { callback(false, r.result); };
    r.readAsDataURL(blob);
  }

  /**
   * Convert ArrayBuffer to PlainText
   */
  function abToText(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    var blob    = new Blob([arrayBuffer], {type: mime});
    var r       = new FileReader();
    r.onerror   = function(e) { callback(e);               };
    r.onloadend = function()  { callback(false, r.result); };
    r.readAsText(blob);
  }

  /**
   * Convert ArrayBuffer to BinaryString
   */
  function abToBinaryString(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    var blob    = new Blob([arrayBuffer], {type: mime});
    var r       = new FileReader();
    r.onerror   = function(e) { callback(e);               };
    r.onloadend = function()  { callback(false, r.result); };
    r.readAsBinaryString(blob);
  }

  /////////////////////////////////////////////////////////////////////////////
  // FILE ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a object you can pass around in VFS when
   * handling DataURL()s (strings). Normally you would
   * use a File, Blob or ArrayBuffer, but this is an alternative.
   *
   * Useful for canvas data etc.
   */
  function FileDataURL(dataURL) {
    this.dataURL = dataURL;
  }
  FileDataURL.prototype.toBase64 = function() {
    return this.data.split(',')[1];
  };
  FileDataURL.prototype.toString = function() {
    return this.dataURL;
  };

  /**
   * This is the Metadata object you have to use when passing files around
   * in the VFS API.
   */
  function FileMetadata(arg, mime) {
    if ( !arg ) {
      throw new Error(API._('ERR_VFS_FILE_ARGS'));
    }

    this.path     = null;
    this.filename = null;
    this.type     = null;
    this.size     = null;
    this.mime     = null;
    this.id       = null;

    if ( typeof arg === 'object' ) {
      this.setData(arg);
    } else if ( typeof arg === 'string' ) {
      this.path = arg;
      this.filename = Utils.filename(arg);
    }

    if ( mime ) {
      this.mime = mime;
    }
  }

  FileMetadata.prototype.setData = function(o) {
    var self = this;
    Object.keys(o).forEach(function(k) {
      if ( k !== '_element' ) {
        self[k] = o[k];
      }
    });
  };

  FileMetadata.prototype.getData = function() {
    return {
      path: this.path,
      filename: this.filename,
      type: this.type,
      size: this.size,
      mime: this.mime,
      id: this.id
    };
  };

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns a list of all enabled VFS modules
   */
  OSjs.VFS.getModules = function(visible) {
    visible = (typeof visible === 'undefined') ? true : visible === true;
    var m = OSjs.VFS.Modules;
    var a = [];
    Object.keys(m).forEach(function(name) {
      if ( m[name].enabled() ) {
        if ( visible && m[name].visible === visible ) {
          a.push({
            name: name,
            module: m[name]
          });
        }
      }
    });
    return a;
  };

  /**
   * Scandir
   */
  OSjs.VFS.scandir = function(item, callback, options) {
    console.info('VFS::scandir()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }
    request(item.path, 'scandir', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_SCANDIR_FMT', error);
      }
      callback(error, response);
    }, options);
  };

  /**
   * Write File
   */
  OSjs.VFS.write = function(item, data, callback, options, appRef) {
    console.info('VFS::write()', item, options);
    if ( arguments.length < 3 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }

    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      } else {
        API.message('vfs', {type: 'write', file: item, source: appRef ? appRef.__pid : null});
      }

      callback(error, result);
    }

    function _write(data) {
      request(item.path, 'write', [item, data], _finished, options);
    }

    if ( typeof data === 'string' ) {
      textToAb(data, item.mime, function(error, response) {
        if ( error ) {
          _finished(error, null);
          return;
        }
        _write(response);
      });
    } else {
      _write(data);
    }

  };

  /**
   * Read File
   */
  OSjs.VFS.read = function(item, callback, options) {
    console.info('VFS::read()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }

    function _finished(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_READ_FMT', error);
      }
      callback(error, error ? null : response);
    }

    request(item.path, 'read', [item], function(error, response) {
      if ( error ) {
        _finished(error);
        return;
      }

      if ( options.type === 'text' ) {
        OSjs.VFS.abToText(response, item.mime, function(error, text) {
          _finished(error, text);
        });
        return;
      }

      _finished(false, response);
    }, options);
  };

  /**
   * Copy File
   */
  OSjs.VFS.copy = function(src, dest, callback, options, appRef) {
    console.info('VFS::copy()', src, dest, options);
    if ( arguments.length < 3 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(src instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_SRC_FILE')); }
    if ( !(dest instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_DST_FILE')); }

    options = options || {};
    options.type = options.type || 'binary';
    options.arrayBuffer = true;

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
        if ( msrc === mdst ) {
          request(src.path, 'copy', [src, dest], function(error, response) {
            if ( error ) {
              error = API._('ERR_VFSMODULE_COPY_FMT', error);
            }
            _finished(error, response);
          }, options);
        } else {
          request(null, 'copy', [src, dest], function(error, response) {
            if ( error ) {
              error = API._('ERR_VFSMODULE_COPY_FMT', error);
            }
            _finished(error, response);
          }, options);
        }
      } else {
        OSjs.VFS.Modules[msrc].request('read', [src], function(error, data) {
          if ( error ) {
            _finished(API._('ERR_VFS_TRANSFER_FMT', error));
            return;
          }

          dest.mime = src.mime;
          OSjs.VFS.Modules[mdst].request('write', [dest, data], function(error, result) {
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
   */
  OSjs.VFS.move = function(src, dest, callback, options, appRef) {
    console.info('VFS::move()', src, dest, options);
    if ( arguments.length < 3 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(src instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_SRC_FILE')); }
    if ( !(dest instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_DST_FILE')); }

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
        if ( msrc === mdst ) {
          request(src.path, 'move', [src, dest], function(error, response) {
            if ( error ) {
              error = API._('ERR_VFSMODULE_MOVE_FMT', error);
            }
            _finished(error, error ? null : response);
          }, options);
        } else {
          request(null, 'move', [src, dest], function(error, response) {
            if ( error ) {
              error = API._('ERR_VFSMODULE_MOVE_FMT', error);
            }
            _finished(error, error ? null : response);
          }, options);
        }
      } else {
        self.copy(src, dest, function(error, result) {
          if ( error ) {
            error = API._('ERR_VFS_TRANSFER_FMT', error);
            return _finished(error);
          }

          OSjs.VFS.Module[msrc].request('unlink', [src], function(error, result) {
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
   */
  OSjs.VFS.unlink = function(item, callback, options, appRef) {
    console.info('VFS::unlink()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }
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
   */
  OSjs.VFS.mkdir = function(item, callback, options, appRef) {
    console.info('VFS::mkdir()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }

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
   */
  OSjs.VFS.exists = function(item, callback) {
    console.info('VFS::exists()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }
    request(item.path, 'exists', [item], callback);
  };

  /**
   * Get file info
   */
  OSjs.VFS.fileinfo = function(item, callback) {
    console.info('VFS::fileinfo()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }
    request(item.path, 'fileinfo', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_FILEINFO_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Get file URL
   */
  OSjs.VFS.url = function(item, callback) {
    console.info('VFS::url()', item);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( typeof item === 'string' ) {
      item = new FileMetadata(item);
    }
    request(item.path, 'url', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_URL_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Upload file(s)
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

    function _dialogClose(btn, filename, mime, size) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        callback(false, false);
        return;
      }

      var npath = (args.destination + '/' + filename).replace(/\/\/\/\/+/, '///');
      var file = new OSjs.VFS.File({
        filename: filename,
        path: npath,
        mime: mime,
        size: size
      });

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
        if ( args.win ) {
          args.app._createDialog('FileUpload', [args.destination, f, _dialogClose], args.win);
        } else {
          if ( args.app._addWindow ) {
            args.app._addWindow(new OSjs.Dialogs.FileUpload(args.destination, f, _dialogClose), false);
          } else {
            args.app._createDialog('FileUpload', [args.destination, f, _dialogClose]);
          }
        }
      } else {
        OSjs.VFS.internalUpload(f, args.destination, function(type, arg) {
          if ( type === 'complete' ) {
            callback(false, true, arg);
          } else if ( type === 'failed' ) {
            var msg = API._('ERR_VFS_UPLOAD_FAIL_FMT', 'Unknown reason');
            callback(msg, null, arg);
          } else if ( type === 'canceled' ) {
            callback(API._('ERR_VFS_UPLOAD_CANCELLED'), null, arg);
          }
        });
      }
    }

    args.files.forEach(function(f, i) {
      var filename = (f instanceof window.File) ? f.name : f.filename;
      var dest = new FileMetadata(args.destination + '/' + filename);

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

      OSjs.VFS.url(args, function(error, result) {
        if ( error ) {
          return callback(error);
        }

        Utils.ajax({
          url: url,
          method: 'POST',
          responseType: 'arraybuffer',
          onsuccess: function(result) {
            API.destroyLoading(lname);
            callback(false, response);
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
   */
  OSjs.VFS.trash = function(item, callback) {
    console.info('VFS::trash()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }

    request(item.path, 'trash', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_TRASH_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Restore file from trash (Not used in internal storage)
   */
  OSjs.VFS.untrash = function(item, callback) {
    console.info('VFS::untrash()', item, options);
    if ( arguments.length < 2 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    if ( !(item instanceof FileMetadata) ) { throw new Error(API._('ERR_VFS_EXPECT_FILE')); }

    request(item.path, 'untrash', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_UNTRASH_FMT', error);
      }
      callback(error, response);
    });
  };

  /**
   * Permanently empty trash (Not used in internal storage)
   */
  OSjs.VFS.emptyTrash = function(callback) {
    console.info('VFS::emptyTrash()', item, options);
    if ( arguments.length < 1 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    request(item.path, 'emptyTrash', [], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_EMPTYTRASH_FMT', error);
      }
      callback(error, response);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.internalCall          = internalCall;
  OSjs.VFS.internalUpload        = internalUpload;
  OSjs.VFS.filterScandir         = filterScandir;
  OSjs.VFS.getModuleFromPath     = getModuleFromPath;
  OSjs.VFS.isInternalModule      = isInternalModule;
  OSjs.VFS.getRelativeURL        = getRelativeURL;
  OSjs.VFS.addFormFile           = addFormFile;
  OSjs.VFS.abToBinaryString      = abToBinaryString;
  OSjs.VFS.abToDataSource        = abToDataSource;
  OSjs.VFS.abToText              = abToText;
  OSjs.VFS.textToAb              = textToAb;
  OSjs.VFS.dataSourceToAb        = dataSourceToAb;
  OSjs.VFS.FileDataURL           = FileDataURL;
  OSjs.VFS.File                  = FileMetadata;

})(OSjs.Utils, OSjs.API);
