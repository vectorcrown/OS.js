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
(function(Utils, API) {
  'use strict';

  // https://social.msdn.microsoft.com/forums/onedrive/en-US/5e259b9c-8e9e-40d7-95c7-722ef5bb6d38/upload-file-to-skydrive-using-javascript
  // http://msdn.microsoft.com/en-us/library/hh826531.aspx
  // http://msdn.microsoft.com/en-us/library/dn659726.aspx

  //var WL   = window.WL   = window.WL    || {};
  var OSjs = window.OSjs = window.OSjs  || {};

  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  var _isMounted    = false;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function onedriveCall(args, callback) {
    console.debug('OneDrive::*onedriveCall()', args);

    WL.api(args).then(
      function(response) {
        callback(false, response);
      },
      function(responseFailed) {
        console.error('OneDrive::*onedriveCall()', 'error', responseFailed, args);
        callback(responseFailed.error.message);
      }
    );
  }

  var getItemMime = (function() {
    var EXTs;

    return function(iter) {
      if ( !EXTs ) {
        EXTs = API.getDefaultSettings().EXTMIME || {};
      }
      var mime = null;
      if ( iter.type === 'file' ) {
        mime = 'application/octet-stream';
        var ext = Utils.filext(iter.name);
        if ( ext.length ) {
          ext = '.' + ext;
          if ( EXTs[ext] ) {
            mime = EXTs[ext];
          }
        }
      }
      return mime;
    };
  })();

  // TODO
  // NOTE SEEMS LIKE ONEDRIVE DOES NOT SUPPORT MIME :(
  function createDirectoryList(dir, list, item, options) {
    var result = [];

    list.forEach(function(iter) {
      result.push(new OSjs.VFS.File({
        id: iter.id,
        filename: iter.name,
        path: 'onedrive:///' + dir + '/' + iter.name,
        size: iter.size || 0,
        mime: getItemMime(iter),
        type: (iter.type === 'folder' ? 'dir' : 'file')
      }));
    });

    return result;
  }

  function getFilesInFolder(folderId, callback) {
    onedriveCall({
      path: folderId + '/files',
      method: 'GET'
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }
      console.debug('OneDrive::*getFilesInFolder()', '=>', response);
      callback(false, response.data || []);
    });
  }

  function isFileInFolder(folderId, filename, callback, returnIter) {
    getFilesInFolder(folderId, function(error, list) {
      if ( error ) {
        callback(error);
        return;
      }

      var found;
      list.forEach(function(iter) {
        if ( iter.name === filename ) {
          found = iter;
          return false;
        }
        return true;
      });

      if ( found ) {
        if ( returnIter ) {
          callback(false, found);
          return;
        }
        var foundFile = new OSjs.VFS.File({
          id: found.id,
          filename: found.name,
          path: 'onedrive:///' + dir + '/' + found.name,
          size: found.size || 0,
          mime: getItemMime(found),
          type: (found.type === 'folder' ? 'dir' : 'file')
        });
        callback(false, foundFile);
      } else {
        callback('Could not find requested file'); // FIXME: Translation
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var OneDriveStorage = {};

  OneDriveStorage.scandir = function(item, callback, options) {
    console.info('OneDrive::scandir()', item);

    var drivePath = 'me/skydrive'; // TODO

    onedriveCall({
      path: drivePath,
      method: 'GET'
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }
      console.debug('OneDrive::scandir()', '=>', response);

      getFilesInFolder(response.id, function(error, list) {
        if ( error ) {
          callback(error);
          return;
        }

        var result = createDirectoryList(drivePath, list, item, options);
        callback(false, result);
      });

    });
  };

  OneDriveStorage.read = function(item, callback, options) {

    this.url(item, function(error, url) {
      if ( error ) {
        callback(error);
        return;
      }

      Utils.ajax({
        url: url + '&download=true',
        method: 'GET',
        responseType: 'arraybuffer',
        requestHeaders: {
          'Access-Control-Allow-Origin': window.location.href
        },
        onsuccess: function(response) {
          if ( options.dataSource ) {
            OSjs.VFS.abToDataSource(response, item.mime, function(error, dataSource) {
              callback(error, error ? null : dataSource);
            });
            return;
          }
          callback(false, response);
        },
        onerror: function(error) {
          callback(error);
        }
      });
    });
  };

  // TODO: DataURL support
  OneDriveStorage.write = function(file, data, callback) {
    console.info('OneDrive::write()', file);

    var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
    var url = '//apis.live.net/v5.0/me/skydrive/files?access_token=' + inst.accessToken;

    var fd  = new FormData();
    OSjs.VFS.addFormFile(fd, 'file', data, file);

    OSjs.Utils.ajax({
      url: url,
      method: 'POST',
      json: true,
      body: fd,
      onsuccess: function(result) {
        if ( result && result.id ) {
          callback(false, result.id);
          return;
        }
        callback('Unknown Error'); // FIXME: Translation
      },
      onerror: function(error, result) {
        if ( result && result.error ) {
          error += ' - ' + result.error.message;
        }
        callback(error);
        //callback('XHR Error'); // FIXME: Translation
      }
    });
  };

  OneDriveStorage.copy = function(src, dest, callback) {
    var srcDrivePath = src.path; // TODO
    var dstDrivePath = dest.path; // TODO

    onedriveCall({
      path: srcDrivePath,
      method: 'COPY',
      body: {
        destination: dstDrivePath
      }
    }, function(error, response) {
      callback(error, error ? null : true);
    });
  };

  OneDriveStorage.unlink = function(src, callback) {
    var drivePath = src.id;
    onedriveCall({
      path: drivePath,
      method: 'DELETE'
    }, function(error, response) {
      callback(error, error ? null : true);
    });
  };

  OneDriveStorage.move = function(src, dest, callback) {
    var srcDrivePath = src.path; // TODO
    var dstDrivePath = dest.path; // TODO

    onedriveCall({
      path: srcDrivePath,
      method: 'MOVE',
      body: {
        destination: dstDrivePath
      }
    }, function(error, response) {
      callback(error, error ? null : true);
    });
  };

  // TODO
  // FIXME Is there a better way to do this ?
  OneDriveStorage.exists = function(item, callback) {
    console.info('GoogleDrive::exists()', item); // TODO

    var drivePath = 'me/skydrive'; // TODO
    isFileInFolder(drivePath, item.filename, callback);
  };

  OneDriveStorage.fileinfo = function(item, callback) {
    console.info('OneDrive::fileinfo()', item);

    var drivePath = 'me/skydrive'; // TODO
    isFileInFolder(drivePath, item.filename, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }

      var useKeys = ['created_time', 'id', 'link', 'name', 'type', 'updated_time', 'upload_location', 'description', 'client_updated_time'];
      var info = {};
      useKeys.forEach(function(k) {
        info[k] = response[k];
      });
      return callback(false, info);
    }, true);
  };

  OneDriveStorage.mkdir = function(dir, callback) {
    var drivePath = 'me/skydrive'; // TODO

    onedriveCall({
      path: drivePath,
      method: 'POST',
      body: {
        name: dir.filename
      }
    }, function(error, response) {
      callback(error, error ? null : true);
    });
  };

  OneDriveStorage.upload = function(file, dest, callback) {
    console.info('OneDrive::upload()', file, dest);

    var ndest = dest;
    if ( !ndest.match(/\/$/) ) {
      ndest += '/';
    }

    var item = new OSjs.VFS.File({
      filename: file.name,
      path: ndest + file.name,
      mime: file.type,
      size: file.size
    });

    this.write(item, file, callback);
  };

  OneDriveStorage.trash = function(file, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  OneDriveStorage.untrash = function(file, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  OneDriveStorage.emptyTrash = function(callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  OneDriveStorage.url = function(item, callback) {
    console.info('GoogleDrive::url()', item);
    if ( !item || !item.id ) {
      throw new Error('url() expects a File ref with Id');
    }

    /*
    var drivePath = item.id; // TODO
    var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
    var url = '//apis.live.net/v5.0/' + drivePath + '/content?access_token=' + inst.accessToken;

    callback(false, url);
    */

    onedriveCall({
      path: item.id + '/content',
      method: 'GET'
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }
      callback(false, response.location);
    });


  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function getOneDrive(callback, onerror) {
    callback = callback || function() {};
    onerror  = onerror  || function() {};

    // Check if user has signed out or revoked permissions
    if ( _isMounted ) {
      var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
      if ( inst && !inst.authenticated ) {
        _isMounted = false;
      }
    }

    if ( !_isMounted ) {
      var iargs = {scope: ['wl.signin', 'wl.skydrive', 'wl.skydrive_update']};

      OSjs.Helpers.WindowsLiveAPI.createInstance(iargs, function(error, result) {
        if ( error ) {
          return onerror(error);
        }

        _isMounted = true;
        API.message('vfs', {type: 'mount', module: 'OneDrive', source: null});
        callback(OneDriveStorage);
      });
      return;
    }

    callback(OneDriveStorage);
  }

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};

    getOneDrive(function(instance) {
      if ( !instance ) {
        throw new Error('No OneDrive instance was created. Load error ?');
      } else if ( !instance[name] ) {
        throw new Error('Invalid OneDrive API call name');
      }

      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      instance[name].apply(instance, fargs);
    }, function(error) {
      callback(error);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.OneDrive = OSjs.VFS.Modules.OneDrive || {
    readOnly: false,
    description: 'OneDrive',
    visible: true,
    unmount: function() {
      return false; // TODO
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      var handler = API.getHandlerInstance();
      if ( handler ) {
        try {
          if ( handler.getConfig('Core').VFS.OneDrive.Enabled ) {
            return true;
          }
        } catch ( e ) {
          console.warn('OSjs.VFS.Modules.OneDrive::enabled()', e, e.stack);
        }
      }
      return false;
    },
    root: 'onedrive:///',
    icon: 'places/onedrive.png',
    match: /^onedrive\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
