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
        console.debug('OneDrive::*onedriveCall()', 'error', responseFailed);
        callback(responseFailed.error.message);
      }
    );
  }

  // TODO
  function createDirectoryList(dir, list, item, options) {
    return [];
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

      var result = createDirectoryList(drivePath, response, item, options);
      callback(false, result);
    });
  };

  OneDriveStorage.read = function(item, callback, options) {
    var drivePath = item.path; // TODO

    WL.createBackgroundDownload({
      path: drivePath
    }).then(
      function (response) {
        callback(false, response);
      },
      function (responseFailed) {
        callback(responseFailed.error.message);
      }
    );
  };

  OneDriveStorage.write = function(file, data, callback) {
    var drivePath = item.path; // TODO

    WL.createBackgroundUpload({
      path: drivePath,
      file_name: file.filename,
      file_input: data,
      overwrite: 'rename'
    }).then(
      function (response) {
        callback(false, true);
      },
      function (responseFailed) {
        callback(responseFailed.error.message);
      }
    );
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
    var drivePath = item.path; // TODO

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

  // FIXME Is there a better way to do this ?
  OneDriveStorage.exists = function(item, callback) {
    console.info('GoogleDrive::exists()', item); // TODO

    var req = new OSjs.VFS.File(OSjs.Utils.dirname(item.path));

    this.scandir(req, function(error, result) {
      if ( error ) {
        callback(error);
        return;
      }
      var found = false;

      if ( result ) {
        result.forEach(function(iter) {
          if ( iter.path === item.path ) {
            found = new OSjs.VFS.File(iter);
            return false;
          }
          return true;
        });
      }

      callback(false, found);
    });
  };

  // TODO
  OneDriveStorage.fileinfo = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
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
